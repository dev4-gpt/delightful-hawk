"""
Compatibility and fallback shims for Google Antigravity SDK.
Allows Aetheris multi-agent code, hooks, memory, and Pydantic schemas
to execute seamlessly in both Google Antigravity (AGY) runtimes and
standard Python 3.10+ environments (e.g. CI/CD, local test runners, air-gapped on-prem).
"""

import sys
import logging
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger("aetheris.compat")

try:
    import google_antigravity as _agy
    from google_antigravity import hooks, policy, LocalAgentConfig
    from google_antigravity.mcp import McpStdioServer
    from google_antigravity.runner import AgentRunner
    HAS_ANTIGRAVITY = True
except ImportError:
    HAS_ANTIGRAVITY = False

    class _HooksFallback:
        class OnToolErrorHook:
            def on_tool_error(self, tool_name: str, args: Dict[str, Any], error: Exception) -> Optional[str]:
                return None

        @staticmethod
        def post_tool_call(fn: Callable) -> Callable:
            return fn

    hooks = _HooksFallback()

    class _PolicyFallback:
        @staticmethod
        def deny_all():
            return {"default": "deny"}

        @staticmethod
        def allow(pattern: str, p: Any = None):
            policy_dict = p if isinstance(p, dict) else {"default": "deny"}
            policy_dict.setdefault("allowed", []).append(pattern)
            return policy_dict

    policy = _PolicyFallback()

    class McpStdioServer:
        def __init__(self, name: str, command: str, args: Optional[List[str]] = None):
            self.name = name
            self.command = command
            self.args = args or []

    class LocalAgentConfig:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

    class AgentRunner:
        def __init__(self, config: Any):
            self.config = config

        async def run_async(self, prompt: str) -> Dict[str, Any]:
            logger.info("AgentRunner fallback executing prompt: %s", prompt)
            return {
                "assessment_id": "fallback-simulated-assessment",
                "timestamp": "2026-09-11T00:00:00Z",
                "target_region": "Global Planetary Grid",
                "active_cartridges": ["sentinel_mesh", "orbital_ops"],
                "anomalies": [],
                "executive_summary": "Simulated multi-domain assessment via Aetheris AgentRunner fallback.",
                "security_cleared": True
            }

__all__ = [
    "HAS_ANTIGRAVITY",
    "hooks",
    "policy",
    "McpStdioServer",
    "LocalAgentConfig",
    "AgentRunner"
]
