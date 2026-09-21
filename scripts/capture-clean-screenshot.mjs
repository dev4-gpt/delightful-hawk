#!/usr/bin/env node
/**
 * Capture Clean Unobstructed Live Production Screenshot
 * Dismisses modal, flies to cinematic oblique 3D view, and executes [/patrol].
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = '/Users/aryamandev/.gemini/antigravity/brain/d6d7aef0-9868-432b-bd4f-b94748ebfe98';
const SCREENSHOT_PATH = path.join(ARTIFACT_DIR, 'live_antigravity_clean_audit.png');

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
    await sleep(6000); // Allow globe to initialize

    // Dismiss welcome modal
    console.log('Dismissing welcome modal...');
    await page.keyboard.press('Escape');
    await sleep(1500);

    // Execute [/patrol] command in terminal
    console.log('Executing live [/patrol] command in Antigravity Copilot Terminal...');
    await page.evaluate(() => {
      if (window.__aetherisBridge?.executeCommand) {
        window.__aetherisBridge.executeCommand('/patrol');
      }
    });

    await sleep(3000);

    // Fly camera into a cinematic 3D oblique angle
    console.log('Aligning camera to cinematic 3D oblique perspective...');
    await page.evaluate(() => {
      const Cesium = window.Cesium;
      if (window.viewer?.camera) {
        window.viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(-97.7431, 30.2672, 1400.0),
          orientation: {
            heading: Cesium.Math.toRadians(35.0),
            pitch: Cesium.Math.toRadians(-28.0),
            roll: 0.0
          },
          duration: 3.0
        });
      }
    });

    await sleep(4000);

    console.log(`Saving clean full-viewport screenshot to ${SCREENSHOT_PATH}...`);
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });
    console.log('✔ Clean live production screenshot captured successfully!');
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error('Failed to capture screenshot:', err);
  process.exit(1);
});
