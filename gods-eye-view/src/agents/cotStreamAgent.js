/**
 * cotStreamAgent.js — TRL 7-B: Cursor-on-Target (CoT) Live Stream Agent
 *
 * Generates NATO-standard Cursor-on-Target (CoT) XML messages (MIL-STD-2525C)
 * and broadcasts them over BroadcastChannel for consumption by any HUD tab
 * or WebSocket relay. Supports:
 *   - HOSTILE UAS track CoT events (type: a-h-A-M-F-Q)
 *   - FRIENDLY interceptor CoT events (type: a-f-A-M-F-Q)
 *   - Sensor heartbeat / SITUATIONAL AWARENESS (type: a-n-G-E-S)
 *   - IFF state change events
 *
 * BroadcastChannel replaces a WebSocket server for single-machine demo;
 * a real production bridge would connect this to an ATAK CoT relay.
 */

/** CoT XML event types (MIL-STD-2525C affiliation codes) */
export const COT_TYPES = Object.freeze({
  HOSTILE_UAS:       'a-h-A-M-F-Q',   // Hostile air / man-portable UAS
  FRIENDLY_AIR:      'a-f-A-M-F-Q',   // Friendly air / interceptor drone
  NEUTRAL_AIRCRAFT:  'a-n-A',          // Neutral aircraft (squawk 7600 unknown)
  SITREP:            'b-t-f',          // Tasking / general SITREP
  SENSOR_HEARTBEAT:  'a-n-G-E-S',     // Ground sensor heartbeat
});

/** Generate an ISO 8601 timestamp offset by `deltaMs` from now */
function cotTime(deltaMs = 0) {
  return new Date(Date.now() + deltaMs).toISOString().replace(/\.\d+Z$/, '.00Z');
}

/**
 * Build a CoT XML string for a given track or event.
 *
 * @param {Object} params
 * @param {string} params.uid          - Unique identifier (e.g. TRK-UAS-0842)
 * @param {string} params.type         - CoT type (use COT_TYPES constants)
 * @param {number} params.lat          - WGS84 latitude (decimal degrees)
 * @param {number} params.lon          - WGS84 longitude (decimal degrees)
 * @param {number} [params.hae=150]    - Height above ellipsoid in meters
 * @param {number} [params.ce=9999999] - Circular error (m), 9999999 = unknown
 * @param {number} [params.le=9999999] - Linear error (m)
 * @param {number} [params.speed=0]    - Speed m/s
 * @param {number} [params.course=0]   - Course degrees true
 * @param {string} [params.callsign='AETHERIS'] - Display callsign
 * @param {string} [params.how='m-g']  - Source how-generated code
 * @param {number} [params.staleSecs=30] - Seconds until stale
 * @returns {string} CoT XML string
 */
export function buildCotXml(params) {
  const {
    uid,
    type,
    lat,
    lon,
    hae     = 150,
    ce      = 9999999,
    le      = 9999999,
    speed   = 0,
    course  = 0,
    callsign = 'AETHERIS',
    how     = 'm-g',
    staleSecs = 30,
  } = params;

  const now   = cotTime(0);
  const start = cotTime(-1000);
  const stale = cotTime(staleSecs * 1000);

  return `<?xml version="1.0" encoding="UTF-8"?>
<event version="2.0"
       uid="${uid}"
       type="${type}"
       time="${now}"
       start="${start}"
       stale="${stale}"
       how="${how}">
  <point lat="${lat.toFixed(6)}"
         lon="${lon.toFixed(6)}"
         hae="${hae.toFixed(1)}"
         ce="${ce}"
         le="${le}"/>
  <detail>
    <contact callsign="${callsign}"/>
    <track speed="${speed.toFixed(2)}" course="${course.toFixed(1)}"/>
    <remarks>Aetheris C-UAS generated CoT — ${type}</remarks>
    <status readiness="true"/>
    <usericon iconsetpath="COT_MAPPING_2525B/a-h/a-h-A/a-h-A-M/a-h-A-M-F.png"/>
  </detail>
</event>`;
}

/**
 * CotStreamAgent — broadcasts CoT XML events on a BroadcastChannel
 * named 'aetheris-cot-bus'. Any browser tab or service worker
 * subscribed to this channel receives live tactical telemetry.
 */
export class CotStreamAgent {
  /** @param {Object} [opts]
   *  @param {string} [opts.channelName='aetheris-cot-bus'] BroadcastChannel name
   *  @param {number} [opts.heartbeatIntervalMs=5000] Sensor heartbeat period
   */
  constructor(opts = {}) {
    this.name            = 'CotStreamAgent';
    this.channelName     = opts.channelName     ?? 'aetheris-cot-bus';
    this.heartbeatMs     = opts.heartbeatIntervalMs ?? 5000;
    this.channel         = null;
    this._heartbeatTimer = null;
    this._msgCount       = 0;

    // Try to open BroadcastChannel (browser / shared-worker context)
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(this.channelName);
      if (typeof this.channel.unref === 'function') {
        this.channel.unref();
      }
    }
  }

  /**
   * Broadcast a pre-built CoT XML string (or build from a track object).
   * @param {string|Object} cotXmlOrParams - Raw CoT XML string OR buildCotXml param object
   * @returns {{uid: string, type: string, xml: string, seq: number, ts: number}}
   */
  broadcast(cotXmlOrParams) {
    const xml = typeof cotXmlOrParams === 'string'
      ? cotXmlOrParams
      : buildCotXml(cotXmlOrParams);

    // Extract uid + type from XML for the envelope
    const uid  = (xml.match(/uid="([^"]+)"/)  ?? [])[1] ?? 'UNKNOWN';
    const type = (xml.match(/type="([^"]+)"/) ?? [])[1] ?? 'unknown';

    this._msgCount++;
    const envelope = {
      uid,
      type,
      xml,
      seq: this._msgCount,
      ts:  Date.now(),
      channel: this.channelName,
    };

    // Post to BroadcastChannel if available
    if (this.channel) {
      this.channel.postMessage(envelope);
    }

    return envelope;
  }

  /**
   * Broadcast a hostile UAS threat track.
   * @param {Object} track - { uid, lat, lon, alt, speed (km/h), heading }
   * @returns {Object} CoT envelope
   */
  broadcastThreat(track) {
    return this.broadcast({
      uid:      track.uid  ?? `TRK-UAS-${String(Date.now()).slice(-4)}`,
      type:     COT_TYPES.HOSTILE_UAS,
      lat:      track.lat,
      lon:      track.lon,
      hae:      track.alt  ?? 150,
      speed:    (track.speed ?? 185) / 3.6,  // km/h → m/s
      course:   track.heading ?? 0,
      callsign: track.callsign ?? 'SHAHED-136',
      how:      'm-s',       // machine — sensor-derived
      staleSecs: 10,
    });
  }

  /**
   * Broadcast a friendly interceptor launch event.
   * @param {Object} pod - { podId, lat, lon, alt, heading }
   * @returns {Object} CoT envelope
   */
  broadcastInterceptorLaunch(pod) {
    return this.broadcast({
      uid:      `INT-${pod.podId}-${Date.now()}`,
      type:     COT_TYPES.FRIENDLY_AIR,
      lat:      pod.lat,
      lon:      pod.lon,
      hae:      pod.alt  ?? 5,
      speed:    250,        // Aetheris kinetic effector 250 m/s
      course:   pod.heading ?? 0,
      callsign: `AETHERIS-${pod.podId}`,
      how:      'a-f',     // autonomous friendly
      staleSecs: 15,
    });
  }

  /**
   * Start sending sensor heartbeat CoT messages every `heartbeatMs`.
   * @param {Object} sensor - { lat, lon, alt, uid }
   * @returns {CotStreamAgent} this (for chaining)
   */
  startHeartbeat(sensor) {
    this.stopHeartbeat();
    const tick = () => {
      this.broadcast({
        uid:      sensor.uid ?? 'AETHERIS-RADAR-01',
        type:     COT_TYPES.SENSOR_HEARTBEAT,
        lat:      sensor.lat,
        lon:      sensor.lon,
        hae:      sensor.alt ?? 18,
        callsign: 'AETHERIS-RADAR',
        how:      'a-f',
        staleSecs: Math.ceil(this.heartbeatMs / 1000) + 5,
      });
    };
    tick(); // immediate first heartbeat
    this._heartbeatTimer = typeof setInterval !== 'undefined'
      ? setInterval(tick, this.heartbeatMs)
      : null;
    return this;
  }

  /** Stop heartbeat ticker */
  stopHeartbeat() {
    if (this._heartbeatTimer !== null) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
  }

  /** Subscribe to incoming CoT messages on the same channel */
  subscribe(handler) {
    if (this.channel) {
      this.channel.addEventListener('message', (evt) => handler(evt.data));
    }
    return this;
  }

  /** Total messages broadcast so far */
  get messageCount() { return this._msgCount; }

  /** Close the BroadcastChannel */
  close() {
    this.stopHeartbeat();
    if (this.channel) { this.channel.close(); this.channel = null; }
  }
}
