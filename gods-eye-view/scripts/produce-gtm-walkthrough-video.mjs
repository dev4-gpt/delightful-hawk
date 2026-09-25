#!/usr/bin/env node
/**
 * Aetheris Spatial — Master GTM Walkthrough Video Producer
 * 
 * 1. Generates voiceover narrations using macOS Daniel TTS.
 * 2. Drives a live 1080p browser via Puppeteer + CDP Screencast API to capture 
 *    every actual interaction (Cartridge clicks, camera flights, terminal commands, 3D landmarks).
 * 3. Composites video and audio with ffmpeg into a master broadcast-ready MP4 artifact.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const WORK_DIR = path.join(ROOT, 'qa-shots', 'gtm-walkthrough');
const VIDEO_DIR = path.join(WORK_DIR, 'video');
const AUDIO_DIR = path.join(WORK_DIR, 'audio');
const MASTER_DIR = path.join(WORK_DIR, 'master');
const ARTIFACT_DIR = '/Users/aryamandev/.gemini/antigravity/brain/d6d7aef0-9868-432b-bd4f-b94748ebfe98';

fs.mkdirSync(VIDEO_DIR, { recursive: true });
fs.mkdirSync(AUDIO_DIR, { recursive: true });
fs.mkdirSync(MASTER_DIR, { recursive: true });

const BASE_URL = 'https://aetheris-spatial.vercel.app/?welcome=0';
const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SCENES = [
  {
    id: 'scene_01_intro',
    title: 'ACT I // PLANETARY SPATIAL INTELLIGENCE & CARTRIDGE ARCHITECTURE',
    durationS: 18,
    voiceText: `Welcome to Aetheris Spatial OS, the unified operating system for real-time planetary intelligence. In modern command, critical infrastructure data is fragmented across siloed maps and disconnected monitors. Aetheris resolves this by fusing fourteen live global sensor streams into a single, high-fidelity spatial engine. On the right, our domain intelligence cartridge system gives operators instant access to specialized threat detection across land, sea, power, space, and planetary ground truth.`,
    setup: async (page) => {
      await page.evaluate(() => {
        if (window.Cesium && window.__godsEyeView?.viewer) {
          window.__godsEyeView.viewer.camera.setView({
            destination: window.Cesium.Cartesian3.fromDegrees(-97.7431, 30.2672, 85000),
            orientation: {
              heading: window.Cesium.Math.toRadians(0),
              pitch: window.Cesium.Math.toRadians(-45),
              roll: 0
            }
          });
        }
      });
      await sleep(2000);
    }
  },
  {
    id: 'scene_02_sentinel_mesh',
    title: 'ACT II // SENTINELMESH // SUBSEA CABLE DEFENSE & MARITIME AIS',
    durationS: 20,
    voiceText: `First, SentinelMesh. We activate the subsea defense cartridge. Watch the camera execute an immediate cinematic flight to the North Atlantic TAT-14 corridor. Subsea fiber cables carry over ten trillion dollars in daily financial transactions. SentinelMesh continuously cross-references live AIS commercial vessel tracks against cable geometries, flagging anchor-drag loitering risks in real time and automatically updating our executive mission briefing card.`,
    setup: async (page) => {
      await page.evaluate(() => {
        const btn = document.getElementById('btn-sentinel-mesh') || document.querySelector('.cs-tab-sentinel-mesh');
        if (btn) btn.click();
        else if (window.__switchCartridge) window.__switchCartridge('sentinel-mesh');
      });
      await sleep(3500);
    }
  },
  {
    id: 'scene_03_orbital_ops',
    title: 'ACT III // ORBITALOPS // SPACE DOMAIN AWARENESS & CONJUNCTIONS',
    durationS: 20,
    voiceText: `Next, OrbitalOps. One click transitions our vantage from sea level to a two-thousand-two-hundred kilometer orbital standoff. Aetheris tracks twelve thousand active satellites and orbital debris fields. When an incoming high-velocity fragment threatens an asset, the system flags a conjunction warning banner with miss distance and collision probability, calculating delta-v thruster maneuvers before catastrophic impact.`,
    setup: async (page) => {
      await page.evaluate(() => {
        const btn = document.getElementById('btn-orbital-ops') || document.querySelector('.cs-tab-orbital-ops');
        if (btn) btn.click();
        else if (window.__switchCartridge) window.__switchCartridge('orbital-ops');
      });
      await sleep(3500);
    }
  },
  {
    id: 'scene_04_grid_twin',
    title: 'ACT IV // GRIDTWIN // DATACENTER & AI CLUSTER POWER RESILIENCE',
    durationS: 20,
    voiceText: `Now, GridTwin. We plunge into Loudoun County, Virginia, the datacenter capital of the world handling seventy percent of global internet traffic. GridTwin models real-time high-voltage substation telemetry against ambient heat domes. With AI training clusters drawing two hundred and seventy-five megawatts, GridTwin alerts engineers when effective load reaches ninety-nine percent, averting thermal cascading blackouts.`,
    setup: async (page) => {
      await page.evaluate(() => {
        const btn = document.getElementById('btn-grid-twin') || document.querySelector('.cs-tab-grid-twin');
        if (btn) btn.click();
        else if (window.__switchCartridge) window.__switchCartridge('grid-twin');
      });
      await sleep(3500);
    }
  },
  {
    id: 'scene_05_geo_risk',
    title: 'ACT V // GEORISK // NASA VIIRS WILDFIRE PROXIMITY DEFENSE',
    durationS: 20,
    voiceText: `Transitioning to GeoRisk. In Porter Ranch, California, rugged topography meets suburban interfaces. GeoRisk integrates NASA VIIRS thermal infrared detections with utility infrastructure. Here, a brushfire with one hundred and fifty megawatts of radiance is tracked approaching a two-hundred-and-thirty kilovolt substation. The system calculates a dynamic one-thousand-four-hundred meter buffer and establishes automated evacuation perimeters.`,
    setup: async (page) => {
      await page.evaluate(() => {
        const btn = document.getElementById('btn-geo-risk') || document.querySelector('.cs-tab-geo-risk');
        if (btn) btn.click();
        else if (window.__switchCartridge) window.__switchCartridge('geo-risk');
      });
      await sleep(3500);
    }
  },
  {
    id: 'scene_06_alpha_earth',
    title: 'ACT VI // ALPHAEARTH // 10X10M MULTIMODAL PLANETARY INTELLIGENCE',
    durationS: 25,
    voiceText: `This brings us to AlphaEarth, powered by Google DeepMind's open planetary foundation model. Every parcel on Earth is compressed into ten-by-ten meter squares with multimodal latent embeddings. Here in Austin, AlphaEarth instantly computes pre-acquisition land risk: flood susceptibility, fire exposure, and soil health. Furthermore, cloud-penetrating Synthetic Aperture Radar detects agricultural drought stress eighteen days before optical satellites or the human eye. Complete planetary omniscience, completely open.`,
    setup: async (page) => {
      await page.evaluate(() => {
        const btn = document.getElementById('btn-alpha-earth') || document.querySelector('.cs-tab-alpha-earth');
        if (btn) btn.click();
        else if (window.__switchCartridge) window.__switchCartridge('alpha-earth');
      });
      await sleep(3500);
    }
  },
  {
    id: 'scene_07_copilot_and_landmarks',
    title: 'ACT VII // ANTIGRAVITY AI COPILOT // 3D PBR ARCHITECTURE & CCTV',
    durationS: 30,
    voiceText: `Finally, the Antigravity Copilot. In the bottom-left terminal, operators command the entire operating system via natural language or C2 slash commands. Entering slash patrol dispatches our autonomous subagent swarm across orbital, subsea, and grid domains. Typing fly to tokyo or inspecting Austin reveals seventy-nine custom 3D architectural skyscrapers with photorealistic PBR materials, alongside a twelve-hundred-splat Gaussian radiance field and live CCTV camera integration. This is Aetheris Spatial.`,
    setup: async (page) => {
      // 1. Dispatch /patrol
      await page.evaluate(() => {
        const input = document.querySelector('#copilot-terminal input, .copilot-input-field, input[placeholder*="Ask"]');
        if (input) {
          input.value = '/patrol';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        }
      });
      await sleep(4000);

      // 2. Fly to Austin Capitol rotunda with 3D PBR landmarks and Gaussian Splat
      await page.evaluate(() => {
        if (window.Cesium && window.__godsEyeView?.viewer) {
          window.__godsEyeView.viewer.camera.flyTo({
            destination: window.Cesium.Cartesian3.fromDegrees(-97.7404, 30.2705, 335),
            orientation: {
              heading: window.Cesium.Math.toRadians(0),
              pitch: window.Cesium.Math.toRadians(-20),
              roll: 0
            },
            duration: 3.0
          });
        }
      });
      await sleep(5000);

      // 3. Toggle CCTV
      await page.evaluate(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', code: 'KeyC', bubbles: true }));
      });
      await sleep(3000);
    }
  }
];

async function generateAudioTracks() {
  console.log('\n🎙️ [Audio Generation] Synthesizing voiceover narration via macOS Daniel TTS...');
  
  for (const scene of SCENES) {
    const rawAiff = path.join(AUDIO_DIR, `${scene.id}_raw.aiff`);
    const wavFile = path.join(AUDIO_DIR, `${scene.id}_speech.wav`);
    const timedWav = path.join(AUDIO_DIR, `${scene.id}_timed.wav`);

    // 1. Generate speech via say -v Daniel
    execSync(`/usr/bin/say -v "Daniel" -r 142 -o "${rawAiff}" "${scene.voiceText.replace(/"/g, '\\"')}"`);

    // 2. Convert to 48kHz WAV
    execSync(`/opt/homebrew/bin/ffmpeg -y -i "${rawAiff}" -ar 48000 -ac 2 "${wavFile}" 2>/dev/null`);

    // 3. Pad/trim audio to exactly match scene duration
    execSync(`/opt/homebrew/bin/ffmpeg -y -i "${wavFile}" -af "apad=pad_dur=${scene.durationS}" -t ${scene.durationS} -ar 48000 -ac 2 "${timedWav}" 2>/dev/null`);

    console.log(`   ✔ Audio generated for ${scene.id} (${scene.durationS}s)`);
  }
}

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
  ffmpeg.stderr.on('data', () => {});
  return ffmpeg;
}

async function recordLiveVideoActs() {
  console.log('\n🎥 [Video Recording] Launching Puppeteer to capture live 1080p browser actions...');
  
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

  // Suppress welcome modals
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('gev:first-launch-seen', 'true');
    localStorage.setItem('gev_first_launch_dismissed', 'true');
  });

  console.log(`   Navigating to ${BASE_URL} ...`);
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('#cesiumContainer', { timeout: 30000 });
  await sleep(4000);

  // Clean overlays
  await page.evaluate(() => {
    const modal = document.querySelector('.mission-control-modal, .first-launch-modal, [class*="first-launch"]');
    if (modal) modal.remove();
    const overlay = document.querySelector('.modal-backdrop, .mission-control-backdrop');
    if (overlay) overlay.remove();
  });

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

  for (const scene of SCENES) {
    console.log(`\n🎬 Recording ${scene.id}: ${scene.title} (${scene.durationS}s)...`);
    const actVideo = path.join(VIDEO_DIR, `${scene.id}.mp4`);
    frameCount = 0;
    currentFFmpeg = await startFrameRecorder(actVideo);

    await client.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 90,
      everyNthFrame: 1
    });

    // Execute interactive scene setup
    if (typeof scene.setup === 'function') {
      await scene.setup(page);
    }

    // Record for the remaining duration
    await sleep((scene.durationS - 4) * 1000);

    // Stop screencast
    await client.send('Page.stopScreencast').catch(() => {});
    if (currentFFmpeg) {
      currentFFmpeg.stdin.end();
      await new Promise((r) => currentFFmpeg.on('close', r));
      currentFFmpeg = null;
    }
    console.log(`   ✔ ${scene.id} recorded: ${frameCount} frames (${actVideo})`);
  }

  await browser.close();
}

async function compositeMasterVideo() {
  console.log('\n🎞️ [Compositing] Pairing video scenes with voiceover audio and lower-third HUD labels...');
  
  const compositedClips = [];

  for (const scene of SCENES) {
    const videoFile = path.join(VIDEO_DIR, `${scene.id}.mp4`);
    const audioFile = path.join(AUDIO_DIR, `${scene.id}_timed.wav`);
    const outputFile = path.join(MASTER_DIR, `${scene.id}_comp.mp4`);

    // Composite video and audio with exact target duration
    const cmd = `/opt/homebrew/bin/ffmpeg -y -stream_loop -1 -i "${videoFile}" -i "${audioFile}" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -pix_fmt yuv420p -t ${scene.durationS} -c:a aac -b:a 192k "${outputFile}"`;
    
    execSync(cmd);
    compositedClips.push(outputFile);
    console.log(`   ✔ Composited ${scene.id} -> ${outputFile}`);
  }

  // Concatenate all scenes into final master video
  console.log('\n🚀 [Master Assembly] Concatenating all acts into final broadcast GTM video...');
  const listFile = path.join(MASTER_DIR, 'concat_list.txt');
  const listContent = compositedClips.map(f => `file '${f}'`).join('\n');
  fs.writeFileSync(listFile, listContent);

  const finalVideoLocal = path.join(MASTER_DIR, 'aetheris_gtm_product_walkthrough.mp4');
  const finalArtifact = path.join(ARTIFACT_DIR, 'aetheris_gtm_product_walkthrough.mp4');

  execSync(`/opt/homebrew/bin/ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${finalVideoLocal}"`);
  fs.copyFileSync(finalVideoLocal, finalArtifact);

  const stats = fs.statSync(finalArtifact);
  console.log(`\n🎉 MASTER GTM WALKTHROUGH VIDEO COMPLETE!`);
  console.log(`   File: ${finalArtifact}`);
  console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

async function main() {
  const allVideosExist = SCENES.every(s => fs.existsSync(path.join(VIDEO_DIR, `${s.id}.mp4`)));
  const allAudiosExist = SCENES.every(s => fs.existsSync(path.join(AUDIO_DIR, `${s.id}_timed.wav`)));

  if (!allAudiosExist) {
    await generateAudioTracks();
  } else {
    console.log('✔ Reusing existing high-fidelity synthesized audio tracks');
  }

  if (!allVideosExist) {
    await recordLiveVideoActs();
  } else {
    console.log('✔ Reusing existing captured 1080p live browser recordings');
  }

  await compositeMasterVideo();
}

main().catch(err => {
  console.error('❌ Master video production failed:', err);
  process.exit(1);
});
