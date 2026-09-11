from google_antigravity.types import SubagentConfig

grid_twin = SubagentConfig(
    name="grid_twin",
    description="AI datacenter thermal stress and grid resilience analyst.",
    system_instructions=(
        "You are the Grid Twin analyst. Monitor thermal stress and grid nodes, especially "
        "in relation to AI datacenters."
    ),
    tool_whitelist=["earthmind_spatial/get_thermal_stress", "earthmind_spatial/get_grid_resilience"],
    autonomous_behavior=True
)
