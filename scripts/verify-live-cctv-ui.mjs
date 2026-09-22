import path from 'node:path';
import puppeteer from 'puppeteer';

const TARGET_URL = 'https://aetheris-spatial.vercel.app';
const ARTIFACT_DIR = '/Users/aryamandev/.gemini/antigravity/brain/d6d7aef0-9868-432b-bd4f-b94748ebfe98';
const SCREENSHOT_PATH = path.join(ARTIFACT_DIR, 'live_antigravity_cctv_audit.png');
const THEATER_SCREENSHOT_PATH = path.join(ARTIFACT_DIR, 'live_cctv_theater_audit.png');

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

    // Enable CCTV layer
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

    // Wait for CCTV feed to fetch sources and load active camera
    console.log('Waiting for CCTV feed to initialize...');
    await sleep(5000);

    // Audit dropdown options
    const dropdownOptions = await page.evaluate(() => {
      const select = document.getElementById('cctv-camera-select');
      if (!select) return [];
      return Array.from(select.options).map((opt) => ({
        value: opt.value,
        text: opt.textContent,
      }));
    });
    console.log('Camera Select Options (first 6):', JSON.stringify(dropdownOptions.slice(0, 6), null, 2));

    // Switch to Times Square 4K 24/7 Live Stream
    console.log('Selecting Times Square 4K 24/7 Live Stream...');
    await page.evaluate(async () => {
      const gev = window.__godsEyeView;
      if (gev?.dataManager) {
        await gev.dataManager.setLayerParams('cctv', { selectedCameraId: 'nyc-times-square' });
      }
    });
    await sleep(4000);

    const timesSquareAudit = await page.evaluate(() => {
      const badge = document.getElementById('cctv-source-badge');
      const iframeEl = document.getElementById('cctv-iframe');
      const videoEl = document.getElementById('cctv-video');
      const frameImg = document.getElementById('cctv-frame');
      const frameWrap = document.getElementById('cctv-frame-wrap');
      const fpsEl = document.getElementById('cctv-overlay-fps');
      const camEl = document.getElementById('cctv-overlay-cam');
      return {
        badgeText: badge?.textContent?.trim(),
        iframeDisplay: iframeEl?.style.display,
        iframeSrc: iframeEl?.src,
        videoDisplay: videoEl?.style.display,
        frameDisplay: frameImg?.style.display,
        hasFrameClass: frameWrap?.classList.contains('has-frame'),
        fpsText: fpsEl?.textContent?.trim(),
        camText: camEl?.textContent?.trim(),
      };
    });
    console.log('Times Square Live Stream Audit:', JSON.stringify(timesSquareAudit, null, 2));

    // Open Tactical Theater Modal
    console.log('Opening Tactical Surveillance Theater Modal...');
    await page.evaluate(() => {
      document.getElementById('cctv-expand-btn')?.click();
    });
    await sleep(3000);

    const theaterAudit = await page.evaluate(() => {
      const modal = document.getElementById('cctv-theater-modal');
      const theaterIframe = document.getElementById('cctv-theater-iframe');
      const theaterVideo = document.getElementById('cctv-theater-video');
      const theaterImg = document.getElementById('cctv-theater-img');
      const title = document.getElementById('cctv-theater-cam-title');
      const fps = document.getElementById('cctv-theater-fps');
      const status = document.getElementById('cctv-theater-status');
      return {
        modalDisplay: modal?.style.display,
        theaterIframeDisplay: theaterIframe?.style.display,
        theaterIframeSrc: theaterIframe?.src,
        theaterVideoDisplay: theaterVideo?.style.display,
        theaterImgDisplay: theaterImg?.style.display,
        title: title?.textContent?.trim(),
        fps: fps?.textContent?.trim(),
        status: status?.textContent?.trim(),
      };
    });
    console.log('Theater Modal Audit:', JSON.stringify(theaterAudit, null, 2));

    console.log(`Saving theater modal screenshot to ${THEATER_SCREENSHOT_PATH}...`);
    await page.screenshot({ path: THEATER_SCREENSHOT_PATH, fullPage: false });

    // Close Theater Modal
    console.log('Closing Theater Modal...');
    await page.keyboard.press('Escape');
    await sleep(2000);

    // Switch to Shibuya Scramble Crossing
    console.log('Selecting Shibuya Crossing 24/7 Live Stream...');
    await page.evaluate(async () => {
      const gev = window.__godsEyeView;
      if (gev?.dataManager) {
        await gev.dataManager.setLayerParams('cctv', { selectedCameraId: 'tokyo-shibuya-scramble' });
      }
    });
    await sleep(4000);

    const shibuyaAudit = await page.evaluate(() => {
      const badge = document.getElementById('cctv-source-badge');
      const iframeEl = document.getElementById('cctv-iframe');
      const fpsEl = document.getElementById('cctv-overlay-fps');
      const camEl = document.getElementById('cctv-overlay-cam');
      return {
        badgeText: badge?.textContent?.trim(),
        iframeDisplay: iframeEl?.style.display,
        iframeSrc: iframeEl?.src,
        fpsText: fpsEl?.textContent?.trim(),
        camText: camEl?.textContent?.trim(),
      };
    });
    console.log('Shibuya Crossing Live Stream Audit:', JSON.stringify(shibuyaAudit, null, 2));

    // Capture main viewport visual proof
    console.log(`Saving live audit screenshot to ${SCREENSHOT_PATH}...`);
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });
    console.log('✔ All screenshots saved successfully!');

    return { dropdownOptions, timesSquareAudit, theaterAudit, shibuyaAudit };
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error('Audit script failed:', e);
  process.exit(1);
});
