export function createGridTwinVisualizer(viewer, Cesium) {
    let entities = [];

    return {
        show: () => {
            // Loudoun 500kV Substation
            entities.push(viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(-77.4874, 39.0438, 250), // height/2
                cylinder: {
                    length: 500.0,
                    topRadius: 1000.0,
                    bottomRadius: 1000.0,
                    material: Cesium.Color.RED.withAlpha(0.6)
                },
                label: {
                    text: 'CRITICAL_THERMAL_OVERLOAD 99.4%',
                    font: '12pt sans-serif',
                    fillColor: Cesium.Color.RED,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -20)
                }
            }));

            // Ashburn Data Center Alley
            entities.push(viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(-77.4520, 39.0180, 200),
                cylinder: {
                    length: 400.0,
                    topRadius: 1500.0,
                    bottomRadius: 1500.0,
                    material: Cesium.Color.ORANGE.withAlpha(0.6)
                },
                label: {
                    text: 'STRAINED',
                    font: '12pt sans-serif',
                    fillColor: Cesium.Color.ORANGE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -20)
                }
            }));

            // Pacific Northwest Hydro Substation
            entities.push(viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(-121.1739, 45.5898, 150),
                cylinder: {
                    length: 300.0,
                    topRadius: 1000.0,
                    bottomRadius: 1000.0,
                    material: Cesium.Color.GREEN.withAlpha(0.6)
                },
                label: {
                    text: 'NOMINAL',
                    font: '12pt sans-serif',
                    fillColor: Cesium.Color.GREEN,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -20)
                }
            }));

            // Power transmission lines
            entities.push(viewer.entities.add({
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                        -77.4874, 39.0438, 500,
                        -77.4520, 39.0180, 400
                    ]),
                    width: 4,
                    material: new Cesium.PolylineDashMaterialProperty({
                        color: Cesium.Color.YELLOW,
                        dashLength: 20.0
                    })
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
