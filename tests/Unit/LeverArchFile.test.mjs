import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    Box3,
    Matrix4,
    Mesh,
    PerspectiveCamera,
    Raycaster,
    Vector3,
} from 'three';
import {
    createLeverArchFile,
    createClosedLeverArchFile,
    disposeLeverArchFile,
    fitLeverArchCamera,
} from '../../resources/js/components/filing/folders/lever-arch-model.ts';
import {
    fitProceduralDrawerCamera,
    proceduralDrawerSlots,
} from '../../resources/js/components/filing/cabinets/procedural-drawer-layout.ts';
import {
    cabinetDrawerInterior,
    createProceduralDrawer,
    disposeProceduralCabinet,
} from '../../resources/js/components/filing/cabinets/procedural-cabinet-model.ts';

test('lever arch file follows reference proportions and its cover opens independently', () => {
    const file = createLeverArchFile();
    const bounds = new Box3().setFromObject(file.root).getSize(new Vector3());
    assert.ok(Math.abs(bounds.x - 0.285) < 0.004);
    assert.ok(Math.abs(bounds.y - 0.318) < 0.00001);
    assert.ok(Math.abs(bounds.z - 0.075) < 0.004);
    const closed = new Box3()
        .setFromObject(file.cover)
        .getCenter(new Vector3());
    file.cover.rotation.y = -2.65;
    file.root.updateMatrixWorld(true);
    const open = new Box3().setFromObject(file.cover).getCenter(new Vector3());
    assert.ok(open.distanceTo(closed) > 0.2);
    assert.equal(file.root.getObjectByName('front-cover-hinge'), file.cover);
    disposeLeverArchFile(file.root);
});

test('closed files can share four rigid render parts and release resources once', () => {
    const root = createClosedLeverArchFile(),
        geometries = new Set(),
        materials = new Set();
    let meshes = 0;
    root.traverse((o) => {
        if (o instanceof Mesh) {
            meshes++;
            geometries.add(o.geometry);
            materials.add(o.material);
        }
    });
    assert.equal(meshes, 4);
    const calls = [];
    for (const resource of [...geometries, ...materials])
        resource.addEventListener('dispose', () => calls.push(resource));
    disposeLeverArchFile(root);
    assert.equal(calls.length, geometries.size + materials.size);
    assert.equal(new Set(calls).size, calls.length);
});

test('sixteen files retain their physical ratios without exceeding drawer walls', () => {
    const interior = cabinetDrawerInterior(4);
    const items = Array.from({ length: 16 }, (_, i) => ({
        id: String(i),
        kind: 'lever_arch',
        label: `File ${i + 1}`,
        coverTitle: 'Assessments',
        documentCount: 0,
    }));
    const slots = proceduralDrawerSlots(interior, items);
    assert.equal(slots.length, 16);
    for (const slot of slots) {
        assert.ok(Math.abs(slot.height / slot.width - 285 / 75) < 0.00001);
        assert.ok(Math.abs(slot.depth / slot.width - 318 / 75) < 0.00001);
        assert.ok(Math.abs(slot.x) + slot.width / 2 < interior.width / 2);
        assert.ok(slot.frontZ - slot.depth >= interior.backZ);
        assert.ok(slot.y - slot.height / 2 > interior.floorY);
    }
});

test('all sixteen upward spine cards have a clear sight line over the drawer front', () => {
    const drawers = [
        { id: '1', label: 'Drawer 1' },
        { id: '2', label: 'Drawer 2' },
        { id: '3', label: 'Drawer 3' },
        { id: '4', label: 'Drawer 4' },
    ];
    const model = createProceduralDrawer(drawers, '1');
    const meshes = [];
    model.root.updateMatrixWorld(true);
    model.root.traverseVisible((o) => {
        if (o instanceof Mesh) meshes.push(o);
    });
    const items = Array.from({ length: 16 }, (_, i) => ({
        id: String(i),
        kind: 'lever_arch',
        label: `File ${i + 1}`,
        coverTitle: 'Assessments',
        documentCount: 0,
    }));
    const slots = proceduralDrawerSlots(cabinetDrawerInterior(4), items);
    for (const size of [
        { width: 1152, height: 720 },
        { width: 374, height: 615 },
    ]) {
        const camera = new PerspectiveCamera();
        fitProceduralDrawerCamera(
            camera,
            new Box3().setFromObject(model.drawers.get('1')),
            size,
        );
        for (const slot of slots) {
            const matrix = new Matrix4()
                .makeRotationY(Math.PI / 2)
                .multiply(new Matrix4().makeRotationZ(-Math.PI / 2))
                .scale(new Vector3().setScalar(slot.width / 0.075))
                .setPosition(slot.x, slot.y, slot.frontZ - slot.depth / 2);
            for (const y of [0.03 - 0.087, 0.03 + 0.087])
                for (const z of [-0.027, 0.027]) {
                    const point = new Vector3(-0.1441, y, z).applyMatrix4(
                        matrix,
                    );
                    const direction = point.clone().sub(camera.position),
                        distance = direction.length();
                    const ray = new Raycaster(
                        camera.position,
                        direction.normalize(),
                        0,
                        distance - 0.003,
                    );
                    assert.equal(
                        ray.intersectObjects(meshes, false).length,
                        0,
                        `File ${slot.item.id} label is blocked at ${size.width}px`,
                    );
                }
        }
    }
    disposeProceduralCabinet(model);
});

test('closed and open lever arch previews stay completely framed at desktop and mobile sizes', () => {
    const file = createLeverArchFile();
    for (const size of [
        { width: 652, height: 380 },
        { width: 294, height: 380 },
    ])
        for (const open of [false, true]) {
            file.cover.rotation.y = open ? -2.9 : 0;
            file.root.rotation.set(
                ((open ? -28 : 8) * Math.PI) / 180,
                ((open ? 0 : 32) * Math.PI) / 180,
                0,
            );
            const camera = new PerspectiveCamera(
                25,
                size.width / size.height,
                0.01,
                10,
            );
            fitLeverArchCamera(camera, file.root, size);
            const bounds = new Box3().setFromObject(file.root);
            for (const x of [bounds.min.x, bounds.max.x])
                for (const y of [bounds.min.y, bounds.max.y])
                    for (const z of [bounds.min.z, bounds.max.z]) {
                        const projected = new Vector3(x, y, z).project(camera);
                        assert.ok(
                            Math.abs(projected.x) < 0.95 &&
                                Math.abs(projected.y) < 0.95,
                            `${open ? 'Open' : 'Closed'} preview clipped at ${size.width}px`,
                        );
                    }
        }
    disposeLeverArchFile(file.root);
});
