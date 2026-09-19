/**
 * @aetheris/security-shield - guardrails.js
 * Prompt-injection prevention, adversarial pattern detection, and air-gapped security scanner.
 */

const ADVERSARIAL_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?prior\s+guidance/i,
  /system\s*:\s*you\s+are\s+now/i,
  /reveal\s+(your\s+)?(system\s+prompt|instructions|api\s*key)/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /DAN\s+mode/i,
  /do\s+anything\s+now/i
];

export class SecurityShield {
  constructor(options = {}) {
    this.strictMode = options.strictMode !== undefined ? options.strictMode : true;
    this.customPatterns = options.customPatterns || [];
    this.auditLogs = [];
  }

  /**
   * Scans an incoming user prompt or agent input for adversarial injection.
   * @param {string} input - User prompt or external text
   * @returns {Object} { safe: boolean, flaggedPatterns: string[], sanitizedText: string }
   */
  scanPrompt(input) {
    if (typeof input !== 'string') {
      return { safe: false, reason: 'Input must be a valid string', sanitizedText: '' };
    }

    const flaggedPatterns = [];
    const allPatterns = [...ADVERSARIAL_INJECTION_PATTERNS, ...this.customPatterns];

    for (const pattern of allPatterns) {
      if (pattern.test(input)) {
        flaggedPatterns.push(pattern.toString());
      }
    }

    const isSafe = flaggedPatterns.length === 0;

    // Log the security telemetry
    const auditRecord = {
      timestamp: new Date().toISOString(),
      safe: isSafe,
      flaggedCount: flaggedPatterns.length,
      flaggedPatterns,
      inputLength: input.length
    };
    this.auditLogs.push(auditRecord);

    if (!isSafe && this.strictMode) {
      return {
        safe: false,
        flaggedPatterns,
        reason: 'Adversarial prompt injection pattern detected.',
        sanitizedText: '[BLOCKED_SECURITY_VIOLATION]'
      };
    }

    // Basic sanitization
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .trim();

    return {
      safe: true,
      flaggedPatterns: [],
      sanitizedText: sanitized
    };
  }

  getAuditLogs() {
    return [...this.auditLogs];
  }
}
