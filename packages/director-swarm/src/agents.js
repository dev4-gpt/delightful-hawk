/**
 * @aetheris/director-swarm - agents.js
 * Specialized cinematic agent personas operating in an autonomous production swarm.
 */

export class ScreenplayAgent {
  constructor() {
    this.role = 'Executive Screenwriter & Script Decomposer';
  }

  /**
   * Parse a raw natural language concept or script into structured scenes.
   */
  decompose(conceptOrScript) {
    // Splits narrative into cinematic scenes
    const lines = conceptOrScript.split('\n').map(l => l.trim()).filter(Boolean);
    const scenes = [];

    // If script is short prompt, create 2-3 logical shots
    if (lines.length <= 2) {
      scenes.push({
        sceneIndex: 1,
        slugline: 'EXT. TOKYO HARBOR - DUSK',
        description: `Establishing wide cinematic view: ${conceptOrScript}`,
        location: 'Tokyo Harbor',
        timeOfDay: 'Dusk',
        characters: ['Protagonist'],
        dialogue: [],
        mood: 'Atmospheric and contemplative'
      });
      scenes.push({
        sceneIndex: 2,
        slugline: 'EXT. SKYLINE OVERLOOK - NIGHT',
        description: 'Dynamic forward tracking shot capturing neon reflections on wet asphalt and cyberpunk architecture.',
        location: 'Tokyo Overlook',
        timeOfDay: 'Night',
        characters: ['Protagonist'],
        dialogue: [{ speaker: 'Protagonist', line: 'The world changes faster than memory can hold.' }],
        mood: 'High-stakes urgency'
      });
      return scenes;
    }

    // Multi-line script parsing
    let currentScene = null;
    let sceneCounter = 1;

    for (const line of lines) {
      if (line.startsWith('INT.') || line.startsWith('EXT.')) {
        if (currentScene) scenes.push(currentScene);
        currentScene = {
          sceneIndex: sceneCounter++,
          slugline: line,
          description: '',
          dialogue: [],
          characters: []
        };
      } else if (line.includes(':') && currentScene) {
        const [speaker, text] = line.split(':');
        const trimmedSpeaker = speaker.trim();
        currentScene.dialogue.push({ speaker: trimmedSpeaker, line: text.trim() });
        if (!currentScene.characters.includes(trimmedSpeaker)) {
          currentScene.characters.push(trimmedSpeaker);
        }
      } else if (currentScene) {
        currentScene.description += (currentScene.description ? ' ' : '') + line;
      }
    }
    if (currentScene) scenes.push(currentScene);

    return scenes.length ? scenes : [{
      sceneIndex: 1,
      slugline: 'EXT. OPEN SCENE - CONTINUOUS',
      description: conceptOrScript,
      dialogue: [],
      characters: []
    }];
  }
}

export class CinematographerAgent {
  constructor() {
    this.role = 'Director of Photography & Spatial Camera Planner';
  }

  planShots(scenes) {
    return scenes.map((scene, idx) => {
      const isWide = idx === 0;
      return {
        sceneIndex: scene.sceneIndex,
        shotType: isWide ? 'EXTREME WIDE ESTABLISHING' : 'DYNAMIC ORBITING TRACKING',
        lens: isWide ? '24mm Anamorphic T1.9' : '50mm Master Prime T1.3',
        cameraMotion: isWide ? 'slow-forward-dolly' : 'orbital-arc-right',
        lighting: 'Volumetric cyan rim light with warm tungsten fill and wet asphalt reflections',
        recommendedAspect: '2.39:1',
        cameraSplineWaypoints: isWide
          ? [
              { pos: [0, 80, 150], target: [0, 0, 0], fov: 65, time: 0 },
              { pos: [0, 40, 80], target: [0, 0, 0], fov: 50, time: 5.0 }
            ]
          : [
              { pos: [20, 15, 30], target: [0, 5, 0], fov: 45, time: 0 },
              { pos: [-20, 15, 30], target: [0, 5, 0], fov: 45, time: 5.0 }
            ]
      };
    });
  }
}

export class VoiceDirectorAgent {
  constructor() {
    this.role = 'Vocal Performance & Dialogue Director';
  }

  planVoices(scenes) {
    const vocalJobs = [];
    scenes.forEach(scene => {
      scene.dialogue.forEach(d => {
        vocalJobs.push({
          sceneIndex: scene.sceneIndex,
          speaker: d.speaker,
          text: d.line,
          model: 'voxcpm-tts',
          voicePreset: 'cinematic-resonant-actor',
          emotion: 'introspective-intensity',
          pacing: 0.95
        });
      });
    });
    return vocalJobs;
  }
}

export class VideoDirectorAgent {
  constructor() {
    this.role = 'Video Diffusion Synthesis Planner';
  }

  formulatePrompts(scenes, shotPlans) {
    return scenes.map((scene, i) => {
      const shot = shotPlans[i];
      const prompt = `8k cinematic film still, ${scene.slugline}, ${scene.description}, ${shot.shotType}, shot on ${shot.lens}, ${shot.lighting}, photorealistic 35mm film grain, masterpiece.`;
      const negativePrompt = 'cgi cartoon, 3d render plastic, blurry, distorted anatomy, text artifacts, watermark, jitter, low quality.';

      return {
        sceneIndex: scene.sceneIndex,
        modelId: 'wan-2.1-t2v-14b',
        prompt,
        negativePrompt,
        duration: 5.0,
        aspectRatio: shot.recommendedAspect,
        spatialConditioningWaypoints: shot.cameraSplineWaypoints
      };
    });
  }
}

export class EditorAgent {
  constructor() {
    this.role = 'Master Post-Production & OpenMontage Editor';
  }

  assembleTimeline(videoJobs, vocalJobs) {
    let currentTime = 0;
    const timelineClips = [];

    videoJobs.forEach((vJob, idx) => {
      const clipDuration = vJob.duration || 5.0;
      timelineClips.push({
        clipId: `clip_${idx + 1}`,
        track: 1, // Video
        sceneIndex: vJob.sceneIndex,
        startTime: currentTime,
        duration: clipDuration,
        transitionIn: idx === 0 ? 'fade-in' : 'cross-dissolve',
        transitionDuration: 0.5,
        colorGradeLUT: 'cinematic-kodak-5219-teal-orange'
      });
      currentTime += clipDuration - (idx === 0 ? 0 : 0.5); // overlapping transitions
    });

    const audioClips = vocalJobs.map((voc, i) => ({
      clipId: `vox_${i + 1}`,
      track: 2, // Dialogue Audio
      speaker: voc.speaker,
      text: voc.text,
      startTime: 2.0 + i * 4.0,
      duration: 3.2,
      duckingDbfs: -12.0
    }));

    return {
      projectName: 'Aetheris Cinematic Production',
      totalDurationSec: currentTime,
      aspectRatio: '2.39:1',
      fps: 24,
      timeline: {
        videoTrack: timelineClips,
        dialogueTrack: audioClips,
        musicTrack: [{
          clipId: 'bgm_score_01',
          track: 3,
          startTime: 0,
          duration: currentTime,
          style: 'Atmospheric neo-noir orchestral synth',
          targetVolume: 0.7
        }]
      }
    };
  }
}
