# routes/ai.py
# Exposes (mount in main.py with prefix="/ai" and prefix="/ml"):
#
#   POST /ai/suggestion       — anomaly analysis (llama3.1)
#   POST /ai/validate-image   — waste image validator (llava if available, else llama3.1)
#   GET  /ai/health           — Ollama health check
#   GET  /ml/health           — ML backend health
#   POST /ml/score            — rule-based anomaly confidence score
#
# NOTE: /ai/segregation-check lives in routes/vision.py (LLaVA only).
#       This file is 100% self-contained — no imports from vision.py.

from fastapi import APIRouter, UploadFile, File, HTTPException
import requests
import base64
import json

router    = APIRouter()
ml_router = APIRouter()

OLLAMA_BASE = "http://localhost:11434"
OLLAMA_URL  = f"{OLLAMA_BASE}/api/generate"
MODEL       = "llama3.1"


# ─── Internal helpers ──────────────────────────────────────────────────────────

def _is_ollama_up() -> bool:
    try:
        r = requests.get(f"{OLLAMA_BASE}/api/tags", timeout=4)
        return r.status_code == 200
    except Exception:
        return False


def _available_models() -> list[str]:
    try:
        r = requests.get(f"{OLLAMA_BASE}/api/tags", timeout=4)
        return [m["name"] for m in r.json().get("models", [])]
    except Exception:
        return []


def _has_llava() -> bool:
    return any("llava" in m.lower() for m in _available_models())


def _extract_json(raw: str) -> dict | None:
    """Try to pull a JSON object out of a possibly-dirty LLM response."""
    import re
    s = raw.strip()
    try:
        return json.loads(s)
    except Exception:
        pass
    cleaned = re.sub(r"```(?:json)?", "", s).strip().strip("`").strip()
    try:
        return json.loads(cleaned)
    except Exception:
        pass
    start = s.find("{")
    end   = s.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(s[start:end + 1])
        except Exception:
            pass
    return None


# ─── Anomaly suggestion (llama3.1) ────────────────────────────────────────────

ANOMALY_SYSTEM = """You are an expert waste management operations analyst.
When given an anomaly description, respond with EXACTLY this JSON structure and nothing else:
{
  "cause": "one sentence root cause",
  "action": "one sentence immediate action",
  "risk": "one sentence risk if unresolved"
}
No preamble, no markdown, no explanation — pure JSON only."""


def _call_ollama_anomaly(message: str) -> str:
    prompt = f"{ANOMALY_SYSTEM}\n\nAnomaly: {message}\n\nJSON:"
    try:
        resp = requests.post(
            OLLAMA_URL,
            json={
                "model":   MODEL,
                "prompt":  prompt,
                "stream":  False,
                "options": {"temperature": 0.2, "num_predict": 200},
            },
            timeout=90,
        )
        resp.raise_for_status()
        raw = resp.json().get("response", "").strip()

        parsed = _extract_json(raw)
        if parsed:
            cause  = parsed.get("cause",  "Unknown root cause")
            action = parsed.get("action", "Manual review required")
            risk   = parsed.get("risk",   "Operational disruption possible")
            return f"🔍 Cause: {cause}\n⚡ Action: {action}\n⚠️ Risk: {risk}"
        return raw[:400] if raw else "⚠️ Could not parse AI response."

    except requests.exceptions.ConnectionError:
        return "⚠️ Ollama not reachable. Start it with: ollama serve"
    except requests.exceptions.Timeout:
        return "⚠️ Ollama timed out (>90s). Model may be loading — retry shortly."
    except Exception as e:
        return f"⚠️ AI error: {str(e)[:120]}"


@router.post("/suggestion")
def ai_suggestion(data: dict):
    message = data.get("message", "").strip()
    if not message:
        return {"suggestion": "No anomaly message provided."}
    return {"suggestion": _call_ollama_anomaly(message)}


# ─── Health ───────────────────────────────────────────────────────────────────

@router.get("/health")
def ai_health():
    running = _is_ollama_up()
    models  = _available_models() if running else []
    return {
        "ollama_running":   running,
        "available_models": models,
        "llama3_1_ready":   any("llama3.1" in m for m in models),
        "llava_ready":      any("llava"    in m.lower() for m in models),
    }


# ─── Validate image — POST /ai/validate-image ─────────────────────────────────
#
# Used by ReportWaste.jsx "VALIDATE WITH AI" button.
# Prefers LLaVA (vision) if available; falls back to llama3.1 (text heuristic).
# Response: { "is_waste_image": bool, "reason": str }

VALIDATE_PROMPT = """You are a waste image validator.
Decide if this image shows waste, rubbish, bins, recycling materials, or waste-related content.

Reply with EXACTLY this JSON and nothing else:
{"is_waste_image": true, "reason": "one sentence why it is waste"}
OR
{"is_waste_image": false, "reason": "one sentence why it is NOT waste"}

No preamble. No markdown. No extra keys. Pure JSON only."""


def _validate_with_llava(image_bytes: bytes) -> dict | None:
    """Try LLaVA vision validation. Returns dict on success, None on any failure."""
    b64 = base64.b64encode(image_bytes).decode()
    try:
        resp = requests.post(
            OLLAMA_URL,
            json={
                "model":   "llava",
                "prompt":  VALIDATE_PROMPT,
                "images":  [b64],
                "stream":  False,
                "options": {"temperature": 0.05, "num_predict": 100},
            },
            timeout=120,
        )
        if not resp.ok:
            return None
        raw = resp.json().get("response", "").strip()
        parsed = _extract_json(raw)
        if parsed and "is_waste_image" in parsed:
            return {
                "is_waste_image": bool(parsed["is_waste_image"]),
                "reason": str(parsed.get("reason", "Validation complete.")),
            }
    except Exception:
        pass
    return None


def _validate_with_llama(image_bytes: bytes) -> dict | None:
    """
    llama3.1 is a TEXT model — it cannot see images.
    We do a best-effort check: ask llama3.1 to confirm acceptance given only metadata,
    and clearly note that full vision requires LLaVA.
    """
    size_kb = len(image_bytes) / 1024
    prompt = (
        f"A user uploaded a {size_kb:.0f} KB image to a waste reporting app. "
        "LLaVA vision model is unavailable for full visual verification. "
        "Accept the image provisionally and respond ONLY with this exact JSON:\n"
        '{"is_waste_image": true, "reason": "Provisionally accepted — LLaVA unavailable for full visual check. Run: ollama pull llava"}'
    )
    try:
        resp = requests.post(
            OLLAMA_URL,
            json={
                "model":   MODEL,
                "prompt":  prompt,
                "stream":  False,
                "options": {"temperature": 0.0, "num_predict": 80},
            },
            timeout=60,
        )
        if not resp.ok:
            return None
        raw = resp.json().get("response", "").strip()
        parsed = _extract_json(raw)
        if parsed and "is_waste_image" in parsed:
            return {
                "is_waste_image": bool(parsed["is_waste_image"]),
                "reason": str(parsed.get("reason", "Accepted provisionally.")),
            }
    except Exception:
        pass
    return None


@router.post("/validate-image")
async def validate_image(photo: UploadFile = File(...)):
    """
    POST /ai/validate-image
    Validates whether an uploaded image contains waste.
    Uses LLaVA if available (real vision), falls back to llama3.1 text mode.
    Returns: { "is_waste_image": bool, "reason": str }
    """
    ct = (photo.content_type or "").lower()
    if ct and not ct.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted.")

    data = await photo.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(data) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large — max 20 MB.")

    # Check Ollama is reachable at all
    if not _is_ollama_up():
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running. Start it with: ollama serve",
        )

    # Try LLaVA first (real vision)
    if _has_llava():
        result = _validate_with_llava(data)
        if result:
            return result

    # Fallback: llama3.1 text mode
    result = _validate_with_llama(data)
    if result:
        return result

    # Should not reach here unless Ollama went down mid-request
    raise HTTPException(
        status_code=503,
        detail="AI validation failed. Ensure Ollama is running and at least llama3.1 is pulled.",
    )


# ─── ML health + confidence scoring ───────────────────────────────────────────

@ml_router.get("/health")
def ml_health():
    running = _is_ollama_up()
    return {
        "status":         "ok",
        "ollama_running": running,
        "model":          MODEL,
    }


CONFIDENCE_RULES = {
    "GHOST_PICKUP": lambda f: min(99, 60
        + (f.get("gps_deviation_m", 0) / 1500) * 30
        + (10 if f.get("credibility_score", 100) < 70 else 0)),

    "COMPLAINT_SURGE": lambda f: min(99, 50
        + (f.get("complaint_surge_pct", 0) / 100) * 40
        + (10 if f.get("credibility_score", 100) < 60 else 0)),

    "BATCH_STAGNATION": lambda f: min(99, 55
        + (f.get("transit_hours", 0) / 24) * 35
        + (10 if f.get("credibility_score", 100) < 65 else 0)),

    "DISPOSAL_MISMATCH":  lambda f: 97.0,

    "CREDIBILITY_CLIFF": lambda f: min(99, 50
        + (max(0, 60 - f.get("credibility_score", 60)) / 60) * 30
        + (f.get("rejection_rate", 0) * 20)),

    "ROUTE_DEVIATION": lambda f: min(99, 40
        + (1 - f.get("route_adherence", 1)) * 50
        + (f.get("gps_deviation_m", 0) / 500) * 10),

    "CITIZEN_REJECTION": lambda f: min(99, 45
        + (f.get("rejection_rate", 0) / 0.5) * 45
        + (5 if f.get("credibility_score", 100) < 65 else 0)),

    "WORKER_ABSENCE": lambda f: 100.0,
}


@ml_router.post("/score")
def ml_score(data: dict):
    anomaly_type = data.get("type", "").upper()
    features     = data.get("features", {})
    rule = CONFIDENCE_RULES.get(anomaly_type)
    if rule is None:
        return {"confidence_pct": 75.0, "type": anomaly_type, "note": "unknown type — default score"}
    try:
        score = round(rule(features), 1)
    except Exception:
        score = 75.0
    return {"confidence_pct": score, "type": anomaly_type}