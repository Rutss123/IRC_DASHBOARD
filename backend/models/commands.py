"""
models/commands.py
------------------
Models for operator commands dispatched from the dashboard to the rover.
"""

from __future__ import annotations
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class CommandRequest(BaseModel):
    command: str = Field(description="Command identifier, e.g. 'estop_engage', 'estop_reset', 'set_mode'")
    subsystem: Optional[str] = Field(default=None, description="Target subsystem if applicable")
    params: Dict[str, Any] = Field(default_factory=dict, description="Command parameters")
    operator_id: str = Field(default="primary_console", description="Operator identity")


class CommandResponse(BaseModel):
    success: bool
    command: str
    message: str
    target_host: str
    target_port: int
