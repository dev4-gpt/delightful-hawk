export function createGeoRiskVisualizer(viewer, Cesium) {
    let entities = [];

    return {
        show: () => {
            // Porter Ranch Active Wildfire
            entities.push(viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(-118.5585, 34.2821, 50),
                ellipse: {
                    semiMinorAxis: 1000.0,
                    semiMajorAxis: 2000.0,
                    height: 10.0,
                    extrudedHeight: 100.0,
                    material: Cesium.Color.ORANGE.withAlpha(0.7),
                    outline: true,
                    outlineColor: Cesium.Color.RED
                }
            }));

            // Threat Buffer Perimeter
            entities.push(viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(-118.5585, 34.2821, 10),
                ellipse: {
                    semiMinorAxis: 1500.0,
                    semiMajorAxis: 1500.0,
                    height: 5.0,
                    material: Cesium.Color.YELLOW.withAlpha(0.3),
                    outline: true,
                    outlineColor: Cesium.Color.YELLOW
                }
            }));

            // Alert Label
            entities.push(viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(-118.5585, 34.2821, 150),
                label: {
                    text: '🔥 VIIRS ACTIVE FIRE: 1443m to Substation',
                    font: '14pt sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    backgroundColor: Cesium.Color.RED.withAlpha(0.8),
                    showBackground: true,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -10)
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
