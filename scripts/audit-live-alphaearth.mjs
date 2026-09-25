import puppeteer from 'puppeteer';

async function auditLiveProduction() {
  console.log('🚀 Launching Puppeteer to audit https://aetheris-spatial.vercel.app ...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Landmarks3D]') || text.includes('Cartridge') || text.includes('AlphaEarth') || text.includes('Copilot')) {
      console.log('   [PAGE LOG]', text);
    }
  });

  // Pre-seed first launch dismissed in localStorage
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('gev:first-launch-seen', 'true');
    localStorage.setItem('gev_first_launch_dismissed', 'true');
  });

  console.log('📡 Navigating to https://aetheris-spatial.vercel.app/?welcome=0 ...');
  await page.goto('https://aetheris-spatial.vercel.app/?welcome=0', { waitUntil: 'domcontentloaded', timeout: 30000 });

  console.log('⏳ Waiting for Cesium container and Aetheris OS UI bootstrap...');
  await page.waitForSelector('#cesiumContainer', { timeout: 30000 });

  // Dismiss modal if DOM element exists
  await page.evaluate(() => {
    const modal = document.querySelector('.mission-control-modal, .first-launch-modal, [class*="first-launch"]');
    if (modal) modal.remove();
    const overlay = document.querySelector('.modal-backdrop, .mission-control-backdrop');
    if (overlay) overlay.remove();

    // Fly camera directly to majestic Capitol rotunda & Frost Bank vantage
    if (window.Cesium && window.__godsEyeView?.viewer) {
      const v = window.__godsEyeView.viewer;
      v.camera.setView({
        destination: window.Cesium.Cartesian3.fromDegrees(-97.7404, 30.2705, 340),
        orientation: {
          heading: window.Cesium.Math.toRadians(0), // Facing North directly at Capitol
          pitch: window.Cesium.Math.toRadians(-22),
          roll: 0.0
        }
      });
    }
  });

  await new Promise(r => setTimeout(r, 5000)); // Allow globe & tiles to settle

  // 1. Inspect Cartridge Registry
  const cartridgeData = await page.evaluate(() => {
    const reg = window.__aetherisCartridges;
    if (!reg) return { error: 'No cartridge registry found' };
    return {
      cartridges: reg.list(),
      active: reg.getActiveCartridge()?.id || null,
      gaussianSplatDiag: window.__godsEyeView?.gaussianSplat?.getDiagnostics?.() || null,
      landmarksAvailable: Boolean(window.__godsEyeView?.landmarks3d)
    };
  });
  console.log('📋 Cartridge Status:', JSON.stringify(cartridgeData, null, 2));

  // 2. Click AlphaEarth in the Switcher
  console.log('🌱 Clicking AlphaEarth tab in cartridge switcher...');
  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('.cs-tab-alpha-earth');
    if (btn) {
      btn.click();
      return true;
    }
    // Fallback direct activation
    if (window.__aetherisCartridges) {
      window.__aetherisCartridges.activate('alpha-earth');
      return true;
    }
    return false;
  });
  console.log('   AlphaEarth activated:', clicked);

  await new Promise(r => setTimeout(r, 4000));

  // 3. Test Copilot Terminal query: score land in Austin
  console.log('💬 Testing Copilot command: score land in Austin ...');
  const copilotResult = await page.evaluate(async () => {
    const copilot = window.__godsEyeView?.copilot;
    const terminalInput = document.querySelector('.gev-copilot-input');
    if (terminalInput) {
      terminalInput.value = 'score land in Austin';
      const form = terminalInput.closest('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }

    if (window.__godsEyeView?.copilotEngine) {
      const intent = window.__godsEyeView.copilotEngine.parseIntent('score land in Austin');
      const res = await window.__godsEyeView.copilotEngine.executeIntent(intent);
      return { intent, res };
    }
    return { status: 'dispatched via UI input' };
  });
  console.log('📊 Copilot Result:', JSON.stringify(copilotResult, null, 2));

  await new Promise(r => setTimeout(r, 5000));

  // 4. Capture Full-Resolution Screenshot
  const screenshotPath = '/Users/aryamandev/.gemini/antigravity/brain/d6d7aef0-9868-432b-bd4f-b94748ebfe98/live_alphaearth_production_audit.png';
  console.log(`📸 Capturing visual screenshot to ${screenshotPath} ...`);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  console.log('✅ Audit completed successfully!');
  await browser.close();
}

auditLiveProduction().catch(err => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
