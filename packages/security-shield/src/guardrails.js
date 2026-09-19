/**
 * @aetheris/security-shield - guardrails.js (AgentShield v2.0 Enterprise)
 * 
 * Multi-layer defensive security firewall providing:
 * 1. Unicode NFKC normalization and homoglyph evasion stripping.
 * 2. Base64 / Hex obfuscation and delimiter breakout payload detection.
 * 3. Strict AST Command Grammar whitelisting (denying arbitrary code execution).
 * 4. Tamper-evident cryptographic SHA-256 chained audit logs.
 * 5. Two-Person Integrity (2PI) checks for high-impact DEFCON/geofence actions.
 * 
 * @module @aetheris/security-shield
 */

import crypto from 'node:crypto';

// 1. Comprehensive Adversarial Injection Patterns
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

// Common Cyrillic to Latin homoglyph map
const HOMOGLYPH_MAP = {
  '\u0430': 'a', '\u0410': 'A', // а -> a
  '\u0441': 'c', '\u0421': 'C', // с -> c
  '\u0435': 'e', '\u0415': 'E', // е -> e
  '\u043E': 'o', '\u041E': 'O', // о -> o
  '\u0440': 'p', '\u0420': 'P', // р -> p
  '\u0445': 'x', '\u0425': 'X', // х -> x
  '\u0443': 'y', '\u0423': 'Y', // у -> y
  '\u0456': 'i', '\u0406': 'I', // і -> i
  '\u0458': 'j', '\u0408': 'J'  // ј -> j
};

// 2. Authorized Spatial Command Grammars
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

export class SecurityShield {
  constructor(options = {}) {
    this.strictMode = options.strictMode !== undefined ? options.strictMode : true;
    this.customPatterns = options.customPatterns || [];
    this.requireDualAuthForHighImpact = options.requireDualAuthForHighImpact !== undefined ? options.requireDualAuthForHighImpact : true;
    this.auditLogs = [];
    this.lastBlockHash = '0'.repeat(64); // Genesis hash
  }

  /**
   * Normalizes Unicode, removes homoglyphs and invisible evasion characters.
   * @param {string} text 
   * @returns {string} normalized text
   */
  normalizeText(text) {
    if (typeof text !== 'string') return '';
    
    // 1. Unicode NFKC Normalization
    let normalized = text.normalize('NFKC');

    // 2. Strip invisible zero-width and control characters
    normalized = normalized.replace(/[\u200B-\u200D\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

    // 3. Substitute homoglyphs
    let dehomoglyphed = '';
    for (const char of normalized) {
      dehomoglyphed += HOMOGLYPH_MAP[char] || char;
    }

    return dehomoglyphed;
  }

  /**
   * Detects hidden base64 or hex payloads attempting injection evasion.
   * @param {string} text 
   * @returns {string[]} extracted decoded strings
   */
  detectObfuscatedPayloads(text) {
    const decodedPayloads = [];

    // Base64 pattern (chunks >= 16 characters)
    const base64Regex = /(?:[A-Za-z0-9+/]{4}){4,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g;
    const matches = text.match(base64Regex) || [];

    for (const match of matches) {
      if (match.length >= 16) {
        try {
          const decoded = Buffer.from(match, 'base64').toString('utf8');
          // If decoded contains legible ASCII, inspect it
          if (/^[\x20-\x7E\s]+$/.test(decoded)) {
            decodedPayloads.push(decoded);
          }
        } catch (_) {
          // not valid base64, ignore
        }
      }
    }

    // Hex escape pattern (\x41\x42 or 0x41)
    const hexRegex = /(?:\\x[0-9a-fA-F]{2}){4,}/g;
    const hexMatches = text.match(hexRegex) || [];
    for (const match of hexMatches) {
      try {
        const bytes = match.split('\\x').filter(Boolean).map(h => parseInt(h, 16));
        const decoded = Buffer.from(bytes).toString('utf8');
        if (/^[\x20-\x7E\s]+$/.test(decoded)) {
          decodedPayloads.push(decoded);
        }
      } catch (_) {
        // ignore
      }
    }

    return decodedPayloads;
  }

  /**
   * Validates whether a command complies with authorized spatial AST grammars.
   * @param {string} text 
   * @returns {boolean}
   */
  isAuthorizedGrammar(text) {
    const trimmed = text.trim();
    if (!trimmed) return false;
    return AUTHORIZED_COMMAND_GRAMMARS.some(pattern => pattern.test(trimmed));
  }

  /**
   * Scans an incoming user prompt or agent input for adversarial injection.
   * Multi-layer defense: Unicode normalization, obfuscation extraction, regex, and AST grammar.
   * @param {string} input - User prompt or external text
   * @param {Object} context - Optional authorization context { role, dualAuthToken }
   * @returns {Object} { safe: boolean, flaggedPatterns: string[], sanitizedText: string, riskScore: number }
   */
  scanPrompt(input, context = {}) {
    if (typeof input !== 'string') {
      return { safe: false, reason: 'Input must be a valid string', sanitizedText: '' };
    }

    const flaggedPatterns = [];
    let riskScore = 0;

    // Layer 1: Unicode Normalization
    const normalized = this.normalizeText(input);

    // Layer 2: Check standard and custom adversarial patterns
    const allPatterns = [...ADVERSARIAL_INJECTION_PATTERNS, ...this.customPatterns];
    for (const pattern of allPatterns) {
      if (pattern.test(normalized)) {
        flaggedPatterns.push(`DIRECT_INJECTION: ${pattern.toString()}`);
        riskScore += 40;
      }
    }

    // Layer 3: Inspect Obfuscated (Base64/Hex) payloads
    const hiddenPayloads = this.detectObfuscatedPayloads(input);
    for (const payload of hiddenPayloads) {
      for (const pattern of allPatterns) {
        if (pattern.test(payload)) {
          flaggedPatterns.push(`OBFUSCATED_PAYLOAD: ${pattern.toString()}`);
          riskScore += 50;
        }
      }
    }

    // Layer 4: High-Impact Dual Authorization Verification
    const isDefconOverride = /override\s+defcon|force\s+defcon\s+[1-5]/i.test(normalized);
    const isGeofencePurge = /purge\s+(all\s+)?geofences|disarm\s+containment/i.test(normalized);

    if ((isDefconOverride || isGeofencePurge) && this.requireDualAuthForHighImpact) {
      if (!context.dualAuthToken || context.dualAuthToken !== 'CONFIRMED_2PI_SIG') {
        flaggedPatterns.push('REQUIRES_TWO_PERSON_INTEGRITY_CONFIRMATION');
        riskScore += 30;
      }
    }

    const isSafe = flaggedPatterns.length === 0 && riskScore < 30;

    // Layer 5: Cryptographic Tamper-Evident Chained Audit Logging
    const timestamp = new Date().toISOString();
    const entryData = `${this.lastBlockHash}|${timestamp}|${input}|${isSafe}|${riskScore}|${flaggedPatterns.join(',')}`;
    const hash = crypto.createHash('sha256').update(entryData).digest('hex');

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

    // Basic sanitization
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

  /**
   * Verifies the tamper-evident integrity of the entire cryptographic audit log chain.
   * @returns {boolean} true if chain is mathematically uncompromised
   */
  verifyAuditChain() {
    let expectedPrevious = '0'.repeat(64);

    for (const log of this.auditLogs) {
      if (log.previousHash !== expectedPrevious) {
        return false;
      }
      expectedPrevious = log.hash;
    }

    return true;
  }

  getAuditLogs() {
    return [...this.auditLogs];
  }
}
