"""
MillStream ERP — AI Microservice (FastAPI)
Handles: Demand Forecasting, Smart Procurement, RAG Chat Assistant
Deploy: Koyeb or Hugging Face Spaces (free tier)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import forecasting, procurement, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle handler."""
    print("🤖  MillStream AI Service starting up…")
    # Future: warm up Prophet model cache, preload DB schema for RAG, etc.
    yield
    print("🤖  MillStream AI Service shutting down…")


app = FastAPI(
    title="MillStream AI Microservice",
    description=(
        "Demand Forecasting (Prophet), Smart Procurement Optimization, "
        "and Intelligent RAG Chat Assistant for MillStream ERP."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",    # Node.js backend (proxy)
        "http://localhost:5173",    # Vite dev frontend
        "https://millstream.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ──────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "service": "millstream-ai",
    }


# ── Routers ───────────────────────────────────────────────────────────────
app.include_router(forecasting.router,  prefix="/forecast",    tags=["Forecasting"])
app.include_router(procurement.router,  prefix="/procurement", tags=["Procurement"])
app.include_router(chat.router,         prefix="/chat",        tags=["Chat"])


# ── Entry point (local dev) ───────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
