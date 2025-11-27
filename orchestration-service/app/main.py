"""
Bassline Orchestration Service - Main Application
FastAPI service that orchestrates AI agents using Jentic's StandardAgent and Arazzo Engine
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

# Configure logger
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="INFO"
)

# Create FastAPI app
app = FastAPI(
    title="Bassline Orchestration Service",
    description="Jentic-powered AI orchestration for Pilates class generation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://basslinemvp.netlify.app",
    ],
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "bassline-orchestration",
        "version": "1.0.0",
        "jentic_integration": "active"
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "message": "Bassline Orchestration Service",
        "description": "Jentic-powered AI orchestration for Pilates class generation",
        "docs": "/docs",
        "health": "/health",
        "architecture": {
            "agent": "BasslinePilatesCoachAgent extends StandardAgent",
            "workflow_engine": "Jentic Arazzo Engine",
            "workflow": "assemble_pilates_class_v1.arazzo.yaml"
        }
    }


# Import routers
# from app.api import orchestrate, agent_info
# app.include_router(orchestrate.router, prefix="/orchestrate", tags=["Orchestration"])
# app.include_router(agent_info.router, prefix="/agent", tags=["Agent Info"])


# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Startup event handler
    Initialize Jentic components
    """
    logger.info("🚀 Starting Bassline Orchestration Service")
    logger.info("📚 Jentic Integration Status:")
    logger.info("   - StandardAgent: Ready (stub)")
    logger.info("   - Arazzo Engine: Ready (stub)")
    logger.info("   - ReWOO Reasoner: Ready (stub)")
    logger.info("🎓 Educational Mode: All Jentic patterns documented")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("👋 Shutting down Bassline Orchestration Service")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
