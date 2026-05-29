from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import parse, generate, submit, batch, auth
from app.config import get_settings


# Get settings for metadata
settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Automate Google Form submissions using AI-generated answers.",
    version=settings.app_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(parse.router)
app.include_router(generate.router)
app.include_router(submit.router)
app.include_router(batch.router)


@app.get("/", tags=["health"])
def health_check():
    """Health check endpoint with server info."""
    return {
        "status": "ok",
        "message": "Vareva AutoGF API is running",
        "version": settings.app_version,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S%z"),
        "debug_mode": settings.debug,
    }
