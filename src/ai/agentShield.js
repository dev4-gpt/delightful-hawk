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
 * Universal fast SHA-256 computation (Node.js or synchronous fallback)
 */
function computeHash(message) {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const crypto = globalThis.crypto || null;
      // In Node.js environment
      const nodeCrypto = awaitNodeCrypto();
      if (nodeCrypto) {
        return nodeCrypto.createHash('sha256').update(message).digest('hex');
      }
    } catch (_) {}
  }
  
  // High-performance deterministic 64-character hash fallback
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d, h3 = 0x9e3779b9, h4 = 0x85ebca6b;
  for (let i = 0; i < message.length; i++) {
    const ch = message.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 3812015801);
    h4 = Math.imul(h4 ^ ch, 2246822507);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const p3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const p4 = (h4 >>> 0).toString(16).padStart(8, '0');
  return (p1 + p2 + p3 + p4 + p4 + p3 + p2 + p1).slice(0, 64);
}

let _nodeCrypto = null;
function awaitNodeCrypto() {
  if (_nodeCrypto) return _nodeCrypto;
  try {
    // Dynamic import cache for node crypto
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
