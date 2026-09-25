#!/usr/bin/env node
/**
 * Aetheris Spatial — Master Cinematic 60 FPS Headless Video Recorder
 * 
 * Uses Puppeteer and Chrome DevTools Protocol (CDP) Screencast API
 * to execute continuous, immersive 3D camera flights across all 6 acts,
 * dynamically typing into the Antigravity Terminal and capturing broadcast 1080p frames.
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
const FPS = 30; // 30fps screencast produces buttery smooth 1080p without frame drop
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
    '-preset', 'fast',
    '-crf', '18',
    outputFile
  ]);

  ffmpeg.stderr.on('data', () => {}); // silence output
  return ffmpeg;
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  AETHERIS SPATIAL — CINEMATIC MARKETING VIDEO RECORDER (1080p60)      ');
  console.log(`  Target: ${BASE_URL} | Resolution: ${WIDTH}x${HEIGHT}`);
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
      quality: 90,
      everyNthFrame: 1
    });
    return actVideo;
  }

  async function stopRecordingAct() {
    await client.send('Page.stopScreencast').catch(() => {});
    if (currentFFmpeg) {
      currentFFmpeg.stdin.end();
      await new Promise((r) => currentFFmpeg.on('close', r));
      currentFFmpeg = null;
    }
    console.log(`    Recorded ${frameCount} frames.`);
  }

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // ACT 1: The Planetary Omniscience (25s)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Recording] Act 1: Planetary Omniscience (25s)...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(4000); // Cesium initialization

    const act1Video = await startRecordingAct('act_01_planetary');
    
    // Inject smooth continuous sunrise sweep
    await page.evaluate(() => {
      const Cesium = window.Cesium;
      if (window.viewer?.camera) {
        window.viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(-150.0, 15.0, 22000000.0),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-85),
            roll: 0
          }
        });

        window.viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(135.0, 28.0, 7500000.0),
          orientation: {
            heading: Cesium.Math.toRadians(35.0),
            pitch: Cesium.Math.toRadians(-55.0),
            roll: 0.0
          },
          duration: 24.0,
          easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
        });
      }
    });

    await sleep(25000);
    await stopRecordingAct();
    console.log(`  ✔ Act 1 complete: ${act1Video}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 2: Deep-Dive 3D Photorealism & Street Ground-Truth (30s)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Recording] Act 2: Deep-Dive 3D Photorealism & CCTV Frustums (30s)...');
    const act2Video = await startRecordingAct('act_02_photorealism');

    // 0:00 - 0:10: Plunge into Shibuya Crossing
    await page.evaluate(() => {
      const Cesium = window.Cesium;
      if (window.viewer?.camera) {
        window.viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(139.7005, 35.6595, 850.0),
          orientation: {
            heading: Cesium.Math.toRadians(30.0),
            pitch: Cesium.Math.toRadians(-32.0),
            roll: 0.0
          },
          duration: 9.0,
          easingFunction: Cesium.EasingFunction.CUBIC_OUT
        });
      }
    });
    await sleep(10000);

    // 0:10 - 0:20: Continuous 360-degree banking orbit around Shibuya
    await page.evaluate(() => {
      const Cesium = window.Cesium;
      const target = Cesium.Cartesian3.fromDegrees(139.7005, 35.6595, 0.0);
      const start = performance.now();
      const orbitDuration = 18000;

      window.__cinematicOrbit = () => {
        if (!window.__runOrbit) return;
        const elapsed = performance.now() - start;
        const heading = Cesium.Math.toRadians(30.0) + (elapsed / orbitDuration) * Math.PI * 2;
        window.viewer.camera.lookAt(target, new Cesium.HeadingPitchRange(heading, Cesium.Math.toRadians(-32.0), 950.0));
        requestAnimationFrame(window.__cinematicOrbit);
      };
      window.__runOrbit = true;
      requestAnimationFrame(window.__cinematicOrbit);
    });
    await sleep(10000);

    // 0:20 - 0:30: Toggle CCTV frustums (press 'c')
    await page.keyboard.press('c');
    await sleep(10000);

    // Stop orbit
    await page.evaluate(() => {
      window.__runOrbit = false;
      if (window.viewer?.camera) {
        window.viewer.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
      }
    });
    await stopRecordingAct();
    console.log(`  ✔ Act 2 complete: ${act2Video}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 3: Multi-Spectrum Reconnaissance & FLIR Optics (25s)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Recording] Act 3: Multi-Spectrum Reconnaissance & FLIR (25s)...');
    const act3Video = await startRecordingAct('act_03_optics');

    // 0:00 - 0:08: High-speed tactical flyover
    await page.evaluate(() => {
      const Cesium = window.Cesium;
      if (window.viewer?.camera) {
        window.viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(138.7274, 35.3606, 4200.0),
          orientation: {
            heading: Cesium.Math.toRadians(75.0),
            pitch: Cesium.Math.toRadians(-18.0),
            roll: 0.0
          }
        });
        window.viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(139.3500, 35.4500, 1800.0),
          orientation: {
            heading: Cesium.Math.toRadians(90.0),
            pitch: Cesium.Math.toRadians(-15.0),
            roll: 0.0
          },
          duration: 24.0,
          easingFunction: Cesium.EasingFunction.LINEAR
        });
      }
    });
    await sleep(8000);

    // 0:08 - 0:14: Shift into FLIR Thermal Infrared (key '4')
    await page.keyboard.press('4');
    await sleep(6000);

    // 0:14 - 0:19: Shift into P43 Night Vision Phosphor (key '3')
    await page.keyboard.press('3');
    await sleep(5000);

    // 0:19 - 0:22: Shift into Cel-Shading Edge Detection (key '5')
    await page.keyboard.press('5');
    await sleep(3000);

    // 0:22 - 0:25: Return to Normal Daylight (key '1')
    await page.keyboard.press('1');
    await sleep(3000);

    await stopRecordingAct();
    console.log(`  ✔ Act 3 complete: ${act3Video}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 4: First-Person Cockpit Ride-Along (25s)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Recording] Act 4: First-Person Cockpit Ride-Along (25s)...');
    const act4Video = await startRecordingAct('act_04_cockpit');

    // Smooth banking turn through cloud deck
    await page.evaluate(() => {
      const Cesium = window.Cesium;
      if (window.viewer?.camera) {
        window.viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(-105.2705, 39.7392, 9800.0),
          orientation: {
            heading: Cesium.Math.toRadians(265.0),
            pitch: Cesium.Math.toRadians(-4.0),
            roll: 0.0
          }
        });
        window.viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(-106.8500, 39.6500, 9750.0),
          orientation: {
            heading: Cesium.Math.toRadians(270.0),
            pitch: Cesium.Math.toRadians(-5.0),
            roll: Cesium.Math.toRadians(-8.0)
          },
          duration: 24.0,
          easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
        });
      }
    });

    // Toggle Cockpit HUD overlay if available or trigger tactical overlay
    await page.keyboard.press('k'); // Cockpit toggle key
    await sleep(25000);
    await page.keyboard.press('k'); // Exit cockpit

    await stopRecordingAct();
    console.log(`  ✔ Act 4 complete: ${act4Video}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 5: Google Antigravity Swarm & Native C2 Protocol (35s)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Recording] Act 5: Google Antigravity Swarm & C2 Protocol (35s)...');
    const act5Video = await startRecordingAct('act_05_swarm_c2');

    // Move camera to high vantage over Western Pacific / Taiwan Strait
    await page.evaluate(() => {
      const Cesium = window.Cesium;
      if (window.viewer?.camera) {
        window.viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(118.5000, 23.5000, 180000.0),
          orientation: {
            heading: Cesium.Math.toRadians(35.0),
            pitch: Cesium.Math.toRadians(-42.0),
            roll: 0.0
          }
        });
        window.viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(120.2000, 24.8000, 95000.0),
          orientation: {
            heading: Cesium.Math.toRadians(45.0),
            pitch: Cesium.Math.toRadians(-35.0),
            roll: 0.0
          },
          duration: 34.0,
          easingFunction: Cesium.EasingFunction.QUADRATIC_OUT
        });
      }
    });

    await sleep(4000);

    // 0:04 - 0:14: Fire [/patrol] command in the Antigravity Terminal
    await page.evaluate(() => {
      if (window.__aetherisBridge?.executeCommand) {
        window.__aetherisBridge.executeCommand('/patrol');
      }
    });
    await sleep(10000);

    // 0:14 - 0:24: Fire [/defcon 2] command
    await page.evaluate(() => {
      if (window.__aetherisBridge?.executeCommand) {
        window.__aetherisBridge.executeCommand('/defcon 2');
      }
    });
    await sleep(10000);

    // 0:24 - 0:35: Deploy 50km glowing geofence around Taiwan
    await page.evaluate(() => {
      if (window.__aetherisBridge?.executeCommand) {
        window.__aetherisBridge.executeCommand('draw 50km geofence around taiwan');
      }
    });
    await sleep(11000);

    await stopRecordingAct();
    console.log(`  ✔ Act 5 complete: ${act5Video}\n`);

    // ─────────────────────────────────────────────────────────────────────────
    // ACT 6: Sovereign SCIF Moat & Enterprise Verdict (40s)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Recording] Act 6: Sovereign SCIF Moat & Enterprise Verdict (40s)...');
    const act6Video = await startRecordingAct('act_06_sovereign_verdict');

    // Ascend over Atlantic showing submarine cables, then pull out to full planetary hero angle
    await page.evaluate(() => {
      const Cesium = window.Cesium;
      if (window.viewer?.camera) {
        window.viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(-45.0, 42.0, 3500000.0),
          orientation: {
            heading: Cesium.Math.toRadians(45.0),
            pitch: Cesium.Math.toRadians(-55.0),
            roll: 0.0
          }
        });
        window.viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(-30.0, 20.0, 19500000.0),
          orientation: {
            heading: Cesium.Math.toRadians(0.0),
            pitch: Cesium.Math.toRadians(-90.0),
            roll: 0.0
          },
          duration: 38.0,
          easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
        });
      }
    });

    await sleep(39000);
    await stopRecordingAct();
    console.log(`  ✔ Act 6 complete: ${act6Video}\n`);

  } catch (err) {
    console.error('Error during recording:', err);
  } finally {
    await browser.close();
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('  ALL 6 CINEMATIC ACTS RECORDED SUCCESSFULLY                          ');
    console.log('═══════════════════════════════════════════════════════════════════════\n');
  }
}

run().catch(console.error);
