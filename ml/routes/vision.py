# routes/vision.py
# POST /ai/segregation-check  — LLaVA image analysis via Ollama
#
# Response JSON:
#   { "is_waste_image": bool, "score": int, "wrong_items": [str],
#     "improvement_steps": [str], "summary": str }
#
# Mount in main.py:
#   from routes.vision import router as vision_router
#   app.include_router(vision_router, prefix="/ai")

from fastapi import APIRouter, UploadFile, File, HTTPException
import requests
import base64
import json
import re

router = APIRouter()

OLLAMA_BASE  = "http://localhost:11434"
OLLAMA_URL   = f"{OLLAMA_BASE}/api/generate"
VISION_MODEL = "llava"

VISION_PROMPT = """You are a waste segregation quality inspector AI.

FIRST decide: does this image show waste, rubbish, bins, recycling, or any waste-related material?

If NOT a waste image (selfie, animal, food, landscape, vehicle, random object):
{"is_waste_image":false,"score":0,"wrong_items":[],"improvement_steps":[],"summary":"This image does not appear to show waste. Please upload a photo of your segregated waste or bins."}

If YES it is waste:
{"is_waste_image":true,"score":<0-100>,"wrong_items":["item in wrong bin"],"improvement_steps":["step 1"],"summary":"Two plain-English sentences."}

Score: 80-100 good, 50-79 needs work, 0-49 poor.
wrong_items: [] if nothing misplaced.
improvement_steps: 1-4 items, [] if score>=80.

OUTPUT PURE JSON ONLY. No text before or after. No markdown. No backticks."""


def _safe_int(v, default=50):
    try:
        return max(0, min(100, int(v)))
    except Exception:
        return default


def _extract_json(raw: str) -> dict | None:
    s = raw.strip()
    # 1. Direct parse
    try:
        return json.loads(s)
    except Exception:
        pass
    # 2. Strip markdown fences
    cleaned = re.sub(r"```(?:json)?", "", s).strip().strip("`").strip()
    try:
        return json.loads(cleaned)
    except Exception:
        pass
    # 3. Find outermost braces
    m = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    # 4. First brace to last brace
    start = s.find("{")
    end   = s.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(s[start:end + 1])
        except Exception:
            pass
    return None


def _normalise(parsed: dict) -> dict:
    return {
        "is_waste_image":    bool(parsed.get("is_waste_image", True)),
        "score":             _safe_int(parsed.get("score", 50)),
        "wrong_items":       list(parsed.get("wrong_items") or []),
        "improvement_steps": list(parsed.get("improvement_steps") or []),
        "summary":           str(parsed.get("summary") or "Analysis complete."),
    }


def _check_llava_available() -> bool:
    try:
        r = requests.get(f"{OLLAMA_BASE}/api/tags", timeout=4)
        if r.status_code == 200:
            models = [m["name"] for m in r.json().get("models", [])]
            return any("llava" in m.lower() for m in models)
    except Exception:
        pass
    return False


def _call_llava(image_bytes: bytes) -> dict:
    # Check Ollama is reachable first
    try:
        requests.get(f"{OLLAMA_BASE}/api/tags", timeout=4)
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running. Start it with: ollama serve",
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Cannot reach Ollama: {exc}")

    # Check LLaVA model exists
    if not _check_llava_available():
        raise HTTPException(
            status_code=422,
            detail="LLaVA model not found. Run: ollama pull llava",
        )

    b64 = base64.b64encode(image_bytes).decode()

    try:
        resp = requests.post(
            OLLAMA_URL,
            json={
                "model":   VISION_MODEL,
                "prompt":  VISION_PROMPT,
                "images":  [b64],
                "stream":  False,
                "options": {"temperature": 0.05, "num_predict": 512},
            },
            timeout=150,
        )
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Ollama disconnected mid-request. Ensure it stays running.",
        )
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="LLaVA timed out after 150s. The model may be loading — retry shortly.",
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Connection error: {exc}")

    if resp.status_code == 404:
        raise HTTPException(
            status_code=422,
            detail=f"Model '{VISION_MODEL}' not found in Ollama. Run: ollama pull llava",
        )
    if not resp.ok:
        raise HTTPException(
            status_code=502,
            detail=f"Ollama returned HTTP {resp.status_code}: {resp.text[:200]}",
        )

    try:
        raw = resp.json().get("response", "").strip()
    except Exception:
        raise HTTPException(status_code=502, detail="Ollama returned non-JSON wrapper.")

    if not raw:
        raise HTTPException(status_code=502, detail="LLaVA returned an empty response.")

    parsed = _extract_json(raw)
    if parsed is None:
        # Graceful degradation — don't 500, return soft result
        return {
            "is_waste_image":    True,
            "score":             50,
            "wrong_items":       [],
            "improvement_steps": ["AI response was unclear — retry with a clearer photo."],
            "summary":           (raw[:280] + "…") if len(raw) > 280 else raw,
        }

    return _normalise(parsed)


@router.post("/segregation-check")
async def segregation_check(photo: UploadFile = File(...)):
    ct = (photo.content_type or "").lower()
    if ct and not ct.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted.")

    data = await photo.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(data) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large — max 20 MB.")

    return _call_llava(data)