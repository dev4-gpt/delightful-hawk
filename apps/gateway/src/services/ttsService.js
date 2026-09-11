import { Buffer } from 'node:buffer';

export function getVoicePersonas() {
  return {
    tactical_command: 'Deep military radar briefing cadence (48kHz)',
    orbital_flight_director: 'High-cadence aerospace controller',
    subsea_analyst: 'Measured maritime intelligence analyst'
  };
}

/**
 * Creates a valid but simple WAV PCM audio buffer (48kHz, 16-bit, mono).
 * This fallback simulates a crisp tactical tone when the VoxCPM server is unreachable.
 */
function generateFallbackWavBuffer() {
  const sampleRate = 48000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const durationSeconds = 1;
  const numSamples = sampleRate * durationSeconds;
  
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const chunkSize = 36 + dataSize;
  
  const buffer = Buffer.alloc(44 + dataSize);
  
  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(chunkSize, 4);
  buffer.write('WAVE', 8);
  
  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  
  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  
  // Generate a simple tone
  const frequency = 440; // A4
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t) * 0.5; // half volume
    const val = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(val, 44 + i * 2);
  }
  
  return buffer;
}

export async function synthesizeSpeech({ text, voicePersona = 'tactical_command', format = 'wav' }) {
  const apiUrl = process.env.VOXCPM_API_URL || 'http://127.0.0.1:8080/v1/audio/speech';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        voice: voicePersona,
        response_format: format
      }),
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      return Buffer.from(await response.arrayBuffer());
    }
  } catch (error) {
    // If VoxCPM server is unreachable, gracefully fallback
    console.warn(`[TTS] VoxCPM server unreachable at ${apiUrl}. Using synthesized fallback audio.`);
  }
  
  return generateFallbackWavBuffer();
}
