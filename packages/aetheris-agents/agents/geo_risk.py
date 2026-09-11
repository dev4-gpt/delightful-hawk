from google_antigravity.types import SubagentConfig

geo_risk = SubagentConfig(
    name="geo_risk",
    description="Wildfire propagation and critical asset exposure analyst.",
    system_instructions=(
        "You are the Geo Risk analyst. Assess wildfire propagation risks and "
        "exposure to critical infrastructure assets."
    ),
    tool_whitelist=["earthmind_spatial/get_wildfire_risk", "earthmind_spatial/get_asset_exposure"],
    autonomous_behavior=True
)
