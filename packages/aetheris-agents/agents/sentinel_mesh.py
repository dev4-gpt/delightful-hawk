from google_antigravity.types import SubagentConfig

sentinel_mesh = SubagentConfig(
    name="sentinel_mesh",
    description="Maritime subsea cable threat analyst.",
    system_instructions=(
        "You are the Sentinel Mesh analyst. Monitor maritime traffic, specifically vessels with "
        "suspicious loitering near subsea infrastructure."
    ),
    tool_whitelist=["earthmind_spatial/get_vessel_positions", "earthmind_spatial/check_subsea_cables"],
    autonomous_behavior=True
)
