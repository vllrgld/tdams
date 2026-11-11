import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPanScrollController } from '../../resources/js/hooks/pan-scroll.ts';

function fixture() {
    const frames = new Map();
    const positions = [];
    let handle = 0;
    const viewer = { scrollTo: (left, top) => positions.push([left, top]) };
    const controller = createPanScrollController(
        (callback) => {
            const id = handle++;
            frames.set(id, callback);
            return id;
        },
        (id) => frames.delete(id),
    );
    return { controller, frames, positions, viewer };
}

void test('many pointer moves scroll once per frame using the latest position', () => {
    const { controller, frames, positions, viewer } = fixture();
    controller.queue(viewer, 10, 20);
    controller.queue(viewer, 30, 40);
    controller.queue(viewer, 50, 60);
    assert.equal(frames.size, 1);
    assert.deepEqual(positions, []);

    const callback = frames.get(0);
    frames.clear();
    callback(0);
    assert.deepEqual(positions, [[50, 60]]);

    controller.queue(viewer, 70, 80);
    assert.equal(frames.size, 1);
});

void test('finishing a drag applies its final position and cancels the pending frame', () => {
    const { controller, frames, positions, viewer } = fixture();
    controller.queue(viewer, 10, 20);
    const callback = frames.get(0);
    controller.queue(viewer, 30, 40);
    controller.flush();
    assert.equal(frames.size, 0);
    assert.deepEqual(positions, [[30, 40]]);
    callback(0);
    controller.flush();
    assert.deepEqual(positions, [[30, 40]]);
});

void test('unmount cleanup drops pending scroll work and the controller can be reused', () => {
    const { controller, frames, positions, viewer } = fixture();
    controller.queue(viewer, 10, 20);
    const callback = frames.get(0);
    controller.cancel();
    assert.equal(frames.size, 0);
    callback(0);
    assert.deepEqual(positions, []);

    controller.queue(viewer, 30, 40);
    controller.flush();
    assert.deepEqual(positions, [[30, 40]]);
});

void test('creating and cleaning up a controller does not require browser globals', () => {
    const controller = createPanScrollController();
    controller.flush();
    controller.cancel();
});
