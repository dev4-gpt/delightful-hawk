/**
 * @aetheris/spatial-grounding - cameraSpline.js
 * High-precision 6-DOF 3D camera trajectory spline generator for generative video diffusion models.
 * Calculates deterministic camera position (x, y, z), orientation (pitch, yaw, roll),
 * field of view (FOV), and linear/angular velocities over continuous time.
 */

/**
 * Basic 3D Vector Math Helpers
 */
export function vec3Add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function vec3Sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function vec3Scale(v, s) {
  return [v[0] * s, v[1] * s, v[2] * s];
}

export function vec3Length(v) {
  return Math.hypot(v[0], v[1], v[2]);
}

export function vec3Normalize(v) {
  const len = vec3Length(v);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

export function vec3Cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

export function vec3Dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Centripetal Catmull-Rom Spline Interpolation for smooth, non-overshooting 3D trajectories.
 * p0, p1, p2, p3: Control points
 * t: Parametric coordinate in [0, 1] between p1 and p2
 * alpha: 0.5 for centripetal, 0.0 for standard uniform, 1.0 for chordal
 */
export function catmullRomCentripetal(p0, p1, p2, p3, t, alpha = 0.5) {
  function getT(tPrev, pA, pB) {
    const d = vec3Length(vec3Sub(pB, pA));
    return tPrev + Math.pow(Math.max(d, 1e-6), alpha);
  }

  const t0 = 0;
  const t1 = getT(t0, p0, p1);
  const t2 = getT(t1, p1, p2);
  const t3 = getT(t2, p2, p3);

  const tActual = lerp(t1, t2, t);

  function evalSegment(A, B, tA, tB) {
    const denom = Math.max(tB - tA, 1e-6);
    const fA = (tB - tActual) / denom;
    const fB = (tActual - tA) / denom;
    return vec3Add(vec3Scale(A, fA), vec3Scale(B, fB));
  }

  const A1 = evalSegment(p0, p1, t0, t1);
  const A2 = evalSegment(p1, p2, t1, t2);
  const A3 = evalSegment(p2, p3, t2, t3);

  const B1 = evalSegment(A1, A2, t0, t2);
  const B2 = evalSegment(A2, A3, t1, t3);

  return evalSegment(B1, B2, t1, t2);
}

/**
 * CameraPath: Represents an editable 6-DOF camera trajectory.
 */
export class CameraPath {
  constructor(options = {}) {
    this.name = options.name || 'Aetheris Camera Shot';
    this.fps = options.fps || 24;
    this.duration = options.duration || 5.0; // in seconds
    this.waypoints = options.waypoints || []; // [{ pos: [x,y,z], target: [x,y,z], fov: 45, time: 0 }, ...]
  }

  addWaypoint(waypoint) {
    this.waypoints.push({
      pos: waypoint.pos || [0, 0, 0],
      target: waypoint.target || [0, 0, 0],
      fov: waypoint.fov || 45.0,
      roll: waypoint.roll || 0.0,
      time: waypoint.time !== undefined ? waypoint.time : this.waypoints.length
    });
    // Sort waypoints chronologically
    this.waypoints.sort((a, b) => a.time - b.time);
  }

  /**
   * Sample the trajectory at time `t` (seconds).
   */
  sample(t) {
    if (this.waypoints.length === 0) {
      return { pos: [0, 0, 0], target: [0, 0, 1], fov: 45, pitch: 0, yaw: 0, roll: 0 };
    }
    if (this.waypoints.length === 1) {
      const wp = this.waypoints[0];
      return { pos: [...wp.pos], target: [...wp.target], fov: wp.fov, pitch: 0, yaw: 0, roll: wp.roll || 0 };
    }

    const tClamped = Math.max(this.waypoints[0].time, Math.min(t, this.waypoints[this.waypoints.length - 1].time));

    // Find segment
    let idx = 0;
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      if (tClamped >= this.waypoints[i].time && tClamped <= this.waypoints[i + 1].time) {
        idx = i;
        break;
      }
    }

    const w1 = this.waypoints[idx];
    const w2 = this.waypoints[idx + 1];
    const segmentDuration = Math.max(w2.time - w1.time, 1e-6);
    const localT = (tClamped - w1.time) / segmentDuration;

    // Catmull-Rom virtual 4-point window
    const w0 = this.waypoints[Math.max(0, idx - 1)];
    const w3 = this.waypoints[Math.min(this.waypoints.length - 1, idx + 2)];

    const pos = catmullRomCentripetal(w0.pos, w1.pos, w2.pos, w3.pos, localT);
    const target = catmullRomCentripetal(w0.target, w1.target, w2.target, w3.target, localT);
    const fov = lerp(w1.fov, w2.fov, localT);
    const roll = lerp(w1.roll || 0, w2.roll || 0, localT);

    // Compute look-at forward vector
    const forward = vec3Normalize(vec3Sub(target, pos));
    const yaw = Math.atan2(forward[0], forward[2]) * (180 / Math.PI);
    const pitch = Math.asin(Math.max(-1, Math.min(1, forward[1]))) * (180 / Math.PI);

    return {
      pos,
      target,
      forward,
      fov,
      pitch,
      yaw,
      roll,
      time: tClamped
    };
  }

  /**
   * Sample complete animation frames ready for video diffusion conditioning.
   */
  generateFrames() {
    const totalFrames = Math.round(this.duration * this.fps);
    const frames = [];

    for (let i = 0; i < totalFrames; i++) {
      const t = (i / (totalFrames - 1 || 1)) * this.duration;
      const sample = this.sample(t);
      frames.push({
        frameIndex: i,
        time: t,
        ...sample
      });
    }

    return frames;
  }

  /**
   * Export camera pose trajectory in standardized CameraCtrl / Plücker JSON format.
   */
  exportCameraCtrlFormat() {
    const frames = this.generateFrames();
    return {
      metadata: {
        generator: 'Aetheris World Studio - Spatial Grounding Engine',
        version: '1.0.0',
        fps: this.fps,
        duration: this.duration,
        totalFrames: frames.length,
        coordinateSystem: 'RH-Y-Up'
      },
      cameraPoses: frames.map(f => ({
        frame: f.frameIndex,
        time: f.time,
        position: f.pos,
        forwardVector: f.forward,
        rotationEuler: [f.pitch, f.yaw, f.roll],
        fov: f.fov
      }))
    };
  }
}
