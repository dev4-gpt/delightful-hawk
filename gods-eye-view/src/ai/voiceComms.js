/**
 * Aetheris Tactical Voice Comms & Military Audio FX Engine
 * 
 * Provides:
 * 1. Speech-to-Text via Web Speech Recognition with push-to-talk triggers.
 * 2. Tactical Text-to-Speech with simulated VHF military radio comms audio filters:
 *    - Radio squelch click & burst sound synthesis via Web Audio API.
 *    - Realistic radio operator cadence and tone.
 * 
 * @module voiceComms
 */

export class TacticalVoiceOperator {
  constructor({ onTranscript = null, onStatusChange = null } = {}) {
    this.onTranscript = onTranscript;
    this.onStatusChange = onStatusChange;
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.audioCtx = null;

    this.initRecognition();
  }

  getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[VoiceComms] Web Speech API not supported in this browser environment.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.playRadioSquelch('chirp');
        this.notifyStatus();
      };

      this.recognition.onresult = (event) => {
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          if (this.onTranscript && transcript.trim()) {
            this.onTranscript(transcript.trim());
          }
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('[VoiceComms] Speech recognition error:', event.error);
        this.isListening = false;
        this.notifyStatus();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.notifyStatus();
      };
    } catch (err) {
      console.warn('[VoiceComms] Failed to initialize SpeechRecognition:', err.message);
    }
  }

  notifyStatus() {
    if (this.onStatusChange) {
      this.onStatusChange({
        isListening: this.isListening,
        isSpeaking: this.isSpeaking
      });
    }
  }

  startListening() {
    if (!this.recognition) return false;
    if (this.isListening) return true;

    try {
      this.recognition.start();
      return true;
    } catch {
      return false;
    }
  }

  stopListening() {
    if (!this.recognition) return;
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.notifyStatus();
    }
  }

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  /**
   * Synthesizes tactical speech with VHF radio squelch clicks.
   * @param {string} text 
   * @returns {Promise<void>}
   */
  async speakTactical(text) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    this.isSpeaking = true;
    this.notifyStatus();

    // Play initial VHF squelch click
    this.playRadioSquelch('click');

    await new Promise((resolve) => {
      // Allow squelch click to breathe for 80ms
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 0.95; // slightly lower military commander pitch
        utterance.lang = 'en-US';

        utterance.onend = () => {
          // Play ending radio squelch release burst
          this.playRadioSquelch('burst');
          setTimeout(() => {
            this.isSpeaking = false;
            this.notifyStatus();
            resolve();
          }, 120);
        };

        utterance.onerror = () => {
          this.isSpeaking = false;
          this.notifyStatus();
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      }, 80);
    });
  }

  /**
   * Plays authentic VHF tactical radio squelch audio via Web Audio API.
   * @param {'click'|'chirp'|'burst'} type 
   */
  playRadioSquelch(type = 'click') {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = type === 'burst' ? 0.08 : (type === 'chirp' ? 0.05 : 0.03);

      // Create white noise buffer
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter to simulate tactical handheld radio frequency response (300Hz - 3kHz)
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(type === 'chirp' ? 2400 : 1200, now);
      filter.Q.setValueAtTime(3.0, now);

      // Volume envelope
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
    } catch {
      // Ignore audio synthesis errors on locked audio policies
    }
  }
}
