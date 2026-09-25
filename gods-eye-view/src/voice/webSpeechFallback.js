export class WebSpeechController {
  constructor({ runner, ui, cartridgeRegistry }) {
    this.runner = runner;
    this.ui = ui;
    this.cartridgeRegistry = cartridgeRegistry;
    this.recognition = null;
    this.isListening = false;
    this.synthesis = window.speechSynthesis;

    // Eagerly mount tactical text command bar on initial boot
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      setTimeout(() => this.ensureTextCommandInput(), 500);
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          this.handleTranscript(finalTranscript.toLowerCase().trim());
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            // Already started or error
          }
        }
      };
      
      this.recognition.onerror = (e) => {
        console.warn('Web Speech API Error:', e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          this.stop();
        }
      };
    }
  }

  start() {
    this.ensureTextCommandInput();
    if (!this.recognition) {
      if (this.ui) {
        if (this.ui.root) {
          this.ui.root.dataset.status = 'listening';
          this.ui.root.dataset.microphone = 'standby';
        }
        if (this.ui.status) {
          this.ui.status.textContent = 'TEXT COMMAND ACTIVE';
          this.ui.status.style.color = '#00f0ff';
        }
        if (this.ui.detail) {
          this.ui.detail.textContent = 'MIC UNAVAILABLE — USE COMMAND BAR';
        }
      }
      this.addBridgeMessage('[SYSTEM] Web Speech API unavailable in this environment. Tactical text command bar activated.');
      return;
    }

    this.isListening = true;
    try {
      this.recognition.start();
    } catch(e) {}
    
    if (this.ui) {
      if (this.ui.root) {
        this.ui.root.dataset.status = 'listening';
        this.ui.root.dataset.microphone = 'active';
      }
      if (this.ui.status) {
        this.ui.status.textContent = 'LISTENING (LOCAL VOICE)';
        this.ui.status.style.color = '#00ff00';
      }
      if (this.ui.detail) {
        this.ui.detail.textContent = 'LOCAL VOICE';
      }
    }
  }

  ensureTextCommandInput() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('aetheris-voice-text-input')) return;
    const targetParent = document.getElementById('agent-tactical-drawer') || document.body;
    const inputContainer = document.createElement('div');
    inputContainer.id = 'aetheris-voice-text-input';
    inputContainer.style.cssText = `
      display: flex;
      gap: 6px;
      margin-top: 8px;
      width: 100%;
      pointer-events: auto;
    `;
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Tactical command (e.g. "orbital", "fly to London")...';
    input.style.cssText = `
      flex: 1;
      background: rgba(15, 25, 40, 0.9);
      border: 1px solid rgba(0, 240, 255, 0.3);
      border-radius: 4px;
      color: #fff;
      font-family: ui-monospace, monospace;
      font-size: 11px;
      padding: 5px 8px;
      outline: none;
    `;
    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'EXEC';
    submitBtn.style.cssText = `
      background: rgba(0, 240, 255, 0.2);
      border: 1px solid #00f0ff;
      border-radius: 4px;
      color: #00f0ff;
      font-family: ui-monospace, monospace;
      font-size: 10px;
      font-weight: bold;
      padding: 5px 10px;
      cursor: pointer;
    `;
    const send = () => {
      const val = input.value.trim();
      if (val) {
        this.handleTranscript(val.toLowerCase());
        input.value = '';
      }
    };
    submitBtn.onclick = send;
    input.onkeydown = (e) => {
      if (e.key === 'Enter') send();
    };
    inputContainer.appendChild(input);
    inputContainer.appendChild(submitBtn);
    targetParent.appendChild(inputContainer);
  }

  stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch(e) {}
    }
  }

  speakResponse(text) {
    if (!this.synthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.8;
    utterance.rate = 1.2;
    this.synthesis.speak(utterance);
    
    this.addBridgeMessage(`[VOICE AGENT] ${text}`);
  }

  addBridgeMessage(msg) {
    const bridge = document.getElementById('agent-bridge-content');
    if (bridge) {
      const line = document.createElement('div');
      line.innerText = msg;
      line.style.margin = '4px 0';
      line.style.fontSize = '12px';
      if (msg.includes('[USER COMMAND]')) {
         line.style.color = '#88ccff';
      } else if (msg.includes('[VOICE AGENT]')) {
         line.style.color = '#44ff44';
      }
      bridge.appendChild(line);
      bridge.scrollTop = bridge.scrollHeight;
    }
  }

  async handleTranscript(transcript) {
    this.addBridgeMessage(`[USER COMMAND] "${transcript}"`);
    
    if (/\b(subsea|cable|maritime|sentinel)\b/.test(transcript)) {
      this.cartridgeRegistry?.activate('sentinel-mesh');
      this.speakResponse('Switching to SentinelMesh. Subsea cable defense active.');
      return;
    }
    if (/\b(orbital|satellite|space|debris|conjunction)\b/.test(transcript)) {
      this.cartridgeRegistry?.activate('orbital-ops');
      this.speakResponse('Orbital Ops engaged. Space domain awareness active.');
      return;
    }
    if (/\b(grid|power|thermal|datacenter|substation)\b/.test(transcript)) {
      this.cartridgeRegistry?.activate('grid-twin');
      this.speakResponse('Grid Twin activated. Power infrastructure monitoring online.');
      return;
    }
    if (/\b(fire|wildfire|disaster|risk)\b/.test(transcript)) {
      this.cartridgeRegistry?.activate('geo-risk');
      this.speakResponse('Geo Risk activated. Disaster assessment standing by.');
      return;
    }

    let match = transcript.match(/(?:fly to|go to|zoom into)\s+(.+)/);
    if (match) {
      const location = match[1];
      if (this.runner) {
        await this.runner('fly_to_location', { query: location });
      }
      this.speakResponse(`Flying to ${location}.`);
      return;
    }
    if (/(full globe|reset view|zoom out)/.test(transcript)) {
      if (this.runner) {
        await this.runner('zoom_to_globe', {});
      }
      this.speakResponse('Resetting view.');
      return;
    }

    match = transcript.match(/(thermal|surveillance|noir|normal|snow)/);
    if (match) {
      const style = match[1];
      if (this.runner) {
        await this.runner('set_visual_style', { style });
      }
      if (style === 'thermal' || style === 'surveillance') {
        this.speakResponse('Thermal surveillance engaged.');
      } else {
        this.speakResponse(`Visual style set to ${style}.`);
      }
      return;
    }

    match = transcript.match(/(show|hide)\s+(.+)/);
    if (match) {
      const action = match[1];
      const layer = match[2].trim();
      const enabled = action === 'show';
      if (this.runner) {
        try {
          await this.runner('set_layer_visibility', { layerId: layer, enabled });
          this.speakResponse(`${enabled ? 'Showing' : 'Hiding'} ${layer}.`);
        } catch (err) {
          console.error(err);
          this.speakResponse(`Could not ${action} ${layer}.`);
        }
      }
      return;
    }
  }
}

export function createWebSpeechFallback({ runner, ui, cartridgeRegistry }) {
  return new WebSpeechController({ runner, ui, cartridgeRegistry });
}
