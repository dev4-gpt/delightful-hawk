export function createSubseaVisualizer(viewer, Cesium) {
    let entities = [];

    return {
        show: () => {
            // TAT-14 Cable
            entities.push(viewer.entities.add({
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArray([
                        -74.0, 40.5,
                        -70.0, 41.0,
                        -60.0, 42.0,
                        -30.0, 45.0,
                        -10.0, 48.0,
                        -4.0, 50.0
                    ]),
                    width: 5,
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.2,
                        taperPower: 0.5,
                        color: Cesium.Color.CYAN
                    })
                }
            }));

            // Pacific Unity Cable
            entities.push(viewer.entities.add({
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArray([
                        -122.4, 37.8,
                        -130.0, 36.0,
                        -150.0, 34.0,
                        140.0, 35.0
                    ]),
                    width: 5,
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.2,
                        taperPower: 0.5,
                        color: Cesium.Color.CYAN
                    })
                }
            }));

            // Landing stations
            const stations = [
                { lon: -74.0, lat: 40.5, name: 'Manasquan NJ' },
                { lon: -4.0, lat: 50.0, name: 'Bude UK' },
                { lon: 140.0, lat: 35.0, name: 'Chikura Japan' },
                { lon: -122.4, lat: 37.8, name: 'SF USA' } // Explicit SF landing just for consistency
            ];

            for (const station of stations) {
                entities.push(viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(station.lon, station.lat),
                    point: {
                        pixelSize: 10,
                        color: Cesium.Color.AQUA,
                        outlineColor: Cesium.Color.WHITE,
                        outlineWidth: 2
                    },
                    label: {
                        text: station.name,
                        font: '14pt sans-serif',
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        outlineWidth: 2,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -9)
                    }
                }));
            }

            // Threat zone
            entities.push(viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(-69.998, 41.002, 5000), // Adjusted height to render cylinder around the point
                cylinder: {
                    length: 10000.0,
                    topRadius: 15000.0,
                    bottomRadius: 15000.0,
                    material: Cesium.Color.RED.withAlpha(0.3),
                    outline: true,
                    outlineColor: Cesium.Color.RED
                }
            }));
        },
        hide: () => {
            for (const entity of entities) {
                viewer.entities.remove(entity);
            }
            entities = [];
        }
    };
}
