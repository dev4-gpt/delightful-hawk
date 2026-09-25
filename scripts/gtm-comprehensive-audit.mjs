import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = '/Users/aryamandev/.gemini/antigravity/brain/d6d7aef0-9868-432b-bd4f-b94748ebfe98';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runGTMComprehensiveAudit() {
  console.log('🚀 [GTM AUDIT] Launching automated multi-domain verification on https://aetheris-spatial.vercel.app ...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('Cartridge') || text.includes('Copilot') || text.includes('Landmarks3D') || text.includes('AlphaEarth')) {
      console.log(`   [PAGE LOG] ${text}`);
    }
  });

  // Bypass welcome modals
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('gev:first-launch-seen', 'true');
    localStorage.setItem('gev_first_launch_dismissed', 'true');
  });

  console.log('📡 Navigating to https://aetheris-spatial.vercel.app/?welcome=0 ...');
  await page.goto('https://aetheris-spatial.vercel.app/?welcome=0', { waitUntil: 'domcontentloaded', timeout: 45000 });

  console.log('⏳ Waiting for Cesium container...');
  await page.waitForSelector('#cesiumContainer', { timeout: 30000 });
  await sleep(4000);

  // Clean any modal overlays
  await page.evaluate(() => {
    const modal = document.querySelector('.mission-control-modal, .first-launch-modal, [class*="first-launch"]');
    if (modal) modal.remove();
    const overlay = document.querySelector('.modal-backdrop, .mission-control-backdrop');
    if (overlay) overlay.remove();
  });

  // Test 1: Verify Initial UI & Cartridge Switcher Presence
  console.log('\n--- 1. VERIFYING CARTRIDGE SWITCHER & DOM ELEMENTS ---');
  const uiState = await page.evaluate(() => {
    const csContainer = document.getElementById('cartridge-switcher-container');
    const buttons = csContainer ? Array.from(csContainer.querySelectorAll('.cartridge-btn')).map(b => ({
      text: b.textContent.trim(),
      id: b.getAttribute('data-id') || b.textContent.trim(),
      isActive: b.classList.contains('active')
    })) : [];

    const missionCard = document.getElementById('cs-mission-card');
    const theaterName = document.getElementById('cs-theater-name')?.textContent || '';
    const activeCartridge = window.__aetherisCartridges?.getActiveCartridge()?.id || null;

    return {
      hasSwitcher: !!csContainer,
      buttons,
      hasMissionCard: !!missionCard,
      theaterName,
      activeCartridge
    };
  });

  console.log('Cartridge UI State:', JSON.stringify(uiState, null, 2));

  // Test 2: Click every single cartridge button and capture visual proof
  const cartridgesToTest = [
    { id: 'sentinel-mesh', label: 'SentinelMesh', shot: 'gtm_audit_1_sentinel_mesh.png' },
    { id: 'orbital-ops', label: 'OrbitalOps', shot: 'gtm_audit_2_orbital_ops.png' },
    { id: 'grid-twin', label: 'GridTwin', shot: 'gtm_audit_3_grid_twin.png' },
    { id: 'geo-risk', label: 'GeoRisk', shot: 'gtm_audit_4_geo_risk.png' },
    { id: 'alpha-earth', label: 'AlphaEarth', shot: 'gtm_audit_5_alpha_earth.png' }
  ];

  const cartridgeResults = [];

  for (const c of cartridgesToTest) {
    console.log(`\n👉 Testing Cartridge Button: [${c.label}] (id: ${c.id})`);
    
    // Click button
    const clickSuccess = await page.evaluate((targetId) => {
      const btn = document.getElementById(`btn-${targetId}`) || 
                  document.querySelector(`.cs-tab-${targetId}`) ||
                  Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes(targetId.replace('-', '')));

      if (btn) {
        btn.click();
        return { clicked: true, method: 'dom_click', text: btn.textContent };
      }
      if (typeof window.__switchCartridge === 'function') {
        window.__switchCartridge(targetId);
        return { clicked: true, method: '__switchCartridge' };
      }
      return { clicked: false };
    }, c.id);

    console.log(`   Click dispatched:`, clickSuccess);

    // Wait for cinematic camera flight (2.5s) + rendering settle
    console.log('   Waiting 4.0s for Cesium flight and telemetry streaming...');
    await sleep(4000);

    // Inspect live state
    const theaterTelemetry = await page.evaluate(() => {
      const v = window.__godsEyeView?.viewer;
      let camInfo = null;
      if (v && v.camera) {
        const c3 = v.camera.positionCartographic;
        if (c3) {
          const CesiumLib = window.Cesium || Cesium;
          camInfo = {
            lon: CesiumLib.Math.toDegrees(c3.longitude).toFixed(4),
            lat: CesiumLib.Math.toDegrees(c3.latitude).toFixed(4),
            heightM: Math.round(c3.height)
          };
        }
      }

      const activeId = window.__aetherisCartridges?.getActiveCartridge()?.id;
      const theaterName = document.getElementById('cs-theater-name')?.textContent || '';
      const kpiEls = Array.from(document.querySelectorAll('#cs-kpis-grid > div')).map(el => el.textContent.trim().replace(/\s+/g, ' '));
      const copilotLogs = Array.from(document.querySelectorAll('#copilot-terminal .copilot-line, .copilot-terminal-line')).map(l => l.textContent.trim()).slice(-3);

      return {
        activeId,
        theaterName,
        kpis: kpiEls,
        camInfo,
        copilotLogs
      };
    });

    console.log(`   Telemetry after click:`, JSON.stringify(theaterTelemetry, null, 2));

    const shotPath = path.join(ARTIFACT_DIR, c.shot);
    await page.screenshot({ path: shotPath });
    console.log(`   📸 Captured screenshot: ${c.shot}`);

    cartridgeResults.push({
      cartridge: c.label,
      id: c.id,
      ...theaterTelemetry,
      screenshot: c.shot
    });
  }

  // Test 3: Test Antigravity Copilot Input Box
  console.log('\n--- 3. TESTING ANTIGRAVITY COPILOT TERMINAL INPUT ---');
  const terminalTestResult = await page.evaluate(async () => {
    const input = document.querySelector('#copilot-terminal input, .copilot-input-field, input[placeholder*="Ask"]');
    if (!input) return { error: 'No terminal input found' };

    // Set input value to "fly to tokyo" and dispatch Enter
    input.value = 'fly to tokyo';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));

    return { dispatched: 'fly to tokyo' };
  });

  console.log('Dispatched Copilot query:', terminalTestResult);
  console.log('Waiting 5.0s for Copilot routing and camera flight to Tokyo...');
  await sleep(5000);

  const tokyoShot = path.join(ARTIFACT_DIR, 'gtm_audit_6_tokyo.png');
  await page.screenshot({ path: tokyoShot });
  console.log('📸 Captured Tokyo screenshot: gtm_audit_6_tokyo.png');

  // Test 4: Standoff view of 3D PBR landmarks + Gaussian splatting in Austin
  console.log('\n--- 4. TESTING HIGH-FIDELITY 3D PBR ARCHITECTURE & GAUSSIAN SPLATTING ---');
  await page.evaluate(() => {
    if (window.Cesium && window.__godsEyeView?.viewer) {
      const v = window.__godsEyeView.viewer;
      // Close oblique standoff of Austin Capitol rotunda with Frost Bank & Jenga in background
      v.camera.setView({
        destination: window.Cesium.Cartesian3.fromDegrees(-97.7404, 30.2705, 335),
        orientation: {
          heading: window.Cesium.Math.toRadians(0),
          pitch: window.Cesium.Math.toRadians(-20),
          roll: 0.0
        }
      });
    }
  });

  await sleep(4000);
  const austinPbrShot = path.join(ARTIFACT_DIR, 'gtm_audit_7_austin_pbr_splat.png');
  await page.screenshot({ path: austinPbrShot });
  console.log('📸 Captured Austin PBR architecture screenshot: gtm_audit_7_austin_pbr_splat.png');

  // Test 5: Verify CCTV PiP Integration
  console.log('\n--- 5. TESTING CCTV LIVE SENSOR INTEGRATION ---');
  const cctvState = await page.evaluate(() => {
    // Dispatch 'c' key to toggle CCTV
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', code: 'KeyC', bubbles: true }));
    const cctvPanel = document.querySelector('#cctv-monitor-panel, .cctv-panel, [class*="cctv"]');
    return {
      toggled: true,
      hasPanel: !!cctvPanel,
      panelVisible: cctvPanel ? window.getComputedStyle(cctvPanel).display !== 'none' : false
    };
  });

  console.log('CCTV toggle state:', cctvState);
  await sleep(3000);
  const cctvShot = path.join(ARTIFACT_DIR, 'gtm_audit_8_cctv_live.png');
  await page.screenshot({ path: cctvShot });
  console.log('📸 Captured CCTV screenshot: gtm_audit_8_cctv_live.png');

  await browser.close();
  console.log('\n✅ GTM Comprehensive Audit Complete!');
  return {
    cartridgeResults,
    terminalTestResult,
    cctvState
  };
}

runGTMComprehensiveAudit().catch(err => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
