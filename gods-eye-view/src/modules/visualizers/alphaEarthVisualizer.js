/**
 * DeepMind AlphaEarth 3D Visualizer
 * Renders 10x10m foundation model ground truth grid cells, SAR penetration vectors,
 * and holographic environmental risk scorecards in Cesium.
 * 
 * @module alphaEarthVisualizer
 */

import { get10mBoundingBox, scoreLandParcel } from '../alphaEarthCartridge.js';

export function createAlphaEarthVisualizer(viewer, Cesium) {
  let staticEntities = [];
  let inspectionEntities = [];

  // Key benchmark showcase sectors
  const SHOWCASE_SECTORS = [
    {
      name: 'Austin Onion Creek 100-Year Flood Plain',
      lat: 30.1785,
      lon: -97.7554,
      type: 'FLOOD_HAZARD',
      color: Cesium.Color.CYAN.withAlpha(0.55),
      outlineColor: Cesium.Color.DEEPSKYBLUE,
      status: 'HIGH FLOOD RISK (82%) · ALLUVIAL SOIL'
    },
    {
      name: 'California Central Valley Farmland (Fresno Ag Sector)',
      lat: 36.7468,
      lon: -119.7726,
      type: 'AG_CROP_STRESS',
      color: Cesium.Color.LIMEGREEN.withAlpha(0.5),
      outlineColor: Cesium.Color.LIME,
      status: 'SAR CLOUD-PENETRATING: EARLY DROUGHT STRESS (+14mm REQ)'
    },
    {
      name: 'Amazon Tapajós Basin (Unmapped Frontier)',
      lat: -4.2150,
      lon: -55.9820,
      type: 'CANOPY_BREACH',
      color: Cesium.Color.ORANGE.withAlpha(0.6),
      outlineColor: Cesium.Color.RED,
      status: 'SUB-CANOPY TIMBER BREACH DETECTED UNDER 95% CLOUD'
    },
    {
      name: 'Antarctica Pine Island Glacier Tongue',
      lat: -75.1667,
      lon: -100.0000,
      type: 'ICE_RIFT',
      color: Cesium.Color.LIGHTSKYBLUE.withAlpha(0.6),
      outlineColor: Cesium.Color.WHITE,
      status: 'SUB-SURFACE 10m BASAL ICE RIFT FRACTURE DETECTED'
    }
  ];

  function buildShowcaseEntities() {
    clearStaticEntities();

    for (const sector of SHOWCASE_SECTORS) {
      // 1. Create a 3x3 cluster of 10x10m cells centered at target
      const baseBbox = get10mBoundingBox(sector.lat, sector.lon);
      const latStep = baseBbox.north - baseBbox.south;
      const lonStep = baseBbox.east - baseBbox.west;

      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          const s = baseBbox.south + di * latStep;
          const n = s + latStep;
          const w = baseBbox.west + dj * lonStep;
          const e = w + lonStep;

          const isCenter = di === 0 && dj === 0;

          const gridEntity = viewer.entities.add({
            name: `${sector.name} [10x10m Cell]`,
            rectangle: {
              coordinates: Cesium.Rectangle.fromDegrees(w, s, e, n),
              material: isCenter ? sector.color : sector.color.withAlpha(0.25),
              outline: true,
              outlineColor: sector.outlineColor,
              outlineWidth: isCenter ? 2 : 1,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
          });
          staticEntities.push(gridEntity);
        }
      }

      // 2. Holographic Telemetry Billboard above sector
      const score = scoreLandParcel(sector.lat, sector.lon, sector.name);
      const labelEntity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(sector.lon, sector.lat, 80),
        label: {
          text: `🌱 ALPHAEARTH FOUNDATION [10x10m]\n${sector.name.toUpperCase()}\n${sector.status}\nGRADE: ${score.compositeGrade} · FLOOD: ${score.floodRiskScore}% · FIRE: ${score.wildfireRiskScore}% · SOIL: ${score.soilHealthIndex}/100`,
          font: 'bold 11pt ui-monospace, SFMono-Regular, Menlo, monospace',
          fillColor: Cesium.Color.WHITE,
          backgroundColor: Cesium.Color.fromCssColorString('rgba(10, 25, 40, 0.88)'),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(10, 6),
          outlineColor: sector.outlineColor,
          outlineWidth: 1,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 150000.0)
        }
      });
      staticEntities.push(labelEntity);
    }
  }

  function clearStaticEntities() {
    for (const ent of staticEntities) {
      viewer.entities.remove(ent);
    }
    staticEntities = [];
  }

  function clearInspectionEntities() {
    for (const ent of inspectionEntities) {
      viewer.entities.remove(ent);
    }
    inspectionEntities = [];
  }

  return {
    show: () => {
      buildShowcaseEntities();
    },

    hide: () => {
      clearStaticEntities();
      clearInspectionEntities();
    },

    /**
     * Spawns an interactive 10x10m inspection grid cell at arbitrary coordinates
     */
    inspectCoordinates: (lat, lon, options = {}) => {
      clearInspectionEntities();

      const bbox = get10mBoundingBox(lat, lon);
      const score = scoreLandParcel(lat, lon, options.label || 'Tactical Land Inspection');

      // 10x10m high-resolution cell
      const cellEntity = viewer.entities.add({
        name: `AlphaEarth 10x10m Cell (${bbox.gridId})`,
        rectangle: {
          coordinates: Cesium.Rectangle.fromDegrees(bbox.west, bbox.south, bbox.east, bbox.north),
          material: Cesium.Color.SPRINGGREEN.withAlpha(0.55),
          outline: true,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
      });
      inspectionEntities.push(cellEntity);

      // Floating holographic scorecard
      const cardEntity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(bbox.centerLon, bbox.centerLat, 45),
        label: {
          text: `🌱 ALPHAEARTH FOUNDATION CELL [10x10m]\nGRID: ${bbox.gridId}\nGRADE: ${score.compositeGrade} · FLOOD RISK: ${score.floodRiskScore}%\nWILDFIRE: ${score.wildfireRiskScore}% · SOIL HEALTH: ${score.soilHealthIndex}/100\n${score.valuationAdvisory}`,
          font: 'bold 11pt ui-monospace, SFMono-Regular, Menlo, monospace',
          fillColor: Cesium.Color.fromCssColorString('#a7f3d0'),
          backgroundColor: Cesium.Color.fromCssColorString('rgba(6, 30, 20, 0.92)'),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(12, 8),
          outlineColor: Cesium.Color.fromCssColorString('#10b981'),
          outlineWidth: 1,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 50000.0)
        }
      });
      inspectionEntities.push(cardEntity);

      return score;
    }
  };
}
