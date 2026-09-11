/**
 * HUD widget for switching active cartridges with aerospace tactical aesthetics.
 * @module cartridgeSwitcher
 */

const DOMAIN_ICONS = {
  'sentinel-mesh': '⚓',
  'orbital-ops': '🛰️',
  'grid-twin': '⚡',
  'geo-risk': '🔥'
};

const CARTRIDGE_THREATS = {
  'sentinel-mesh': { level: 'CRITICAL', color: '#ff3344', desc: 'Vessel Loitering over TAT-14' },
  'orbital-ops': { level: 'WARNING', color: '#ffaa00', desc: 'ISS Conjunction miss: 2.18km' },
  'grid-twin': { level: 'OVERLOAD', color: '#ff5533', desc: 'Loudoun Substation: 99.4% Load' },
  'geo-risk': { level: 'ELEVATED', color: '#ffdd00', desc: 'Brushfire: 1443m to Substation' }
};

/**
 * Initializes the cartridge switcher UI.
 * @param {import('./cartridgeRegistry.js').CartridgeRegistry} registry 
 * @param {object} viewer 
 */
export function initCartridgeSwitcher(registry, viewer) {
  const container = createFloatingChip();
  
  const ui = document.createElement('div');
  ui.className = 'aetheris-cartridge-switcher';
  ui.style.cssText = `
    background: rgba(10, 15, 25, 0.88);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(0, 240, 255, 0.25);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7), inset 0 0 12px rgba(0, 240, 255, 0.05);
    padding: 12px;
    border-radius: 6px;
    color: #e0f0ff;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    pointer-events: auto;
    min-width: 220px;
    letter-spacing: 0.05em;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(0, 240, 255, 0.15);
    padding-bottom: 8px;
    margin-bottom: 10px;
  `;
  header.innerHTML = `
    <div>
      <div style="font-size: 9px; color: #00f0ff; text-transform: uppercase; font-weight: 700;">Active Cartridge</div>
      <div id="cs-active-name" style="font-size: 13px; font-weight: bold; color: #ffffff; margin-top: 2px;">SentinelMesh</div>
    </div>
    <div id="cs-threat-badge" style="
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 3px;
      background: rgba(255, 51, 68, 0.2);
      border: 1px solid #ff3344;
      color: #ff5566;
      text-transform: uppercase;
    ">CRITICAL</div>
  `;
  ui.appendChild(header);

  const descEl = document.createElement('div');
  descEl.id = 'cs-active-desc';
  descEl.style.cssText = 'font-size: 11px; color: #8faec8; margin-bottom: 10px; min-height: 16px;';
  descEl.textContent = 'Vessel Loitering over TAT-14';
  ui.appendChild(descEl);

  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 6px;';

  const cartridges = [
    { id: 'sentinel-mesh', label: 'SentinelMesh' },
    { id: 'orbital-ops', label: 'OrbitalOps' },
    { id: 'grid-twin', label: 'GridTwin' },
    { id: 'geo-risk', label: 'GeoRisk' }
  ];

  const buttonMap = new Map();

  cartridges.forEach(c => {
    const btn = document.createElement('button');
    btn.className = `cs-tab-${c.id}`;
    const icon = DOMAIN_ICONS[c.id] || '⚡';
    btn.innerHTML = `<span style="margin-right: 4px;">${icon}</span>${c.label}`;
    btn.style.cssText = `
      background: rgba(20, 30, 45, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #a0c0e0;
      padding: 7px 6px;
      cursor: pointer;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      border-radius: 4px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    btn.onmouseover = () => {
      if (!btn.classList.contains('active')) {
        btn.style.background = 'rgba(0, 240, 255, 0.15)';
        btn.style.borderColor = 'rgba(0, 240, 255, 0.4)';
        btn.style.color = '#ffffff';
      }
    };

    btn.onmouseout = () => {
      if (!btn.classList.contains('active')) {
        btn.style.background = 'rgba(20, 30, 45, 0.7)';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        btn.style.color = '#a0c0e0';
      }
    };

    btn.onclick = () => {
      registry.activate(c.id);
    };

    buttonsContainer.appendChild(btn);
    buttonMap.set(c.id, btn);
  });

  ui.appendChild(buttonsContainer);
  container.appendChild(ui);

  function updateActiveUI(cartridge) {
    if (!cartridge) return;
    const nameEl = document.getElementById('cs-active-name');
    const badgeEl = document.getElementById('cs-threat-badge');
    const desc = document.getElementById('cs-active-desc');

    if (nameEl) nameEl.textContent = cartridge.title || cartridge.name || cartridge.id;
    
    const threatMeta = CARTRIDGE_THREATS[cartridge.id] || { level: 'MONITOR', color: '#00f0ff', desc: 'Active scanning' };
    if (badgeEl) {
      badgeEl.textContent = threatMeta.level;
      badgeEl.style.color = threatMeta.color;
      badgeEl.style.borderColor = threatMeta.color;
      badgeEl.style.background = `${threatMeta.color}22`;
    }
    if (desc) desc.textContent = threatMeta.desc;

    buttonMap.forEach((b, id) => {
      if (id === cartridge.id) {
        b.classList.add('active');
        b.style.background = 'rgba(0, 240, 255, 0.25)';
        b.style.borderColor = '#00f0ff';
        b.style.color = '#ffffff';
        b.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.3)';
      } else {
        b.classList.remove('active');
        b.style.background = 'rgba(20, 30, 45, 0.7)';
        b.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        b.style.color = '#a0c0e0';
        b.style.boxShadow = 'none';
      }
    });
  }

  // Subscribe to registry updates
  registry.on('activated', updateActiveUI);

  // Initialize with currently active cartridge
  const active = registry.getActiveCartridge();
  if (active) {
    updateActiveUI(active);
  }
}

function createFloatingChip() {
  let chip = document.getElementById('cartridge-hud-chip');
  if (!chip) {
    chip = document.createElement('div');
    chip.id = 'cartridge-hud-chip';
    chip.style.cssText = `
      position: absolute;
      top: 65px;
      right: 18px;
      z-index: 999;
    `;
    document.body.appendChild(chip);
  }
  return chip;
}
