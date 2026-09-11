import asyncio
import os
import uuid
from typing import Optional

try:
    from compat import LocalAgentConfig, policy, McpStdioServer, AgentRunner
except ImportError:
    try:
        from .compat import LocalAgentConfig, policy, McpStdioServer, AgentRunner
    except ImportError:
        from google_antigravity import LocalAgentConfig, policy
        from google_antigravity.mcp import McpStdioServer
        from google_antigravity.runner import AgentRunner

from schemas.anomaly_report import CrossDomainAssessment
from hooks.geo_error_recovery import GeoErrorRecoveryHook
from hooks.spatial_audit import audit_spatial_tool
from memory.synaptic_vault import SynapticVault

from agents.sentinel_mesh import sentinel_mesh
from agents.orbital_ops import orbital_ops
from agents.grid_twin import grid_twin
from agents.geo_risk import geo_risk

def bbox_exceeds_limit(args: dict) -> bool:
    if "bbox" in args:
        # Custom logic for bounding box
        bbox = args["bbox"]
        if isinstance(bbox, list) and len(bbox) == 4:
            area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
            return area > 100.0  # limit
    return False

def get_coordinator_config(app_data_dir: str, save_dir: str) -> LocalAgentConfig:
    # Setup policies
    p = policy.deny_all()
    p = policy.allow("earthmind_spatial/*", p)
    # Applying custom predicate (assuming policy system allows predicates like this or via specific binding)
    
    config = LocalAgentConfig(
        mcp_servers=[
            McpStdioServer(name="earthmind-mcp", command="earthmind-mcp")
        ],
        subagents=[
            sentinel_mesh,
            orbital_ops,
            grid_twin,
            geo_risk
        ],
        enable_subagents=True,
        max_subagent_depth=2,
        security_policy=p,
        response_schema=CrossDomainAssessment,
        hooks=[GeoErrorRecoveryHook(), audit_spatial_tool],
        app_data_dir=app_data_dir,
        save_dir=save_dir
    )
    return config

async def run_mission(prompt: str) -> CrossDomainAssessment:
    app_data_dir = "/tmp/aetheris/app_data"
    save_dir = "/tmp/aetheris/saves"
    conversation_id = str(uuid.uuid4())
    
    vault = SynapticVault(save_dir=save_dir, conversation_id=conversation_id)
    
    config = get_coordinator_config(app_data_dir, save_dir)
    runner = AgentRunner(config)
    
    result = await runner.run_async(prompt)
    return CrossDomainAssessment.model_validate(result)

if __name__ == "__main__":
    prompt = "Assess threat correlation between LEO conjunctions and anomalous maritime activity near subsea cables."
    assessment = asyncio.run(run_mission(prompt))
    print(assessment.model_dump_json(indent=2))
