import * as Cesium from 'cesium';

/**
 * Aetheris Sovereign Cartridge Switcher & Tactical Mission Director
 * 
 * Provides aerospace-grade C2 domain switching across:
 * - ⚓ SentinelMesh (Subsea Cable & Maritime Defense)
 * - 🛰️ OrbitalOps (Space Domain Awareness & Conjunctions)
 * - ⚡ GridTwin (AI Datacenter Alley & Power Grid Resilience)
 * - 🔥 GeoRisk (Wildfire NASA VIIRS Proximity & Evacuation)
 * - 🌱 AlphaEarth (DeepMind 10x10m Multimodal Planetary Intelligence)
 * 
 * Features automatic cinematic camera fly-to, sensor layer ignition,
 * tactical HUD telemetry cards, and autonomous Copilot dispatch.
 * 
 * @module cartridgeSwitcher
 */

export const DOMAIN_ICONS = {
  'sentinel-mesh': '⚓',
  'orbital-ops': '🛰️',
  'grid-twin': '⚡',
  'geo-risk': '🔥',
  'alpha-earth': '🌱'
};

export const CARTRIDGE_THEATERS = {
  'sentinel-mesh': {
    name: 'North Atlantic Sector (TAT-14 Cable Landing)',
    lon: -73.6,
    lat: 40.2,
    alt: 48000,
    pitch: -38,
    heading: 40,
    threat: 'CRITICAL',
    threatColor: '#ff3344',
    headline: 'Vessel Loitering over TAT-14 Fiber Link',
    kpis: [
      { label: 'THREAT LEVEL', value: 'CRITICAL (DEFCON 2)', color: '#ff3344' },
      { label: 'VESSEL STATUS', value: 'Anchor-Drag Risk (>60m)', color: '#ffaa00' },
      { label: 'CABLE CAPACITY', value: '3.2 Tbps Transatlantic', color: '#00f0ff' },
      { label: 'SURVEILLANCE', value: 'AIS + SAR Flyover Tasked', color: '#10b981' }
    ],
    sitrep: 'SentinelMesh engaged. Suspicious vessel loitering over TAT-14 subsea landing in New Jersey corridor. Tasking high-resolution satellite flyover and alerting Coast Guard.'
  },
  'orbital-ops': {
    name: 'Low Earth Orbit (LEO Conjunction Corridor)',
    lon: 10.0,
    lat: 32.0,
    alt: 2200000,
    pitch: -65,
    heading: 0,
    threat: 'WARNING',
    threatColor: '#ffaa00',
    headline: 'ISS vs Cosmos-1408 Conjunction Risk',
    kpis: [
      { label: 'THREAT LEVEL', value: 'WARNING (CONJUNCTION)', color: '#ffaa00' },
      { label: 'MISS DISTANCE', value: '2.18 km (Critical Gate)', color: '#ff3344' },
      { label: 'COLLISION PROB', value: '1 in 4,200 (Maneuver Req)', color: '#ffaa00' },
      { label: 'OBJECTS TRACKED', value: '12,480 Active LEO Debris', color: '#00f0ff' }
    ],
    sitrep: 'OrbitalOps engaged. LEO close-approach detected: ISS vs Cosmos-1408 fragment at 2.18km miss distance. Collision avoidance thruster burn calculation armed.'
  },
  'grid-twin': {
    name: 'Loudoun County Datacenter Alley, Virginia',
    lon: -77.4874,
    lat: 39.0438,
    alt: 3500,
    pitch: -35,
    heading: 0,
    threat: 'OVERLOAD',
    threatColor: '#ff5533',
    headline: 'Loudoun 500kV Substation Thermal Strain',
    kpis: [
      { label: 'EFFECTIVE LOAD', value: '99.4% (Heat-Derated)', color: '#ff3344' },
      { label: 'HEAT DOME TEMP', value: '41.5°C Ambient Peak', color: '#ff5533' },
      { label: 'MEGA-CLUSTER DRAW', value: '275 MW AI Compute', color: '#ffaa00' },
      { label: 'GRID STABILITY', value: 'Phase Margin: 1.8 Hz', color: '#00f0ff' }
    ],
    sitrep: 'GridTwin engaged. Northern Virginia AI Mega-Cluster load derating Loudoun 500kV transformer capacity. Automated load-shedding dispatch armed.'
  },
  'geo-risk': {
    name: 'Porter Ranch Substation Wildfire Interface, CA',
    lon: -118.5585,
    lat: 34.2500,
    alt: 4200,
    pitch: -35,
    heading: 355,
    threat: 'ELEVATED',
    threatColor: '#ffdd00',
    headline: 'Thermal Wildfire Front 1443m to Substation',
    kpis: [
      { label: 'PROXIMITY BUFFER', value: '1,443m (Encroaching)', color: '#ff3344' },
      { label: 'FIRE RADIANCE', value: '150 MW VIIRS Radiance', color: '#ff5533' },
      { label: 'EVACUATION PERIMETER', value: '2.5 km Exclusion Zone', color: '#ffaa00' },
      { label: 'ASSET AT RISK', value: 'Porter Ranch 230kV Sub', color: '#00f0ff' }
    ],
    sitrep: 'GeoRisk engaged. High-intensity VIIRS brushfire front advancing toward Porter Ranch electrical transmission corridor. Viewshed surveillance tasked.'
  },
  'alpha-earth': {
    name: 'Austin Onion Creek 10m Foundation Sector',
    lon: -97.7554,
    lat: 30.1785,
    alt: 650,
    pitch: -35,
    heading: 0,
    threat: 'GROUND TRUTH',
    threatColor: '#10b981',
    headline: 'DeepMind 10x10m Multimodal Ground Truth',
    kpis: [
      { label: 'RESOLUTION', value: '10x10m Planetary Mesh', color: '#10b981' },
      { label: 'SAR RADAR', value: '100% Cloud-Penetrating', color: '#00f0ff' },
      { label: 'INVESTMENT GRADE', value: 'BBB (Flood Plain Margin)', color: '#ffaa00' },
      { label: 'CROP ADVANTAGE', value: '18 Days Ahead of Optical', color: '#10b981' }
    ],
    sitrep: 'Google DeepMind AlphaEarth engaged. 10x10m multimodal foundation model locked on Austin sector. Pre-acquisition due diligence & radar moisture active.'
  }
};

export const CARTRIDGE_THREATS = {
  'sentinel-mesh': { level: 'CRITICAL', color: '#ff3344', desc: 'Vessel Loitering over TAT-14' },
  'orbital-ops': { level: 'WARNING', color: '#ffaa00', desc: 'ISS Conjunction miss: 2.18km' },
  'grid-twin': { level: 'OVERLOAD', color: '#ff5533', desc: 'Loudoun Substation: 99.4% Load' },
  'geo-risk': { level: 'ELEVATED', color: '#ffdd00', desc: 'Brushfire: 1443m to Substation' },
  'alpha-earth': { level: 'GROUND TRUTH', color: '#10b981', desc: '10x10m Foundation Model Active' }
};

/**
 * Initializes the cartridge switcher UI.
 * @param {import('./cartridgeRegistry.js').CartridgeRegistry} registry 
 * @param {object} viewer 
 */
export function initCartridgeSwitcher(registry, viewer) {
  if (typeof document === 'undefined') return;

  const container = createFloatingChip();
  
  const ui = document.createElement('div');
  ui.className = 'aetheris-cartridge-switcher';
  ui.style.cssText = `
    background: rgba(10, 15, 25, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(0, 240, 255, 0.3);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.75), inset 0 0 16px rgba(0, 240, 255, 0.08);
    padding: 14px;
    border-radius: 8px;
    color: #e0f0ff;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    pointer-events: auto;
    width: 320px;
    letter-spacing: 0.05em;
    user-select: none;
  `;

  // Header with active status and threat badge
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(0, 240, 255, 0.2);
    padding-bottom: 8px;
    margin-bottom: 10px;
  `;
  header.innerHTML = `
    <div>
      <div style="font-size: 9px; color: #00f0ff; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Active Cartridge</div>
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
  descEl.style.cssText = 'font-size: 11px; color: #8faec8; margin-bottom: 10px; min-height: 16px; line-height: 1.4;';
  descEl.textContent = 'Vessel Loitering over TAT-14';
  ui.appendChild(descEl);

  // Cartridge selection button grid
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px;';

  const cartridges = [
    { id: 'sentinel-mesh', label: 'SentinelMesh' },
    { id: 'orbital-ops', label: 'OrbitalOps' },
    { id: 'grid-twin', label: 'GridTwin' },
    { id: 'geo-risk', label: 'GeoRisk' },
    { id: 'alpha-earth', label: 'AlphaEarth' }
  ];

  const buttonMap = new Map();

  cartridges.forEach(c => {
    const btn = document.createElement('button');
    btn.className = `cs-tab-${c.id}`;
    btn.dataset.cartridgeId = c.id;
    btn.setAttribute('aria-label', c.label);
    const icon = DOMAIN_ICONS[c.id] || '⚡';
    btn.innerHTML = `<span style="margin-right: 5px; font-size: 13px;">${icon}</span>${c.label}`;
    btn.style.cssText = `
      background: rgba(20, 30, 45, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #a0c0e0;
      padding: 8px 6px;
      cursor: pointer;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      border-radius: 4px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    btn.onmouseover = () => {
      if (!btn.classList.contains('active')) {
        btn.style.background = 'rgba(0, 240, 255, 0.15)';
        btn.style.borderColor = 'rgba(0, 240, 255, 0.4)';
        btn.style.color = '#ffffff';
        btn.style.transform = 'translateY(-1px)';
      }
    };

    btn.onmouseout = () => {
      if (!btn.classList.contains('active')) {
        btn.style.background = 'rgba(20, 30, 45, 0.7)';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        btn.style.color = '#a0c0e0';
        btn.style.transform = 'translateY(0)';
      }
    };

    btn.onclick = () => {
      switchCartridgeAndFly(c.id);
    };

    buttonsContainer.appendChild(btn);
    buttonMap.set(c.id, btn);
  });

  ui.appendChild(buttonsContainer);

  // Executive Tactical Mission Briefing Card
  const missionCard = document.createElement('div');
  missionCard.id = 'cs-mission-card';
  missionCard.style.cssText = `
    background: rgba(8, 14, 24, 0.95);
    border: 1px solid rgba(0, 240, 255, 0.2);
    border-radius: 6px;
    padding: 10px;
    margin-bottom: 10px;
  `;
  missionCard.innerHTML = `
    <div style="font-size: 8px; color: #8faec8; text-transform: uppercase; font-weight: 700; margin-bottom: 3px;">Tactical Mission Theater</div>
    <div id="cs-theater-name" style="font-size: 11px; font-weight: bold; color: #00f0ff; margin-bottom: 8px;">North Atlantic TAT-14 Corridor</div>
    <div id="cs-kpis-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
      <!-- Populated dynamically -->
    </div>
    <div style="display: flex; gap: 6px;">
      <button id="cs-fly-btn" style="
        flex: 1;
        background: rgba(0, 240, 255, 0.18);
        border: 1px solid rgba(0, 240, 255, 0.5);
        color: #00f0ff;
        font-family: inherit;
        font-size: 9px;
        font-weight: 700;
        padding: 5px;
        border-radius: 3px;
        cursor: pointer;
      ">🎯 FLY TO THEATER</button>
      <button id="cs-patrol-btn" style="
        flex: 1;
        background: rgba(16, 185, 129, 0.18);
        border: 1px solid rgba(16, 185, 129, 0.5);
        color: #10b981;
        font-family: inherit;
        font-size: 9px;
        font-weight: 700;
        padding: 5px;
        border-radius: 3px;
        cursor: pointer;
      ">⚡ RUN AI PATROL</button>
    </div>
  `;
  ui.appendChild(missionCard);
  container.appendChild(ui);

  // Hook button actions
  const flyBtn = missionCard.querySelector('#cs-fly-btn');
  if (flyBtn) {
    flyBtn.onclick = () => {
      const activeId = registry.getActiveCartridge()?.id;
      if (activeId) flyCameraToTheater(activeId);
    };
  }

  const patrolBtn = missionCard.querySelector('#cs-patrol-btn');
  if (patrolBtn) {
    patrolBtn.onclick = () => {
      if (window.__godsEyeView?.copilotEngine) {
        window.__godsEyeView.copilotEngine.executeIntent({ type: 'SLASH_PATROL', sector: 'ACTIVE_THEATER' });
      }
    };
  }

  /**
   * Activates cartridge, ignites sensor layers, flies camera, and updates HUD
   */
  function switchCartridgeAndFly(cartridgeId) {
    const dataManager = window.__godsEyeView?.dataManager;
    const context = {
      layerManager: dataManager,
      viewer,
      copilot: window.__godsEyeView?.copilotEngine
    };

    // 1. Activate in registry
    registry.activate(cartridgeId, context);

    // 2. Enable corresponding domain data layers
    if (dataManager && typeof dataManager.setEnabled === 'function') {
      try {
        if (cartridgeId === 'sentinel-mesh') {
          dataManager.setEnabled('cables', true);
          dataManager.setEnabled('submarine-cables', true);
          dataManager.setEnabled('ais', true);
        } else if (cartridgeId === 'orbital-ops') {
          dataManager.setEnabled('satellites', true);
          dataManager.setEnabled('launches', true);
        } else if (cartridgeId === 'geo-risk') {
          dataManager.setEnabled('firms', true);
        } else if (cartridgeId === 'grid-twin') {
          dataManager.setEnabled('infrastructure', true);
        }
      } catch (err) {
        console.debug('[CartridgeSwitcher] Layer activation note:', err);
      }
    }

    // 3. Fly camera to active theater
    flyCameraToTheater(cartridgeId);

    // 4. Update Copilot SITREP in terminal
    const theater = CARTRIDGE_THEATERS[cartridgeId];
    if (theater && window.__godsEyeView?.copilotTerminal) {
      window.__godsEyeView.copilotTerminal.log(
        `[CARTRIDGE ACTIVATED] ${theater.headline.toUpperCase()}\n` +
        `• Sector: ${theater.name}\n` +
        `• SITREP: ${theater.sitrep}`
      );
    }
  }

  function flyCameraToTheater(cartridgeId) {
    const theater = CARTRIDGE_THEATERS[cartridgeId];
    if (!theater || !viewer || !viewer.camera) return;

    try {
      const CesiumLib = window.Cesium || Cesium;
      viewer.camera.flyTo({
        destination: CesiumLib.Cartesian3.fromDegrees(theater.lon, theater.lat, theater.alt),
        orientation: {
          heading: CesiumLib.Math.toRadians(theater.heading || 0),
          pitch: CesiumLib.Math.toRadians(theater.pitch || -35),
          roll: 0.0
        },
        duration: 2.5,
        easingFunction: CesiumLib.EasingFunction.CUBIC_IN_OUT
      });
    } catch (err) {
      console.warn('[CartridgeSwitcher] Camera flight note:', err);
    }
  }

  function updateActiveUI(cartridge) {
    if (!cartridge) return;
    const nameEl = document.getElementById('cs-active-name');
    const badgeEl = document.getElementById('cs-threat-badge');
    const desc = document.getElementById('cs-active-desc');
    const theaterNameEl = document.getElementById('cs-theater-name');
    const kpisGrid = document.getElementById('cs-kpis-grid');

    const theater = CARTRIDGE_THEATERS[cartridge.id];

    if (nameEl) nameEl.textContent = cartridge.title || cartridge.name || cartridge.id;
    
    const threatMeta = CARTRIDGE_THREATS[cartridge.id] || { level: 'MONITOR', color: '#00f0ff', desc: 'Active scanning' };
    if (badgeEl) {
      badgeEl.textContent = threatMeta.level;
      badgeEl.style.color = threatMeta.color;
      badgeEl.style.borderColor = threatMeta.color;
      badgeEl.style.background = `${threatMeta.color}22`;
    }
    if (desc) desc.textContent = threatMeta.desc;
    if (theaterNameEl && theater) theaterNameEl.textContent = theater.name;

    // Update KPI grid
    if (kpisGrid && theater && theater.kpis) {
      kpisGrid.innerHTML = theater.kpis.map(k => `
        <div style="background: rgba(15, 23, 42, 0.85); padding: 5px 6px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.06);">
          <div style="font-size: 8px; color: #8faec8; text-transform: uppercase;">${k.label}</div>
          <div style="font-size: 10px; font-weight: 700; color: ${k.color}; margin-top: 1px;">${k.value}</div>
        </div>
      `).join('');
    }

    buttonMap.forEach((b, id) => {
      if (id === cartridge.id) {
        b.classList.add('active');
        b.style.background = 'rgba(0, 240, 255, 0.25)';
        b.style.borderColor = '#00f0ff';
        b.style.color = '#ffffff';
        b.style.boxShadow = '0 0 12px rgba(0, 240, 255, 0.4)';
      } else {
        b.classList.remove('active');
        b.style.background = 'rgba(20, 30, 45, 0.7)';
        b.style.borderColor = 'rgba(255, 255, 255, 0.12)';
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
