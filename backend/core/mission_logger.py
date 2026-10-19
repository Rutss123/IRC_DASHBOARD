"""
core/mission_logger.py
----------------------
Records all raw and processed telemetry frames into timestamped session JSONL files
for post-mission debriefs, graph replays, and competition run audits.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from config import settings

logger = logging.getLogger(__name__)


class MissionLogger:
    """Session logger that appends telemetry frames to JSONL files on disk."""

    def __init__(self) -> None:
        self.enabled = settings.MISSION_LOGGING_ENABLED
        self.logs_dir = Path(settings.LOGS_DIR)
        self.current_file: Path | None = None
        self._file_handle = None

        if self.enabled:
            self._init_session()

    def _init_session(self) -> None:
        try:
            self.logs_dir.mkdir(parents=True, exist_ok=True)
            timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            self.current_file = self.logs_dir / f"mission_{timestamp_str}.jsonl"
            self._file_handle = open(self.current_file, "a", encoding="utf-8", buffering=1)
            logger.info("Mission logging active. Writing to: %s", self.current_file)
        except Exception as e:
            logger.error("Failed to initialize mission log file: %s", e)
            self.enabled = False

    def log(self, data: Dict[str, Any]) -> None:
        """Append a JSON record with UTC timestamp to the active mission file."""
        if not self.enabled or not self._file_handle:
            return

        try:
            record = {
                "utc_timestamp": datetime.now(timezone.utc).isoformat(),
                "payload": data
            }
            self._file_handle.write(json.dumps(record) + "\n")
        except Exception as e:
            logger.debug("Error writing mission log entry: %s", e)

    def close(self) -> None:
        """Close log file cleanly on application shutdown."""
        if self._file_handle:
            try:
                self._file_handle.close()
            except Exception:
                pass
            self._file_handle = None


mission_logger = MissionLogger()
