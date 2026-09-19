/**
 * @aetheris/spatial-grounding - cesiumBridge.js
 * Bridges 3D Cesium/Photorealistic Tiles camera state with Aetheris World Studio.
 * Formats 6-DOF camera poses and exports to video diffusion conditioning pipelines.
 */

export class CesiumCameraBridge {
  constructor(options = {}) {
    this.name = 'CesiumCameraBridge';
    this.waypoints = [];
  }

  addPose(timestampSec, cartographicDegrees, orientationEulerDeg, fovDeg = 60.0) {
    // cartographicDegrees: [lon, lat, heightM]
    // orientationEulerDeg: [pitch, heading, roll]
    this.waypoints.push({
      time: Number(timestampSec.toFixed(2)),
      pos: [
        Number(cartographicDegrees[0].toFixed(6)),
        Number(cartographicDegrees[1].toFixed(6)),
        Number(cartographicDegrees[2].toFixed(1))
      ],
      rotation: [
        Number(orientationEulerDeg[0].toFixed(2)),
        Number(orientationEulerDeg[1].toFixed(2)),
        Number(orientationEulerDeg[2].toFixed(2))
      ],
      fov: Number(fovDeg.toFixed(1))
    });
  }

  getTrajectoryPackage() {
    const totalDuration = this.waypoints.length > 0 
      ? this.waypoints[this.waypoints.length - 1].time 
      : 5.0;

    return {
      source: 'Aetheris 3D World Rig (Cesium / Google 3D Tiles)',
      totalWaypoints: this.waypoints.length,
      durationSec: totalDuration,
      fps: 24,
      cameraPoses: this.waypoints.map((wp, idx) => ({
        frame: idx,
        time: wp.time,
        position: wp.pos,
        rotationEuler: wp.rotation,
        fov: wp.fov
      }))
    };
  }
}
