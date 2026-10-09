/**
 * aarReplayEngine.js — TRL 7-E: After-Action Report (AAR) Replay Engine
 *
 * Loads a JSON AAR exported by AgentShieldGuard and replays the event
 * timeline at configurable speed. Fires event callbacks so the HUD can
 * re-animate intercept sequences, scrub to any timestamp, and generate
 * training narratives for debrief.
 *
 * AAR format (produced by AgentShieldGuard.exportAfterActionReport):
 * {
 *   sessionId: string,
 *   generatedAt: ISO string,
 *   merkleRoot: string,
 *   events: [{ seq, ts, actor, action, data, hash }, ...]
 * }
 */

export const REPLAY_STATE = Object.freeze({
  IDLE:    'IDLE',
  PLAYING: 'PLAYING',
  PAUSED:  'PAUSED',
  DONE:    'DONE',
});

/**
 * AarReplayEngine — replays an AAR event log with pause/resume/scrub.
 *
 * @example
 * const engine = new AarReplayEngine(aarJson, { speedMultiplier: 4 });
 * engine.onEvent = (evt) => updateHud(evt);
 * engine.onComplete = () => showReplayComplete();
 * engine.play();
 */
export class AarReplayEngine {
  /**
   * @param {Object} aar - Parsed AAR JSON object
   * @param {Object} [opts]
   * @param {number} [opts.speedMultiplier=1] - Replay speed (1=real-time, 4=4x, etc.)
   * @param {number} [opts.minIntervalMs=50]  - Minimum ms between events (prevents flooding)
   */
  constructor(aar, opts = {}) {
    let parsed = aar;
    if (typeof aar === 'string') {
      try {
        parsed = JSON.parse(aar);
      } catch (err) {
        throw new TypeError(`AarReplayEngine: failed to parse AAR JSON string: ${err.message}`);
      }
    }

    const rawList = parsed?.events ?? parsed?.ledger;
    if (!parsed || !Array.isArray(rawList)) {
      throw new TypeError('AarReplayEngine: aar must be an object with an events or ledger array');
    }

    this.sessionId       = parsed.sessionId ?? parsed.metadata?.facility ?? 'AETHERIS-C2';
    this.generatedAt     = parsed.generatedAt ?? null;
    this.merkleRoot      = parsed.merkleRoot ?? parsed.auditSummary?.latestBlockHash ?? null;
    this.speedMultiplier = Math.max(0.1, opts.speedMultiplier ?? 1);
    this.minIntervalMs   = opts.minIntervalMs ?? 50;

    // Normalize events whether they come from raw auditLedger or normalized events array
    const normalized = rawList.map((e, idx) => ({
      seq:    e.seq ?? e.index ?? idx,
      ts:     e.ts ?? e.timestamp ?? Date.now(),
      actor:  e.actor ?? e.clearance ?? 'SYSTEM',
      action: e.action ?? e.eventType ?? 'EVENT',
      data:   e.data ?? {},
      hash:   e.hash ?? null
    }));

    // Sort events ascending by sequence number, then timestamp
    this.events = normalized.sort((a, b) =>
      (a.seq ?? 0) - (b.seq ?? 0) || (a.ts ?? 0) - (b.ts ?? 0)
    );

    this._state      = REPLAY_STATE.IDLE;
    this._cursor     = 0;
    this._timer      = null;
    this._startTs    = null;   // real-time when play() was called
    this._aarStartTs = null;   // AAR timestamp of first event

    /** Callback fired for each replayed event */
    this.onEvent    = null;
    /** Callback fired when replay completes */
    this.onComplete = null;
    /** Callback fired on state change */
    this.onStateChange = null;
  }

  /** Current replay state */
  get state() { return this._state; }

  /** Progress [0, 1] through the event list */
  get progress() {
    if (this.events.length === 0) return 1;
    return this._cursor / this.events.length;
  }

  /** Number of events total */
  get totalEvents() { return this.events.length; }

  /** Number of events replayed so far */
  get eventsReplayed() { return this._cursor; }

  /** Start or resume replay */
  play() {
    if (this._state === REPLAY_STATE.DONE) return;
    if (this._state === REPLAY_STATE.PLAYING) return;

    if (this._cursor === 0 && this.events.length > 0) {
      this._aarStartTs = this.events[0].ts ?? Date.now();
    }
    this._startTs = Date.now();
    this._setState(REPLAY_STATE.PLAYING);
    this._scheduleNext();
  }

  /** Pause replay (resume with play()) */
  pause() {
    if (this._state !== REPLAY_STATE.PLAYING) return;
    this._clearTimer();
    this._setState(REPLAY_STATE.PAUSED);
  }

  /** Stop and reset to beginning */
  stop() {
    this._clearTimer();
    this._cursor  = 0;
    this._startTs = null;
    this._setState(REPLAY_STATE.IDLE);
  }

  /**
   * Scrub to a specific event index.
   * @param {number} index - Target event index [0, events.length)
   */
  scrubTo(index) {
    const wasPlaying = this._state === REPLAY_STATE.PLAYING;
    this._clearTimer();
    this._cursor = Math.max(0, Math.min(index, this.events.length));
    if (wasPlaying) {
      this._startTs = Date.now();
      this._scheduleNext();
    }
  }

  /** Internal: schedule the next event dispatch */
  _scheduleNext() {
    if (this._cursor >= this.events.length) {
      this._clearTimer();
      this._setState(REPLAY_STATE.DONE);
      if (typeof this.onComplete === 'function') this.onComplete(this);
      return;
    }

    const evt     = this.events[this._cursor];
    const prevEvt = this._cursor > 0 ? this.events[this._cursor - 1] : evt;

    // Compute real-time delay between events, scaled by speed multiplier
    const aarDeltaMs  = Math.max(0, (evt.ts ?? 0) - (prevEvt.ts ?? 0));
    const scaledDelay = Math.max(this.minIntervalMs, aarDeltaMs / this.speedMultiplier);

    this._timer = setTimeout(() => {
      if (this._state !== REPLAY_STATE.PLAYING) return;
      const current = this.events[this._cursor];
      this._cursor++;

      if (typeof this.onEvent === 'function') {
        this.onEvent({
          ...current,
          replayProgress: this.progress,
          totalEvents:    this.totalEvents,
          sessionId:      this.sessionId,
        });
      }

      this._scheduleNext();
    }, scaledDelay);
  }

  _clearTimer() {
    if (this._timer !== null) { clearTimeout(this._timer); this._timer = null; }
  }

  _setState(newState) {
    this._state = newState;
    if (typeof this.onStateChange === 'function') this.onStateChange(newState, this);
  }

  /**
   * Summarise the AAR into a structured debrief object.
   * Counts event types, identifies actors, extracts intercept outcomes.
   * @returns {Object} debrief summary
   */
  generateDebrief() {
    const actorCounts  = {};
    const actionCounts = {};
    let intercepts = 0, blocks = 0, alerts = 0;

    for (const evt of this.events) {
      actorCounts[evt.actor]  = (actorCounts[evt.actor]  ?? 0) + 1;
      actionCounts[evt.action] = (actionCounts[evt.action] ?? 0) + 1;
      if (/intercept/i.test(evt.action))    intercepts++;
      if (/block|deny/i.test(evt.action))   blocks++;
      if (/alert|alarm/i.test(evt.action))  alerts++;
    }

    const durationMs = this.events.length > 1
      ? (this.events.at(-1).ts ?? 0) - (this.events[0].ts ?? 0)
      : 0;

    return {
      sessionId:    this.sessionId,
      generatedAt:  this.generatedAt,
      merkleRoot:   this.merkleRoot,
      totalEvents:  this.totalEvents,
      durationMs,
      actors:       actorCounts,
      actions:      actionCounts,
      intercepts,
      blocks,
      alerts,
      verdict: intercepts > 0
        ? `ENGAGEMENT SUCCESSFUL — ${intercepts} intercept(s) confirmed`
        : 'NO KINETIC ENGAGEMENTS RECORDED',
    };
  }
}
