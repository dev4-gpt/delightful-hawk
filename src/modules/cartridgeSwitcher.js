/**
 * HUD widget for switching active cartridges.
 * @module cartridgeSwitcher
 */

/**
 * Initializes the cartridge switcher UI.
 * @param {import('./cartridgeRegistry.js').CartridgeRegistry} registry 
 * @param {object} viewer 
 */
export function initCartridgeSwitcher(registry, viewer) {
  const container = document.getElementById('hud-right') || createFloatingChip();
  
  const ui = document.createElement('div');
  ui.className = 'cartridge-switcher';
  ui.style.cssText = `
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid #444;
    padding: 10px;
    border-radius: 4px;
    color: white;
    font-family: monospace;
    pointer-events: auto;
  `;

  const header = document.createElement('div');
  header.style.marginBottom = '10px';
  header.innerHTML = `<strong>ACTIVE CARTRIDGE:</strong> <span id="cs-active-name">None</span>
                      <br/><strong>THREAT:</strong> <span id="cs-threat-level">UNKNOWN</span>`;
  ui.appendChild(header);

  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.flexDirection = 'column';
  buttonsContainer.style.gap = '5px';

  const cartridges = [
    { id: 'sentinel-mesh', label: 'SentinelMesh' },
    { id: 'orbital-ops', label: 'OrbitalOps' },
    { id: 'grid-twin', label: 'GridTwin' },
    { id: 'geo-risk', label: 'GeoRisk' }
  ];

  cartridges.forEach(c => {
    const btn = document.createElement('button');
    btn.textContent = c.label;
    btn.style.cssText = `
      background: #333;
      border: 1px solid #555;
      color: white;
      padding: 5px;
      cursor: pointer;
      font-family: monospace;
    `;
    btn.onclick = () => registry.activate(c.id);
    buttonsContainer.appendChild(btn);
  });

  ui.appendChild(buttonsContainer);
  container.appendChild(ui);

  registry.on('activated', (cartridge) => {
    document.getElementById('cs-active-name').textContent = cartridge.name;
    // Mock threat level update, ideally should listen to cartridge specific events
    const threatLevels = ['NORMAL', 'ELEVATED', 'WARNING', 'CRITICAL'];
    const randomThreat = threatLevels[Math.floor(Math.random() * threatLevels.length)];
    const threatSpan = document.getElementById('cs-threat-level');
    threatSpan.textContent = randomThreat;
    
    // color code threat
    switch(randomThreat) {
      case 'CRITICAL': threatSpan.style.color = 'red'; break;
      case 'WARNING': threatSpan.style.color = 'orange'; break;
      case 'ELEVATED': threatSpan.style.color = 'yellow'; break;
      case 'NORMAL': threatSpan.style.color = 'green'; break;
    }
  });
}

function createFloatingChip() {
  let chip = document.getElementById('cartridge-hud-chip');
  if (!chip) {
    chip = document.createElement('div');
    chip.id = 'cartridge-hud-chip';
    chip.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
    `;
    document.body.appendChild(chip);
  }
  return chip;
}
