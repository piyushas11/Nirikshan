"""
Train Isolation Forest models for anomaly detection.
Generates synthetic training data from the INITIAL_ANOMALIES patterns,
then trains per-type models and a global model.
Run: python train_isolation_forest.py
Outputs: models/*.pkl
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pickle
import os
import json

os.makedirs("models", exist_ok=True)

# ─── Seed data from INITIAL_ANOMALIES patterns ────────────────────────────────
# Each anomaly type has specific numeric features we care about.
# We synthesise a realistic training dataset around those features.

np.random.seed(42)
N = 2000  # synthetic training samples

def synthetic_dataset():
    """
    Columns shared across all anomaly types:
      gps_deviation_m       – metres between claimed vs actual GPS
      transit_hours         – hours batch has been in-transit
      complaint_surge_pct   – % above 7-day average
      rejection_rate        – fraction of clearance photos rejected
      route_adherence       – fraction of stops in correct sequence
      hours_absent          – hours worker missed shift start (0 if present)
      credibility_score     – contractor 0-100 score
      confidence            – ML detection confidence
      type_encoded          – integer label for anomaly type
    """
    rows = []

    # ── NORMAL operations (85% of data)
    n_normal = int(N * 0.85)
    rows += [{
        "gps_deviation_m":    np.random.normal(120, 60),         # within range
        "transit_hours":      np.random.normal(2.0, 0.8),        # normal transit
        "complaint_surge_pct":np.random.normal(10, 15),          # small fluctuation
        "rejection_rate":     np.random.normal(0.08, 0.05),      # low rejection
        "route_adherence":    np.random.normal(0.95, 0.04),      # high adherence
        "hours_absent":       0.0,
        "credibility_score":  np.random.normal(75, 12),
        "confidence":         np.random.normal(55, 20),
        "type_encoded":       0,  # normal
    } for _ in range(n_normal)]

    # ── GHOST PICKUP anomalies  (GPS deviation > 500m)
    rows += [{
        "gps_deviation_m":    np.random.normal(900, 300),
        "transit_hours":      np.random.normal(2.5, 0.5),
        "complaint_surge_pct":np.random.normal(5, 10),
        "rejection_rate":     np.random.normal(0.12, 0.06),
        "route_adherence":    np.random.normal(0.85, 0.1),
        "hours_absent":       0.0,
        "credibility_score":  np.random.normal(60, 15),
        "confidence":         np.random.uniform(85, 99),
        "type_encoded":       1,
    } for _ in range(60)]

    # ── COMPLAINT SURGE (surge_pct > 50%)
    rows += [{
        "gps_deviation_m":    np.random.normal(100, 50),
        "transit_hours":      np.random.normal(2.0, 0.5),
        "complaint_surge_pct":np.random.normal(70, 20),
        "rejection_rate":     np.random.normal(0.20, 0.08),
        "route_adherence":    np.random.normal(0.80, 0.12),
        "hours_absent":       0.0,
        "credibility_score":  np.random.normal(55, 15),
        "confidence":         np.random.uniform(80, 95),
        "type_encoded":       2,
    } for _ in range(60)]

    # ── BATCH STAGNATION (transit_hours > 6)
    rows += [{
        "gps_deviation_m":    np.random.normal(50, 30),
        "transit_hours":      np.random.normal(9, 2.5),
        "complaint_surge_pct":np.random.normal(15, 10),
        "rejection_rate":     np.random.normal(0.10, 0.05),
        "route_adherence":    np.random.normal(0.90, 0.07),
        "hours_absent":       0.0,
        "credibility_score":  np.random.normal(65, 12),
        "confidence":         np.random.uniform(85, 98),
        "type_encoded":       3,
    } for _ in range(60)]

    # ── DISPOSAL MISMATCH (high confidence mismatch flag)
    rows += [{
        "gps_deviation_m":    np.random.normal(80, 40),
        "transit_hours":      np.random.normal(3.0, 1.0),
        "complaint_surge_pct":np.random.normal(8, 10),
        "rejection_rate":     np.random.normal(0.15, 0.07),
        "route_adherence":    np.random.normal(0.88, 0.08),
        "hours_absent":       0.0,
        "credibility_score":  np.random.normal(58, 15),
        "confidence":         np.random.uniform(90, 100),
        "type_encoded":       4,
    } for _ in range(40)]

    # ── CREDIBILITY CLIFF (credibility_score < 45)
    rows += [{
        "gps_deviation_m":    np.random.normal(200, 80),
        "transit_hours":      np.random.normal(4.5, 1.5),
        "complaint_surge_pct":np.random.normal(45, 20),
        "rejection_rate":     np.random.normal(0.38, 0.08),
        "route_adherence":    np.random.normal(0.65, 0.12),
        "hours_absent":       0.0,
        "credibility_score":  np.random.normal(35, 8),
        "confidence":         100.0,
        "type_encoded":       5,
    } for _ in range(40)]

    # ── ROUTE DEVIATION (route_adherence < 0.5)
    rows += [{
        "gps_deviation_m":    np.random.normal(150, 70),
        "transit_hours":      np.random.normal(3.0, 1.0),
        "complaint_surge_pct":np.random.normal(10, 10),
        "rejection_rate":     np.random.normal(0.12, 0.05),
        "route_adherence":    np.random.normal(0.35, 0.10),
        "hours_absent":       0.0,
        "credibility_score":  np.random.normal(62, 12),
        "confidence":         np.random.uniform(75, 92),
        "type_encoded":       6,
    } for _ in range(50)]

    # ── CITIZEN REJECTION (rejection_rate > 0.30)
    rows += [{
        "gps_deviation_m":    np.random.normal(100, 50),
        "transit_hours":      np.random.normal(2.0, 0.5),
        "complaint_surge_pct":np.random.normal(20, 10),
        "rejection_rate":     np.random.normal(0.42, 0.08),
        "route_adherence":    np.random.normal(0.78, 0.10),
        "hours_absent":       0.0,
        "credibility_score":  np.random.normal(55, 12),
        "confidence":         np.random.uniform(80, 92),
        "type_encoded":       7,
    } for _ in range(50)]

    # ── WORKER ABSENCE (hours_absent > 1)
    rows += [{
        "gps_deviation_m":    0.0,
        "transit_hours":      0.0,
        "complaint_surge_pct":np.random.normal(5, 5),
        "rejection_rate":     0.0,
        "route_adherence":    0.0,
        "hours_absent":       np.random.normal(4.5, 2.0),
        "credibility_score":  np.random.normal(65, 10),
        "confidence":         100.0,
        "type_encoded":       8,
    } for _ in range(40)]

    df = pd.DataFrame(rows)
    # clip nonsensical values
    df["gps_deviation_m"]     = df["gps_deviation_m"].clip(0)
    df["transit_hours"]       = df["transit_hours"].clip(0)
    df["rejection_rate"]      = df["rejection_rate"].clip(0, 1)
    df["route_adherence"]     = df["route_adherence"].clip(0, 1)
    df["hours_absent"]        = df["hours_absent"].clip(0)
    df["credibility_score"]   = df["credibility_score"].clip(0, 100)
    df["confidence"]          = df["confidence"].clip(0, 100)
    return df

FEATURES = [
    "gps_deviation_m",
    "transit_hours",
    "complaint_surge_pct",
    "rejection_rate",
    "route_adherence",
    "hours_absent",
    "credibility_score",
]

def train_global_model(df):
    """Train one global Isolation Forest on all features."""
    X = df[FEATURES].values
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    model = IsolationForest(
        n_estimators=200,
        contamination=0.15,   # ~15% anomalies in real data
        max_features=0.8,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_scaled)
    with open("models/global_if.pkl", "wb") as f:
        pickle.dump({"model": model, "scaler": scaler, "features": FEATURES}, f)
    print("✅ Global model saved → models/global_if.pkl")
    return model, scaler

def train_type_models(df):
    """Train a dedicated Isolation Forest per anomaly type."""
    type_map = {
        1: "ghost_pickup",
        2: "complaint_surge",
        3: "batch_stagnation",
        4: "disposal_mismatch",
        5: "credibility_cliff",
        6: "route_deviation",
        7: "citizen_rejection",
        8: "worker_absence",
    }
    # type-specific feature subsets
    type_features = {
        1: ["gps_deviation_m", "transit_hours"],
        2: ["complaint_surge_pct", "credibility_score"],
        3: ["transit_hours", "credibility_score"],
        4: ["rejection_rate", "credibility_score"],
        5: ["credibility_score", "rejection_rate", "complaint_surge_pct"],
        6: ["route_adherence", "gps_deviation_m"],
        7: ["rejection_rate", "credibility_score"],
        8: ["hours_absent"],
    }
    models_meta = {}
    for code, name in type_map.items():
        feats = type_features[code]
        # combine normal + this type
        subset = df[(df["type_encoded"] == 0) | (df["type_encoded"] == code)]
        X = subset[feats].values
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        model = IsolationForest(
            n_estimators=150,
            contamination=0.12,
            random_state=42,
            n_jobs=-1,
        )
        model.fit(X_scaled)
        path = f"models/if_{name}.pkl"
        with open(path, "wb") as f:
            pickle.dump({"model": model, "scaler": scaler, "features": feats}, f)
        print(f"✅ Type model saved → {path}")
        models_meta[name] = {"features": feats, "path": path}

    with open("models/models_meta.json", "w") as f:
        json.dump(models_meta, f, indent=2)
    print("✅ Meta saved → models/models_meta.json")

def score_sample(payload: dict) -> dict:
    """
    Score a single anomaly dict using the appropriate type model + global model.
    payload keys must match FEATURES.
    Returns: { global_score, type_score, is_anomaly, confidence_pct }
    """
    type_name = payload.get("type_name", "")
    path = f"models/if_{type_name}.pkl" if type_name else None

    global_bundle = pickle.load(open("models/global_if.pkl", "rb"))
    g_model, g_scaler = global_bundle["model"], global_bundle["scaler"]
    g_feats = global_bundle["features"]
    X_g = np.array([[payload.get(f, 0) for f in g_feats]])
    X_g_scaled = g_scaler.transform(X_g)
    global_score = float(g_model.decision_function(X_g_scaled)[0])  # negative = anomalous
    global_pred  = int(g_model.predict(X_g_scaled)[0])              # -1 = anomaly

    type_score = None
    if path and os.path.exists(path):
        t_bundle = pickle.load(open(path, "rb"))
        t_feats  = t_bundle["features"]
        X_t = np.array([[payload.get(f, 0) for f in t_feats]])
        X_t_scaled = t_bundle["scaler"].transform(X_t)
        type_score = float(t_bundle["model"].decision_function(X_t_scaled)[0])

    # Convert raw decision_function scores to 0-100 confidence
    # decision_function is negative for anomalies; more negative = more anomalous
    raw = type_score if type_score is not None else global_score
    # Map: 0.5 (clean) → 0%, -0.5 (very anomalous) → 100%
    confidence_pct = round(min(100, max(0, (-raw + 0.1) * 100)), 1)

    return {
        "global_score":     round(global_score, 4),
        "type_score":       round(type_score, 4) if type_score is not None else None,
        "is_anomaly":       global_pred == -1,
        "confidence_pct":   confidence_pct,
    }

if __name__ == "__main__":
    print("🔧 Generating synthetic training data …")
    df = synthetic_dataset()
    print(f"   Dataset shape: {df.shape}")
    print(f"   Type distribution:\n{df['type_encoded'].value_counts().sort_index()}\n")

    print("🧠 Training global Isolation Forest …")
    train_global_model(df)

    print("\n🧠 Training per-type Isolation Forest models …")
    train_type_models(df)

    print("\n✅ All models trained. Test scoring a sample anomaly:")
    sample = {
        "type_name":          "ghost_pickup",
        "gps_deviation_m":    1247,
        "transit_hours":      4.2,
        "complaint_surge_pct":5,
        "rejection_rate":     0.08,
        "route_adherence":    0.90,
        "hours_absent":       0,
        "credibility_score":  70,
    }
    result = score_sample(sample)
    print(f"   Sample result: {json.dumps(result, indent=2)}")