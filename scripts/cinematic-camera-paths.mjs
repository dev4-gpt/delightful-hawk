/**
 * Aetheris Spatial — Cinematic Camera Choreography Engine
 * 
 * Provides broadcast-grade continuous camera trajectories for Cesium:
 * - Smooth exponential deceleration dives (Deep Space -> Metropolitan Canyons)
 * - Continuous 360-degree banking orbits around 3D architectural landmarks
 * - Low-altitude high-speed terrain flyovers with heading drift
 * - Geodesic camera sweeps across planetary horizons
 * - Seamless return to high-orbit planetary hero angles
 */

export class CinematicDirector {
  constructor(viewer) {
    this.viewer = viewer;
    this.activeAnimation = null;
    this.isOrbiting = false;
    this.orbitCenter = null;
    this.orbitDistance = 1200;
    this.orbitHeading = 0;
    this.orbitPitch = -0.45;
  }

  /**
   * Smooth orbital sweep from dark-side space toward daylight Pacific.
   * @param {number} durationS 
   */
  async planetarySunriseSweep(durationS = 25) {
    if (!this.viewer?.camera) return;
    const Cesium = window.Cesium;

    // Starting high orbit over Pacific night side
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-160.0, 15.0, 22000000.0),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      }
    });

    // Smooth sweeping flight toward East Asia dawn
    return new Promise((resolve) => {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(135.0, 28.0, 8000000.0),
        orientation: {
          heading: Cesium.Math.toRadians(35.0),
          pitch: Cesium.Math.toRadians(-55.0),
          roll: Cesium.Math.toRadians(0.0)
        },
        duration: durationS,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
        complete: resolve
      });
    });
  }

  /**
   * Deep plunge into Tokyo Shibuya Crossing with continuous 360-degree banking orbit.
   * @param {number} plungeDurationS 
   * @param {number} orbitDurationS 
   */
  async plungeAndOrbitTokyo(plungeDurationS = 10, orbitDurationS = 20) {
    if (!this.viewer?.camera) return;
    const Cesium = window.Cesium;

    const shibuyaTarget = Cesium.Cartesian3.fromDegrees(139.7005, 35.6595, 0.0);
    this.orbitCenter = shibuyaTarget;
    this.orbitDistance = 950.0;
    this.orbitHeading = Cesium.Math.toRadians(30.0);
    this.orbitPitch = Cesium.Math.toRadians(-32.0);

    // 1. Plunge from high atmosphere into street canyon
    await new Promise((resolve) => {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(139.6980, 35.6550, 950.0),
        orientation: {
          heading: this.orbitHeading,
          pitch: this.orbitPitch,
          roll: 0
        },
        duration: plungeDurationS,
        easingFunction: Cesium.EasingFunction.CUBIC_OUT,
        complete: resolve
      });
    });

    // 2. Continuous 360-degree orbit around Shibuya
    this.startContinuousOrbit(orbitDurationS);
  }

  /**
   * Start smooth frame-by-frame orbital camera rotation around a target point.
   */
  startContinuousOrbit(durationS = 20) {
    if (!this.viewer || !this.orbitCenter) return;
    const Cesium = window.Cesium;
    this.isOrbiting = true;

    const startTime = performance.now();
    const totalMs = durationS * 1000;
    const initialHeading = this.orbitHeading;

    const updateFrame = () => {
      if (!this.isOrbiting) return;
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1.0, elapsed / totalMs);

      // Rotate heading 360 degrees smoothly across the duration
      const currentHeading = initialHeading + progress * Math.PI * 2;
      const offset = new Cesium.HeadingPitchRange(currentHeading, this.orbitPitch, this.orbitDistance);
      this.viewer.camera.lookAt(this.orbitCenter, offset);

      if (progress < 1.0) {
        requestAnimationFrame(updateFrame);
      } else {
        this.stopContinuousOrbit();
      }
    };

    requestAnimationFrame(updateFrame);
  }

  stopContinuousOrbit() {
    this.isOrbiting = false;
    if (this.viewer?.camera) {
      this.viewer.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
    }
  }

  /**
   * Tactical low-altitude high-speed terrain flyover.
   * @param {number} durationS 
   */
  async lowAltitudeTacticalFlyby(durationS = 25) {
    if (!this.viewer?.camera) return;
    const Cesium = window.Cesium;
    this.stopContinuousOrbit();

    // Start over mountain ridge
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(138.7274, 35.3606, 4200.0), // Mt Fuji flank
      orientation: {
        heading: Cesium.Math.toRadians(75.0),
        pitch: Cesium.Math.toRadians(-18.0),
        roll: Cesium.Math.toRadians(-5.0)
      }
    });

    return new Promise((resolve) => {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(139.3500, 35.4500, 1800.0),
        orientation: {
          heading: Cesium.Math.toRadians(90.0),
          pitch: Cesium.Math.toRadians(-15.0),
          roll: Cesium.Math.toRadians(4.0)
        },
        duration: durationS,
        easingFunction: Cesium.EasingFunction.LINEAR,
        complete: resolve
      });
    });
  }

  /**
   * First-person cockpit ride-along flight path with bank angles.
   * @param {number} durationS 
   */
  async cockpitFlightPath(durationS = 25) {
    if (!this.viewer?.camera) return;
    const Cesium = window.Cesium;
    this.stopContinuousOrbit();

    // Set camera inside cockpit perspective cruising at 32,000ft (9,750m)
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-105.2705, 39.7392, 9800.0), // Colorado Rockies
      orientation: {
        heading: Cesium.Math.toRadians(265.0),
        pitch: Cesium.Math.toRadians(-4.0),
        roll: Cesium.Math.toRadians(0.0)
      }
    });

    return new Promise((resolve) => {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-106.8500, 39.6500, 9750.0),
        orientation: {
          heading: Cesium.Math.toRadians(270.0),
          pitch: Cesium.Math.toRadians(-5.0),
          roll: Cesium.Math.toRadians(-8.0) // Banking turn
        },
        duration: durationS,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
        complete: resolve
      });
    });
  }

  /**
   * Wide theater overwatch for Antigravity Swarm C2 and Geofence deployment.
   * @param {number} durationS 
   */
  async tacticalC2Overwatch(durationS = 35) {
    if (!this.viewer?.camera) return;
    const Cesium = window.Cesium;
    this.stopContinuousOrbit();

    // High oblique vantage over Western Pacific / Taiwan Strait
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(118.5000, 23.5000, 180000.0),
      orientation: {
        heading: Cesium.Math.toRadians(35.0),
        pitch: Cesium.Math.toRadians(-42.0),
        roll: 0.0
      }
    });

    return new Promise((resolve) => {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(120.2000, 24.8000, 95000.0),
        orientation: {
          heading: Cesium.Math.toRadians(45.0),
          pitch: Cesium.Math.toRadians(-35.0),
          roll: 0.0
        },
        duration: durationS,
        easingFunction: Cesium.EasingFunction.QUADRATIC_OUT,
        complete: resolve
      });
    });
  }

  /**
   * Ascent into high orbit showing glowing subsea fiber lines and planetary hero view.
   * @param {number} durationS 
   */
  async planetaryHeroAscent(durationS = 40) {
    if (!this.viewer?.camera) return;
    const Cesium = window.Cesium;
    this.stopContinuousOrbit();

    // Start over North Atlantic showing TAT-14 / MAREA cable paths
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-45.0, 42.0, 3500000.0),
      orientation: {
        heading: Cesium.Math.toRadians(45.0),
        pitch: Cesium.Math.toRadians(-55.0),
        roll: 0.0
      }
    });

    return new Promise((resolve) => {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-30.0, 25.0, 18500000.0),
        orientation: {
          heading: Cesium.Math.toRadians(0.0),
          pitch: Cesium.Math.toRadians(-90.0),
          roll: 0.0
        },
        duration: durationS,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
        complete: resolve
      });
    });
  }
}

// Expose on window for runtime automation
if (typeof window !== 'undefined') {
  window.CinematicDirector = CinematicDirector;
}
