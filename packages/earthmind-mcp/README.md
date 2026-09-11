# EarthMind 3D Spatial MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Protocol: Model Context Protocol](https://img.shields.io/badge/Protocol-MCP-green.svg)](https://modelcontextprotocol.io)

**EarthMind** is the open 3D Spatial Model Context Protocol (MCP) server that gives Large Language Models (Claude, GPT-4o, Cursor, Gemini) native 3D spatial reasoning, geodetic line-of-sight analysis, and multi-domain critical infrastructure watchstander capabilities.

Built on WGS84 ellipsoidal geometry and inspired by the open-source **God's Eye View** engine, EarthMind turns LLMs into physical-world situational awareness agents.

---

## Features

* **3D Geodesic Math:** High-precision Great-Circle distance, azimuth bearing, and ECEF (Earth-Centered Earth-Fixed) 3D coordinate transformations.
* **Curvature-Aware Line of Sight (LOS):** Evaluates geometric visibility between observers (e.g. ground stations, drones, aircraft) taking into account planetary curvature and elevation profiles.
* **SentinelMesh Watchstander:** Detects anomalous marine vessels loitering, slowing, or dragging anchors over subsea fiber-optic telecommunication cables and landing points.
* **OrbitalOps Conjunction Engine:** Computes close-approach distance between satellites and space debris in Low Earth Orbit (LEO), issuing automated collision maneuver advisories.
* **GridTwin Thermal Strain Watchstander:** Correlates AI datacenter power consumption (MW) with regional electric substation capacity and ambient temperature to predict grid overloads.
* **Cinematic Camera Choreography:** Generates smooth 3D camera waypoints, headings, pitch angles, and flight durations for virtual globe (CesiumJS) fly-throughs.

---

## Quick Start: Connecting to Claude Desktop or Cursor

### 1. Claude Desktop Setup
Add EarthMind to your `claude_desktop_config.json` using the published NPM package:

```json
{
  "mcpServers": {
    "earthmind-spatial": {
      "command": "npx",
      "args": [
        "-y",
        "@aetheris/earthmind-mcp"
      ]
    }
  }
}
```

Restart Claude Desktop, and your AI assistant will immediately possess 3D geospatial intelligence tools!

### 2. Cursor Configuration

In your Cursor IDE settings, navigate to Features -> MCP, and add a new MCP server:
- **Type:** `command`
- **Name:** `earthmind`
- **Command:** `npx -y @aetheris/earthmind-mcp`

---

## Exposed MCP Tools

| Tool Name | Description | Example Query |
| :--- | :--- | :--- |
| `calculate_distance_and_heading` | Geodesic distance (m, km, NM) and forward azimuth | *"What is the exact heading and distance from London to Tokyo?"* |
| `evaluate_line_of_sight` | 3D Line-of-sight considering Earth curvature & altitude | *"Can a drone at 150m AGL see a vessel 45km offshore?"* |
| `detect_subsea_cable_threat` | SentinelMesh anchor-drag / loitering threat evaluator | *"Check if vessel MMSI 211839 is loitering over TAT-14."* |
| `evaluate_orbital_conjunction` | LEO satellite collision and debris deconfliction | *"Evaluate conjunction risk between Starlink-1029 and Cosmos debris."* |
| `evaluate_datacenter_grid_strain` | Grid overload and ambient thermal stress analysis | *"Assess substation strain for a 120MW datacenter during a 40°C heatwave."* |
| `generate_cinematic_camera_path` | Generates 3D camera flight waypoints for CesiumJS | *"Generate a cinematic fly-to sequence from San Francisco to Honolulu."* |

---

## Running Unit Tests

```bash
npm test
```

All geodetic transformations and domain anomaly engines are rigorously verified against standard WGS84 geodetic benchmarks.

---

## License

MIT License. Designed for community contribution, research, and enterprise spatial intelligence.
