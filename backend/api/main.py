"""
Pilates Class Planner v2.0 - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import time

# Import routers
from api import movements, agents, classes, analytics, soundcloud_auth, soundcloud_api, auth, users, compliance

app = FastAPI(
    title="Pilates Class Planner API",
    description="AI-powered Pilates class planning with MCP integration",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev
        "http://localhost:5173",  # Vite dev
        "http://localhost:5174",  # Vite dev alternate
        "https://basslinemvp.netlify.app",  # Netlify production
    ],
    allow_origin_regex=r"https://.*\.netlify\.app",  # Netlify preview deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing information"""
    start_time = time.time()

    logger.info(f"Request: {request.method} {request.url.path}")

    response = await call_next(request)

    process_time = time.time() - start_time
    logger.info(
        f"Response: {response.status_code} | Time: {process_time:.3f}s"
    )

    return response


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "service": "pilates-class-planner-api"
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Pilates Class Planner API v2.0",
        "docs": "/api/docs",
        "health": "/health"
    }


# Include routers
app.include_router(movements.router, prefix="/api/movements", tags=["Movements"])
app.include_router(agents.router, prefix="/api/agents", tags=["AI Agents"])
app.include_router(classes.router, prefix="/api/classes", tags=["Classes"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(soundcloud_auth.router)  # SoundCloud OAuth (has its own prefix)
app.include_router(soundcloud_api.router)  # SoundCloud API (has its own prefix)
app.include_router(auth.router)  # Auth routes (has its own prefix)
app.include_router(users.router)  # User routes (has its own prefix)
app.include_router(compliance.router, tags=["Compliance"])  # GDPR & AI Act compliance


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "type": "server_error"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
