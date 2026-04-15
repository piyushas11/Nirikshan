# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.ai     import router as ai_router, ml_router
from routes.vision import router as vision_router   # LLaVA — segregation-check

app = FastAPI(title="WasteTrack API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Route map ──────────────────────────────────────────────────────────────────
#  /ai/suggestion          → ai_router      (llama3.1 anomaly analysis)
#  /ai/health              → ai_router      (Ollama health check)
#  /ai/segregation-check   → vision_router  (LLaVA image analysis)
#  /ml/health              → ml_router      (backend status badge)
#  /ml/score               → ml_router      (rule-based confidence score)
# ──────────────────────────────────────────────────────────────────────────────

app.include_router(ai_router,     prefix="/ai", tags=["AI — llama3.1"])
app.include_router(vision_router, prefix="/ai", tags=["AI — LLaVA vision"])
app.include_router(ml_router,     prefix="/ml", tags=["ML"])


@app.get("/")
def root():
    return {"status": "WasteTrack API running"}