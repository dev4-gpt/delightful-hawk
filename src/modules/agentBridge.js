/**
 * Tactical agent bridge drawer streaming Antigravity Coordinator telemetry.
 * @module agentBridge
 */

export function addAgentBridgeMessage(msg, color = null) {
    if (typeof document === 'undefined') return;
    const content = document.getElementById('agent-bridge-content');
    if (!content) return;

    const line = document.createElement('div');
    line.innerText = msg;
    line.style.margin = '4px 0';
    line.style.fontSize = '12px';
    
    if (color) {
        line.style.color = color;
    } else if (msg.includes('CRITICAL') || msg.includes('ALERT') || msg.includes('OVERLOAD')) {
        line.style.color = '#ff4444';
    } else if (msg.includes('WARNING') || msg.includes('ELEVATED')) {
        line.style.color = '#ffaa00';
    } else if (msg.includes('DOMAIN') || msg.includes('PULSE')) {
        line.style.color = '#00f0ff';
    } else if (msg.includes('USER COMMAND')) {
        line.style.color = '#88ccff';
    } else {
        line.style.color = '#a0b0c0';
    }

    content.appendChild(line);
    content.scrollTop = content.scrollHeight;
}

export function initAgentBridge(viewer, registry = null) {
    if (typeof document === 'undefined') return;
    if (document.getElementById('agent-tactical-drawer')) return;

    const container = document.createElement('div');
    container.id = 'agent-tactical-drawer';
    container.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 20px;
        width: 360px;
        background: rgba(10, 16, 26, 0.88);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(0, 240, 255, 0.25);
        border-radius: 6px;
        color: #e0f0ff;
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
        z-index: 1000;
        padding: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7), inset 0 0 12px rgba(0, 240, 255, 0.05);
        transition: all 0.3s ease;
        letter-spacing: 0.04em;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        border-bottom: 1px solid rgba(0, 240, 255, 0.2);
        padding-bottom: 6px;
    `;

    const title = document.createElement('strong');
    title.innerText = 'Antigravity Coordinator';
    title.style.color = '#00f0ff';
    title.style.fontSize = '12px';

    const toggle = document.createElement('button');
    toggle.innerText = '[-]';
    toggle.style.cssText = `
        background: none;
        border: none;
        color: #00f0ff;
        cursor: pointer;
        font-family: inherit;
        font-size: 12px;
        font-weight: bold;
    `;

    header.appendChild(title);
    header.appendChild(toggle);
    container.appendChild(header);

    const content = document.createElement('div');
    content.id = 'agent-bridge-content';
    content.style.maxHeight = '180px';
    content.style.overflowY = 'auto';

    container.appendChild(content);

    let expanded = true;
    toggle.addEventListener('click', () => {
        expanded = !expanded;
        if (expanded) {
            content.style.display = 'block';
            toggle.innerText = '[-]';
            container.style.width = '360px';
        } else {
            content.style.display = 'none';
            toggle.innerText = '[+]';
            container.style.width = '220px';
        }
    });

    document.body.appendChild(container);

    // Initial boot messages
    addAgentBridgeMessage('[SYSTEM] Aetheris Agent Coordinator initialized.');
    addAgentBridgeMessage('[PULSE] Multi-domain sensor fusion connected to EarthMind MCP.');

    // Expose globally
    if (typeof window !== 'undefined') {
        window.__aetherisBridge = { addMessage: addAgentBridgeMessage };
    }

    // Subscribe to Cartridge Registry if provided or discoverable
    const activeRegistry = registry || window.__aetherisCartridges || window.__gevCartridgeRegistry;
    if (activeRegistry && typeof activeRegistry.on === 'function') {
        activeRegistry.on('activated', (cartridge) => {
            if (!cartridge) return;
            const id = cartridge.id;
            if (id === 'sentinel-mesh') {
                addAgentBridgeMessage('[DOMAIN: MARITIME] SentinelMesh active. Subsea fiber watchstander online.');
                addAgentBridgeMessage('[ALERT] Threat Matrix: CRITICAL (Vessel Loitering over TAT-14)', '#ff4444');
            } else if (id === 'orbital-ops') {
                addAgentBridgeMessage('[DOMAIN: SPACE] OrbitalOps active. LEO conjunction deconfliction online.');
                addAgentBridgeMessage('[ALERT] Conjunction warning: ISS vs Cosmos 1408 (2.18km miss)', '#ffaa00');
            } else if (id === 'grid-twin') {
                addAgentBridgeMessage('[DOMAIN: ENERGY] GridTwin active. Datacenter substation thermal load online.');
                addAgentBridgeMessage('[ALERT] Substation strain: Loudoun 500kV at 99.4% effective load', '#ff5533');
            } else if (id === 'geo-risk') {
                addAgentBridgeMessage('[DOMAIN: DISASTER] GeoRisk active. NASA FIRMS VIIRS active wildfire feed loaded.');
                addAgentBridgeMessage('[ALERT] Fire perimeter encroaching: 1443m to Porter Ranch Substation', '#ffdd00');
            }
        });
    }
}
