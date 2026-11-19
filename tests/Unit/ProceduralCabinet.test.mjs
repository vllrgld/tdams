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
    CABINET_DEPTH,
    CABINET_DIMENSIONS_MM,
    CABINET_DRAWER_TRAVEL,
    CABINET_HEIGHT,
    CABINET_WIDTH,
    cabinetModelLayout,
    cabinetDrawerEase,
    cabinetDrawerInterior,
    createProceduralCabinet,
    createProceduralDrawer,
    disposeProceduralCabinet,
    moveCabinetDrawer,
    setProceduralCabinetColor,
} from '../../resources/js/components/filing/cabinets/procedural-cabinet-model.ts';
import {
    fitProceduralDrawerCamera,
    createDrawerFolderMask,
    proceduralDrawerSlots,
} from '../../resources/js/components/filing/cabinets/procedural-drawer-layout.ts';
import {
    cabinetRotationTarget,
    fitProceduralCabinetBounds,
    fitProceduralCabinetCamera,
} from '../../resources/js/components/filing/cabinets/procedural-cabinet-layout.ts';
import {
    acquireProceduralCabinet,
    releaseProceduralCabinet,
    batchProceduralCabinet,
} from '../../resources/js/components/filing/cabinets/procedural-cabinet-rendering.ts';
import { createCabinetStartupQueue } from '../../resources/js/components/filing/cabinets/cabinet-startup.ts';
import { createCabinetViewCache } from '../../resources/js/components/filing/cabinets/cabinet-view-cache.ts';

void test('recent cabinets stay resident when scrolled away and are reused on return', () => {
    const cache = createCabinetViewCache(2);
    const changes = [];
    const first = cache.register((retained) => changes.push(retained));
    const second = cache.register(() => {});
    first.update(true, true);
    first.update(false, false);
    second.update(true, true);
    first.update(true, true);
    assert.deepEqual(changes, [true]);
    first.release();
    second.release();
    first.update(true, true);
    assert.deepEqual(changes, [true]);
});

void test('the cabinet cache evicts the least recently viewed distant cabinet and protects visible ones', () => {
    const cache = createCabinetViewCache(2);
    const state = new Map();
    const register = (id) => cache.register((retained) => state.set(id, retained));
    const first = register('first');
    const second = register('second');
    const third = register('third');
    first.update(true, true);
    first.update(false, false);
    second.update(true, true);
    second.update(false, false);
    first.update(true, true);
    first.update(false, false);
    third.update(false, true);
    assert.equal(state.get('first'), true);
    assert.equal(state.get('second'), false);
    assert.equal(state.get('third'), true);
    first.update(true, true);
    third.update(true, true);
    second.update(true, true);
    assert.equal(state.get('first'), true);
    assert.equal(state.get('second'), true);
    assert.equal(state.get('third'), true);
    second.update(false, false);
    assert.equal(state.get('second'), false);
    [first, second, third].forEach((entry) => entry.release());
});

void test('nearby preload waits for space without repeatedly evicting neighboring cabinets', () => {
    const cache = createCabinetViewCache(1);
    const events = [];
    const first = cache.register((retained) => events.push(['first', retained]));
    const second = cache.register((retained) => events.push(['second', retained]));
    first.update(false, true);
    second.update(false, true);
    second.update(false, true);
    assert.deepEqual(events, [['first', true]]);
    second.update(true, true);
    assert.deepEqual(events.slice(-2), [['second', true], ['first', false]]);
    first.update(false, false);
    second.release();
    assert.equal(events.filter(([id, retained]) => id === 'first' && retained).length, 1);
    first.release();
});

void test('visible cabinets start before queued offscreen preloads', () => {
    const frames = [];
    const enqueue = createCabinetStartupQueue((frame) => (frames.push(frame), frames.length), () => {});
    const started = [];
    enqueue((ready) => { started.push('preload'); ready(); });
    enqueue((ready) => { started.push('visible'); ready(); }, 1);
    frames.shift()();
    assert.deepEqual(started, ['visible']);
    frames.shift()();
    assert.deepEqual(started, ['visible', 'preload']);
});

const drawers = (count) =>
    Array.from({ length: count }, (_, index) => ({
        id: `drawer-${index}`,
        label: `Drawer ${index + 1}`,
    }));

void test('cabinet finishes stay independent with shared geometry and match the zoomed drawer', async () => {
    const grey = acquireProceduralCabinet(drawers(4));
    const ivory = acquireProceduralCabinet(drawers(4));
    const zoomed = createProceduralDrawer(drawers(4), 'drawer-0', 'warm_ivory');
    const material = (model, name) => model.materials.find((part) => part.name === name);
    const finish = (model) => ['cabinet-body-paint', 'cabinet-front-paint'].map((name) => material(model, name).color.getHexString());
    const originalOtherMaterials = ivory.materials.filter((part) => !part.name.startsWith('cabinet-')).map((part) => part.color.getHexString());
    const meshes = (root) => {const parts=[];root.traverse((part)=>{if(part instanceof Mesh)parts.push(part);});return parts;};
    const geometry = meshes(grey.root).map((part) => part.geometry);

    setProceduralCabinetColor(ivory, 'warm_ivory');

    assert.deepEqual(finish(ivory), ['c9bfa6', 'd8ceb7']);
    assert.deepEqual(finish(zoomed), finish(ivory));
    assert.deepEqual(finish(grey), ['acb3b7', 'b4bbbf']);
    assert.deepEqual(ivory.materials.filter((part) => !part.name.startsWith('cabinet-')).map((part) => part.color.getHexString()), originalOtherMaterials);
    meshes(ivory.root).forEach((part, index) => assert.equal(part.geometry, geometry[index]));

    setProceduralCabinetColor(ivory, 'steel_grey');
    assert.deepEqual(finish(ivory), finish(grey));
    releaseProceduralCabinet(grey);
    releaseProceduralCabinet(ivory);
    disposeProceduralCabinet(zoomed);
    await Promise.resolve();
});

void test('matching cabinets share geometry while labels, drawer movement and materials remain independent', async () => {
    const first = acquireProceduralCabinet(drawers(4));
    const second = acquireProceduralCabinet(
        drawers(4).map((drawer) => ({ ...drawer, id: `other-${drawer.id}` })),
    );
    const different = acquireProceduralCabinet(drawers(2));
    const plain = batchProceduralCabinet(createProceduralCabinet(drawers(4)));
    const meshes = (root) => {
        const parts = [];
        root.traverse((part) => {
            if (part instanceof Mesh) parts.push(part);
        });
        return parts;
    };
    const a = meshes(first.root),
        b = meshes(second.root),
        expected = meshes(plain.root);
    assert.equal(a.length, expected.length);
    for (let index = 0; index < a.length; index++) {
        assert.equal(a[index].geometry, b[index].geometry);
        assert.notEqual(a[index].material, b[index].material);
        assert.deepEqual(
            a[index].geometry.attributes.position.array,
            expected[index].geometry.attributes.position.array,
        );
        assert.deepEqual(
            a[index].geometry.index?.array,
            expected[index].geometry.index?.array,
        );
    }
    const left = first.drawers.get('drawer-0');
    const right = second.drawers.get('other-drawer-0');
    assert.equal(right.userData.drawerId, 'other-drawer-0');
    moveCabinetDrawer(first, 'drawer-0', CABINET_DRAWER_TRAVEL);
    assert.equal(left.position.z, CABINET_DRAWER_TRAVEL);
    assert.equal(right.position.z, 0);
    first.labels.get('drawer-0').material.color.set('#ff0000');
    assert.equal(
        second.labels.get('other-drawer-0').material.color.getHex(),
        0xffffff,
    );
    assert.notEqual(
        different.labels.get('drawer-0').geometry,
        first.labels.get('drawer-0').geometry,
    );
    const geometries = new Set(a.map((mesh) => mesh.geometry));
    const disposed = new Map();
    geometries.forEach((geometry) =>
        geometry.addEventListener('dispose', () =>
            disposed.set(geometry, (disposed.get(geometry) ?? 0) + 1),
        ),
    );
    releaseProceduralCabinet(first);
    await Promise.resolve();
    assert.equal(disposed.size, 0);
    releaseProceduralCabinet(second);
    releaseProceduralCabinet(second);
    await Promise.resolve();
    assert.equal(disposed.size, geometries.size);
    disposed.forEach((count) => assert.equal(count, 1));
    releaseProceduralCabinet(different);
    disposeProceduralCabinet(plain);
    await Promise.resolve();
});

void test('an immediate effect remount reuses the template and the final release clears it', async () => {
    const first = acquireProceduralCabinet(drawers(4));
    const geometry = first.labels.get('drawer-0').geometry;
    let disposed = 0;
    geometry.addEventListener('dispose', () => disposed++);
    releaseProceduralCabinet(first);
    const remounted = acquireProceduralCabinet(drawers(4));
    await Promise.resolve();
    assert.equal(remounted.labels.get('drawer-0').geometry, geometry);
    assert.equal(disposed, 0);
    releaseProceduralCabinet(remounted);
    await Promise.resolve();
    assert.equal(disposed, 1);
    const fresh = acquireProceduralCabinet(drawers(4));
    assert.notEqual(fresh.labels.get('drawer-0').geometry, geometry);
    releaseProceduralCabinet(fresh);
    await Promise.resolve();
});

void test('cabinet startup waits for the preceding model and then yields a frame', () => {
    const frames = new Map();
    let sequence = 0;
    const enqueue = createCabinetStartupQueue(
        (callback) => {
            frames.set(++sequence, callback);
            return sequence;
        },
        (id) => frames.delete(id),
    );
    const tick = () => {
        const [id, callback] = frames.entries().next().value;
        frames.delete(id);
        callback();
    };
    const started = [];
    let ready;
    const cancelFirst = enqueue((complete) => {
        started.push('first');
        ready = complete;
    });
    const cancelSecond = enqueue(() => started.push('second'));
    tick();
    assert.deepEqual(started, ['first']);
    assert.equal(frames.size, 0);
    ready();
    ready();
    assert.deepEqual(started, ['first']);
    assert.equal(frames.size, 1);
    tick();
    assert.deepEqual(started, ['first', 'second']);
    cancelFirst();
    cancelSecond();
    assert.equal(frames.size, 0);
});

void test('cabinet startup cancels queued or active work without blocking later cabinets', () => {
    const frames = new Map();
    let sequence = 0;
    const enqueue = createCabinetStartupQueue(
        (callback) => {
            frames.set(++sequence, callback);
            return sequence;
        },
        (id) => frames.delete(id),
    );
    const tick = () => {
        const [id, callback] = frames.entries().next().value;
        frames.delete(id);
        callback();
    };
    const started = [];
    let staleReady;
    const cancelSkipped = enqueue(() => started.push('skipped'));
    cancelSkipped();
    assert.equal(frames.size, 0);
    const cancelFirst = enqueue((ready) => {
        started.push('first');
        staleReady = ready;
    });
    const cancelSecond = enqueue(() => started.push('second'));
    const cancelThird = enqueue(() => started.push('third'));
    tick();
    cancelSecond();
    cancelFirst();
    tick();
    staleReady();
    assert.deepEqual(started, ['first', 'third']);
    assert.equal(frames.size, 0);
    cancelThird();
});

void test('batching reduces meshes while preserving geometry, drawer pivots, labels, and selection', () => {
    const plain = createProceduralCabinet(drawers(4));
    const model = createProceduralCabinet(drawers(4));
    const stats = (root) => {
        let meshes = 0,
            triangles = 0;
        root.traverseVisible((object) => {
            if (!(object instanceof Mesh)) return;
            meshes++;
            triangles +=
                (object.geometry.index?.count ??
                    object.geometry.attributes.position.count) / 3;
        });
        return { meshes, triangles };
    };
    const before = stats(model.root);
    const label = model.labels.get('drawer-0');
    const outline = model.highlights.get('drawer-0');
    batchProceduralCabinet(model);
    const after = stats(model.root);
    assert.ok(after.meshes < before.meshes * 0.4);
    assert.equal(after.triangles, before.triangles);
    assert.equal(model.labels.get('drawer-0'), label);
    assert.equal(model.highlights.get('drawer-0'), outline);
    for (const travel of [
        0,
        CABINET_DRAWER_TRAVEL * 0.14,
        CABINET_DRAWER_TRAVEL,
    ]) {
        moveCabinetDrawer(plain, 'drawer-0', travel);
        moveCabinetDrawer(model, 'drawer-0', travel);
        const expected = new Box3().setFromObject(plain.root);
        const actual = new Box3().setFromObject(model.root);
        assert.ok(expected.min.distanceTo(actual.min) < 1e-6);
        assert.ok(expected.max.distanceTo(actual.max) < 1e-6);
    }
    const selected = model.drawers.get('drawer-0');
    const ray = new Raycaster(
        new Vector3(0, selected.position.y - 0.3, CABINET_DEPTH * 3),
        new Vector3(0, 0, -1),
    );
    let hit = ray.intersectObject(model.root, true)[0]?.object;
    while (hit && !hit.userData.drawerId) hit = hit.parent;
    assert.equal(hit?.userData.drawerId, 'drawer-0');
    assert.deepEqual(stats(batchProceduralCabinet(model).root), after);
    disposeProceduralCabinet(plain);
    disposeProceduralCabinet(model);
});

void test('batching releases replaced geometry and disposes every retained resource once', () => {
    const model = createProceduralDrawer(drawers(4), 'drawer-0');
    const watched = new Set();
    const disposed = new Map();
    const watch = (resource) => {
        if (watched.has(resource)) return;
        watched.add(resource);
        resource.addEventListener('dispose', () =>
            disposed.set(resource, (disposed.get(resource) ?? 0) + 1),
        );
    };
    const watchModel = () => {
        [...model.materials, ...model.textures].forEach(watch);
        model.root.traverse((object) => {
            if (!(object instanceof Mesh)) return;
            watch(object.geometry);
            (Array.isArray(object.material)
                ? object.material
                : [object.material]
            ).forEach(watch);
        });
    };
    watchModel();
    batchProceduralCabinet(model);
    watchModel();
    disposeProceduralCabinet(model);
    assert.equal(disposed.size, watched.size);
    disposed.forEach((count) => assert.equal(count, 1));
});

void test('cabinet uprights stay vertical and the whole rotating cabinet fits with a drawer open', () => {
    const model = createProceduralCabinet(drawers(4));
    const camera = new PerspectiveCamera(20, 1, 0.1, 80);
    const dimensions = {
        height: CABINET_HEIGHT,
        width: CABINET_WIDTH,
        depth: CABINET_DEPTH,
        drawerTravel: CABINET_DRAWER_TRAVEL,
    };
    for (const size of [
        { width: 352, height: 448 },
        { width: 290, height: 448 },
        { width: 680, height: 480 },
    ]) {
        fitProceduralCabinetCamera(camera, dimensions, size);
        for (let step = 0; step < 24; step++) {
            model.root.rotation.y = (step * Math.PI) / 12;
            for (const drawerId of [null, 'drawer-0', 'drawer-3']) {
                for (const id of model.drawers.keys())
                    moveCabinetDrawer(
                        model,
                        id,
                        id === drawerId ? CABINET_DRAWER_TRAVEL : 0,
                    );
                model.root.updateMatrixWorld(true);
                fitProceduralCabinetBounds(
                    camera,
                    new Box3().setFromObject(model.root),
                );
                model.root.traverseVisible((object) => {
                    if (!(object instanceof Mesh)) return;
                    object.geometry.computeBoundingBox();
                    const bounds = object.geometry.boundingBox;
                    for (const x of [bounds.min.x, bounds.max.x])
                        for (const z of [bounds.min.z, bounds.max.z]) {
                            const bottom = object
                                .localToWorld(new Vector3(x, bounds.min.y, z))
                                .project(camera);
                            const top = object
                                .localToWorld(new Vector3(x, bounds.max.y, z))
                                .project(camera);
                            if (
                                [
                                    'left-panel',
                                    'right-panel',
                                    'back-panel',
                                    'drawer-front',
                                ].includes(object.name)
                            ) {
                                assert.ok(
                                    Math.abs(top.x - bottom.x) < 1e-10,
                                    'steel uprights must remain vertical',
                                );
                            }
                            for (const point of [bottom, top]) {
                                assert.ok(
                                    Math.abs(point.x) < 0.98 &&
                                        Math.abs(point.y) < 0.98,
                                    JSON.stringify({
                                        size,
                                        step,
                                        drawerId,
                                        point,
                                    }),
                                );
                            }
                        }
                });
            }
        }
    }
    disposeProceduralCabinet(model);
});

void test('resetting after repeated turns always takes the shortest arc', () => {
    for (const turns of [-37, -12, -1, 0, 1, 11, 37]) {
        const current = (turns * Math.PI) / 6;
        const target = cabinetRotationTarget(current, 0);
        assert.ok(Math.abs(target - current) <= Math.PI + 1e-10);
        assert.ok(Math.abs(Math.sin(target)) < 1e-10);
        assert.ok(Math.cos(target) > 0.999999);
    }
    const current = (11 * Math.PI) / 6;
    assert.ok(cabinetRotationTarget(current, 0) > current);
    assert.ok(cabinetRotationTarget(current, (12 * Math.PI) / 6) > current);
    assert.ok(cabinetRotationTarget(current, (10 * Math.PI) / 6) < current);
});

void test('cabinet body follows the 1320 by 460 by 620 millimetre blueprint', () => {
    const model = createProceduralCabinet(drawers(4));
    const top = new Box3().setFromObject(
        model.root.getObjectByName('top-panel'),
    );
    const topSize = top.getSize(new Vector3());
    const millimetresPerUnit = 460 / CABINET_WIDTH;

    assert.deepEqual(CABINET_DIMENSIONS_MM, {
        height: 1320,
        width: 460,
        depth: 620,
    });
    assert.ok(Math.abs(model.height * millimetresPerUnit - 1320) < 1e-8);
    assert.equal(model.height, CABINET_HEIGHT);
    assert.ok(Math.abs(topSize.x * millimetresPerUnit - 460) < 0.001);
    assert.ok(Math.abs(topSize.z * millimetresPerUnit - 620) < 0.001);
    assert.ok(Math.abs(top.max.y - CABINET_HEIGHT) < 1e-6);
    assert.ok(Math.abs(topSize.z - CABINET_DEPTH) < 1e-6);
    assert.ok(
        Math.abs(CABINET_DRAWER_TRAVEL * millimetresPerUnit - 480) < 1e-8,
    );

    disposeProceduralCabinet(model);
});

void test('cabinet geometry fits variable drawer counts without overlapping drawer fronts', () => {
    for (const count of [0, 1, 2, 4, 8, 16]) {
        const model = createProceduralCabinet(drawers(count));
        const layout = cabinetModelLayout(count);
        const bounds = new Box3().setFromObject(model.root);
        assert.equal(model.drawers.size, count);
        assert.ok(
            Number.isFinite(bounds.min.y) && Number.isFinite(bounds.max.y),
        );
        assert.ok(layout.drawerHeight > 0);
        assert.equal(model.height, CABINET_HEIGHT);
        const fronts = [...model.drawers.values()].map((drawer) =>
            new Box3().setFromObject(drawer.getObjectByName('drawer-front')),
        );
        for (let index = 1; index < fronts.length; index++) {
            assert.ok(fronts[index].max.y < fronts[index - 1].min.y);
        }
        for (const front of fronts) {
            assert.ok(front.min.y > 0);
            assert.ok(front.max.y < model.height);
        }
        disposeProceduralCabinet(model);
    }
});

void test('opening a drawer carries its tray, handle, and label while the cabinet stays fixed', () => {
    const model = createProceduralCabinet(drawers(4));
    const selected = model.drawers.get('drawer-1');
    const movingParts = [
        'drawer-front',
        'tray-floor',
        'tray-back',
        'handle-grip',
        'drawer-label',
    ];
    const before = movingParts.map((name) =>
        selected.getObjectByName(name).getWorldPosition(new Vector3()),
    );
    const wall = model.root.getObjectByName('left-panel');
    const wallBefore = wall.getWorldPosition(new Vector3());
    moveCabinetDrawer(model, 'drawer-1', CABINET_DRAWER_TRAVEL);
    model.root.updateMatrixWorld(true);

    movingParts.forEach((name, index) => {
        const after = selected
            .getObjectByName(name)
            .getWorldPosition(new Vector3());
        assert.ok(
            Math.abs(after.z - before[index].z - CABINET_DRAWER_TRAVEL) < 1e-8,
        );
        assert.equal(after.x, before[index].x);
        assert.equal(after.y, before[index].y);
    });
    assert.deepEqual(
        wall.getWorldPosition(new Vector3()).toArray(),
        wallBefore.toArray(),
    );
    assert.equal(model.drawers.get('drawer-0').position.z, 0);
    assert.equal(
        model.slides.get('drawer-1').position.z,
        CABINET_DRAWER_TRAVEL / 2,
    );
    assert.equal(model.slides.get('drawer-0').position.z, 0);
    moveCabinetDrawer(model, 'drawer-1', CABINET_DRAWER_TRAVEL * 2);
    assert.equal(selected.position.z, CABINET_DRAWER_TRAVEL);
    moveCabinetDrawer(model, 'drawer-1', -1);
    assert.equal(selected.position.z, 0);
    assert.equal(model.slides.get('drawer-1').position.z, 0);
    disposeProceduralCabinet(model);
});

void test('the bottom drawer has a visible recessed gap above the fixed cabinet base', () => {
    for (const count of [1, 4, 8, 16]) {
        const model = createProceduralCabinet(drawers(count));
        const drawerId = `drawer-${count - 1}`;
        const bottomDrawer = model.drawers.get(drawerId);
        model.root.updateMatrixWorld(true);
        const fascia = new Box3().setFromObject(
            bottomDrawer.getObjectByName('drawer-front'),
        );
        const base = new Box3().setFromObject(
            model.root.getObjectByName('base'),
        );
        const seamY = (fascia.min.y + base.max.y) / 2;

        for (const x of [fascia.min.x * 0.9, 0, fascia.max.x * 0.9]) {
            const ray = new Raycaster(
                new Vector3(x, seamY, CABINET_DEPTH),
                new Vector3(0, 0, -1),
            );
            const hit = ray.intersectObject(model.root, true)[0]?.object;
            assert.equal(hit?.name, 'drawer-base-reveal');
            assert.ok(hit.material.color.getHex() < 0x808080);
            assert.ok(
                new Box3().setFromObject(hit).max.z <= fascia.max.z + 0.002,
            );
        }

        const seam = model.root.getObjectByName('drawer-base-reveal');
        const seamBefore = seam.getWorldPosition(new Vector3());
        moveCabinetDrawer(model, drawerId, CABINET_DRAWER_TRAVEL);
        assert.deepEqual(
            seam.getWorldPosition(new Vector3()).toArray(),
            seamBefore.toArray(),
        );
        disposeProceduralCabinet(model);
    }
});

void test('the recessed pull remains visible through an opening in the drawer front', () => {
    const model = createProceduralCabinet(drawers(4));
    const drawer = model.drawers.get('drawer-0');
    const front = drawer.getObjectByName('drawer-front');
    const cavity = drawer.getObjectByName('pull-cavity');
    model.root.updateMatrixWorld(true);
    const cavityCenter = cavity.getWorldPosition(new Vector3());
    const frontBounds = new Box3().setFromObject(front);
    const ray = new Raycaster(
        cavityCenter.clone().add(new Vector3(0, 0, CABINET_DEPTH)),
        new Vector3(0, 0, -1),
    );
    const fasciaRay = new Raycaster(
        new Vector3(
            frontBounds.max.x * 0.9,
            cavityCenter.y,
            cavityCenter.z + CABINET_DEPTH,
        ),
        new Vector3(0, 0, -1),
    );

    assert.ok(cavityCenter.z < frontBounds.max.z);
    assert.equal(ray.intersectObject(front, true).length, 0);
    assert.equal(ray.intersectObject(drawer, true)[0]?.object, cavity);
    assert.ok(fasciaRay.intersectObject(front, true).length > 0);

    disposeProceduralCabinet(model);
});

void test('drawer front folds join the fascia flush without a see-through seam', () => {
    for (const count of [1, 4, 8, 16]) {
        const model = createProceduralDrawer(drawers(count), 'drawer-0');
        const drawer = model.drawers.get('drawer-0');
        const fascia = new Box3().setFromObject(
            drawer.getObjectByName('drawer-front'),
        );
        const top = new Box3().setFromObject(
            drawer.getObjectByName('front-return-top'),
        );
        const bottom = new Box3().setFromObject(
            drawer.getObjectByName('front-return-bottom'),
        );
        assert.ok(
            fascia.intersectsBox(top),
            'top fold must meet the front panel',
        );
        assert.ok(
            fascia.intersectsBox(bottom),
            'bottom fold must meet the front panel',
        );
        assert.ok(Math.abs(top.max.y - fascia.max.y) < 0.002);
        assert.ok(Math.abs(bottom.min.y - fascia.min.y) < 0.002);
        for (const x of [-0.6, 0, 0.6]) {
            const ray = new Raycaster(
                new Vector3(x, fascia.max.y + 1, fascia.min.z - 0.002),
                new Vector3(0, -1, 0),
            );
            assert.equal(
                ray.intersectObject(drawer, true)[0]?.object.name,
                'front-return-top',
            );
        }
        disposeProceduralCabinet(model);
    }
});

void test('unmounting a cabinet disposes every unique geometry and material once', () => {
    const model = createProceduralCabinet(drawers(4));
    const resources = new Set([...model.materials, ...model.textures]);
    model.root.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        resources.add(object.geometry);
        (Array.isArray(object.material)
            ? object.material
            : [object.material]
        ).forEach((material) => resources.add(material));
    });
    const disposed = new Map();
    resources.forEach((resource) =>
        resource.addEventListener('dispose', () =>
            disposed.set(resource, (disposed.get(resource) ?? 0) + 1),
        ),
    );

    disposeProceduralCabinet(model);

    assert.equal(disposed.size, resources.size);
    disposed.forEach((count) => assert.equal(count, 1));
});

void test('drawer movement eases to rest at both stops without overshooting', () => {
    assert.equal(cabinetDrawerEase(-1), 0);
    assert.equal(cabinetDrawerEase(2), 1);
    assert.equal(cabinetDrawerEase(0.5), 0.5);
    let previous = 0;
    for (let frame = 0; frame <= 100; frame++) {
        const position = cabinetDrawerEase(frame / 100);
        assert.ok(position >= previous && position <= 1);
        previous = position;
    }
    assert.ok(cabinetDrawerEase(0.01) < 0.0001);
    assert.ok(1 - cabinetDrawerEase(0.99) < 0.0001);
});

void test('an empty cabinet releases its paint texture and unused hardware materials', () => {
    const model = createProceduralCabinet([]);
    const resources = [...model.materials, ...model.textures];
    const disposed = new Set();
    resources.forEach((resource) =>
        resource.addEventListener('dispose', () => disposed.add(resource)),
    );
    disposeProceduralCabinet(model);
    assert.equal(disposed.size, resources.length);
});

void test('drawer storage is clear of the inner divider while retaining its rear wall', () => {
    const model = createProceduralCabinet(drawers(4));
    for (const drawer of model.drawers.values()) {
        assert.equal(drawer.getObjectByName('document-divider'), undefined);
        assert.equal(drawer.getObjectByName('divider-fold'), undefined);
        assert.equal(drawer.getObjectByName('divider-runner'), undefined);
        assert.ok(drawer.getObjectByName('tray-back'));
    }
    disposeProceduralCabinet(model);
});

void test('the drawer closeup isolates and centers the selected drawer without invisible cabinet hit targets', () => {
    const model = createProceduralDrawer(drawers(4), 'drawer-2');
    const selected = model.drawers.get('drawer-2');
    assert.deepEqual(selected.position.toArray(), [0, 0, 0]);
    assert.deepEqual(model.root.children, [selected]);
    assert.deepEqual([...model.drawers.keys()], ['drawer-2']);
    assert.deepEqual([...model.labels.keys()], ['drawer-2']);
    assert.equal(model.slides.size, 0);
    model.root.updateMatrixWorld(true);
    const ray = new Raycaster(
        new Vector3(0, CABINET_HEIGHT - 0.5, CABINET_DEPTH * 2),
        new Vector3(0, 0, -1),
    );
    assert.equal(ray.intersectObject(model.root, true).length, 0);
    const resources = new Set();
    model.root.traverse((part) => {
        if (part instanceof Mesh) resources.add(part.geometry);
    });
    let disposed = 0;
    resources.forEach((geometry) =>
        geometry.addEventListener('dispose', () => disposed++),
    );
    disposeProceduralCabinet(model);
    assert.equal(disposed, resources.size);
    assert.throws(
        () => createProceduralDrawer(drawers(4), 'missing'),
        /not in this cabinet/,
    );
});

void test('an isolated drawer preserves the complete cabinet drawer geometry and materials', () => {
    for (const count of [1, 4, 8]) {
        const data = drawers(count);
        const id = data.at(-1).id;
        const cabinet = createProceduralCabinet(data);
        const isolated = createProceduralDrawer(data, id);
        const meshes = (group) => {
            group.updateWorldMatrix(true, true);
            const inverse = group.matrixWorld.clone().invert();
            const parts = [];
            group.traverse((part) => {
                if (!(part instanceof Mesh)) return;
                parts.push({
                    name: part.name,
                    matrix: new Matrix4()
                        .multiplyMatrices(inverse, part.matrixWorld)
                        .toArray(),
                    geometry: Object.fromEntries(
                        Object.entries(part.geometry.attributes).map(
                            ([key, attribute]) => [key, attribute.array],
                        ),
                    ),
                    index: part.geometry.index?.array,
                    castShadow: part.castShadow,
                    receiveShadow: part.receiveShadow,
                    visible: part.visible,
                    material: [part.material].flat().map((material) => ({
                        type: material.type,
                        color: material.color?.getHex(),
                        roughness: material.roughness,
                        metalness: material.metalness,
                        opacity: material.opacity,
                        transparent: material.transparent,
                        depthWrite: material.depthWrite,
                    })),
                });
            });
            return parts;
        };
        const actual = meshes(isolated.drawers.get(id));
        const expected = meshes(cabinet.drawers.get(id));
        // World translations can introduce round-off when the cabinet drawer sits above the origin.
        actual.forEach((part, index) => {
            part.matrix.forEach((value, axis) =>
                assert.ok(
                    Math.abs(value - expected[index].matrix[axis]) < 1e-10,
                ),
            );
            expected[index].matrix = part.matrix;
        });
        assert.deepEqual(actual, expected);
        disposeProceduralCabinet(cabinet);
        disposeProceduralCabinet(isolated);
    }
});

void test('sixteen books or folders fit the clear drawer depth without overlapping their slots', () => {
    for (const count of [1, 2, 4, 8, 16]) {
        const interior = cabinetDrawerInterior(count);
        for (const kind of ['book', 'folder']) {
            const items = Array.from({ length: 16 }, (_, index) => ({
                id: `item-${index}`,
                kind,
                label: `Item ${index}`,
                coverTitle: 'Archive',
                documentCount: index,
            }));
            const slots = proceduralDrawerSlots(interior, items);
            assert.equal(slots.length, 16);
            assert.deepEqual(
                slots.map((slot) => slot.item.id),
                items.map((item) => item.id),
            );
            for (const slot of slots) {
                const pose = new Matrix4()
                    .makeRotationX(slot.rotationX)
                    .setPosition(slot.x, slot.y, slot.frontZ);
                const bounds = new Box3(
                    new Vector3(-slot.width / 2, -slot.height / 2, -slot.depth),
                    new Vector3(
                        slot.width / 2,
                        slot.height * (kind === 'folder' ? 0.56 : 0.5),
                        0,
                    ),
                ).applyMatrix4(pose);
                assert.ok(bounds.min.x > -interior.width / 2);
                assert.ok(bounds.max.x < interior.width / 2);
                assert.ok(bounds.max.z <= interior.frontZ);
                assert.ok(bounds.min.z >= interior.backZ);
                assert.ok(bounds.min.y > interior.floorY);
                assert.ok(bounds.max.y <= interior.topY + 0.02);
            }
            for (let a = 0; a < slots.length; a++) {
                for (let b = a + 1; b < slots.length; b++) {
                    const first = slots[a];
                    const second = slots[b];
                    const separateX =
                        Math.abs(first.x - second.x) >=
                        (first.width + second.width) / 2;
                    const normalDistance = Math.abs(
                        -(first.y - second.y) * Math.sin(first.rotationX) +
                            (first.frontZ - second.frontZ) *
                                Math.cos(first.rotationX),
                    );
                    const separateZ =
                        normalDistance >= Math.max(first.depth, second.depth);
                    assert.ok(
                        separateX || separateZ,
                        `${kind} slots ${a} and ${b} overlap`,
                    );
                }
            }
        }
    }
    assert.deepEqual(proceduralDrawerSlots(cabinetDrawerInterior(4), []), []);
});

void test('the front folder label remains exposed above the drawer face in the closeup', () => {
    const model = createProceduralDrawer(drawers(4), 'drawer-0');
    const [slot] = proceduralDrawerSlots(cabinetDrawerInterior(4), [
        {
            id: 'first',
            kind: 'folder',
            label: 'Folder 1',
            coverTitle: 'Archive',
            documentCount: 0,
        },
    ]);
    const bounds = new Box3().setFromObject(model.drawers.get('drawer-0'));
    const camera = new PerspectiveCamera(50, 1, 0.1, 50);
    fitProceduralDrawerCamera(camera, bounds, { width: 1152, height: 640 });
    const label = new Vector3(
        -slot.width * 0.24,
        slot.height * 0.52,
        -slot.depth + 0.00025,
    )
        .applyAxisAngle(new Vector3(1, 0, 0), slot.rotationX)
        .add(new Vector3(slot.x, slot.y, slot.frontZ));
    const normal = new Vector3(0, 0, 1).applyAxisAngle(
        new Vector3(1, 0, 0),
        slot.rotationX,
    );
    const towardCamera = camera.position.clone().sub(label).normalize();
    assert.ok(
        normal.dot(towardCamera) > towardCamera.z + 0.1,
        'folder labels should face the camera more directly',
    );
    const ray = new Raycaster(
        camera.position,
        label.clone().sub(camera.position).normalize(),
        0,
        camera.position.distanceTo(label) - 1e-6,
    );
    assert.equal(ray.intersectObject(model.root, true).length, 0);
    disposeProceduralCabinet(model);
});

void test('folder masks follow the raised left tab without clearing a strip above the right shoulder', () => {
    const width = 1.5;
    const height = 1;
    const geometry = createDrawerFolderMask(width, height, 0.018);
    const mask = new Mesh(geometry);
    mask.updateMatrixWorld(true);
    const hits = (x, y) =>
        new Raycaster(
            new Vector3(x, y, 1),
            new Vector3(0, 0, -1),
        ).intersectObject(mask);
    assert.ok(
        hits(-width * 0.3, height * 0.53).length > 0,
        'raised label tab remains selectable',
    );
    assert.equal(
        hits(width * 0.3, height * 0.53).length,
        0,
        'empty right shoulder must not punch through the drawer',
    );
    assert.ok(
        hits(width * 0.3, height * 0.45).length > 0,
        'folder body remains selectable',
    );
    geometry.dispose();
    mask.material.dispose();
});

void test('the drawer closeup uses the CSS tilt with perspective and stays centered through resizing', () => {
    const model = createProceduralDrawer(drawers(4), 'drawer-0');
    const bounds = new Box3().setFromObject(model.drawers.get('drawer-0'));
    const camera = new PerspectiveCamera(50, 1, 0.1, 50);

    for (const size of [
        { width: 1152, height: 640 },
        { width: 374, height: 520 },
        { width: 800, height: 700 },
    ]) {
        fitProceduralDrawerCamera(camera, bounds, size);
        const direction = camera.getWorldDirection(new Vector3());
        const tilt = (Math.atan2(-direction.y, -direction.z) * 180) / Math.PI;
        assert.ok(Math.abs(tilt - 52) < 1e-8);
        const projected = new Box3();
        for (const x of [bounds.min.x, bounds.max.x]) {
            for (const y of [bounds.min.y, bounds.max.y]) {
                for (const z of [bounds.min.z, bounds.max.z]) {
                    const point = new Vector3(x, y, z).project(camera);
                    assert.ok(Math.abs(point.x) < 0.97);
                    assert.ok(Math.abs(point.y) < 0.97);
                    projected.expandByPoint(point);
                }
            }
        }
        const center = projected.getCenter(new Vector3());
        const span = projected.getSize(new Vector3());
        assert.ok(Math.max(span.x, span.y) > 1.9);
        assert.ok(Math.abs(center.x) < 1e-8);
        assert.ok(Math.abs(center.y) < 1e-8);
        const projectedWidth = (z) =>
            new Vector3(bounds.max.x, bounds.max.y, z).project(camera).x -
            new Vector3(bounds.min.x, bounds.max.y, z).project(camera).x;
        assert.ok(
            projectedWidth(bounds.max.z) > projectedWidth(bounds.min.z) * 1.2,
        );
        const frontTop = new Vector3(0, bounds.max.y, bounds.max.z).project(
            camera,
        );
        const frontBottom = new Vector3(0, bounds.min.y, bounds.max.z).project(
            camera,
        );
        assert.ok(
            (Math.abs(frontTop.y - frontBottom.y) * size.height) /
                (projectedWidth(bounds.max.z) * size.width) <
                0.3,
        );
    }
    disposeProceduralCabinet(model);
});
