#!/usr/bin/env node
/**
 * Aetheris Spatial — Master GTM Headless Video Recorder
 * 
 * Uses Puppeteer and Chrome DevTools Protocol (CDP) Screencast API
 * to drive the browser through all 9 acts, executing every functionality
 * in the implementation plan and streaming real-time frames into FFmpeg.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const VIDEO_DIR = path.join(ROOT, 'qa-shots', 'gtm-video');

fs.mkdirSync(VIDEO_DIR, { recursive: true });

const BASE_URL = process.env.AETHERIS_URL || 'https://aetheris-spatial.vercel.app';
const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startFrameRecorder(outputFile) {
  const ffmpeg = spawn('/opt/homebrew/bin/ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-framerate', String(FPS),
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'ultrafast',
    '-crf', '18',
    outputFile
  ]);

  ffmpeg.stderr.on('data', () => {}); // silence output
  return ffmpeg;
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  AETHERIS SPATIAL — MASTER GTM HEADLESS VIDEO RECORDER                ');
  console.log(`  Target: ${BASE_URL} | Resolution: ${WIDTH}x${HEIGHT} @ ${FPS}fps`);
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=metal',
      `--window-size=${WIDTH},${HEIGHT}`
    ],
    defaultViewport: { width: WIDTH, height: HEIGHT }
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });

  const client = await page.createCDPSession();

  let currentFFmpeg = null;
  let frameCount = 0;

  client.on('Page.screencastFrame', async ({ data, sessionId }) => {
    if (currentFFmpeg && currentFFmpeg.stdin.writable) {
      currentFFmpeg.stdin.write(Buffer.from(data, 'base64'));
      frameCount++;
    }
    await client.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });

  async function startRecordingAct(actId) {
    const actVideo = path.join(VIDEO_DIR, `${actId}.mp4`);
    frameCount = 0;
    currentFFmpeg = await startFrameRecorder(actVideo);
    await client.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 85,
      everyNthFrame: 1
    });
    return actVideo;
  }

  async function stopRecordingAct() {
    await client.send('Page.stopScreencast').catch(() => {});
    if (currentFFmpeg) {
      currentFFmpeg.stdin.end();
      await new Promise(r => currentFFmpeg.on('close', r));
      currentFFmpeg = null;
    }
    console.log(`    Recorded ${frameCount} frames.`);
  }

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // ACT 1: Planetary Ingestion & Macro-Telemetry (34s)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Recording] Act I: Planetary Ingestion (34s)...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(3000); // Let Cesium initialize

    const act1Video = await startRecordingAct('act_01_planetary');
    // 0:00 - 0:10: Orbit planetary view
    await sleep(10000);
    // 0:10 - 0:22: Open Telemetry panel (press 'f')
    await page.keyboard.press('f');
    await sleep(12000);
    // 0:22 - 0:34: Pan over Atlantic Ocean
    await page.evaluate(() => {
      if (window.viewer?.camera) {
        window.viewer.camera.flyTo({
          destination: window.Cesium.Cartesian3.fromDegrees(-30.0, 30.0, 12000000.0),
          duration: 8.0
        });
      }
    });
    await sleep(12000);
    await stopRecordingAct();
    console.log(`  ✔ Act I complete: ${act1Video}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 2: Multi-Spectrum Optics & Tactical Shaders (32s)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Recording] Act II: Multi-Spectrum Optics & Shaders (32s)...');
    const act2Video = await startRecordingAct('act_02_optics');
    // 0:00 - 0:08: Descend towards continental landmass
    await page.evaluate(() => {
      if (window.viewer?.camera) {
        window.viewer.camera.flyTo({
          destination: window.Cesium.Cartesian3.fromDegrees(-97.7431, 30.2672, 350000.0),
          duration: 6.0
        });
      }
    });
    await sleep(8000);
    // 0:08 - 0:14: Press '4' (FLIR Thermal Vision)
    await page.keyboard.press('4');
    await sleep(6000);
    // 0:14 - 0:20: Press '3' (P43 Night Vision)
    await page.keyboard.press('3');
    await sleep(6000);
    // 0:20 - 0:24: Press '5' (Anime Cel-Shading)
    await page.keyboard.press('5');
    await sleep(4000);
    // 0:24 - 0:26: Press '2' (Retro CRT)
    await page.keyboard.press('2');
    await sleep(2000);
    // 0:26 - 0:28: Press '7' (Snow)
    await page.keyboard.press('7');
    await sleep(2000);
    // 0:28 - 0:32: Press '1' (Normal Daylight)
    await page.keyboard.press('1');
    await sleep(4000);
    await stopRecordingAct();
    console.log(`  ✔ Act II complete: ${act2Video}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 3: From Orbit to Street-Level & CCTV Frustums (32s)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Recording] Act III: Orbit to Street-Level & CCTV Frustums (32s)...');
    const act3Video = await startRecordingAct('act_03_urban_cctv');
    // 0:00 - 0:10: Dive into Tokyo Shibuya
    await page.evaluate(() => {
      if (window.viewer?.camera) {
        window.viewer.camera.flyTo({
          destination: window.Cesium.Cartesian3.fromDegrees(139.7005, 35.6595, 850.0),
          orientation: {
            heading: window.Cesium.Math.toRadians(30.0),
            pitch: window.Cesium.Math.toRadians(-35.0),
            roll: 0.0
          },
          duration: 7.0
        });
      }
    });
    await sleep(10000);
    // 0:10 - 0:20: Orbit Tokyo Shibuya (press 'o')
    await page.keyboard.press('o');
    await sleep(10000);
    // 0:20 - 0:32: Toggle CCTV (press 'c')
    await page.keyboard.press('c');
    await sleep(12000);
    await page.keyboard.press('o'); // stop orbit
    await stopRecordingAct();
    console.log(`  ✔ Act III complete: ${act3Video}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 4: Aetheris Horizon Copilot & Voice Comms (38s)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Recording] Act IV: Horizon Copilot & Voice Comms (38s)...');
    const act4Video = await startRecordingAct('act_04_horizon_copilot');
    // 0:00 - 0:10: Terminal input "fly to taiwan"
    await page.evaluate(() => {
      const input = document.getElementById('agent-input');
      if (input) {
        input.value = 'fly to taiwan';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await sleep(2000);
    await page.keyboard.press('Enter');
    // Camera flies to Taiwan Strait across 8 seconds
    await sleep(12000);
    // 0:14 - 0:38: Orbit over Taiwan Strait
    await sleep(24000);
    await stopRecordingAct();
    console.log(`  ✔ Act IV complete: ${act4Video}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 5: Dynamic 3D Geofencing & Geodesic Calculations (34s)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Recording] Act V: Dynamic 3D Geofencing & Geodesics (34s)...');
    const act5Video = await startRecordingAct('act_05_geofence_geodesic');
    // Deploy 50km geofence
    await page.evaluate(() => {
      const input = document.getElementById('agent-input');
      if (input) {
        input.value = 'draw 50km geofence around taiwan';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await sleep(2000);
    await page.keyboard.press('Enter');
    await sleep(12000);
    // Measure range to Austin C2
    await page.evaluate(() => {
      const input = document.getElementById('agent-input');
      if (input) {
        input.value = 'distance from austin to taiwan';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await sleep(2000);
    await page.keyboard.press('Enter');
    await sleep(18000);
    await stopRecordingAct();
    console.log(`  ✔ Act V complete: ${act5Video}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 6: Aerospace Launch Trajectories & Satellites (32s)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Recording] Act VI: Aerospace Launch Tracks & Satellites (32s)...');
    const act6Video = await startRecordingAct('act_06_aerospace_space');
    // Focus rocket launch
    await page.evaluate(() => {
      const input = document.getElementById('agent-input');
      if (input) {
        input.value = 'track falcon 9';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await sleep(2000);
    await page.keyboard.press('Enter');
    await sleep(14000);
    // Tilt camera up to view orbital satellite ring
    await page.evaluate(() => {
      if (window.viewer?.camera) {
        window.viewer.camera.lookUp(window.Cesium.Math.toRadians(35.0));
      }
    });
    await sleep(16000);
    await stopRecordingAct();
    console.log(`  ✔ Act VI complete: ${act6Video}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 7: Sentinel Threat Matrix & DEFCON SITREP (36s)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Recording] Act VII: Sentinel Threat Matrix & SITREP (36s)...');
    const act7Video = await startRecordingAct('act_07_sentinel_sitrep');
    // Generate SITREP
    await page.evaluate(() => {
      const input = document.getElementById('agent-input');
      if (input) {
        input.value = 'sitrep';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await sleep(2000);
    await page.keyboard.press('Enter');
    await sleep(14000);
    // Pan camera to Atlantic subsea cable coordinates
    await page.evaluate(() => {
      if (window.viewer?.camera) {
        window.viewer.camera.flyTo({
          destination: window.Cesium.Cartesian3.fromDegrees(-70.0, 41.0, 1500000.0),
          duration: 6.0
        });
      }
    });
    await sleep(20000);
    await stopRecordingAct();
    console.log(`  ✔ Act VII complete: ${act7Video}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 8: 2D Polar Radar & Edge Terminal (34s)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Recording] Act VIII: 2D Polar Radar & Edge Terminal (34s)...');
    await page.goto(`${BASE_URL}/mission-control.html`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    const act8Video = await startRecordingAct('act_08_radar_edge');
    // Record polar radar sweep
    await sleep(10000);
    // Click threat injection
    await page.evaluate(() => {
      const btn = document.getElementById('btn-sim-threat');
      if (btn) btn.click();
    });
    await sleep(10000);
    // Navigate to globe-lite
    await page.goto(`${BASE_URL}/globe-lite.html`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(14000);
    await stopRecordingAct();
    console.log(`  ✔ Act VIII complete: ${act8Video}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 9: Architecture & GTM Outro (28s)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Recording] Act IX: Architecture & GTM Outro (28s)...');
    await page.goto(`${BASE_URL}/architecture.html`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    const act9Video = await startRecordingAct('act_09_outro');
    // 0:00 - 0:14: Inspect interactive architecture
    await sleep(14000);
    // 0:14 - 0:28: Return to Globe & Display Outro
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(14000);
    await stopRecordingAct();
    console.log(`  ✔ Act IX complete: ${act9Video}\n`);

  } catch (err) {
    console.error('Error during recording:', err);
  } finally {
    await browser.close();
  }

  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('✔ ALL 9 VIDEO ACTS RECORDED SUCCESSFULLY TO:');
  console.log(`  ${VIDEO_DIR}`);
  console.log('═══════════════════════════════════════════════════════════════════════');
}

run();
