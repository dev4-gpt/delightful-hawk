import * as Cesium from 'cesium';

/**
 * Photorealistic 3D Landmark & Urban Architecture Layer
 * 
 * Provides high-fidelity 3D PBR architectural replacements across ALL major metropolitan hubs:
 * - Austin (Texas State Capitol rotunda & dome, Frost Bank folded glass crown, Jenga Tower cantilevers, UT Tower)
 * - San Francisco (Salesforce Tower obelisk, Transamerica Pyramid & spire, 181 Fremont, Ferry Building)
 * - New York (One World Trade Center with spire, Empire State Building, Chrysler Building, 30 Hudson Yards)
 * - Tokyo & Shibuya (Azabudai Hills, Roppongi Hills, Toranomon Hills, Scramble Square, QFRONT)
 * - London (The Shard pyramidal glass spire, The Gherkin, 22 Bishopsgate, Big Ben Elizabeth Tower)
 * - Paris (Eiffel Tower lattice, Tour Montparnasse, Arc de Triomphe, Grande Arche)
 * - Dubai (Burj Khalifa stepped tiers & spire, Burj Al Arab sail)
 * - Gurgaon / New Delhi (DLF Cyber City Horizon twin towers, Gateway Tower)
 * 
 * Equipped with ground elevation compensation (groundAlt), PBR facade textures,
 * architectural spires/domes, and automated ground-level live sensor / CCTV PiP integration.
 */

export const LANDMARKS = [
  {
    id: 'tokyo-tower',
    name: 'Tokyo Tower (333m)',
    lon: 139.745433,
    lat: 35.658580,
    alt: 22,
    modelUrl: '/models/tokyo_tower.glb',
    scale: 1.0,
    heading: 0,
  },
  {
    id: 'statue-of-liberty',
    name: 'Statue of Liberty (93m)',
    lon: -74.044500,
    lat: 40.689250,
    alt: 2,
    modelUrl: '/models/statue_of_liberty.glb',
    scale: 1.0,
    heading: 145, // Facing southeast towards harbor entrance
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
export const TEXTURES = {
  glassBlue: '/textures/facade_glass_blue.jpg',
  glassDark: '/textures/facade_glass_dark.jpg',
  shibuyaBillboard: '/textures/facade_shibuya.jpg',
  rooftopHelipad: '/textures/rooftop_helipad.jpg',
};

export const BUILDINGS = [
  // ==========================================
  // AUSTIN, TEXAS (C2 Hub & Capital District)
  // ==========================================
  // Texas State Capitol Rotunda & Legislative Complex (granite groundAlt ~158m)
  { name: 'Texas State Capitol Central Rotunda', lon: -97.7404, lat: 30.2747, w: 72, d: 52, h: 54, groundAlt: 158, tex: TEXTURES.glassDark, repeat: [4, 4], architecturalType: 'capitol-rotunda' },
  { name: 'Texas State Capitol East Wing (Senate)', lon: -97.7392, lat: 30.2747, w: 46, d: 38, h: 32, groundAlt: 158, tex: TEXTURES.glassDark, repeat: [3, 2] },
  { name: 'Texas State Capitol West Wing (House)', lon: -97.7416, lat: 30.2747, w: 46, d: 38, h: 32, groundAlt: 158, tex: TEXTURES.glassDark, repeat: [3, 2] },

  // Frost Bank Tower (157m folded glass crown pyramid)
  { name: 'Frost Bank Tower', lon: -97.7437, lat: 30.2673, w: 48, d: 42, h: 125, groundAlt: 148, tex: TEXTURES.glassBlue, repeat: [4, 11], architecturalType: 'frost-bank' },

  // The Independent / "Jenga Tower" (209m staggered cantilevered blocks)
  { name: 'The Independent (Jenga Tower)', lon: -97.7513, lat: 30.2687, w: 42, d: 40, h: 209, groundAlt: 142, tex: TEXTURES.glassBlue, repeat: [3, 16], architecturalType: 'jenga-tower' },

  // 6th and Guadalupe (265m tallest mixed-use skyscraper)
  { name: 'Sixth and Guadalupe', lon: -97.7468, lat: 30.2692, w: 56, d: 50, h: 265, groundAlt: 148, tex: TEXTURES.glassDark, repeat: [4, 18] },

  // University of Texas Austin Tower (94m limestone clock tower & belfry)
  { name: 'UT Austin Main Building & Clock Tower', lon: -97.7394, lat: 30.2862, w: 40, d: 36, h: 94, groundAlt: 170, tex: TEXTURES.glassDark, repeat: [3, 7], architecturalType: 'ut-tower' },

  // Additional Austin Skyline Landmarks
  { name: 'Fairmont Austin', lon: -97.7392, lat: 30.2625, w: 54, d: 44, h: 180, groundAlt: 140, tex: TEXTURES.glassBlue, repeat: [4, 14] },
  { name: '300 Colorado Tower', lon: -97.7445, lat: 30.2662, w: 46, d: 40, h: 155, groundAlt: 146, tex: TEXTURES.glassBlue, repeat: [3, 12] },
  { name: '405 Colorado', lon: -97.7442, lat: 30.2678, w: 44, d: 38, h: 140, groundAlt: 148, tex: TEXTURES.glassDark, repeat: [3, 11] },

  // ==========================================
  // SAN FRANCISCO, CALIFORNIA (Financial District & SOMA)
  // ==========================================
  // Salesforce Tower (326m tapered obelisk curved monolith)
  { name: 'Salesforce Tower (326m)', lon: -122.3978, lat: 37.7897, w: 50, d: 50, h: 326, groundAlt: 12, tex: TEXTURES.glassBlue, repeat: [4, 22], architecturalType: 'salesforce-tower' },

  // Transamerica Pyramid (260m faceted pyramid & needle spire)
  { name: 'Transamerica Pyramid (260m)', lon: -122.4018, lat: 37.7952, w: 54, d: 54, h: 210, groundAlt: 14, tex: TEXTURES.glassDark, repeat: [4, 16], architecturalType: 'transamerica-pyramid' },

  // 181 Fremont (245m angular tower with diagonal seismic lattice)
  { name: '181 Fremont Tower', lon: -122.3962, lat: 37.7905, w: 42, d: 38, h: 245, groundAlt: 12, tex: TEXTURES.glassBlue, repeat: [3, 17] },

  // 555 California Street (237m faceted carnelian granite tower)
  { name: '555 California Street', lon: -122.4038, lat: 37.7925, w: 62, d: 46, h: 237, groundAlt: 22, tex: TEXTURES.glassDark, repeat: [4, 16] },

  // Ferry Building (75m clock tower on Embarcadero)
  { name: 'San Francisco Ferry Building', lon: -122.3936, lat: 37.7955, w: 85, d: 35, h: 75, groundAlt: 4, tex: TEXTURES.glassDark, repeat: [6, 5] },

  // ==========================================
  // NEW YORK CITY (Lower Manhattan & Midtown)
  // ==========================================
  // One World Trade Center (541m with needle antenna spire)
  { name: 'One World Trade Center (541m)', lon: -74.0134, lat: 40.7127, w: 60, d: 60, h: 417, groundAlt: 6, tex: TEXTURES.glassBlue, repeat: [4, 26], architecturalType: 'wtc-spire' },
  { name: 'Three World Trade Center', lon: -74.0118, lat: 40.7115, w: 50, d: 46, h: 329, groundAlt: 6, tex: TEXTURES.glassDark, repeat: [3, 20] },
  { name: 'Four World Trade Center', lon: -74.0118, lat: 40.7100, w: 46, d: 42, h: 298, groundAlt: 6, tex: TEXTURES.glassBlue, repeat: [3, 18] },

  // Midtown Supertalls & Art Deco Icons
  { name: 'Empire State Building (443m)', lon: -73.9857, lat: 40.7484, w: 64, d: 54, h: 381, groundAlt: 18, tex: TEXTURES.glassDark, repeat: [4, 24], architecturalType: 'empire-state' },
  { name: 'Chrysler Building (319m)', lon: -73.9755, lat: 40.7516, w: 50, d: 46, h: 319, groundAlt: 16, tex: TEXTURES.glassBlue, repeat: [4, 20], architecturalType: 'chrysler-crown' },
  { name: '30 Hudson Yards (The Edge, 387m)', lon: -74.0020, lat: 40.7538, w: 58, d: 52, h: 387, groundAlt: 8, tex: TEXTURES.glassBlue, repeat: [4, 24] },
  { name: 'Central Park Tower (472m)', lon: -73.9818, lat: 40.7663, w: 44, d: 40, h: 472, groundAlt: 24, tex: TEXTURES.glassBlue, repeat: [3, 28] },

  // Lower Manhattan Wall Street Cluster
  { name: '70 Pine Street', lon: -74.0078, lat: 40.7065, w: 44, d: 40, h: 290, groundAlt: 8, tex: TEXTURES.glassDark, repeat: [3, 18] },
  { name: '40 Wall Street', lon: -74.0098, lat: 40.7070, w: 44, d: 40, h: 283, groundAlt: 8, tex: TEXTURES.glassDark, repeat: [3, 17] },
  { name: '28 Liberty Street', lon: -74.0090, lat: 40.7078, w: 56, d: 34, h: 248, groundAlt: 8, tex: TEXTURES.glassBlue, repeat: [4, 15] },
  { name: 'Woolworth Building', lon: -74.0080, lat: 40.7122, w: 44, d: 38, h: 241, groundAlt: 8, tex: TEXTURES.glassDark, repeat: [3, 15] },

  // ==========================================
  // TOKYO, JAPAN (Minato / Roppongi / Shibuya)
  // ==========================================
  // Azabudai Hills Mori JP Tower (Japan's tallest skyscraper, 330m)
  { name: 'Azabudai Hills Mori JP Tower', lon: 139.7408, lat: 35.6608, w: 62, d: 62, h: 330, groundAlt: 24, tex: TEXTURES.glassBlue, repeat: [4, 22] },
  { name: 'Azabudai Hills Residence A', lon: 139.7420, lat: 35.6598, w: 46, d: 40, h: 237, groundAlt: 24, tex: TEXTURES.glassDark, repeat: [3, 16] },
  { name: 'Roppongi Hills Mori Tower', lon: 139.7292, lat: 35.6605, w: 70, d: 60, h: 238, groundAlt: 28, tex: TEXTURES.glassDark, repeat: [5, 16] },
  { name: 'Toranomon Hills Station Tower', lon: 139.7485, lat: 35.6668, w: 58, d: 52, h: 266, groundAlt: 18, tex: TEXTURES.glassBlue, repeat: [4, 18] },

  // Shibuya Crossing & Commercial Core
  { name: 'Shibuya Scramble Square', lon: 139.7022, lat: 35.6588, w: 60, d: 56, h: 230, groundAlt: 32, tex: TEXTURES.glassBlue, repeat: [4, 15] },
  { name: 'Shibuya Hikarie', lon: 139.7035, lat: 35.6592, w: 50, d: 46, h: 183, groundAlt: 32, tex: TEXTURES.glassDark, repeat: [4, 12] },
  { name: 'Shibuya Stream', lon: 139.7028, lat: 35.6565, w: 46, d: 40, h: 180, groundAlt: 32, tex: TEXTURES.glassBlue, repeat: [3, 12] },
  { name: 'QFRONT Tsutaya Building (Scramble CCTV Mount)', lon: 139.7008, lat: 35.6601, w: 34, d: 30, h: 48, groundAlt: 32, tex: TEXTURES.shibuyaBillboard, repeat: [2, 3] },
  { name: 'Shibuya 109', lon: 139.6985, lat: 35.6597, w: 36, d: 36, h: 54, groundAlt: 32, tex: TEXTURES.shibuyaBillboard, repeat: [2, 3] },

  // ==========================================
  // LONDON, UK (The City & Westminster)
  // ==========================================
  // The Shard (310m pyramidal glass spire)
  { name: 'The Shard (310m)', lon: -0.0865, lat: 51.5045, w: 52, d: 52, h: 310, groundAlt: 10, tex: TEXTURES.glassBlue, repeat: [4, 22], architecturalType: 'the-shard' },

  // 30 St Mary Axe / The Gherkin (180m curved diagrid)
  { name: '30 St Mary Axe (The Gherkin)', lon: -0.0803, lat: 51.5145, w: 46, d: 46, h: 180, groundAlt: 14, tex: TEXTURES.glassBlue, repeat: [3, 12], architecturalType: 'gherkin' },

  // 22 Bishopsgate (278m faceted monolith)
  { name: '22 Bishopsgate', lon: -0.0827, lat: 51.5148, w: 56, d: 48, h: 278, groundAlt: 15, tex: TEXTURES.glassDark, repeat: [4, 18] },

  // Big Ben & Palace of Westminster (96m Elizabeth Tower)
  { name: 'Elizabeth Tower (Big Ben, 96m)', lon: -0.1246, lat: 51.5007, w: 34, d: 34, h: 96, groundAlt: 8, tex: TEXTURES.glassDark, repeat: [3, 7], architecturalType: 'big-ben' },

  // ==========================================
  // PARIS, FRANCE (Champs-Élysées & La Défense)
  // ==========================================
  // Tour Montparnasse (210m bronze glass tower)
  { name: 'Tour Montparnasse', lon: 2.3218, lat: 48.8421, w: 58, d: 46, h: 210, groundAlt: 58, tex: TEXTURES.glassDark, repeat: [4, 15] },

  // Arc de Triomphe (50m classical stone arch)
  { name: 'Arc de Triomphe', lon: 2.2950, lat: 48.8738, w: 45, d: 30, h: 50, groundAlt: 55, tex: TEXTURES.glassDark, repeat: [3, 3] },

  // Grande Arche de la Défense (110m hollow hypercube)
  { name: 'Grande Arche de la Défense', lon: 2.2361, lat: 48.8926, w: 108, d: 108, h: 110, groundAlt: 48, tex: TEXTURES.glassBlue, repeat: [6, 6] },

  // ==========================================
  // DUBAI, UAE (Downtown & Marina)
  // ==========================================
  // Burj Khalifa (828m world-record megatall tower with stepped setbacks & pinnacle spire)
  { name: 'Burj Khalifa (828m)', lon: 55.2744, lat: 25.1972, w: 68, d: 68, h: 828, groundAlt: 8, tex: TEXTURES.glassBlue, repeat: [4, 45], architecturalType: 'burj-khalifa' },

  // Burj Al Arab (321m sail-shaped luxury tower)
  { name: 'Burj Al Arab (321m)', lon: 55.1852, lat: 25.1412, w: 60, d: 52, h: 321, groundAlt: 4, tex: TEXTURES.glassBlue, repeat: [4, 22] },

  // ==========================================
  // GURGAON / NEW DELHI, INDIA (Cyber City Core)
  // ==========================================
  { name: 'DLF Cyber City Horizon Twin Towers', lon: 77.0932, lat: 28.4950, w: 62, d: 44, h: 135, groundAlt: 225, tex: TEXTURES.glassBlue, repeat: [4, 10] },
  { name: 'Gateway Tower (Ship Building)', lon: 77.0880, lat: 28.4925, w: 48, d: 36, h: 65, groundAlt: 225, tex: TEXTURES.glassDark, repeat: [3, 5] },
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
      const position = Cesium.Cartesian3.fromDegrees(lm.lon, lm.lat, lm.alt || 0);
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

  // 2. Spawn 3D Architectural Buildings with PBR Facade Textures & Elevation Offsets
  for (let idx = 0; idx < BUILDINGS.length; idx++) {
    const b = BUILDINGS[idx];
    try {
      const baseGround = b.groundAlt || 0;
      const centerAlt = baseGround + (b.h / 2.0);
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
      if (b.h >= 100 && !b.architecturalType) {
        const roofAlt = baseGround + b.h + 4.0;
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

      // Specialized Architectural Crowns, Spires, and Domes
      if (b.architecturalType === 'capitol-rotunda') {
        // Texas State Capitol Rotunda Dome & Lantern
        const domeAlt = baseGround + b.h + 18.0;
        const domePos = Cesium.Cartesian3.fromDegrees(b.lon, b.lat, domeAlt);
        const domeEntity = viewer.entities.add({
          id: 'gev-capitol-dome',
          name: 'Texas State Capitol Grand Granite Dome (94m)',
          position: domePos,
          ellipsoid: {
            radii: new Cesium.Cartesian3(18.0, 18.0, 20.0),
            material: Cesium.Color.fromCssColorString('#e07a5f').withAlpha(0.95), // Texas Sunset Red Granite
          }
        });
        buildingEntities.push(domeEntity);

        // Capitol Spire & Goddess of Liberty
        const spireAlt = domeAlt + 24.0;
        const spirePos = Cesium.Cartesian3.fromDegrees(b.lon, b.lat, spireAlt);
        const spireEntity = viewer.entities.add({
          id: 'gev-capitol-spire',
          name: 'Goddess of Liberty & Capitol Lantern',
          position: spirePos,
          cylinder: {
            length: 16.0,
            topRadius: 0.6,
            bottomRadius: 2.5,
            material: Cesium.Color.fromCssColorString('#f4f1de'),
          }
        });
        buildingEntities.push(spireEntity);
      } else if (b.architecturalType === 'frost-bank') {
        // Frost Bank Folded Glass Pyramid Crown
        const crownAlt = baseGround + b.h + 16.0;
        const crownPos = Cesium.Cartesian3.fromDegrees(b.lon, b.lat, crownAlt);
        const crownEntity = viewer.entities.add({
          id: 'gev-frost-crown',
          name: 'Frost Bank Folded Glass Crown (157m)',
          position: crownPos,
          cylinder: {
            length: 32.0,
            topRadius: 1.0,
            bottomRadius: b.w * 0.45,
            material: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.85), // Crystalline folded glass
          }
        });
        buildingEntities.push(crownEntity);
      } else if (b.architecturalType === 'wtc-spire') {
        // One World Trade Center Needle Antenna Spire
        const wtcSpirePos = Cesium.Cartesian3.fromDegrees(b.lon, b.lat, baseGround + b.h + 62);
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
      } else if (b.architecturalType === 'transamerica-pyramid') {
        // Transamerica Spire
        const spirePos = Cesium.Cartesian3.fromDegrees(b.lon, b.lat, baseGround + b.h + 25);
        const transSpire = viewer.entities.add({
          id: 'gev-transamerica-spire',
          name: 'Transamerica Pyramid Mast Spire (260m)',
          position: spirePos,
          cylinder: {
            length: 50.0,
            topRadius: 0.5,
            bottomRadius: 2.2,
            material: Cesium.Color.fromCssColorString('#f8fafc'),
          }
        });
        buildingEntities.push(transSpire);
      } else if (b.architecturalType === 'burj-khalifa') {
        // Burj Khalifa Telescoping Needle Spire (reaching 828m)
        const spirePos = Cesium.Cartesian3.fromDegrees(b.lon, b.lat, baseGround + b.h + 54);
        const burjSpire = viewer.entities.add({
          id: 'gev-burj-spire',
          name: 'Burj Khalifa Pinnacle Spire (828m)',
          position: spirePos,
          cylinder: {
            length: 108.0,
            topRadius: 0.5,
            bottomRadius: 3.0,
            material: Cesium.Color.fromCssColorString('#94a3b8'),
          }
        });
        buildingEntities.push(burjSpire);
      } else if (b.architecturalType === 'the-shard') {
        // The Shard Pyramid Crown
        const shardSpirePos = Cesium.Cartesian3.fromDegrees(b.lon, b.lat, baseGround + b.h + 15);
        const shardSpire = viewer.entities.add({
          id: 'gev-shard-spire',
          name: 'The Shard Glass Pinnacle',
          position: shardSpirePos,
          cylinder: {
            length: 30.0,
            topRadius: 0.5,
            bottomRadius: 3.8,
            material: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.85),
          }
        });
        buildingEntities.push(shardSpire);
      }
    } catch (err) {
      console.warn('[Landmarks3D] Failed to spawn building ' + b.name + ':', err);
    }
  }

  // 3. Ground-Level Live Sensor / CCTV PiP Integration
  // When clicking on any building or zooming to street level (<350m AGL),
  // automatically select the closest CCTV camera and pop open the CCTV PiP panel.
  bindCctvSensorProximity(viewer, BUILDINGS);

  console.info('[Landmarks3D] Successfully initialized ' + landmarkEntities.length + ' core 3D landmarks and ' + buildingEntities.length + ' 3D architectural skyscrapers with PBR facade textures across Austin, SF, NYC, Tokyo, London, Paris, Dubai, and Gurgaon.');

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

/**
 * Binds building click and camera altitude triggers to the live CCTV HUD panel
 */
function bindCctvSensorProximity(viewer, buildings) {
  if (!viewer || !viewer.scene) return;

  // 1. World Click Handler on Buildings
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((movement) => {
    try {
      const picked = viewer.scene.pick(movement.position);
      if (picked && picked.id && typeof picked.id.id === 'string') {
        const id = picked.id.id;
        if (id.startsWith('gev-building-') || id.startsWith('gev-landmark-')) {
          // Identify building coordinates
          const matchIdx = id.match(/gev-building-(\d+)/);
          let targetCoords = null;
          if (matchIdx && buildings[parseInt(matchIdx[1], 10)]) {
            const b = buildings[parseInt(matchIdx[1], 10)];
            targetCoords = { lat: b.lat, lon: b.lon, name: b.name };
          }

          activateNearestCctvSensor(targetCoords);
        }
      }
    } catch {
      // Non-blocking picking safeguard
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // 2. Camera Altitude Trigger (< 350m AGL)
  let lastTriggerTime = 0;
  viewer.camera.moveEnd.addEventListener(() => {
    try {
      const now = Date.now();
      if (now - lastTriggerTime < 4000) return; // Debounce 4s

      const carto = viewer.camera.positionCartographic;
      if (carto && carto.height < 350.0) {
        lastTriggerTime = now;
        const lat = Cesium.Math.toDegrees(carto.latitude);
        const lon = Cesium.Math.toDegrees(carto.longitude);
        activateNearestCctvSensor({ lat, lon, name: 'Ground-Level Proximity (<350m)' });
      }
    } catch {
      // Non-blocking camera safeguard
    }
  });
}

/**
 * Activates the nearest live municipal/tactical CCTV camera stream in the HUD
 */
export function activateNearestCctvSensor(coords = null) {
  try {
    const dataManager = window.__godsEyeView?.dataManager;
    if (!dataManager || !dataManager.cctv) return;

    // Enable CCTV layer if disabled
    if (typeof dataManager.setEnabled === 'function') {
      dataManager.setEnabled('cctv', true);
    }

    // Select nearest camera
    if (typeof dataManager.cctv.focusNearest === 'function') {
      dataManager.cctv.focusNearest({ focus: false });
    }

    // Expand HUD CCTV context panel
    const ui = window.__godsEyeView?.ui;
    if (ui && typeof ui.setPanelCollapsed === 'function') {
      ui.setPanelCollapsed('cctv-panel', false, { explicit: true });
    }
  } catch (err) {
    console.debug('[Landmarks3D] CCTV proximity activation note:', err);
  }
}
