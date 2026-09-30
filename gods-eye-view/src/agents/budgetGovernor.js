/**
 * BudgetGovernor - Token & Compute Cost Controller
 * 
 * Part of the Aetheris Agentic Defense Swarm (Google Antigravity SDK + ECC Framework)
 * Adapts Google Antigravity SDK session budget governors (examples/getting_started/budget_limits.md).
 * Tracks input, output, and reasoning tokens, enforces operational spend caps,
 * and manages graceful model cascades between Gemini Flash, Gemini Pro, and local runtimes.
 */

export class BudgetGovernor {
  constructor(options = {}) {
    this.name = 'BudgetGovernor';
    this.role = 'Session Budget & Model Cascade Controller';
    
    // Model rate card ($ per 1 Million tokens)
    this.rateCard = Object.freeze({
      'gemini-1.5-flash': { inputPer1M: 0.075, outputPer1M: 0.30, tier: 'fast-tactical' },
      'gemini-1.5-pro': { inputPer1M: 1.25, outputPer1M: 5.00, tier: 'deep-strategic' },
      'local-fallback': { inputPer1M: 0.00, outputPer1M: 0.00, tier: 'air-gapped-edge' }
    });

    this.activeModel = options.defaultModel || 'gemini-1.5-flash';
    this.warningCostUsd = options.warningCostUsd ?? 2.50; // Warn when session exceeds $2.50
    this.capCostUsd = options.capCostUsd ?? 10.00;        // Hard cap at $10.00 spend
    
    // Cumulative metrics
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
    this.totalThinkingTokens = 0;
    this.totalCostUsd = 0;
    this.turnsCount = 0;
    this.warningTriggered = false;
    this.capReached = false;
  }

  /**
   * Calculates USD cost for token usage on a given model.
   * @param {number} inputTokens 
   * @param {number} outputTokens 
   * @param {string} [model=this.activeModel] 
   * @returns {number} Cost in USD
   */
  calculateTurnCostUsd(inputTokens, outputTokens, model = this.activeModel) {
    const rates = this.rateCard[model] || this.rateCard['gemini-1.5-flash'];
    const inputCost = (inputTokens / 1000000) * rates.inputPer1M;
    const outputCost = (outputTokens / 1000000) * rates.outputPer1M;
    return Number((inputCost + outputCost).toFixed(6));
  }

  /**
   * Records a completed agentic turn and checks budget latches.
   * @param {Object} usage - { inputTokens, outputTokens, thinkingTokens, model }
   * @returns {Object} Updated governor status
   */
  recordUsage(usage) {
    const model = usage.model || this.activeModel;
    const inputTokens = Math.max(0, usage.inputTokens || 0);
    const outputTokens = Math.max(0, usage.outputTokens || 0);
    const thinkingTokens = Math.max(0, usage.thinkingTokens || 0);

    const turnCost = this.calculateTurnCostUsd(inputTokens, outputTokens, model);

    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;
    this.totalThinkingTokens += thinkingTokens;
    this.totalCostUsd = Number((this.totalCostUsd + turnCost).toFixed(6));
    this.turnsCount += 1;

    // Check warning threshold
    if (!this.warningTriggered && this.totalCostUsd >= this.warningCostUsd) {
      this.warningTriggered = true;
      // Cascade to flash model to preserve budget
      if (this.activeModel === 'gemini-1.5-pro') {
        this.activeModel = 'gemini-1.5-flash';
      }
    }

    // Check hard cap
    if (!this.capReached && this.totalCostUsd >= this.capCostUsd) {
      this.capReached = true;
      this.activeModel = 'local-fallback';
    }

    return {
      agent: this.name,
      turnCostUsd: turnCost,
      totalCostUsd: this.totalCostUsd,
      totalTokens: this.totalInputTokens + this.totalOutputTokens + this.totalThinkingTokens,
      turnsCount: this.turnsCount,
      activeModel: this.activeModel,
      warningTriggered: this.warningTriggered,
      capReached: this.capReached,
      status: this.capReached ? 'CAP_LATCHED' : this.warningTriggered ? 'BUDGET_WARNING' : 'NOMINAL'
    };
  }

  /**
   * Resets session counters.
   */
  reset() {
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
    this.totalThinkingTokens = 0;
    this.totalCostUsd = 0;
    this.turnsCount = 0;
    this.warningTriggered = false;
    this.capReached = false;
  }
}
