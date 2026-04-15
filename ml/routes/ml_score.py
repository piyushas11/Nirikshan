"""
ML scoring endpoint — loads trained Isolation Forest models and scores
incoming anomaly feature vectors.

GET  /ml/health        → check models are loaded
POST /ml/score         → score a single anomaly, returns confidence_pct
POST /ml/score-batch   → score all anomalies at once
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
import pickle
import numpy as np
import os
import json

router = APIRouter(prefix="/ml")

# ─── Model registry ─────────────────────────────────────────────────────────
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "models")
_global_bundle = None
_type_bundles: dict = {}
_meta: dict = {}

TYPE_NAME_MAP = {
    "GHOST_PICKUP":       "ghost_pickup",
    "COMPLAINT_SURGE":    "complaint_surge",
    "BATCH_STAGNATION":   "batch_stagnation",
    "DISPOSAL_MISMATCH":  "disposal_mismatch",
    "CREDIBILITY_CLIFF":  "credibility_cliff",
    "ROUTE_DEVIATION":    "route_deviation",
    "CITIZEN_REJECTION":  "citizen_rejection",
    "WORKER_ABSENCE":     "worker_absence",
}


def _load_models():
    global _global_bundle, _type_bundles, _meta

    global_path = os.path.join(MODELS_DIR, "global_if.pkl")
    meta_path   = os.path.join(MODELS_DIR, "models_meta.json")

    if not os.path.exists(global_path):
        return False  # models not yet trained

    with open(global_path, "rb") as f:
        _global_bundle = pickle.load(f)

    if os.path.exists(meta_path):
        with open(meta_path) as f:
            _meta = json.load(f)
        for name, info in _meta.items():
            p = os.path.join(MODELS_DIR, f"if_{name}.pkl")
            if os.path.exists(p):
                with open(p, "rb") as f:
                    _type_bundles[name] = pickle.load(f)
    return True


_models_loaded = _load_models()


def _score_features(features: dict, type_str: str) -> dict:
    """
    Score a feature dict and return ML confidence.
    features keys: gps_deviation_m, transit_hours, complaint_surge_pct,
                   rejection_rate, route_adherence, hours_absent, credibility_score
    """
    if not _global_bundle:
        # Models not trained yet — return deterministic score based on features
        return _fallback_score(features, type_str)

    g_feats = _global_bundle["features"]
    X_g = np.array([[features.get(f, 0) for f in g_feats]])
    X_g_scaled = _global_bundle["scaler"].transform(X_g)
    global_score = float(_global_bundle["model"].decision_function(X_g_scaled)[0])

    type_name = TYPE_NAME_MAP.get(type_str, "")
    type_score = None
    if type_name in _type_bundles:
        t = _type_bundles[type_name]
        t_feats = t["features"]
        X_t = np.array([[features.get(f, 0) for f in t_feats]])
        X_t_scaled = t["scaler"].transform(X_t)
        type_score = float(t["model"].decision_function(X_t_scaled)[0])

    raw = type_score if type_score is not None else global_score
    # decision_function: negative = anomalous, ~0.1 = clean
    # Map to 0-100 confidence (higher = more anomalous)
    confidence_pct = round(min(100.0, max(0.0, (-raw + 0.15) * 120)), 1)

    is_anomaly = confidence_pct > 60

    # Determine severity from confidence
    if confidence_pct >= 90:
        severity = "HIGH"
    elif confidence_pct >= 70:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    return {
        "confidence_pct": confidence_pct,
        "global_score":   round(global_score, 4),
        "type_score":     round(type_score, 4) if type_score is not None else None,
        "is_anomaly":     is_anomaly,
        "severity":       severity,
        "model_used":     type_name or "global",
    }


def _fallback_score(features: dict, type_str: str) -> dict:
    """
    Rule-based scoring when models are not yet trained.
    Mirrors the heuristics from INITIAL_ANOMALIES.
    """
    score = 50.0
    gps   = features.get("gps_deviation_m", 0)
    trans = features.get("transit_hours", 0)
    surge = features.get("complaint_surge_pct", 0)
    rej   = features.get("rejection_rate", 0)
    route = features.get("route_adherence", 1)
    abs_h = features.get("hours_absent", 0)
    cred  = features.get("credibility_score", 75)

    if gps > 500:   score += min(40, (gps - 500) / 25)
    if trans > 5:   score += min(35, (trans - 5) * 4)
    if surge > 50:  score += min(30, (surge - 50) / 2)
    if rej > 0.3:   score += min(35, (rej - 0.3) * 120)
    if route < 0.6: score += min(30, (0.6 - route) * 80)
    if abs_h > 1:   score = 100.0
    if cred < 45:   score += min(40, (45 - cred) * 1.2)

    confidence_pct = round(min(100.0, score), 1)
    severity = "HIGH" if confidence_pct >= 85 else "MEDIUM" if confidence_pct >= 65 else "LOW"
    return {
        "confidence_pct": confidence_pct,
        "global_score":   None,
        "type_score":     None,
        "is_anomaly":     confidence_pct > 60,
        "severity":       severity,
        "model_used":     "rule_fallback",
    }


# ─── Routes ─────────────────────────────────────────────────────────────────

@router.get("/health")
def ml_health():
    return {
        "models_loaded":  _models_loaded,
        "global_model":   _global_bundle is not None,
        "type_models":    list(_type_bundles.keys()),
        "models_dir":     MODELS_DIR,
        "fallback_mode":  not _models_loaded,
    }


@router.post("/score")
def score_anomaly(payload: dict):
    """
    Score a single anomaly.
    Body: { type: "GHOST_PICKUP", features: { gps_deviation_m: 1247, ... } }
    """
    anomaly_type = payload.get("type", "")
    features     = payload.get("features", {})
    if not features:
        raise HTTPException(400, "features dict is required")
    result = _score_features(features, anomaly_type)
    return result


@router.post("/score-batch")
def score_batch(payload: dict):
    """
    Score a batch of anomalies.
    Body: { anomalies: [{ id, type, features: {...} }, ...] }
    Returns: { scores: { id: { confidence_pct, severity, ... } } }
    """
    anomalies = payload.get("anomalies", [])
    scores = {}
    for a in anomalies:
        aid      = a.get("id", "?")
        atype    = a.get("type", "")
        features = a.get("features", {})
        scores[aid] = _score_features(features, atype)
    return {"scores": scores}