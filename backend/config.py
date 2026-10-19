from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Ground station backend settings.
    Can be overridden via environment variables or a .env file.
    """
    # Network targets
    JETSON_IP: str = Field(default="192.168.88.10", description="IP address of the rover / Jetson")
    UDP_INGEST_HOST: str = Field(default="0.0.0.0", description="Host to bind UDP telemetry receiver")
    UDP_INGEST_PORT: int = Field(default=9000, description="Port to bind UDP telemetry receiver")

    # Command uplink (Ground Station -> Jetson)
    COMMAND_HOST: str = Field(default="192.168.88.10", description="Target IP for ground station commands")
    COMMAND_PORT: int = Field(default=9001, description="Target UDP port for rover command receiver")

    # Video streaming (MediaMTX)
    MEDIAMTX_API_PORT: int = Field(default=9997, description="MediaMTX REST API port for stream discovery")
    MEDIAMTX_WHEP_PORT: int = Field(default=8889, description="MediaMTX WebRTC WHEP streaming port")
    MEDIAMTX_POLL_INTERVAL_S: float = Field(default=3.0, description="Interval in seconds between stream discovery queries")

    # Telemetry Health & Staleness
    TELEMETRY_STALE_TIMEOUT_S: float = Field(default=2.5, description="Seconds without packets before marking telemetry stale")
    BROADCAST_RATE_HZ: float = Field(default=25.0, description="Target WebSocket push frequency")

    # Mission logging
    LOGS_DIR: str = Field(default="logs/missions", description="Directory to store timestamped mission logs")
    MISSION_LOGGING_ENABLED: bool = Field(default=True, description="Whether to log telemetry frames to disk")

    # Fallback cameras when MediaMTX API is unreachable or streams are static
    FALLBACK_CAMERAS: List[Dict[str, Any]] = Field(
        default_factory=lambda: [
            {"id": "nav_cam", "name": "Navigation Cam", "path": "nav_cam", "type": "navigation"},
            {"id": "realsense_cam", "name": "RealSense RGB Feed", "path": "realsense_cam", "type": "navigation"},
            {"id": "arm_cam", "name": "Robotic Arm Cam", "path": "arm_cam", "type": "robotic"},
            {"id": "science_cam", "name": "Science / Microscope Cam", "path": "science_cam", "type": "science"}
        ]
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
