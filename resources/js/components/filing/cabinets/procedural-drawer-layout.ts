import {
    Box3,
    ExtrudeGeometry,
    MathUtils,
    PerspectiveCamera,
    Shape,
    Vector3,
} from 'three';
import type { CabinetFilingItem } from '@/types/filing';
import type { cabinetDrawerInterior } from './procedural-cabinet-model';

export const DRAWER_CSS_SCALE = 400;

export function fitProceduralDrawerCamera(
    camera: PerspectiveCamera,
    bounds: Box3,
    size: { width: number; height: number },
) {
    const width = Math.max(1, size.width);
    const height = Math.max(1, size.height);
    // Match the lens, scale, tilt, and centering of the CSS closeup.
    const perspective = 1200;
    const distance = perspective / (DRAWER_CSS_SCALE * 0.9);
    const tilt = MathUtils.degToRad(52);
    const front = bounds.getCenter(new Vector3());
    front.z = bounds.max.z;
    camera.position
        .copy(front)
        .add(
            new Vector3(
                0,
                Math.sin(tilt) * distance,
                Math.cos(tilt) * distance,
            ),
        );
    camera.lookAt(front);
    const up = new Vector3(0, Math.cos(tilt), -Math.sin(tilt));
    const centerOffset = bounds.getCenter(new Vector3()).sub(front).dot(up);
    camera.position.addScaledVector(up, centerOffset);
    camera.fov = MathUtils.radToDeg(2 * Math.atan(height / (2 * perspective)));
    camera.aspect = width / height;
    camera.zoom = 1;
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    const projected = new Box3();
    for (const x of [bounds.min.x, bounds.max.x]) {
        for (const y of [bounds.min.y, bounds.max.y]) {
            for (const z of [bounds.min.z, bounds.max.z]) {
                projected.expandByPoint(new Vector3(x, y, z).project(camera));
            }
        }
    }
    const span = projected.getSize(new Vector3());
    camera.zoom = Math.min(2 / (span.x * 1.04), 2 / (span.y * 1.04));
    const center = projected
        .getCenter(new Vector3())
        .multiplyScalar(camera.zoom);
    camera.setViewOffset(
        width,
        height,
        (center.x * width) / 2,
        (-center.y * height) / 2,
        width,
        height,
    );
}

export type DrawerItemSlot = {
    item: CabinetFilingItem;
    width: number;
    height: number;
    depth: number;
    x: number;
    y: number;
    frontZ: number;
    rotationX: number;
};

export function createDrawerFolderMask(
    width: number,
    height: number,
    depth: number,
) {
    // Follow the raised rear-tab outline of ClosedFolderMesh, including its empty right shoulder.
    const x = (value: number) => (value / 1000 - 0.5) * width;
    const y = (value: number) => (0.5 - value / 707) * height;
    const outline = new Shape();
    outline.moveTo(x(26), y(-42));
    outline.lineTo(x(470), y(-42));
    outline.quadraticCurveTo(x(498), y(-42), x(498), y(-18));
    outline.quadraticCurveTo(x(498), y(0), x(524), y(0));
    outline.lineTo(x(974), y(0));
    outline.quadraticCurveTo(x(1000), y(0), x(1000), y(26));
    outline.lineTo(x(1000), y(707));
    outline.lineTo(x(0), y(707));
    outline.lineTo(x(0), y(-16));
    outline.quadraticCurveTo(x(0), y(-42), x(26), y(-42));
    outline.closePath();
    return new ExtrudeGeometry(outline, {
        depth,
        bevelEnabled: false,
        curveSegments: 8,
    }).translate(0, 0, -depth);
}

export function proceduralDrawerSlots(
    interior: ReturnType<typeof cabinetDrawerInterior>,
    items: readonly CabinetFilingItem[],
): DrawerItemSlot[] {
    const width = interior.width - 0.1;
    const frontClearance = 0.18;
    const depth = interior.frontZ - interior.backZ - frontClearance - 0.06;
    return items.slice(0, 16).map((item, index) => {
        if (item.kind === 'lever_arch') {
            // Reserve sight-line clearance over the tall front panel for the first spine label.
            const leverFrontClearance = 0.62;
            const leverDepth =
                interior.frontZ - interior.backZ - leverFrontClearance - 0.06;
            const itemWidth = Math.min(
                (width - 7 * 0.018) / 8,
                (interior.height * 0.9 * 75) / 285,
                (((leverDepth - 0.08) / 2) * 75) / 318,
            );
            const itemHeight = (itemWidth * 285) / 75;
            const itemDepth = (itemWidth * 318) / 75;
            return {
                item,
                width: itemWidth,
                height: itemHeight,
                depth: itemDepth,
                x:
                    -width / 2 +
                    (index % 8) * (itemWidth + 0.018) +
                    itemWidth / 2,
                y: interior.floorY + 0.012 + itemHeight / 2,
                frontZ:
                    interior.frontZ -
                    leverFrontClearance -
                    Math.floor(index / 8) * (itemDepth + 0.08),
                rotationX: 0,
            };
        }
        const folder = item.kind === 'folder';
        const itemHeight = folder
            ? Math.min(interior.height / 1.06, width / (297 / 210))
            : interior.height * 0.9;
        const itemWidth = folder
            ? itemHeight * (297 / 210)
            : (width - 7 * 0.018) / 8;
        const itemDepth = folder ? 0.018 : (depth - 0.08) / 2;
        const rotationX = folder ? MathUtils.degToRad(-18) : 0;
        const leanDepth = -Math.sin(rotationX) * itemHeight * 1.06;
        const baseZ =
            interior.frontZ -
            frontClearance -
            (folder
                ? index * ((depth - leanDepth - itemDepth) / 16)
                : Math.floor(index / 8) * (itemDepth + 0.08));
        return {
            item,
            width: itemWidth,
            height: itemHeight,
            depth: itemDepth,
            x: folder
                ? 0
                : -width / 2 +
                  (index % 8) * (itemWidth + 0.018) +
                  itemWidth / 2,
            y: interior.floorY + 0.012 + (Math.cos(rotationX) * itemHeight) / 2,
            frontZ: baseZ + (Math.sin(rotationX) * itemHeight) / 2,
            rotationX,
        };
    });
}
