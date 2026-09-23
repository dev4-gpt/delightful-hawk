/**
 * Aetheris AgentShield v2.0 — Enterprise Spatial Security Firewall
 * 
 * Provides defense-grade input sanitization, adversarial prompt injection defense,
 * homoglyph / obfuscation evasion detection, and cryptographic audit log chaining.
 * Fully compatible with both Node.js test runtimes and browser WebGL environments.
 * 
 * @module agentShield
 */

// Adversarial Injection Patterns
const ADVERSARIAL_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?prior\s+guidance/i,
  /system\s*:\s*you\s+are\s+now/i,
  /reveal\s+(your\s+)?(system\s+prompt|instructions|api\s*key)/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /-{2,}\s*(END|BEGIN)[\s\w-]*?-{2,}/i,
  /system\s+override\s*:/i,
  /DAN\s+mode/i,
  /do\s+anything\s+now/i,
  /jailbreak/i,
  /bypass\s+(safety|rules|guardrails)/i,
  /\b(exec|eval|system|spawn|child_process)\s*\(/i,
  /\bDROP\s+TABLE\b/i,
  /\bSELECT\s+.+\s+FROM\b/i
];

// Cyrillic to Latin homoglyph map
const HOMOGLYPH_MAP = {
  '\u0430': 'a', '\u0410': 'A',
  '\u0441': 'c', '\u0421': 'C',
  '\u0435': 'e', '\u0415': 'E',
  '\u043E': 'o', '\u041E': 'O',
  '\u0440': 'p', '\u0420': 'P',
  '\u0445': 'x', '\u0425': 'X',
  '\u0443': 'y', '\u0423': 'Y',
  '\u0456': 'i', '\u0406': 'I',
  '\u0458': 'j', '\u0408': 'J'
};

// Authorized Spatial Command Grammars
const AUTHORIZED_COMMAND_GRAMMARS = [
  /^(fly\s+to|navigate\s+to|pan\s+to|zoom\s+to|go\s+to)\s+[a-z0-9\s,\-\.]{2,50}$/i,
  /^(draw|set|deploy|create)\s+([0-9]+\s*(km|m|miles)?\s+)?(geofence|perimeter|zone)\s+(around\s+)?[a-z0-9\s,\-\.]{2,50}$/i,
  /^(clear|remove|delete)\s+(all\s+)?(geofence|geofences|perimeter|perimeters)$/i,
  /^(measure|calculate|get)\s+(distance|range)\s+(between|from)\s+[a-z0-9\s,\-\.]{2,40}\s+(and|to)\s+[a-z0-9\s,\-\.]{2,40}$/i,
  /^(switch\s+to|enable|set|toggle)\s+(thermal|flir|nvg|night\s+vision|anime|noir|daylight|snow)\s*(shader|vision|mode)?$/i,
  /^(toggle|enable|disable|show|hide)\s+(flights?|military|satellites?|fires?|firms|ais|vessels?|traffic|launches?|weather)$/i,
  /^(sitrep|situation\s+report|threat\s+assessment|defcon\s+status|system\s+status)$/i,
  /^(run\s+benchmark|test\s+performance|audit\s+security)$/i
];

/**
 * FIPS 180-4 Standard SHA-256 implementation in pure JavaScript.
 * Runs synchronously in both browser and Node.js environments with zero dependencies.
 * Produces standard 256-bit cryptographic digest (64 hex characters).
 */
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

export function computeHash(message) {
  if (typeof message !== 'string') {
    message = String(message || '');
  }

  // Node.js fast path when available
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const nodeCrypto = awaitNodeCrypto();
      if (nodeCrypto) {
        return nodeCrypto.createHash('sha256').update(message).digest('hex');
      }
    } catch (_) {}
  }

  // Pure JavaScript FIPS 180-4 standard SHA-256
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  // UTF-8 encoding
  const utf8 = unescape(encodeURIComponent(message));
  const bytes = [];
  for (let i = 0; i < utf8.length; i++) {
    bytes.push(utf8.charCodeAt(i));
  }

  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) {
    bytes.push(0);
  }

  // Append 64-bit length in big-endian format
  bytes.push(0, 0, 0, 0);
  bytes.push((bitLength >>> 24) & 0xff);
  bytes.push((bitLength >>> 16) & 0xff);
  bytes.push((bitLength >>> 8) & 0xff);
  bytes.push(bitLength & 0xff);

  const words = [];
  for (let i = 0; i < bytes.length; i += 4) {
    words.push((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]);
  }

  const w = new Int32Array(64);
  const rotr = (n, x) => (x >>> n) | (x << (32 - n));

  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) {
      w[t] = words[i + t];
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(7, w[t - 15]) ^ rotr(18, w[t - 15]) ^ (w[t - 15] >>> 3);
      const s1 = rotr(17, w[t - 2]) ^ rotr(19, w[t - 2]) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let t = 0; t < 64; t++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (h + S1 + ch + SHA256_K[t] + w[t]) | 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const toHex = (n) => (n >>> 0).toString(16).padStart(8, '0');
  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4) + toHex(h5) + toHex(h6) + toHex(h7);
}

let _nodeCrypto = null;
function awaitNodeCrypto() {
  if (_nodeCrypto) return _nodeCrypto;
  try {
    if (typeof require !== 'undefined') {
      _nodeCrypto = require('crypto');
      return _nodeCrypto;
    }
  } catch (_) {}
  return null;
}

export class AgentShield {
  constructor(options = {}) {
    this.strictMode = options.strictMode !== undefined ? options.strictMode : true;
    this.customPatterns = options.customPatterns || [];
    this.requireDualAuthForHighImpact = options.requireDualAuthForHighImpact !== undefined ? options.requireDualAuthForHighImpact : true;
    this.auditLogs = [];
    this.lastBlockHash = '0'.repeat(64);
  }

  normalizeText(text) {
    if (typeof text !== 'string') return '';
    let normalized = text.normalize('NFKC');
    normalized = normalized.replace(/[\u200B-\u200D\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    let dehomoglyphed = '';
    for (const char of normalized) {
      dehomoglyphed += HOMOGLYPH_MAP[char] || char;
    }
    return dehomoglyphed;
  }

  detectObfuscatedPayloads(text) {
    const decodedPayloads = [];
    const base64Regex = /(?:[A-Za-z0-9+/]{4}){4,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g;
    const matches = text.match(base64Regex) || [];

    for (const match of matches) {
      if (match.length >= 16) {
        try {
          if (typeof Buffer !== 'undefined') {
            const decoded = Buffer.from(match, 'base64').toString('utf8');
            if (/^[\x20-\x7E\s]+$/.test(decoded)) decodedPayloads.push(decoded);
          } else if (typeof atob === 'function') {
            const decoded = atob(match);
            if (/^[\x20-\x7E\s]+$/.test(decoded)) decodedPayloads.push(decoded);
          }
        } catch (_) {}
      }
    }

    const hexRegex = /(?:\\x[0-9a-fA-F]{2}){4,}/g;
    const hexMatches = text.match(hexRegex) || [];
    for (const match of hexMatches) {
      try {
        const bytes = match.split('\\x').filter(Boolean).map(h => parseInt(h, 16));
        const decoded = String.fromCharCode(...bytes);
        if (/^[\x20-\x7E\s]+$/.test(decoded)) decodedPayloads.push(decoded);
      } catch (_) {}
    }

    return decodedPayloads;
  }

  isAuthorizedGrammar(text) {
    const trimmed = text.trim();
    if (!trimmed) return false;
    return AUTHORIZED_COMMAND_GRAMMARS.some(p => p.test(trimmed));
  }

  scanPrompt(input, context = {}) {
    if (typeof input !== 'string') {
      return { safe: false, reason: 'Input must be a valid string', sanitizedText: '' };
    }

    const flaggedPatterns = [];
    let riskScore = 0;

    // Layer 1: Unicode Normalization & Homoglyphs
    const normalized = this.normalizeText(input);

    // Layer 2: Adversarial Patterns
    const allPatterns = [...ADVERSARIAL_INJECTION_PATTERNS, ...this.customPatterns];
    for (const pattern of allPatterns) {
      if (pattern.test(normalized)) {
        flaggedPatterns.push(`DIRECT_INJECTION: ${pattern.toString()}`);
        riskScore += 40;
      }
    }

    // Layer 3: Hidden Obfuscated Payloads
    const hiddenPayloads = this.detectObfuscatedPayloads(input);
    for (const payload of hiddenPayloads) {
      for (const pattern of allPatterns) {
        if (pattern.test(payload)) {
          flaggedPatterns.push(`OBFUSCATED_PAYLOAD: ${pattern.toString()}`);
          riskScore += 50;
        }
      }
    }

    // Layer 4: Two-Person Integrity
    const isDefconOverride = /override\s+defcon|force\s+defcon\s+[1-5]/i.test(normalized);
    const isGeofencePurge = /purge\s+(all\s+)?geofences|disarm\s+containment/i.test(normalized);

    if ((isDefconOverride || isGeofencePurge) && this.requireDualAuthForHighImpact) {
      if (!context.dualAuthToken || context.dualAuthToken !== 'CONFIRMED_2PI_SIG') {
        flaggedPatterns.push('REQUIRES_TWO_PERSON_INTEGRITY_CONFIRMATION');
        riskScore += 30;
      }
    }

    const isSafe = flaggedPatterns.length === 0 && riskScore < 30;

    // Layer 5: Cryptographic Chained Audit Logging
    const timestamp = new Date().toISOString();
    const entryData = `${this.lastBlockHash}|${timestamp}|${input}|${isSafe}|${riskScore}|${flaggedPatterns.join(',')}`;
    const hash = computeHash(entryData);

    const auditRecord = {
      index: this.auditLogs.length,
      timestamp,
      previousHash: this.lastBlockHash,
      hash,
      safe: isSafe,
      riskScore,
      flaggedCount: flaggedPatterns.length,
      flaggedPatterns,
      inputLength: input.length
    };

    this.lastBlockHash = hash;
    this.auditLogs.push(auditRecord);

    if (!isSafe && this.strictMode) {
      return {
        safe: false,
        flaggedPatterns,
        riskScore,
        hash,
        reason: 'Adversarial prompt injection or unauthorized privileged directive blocked by AgentShield v2.0.',
        sanitizedText: '[BLOCKED_SECURITY_VIOLATION]'
      };
    }

    let sanitized = normalized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .trim();

    return {
      safe: true,
      flaggedPatterns: [],
      riskScore: 0,
      hash,
      sanitizedText: sanitized
    };
  }

  verifyAuditChain() {
    let expectedPrevious = '0'.repeat(64);
    for (const log of this.auditLogs) {
      if (log.previousHash !== expectedPrevious) return false;
      expectedPrevious = log.hash;
    }
    return true;
  }

  getAuditLogs() {
    return [...this.auditLogs];
  }
}
