import path from 'node:path';
import puppeteer from 'puppeteer';

const TARGET_URL = 'https://aetheris-spatial.vercel.app';
const ARTIFACT_DIR = '/Users/aryamandev/.gemini/antigravity/brain/d6d7aef0-9868-432b-bd4f-b94748ebfe98';
const SCREENSHOT_PATH = path.join(ARTIFACT_DIR, 'live_antigravity_cctv_audit.png');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log(`Connecting to ${TARGET_URL}...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=metal',
      '--window-size=1920,1080'
    ],
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

    console.log('Loading page...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(6000);

    // Dismiss welcome dialog
    await page.keyboard.press('Escape');
    await sleep(1500);

    // Enable CCTV layer programmatically or via keyboard 'c'
    console.log('Enabling CCTV layer...');
    const cctvInfo = await page.evaluate(async () => {
      const gev = window.__godsEyeView;
      if (gev?.dataManager) {
        await gev.dataManager.setEnabled('cctv', true);
      }
      return {
        hasGev: Boolean(gev),
        cctvEnabled: gev?.dataManager?.isEnabled?.('cctv'),
      };
    });
    console.log('CCTV init status:', cctvInfo);

    // Wait for CCTV feed to fetch sources and load active camera frame
    console.log('Waiting for CCTV feed and frame to resolve...');
    await sleep(5000);

    // Inspect CCTV DOM elements for snapshot feed
    const snapshotAudit = await page.evaluate(() => {
      const badge = document.getElementById('cctv-source-badge');
      const frameImg = document.getElementById('cctv-frame');
      const frameWrap = document.getElementById('cctv-frame-wrap');
      const videoEl = document.getElementById('cctv-video');
      const clockEl = document.getElementById('cctv-clock');
      return {
        badgeText: badge?.textContent?.trim(),
        frameSrc: frameImg?.src,
        hasFrameClass: frameWrap?.classList.contains('has-frame'),
        videoDisplay: videoEl?.style.display,
        clockText: clockEl?.textContent?.trim(),
      };
    });
    console.log('Snapshot Camera Audit (Austin):', JSON.stringify(snapshotAudit, null, 2));

    // Now switch camera to Tokyo Shibuya Crossing (live video)
    console.log('Switching to Tokyo Shibuya Scramble (Live Video)...');
    await page.evaluate(async () => {
      const gev = window.__godsEyeView;
      if (gev?.dataManager) {
        await gev.dataManager.setLayerParams('cctv', { selectedCameraId: 'tokyo-shibuya-scramble' });
      }
    });

    await sleep(4000);

    const videoAudit = await page.evaluate(() => {
      const badge = document.getElementById('cctv-source-badge');
      const frameImg = document.getElementById('cctv-frame');
      const frameWrap = document.getElementById('cctv-frame-wrap');
      const videoEl = document.getElementById('cctv-video');
      const clockEl = document.getElementById('cctv-clock');
      const overlayCam = document.getElementById('cctv-overlay-cam');
      const overlayFps = document.getElementById('cctv-overlay-fps');
      return {
        badgeText: badge?.textContent?.trim(),
        videoDisplay: videoEl?.style.display,
        videoSrc: videoEl?.src,
        videoPaused: videoEl?.paused,
        videoCurrentTime: videoEl?.currentTime,
        videoWidth: videoEl?.videoWidth,
        videoHeight: videoEl?.videoHeight,
        frameDisplay: frameImg?.style.display,
        clockText: clockEl?.textContent?.trim(),
        overlayCam: overlayCam?.textContent?.trim(),
        overlayFps: overlayFps?.textContent?.trim(),
      };
    });
    console.log('Live Video Camera Audit (Tokyo Shibuya):', JSON.stringify(videoAudit, null, 2));

    // Capture visual proof
    console.log(`Saving live audit screenshot to ${SCREENSHOT_PATH}...`);
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });
    console.log('✔ Screenshot saved successfully!');

    return { snapshotAudit, videoAudit };
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error('Audit script failed:', e);
  process.exit(1);
});
