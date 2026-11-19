import {
    BoxGeometry,
    CylinderGeometry,
    DataTexture,
    ExtrudeGeometry,
    Group,
    LinearFilter,
    LinearMipmapLinearFilter,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PlaneGeometry,
    Path,
    RepeatWrapping,
    RGBAFormat,
    Shape,
    type BufferGeometry,
    type Material,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
    cabinetColor,
    type CabinetColor,
} from '../../../lib/cabinet-colors.ts';

export type CabinetModelDrawer = { id: string; label: string };
export const CABINET_DIMENSIONS_MM = {
    height: 1320,
    width: 460,
    depth: 620,
} as const;
export const CABINET_WIDTH = 2.2;
const mm = (value: number) =>
    (value * CABINET_WIDTH) / CABINET_DIMENSIONS_MM.width;
export const CABINET_HEIGHT = mm(CABINET_DIMENSIONS_MM.height);
export const CABINET_DEPTH = mm(CABINET_DIMENSIONS_MM.depth);
export const CABINET_DRAWER_TRAVEL = mm(480);
const WALL = mm(0.8);
const PLINTH = mm(45);
const TOP = mm(32);
const GAP = mm(2.8);

export function cabinetModelLayout(drawerCount: number) {
    const count = Math.max(0, Math.floor(drawerCount));
    const height = CABINET_HEIGHT;
    const innerHeight = height - PLINTH - TOP - GAP * 2;
    const drawerHeight =
        (innerHeight - GAP * Math.max(0, count - 1)) / Math.max(1, count);
    return {
        height,
        drawerHeight,
        centers: Array.from(
            { length: count },
            (_, index) =>
                height -
                TOP -
                GAP -
                drawerHeight / 2 -
                index * (drawerHeight + GAP),
        ),
    };
}

export function cabinetDrawerEase(progress: number) {
    const t = Math.max(0, Math.min(1, progress));
    return t * t * t * (t * (t * 6 - 15) + 10);
}

export function cabinetDrawerInterior(drawerCount: number) {
    const h = cabinetModelLayout(drawerCount).drawerHeight;
    const floorY = -h / 2 + Math.min(0.09, h * 0.12);
    const topY = h / 2 - Math.min(0.13, h * 0.16);
    return {
        width: CABINET_WIDTH - mm(40) - GAP * 2 - 0.18,
        fasciaHeight: h,
        floorY,
        topY,
        height: topY - floorY,
        frontZ: CABINET_DEPTH / 2 - 0.1,
        backZ: -CABINET_DEPTH / 2 + 0.12,
    };
}

function paintGrain() {
    const size = 64;
    const pixels = new Uint8Array(size * size * 4);
    let seed = 4281;
    for (let i = 0; i < size * size; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const grain = 220 + (seed % 30);
        pixels.set([grain, grain, grain, 255], i * 4);
    }
    const texture = new DataTexture(pixels, size, size, RGBAFormat);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(7, 11);
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
}

function createCabinetModel(
    drawers: readonly CabinetModelDrawer[],
    isolatedDrawerId: string | null = null,
    color?: CabinetColor,
) {
    if (
        isolatedDrawerId !== null &&
        !drawers.some((drawer) => drawer.id === isolatedDrawerId)
    ) {
        throw new Error('The selected drawer is not in this cabinet.');
    }
    const root = new Group();
    root.name = 'procedural-cabinet';
    const layout = cabinetModelLayout(drawers.length);
    const grain = paintGrain();
    const finish = cabinetColor(color);
    const paint = new MeshStandardMaterial({
        color: finish.paint,
        metalness: 0.08,
        roughness: 0.57,
        roughnessMap: grain,
    });
    paint.name = 'cabinet-body-paint';
    const fronts = paint.clone();
    fronts.name = 'cabinet-front-paint';
    fronts.color.set(finish.front);
    const inside = new MeshStandardMaterial({
        color: '#98a6aa',
        metalness: 0.25,
        roughness: 0.63,
    });
    const steel = new MeshStandardMaterial({
        color: '#b8c1c4',
        metalness: 0.92,
        roughness: 0.3,
        roughnessMap: grain,
    });
    const handle = new MeshStandardMaterial({
        color: '#12191d',
        metalness: 0.08,
        roughness: 0.48,
    });
    const dark = new MeshStandardMaterial({
        color: '#303b41',
        metalness: 0.15,
        roughness: 0.8,
    });
    const rubber = new MeshStandardMaterial({
        color: '#252c30',
        roughness: 0.94,
    });
    const accent = new MeshBasicMaterial({ color: '#2563eb' });
    const drawerGroups = new Map<string, Group>();
    const slides = new Map<string, Group>();
    const highlights = new Map<string, Group>();
    const labels = new Map<string, Mesh<PlaneGeometry, MeshBasicMaterial>>();
    const geometryCache = new Map<string, BufferGeometry>();

    function box(
        parent: Group,
        name: string,
        size: [number, number, number],
        position: [number, number, number],
        material: Material,
        radius = 0,
    ) {
        const key = `${size.join(',')}:${radius}`;
        let geometry = geometryCache.get(key);
        if (!geometry) {
            geometry =
                radius > 0 && Math.min(...size) > 0.01
                    ? new RoundedBoxGeometry(
                          ...size,
                          2,
                          Math.min(radius, Math.min(...size) / 2),
                      )
                    : new BoxGeometry(...size);
            geometryCache.set(key, geometry);
        }
        const mesh = new Mesh(geometry, material);
        mesh.name = name;
        mesh.position.set(...position);
        mesh.castShadow = mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    }

    function disc(
        parent: Group,
        name: string,
        radius: number,
        x: number,
        y: number,
        z: number,
        material = steel,
    ) {
        const key = `disc:${radius}`;
        let geometry = geometryCache.get(key);
        if (!geometry) {
            geometry = new CylinderGeometry(radius, radius, 0.012, 24);
            geometryCache.set(key, geometry);
        }
        const mesh = new Mesh(geometry, material);
        mesh.name = name;
        mesh.rotation.x = Math.PI / 2;
        mesh.position.set(x, y, z);
        mesh.castShadow = mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    }

    const halfWidth = CABINET_WIDTH / 2;
    const front = CABINET_DEPTH / 2;
    const bodyHeight = layout.height - TOP - GAP;
    const width = CABINET_WIDTH - mm(40) - GAP * 2;
    if (isolatedDrawerId === null) {
        for (const side of [-1, 1]) {
            box(
                root,
                side < 0 ? 'left-panel' : 'right-panel',
                [WALL, bodyHeight, CABINET_DEPTH],
                [side * (halfWidth - WALL / 2), bodyHeight / 2, 0],
                paint,
            );
            box(
                root,
                'folded-front-jamb',
                [mm(20), bodyHeight, WALL],
                [side * (halfWidth - mm(10)), bodyHeight / 2, front - WALL / 2],
                paint,
            );
            box(
                root,
                'inner-jamb-return',
                [WALL, bodyHeight - PLINTH, 0.07],
                [
                    side * (halfWidth - 0.07),
                    (bodyHeight + PLINTH) / 2,
                    front - 0.035,
                ],
                inside,
            );
            box(
                root,
                'rear-fold',
                [0.065, bodyHeight, WALL],
                [side * (halfWidth - 0.04), bodyHeight / 2, -front + 0.008],
                paint,
            );
        }
        box(
            root,
            'top-panel',
            [CABINET_WIDTH, TOP, CABINET_DEPTH],
            [0, layout.height - TOP / 2, 0],
            paint,
            0.018,
        );
        box(
            root,
            'top-cap-shadow-seam',
            [CABINET_WIDTH - WALL * 2, GAP * 0.75, CABINET_DEPTH - WALL * 2],
            [0, layout.height - TOP - GAP / 2, 0],
            dark,
            0.002,
        );
        box(
            root,
            'back-panel',
            [CABINET_WIDTH - WALL * 2, bodyHeight, WALL],
            [0, bodyHeight / 2, -front + WALL / 2],
            paint,
        );
        box(
            root,
            'base',
            [CABINET_WIDTH - WALL * 2, PLINTH, WALL],
            [0, PLINTH / 2, front - WALL / 2],
            paint,
            0.012,
        );
        box(
            root,
            'bottom-panel',
            [CABINET_WIDTH - WALL * 2, WALL, CABINET_DEPTH - WALL * 2],
            [0, mm(9), 0],
            paint,
            0,
        );
        box(
            root,
            'base-front-fold',
            [CABINET_WIDTH - 0.14, 0.065, WALL],
            [0, PLINTH - 0.03, front - 0.08],
            paint,
        );
        for (const x of [-halfWidth + 0.18, halfWidth - 0.18]) {
            for (const z of [-front + 0.18, front - 0.18]) {
                box(
                    root,
                    'rubber-foot',
                    [mm(24), mm(8), mm(24)],
                    [x, mm(4), z],
                    rubber,
                );
                const fixing = disc(
                    root,
                    'bottom-fixing',
                    mm(5),
                    x,
                    mm(1.3),
                    z,
                    steel,
                );
                fixing.rotation.x = 0;
            }
        }

        for (const x of [-halfWidth + mm(18), halfWidth - mm(18)]) {
            box(
                root,
                'rear-folded-edge',
                [mm(10), layout.height - TOP - mm(16), WALL],
                [x, (layout.height - TOP) / 2, -front + WALL / 4],
                paint,
                0,
            );
            for (const y of [mm(24), layout.height - TOP - mm(20)]) {
                disc(
                    root,
                    'rear-fastener',
                    mm(2.5),
                    x,
                    y,
                    -front + WALL / 4,
                    dark,
                );
            }
        }
        const lockX = halfWidth - mm(20);
        const lockY = layout.height - TOP / 2;
        disc(root, 'lock-bezel', mm(8), lockX, lockY, front + mm(0.5));
        disc(
            root,
            'lock-cylinder',
            mm(6),
            lockX,
            lockY,
            front + mm(1.2),
            handle,
        );
        box(
            root,
            'key-slot',
            [mm(1.3), mm(8), mm(0.5)],
            [lockX, lockY, front + mm(2.5)],
            dark,
            0.001,
        );
    }

    drawers.forEach((drawer, index) => {
        if (isolatedDrawerId !== null && drawer.id !== isolatedDrawerId) return;
        const group = new Group();
        group.name = `drawer-${drawer.id}`;
        group.userData.drawerId = drawer.id;
        group.position.y =
            isolatedDrawerId === null ? layout.centers[index] : 0;
        root.add(group);
        drawerGroups.set(drawer.id, group);
        const h = layout.drawerHeight;
        const pullScale = Math.min(1, h / 0.6);
        const fasciaKey = `fascia:${width}:${h}:${pullScale}`;
        let fasciaGeometry = geometryCache.get(fasciaKey);
        if (!fasciaGeometry) {
            const shape = new Shape();
            shape.moveTo(-width / 2, -h / 2);
            shape.lineTo(width / 2, -h / 2);
            shape.lineTo(width / 2, h / 2);
            shape.lineTo(-width / 2, h / 2);
            shape.closePath();
            const opening = new Path();
            const holeX = 0.32 * pullScale;
            const holeY = 0.14 * pullScale;
            const centerY = h * 0.17;
            opening.moveTo(-holeX, centerY - holeY);
            opening.lineTo(-holeX, centerY + holeY);
            opening.lineTo(holeX, centerY + holeY);
            opening.lineTo(holeX, centerY - holeY);
            opening.closePath();
            shape.holes.push(opening);
            fasciaGeometry = new ExtrudeGeometry(shape, {
                depth: 0.04,
                steps: 1,
                bevelEnabled: true,
                bevelSegments: 1,
                bevelSize: 0.001,
                bevelThickness: 0.001,
                curveSegments: 1,
            });
            geometryCache.set(fasciaKey, fasciaGeometry);
        }
        const fascia = new Mesh(fasciaGeometry, fronts);
        fascia.name = 'drawer-front';
        fascia.position.z = front - 0.042;
        fascia.castShadow = fascia.receiveShadow = true;
        group.add(fascia);
        const returnDepth = 0.075;
        const returnZ = fascia.position.z - returnDepth / 2 + WALL;
        box(
            group,
            'front-return-top',
            [width - 0.02, WALL, returnDepth],
            [0, h / 2 - WALL / 2, returnZ],
            fronts,
        );
        box(
            group,
            'front-return-bottom',
            [width - 0.02, WALL, returnDepth],
            [0, -h / 2 + WALL / 2, returnZ],
            fronts,
        );
        const interior = cabinetDrawerInterior(drawers.length);
        const trayWidth = interior.width;
        const trayFloor = interior.floorY;
        const trayTop = interior.topY;
        box(
            group,
            'tray-floor',
            [trayWidth, WALL, CABINET_DEPTH - 0.18],
            [0, trayFloor, 0.005],
            inside,
        );
        box(
            group,
            'tray-back',
            [trayWidth, trayTop - trayFloor, WALL],
            [0, (trayTop + trayFloor) / 2, -front + 0.11],
            inside,
        );
        for (const side of [-1, 1]) {
            const x = (side * trayWidth) / 2;
            box(
                group,
                'tray-side',
                [WALL, trayTop - trayFloor, CABINET_DEPTH - 0.19],
                [x, (trayTop + trayFloor) / 2, 0.01],
                inside,
            );
            box(
                group,
                'rolled-tray-rim',
                [0.035, 0.025, CABINET_DEPTH - 0.2],
                [x, trayTop, 0.01],
                steel,
                0.012,
            );
            box(
                group,
                'inner-slide-rail',
                [0.025, mm(28), CABINET_DEPTH - 0.31],
                [x + side * 0.018, trayFloor + mm(30), -0.015],
                steel,
            );
            if (isolatedDrawerId === null)
                box(
                    root,
                    'fixed-slide-track',
                    [0.03, mm(45), CABINET_DEPTH - 0.17],
                    [
                        x + side * 0.06,
                        group.position.y + trayFloor + mm(30),
                        -0.025,
                    ],
                    steel,
                );
        }
        if (isolatedDrawerId === null) {
            const slide = new Group();
            slide.name = `telescoping-slide-${drawer.id}`;
            slide.position.y = group.position.y;
            root.add(slide);
            slides.set(drawer.id, slide);
            let slideGeometry = geometryCache.get('perforated-slide');
            if (!slideGeometry) {
                const length = CABINET_DEPTH - 0.26;
                const profile = new Shape();
                profile.moveTo(-length / 2, -mm(18));
                profile.lineTo(length / 2, -mm(18));
                profile.lineTo(length / 2, mm(18));
                profile.lineTo(-length / 2, mm(18));
                profile.closePath();
                for (
                    let z = -length / 2 + mm(24);
                    z < length / 2 - mm(24);
                    z += mm(40)
                ) {
                    const hole = new Path();
                    hole.absarc(z, 0, mm(2.2), 0, Math.PI * 2, true);
                    profile.holes.push(hole);
                }
                slideGeometry = new ExtrudeGeometry(profile, {
                    depth: 0.02,
                    bevelEnabled: false,
                    curveSegments: 4,
                });
                geometryCache.set('perforated-slide', slideGeometry);
            }
            for (const side of [-1, 1]) {
                const rail = new Mesh(slideGeometry, steel);
                rail.name = 'middle-slide-rail';
                rail.rotation.y = Math.PI / 2;
                rail.position.set(
                    side * (trayWidth / 2 + 0.04) - 0.01,
                    trayFloor + mm(30),
                    -0.025,
                );
                rail.castShadow = rail.receiveShadow = true;
                slide.add(rail);
                for (const edge of [-1, 1]) {
                    box(
                        slide,
                        'middle-slide-fold',
                        [0.04, mm(2.2), CABINET_DEPTH - 0.26],
                        [
                            side * (trayWidth / 2 + 0.04),
                            trayFloor + mm(30) + edge * mm(18),
                            -0.025,
                        ],
                        steel,
                        0.002,
                    );
                }
                for (const z of [-front + mm(50), front - mm(50)]) {
                    const mounting = disc(
                        root,
                        'slide-mounting-screw',
                        mm(3),
                        side * (trayWidth / 2 + 0.064),
                        group.position.y + trayFloor + mm(30),
                        z,
                        steel,
                    );
                    mounting.rotation.set(0, 0, Math.PI / 2);
                }
            }
        }
        const pull = new Group();
        pull.name = 'recessed-pull-assembly';
        pull.position.set(0, h * 0.17, front - 0.075);
        pull.scale.set(pullScale, pullScale, 1);
        group.add(pull);
        const handleZ = 0.049;
        box(
            pull,
            'handle-recess',
            [0.69, 0.34, 0.025],
            [0, 0, handleZ],
            handle,
            0.008,
        );
        box(
            pull,
            'pull-cavity',
            [0.62, 0.21, 0.012],
            [0, -0.025, handleZ + 0.016],
            rubber,
            0.003,
        );
        for (const side of [-1, 1]) {
            box(
                pull,
                'pull-frame-side',
                [0.026, 0.34, 0.035],
                [side * 0.332, 0, handleZ + 0.014],
                handle,
                0.004,
            );
            box(
                pull,
                'pull-frame-edge',
                [0.69, 0.026, 0.035],
                [0, side * 0.157, handleZ + 0.014],
                handle,
                0.004,
            );
        }
        box(
            pull,
            'handle-grip',
            [0.625, 0.047, 0.025],
            [0, 0.015, handleZ + 0.013],
            handle,
            0.005,
        );
        box(
            pull,
            'handle-insert-frame',
            [0.625, 0.09, 0.008],
            [0, 0.098, handleZ + 0.025],
            steel,
            0.002,
        );
        const insert = new Mesh(
            new PlaneGeometry(0.585, 0.065),
            new MeshBasicMaterial({ color: '#c8cdd0' }),
        );
        insert.name = 'handle-insert';
        insert.position.set(0, 0.098, handleZ + 0.03);
        pull.add(insert);
        const label = new Mesh(
            new PlaneGeometry(width * 0.78, Math.min(0.18, h * 0.2)),
            new MeshBasicMaterial({
                color: '#ffffff',
                transparent: true,
                opacity: 0,
                depthWrite: false,
            }),
        );
        label.name = 'drawer-label';
        label.position.set(0, -h * 0.32, front + 0.002);
        group.add(label);
        labels.set(drawer.id, label);
        const highlight = new Group();
        highlight.name = 'selected-drawer-outline';
        highlight.visible = false;
        for (const side of [-1, 1]) {
            box(
                highlight,
                'horizontal-edge',
                [width, 0.012, 0.008],
                [0, side * (h / 2 - 0.006), front + 0.006],
                accent,
                0,
            );
            box(
                highlight,
                'vertical-edge',
                [0.012, h, 0.008],
                [side * (width / 2 - 0.006), 0, front + 0.006],
                accent,
                0,
            );
        }
        group.add(highlight);
        highlights.set(drawer.id, highlight);
        if (isolatedDrawerId === null)
            box(
                root,
                index < drawers.length - 1
                    ? 'drawer-divider'
                    : 'drawer-base-reveal',
                [width, GAP * 0.55, 0.13],
                [0, layout.centers[index] - h / 2 - GAP / 2, front - 0.065],
                dark,
                0,
            );
    });

    return {
        root,
        height: layout.height,
        drawers: drawerGroups,
        slides,
        highlights,
        labels,
        textures: [grain],
        materials: [paint, fronts, inside, steel, handle, dark, rubber, accent],
    };
}

export function createProceduralCabinet(
    drawers: readonly CabinetModelDrawer[],
    color?: CabinetColor,
) {
    return createCabinetModel(drawers, null, color);
}

export type ProceduralCabinetModel = ReturnType<typeof createProceduralCabinet>;

export function setProceduralCabinetColor(
    model: ProceduralCabinetModel,
    color?: CabinetColor,
) {
    const finish = cabinetColor(color);
    model.materials.forEach((material) => {
        if (material.name === 'cabinet-body-paint')
            material.color.set(finish.paint);
        if (material.name === 'cabinet-front-paint')
            material.color.set(finish.front);
    });
}

export function createProceduralDrawer(
    drawers: readonly CabinetModelDrawer[],
    drawerId: string,
    color?: CabinetColor,
) {
    return createCabinetModel(drawers, drawerId, color);
}

export function moveCabinetDrawer(
    model: ProceduralCabinetModel,
    id: string,
    distance: number,
) {
    const drawer = model.drawers.get(id);
    if (!drawer) return;
    const travel = Math.max(0, Math.min(CABINET_DRAWER_TRAVEL, distance));
    drawer.position.z = travel;
    const slide = model.slides.get(id);
    if (slide) slide.position.z = travel / 2;
}

export function disposeProceduralCabinet(model: ProceduralCabinetModel) {
    const geometries = new Set<BufferGeometry>();
    const materials = new Set<Material>(model.materials);
    model.root.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material]) {
            materials.add(material);
        }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    model.textures.forEach((texture) => texture.dispose());
}
