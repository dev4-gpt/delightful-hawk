#!/usr/bin/env node
/**
 * Capture Live Production Viewport Screenshot
 * Opens https://aetheris-spatial.vercel.app, executes [/patrol], and saves a full HD screenshot.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = '/Users/aryamandev/.gemini/antigravity/brain/d6d7aef0-9868-432b-bd4f-b94748ebfe98';
const SCREENSHOT_PATH = path.join(ARTIFACT_DIR, 'live_antigravity_production_audit.png');

const TARGET_URL = process.env.AETHERIS_URL || 'https://aetheris-spatial.vercel.app';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function capture() {
  console.log(`Connecting headless browser to ${TARGET_URL}...`);
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

    console.log('Navigating to live production site...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(6000); // Allow Cesium globe and Antigravity HUD to boot

    console.log('Executing live [/patrol] command in Antigravity Copilot Terminal...');
    await page.evaluate(() => {
      if (window.__aetherisBridge?.executeCommand) {
        window.__aetherisBridge.executeCommand('/patrol');
      }
    });

    await sleep(4000); // Allow terminal lines to animate and render

    console.log(`Saving full viewport screenshot to ${SCREENSHOT_PATH}...`);
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });
    console.log('✔ Live production screenshot captured successfully!');
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error('Failed to capture live screenshot:', err);
  process.exit(1);
});
