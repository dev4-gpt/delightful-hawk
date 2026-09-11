from google_antigravity.types import SubagentConfig

orbital_ops = SubagentConfig(
    name="orbital_ops",
    description="Space domain conjunction and collision avoidance analyst.",
    system_instructions=(
        "You are the Orbital Ops analyst. Evaluate satellite TLE ephemeris history and assess "
        "conjunction or collision risks in LEO and GEO."
    ),
    tool_whitelist=["earthmind_spatial/get_tle_ephemeris", "earthmind_spatial/calculate_conjunctions"],
    autonomous_behavior=True
)
