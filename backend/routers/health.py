"""
routers/health.py
-----------------
True system diagnostics and health probe.
Calculates real measured metrics rather than hardcoded nominal numbers.
"""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter
from pydantic import BaseModel

from core.broadcaster import broadcaster
from core.state_manager import state_manager
from ingestion.udp_server import udp_ingestor
from services.mediamtx_discovery import mediamtx_discovery

router = APIRouter(tags=["Health"])


class SystemHealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    telemetry_hz: float
    is_stale: bool
    connected_clients: int
    total_packets_received: int
    dropped_packets: int
    active_cameras: int
    mediamtx_api_connected: bool
    ingestion_driver: Dict[str, Any]


@router.get("/health", response_model=SystemHealthResponse)
async def health_check() -> SystemHealthResponse:
    """Comprehensive liveness and diagnostic probe for ground station monitoring."""
    is_stale = state_manager.is_stale
    udp_running = udp_ingestor.is_running()

    if not udp_running:
        status = "offline"
    elif is_stale:
        status = "stale"
    else:
        status = "nominal"

    return SystemHealthResponse(
        status=status,
        uptime_seconds=state_manager.uptime_seconds,
        telemetry_hz=round(state_manager.current_hz, 1),
        is_stale=is_stale,
        connected_clients=broadcaster.client_count,
        total_packets_received=state_manager.total_packets,
        dropped_packets=state_manager.dropped_packets,
        active_cameras=len(mediamtx_discovery.get_cameras()),
        mediamtx_api_connected=mediamtx_discovery.is_api_alive,
        ingestion_driver=udp_ingestor.get_stats(),
    )
