# Aetheris: Unified Multi-Domain Spatial Intelligence Infrastructure

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Protocol: Model Context Protocol](https://img.shields.io/badge/Protocol-MCP-green.svg)](https://modelcontextprotocol.io)

**Aetheris** is an autonomous multi-domain spatial intelligence infrastructure combining a 3D Model Context Protocol (MCP) server for AI agents with a photorealistic enterprise mission console for critical infrastructure defense.

---

## Repository Architecture

This monorepo is divided into two operational tiers:

```
aetheris/
├── packages/
│   └── earthmind-mcp/          # The Open 3D Spatial-RAG Protocol (MCP Server for AI Agents)
│       ├── src/
│       │   ├── index.js        # JSON-RPC 2.0 MCP Stdio Server
│       │   ├── spatialMath.js  # WGS84 Geodesic Math & Line-of-Sight Engine
│       │   └── anomalyRules.js # Multi-Domain Anomaly Engines
│       └── test/               # Geodetic verification test suite
│
└── gods-eye-view/              # The Photorealistic 3D Enterprise Console (CesiumJS)
    └── src/
        └── modules/            # Enterprise Cartridges
            ├── cartridgeRegistry.js       # Dynamic Module Manager
            └── sentinelMeshCartridge.js   # Subsea Fiber Cable & Maritime Defense
```

---

## 1. Developer Tier: EarthMind Spatial MCP (`packages/earthmind-mcp`)

Connects Large Language Models (Claude, Cursor, GPT-4o, Gemini) directly to 3D geodetic space:
* Great-Circle WGS84 distance and forward azimuth calculation.
* Planetary curvature-aware 3D Line-of-Sight (LOS) analysis.
* SentinelMesh subsea cable loitering and anchor-drag anomaly detection.
* OrbitalOps LEO satellite collision and debris deconfliction.
* GridTwin AI datacenter power load vs. regional electric substation thermal stress.

```bash
# Run unit tests
cd packages/earthmind-mcp
npm test
```

---

## 2. Enterprise Tier: Aetheris Mission Console (`gods-eye-view`)

A browser-native 3D virtual globe integrating:
* **CesiumJS & Google Photorealistic 3D Tiles**
* **Multi-Domain Telemetry:** ADS-B flights, AIS maritime vessels, CelesTrak satellite orbits, NASA FIRMS active fires, USGS earthquakes, and municipal CCTV camera viewsheds.
* **Modular Cartridges:** Enterprise clients can activate domain-specific watchstander cartridges on demand.

```bash
# Start local console
cd gods-eye-view
npm run dev
```

---

## License

MIT License. Designed for open research, commercial infrastructure defense, and physical-world AI agent development.
