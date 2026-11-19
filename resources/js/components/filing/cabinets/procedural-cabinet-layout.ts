import { Box3, MathUtils, PerspectiveCamera, Vector3 } from 'three';

export function fitProceduralCabinetCamera(
    camera: PerspectiveCamera,
    dimensions: {
        height: number;
        width: number;
        depth: number;
        drawerTravel: number;
    },
    size: { width: number; height: number },
) {
    const width = Math.max(1, size.width);
    const viewportHeight = Math.max(1, size.height);
    const { height } = dimensions;
    const distance = height * 8;
    const azimuth = MathUtils.degToRad(-24);
    const center = new Vector3(0, height * 0.46, 0);
    const horizontalSpan = Math.hypot(
        dimensions.width,
        dimensions.depth + dimensions.drawerTravel,
    );
    const verticalSpan = Math.max(
        height * 1.24,
        (horizontalSpan * 1.04 * viewportHeight) / width,
    );

    // A level, shifted lens keeps steel uprights parallel while depth converges.
    camera.position.set(
        Math.sin(azimuth) * distance,
        center.y + Math.tan(MathUtils.degToRad(12)) * distance,
        Math.cos(azimuth) * distance,
    );
    camera.lookAt(0, camera.position.y, 0);
    camera.aspect = width / viewportHeight;
    camera.fov = MathUtils.radToDeg(
        2 * Math.atan(verticalSpan / (2 * distance)),
    );
    camera.zoom = 1;
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    const projectedCenter = center.project(camera);
    camera.setViewOffset(
        width,
        viewportHeight,
        0,
        (-projectedCenter.y * viewportHeight) / 2,
        width,
        viewportHeight,
    );
}

export function cabinetRotationTarget(current: number, requested: number) {
    const difference = requested - current;
    return current + Math.atan2(Math.sin(difference), Math.cos(difference));
}

export function fitProceduralCabinetBounds(
    camera: PerspectiveCamera,
    bounds: Box3,
    blend = 1,
) {
    const point = new Vector3();
    let extent = 0;
    for (const x of [bounds.min.x, bounds.max.x]) {
        for (const y of [bounds.min.y, bounds.max.y]) {
            for (const z of [bounds.min.z, bounds.max.z]) {
                point.set(x, y, z).project(camera);
                extent = Math.max(
                    extent,
                    Math.abs(point.x / camera.zoom),
                    Math.abs(point.y / camera.zoom),
                );
            }
        }
    }
    const target = Math.min(1, 0.96 / Math.max(extent, 0.001));
    const previous = camera.zoom;
    const next =
        Math.abs(target - previous) < 0.001
            ? target
            : MathUtils.lerp(previous, target, blend);
    const view = camera.view;
    camera.zoom = next;
    if (view?.enabled) {
        camera.setViewOffset(
            view.fullWidth,
            view.fullHeight,
            (view.offsetX * next) / previous,
            (view.offsetY * next) / previous,
            view.width,
            view.height,
        );
    } else {
        camera.updateProjectionMatrix();
    }
    return Math.abs(next - target) > 0.0001;
}
