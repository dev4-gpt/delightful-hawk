import * as Cesium from 'cesium';

/**
 * Photorealistic 3D Landmark & Urban Architecture Layer
 * Provides true 3D structures (Tokyo Tower, Statue of Liberty, Container Ship,
 * and 3D Skyscraper districts in Tokyo, Shibuya, and Lower Manhattan)
 * equipped with realistic architectural facade textures, window grids, and rooftop helipads.
 */

const LANDMARKS = [
  {
    id: 'tokyo-tower',
    name: 'Tokyo Tower (333m)',
    lon: 139.745433,
    lat: 35.658580,
    alt: 0,
    modelUrl: '/models/tokyo_tower.glb',
    scale: 1.0,
    heading: 0,
  },
  {
    id: 'statue-of-liberty',
    name: 'Statue of Liberty (93m)',
    lon: -74.044500,
    lat: 40.689250,
    alt: 0,
    modelUrl: '/models/statue_of_liberty.glb',
    scale: 1.0,
    heading: 145, // Facing southeast towards Upper New York Bay and harbor entrance
  },
  {
    id: 'nyc-harbor-ship',
    name: 'Container Vessel (AIS: 368940000)',
    lon: -74.032000,
    lat: 40.690000,
    alt: 0,
    modelUrl: '/models/ship.glb',
    scale: 0.16, // Realistic 160m coastal cargo vessel
    heading: 35, // Heading northeast through harbor shipping channel
  },
];

// Architectural texture types
const TEXTURES = {
  glassBlue: '/textures/facade_glass_blue.jpg',
  glassDark: '/textures/facade_glass_dark.jpg',
  shibuyaBillboard: '/textures/facade_shibuya.jpg',
  rooftopHelipad: '/textures/rooftop_helipad.jpg',
};

const BUILDINGS = [
  // ==========================================
  // TOKYO (Minato / Shiba Park / Roppongi / Azabudai)
  // ==========================================
  // Azabudai Hills Mori JP Tower (Japan's tallest skyscraper, 330m)
  { name: 'Azabudai Hills Mori JP Tower', lon: 139.7408, lat: 35.6608, w: 62, d: 62, h: 330, tex: TEXTURES.glassBlue, repeat: [4, 22] },
  { name: 'Azabudai Hills Residence A', lon: 139.7420, lat: 35.6598, w: 46, d: 40, h: 237, tex: TEXTURES.glassDark, repeat: [3, 16] },
  { name: 'Azabudai Hills Residence B', lon: 139.7435, lat: 35.6615, w: 44, d: 42, h: 262, tex: TEXTURES.glassBlue, repeat: [3, 18] },
  { name: 'Garden Plaza Azabudai', lon: 139.7412, lat: 35.6622, w: 70, d: 35, h: 65, tex: TEXTURES.glassDark, repeat: [5, 4] },

  // Roppongi Hills & Midtown
  { name: 'Roppongi Hills Mori Tower', lon: 139.7292, lat: 35.6605, w: 70, d: 60, h: 238, tex: TEXTURES.glassDark, repeat: [5, 16] },
  { name: 'Grand Tower Roppongi', lon: 139.7380, lat: 35.6645, w: 54, d: 48, h: 231, tex: TEXTURES.glassBlue, repeat: [4, 15] },
  { name: 'Izumi Garden Tower', lon: 139.7395, lat: 35.6655, w: 50, d: 45, h: 216, tex: TEXTURES.glassBlue, repeat: [4, 14] },

  // Toranomon Hills District
  { name: 'Toranomon Hills Station Tower', lon: 139.7485, lat: 35.6668, w: 58, d: 52, h: 266, tex: TEXTURES.glassBlue, repeat: [4, 18] },
  { name: 'Toranomon Hills Mori Tower', lon: 139.7498, lat: 35.6672, w: 62, d: 52, h: 256, tex: TEXTURES.glassDark, repeat: [4, 17] },
  { name: 'Toranomon Hills Business Tower', lon: 139.7512, lat: 35.6685, w: 56, d: 48, h: 185, tex: TEXTURES.glassBlue, repeat: [4, 12] },

  // Shiba Park & Surrounding Tokyo Tower District
  { name: 'The Prince Park Tower Tokyo', lon: 139.7480, lat: 35.6552, w: 54, d: 54, h: 104, tex: TEXTURES.glassDark, repeat: [4, 7] },
  { name: 'Tokyo Prince Hotel', lon: 139.7495, lat: 35.6582, w: 72, d: 42, h: 55, tex: TEXTURES.glassDark, repeat: [5, 4] },
  { name: 'Shiba Park Building', lon: 139.7525, lat: 35.6565, w: 85, d: 35, h: 68, tex: TEXTURES.glassDark, repeat: [6, 5] },
  { name: 'Sumitomo Fudosan Mita Twin Building', lon: 139.7435, lat: 35.6515, w: 48, d: 44, h: 179, tex: TEXTURES.glassBlue, repeat: [3, 12] },
  { name: 'NEC Supertower', lon: 139.7482, lat: 35.6502, w: 58, d: 44, h: 180, tex: TEXTURES.glassDark, repeat: [4, 12] },
  { name: 'Mita Bellju Building', lon: 139.7472, lat: 35.6508, w: 44, d: 38, h: 160, tex: TEXTURES.glassBlue, repeat: [3, 10] },

  // Shiodome & Hamamatsucho Skyline (East of Tokyo Tower)
  { name: 'Shiodome City Center', lon: 139.7595, lat: 35.6645, w: 62, d: 52, h: 216, tex: TEXTURES.glassDark, repeat: [4, 14] },
  { name: 'Dentsu Building', lon: 139.7618, lat: 35.6640, w: 72, d: 46, h: 213, tex: TEXTURES.glassBlue, repeat: [5, 14] },
  { name: 'Nippon TV Tower', lon: 139.7590, lat: 35.6635, w: 52, d: 44, h: 192, tex: TEXTURES.glassDark, repeat: [4, 13] },
  { name: 'World Trade Center South Tower', lon: 139.7562, lat: 35.6558, w: 58, d: 48, h: 235, tex: TEXTURES.glassBlue, repeat: [4, 15] },
  { name: 'Kyocera Hamamatsucho Building', lon: 139.7555, lat: 35.6545, w: 46, d: 38, h: 145, tex: TEXTURES.glassDark, repeat: [3, 10] },

  // Urban Grid High-rises around Shiba & Minato
  { name: 'Shiba 3-chome Tower A', lon: 139.7475, lat: 35.6565, w: 36, d: 34, h: 88, tex: TEXTURES.glassBlue, repeat: [3, 6] },
  { name: 'Shiba 3-chome Tower B', lon: 139.7462, lat: 35.6555, w: 34, d: 30, h: 76, tex: TEXTURES.glassDark, repeat: [3, 5] },
  { name: 'Higashi-Azabu Plaza', lon: 139.7432, lat: 35.6575, w: 40, d: 34, h: 92, tex: TEXTURES.glassBlue, repeat: [3, 6] },
  { name: 'Higashi-Azabu Residence', lon: 139.7420, lat: 35.6565, w: 30, d: 28, h: 65, tex: TEXTURES.glassDark, repeat: [2, 4] },
  { name: 'Kamiyacho Central Tower', lon: 139.7460, lat: 35.6618, w: 44, d: 38, h: 120, tex: TEXTURES.glassBlue, repeat: [3, 8] },
  { name: 'Kamiyacho Trust Tower', lon: 139.7442, lat: 35.6635, w: 52, d: 46, h: 180, tex: TEXTURES.glassDark, repeat: [4, 12] },
  { name: 'Atago Green Hills MORI Tower', lon: 139.7495, lat: 35.6630, w: 50, d: 44, h: 187, tex: TEXTURES.glassBlue, repeat: [4, 12] },
  { name: 'Atago Green Hills Plaza', lon: 139.7505, lat: 35.6622, w: 44, d: 40, h: 157, tex: TEXTURES.glassDark, repeat: [3, 10] },

  // ==========================================
  // SHIBUYA (Scramble Crossing & Commercial Core)
  // ==========================================
  { name: 'Shibuya Scramble Square', lon: 139.7022, lat: 35.6588, w: 60, d: 56, h: 230, tex: TEXTURES.glassBlue, repeat: [4, 15] },
  { name: 'Shibuya Hikarie', lon: 139.7035, lat: 35.6592, w: 50, d: 46, h: 183, tex: TEXTURES.glassDark, repeat: [4, 12] },
  { name: 'Shibuya Stream', lon: 139.7028, lat: 35.6565, w: 46, d: 40, h: 180, tex: TEXTURES.glassBlue, repeat: [3, 12] },
  { name: 'Shibuya Fukuras', lon: 139.6992, lat: 35.6578, w: 42, d: 40, h: 103, tex: TEXTURES.glassDark, repeat: [3, 7] },
  { name: 'Shibuya 109', lon: 139.6985, lat: 35.6597, w: 36, d: 36, h: 54, tex: TEXTURES.shibuyaBillboard, repeat: [2, 3] },
  { name: 'QFRONT Tsutaya Building (Scramble CCTV Mount)', lon: 139.7008, lat: 35.6601, w: 34, d: 30, h: 48, tex: TEXTURES.shibuyaBillboard, repeat: [2, 3] },
  { name: 'Shibuya Mark City East', lon: 139.6982, lat: 35.6585, w: 58, d: 38, h: 98, tex: TEXTURES.glassDark, repeat: [4, 6] },
  { name: 'Shibuya Station Complex', lon: 139.7012, lat: 35.6582, w: 72, d: 42, h: 62, tex: TEXTURES.glassBlue, repeat: [5, 4] },
  { name: 'Dogenzaka Commercial Center', lon: 139.6975, lat: 35.6595, w: 30, d: 26, h: 52, tex: TEXTURES.shibuyaBillboard, repeat: [2, 3] },
  { name: 'Seibu Shibuya', lon: 139.7012, lat: 35.6612, w: 55, d: 34, h: 58, tex: TEXTURES.glassDark, repeat: [4, 4] },
  { name: 'MAGNET by SHIBUYA109', lon: 139.7004, lat: 35.6592, w: 32, d: 28, h: 42, tex: TEXTURES.shibuyaBillboard, repeat: [2, 2] },

  // ==========================================
  // NEW YORK (Liberty Island & Lower Manhattan Skyline)
  // ==========================================
  // Lower Manhattan Skyline (North across Harbor)
  { name: 'One World Trade Center (541m)', lon: -74.0134, lat: 40.7127, w: 60, d: 60, h: 417, tex: TEXTURES.glassBlue, repeat: [4, 26] },
  { name: 'Three World Trade Center', lon: -74.0118, lat: 40.7115, w: 50, d: 46, h: 329, tex: TEXTURES.glassDark, repeat: [3, 20] },
  { name: 'Four World Trade Center', lon: -74.0118, lat: 40.7100, w: 46, d: 42, h: 298, tex: TEXTURES.glassBlue, repeat: [3, 18] },
  { name: '70 Pine Street', lon: -74.0078, lat: 40.7065, w: 44, d: 40, h: 290, tex: TEXTURES.glassDark, repeat: [3, 18] },
  { name: '40 Wall Street', lon: -74.0098, lat: 40.7070, w: 44, d: 40, h: 283, tex: TEXTURES.glassDark, repeat: [3, 17] },
  { name: '28 Liberty Street', lon: -74.0090, lat: 40.7078, w: 56, d: 34, h: 248, tex: TEXTURES.glassBlue, repeat: [4, 15] },
  { name: 'Woolworth Building', lon: -74.0080, lat: 40.7122, w: 44, d: 38, h: 241, tex: TEXTURES.glassDark, repeat: [3, 15] },
  { name: '200 West Street (Goldman Sachs HQ)', lon: -74.0145, lat: 40.7148, w: 62, d: 38, h: 228, tex: TEXTURES.glassBlue, repeat: [4, 14] },
  { name: 'Brookfield Place Tower 1', lon: -74.0152, lat: 40.7130, w: 48, d: 44, h: 215, tex: TEXTURES.glassDark, repeat: [3, 13] },
  { name: 'Brookfield Place Tower 2', lon: -74.0158, lat: 40.7122, w: 46, d: 42, h: 197, tex: TEXTURES.glassBlue, repeat: [3, 12] },
  { name: 'One New York Plaza', lon: -74.0118, lat: 40.7025, w: 56, d: 50, h: 195, tex: TEXTURES.glassDark, repeat: [4, 12] },
  { name: '17 State Street', lon: -74.0135, lat: 40.7042, w: 40, d: 36, h: 165, tex: TEXTURES.glassBlue, repeat: [3, 10] },

  // Jersey City Waterfront Towers
  { name: '99 Hudson Street (Jersey City)', lon: -74.0345, lat: 40.7162, w: 46, d: 40, h: 274, tex: TEXTURES.glassBlue, repeat: [3, 17] },
  { name: '30 Hudson Street (Goldman Sachs JC)', lon: -74.0335, lat: 40.7138, w: 52, d: 46, h: 238, tex: TEXTURES.glassDark, repeat: [3, 15] },
  { name: 'URBY Jersey City', lon: -74.0322, lat: 40.7175, w: 40, d: 36, h: 217, tex: TEXTURES.glassBlue, repeat: [3, 13] },
];

export function initLandmarks3D(viewer) {
  if (!viewer || !viewer.entities) {
    console.warn('[Landmarks3D] Viewer or entities collection not available.');
    return null;
  }

  const landmarkEntities = [];
  const buildingEntities = [];

  // 1. Spawn Core GLB 3D Landmarks
  for (const lm of LANDMARKS) {
    try {
      const position = Cesium.Cartesian3.fromDegrees(lm.lon, lm.lat, lm.alt);
      const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(lm.heading), 0, 0);
      const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

      const entity = viewer.entities.add({
        id: 'gev-landmark-' + lm.id,
        name: lm.name,
        position,
        orientation,
        model: {
          uri: lm.modelUrl,
          scale: lm.scale,
          minimumPixelSize: 32,
          maximumScale: 1.0,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
      landmarkEntities.push(entity);
    } catch (err) {
      console.warn('[Landmarks3D] Failed to spawn landmark ' + lm.name + ':', err);
    }
  }

  // 1b. Add Needle Antenna Spire to One World Trade Center (reaching 541m)
  try {
    const wtcSpirePos = Cesium.Cartesian3.fromDegrees(-74.0134, 40.7127, 417 + 62);
    const wtcSpire = viewer.entities.add({
      id: 'gev-building-wtc-spire',
      name: 'One World Trade Center Needle Spire (541m)',
      position: wtcSpirePos,
      cylinder: {
        length: 124,
        topRadius: 0.8,
        bottomRadius: 3.5,
        material: Cesium.Color.fromCssColorString('#e2e8f0'),
      },
    });
    buildingEntities.push(wtcSpire);
  } catch (err) {
    console.warn('[Landmarks3D] Failed to spawn WTC spire:', err);
  }

  // 2. Spawn 3D Architectural Buildings with PBR Facade Textures
  for (let idx = 0; idx < BUILDINGS.length; idx++) {
    const b = BUILDINGS[idx];
    try {
      const centerAlt = b.h / 2.0;
      const position = Cesium.Cartesian3.fromDegrees(b.lon, b.lat, centerAlt);

      const repeatX = b.repeat ? b.repeat[0] : 3;
      const repeatY = b.repeat ? b.repeat[1] : 10;

      const entity = viewer.entities.add({
        id: 'gev-building-' + idx,
        name: b.name,
        position,
        box: {
          dimensions: new Cesium.Cartesian3(b.w, b.d, b.h),
          material: new Cesium.ImageMaterialProperty({
            image: b.tex,
            repeat: new Cesium.Cartesian2(repeatX, repeatY),
          }),
        },
      });
      buildingEntities.push(entity);

      // Add mechanical penthouse / rooftop helipad for buildings >= 100m
      if (b.h >= 100) {
        const roofAlt = b.h + 4.0;
        const roofPos = Cesium.Cartesian3.fromDegrees(b.lon, b.lat, roofAlt);
        const roofEntity = viewer.entities.add({
          id: 'gev-building-roof-' + idx,
          name: b.name + ' Helipad & Penthouse',
          position: roofPos,
          box: {
            dimensions: new Cesium.Cartesian3(b.w * 0.70, b.d * 0.70, 8.0),
            material: new Cesium.ImageMaterialProperty({
              image: TEXTURES.rooftopHelipad,
            }),
          },
        });
        buildingEntities.push(roofEntity);
      }
    } catch (err) {
      console.warn('[Landmarks3D] Failed to spawn building ' + b.name + ':', err);
    }
  }

  console.info('[Landmarks3D] Successfully initialized ' + landmarkEntities.length + ' core 3D landmarks and ' + buildingEntities.length + ' 3D architectural skyscrapers with PBR facade textures.');

  return {
    landmarkEntities,
    buildingEntities,
    setVisible: (visible) => {
      for (const e of landmarkEntities) e.show = visible;
      for (const e of buildingEntities) e.show = visible;
    },
    destroy: () => {
      for (const e of landmarkEntities) viewer.entities.remove(e);
      for (const e of buildingEntities) viewer.entities.remove(e);
    }
  };
}
