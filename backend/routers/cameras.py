"""
routers/cameras.py
------------------
Endpoints for dynamic camera discovery and stream paths.
"""

from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter
from services.mediamtx_discovery import mediamtx_discovery
from config import settings

router = APIRouter(prefix="/api/cameras", tags=["Cameras"])


@router.get("", response_model=List[Dict[str, Any]])
async def get_available_cameras() -> List[Dict[str, Any]]:
    """
    Returns list of discovered or configured cameras with their stream paths.
    Dashboard queries this endpoint to dynamically scale the camera matrix.
    """
    cameras = mediamtx_discovery.get_cameras()
    return cameras


@router.get("/config")
async def get_camera_network_config() -> Dict[str, Any]:
    """
    Returns network ports and host IPs required by the frontend video players (WHEP).
    """
    return {
        "jetson_ip": settings.JETSON_IP,
        "whep_port": settings.MEDIAMTX_WHEP_PORT,
        "api_port": settings.MEDIAMTX_API_PORT,
        "is_api_alive": mediamtx_discovery.is_api_alive,
    }
