"""
routers/commands.py
-------------------
Command endpoints for operator control (E-Stop, mode toggles, actuator dispatch).
"""

from __future__ import annotations

from fastapi import APIRouter
from models.commands import CommandRequest, CommandResponse
from services.command_dispatcher import command_dispatcher

router = APIRouter(prefix="/api/command", tags=["Commands"])


@router.post("", response_model=CommandResponse)
async def send_command(req: CommandRequest) -> CommandResponse:
    """Dispatches an arbitrary command datagram to the rover."""
    return command_dispatcher.dispatch(req)


@router.post("/estop", response_model=CommandResponse)
async def trigger_estop(action: str = "engage") -> CommandResponse:
    """
    Emergency Stop trigger.
    action: 'engage' (halts rover motors) or 'reset' (returns to NAV mode).
    """
    cmd = "estop_engage" if action == "engage" else "estop_reset"
    req = CommandRequest(command=cmd, operator_id="dashboard_estop_button")
    return command_dispatcher.dispatch(req)


@router.post("/mode", response_model=CommandResponse)
async def change_system_mode(mode: str) -> CommandResponse:
    """Change operational mode: 'NAV', 'SCIENCE', 'ARM', or 'E-STOP'."""
    req = CommandRequest(
        command="set_rover_mode",
        params={"mode": mode.upper()},
        operator_id="dashboard_mode_switch"
    )
    return command_dispatcher.dispatch(req)
