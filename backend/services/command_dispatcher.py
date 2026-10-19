"""
services/command_dispatcher.py
------------------------------
Transmits verified ground station commands to the rover / Jetson command listener
over an isolated UDP command port.
"""

from __future__ import annotations

import json
import logging
import socket
from datetime import datetime, timezone
from typing import Any, Dict

from config import settings
from core.state_manager import state_manager
from models.commands import CommandRequest, CommandResponse

logger = logging.getLogger(__name__)


class CommandDispatcher:
    """Dispatches commands from dashboard operators to the rover."""

    def __init__(self, target_host: str = settings.COMMAND_HOST, target_port: int = settings.COMMAND_PORT) -> None:
        self.target_host = target_host
        self.target_port = target_port

    def dispatch(self, req: CommandRequest) -> CommandResponse:
        """Serialize and send command datagram to the rover."""
        now_iso = datetime.now(timezone.utc).isoformat()
        packet = {
            "timestamp": now_iso,
            "command": req.command,
            "subsystem": req.subsystem,
            "params": req.params,
            "operator_id": req.operator_id,
        }

        # Update local ground station mode immediately for feedback
        if req.command == "estop_engage":
            state_manager.set_system_mode(rover_mode="E-STOP")
        elif req.command == "estop_reset":
            state_manager.set_system_mode(rover_mode="NAV")
        elif req.command == "set_rover_mode":
            mode = req.params.get("mode", "NAV")
            state_manager.set_system_mode(rover_mode=mode)
        elif req.command == "set_driver_mode":
            mode = req.params.get("mode", "MANUAL")
            state_manager.set_system_mode(driver_mode=mode)

        # Transmit UDP datagram
        try:
            payload_bytes = json.dumps(packet).encode("utf-8")
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
                sock.sendto(payload_bytes, (self.target_host, self.target_port))

            logger.info("Command dispatched: %s -> %s:%d", req.command, self.target_host, self.target_port)
            return CommandResponse(
                success=True,
                command=req.command,
                message=f"Command '{req.command}' dispatched to rover at {self.target_host}:{self.target_port}",
                target_host=self.target_host,
                target_port=self.target_port,
            )
        except Exception as e:
            logger.error("Failed to transmit command '%s': %s", req.command, e)
            return CommandResponse(
                success=False,
                command=req.command,
                message=f"Failed to transmit command: {e}",
                target_host=self.target_host,
                target_port=self.target_port,
            )


command_dispatcher = CommandDispatcher()
