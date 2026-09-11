import json
import logging
import time
from typing import Any, Dict

try:
    from compat import hooks
except ImportError:
    try:
        from ..compat import hooks
    except ImportError:
        from google_antigravity import hooks

logger = logging.getLogger("spatial_audit")

@hooks.post_tool_call
def audit_spatial_tool(tool_name: str, args: Dict[str, Any], result: Any, execution_time: float, token_usage: Dict[str, int]) -> None:
    log_entry = {
        "tool_name": tool_name,
        "execution_time_ms": execution_time * 1000,
        "token_usage": token_usage,
        "telemetry_size_bytes": len(str(result)),
        "timestamp": time.time()
    }
    logger.info(json.dumps(log_entry))
