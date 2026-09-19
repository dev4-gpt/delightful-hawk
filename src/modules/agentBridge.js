/**
 * Aetheris Horizon — Sovereign Spatial Copilot & Evolution Coordinator
 * 
 * Floating glassmorphic terminal streaming live agent telemetry, spatial sensor fusion,
 * autonomous threat detection (Sentinel Watchstander), voice comms (Web Speech + VHF radio squelch),
 * and real-time 3D camera/layer command dispatch across Aetheris domains.
 * 
 * @module agentBridge
 */

import { SpatialCopilot, STRATEGIC_TARGETS } from '../ai/spatialCopilot.js';
import { SentinelWatchstander } from '../ai/sitrepEngine.js';
import { TacticalVoiceOperator } from '../ai/voiceComms.js';

let _bridgeContent = null;
let _viewer = null;
let _commandInput = null;
let _micBtn = null;
let _copilot = null;
let _watchstander = null;
let _voiceOperator = null;

// Telemetry counters
let _telemetry = {
    status: 'NOMINAL',
    latencyMs: 14,
    activeAgents: 6,
    fusedEvents: 168,
    defcon: 3,
    domainPills: ['ORBIT', 'TRAFFIC', 'GRID', 'AIS', 'FIRMS', 'AIR']
};

/**
 * Append a tactical message to the Coordinator Terminal feed.
 * @param {string} msg 
 * @param {string|null} color 
 */
export function addAgentBridgeMessage(msg, color = null) {
    if (typeof document === 'undefined') return;
    const content = _bridgeContent || document.getElementById('agent-bridge-content');
    if (!content) return;

    _telemetry.fusedEvents++;
    updateTelemetryPills();

    const line = document.createElement('div');
    line.className = 'agent-terminal-line';
    line.style.cssText = `
        margin: 3px 0;
        line-height: 1.4;
        font-size: 11.5px;
        word-break: break-word;
        opacity: 0;
        transform: translateY(3px);
        transition: opacity 0.2s ease, transform 0.2s ease;
    `;

    let computedColor = color;
    if (!computedColor) {
        if (msg.includes('CRITICAL') || msg.includes('ALERT') || msg.includes('OVERLOAD') || msg.includes('JAM') || msg.includes('DEFCON 1') || msg.includes('DEFCON 2')) {
            computedColor = '#ff4d4f';
        } else if (msg.includes('WARNING') || msg.includes('ELEVATED') || msg.includes('SLOW') || msg.includes('DEFCON 3')) {
            computedColor = '#ffa940';
        } else if (msg.includes('PULSE') || msg.includes('TELEMETRY') || msg.includes('COORDINATOR') || msg.includes('SITREP')) {
            computedColor = '#00f0ff';
        } else if (msg.includes('DOMAIN: SPACE') || msg.includes('ORBIT') || msg.includes('FALCON')) {
            computedColor = '#c084fc';
        } else if (msg.includes('DOMAIN: MARITIME') || msg.includes('AIS')) {
            computedColor = '#60a5fa';
        } else if (msg.includes('DOMAIN: ENERGY') || msg.includes('GRID')) {
            computedColor = '#f59e0b';
        } else if (msg.includes('DOMAIN: DISASTER') || msg.includes('GEO-RISK') || msg.includes('FIRMS')) {
            computedColor = '#f43f5e';
        } else if (msg.includes('TRAFFIC') || msg.includes('FLOW')) {
            computedColor = '#10b981';
        } else if (msg.includes('USER COMMAND') || msg.includes('>') || msg.includes('VOICE IN')) {
            computedColor = '#67e8f9';
        } else {
            computedColor = '#94a3b8';
        }
    }

    line.style.color = computedColor;
    
    // Time badge
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0').slice(0, 2);
    line.innerHTML = `<span style="color: rgba(255,255,255,0.3); font-size: 10px; margin-right: 6px;">${timeStr}</span>${escapeHtml(msg).replace(/\n/g, '<br/>&nbsp;&nbsp;')}`;

    content.appendChild(line);

    requestAnimationFrame(() => {
        line.style.opacity = '1';
        line.style.transform = 'translateY(0)';
    });

    content.scrollTop = content.scrollHeight;

    if (content.children.length > 250) {
        content.removeChild(content.firstChild);
    }
}

function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}

function updateTelemetryPills() {
    const latEl = document.getElementById('ag-telemetry-latency');
    if (latEl) {
        _telemetry.latencyMs = Math.max(9, Math.min(22, _telemetry.latencyMs + Math.floor(Math.random() * 5 - 2)));
        latEl.innerText = `${_telemetry.latencyMs}ms`;
    }
    const countEl = document.getElementById('ag-telemetry-events');
    if (countEl) {
        countEl.innerText = `${_telemetry.fusedEvents} EVT`;
    }
    const defconEl = document.getElementById('ag-telemetry-defcon');
    if (defconEl && _watchstander) {
        defconEl.innerText = `DEFCON ${_watchstander.defconLevel}`;
        if (_watchstander.defconLevel <= 2) {
            defconEl.style.color = '#ff4d4f';
            defconEl.style.borderColor = 'rgba(255, 77, 79, 0.5)';
            defconEl.style.background = 'rgba(255, 77, 79, 0.15)';
        } else if (_watchstander.defconLevel === 3) {
            defconEl.style.color = '#ffa940';
            defconEl.style.borderColor = 'rgba(255, 169, 64, 0.4)';
            defconEl.style.background = 'rgba(255, 169, 64, 0.15)';
        } else {
            defconEl.style.color = '#34d399';
            defconEl.style.borderColor = 'rgba(52, 211, 153, 0.4)';
            defconEl.style.background = 'rgba(52, 211, 153, 0.15)';
        }
    }
}

/**
 * Initialize the Floating Glassmorphic Antigravity Coordinator Terminal.
 * @param {Cesium.Viewer} viewer 
 * @param {object|null} registry 
 */
export function initAgentBridge(viewer, registry = null) {
    if (typeof document === 'undefined') return;
    if (document.getElementById('agent-tactical-drawer')) return;

    _viewer = viewer;

    // Instantiate Copilot & Sentinel engines
    _copilot = new SpatialCopilot({
        viewer: _viewer,
        dataManager: (typeof window !== 'undefined' && window.__godsEyeView?.dataManager) || null,
        styleManager: (typeof window !== 'undefined' && window.__godsEyeView?.styleManager) || null,
        annotations: (typeof window !== 'undefined' && window.__godsEyeView?.annotations) || null
    });

    _watchstander = new SentinelWatchstander({
        dataManager: (typeof window !== 'undefined' && window.__godsEyeView?.dataManager) || null
    });

    _voiceOperator = new TacticalVoiceOperator({
        onTranscript: (spokenText) => {
            addAgentBridgeMessage(`[VOICE IN] 🎙️ "${spokenText}"`);
            handleUserTerminalCommand(spokenText, true);
        },
        onStatusChange: ({ isListening, isSpeaking }) => {
            if (_micBtn) {
                if (isListening) {
                    _micBtn.style.color = '#ff4d4f';
                    _micBtn.style.borderColor = '#ff4d4f';
                    _micBtn.style.background = 'rgba(255, 77, 79, 0.2)';
                    _micBtn.title = 'Listening... Click to stop';
                } else {
                    _micBtn.style.color = '#00f0ff';
                    _micBtn.style.borderColor = 'rgba(0, 240, 255, 0.25)';
                    _micBtn.style.background = 'rgba(0, 240, 255, 0.08)';
                    _micBtn.title = 'Push-to-Talk Microphone';
                }
            }
        }
    });

    if (!document.getElementById('antigravity-coordinator-styles')) {
        const style = document.createElement('style');
        style.id = 'antigravity-coordinator-styles';
        style.textContent = `
            @keyframes ag-pulse-ring {
                0% { transform: scale(0.9); opacity: 0.9; box-shadow: 0 0 0 0 rgba(0, 240, 255, 0.7); }
                50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 10px 4px rgba(0, 240, 255, 0.4); }
                100% { transform: scale(0.9); opacity: 0.9; box-shadow: 0 0 0 0 rgba(0, 240, 255, 0.7); }
            }
            .ag-glass-panel {
                background: linear-gradient(135deg, rgba(10, 16, 28, 0.92) 0%, rgba(4, 8, 16, 0.98) 100%);
                backdrop-filter: blur(16px) saturate(180%);
                -webkit-backdrop-filter: blur(16px) saturate(180%);
                border: 1px solid rgba(0, 240, 255, 0.28);
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85), 0 0 24px rgba(0, 240, 255, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.12);
                transform: perspective(1000px) rotateX(1deg);
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, width 0.3s ease, height 0.3s ease;
            }
            .ag-glass-panel:hover {
                transform: perspective(1000px) rotateX(0deg) translateY(-2px);
                box-shadow: 0 24px 60px rgba(0, 0, 0, 0.9), 0 0 32px rgba(0, 240, 255, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.2);
            }
            .ag-chip-btn {
                background: rgba(0, 240, 255, 0.08);
                border: 1px solid rgba(0, 240, 255, 0.25);
                border-radius: 4px;
                color: #a5f3fc;
                font-size: 10px;
                padding: 3px 7px;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
                font-family: inherit;
            }
            .ag-chip-btn:hover {
                background: rgba(0, 240, 255, 0.22);
                border-color: #00f0ff;
                color: #ffffff;
                box-shadow: 0 0 10px rgba(0, 240, 255, 0.35);
                transform: translateY(-1px);
            }
            .ag-chip-btn:active {
                transform: translateY(1px);
            }
            #agent-bridge-content::-webkit-scrollbar {
                width: 4px;
            }
            #agent-bridge-content::-webkit-scrollbar-thumb {
                background: rgba(0, 240, 255, 0.3);
                border-radius: 2px;
            }
            #agent-bridge-content::-webkit-scrollbar-track {
                background: transparent;
            }
        `;
        document.head.appendChild(style);
    }

    const container = document.createElement('div');
    container.id = 'agent-tactical-drawer';
    container.className = 'ag-glass-panel';
    container.style.cssText = `
        position: absolute;
        bottom: 24px;
        left: 24px;
        width: 440px;
        border-radius: 8px;
        color: #e0f0ff;
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
        z-index: 1000;
        padding: 12px 14px 10px 14px;
        letter-spacing: 0.04em;
        user-select: none;
    `;

    // Header Bar
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        border-bottom: 1px solid rgba(0, 240, 255, 0.18);
        padding-bottom: 7px;
    `;

    // Left Title + Pulse Aura
    const titleGroup = document.createElement('div');
    titleGroup.style.cssText = `display: flex; align-items: center; gap: 8px;`;

    const pulseDot = document.createElement('div');
    pulseDot.style.cssText = `
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #00f0ff;
        animation: ag-pulse-ring 2s infinite ease-in-out;
        flex-shrink: 0;
    `;

    const title = document.createElement('div');
    title.innerHTML = `
        <span style="color: #00f0ff; font-weight: 700; font-size: 11.5px; letter-spacing: 0.06em;">AETHERIS COPILOT</span>
        <span style="color: rgba(0, 240, 255, 0.5); font-size: 9.5px; margin-left: 4px;">v3.0-EVOLUTION</span>
    `;

    titleGroup.appendChild(pulseDot);
    titleGroup.appendChild(title);

    // Right Telemetry Badges & Controls
    const controls = document.createElement('div');
    controls.style.cssText = `display: flex; align-items: center; gap: 6px;`;

    const defconBadge = document.createElement('span');
    defconBadge.id = 'ag-telemetry-defcon';
    defconBadge.innerText = 'DEFCON 3';
    defconBadge.style.cssText = `
        background: rgba(245, 158, 11, 0.15);
        border: 1px solid rgba(245, 158, 11, 0.4);
        color: #ffa940;
        font-size: 9px;
        padding: 1px 5px;
        border-radius: 3px;
        font-weight: 700;
        letter-spacing: 0.05em;
    `;

    const latPill = document.createElement('span');
    latPill.id = 'ag-telemetry-latency';
    latPill.innerText = '14ms';
    latPill.style.cssText = `
        background: rgba(0, 240, 255, 0.1);
        border: 1px solid rgba(0, 240, 255, 0.3);
        color: #67e8f9;
        font-size: 9px;
        padding: 1px 5px;
        border-radius: 3px;
    `;

    const clearBtn = document.createElement('button');
    clearBtn.innerText = 'CLR';
    clearBtn.title = 'Clear Terminal Feed';
    clearBtn.style.cssText = `
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.5);
        border-radius: 3px;
        font-size: 9px;
        padding: 1px 4px;
        cursor: pointer;
        font-family: inherit;
    `;
    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_bridgeContent) {
            _bridgeContent.innerHTML = '';
            addAgentBridgeMessage('[SYSTEM] Terminal buffer cleared.');
        }
    });

    const toggle = document.createElement('button');
    toggle.innerText = '[-]';
    toggle.title = 'Collapse/Expand Terminal';
    toggle.style.cssText = `
        background: none;
        border: none;
        color: #00f0ff;
        cursor: pointer;
        font-family: inherit;
        font-size: 12px;
        font-weight: bold;
        padding: 0 4px;
    `;

    controls.appendChild(defconBadge);
    controls.appendChild(latPill);
    controls.appendChild(clearBtn);
    controls.appendChild(toggle);

    header.appendChild(titleGroup);
    header.appendChild(controls);
    container.appendChild(header);

    // Terminal Message Stream
    const content = document.createElement('div');
    content.id = 'agent-bridge-content';
    content.style.cssText = `
        max-height: 185px;
        min-height: 85px;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 4px;
        font-size: 11.5px;
        user-select: text;
    `;
    _bridgeContent = content;
    container.appendChild(content);

    // Action Chips Row (Quick Action Commands)
    const chipsBar = document.createElement('div');
    chipsBar.id = 'ag-chips-bar';
    chipsBar.style.cssText = `
        display: flex;
        gap: 6px;
        margin-top: 8px;
        padding-top: 6px;
        border-top: 1px solid rgba(0, 240, 255, 0.12);
        overflow-x: auto;
        padding-bottom: 2px;
    `;

    const chips = [
        { label: '📡 Live SITREP', query: 'generate tactical sitrep' },
        { label: '🛰️ Falcon 9 Tracks', query: 'track falcon 9 launches' },
        { label: '🛡️ 50km Geofence', query: 'draw 50km geofence around austin' },
        { label: '🎯 Measure Range', query: 'measure distance from new york to london' },
        { label: '🚦 Traffic Heatmap', query: 'focus traffic congestion' },
        { label: '👁️ Thermal Vision', query: 'switch to thermal vision' },
        { label: '🌐 Taiwan Strait', query: 'fly to taiwan strait' }
    ];

    chips.forEach(c => {
        const chip = document.createElement('button');
        chip.className = 'ag-chip-btn';
        chip.innerText = c.label;
        chip.addEventListener('click', () => {
            addAgentBridgeMessage(`[USER COMMAND] > ${c.query}`);
            handleUserTerminalCommand(c.query);
        });
        chipsBar.appendChild(chip);
    });

    container.appendChild(chipsBar);

    // Command Prompt Input Line with Voice Push-To-Talk Mic
    const inputRow = document.createElement('div');
    inputRow.id = 'ag-input-row';
    inputRow.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(0, 240, 255, 0.2);
        border-radius: 4px;
        padding: 3px 8px;
    `;

    const micBtn = document.createElement('button');
    micBtn.id = 'ag-mic-btn';
    micBtn.innerHTML = '🎤';
    micBtn.title = 'Tactical Voice Comms (Click or Push-to-Talk)';
    micBtn.style.cssText = `
        background: rgba(0, 240, 255, 0.08);
        border: 1px solid rgba(0, 240, 255, 0.25);
        border-radius: 3px;
        color: #00f0ff;
        font-size: 11px;
        padding: 2px 5px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    `;
    micBtn.addEventListener('click', () => {
        if (_voiceOperator) {
            _voiceOperator.toggleListening();
        }
    });
    _micBtn = micBtn;

    const promptSymbol = document.createElement('span');
    promptSymbol.innerText = '>';
    promptSymbol.style.color = '#00f0ff';
    promptSymbol.style.fontSize = '12px';
    promptSymbol.style.fontWeight = 'bold';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Ask copilot: "fly to tokyo", "draw 50km geofence", "sitrep"...';
    input.style.cssText = `
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: #e0f0ff;
        font-family: inherit;
        font-size: 11px;
        letter-spacing: 0.04em;
    `;
    _commandInput = input;

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            const query = input.value.trim();
            input.value = '';
            addAgentBridgeMessage(`[COMMAND] > ${query}`);
            handleUserTerminalCommand(query);
        }
    });

    inputRow.appendChild(micBtn);
    inputRow.appendChild(promptSymbol);
    inputRow.appendChild(input);
    container.appendChild(inputRow);

    // Expand / Collapse interaction
    let expanded = true;
    toggle.addEventListener('click', () => {
        expanded = !expanded;
        if (expanded) {
            content.style.display = 'block';
            chipsBar.style.display = 'flex';
            inputRow.style.display = 'flex';
            toggle.innerText = '[-]';
            container.style.width = '440px';
        } else {
            content.style.display = 'none';
            chipsBar.style.display = 'none';
            inputRow.style.display = 'none';
            toggle.innerText = '[+]';
            container.style.width = '260px';
        }
    });

    document.body.appendChild(container);

    // Boot Messages
    addAgentBridgeMessage('[SYSTEM] Aetheris Horizon Spatial Copilot initialized.');
    addAgentBridgeMessage('[WATCHSTANDER] Multi-sensor threat correlation armed (DEFCON 3).');
    addAgentBridgeMessage('[COMMS] VHF Tactical Voice Operator online. Push-to-talk ready.');

    // Expose globally for cross-module dispatch
    if (typeof window !== 'undefined') {
        window.__aetherisBridge = {
            addMessage: addAgentBridgeMessage,
            executeCommand: handleUserTerminalCommand,
            copilot: _copilot,
            watchstander: _watchstander,
            voice: _voiceOperator,
            telemetry: _telemetry,
        };
    }

    // Subscribe to Cartridge Registry if present
    const activeRegistry = registry || window.__aetherisCartridges || window.__gevCartridgeRegistry;
    if (activeRegistry && typeof activeRegistry.on === 'function') {
        activeRegistry.on('activated', (cartridge) => {
            if (!cartridge) return;
            const id = cartridge.id;
            if (id === 'sentinel-mesh') {
                addAgentBridgeMessage('[DOMAIN: MARITIME] SentinelMesh active. Subsea fiber watchstander online.');
                addAgentBridgeMessage('[ALERT] Threat Matrix: CRITICAL (Vessel Loitering over TAT-14)', '#ff4d4f');
            } else if (id === 'orbital-ops') {
                addAgentBridgeMessage('[DOMAIN: SPACE] OrbitalOps active. LEO conjunction deconfliction online.');
                addAgentBridgeMessage('[ALERT] Conjunction warning: ISS vs Cosmos 1408 (2.18km miss)', '#ffa940');
            } else if (id === 'grid-twin') {
                addAgentBridgeMessage('[DOMAIN: ENERGY] GridTwin active. Substation thermal load online.');
                addAgentBridgeMessage('[ALERT] Substation strain: Loudoun 500kV at 99.4% effective load', '#f59e0b');
            } else if (id === 'geo-risk') {
                addAgentBridgeMessage('[DOMAIN: DISASTER] GeoRisk active. NASA FIRMS VIIRS feed loaded.');
                addAgentBridgeMessage('[ALERT] Fire perimeter encroaching: 1443m to Porter Ranch Substation', '#f43f5e');
            }
        });
    }

    // Periodic Watchstander Telemetry Heartbeat (every 45 seconds)
    setInterval(() => {
        if (_watchstander) {
            const matrix = _watchstander.evaluateThreatMatrix();
            updateTelemetryPills();
        }
    }, 45000);
}

/**
 * Handle input query through the Spatial Copilot engine.
 * @param {string} raw 
 * @param {boolean} spokenVoiceback Whether to speak the response via tactical radio
 */
async function handleUserTerminalCommand(raw, spokenVoiceback = false) {
    if (!_copilot) {
        addAgentBridgeMessage(`[COORDINATOR] Processed query: "${raw}".`);
        return;
    }

    // Parse structured spatial intent
    const intent = _copilot.parseIntent(raw);
    addAgentBridgeMessage(`[INTENT] ${intent.type}`);

    try {
        const result = await _copilot.executeIntent(intent);
        if (result && result.message) {
            addAgentBridgeMessage(result.message, result.status === 'success' ? '#00f0ff' : '#ffa940');

            // Speak tactical response if requested
            if (spokenVoiceback && _voiceOperator) {
                const spokenText = result.action === 'SITREP' && result.sitrep?.spokenText
                    ? result.sitrep.spokenText
                    : result.message.replace(/\[[^\]]+\]/g, '').replace(/•/g, '').trim();
                _voiceOperator.speakTactical(spokenText);
            }
        }
    } catch (err) {
        addAgentBridgeMessage(`[ERROR] Failed to execute intent: ${err.message}`, '#ff4d4f');
    }
}
