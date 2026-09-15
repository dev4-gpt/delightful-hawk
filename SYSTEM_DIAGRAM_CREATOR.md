# SYSTEM DIAGRAM CREATOR: The Master Replication Playbook & Agentic Architecture Framework

> **A reusable, production-grade meta-framework and diagramming engine for replicating multi-repository, multi-agent, and spatial intelligence platforms across any project.**

---

## 1. Objective & How to Use This Framework

This playbook provides a deterministic, repeatable methodology for reverse-engineering, architecting, diagramming, and deploying enterprise-scale systems modeled after the **`delightful-hawk` (Parent Orchestrator)** and **`gods-eye-view` (Visual Engine Submodule)** dual-repository paradigm.

Whenever you embark on a new project or need to explain/replicate an existing codebase:
1. **Pass Section 7 (The Universal System Diagram Creator Prompt)** to your AI coding agent (Antigravity/AGY, Claude, or GPT).
2. Follow the **6-Phase Archify Methodology** (Section 2) to systematically decompose your repositories.
3. Apply the **Skills Integration Matrix** (Section 3) to enforce spatial depth, motion performance, and multi-agent safety.
4. Render the **8 Canonical Diagram Templates** (Section 4) in Mermaid and KaTeX.

---

## 2. The 6-Phase "Archify" Methodology

Every high-agency spatial, defense, or multi-agent platform follows a 6-phase architectural lifecycle:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              THE 6-PHASE ARCHIFY METHODOLOGY                           │
└────────────────────────────────────────────────────────────────────────────────────────┘
  Phase 1: Dual-Repo Decomposition ──► Separate Orchestration from Visual Execution Core
  Phase 2: Domain Ontology Mapping  ──► Identify Telemetry Streams (Space/Geo/Grid/AIS/AI)
  Phase 3: Zero-Client Edge Gateway ──► Build Serverless Edge Proxies (CORS/Rate-Limits)
  Phase 4: 3D Spatial & Math Model  ──► Formulate WGS84 Geodetic ◄► ECEF ◄► Spline Curves
  Phase 5: Agent Terminal & Telemetry──► Glassmorphic Spatial HUD + Interactive CLI
  Phase 6: Multi-Tier AI Waterfall  ──► Zero-Failure Cascading Inference (Cloud to Fallback)
```

### Phase 1: Dual-Repository Topology
- **Parent Repository (`orchestrator`)**: Holds cross-platform configs, multi-agent workspaces, documentation, benchmarks, and infrastructure-as-code.
- **Core Engine Submodule (`execution core`)**: Encapsulates 3D rendering (Cesium/Three.js), client UI, and serverless edge functions. Linked via `git submodule` so it can be deployed independently to Vercel/Cloudflare or embedded anywhere.

### Phase 2: Domain Ontology & Ingestion
- Map all upstream sensors (Space, Traffic, Maritime, Weather, Aircraft, Power Grid).
- Categorize data contracts: REST JSON, GeoJSON/GeoJSONL, Binary Protobuf Vector Tiles (`.pbf`), or Keplerian TLE orbital elements.

### Phase 3: Zero-Client Serverless Edge Gateway
- **Never expose raw third-party API keys to the browser client.**
- All calls route through `/api/*` serverless edge functions:
  - Cache responses at the edge CDN (`s-maxage=900, stale-while-revalidate=3600`).
  - Shield third-party APIs from browser request spikes.
  - Implement hard-coded snapshot fallback payloads (e.g., `launches-fallback.json`) so the UI never displays an empty globe or broken state during upstream API outages.

### Phase 4: Spatial Engine & Mathematical Modeling
- Ground all 3D features to physical reality using WGS84 ellipsoidal geometry.
- Enforce ground clamping (`Cesium.HeightReference.CLAMP_TO_GROUND`) to eliminate geoid undulation offset ($N \approx -34\text{m}$ in NY Harbor).
- Construct smooth $\mathcal{C}^1$-continuous cubic Hermite/Bézier splines for vehicle trajectories.

### Phase 5: Autonomous Multi-Agent Terminal & Telemetry Bus
- Integrate a floating glassmorphic tactical terminal with hardware-accelerated CSS3 transforms (`perspective: 1000px`).
- Stream live operational telemetry (sub-second latency counters, fused event rates).
- Provide quick-action chips and an interactive command prompt (`>`) for tactical queries.

### Phase 6: Universal Cloud AI Waterfall Router
- Build a cascading failover pipeline:
  $$\text{Primary (Gemini Flash)} \xrightarrow{\text{fail}} \text{Secondary (Groq LPU)} \xrightarrow{\text{fail}} \text{Tertiary (OpenRouter)} \xrightarrow{\text{fail}} \text{Hardware (NVIDIA NIM)} \xrightarrow{\text{fail}} \text{Deterministic Sensor Fallback}$$
- Guarantees 100% uptime for spatial intelligence summaries.

---

## 3. Skills Matrix & Agentic Directives

When building or diagramming with Antigravity, equip your agents with these specialized skills:

| Skill Name | Purpose & Trigger Scope | Critical Implementation Directives |
| :--- | :--- | :--- |
| **`antigravity-design-expert`** | Tactical HUD, glassmorphism, 3D CSS, spatial UI | - `backdrop-filter: blur(16px) saturate(180%)`<br/>- Resting perspective: `perspective(1000px) rotateX(1deg)`<br/>- Diffused multi-layer shadows + rim highlights<br/>- Pulse animations with `@keyframes` |
| **`google-antigravity-sdk`** | Multi-agent swarms, MCP servers, tool hooks | - Define agent roles & tool permissions<br/>- Standard Mode (ADC) vs Express Mode (API Key)<br/>- Structured telemetry logging & turn event listeners |
| **`3d-web-experience`** | CesiumJS, Three.js, R3F, Photorealistic 3D Tiles | - WGS84 ECEF coordinate transforms<br/>- `Cesium.PolylineGlowMaterialProperty` for arcs<br/>- Ground-clamping on all architectural GLTF models |
| **`fixing-motion-performance`** | 60 FPS animation auditing & GPU acceleration | - Animate **only** `transform` and `opacity`<br/>- Use `will-change: transform`<br/>- Avoid continuous layout thrashing or animating `box-shadow`/`filter` |
| **`modern-web-guidance`** | Modern HTML/CSS/JS best practices | - Native CSS nesting, container queries, `:has()`<br/>- Fetch Priority API, View Transitions API |
| **`graphify`** | Codebase relationships & architecture graphs | - Extract god nodes, dependencies, and call trees<br/>- Generate persistent knowledge graphs |
| **`accidental-data-loss-prevention`**| Cloud & repository security safety gate | - Mandatory user confirmation before destructive commands (`DROP`, `rm -rf`, force pushes) |

---

## 4. Canonical System Diagram Suite (Mermaid & KaTeX)

Use these 8 standardized diagram templates to visualize any complex system.

### Diagram 1: Dual-Repository Symbiosis & Codebase Topology
```mermaid
graph TD
    subgraph Parent_Repo["Parent Repository: delightful-hawk (Git Orchestrator)"]
        P_Apps["apps/ (Micro-frontends & Tools)"]
        P_Embed["synaptic-ir/ (Vector Search & Embeddings)"]
        P_Deploy["deploy/ (Terraform, Docker & K8s)"]
        P_Docs["Documentation & Blueprints"]
        Submodule_Ref["gods-eye-view/ (Git Submodule Pointer)"]
    end

    subgraph Child_Submodule["Core Visual Submodule: gods-eye-view (Execution Engine)"]
        C_API["api/ (Vercel Serverless Edge Functions)"]
        C_Src["src/ (Cesium 3D Planetary Engine)"]
        C_Data["src/data/ (Multi-Domain Sensor Modules)"]
        C_UI["src/modules/ (Antigravity Coordinator Terminal)"]
        C_Build["vite.config.js & vercel.json"]
    end

    Submodule_Ref ===>|Pointers to branch: aetheris-enterprise| Child_Submodule
    Parent_Repo -.->|Orchestrates CI/CD & Deploy| Vercel_Prod["Vercel Global Edge CDN"]
    Child_Submodule -.->|Builds & Bundles| Vercel_Prod
```

---

### Diagram 2: Synoptic End-to-End System Flow
```mermaid
graph TB
    subgraph Sensors["External Telemetry & Sensor Mesh"]
        S_Space["SpaceDevs LL2 (Orbital Launches)"]
        S_Traffic["TomTom API (Live Vector Flow)"]
        S_Aero["OpenSky (ADS-B Air Traffic)"]
        S_Sea["AIS & TeleGeography (Vessels & Subsea Cables)"]
        S_Env["NASA FIRMS (Thermal Hotspots / Wildfires)"]
        S_3D["Google Maps Platform (Photorealistic 3D Tiles)"]
    end

    subgraph Edge["Vercel Serverless Edge Gateway (iad1)"]
        E_Launch["/api/launches (Proxy + Edge Cache + Snapshot)"]
        E_Flow["/api/tomtom/flow (PBF Tile Streaming)"]
        E_Status["/api/tomtom/status (Quota Monitor)"]
        E_AI["/api/openai/hud-summary (AI Waterfall Router)"]
    end

    subgraph Client["Browser Client (CesiumJS + Antigravity Terminal)"]
        Globe["CesiumJS 3D WebGL Planetary Canvas"]
        Terminal["Antigravity Glassmorphic Terminal"]
        HUD["Cockpit Attitude Director HUD"]
    end

    S_Space --> E_Launch --> Globe
    S_Traffic --> E_Flow --> Globe
    S_Traffic --> E_Status --> Terminal
    S_3D --> Globe
    S_Aero --> HUD
    S_Sea --> Globe
    S_Env --> Globe

    Terminal <-->|Tactical Commands & Spatial FlyTos| Globe
    Terminal --> E_AI
```

---

### Diagram 3: Edge Proxy & Binary Vector Tile Streaming Sequence
```mermaid
sequenceDiagram
    autonumber
    actor User as Operator
    participant Client as 3D Spatial Canvas
    participant Edge as Serverless Edge (/api/tomtom/flow)
    participant Upstream as TomTom Vector Flow API

    User->>Client: Pan / Zoom into Metro (Tokyo / Manhattan)
    Client->>Edge: GET /api/tomtom/flow/12/1000/1600.pbf
    alt Cached at Edge CDN (Hit)
        Edge-->>Client: HTTP 200 Binary Protobuf (.pbf)
    else Cache Miss / Origin Fetch
        Edge->>Upstream: GET /traffic/map/4/tile/flow/vector/...pbf?key=SECRET
        Upstream-->>Edge: Binary PBF Stream
        Edge-->>Client: HTTP 200 Stream (application/x-protobuf)
    end
    Client->>Client: Decode PBF Roads & Compute traffic_level
    Client->>Client: Apply flowCongestionGradient(level)
    Client->>User: Render 11px Pulsing Congestion Corridors
```

---

### Diagram 4: Universal Cloud AI Waterfall Failover Matrix
```mermaid
sequenceDiagram
    autonumber
    participant UI as Coordinator HUD
    participant Edge as /api/openai/hud-summary
    participant Gemini as Google Gemini Flash
    participant Groq as Groq LPU (Qwen 27B)
    participant OpenRouter as OpenRouter Free Tier
    participant NIM as NVIDIA NIM (Llama 3.1)
    participant Fallback as Local Sensor Fallback Engine

    UI->>Edge: POST { domainData, activeCartridge }
    rect rgb(20, 40, 30)
        Edge->>Gemini: Tier 1: Gemini Flash Request
        alt Gemini 200 OK
            Gemini-->>Edge: Response Text
            Edge-->>UI: { summary, provider: "Gemini" }
        else 429 Rate Limit / Quota Exhausted
            Gemini-->>Edge: Error 429
        end
    end
    rect rgb(40, 30, 20)
        Edge->>Groq: Tier 2: Groq LPU Request
        alt Groq 200 OK
            Groq-->>Edge: Response Text
            Edge-->>UI: { summary, provider: "Groq" }
        else Groq Unavailable
            Groq-->>Edge: Error
        end
    end
    rect rgb(30, 20, 40)
        Edge->>OpenRouter: Tier 3: OpenRouter Free Gateway
        alt OpenRouter 200 OK
            OpenRouter-->>Edge: Response Text
            Edge-->>UI: { summary, provider: "OpenRouter" }
        else OpenRouter Fails
            OpenRouter-->>Edge: Error
        end
    end
    rect rgb(20, 30, 40)
        Edge->>NIM: Tier 4: NVIDIA NIM Enterprise API
        alt NIM 200 OK
            NIM-->>Edge: Response Text
            Edge-->>UI: { summary, provider: "NVIDIA NIM" }
        else NIM Fails
            NIM-->>Edge: Error
        end
    end
    rect rgb(30, 30, 30)
        Edge->>Fallback: Tier 5: Deterministic Sensor Synthesis
        Fallback-->>Edge: Synthesized Telemetry Digest
        Edge-->>UI: { summary, provider: "Sensor Fallback" }
    end
```

---

### Diagram 5: 3D Orbital Ascent Spline & Kinematic Milestones

The trajectory curves from the launch pad into orbit using geodetic-to-ECEF transformation and cubic Hermite interpolation:

$$\mathbf{P}(t) = (1-t)^3 \mathbf{P}_{\text{pad}} + 3(1-t)^2 t \mathbf{C}_1 + 3(1-t)t^2 \mathbf{C}_2 + t^3 \mathbf{P}_{\text{insertion}}$$

```mermaid
graph LR
    P0["Launch Pad<br/>(t = 0.00, h = 0 km)"] -->|"T+1:12"| MQ["MAX-Q (Max Dynamic Pressure)<br/>(t = 0.14, h ≈ 13 km)"]
    MQ -->|"T+2:28"| MECO["MECO (Main Engine Cutoff)<br/>(t = 0.35, h ≈ 72 km)"]
    MECO -->|"T+2:36"| SES["SES-1 (Stage 2 Ignition)<br/>(t = 0.38, h ≈ 80 km)"]
    SES -->|"T+8:45"| SECO["SECO (Orbital Insertion)<br/>(t = 0.94, h ≈ 210 km)"]
    SECO --> ORBIT["Orbital Track (LEO)<br/>SGP4/SDP4 Keplerian Propagation"]

    classDef stage fill:#0a101a,stroke:#00f0ff,stroke-width:2px,color:#e0f0ff;
    class P0,MQ,MECO,SES,SECO,ORBIT stage;
```

---

### Diagram 6: TomTom Congestion Heatmap Dynamic Density Pipeline
```mermaid
graph TD
    Raw["TomTom PBF Road Segment<br/>level = current_speed / free_flow_speed"] --> Grade{Congestion Grade}
    Grade -->|"level >= 0.85"| C1["Emerald Green (#10b981)<br/>Free Flowing"]
    Grade -->|"0.70 <= level < 0.85"| C2["Chartreuse (#84cc16)<br/>Steady Arterial"]
    Grade -->|"0.55 <= level < 0.70"| C3["Electric Amber (#f59e0b)<br/>Moderate Slowdown"]
    Grade -->|"0.35 <= level < 0.55"| C4["Hot Crimson (#ef4444)<br/>Heavy Congestion"]
    Grade -->|"level < 0.35"| C5["Deep Blood Red (#991b1b)<br/>Severe Gridlock"]

    C1 --> Dynamics["Particle & Flow Dynamics Engine"]
    C2 --> Dynamics
    C3 --> Dynamics
    C4 --> Dynamics
    C5 --> Dynamics

    Dynamics --> D1["Density Multiplier:<br/>D = min(4.0, 1 / max(level, 0.25))"]
    Dynamics --> D2["Speed Scale Floor:<br/>S = max(0.15, min(1.0, level))"]
    Dynamics --> D3["Heat Corridors:<br/>Jam: 11px Polyline (Pulsing Alpha 0.65 ± 0.25)<br/>Slow: 5px Polyline (Static Alpha 0.35)"]
```

---

### Diagram 7: Antigravity Coordinator Component & Telemetry Bus
```mermaid
classDiagram
    class AntigravityCoordinatorTerminal {
        -DOMElement container
        -DOMElement streamContent
        -DOMElement chipsBar
        -DOMElement commandInput
        -Object telemetry
        +initAgentBridge(viewer, registry)
        +addAgentBridgeMessage(msg, color)
        +executeTacticalCommand(label, detail)
        +handleUserTerminalCommand(rawQuery)
        +updateTelemetryPills()
    }

    class CartridgeRegistry {
        +on(event, handler)
        +emit(event, payload)
        +activeCartridge
    }

    class Cesium3DEngine {
        +flyTo(coords, orientation)
        +highlightTrajectory(launchId)
        +focusTrafficCongestion()
    }

    class AIWaterfallRouter {
        +dispatchSummary(payload)
        +synthesizeEvent(evt)
    }

    AntigravityCoordinatorTerminal --> CartridgeRegistry : Listens to domain activations
    AntigravityCoordinatorTerminal --> Cesium3DEngine : Executes spatial navigation
    AntigravityCoordinatorTerminal --> AIWaterfallRouter : Triggers live AI synthesis
```

---

### Diagram 8: CI/CD & Production Edge Deployment Architecture
```mermaid
graph LR
    subgraph Git_Source["GitHub Version Control"]
        Parent["dev4-gpt/delightful-hawk (master)"]
        Child["dev4-gpt/gods-eye-view (aetheris-enterprise)"]
    end

    subgraph Build_Pipeline["Vercel Production Build System"]
        Sub_Init["git submodule update --init"]
        Vite_Build["vite build (Rollup Chunking + Asset Injection)"]
        Edge_Deploy["Vercel Serverless Functions Bundler"]
    end

    subgraph Global_Edge["Vercel Anycast Edge Network (iad1)"]
        CDN["Edge CDN Caching (s-maxage=900)"]
        Functions["Serverless Functions (/api/*)"]
        Prod_URL["https://aetheris-spatial.vercel.app"]
    end

    Parent --> Sub_Init
    Child --> Sub_Init
    Sub_Init --> Vite_Build
    Sub_Init --> Edge_Deploy
    Vite_Build --> CDN
    Edge_Deploy --> Functions
    CDN --> Prod_URL
    Functions --> Prod_URL
```

---

## 5. Architectural Verification & Contract Matrix

To verify system compliance in any replicated project, run this test harness:

| Subsystem | Command / Probe | Success Criteria |
| :--- | :--- | :--- |
| **Unit Test Suite** | `node --test src/data/trafficFlowStyle.test.mjs` | 16/16 tests pass |
| **Orbital Dynamics** | `node --test src/data/rocketLaunches.test.mjs` | 54/54 tests pass |
| **Full Regression** | `npm test` | 2,709+ tests pass, 0 failures |
| **Bundle Integrity**| `npm run build` | Vite builds in $< 6\text{s}$ |
| **Terminal DOM**    | Headless Puppeteer inspection | `agent-tactical-drawer` present with `blur(16px)` |
| **Edge API Latency**| `curl -I https://aetheris-spatial.vercel.app/api/tomtom/status` | `HTTP/2 200`, latency $< 50\text{ms}$ |
| **AI Waterfall**    | `curl -X POST https://.../api/openai/hud-summary` | Returns valid JSON with active provider |

---

## 6. Replication Step-by-Step Runbook for Any Project

To instantiate this architecture on a new project from scratch:

```bash
# 1. Initialize Parent Orchestrator Repository
git init my-platform
cd my-platform
git remote add origin git@github.com:your-org/my-platform.git

# 2. Add Core Visual/Engine Repository as Submodule
git submodule add -b main git@github.com:your-org/my-engine.git engine
git submodule update --init --recursive

# 3. Configure Serverless Edge Routing (vercel.json)
cat << 'EOF' > engine/vercel.json
{
  "rewrites": [
    { "source": "/api/launches", "destination": "/api/launches.js" },
    { "source": "/api/tomtom/flow/(.*)", "destination": "/api/tomtom/flow.js" },
    { "source": "/api/tomtom/status", "destination": "/api/tomtom/status.js" },
    { "source": "/api/openai/hud-summary", "destination": "/api/openai/hud-summary.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
EOF

# 4. Install Dependencies & Build
cd engine
npm install
npm run build

# 5. Deploy Directly to Vercel Production
npx vercel --prod --yes
```

---

## 7. The Universal System Diagram Creator Prompt (Copy & Paste)

> **Paste the prompt below into any AI agent session to automatically generate this entire specification and diagram suite for any arbitrary project:**

```markdown
You are an elite Principal Systems Architect and Geospatial Visualizer using the "Aetheris Archify & Synoptic Architecture Framework".

Analyze the provided codebase and repositories, then generate a comprehensive `SYSTEM_ARCHITECTURE_BLUEPRINT.md` containing:
1. Executive Summary & Archify Philosophy (Zero-client-dependency, cloud edge, resilient AI).
2. Dual-Repository / Multi-Repository Topology (Host orchestrator vs execution core).
3. Complete 8-Diagram Canonical Suite in valid Mermaid syntax:
   - Diagram 1: Dual-Repository Symbiosis & Codebase Topology
   - Diagram 2: Synoptic End-to-End System Flow (Sensors -> Edge -> 3D WebGL Client)
   - Diagram 3: Edge Proxy & Binary Streaming Sequence Diagram
   - Diagram 4: Universal AI Waterfall Cascading Sequence Diagram (with fallback tiers)
   - Diagram 5: 3D Spatial & Mathematical Formulation (KaTeX equations + Mermaid progression)
   - Diagram 6: Dynamic Data Heatmap & Density Modulation Flowchart
   - Diagram 7: Multi-Agent Coordinator Component & Telemetry Class Diagram
   - Diagram 8: CI/CD & Production Edge Deployment Architecture
4. Skills Matrix detailing:
   - antigravity-design-expert (glassmorphic styling, pulse keyframes, 3D CSS)
   - google-antigravity-sdk (multi-agent orchestration, telemetry logging)
   - 3d-web-experience (WGS84 geodetic, ECEF, ground-clamping)
   - fixing-motion-performance (compositor-only properties, will-change: transform)
5. Step-by-Step Replication Runbook with terminal commands for cloning, configuring environment variables, running diagnostics, building with Vite, and deploying serverless edge functions to Vercel.
6. Verification Test Matrix with exact assertions and commands.

Enforce strict production quality, authentic mathematical rigor, and 100% syntactically valid Mermaid diagrams.
```
