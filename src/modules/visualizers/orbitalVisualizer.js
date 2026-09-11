export function createOrbitalVisualizer(viewer, Cesium) {
    let entities = [];

    const hide = () => {
        for (const entity of entities) {
            viewer.entities.remove(entity);
        }
        entities = [];
    };

    return {
        show: () => {
            hide();
            const primaryPositions = [];
            for (let i = 0; i <= 360; i += 5) {
                const lon = i;
                const lat = 51.6 * Math.sin(Cesium.Math.toRadians(i));
                primaryPositions.push(lon, lat, 550000);
            }

            entities.push(viewer.entities.add({
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArrayHeights(primaryPositions),
                    width: 3,
                    material: new Cesium.PolylineDashMaterialProperty({
                        color: Cesium.Color.CYAN
                    })
                }
            }));
            
            const secondaryPositions = [];
            for (let i = 0; i <= 360; i += 5) {
                const lon = i;
                const lat = 82.0 * Math.cos(Cesium.Math.toRadians(i));
                secondaryPositions.push(lon, lat, 550000);
            }

            entities.push(viewer.entities.add({
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArrayHeights(secondaryPositions),
                    width: 3,
                    material: new Cesium.PolylineDashMaterialProperty({
                        color: Cesium.Color.ORANGE
                    })
                }
            }));

            // Conjunction Point
            entities.push(viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(10.0, 45.0, 550000),
                point: {
                    pixelSize: 15,
                    color: Cesium.Color.RED
                },
                label: {
                    text: '⚠️ CONJUNCTION WARNING: 2.18 km miss distance',
                    font: '14pt monospace',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    fillColor: Cesium.Color.RED,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -15)
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
