import logging
from typing import Any, Dict
from google_antigravity import hooks

logger = logging.getLogger(__name__)

class GeoErrorRecoveryHook(hooks.OnToolErrorHook):
    def on_tool_error(self, tool_name: str, args: Dict[str, Any], error: Exception) -> Optional[str]:
        error_str = str(error).lower()
        if 'crs' in error_str or 'invalid projection' in error_str:
            return "CRS error encountered. Please reproject your coordinates to EPSG:4326 before retrying the tool."
        elif 'out of bounds' in error_str:
            return "Coordinates are out of bounds. Please constrain your bounding box to valid geographic extents."
        elif 'rate limit' in error_str:
            return "Rate limit exceeded. Please backoff and wait a moment before retrying."
        return None
