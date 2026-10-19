"""
services/mediamtx_discovery.py
------------------------------
Polls the MediaMTX REST API on port 9997 to dynamically discover active camera streams.
Gracefully falls back to configured fallback cameras if port 9997 is disabled or unreachable.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List
import httpx

from config import settings

logger = logging.getLogger(__name__)


def _format_camera_name(path_name: str) -> str:
    """Convert stream path like 'nav_cam' or 'arm_wrist' to 'Nav Cam'."""
    clean = path_name.replace("_", " ").replace("-", " ")
    return clean.title()


def _infer_camera_type(path_name: str) -> str:
    """Infer camera classification for UI badges."""
    lower = path_name.lower()
    if any(k in lower for k in ("nav", "front", "rear", "realsense", "drive")):
        return "navigation"
    if any(k in lower for k in ("arm", "gripper", "wrist", "manipulator")):
        return "robotic"
    if any(k in lower for k in ("science", "microscope", "sample")):
        return "science"
    return "auxiliary"


class MediaMtxDiscovery:
    """Discovers published streams from MediaMTX control API."""

    def __init__(self) -> None:
        self.api_url = f"http://{settings.JETSON_IP}:{settings.MEDIAMTX_API_PORT}/v3/paths/list"
        self._discovered_cameras: List[Dict[str, Any]] = list(settings.FALLBACK_CAMERAS)
        self._is_connected_to_api = False
        self._poller_task: asyncio.Task | None = None
        self._warned_unreachable = False

    async def start(self) -> None:
        """Start the background stream poller."""
        self._poller_task = asyncio.create_task(self._poll_loop(), name="mediamtx_poller")

    async def stop(self) -> None:
        """Cancel poller task."""
        if self._poller_task:
            self._poller_task.cancel()
            try:
                await self._poller_task
            except asyncio.CancelledError:
                pass
            self._poller_task = None

    async def _poll_loop(self) -> None:
        """Periodic query to MediaMTX paths API."""
        async with httpx.AsyncClient(timeout=2.0) as client:
            while True:
                try:
                    resp = await client.get(self.api_url)
                    if resp.status_code == 200:
                        data = resp.json()
                        items = data.get("items", [])
                        new_cameras = []

                        for item in items:
                            name = item.get("name", "")
                            if not name:
                                continue
                            ready = item.get("ready", False)

                            new_cameras.append({
                                "id": name,
                                "name": _format_camera_name(name),
                                "path": name,
                                "type": _infer_type(name),
                                "status": "online" if ready else "standby",
                                "sourceType": item.get("sourceType", "unknown"),
                                "readers": len(item.get("readers", []))
                            })

                        if new_cameras:
                            self._discovered_cameras = new_cameras

                        if not self._is_connected_to_api:
                            logger.info("MediaMTX API connected. Discovered %d cameras.", len(self._discovered_cameras))
                            self._is_connected_to_api = True
                            self._warned_unreachable = False

                except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPError):
                    self._is_connected_to_api = False
                    if not self._warned_unreachable:
                        logger.warning(
                            "MediaMTX API unreachable at %s:%d. Using fallback camera configuration.",
                            settings.JETSON_IP, settings.MEDIAMTX_API_PORT
                        )
                        self._warned_unreachable = True
                    # Revert to fallback list if disconnected
                    self._discovered_cameras = list(settings.FALLBACK_CAMERAS)

                except asyncio.CancelledError:
                    break
                except Exception as exc:
                    logger.debug("MediaMTX poller error: %s", exc)

                await asyncio.sleep(settings.MEDIAMTX_POLL_INTERVAL_S)

    def get_cameras(self) -> List[Dict[str, Any]]:
        """Return the latest list of discovered or fallback cameras."""
        return self._discovered_cameras

    @property
    def is_api_alive(self) -> bool:
        return self._is_connected_to_api


def _infer_type(name: str) -> str:
    return _infer_camera_type(name)


mediamtx_discovery = MediaMtxDiscovery()
