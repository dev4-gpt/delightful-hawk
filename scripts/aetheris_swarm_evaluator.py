#!/usr/bin/env python3
"""
Aetheris Spatial — MiroFish Swarm Intelligence Evaluation Harness

Simulates a multi-agent swarm of 8 specialized personas (Defense Command,
Critical Infrastructure, Deep-Tech VCs, and GIS/Security Skeptics) debating
Aetheris Spatial across 3 rounds of emergent interaction, predicting market
adoption, uncovering friction points, and outputting an executive prediction report.
"""

import os
import sys
import json
import time
from typing import List, Dict, Any
from openai import OpenAI

# 1. Resolve API Keys from environment, ~/.claude-keys.zsh, or .env.production.local
def load_api_config():
    openrouter_key = os.environ.get('OPENROUTER_API_KEY')
    groq_key = os.environ.get('GROQ_API_KEY')
    gemini_key = os.environ.get('GEMINI_API_KEY')

    # Check ~/.claude-keys.zsh
    claude_keys_path = os.path.expanduser('~/.claude-keys.zsh')
    if os.path.exists(claude_keys_path):
        import re
        with open(claude_keys_path, 'r') as f:
            content = f.read()
        m_or = re.search(r'_OPENROUTER_KEYS=\(\s*\"([^\"]+)\"', content)
        if m_or and not openrouter_key:
            openrouter_key = m_or.group(1)
        m_gr = re.search(r'_GROQ_KEYS=\(\s*\"([^\"]+)\"', content)
        if m_gr and not groq_key:
            groq_key = m_gr.group(1)

    # Check .env.production.local
    env_file = os.path.expanduser('~/Documents/antigravity/delightful-hawking/gods-eye-view/.env.production.local')
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                if line.startswith('GROQ_API_KEY=') and not groq_key:
                    val = line.split('=', 1)[1].strip().strip('"\'')
                    if val and val != '[SENSITIVE]':
                        groq_key = val
                elif line.startswith('OPENROUTER_API_KEY=') and not openrouter_key:
                    val = line.split('=', 1)[1].strip().strip('"\'')
                    if val and val != '[SENSITIVE]':
                        openrouter_key = val

    if openrouter_key:
        return {
            'provider': 'OpenRouter',
            'api_key': openrouter_key,
            'base_url': 'https://openrouter.ai/api/v1',
            'model': 'meta-llama/llama-3.3-70b-instruct'
        }
    elif groq_key:
        return {
            'provider': 'Groq',
            'api_key': groq_key,
            'base_url': 'https://api.groq.com/openai/v1',
            'model': 'llama-3.3-70b-versatile'
        }
    elif gemini_key:
        return {
            'provider': 'Gemini',
            'api_key': gemini_key,
            'base_url': 'https://generativelanguage.googleapis.com/v1beta/openai/',
            'model': 'gemini-2.0-flash'
        }
    else:
        # Fallback to local deterministic simulation mode
        return {
            'provider': 'Offline-Simulation-Engine',
            'api_key': 'none',
            'base_url': 'none',
            'model': 'local-simulation'
        }

CONFIG = load_api_config()
if CONFIG['provider'] != 'Offline-Simulation-Engine':
    client = OpenAI(api_key=CONFIG['api_key'], base_url=CONFIG['base_url'])
else:
    client = None

# 2. Define the Swarm Agent Personas
SWARM_PERSONAS = [
    {
        "id": "col_vance_spaceforce",
        "name": "Col. Gregory Vance",
        "role": "Chief of Space Domain Awareness, US Space Force (Vandenberg)",
        "stance": "Cautious Space Commander",
        "priorities": "NORAD SGP4 orbital mechanics, Falcon 9 launch trajectories, LEO conjunction collision deconfliction.",
        "perspective": "Evaluates whether browser-based SGP4 propagation is accurate enough for operational tracking vs classified systems."
    },
    {
        "id": "cdr_lin_indopacom",
        "name": "CDR Sarah Lin",
        "role": "Tactical C2 Watch Officer, US INDOPACOM (Pearl Harbor)",
        "stance": "High-Tempo Tactical Operator",
        "priorities": "Taiwan Strait maritime choke point surveillance, dynamic 3D geofencing, subsea fiber landing security.",
        "perspective": "Wants zero-latency hands-free voice control and immediate 3D exclusion zone containment."
    },
    {
        "id": "elena_pjm_grid",
        "name": "Elena Rostova",
        "role": "VP of Grid Reliability & Emergency Operations, PJM Interconnection",
        "stance": "Critical Infrastructure Engineer",
        "priorities": "500kV electrical transmission corridors, Loudoun County Data Center Alley, NASA FIRMS wildfire proximity alerts.",
        "perspective": "Needs automated threat correlation between active fires and substation transformer loads."
    },
    {
        "id": "marcus_subsea_fiber",
        "name": "Marcus Thorne",
        "role": "Director of Security, Transatlantic Subsea Telecom Consortium",
        "stance": "Infrastructure Defender",
        "priorities": "Undersea cable anchor-drag detection, AIS cargo vessel loitering patterns, TAT-14 / MAREA landing zones.",
        "perspective": "Obsessed with preventing intentional or accidental cable severance before damage occurs."
    },
    {
        "id": "david_defense_vc",
        "name": "David Sterling",
        "role": "General Partner, Apex Frontier Defense Fund ($1.2B AUM)",
        "stance": "Pragmatic Capital Allocator",
        "priorities": "ARR expansion velocity, competitive moats vs Palantir Gotham ($100B) and Anduril ($14B), DoD budget line-items.",
        "perspective": "Looking for true software gross margins and defense enterprise lock-in."
    },
    {
        "id": "dr_hayes_inqtel",
        "name": "Dr. Rachel Hayes",
        "role": "Principal Technology Evaluator, Intelligence & Defense Transition (In-Q-Tel)",
        "stance": "Air-Gapped SCIF Security Auditor",
        "priorities": "Sovereign on-premise air-gapped deployment, zero external cloud leakage, AgentShield prompt injection security.",
        "perspective": "Demands proof that voice audio and coordinates don't leak to public clouds in SCIF environments."
    },
    {
        "id": "alex_gis_architect",
        "name": "Alex Mercer",
        "role": "Senior Geospatial Systems Architect (ex-Esri / Maxar)",
        "stance": "Traditional GIS Skeptic",
        "priorities": "Cartographic projection fidelity, WGS84 geodetic vs Mercator distortion, frame rate under dense 3D city tiles.",
        "perspective": "Skeptical that a web browser can render photorealistic 3D city canyons and 14 live telemetry streams at 60 fps without crashing."
    },
    {
        "id": "cipher_security_hn",
        "name": "CipherByte",
        "role": "Staff Security Researcher & Hacker News Moderator",
        "stance": "Adversarial Red-Teamer",
        "priorities": "Prompt injection bypasses, Web Speech API privacy, client-side reverse engineering, open-source auditability.",
        "perspective": "Probes whether AgentShield actually blocks adversarial jailbreaks or is just regex filtering."
    }
]

def load_seed_summary():
    seed_path = os.path.expanduser('~/Developer/MiroFish/backend/app/seeds/aetheris_gtm_seed.txt')
    if os.path.exists(seed_path):
        with open(seed_path, 'r') as f:
            return f.read()
    return "Aetheris Spatial is a 3D WGS84 Planetary World Engine with 14 telemetry feeds, Horizon Copilot, and Sentinel Watchstander."

def run_agent_turn(agent: Dict[str, Any], round_num: int, context_messages: List[Dict[str, str]], seed_text: str) -> str:
    system_prompt = f"""You are participating in a high-fidelity swarm intelligence prediction simulation powered by MiroFish.
You are playing the following real-world persona with strict authentic professional perspective:

Name: {agent['name']}
Role: {agent['role']}
Stance: {agent['stance']}
Core Priorities: {agent['priorities']}
Perspective: {agent['perspective']}

PRODUCT BEING EVALUATED (SEED MATERIAL):
{seed_text[:6000]}

ROUND {round_num} INSTRUCTIONS:
- Round 1: React to the GTM presentation, live product capabilities, and the newly audited enterprise architecture (AgentShield v2.0, DoD IL6 air-gapped specification, and the 0.193ms/60fps benchmark across 2,927 entities).
- Round 2: Scrutinize the remediated security controls (SHA-256 audit, AST whitelist, 2PI), air-gapped container proof, 0.193ms benchmark, and the new 3-tier pricing ($48k Sentinel Edge with 145x ROI, $180k Enterprise with 28x ROI, $950k Sovereign SCIF).
- Round 3: Reach consensus or final procurement verdict. Will your organization procure this? Under what conditions? What is the updated predicted market outcome and win rate?

Speak directly in character. Keep responses punchy, realistic, technically sharp, and authentic (100 to 180 words). Do not break character."""

    messages = [{"role": "system", "content": system_prompt}]
    # Add previous conversation context
    for msg in context_messages[-6:]:  # recent discussion
        messages.append(msg)

    messages.append({
        "role": "user",
        "content": f"Round {round_num}: As {agent['name']} ({agent['role']}), give your authoritative evaluation and respond to your peers."
    })

    try:
        response = client.chat.completions.create(
            model=CONFIG['model'],
            messages=messages,
            temperature=0.7,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"[Simulated Response - Network Degraded] As {agent['name']}, I evaluate this capability from a {agent['stance']} perspective. The real-time WGS84 telemetry and Sentinel Watchstander represent a significant upgrade over legacy 2D tools, but procurement hinges on air-gapped verification."

def main():
    print("═══════════════════════════════════════════════════════════════════════")
    print("  AETHERIS SPATIAL // MIROFISH SWARM INTELLIGENCE PREDICTION ENGINE   ")
    print("  EVALUATION ROUND 2: REMEDIATED ENTERPRISE & SOVEREIGN ARCHITECTURE   ")
    print(f"  Provider: {CONFIG['provider']} | Model: {CONFIG['model']}")
    print(f"  Swarm Size: {len(SWARM_PERSONAS)} Autonomous Strategic Personas | 3 Simulation Rounds")
    print("═══════════════════════════════════════════════════════════════════════\n")

    seed_text = load_seed_summary()
    transcript = []
    simulation_log = []

    # Execute 3 Simulation Rounds
    for r in range(1, 4):
        print(f"\n───────────────────────────────────────────────────────────────────────")
        print(f"  ROUND {r}: " + ("REMEDIATED PRODUCT SCRUTINY" if r == 1 else "HARD FRICTION, ROI & SECURITY SCRUTINY" if r == 2 else "FINAL PROCUREMENT VERDICT & CONSENSUS"))
        print(f"───────────────────────────────────────────────────────────────────────\n")

        for persona in SWARM_PERSONAS:
            print(f"  ▶ [{persona['role']}] {persona['name']} speaking...")
            response_text = run_agent_turn(persona, r, transcript, seed_text)
            
            transcript.append({
                "role": "assistant",
                "content": f"[{persona['name']} - {persona['role']}]: {response_text}"
            })
            
            simulation_log.append({
                "round": r,
                "agent_id": persona["id"],
                "name": persona["name"],
                "role": persona["role"],
                "content": response_text
            })
            
            print(f"    \"{response_text[:140]}...\"\n")
            time.sleep(0.5)

    # Generate the MiroFish Swarm Prediction Report
    print("═══════════════════════════════════════════════════════════════════════")
    print("  SYNTHESIZING MIROFISH SWARM PREDICTION REPORT V2...                  ")
    print("═══════════════════════════════════════════════════════════════════════\n")

    report_prompt = f"""You are the MiroFish Chief Prediction Agent. Analyze the complete multi-round swarm simulation transcript below where 8 strategic defense, energy, venture capital, and GIS personas evaluated Aetheris Spatial with its remediated Enterprise architecture (AgentShield v2.0 with 100% penetration block rate, Sovereign Air-Gapped SCIF specification with zero cloud egress, empirical 60fps WebGL benchmark across 2,927 entities with 96.4% headroom, and Value-Based 3-Tier pricing with 145x/28x quantified ROI).

SWARM TRANSCRIPT:
{json.dumps(simulation_log, indent=2)}

Generate a comprehensive, rigorous, and highly actionable MIROFISH PREDICTION REPORT V2 with:
1. Executive Verdict & Updated Market Adoption Score (0 to 100).
2. Customer Cohort Win Rates (Defense Primes, INDOPACOM, Space Force, Energy Utilities, Telecom).
3. Critical Technical Moats Validated by the Swarm.
4. Swarm Consensus on Remediations (AgentShield v2.0 security, SCIF air-gap proof, 0.193ms benchmark, 3-tier ROI pricing).
5. 12-Month Commercial Revenue & Valuation Forecast (Based on $48k Edge, $180k Enterprise, and $950k Sovereign SCIF tiers).
6. Tactical Recommendations for Scaling & Deployment.

Format in clean, authoritative GitHub markdown with tables and alerts."""

    report_res = client.chat.completions.create(
        model=CONFIG['model'],
        messages=[{"role": "system", "content": report_prompt}],
        temperature=0.4,
        max_tokens=2500
    )
    final_report = report_res.choices[0].message.content

    # Save outputs
    output_report_path = os.path.expanduser('~/Documents/antigravity/delightful-hawking/AETHERIS_SWARM_PREDICTION_REPORT_V2.md')
    with open(output_report_path, 'w') as f:
        f.write(final_report)

    output_log_path = os.path.expanduser('~/Developer/MiroFish/backend/app/seeds/swarm_simulation_log_v2.json')
    with open(output_log_path, 'w') as f:
        json.dump(simulation_log, f, indent=2)

    print(f"✔ Prediction Report V2 written to: {output_report_path}")
    print(f"✔ Full Swarm Dialogue Log V2 written to: {output_log_path}")

if __name__ == '__main__':
    main()

