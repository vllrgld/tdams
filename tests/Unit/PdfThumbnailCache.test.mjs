import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import {
    acquireCachedThumbnail,
    cacheRenderedThumbnail,
    clearThumbnailCache,
    thumbnailCacheKey,
} from '../../resources/js/components/pdf/pdf-thumbnail-cache.ts';

let live;
let revoked;
let nextUrl;

beforeEach(() => {
    live = new Map();
    revoked = [];
    nextUrl = 0;
    mock.method(URL, 'createObjectURL', (blob) => {
        const url = `blob:thumbnail-${++nextUrl}`;
        live.set(url, blob.size);
        return url;
    });
    mock.method(URL, 'revokeObjectURL', (url) => {
        revoked.push(url);
        live.delete(url);
    });
});

afterEach(() => {
    clearThumbnailCache();
    mock.restoreAll();
});

function render(width, bytes = 1024) {
    cacheRenderedThumbnail('/scan.pdf', 1, 'card', width, {
        toBlob(callback) {
            callback({ size: bytes });
        },
    });
}

function acquire(width) {
    return acquireCachedThumbnail(
        thumbnailCacheKey('/scan.pdf', 1, 'card', width),
    );
}

test('repeated document widths cannot grow the cache beyond its entry limit', () => {
    for (let width = 100; width < 600; width++) render(width);

    assert.equal(live.size, 64);
    assert.equal(revoked.length, 436);
    assert.equal(acquire(100), null);
    const recent = acquire(599);
    assert.ok(recent);
    recent.release();
});

test('recently used thumbnails survive eviction of older entries', () => {
    for (let width = 0; width < 64; width++) render(width);
    const first = acquire(0);
    first.release();

    render(64);

    assert.equal(acquire(1), null);
    const retained = acquire(0);
    assert.equal(retained.url, first.url);
    retained.release();
});

test('eviction never revokes images that mounted consumers still use', () => {
    const consumers = [];
    for (let width = 0; width < 64; width++) {
        render(width);
        consumers.push(acquire(width));
    }

    render(64);
    assert.equal(live.size, 64);
    assert.equal(revoked.length, 0);
    assert.equal(acquire(64), null);

    consumers[0].release();
    render(64);
    assert.deepEqual(revoked, [consumers[0].url]);
    consumers.forEach((consumer) => consumer.release());
});

test('large thumbnails also respect the byte budget', () => {
    for (let width = 0; width < 10; width++) render(width, 4 * 1024 * 1024);

    assert.equal(
        [...live.values()].reduce((sum, bytes) => sum + bytes, 0),
        16 * 1024 * 1024,
    );
    render(100, 17 * 1024 * 1024);
    assert.equal(acquire(100), null);
    assert.equal(live.size, 4);
});

test('clearing defers revocation until the final consumer releases its image', () => {
    render(100);
    const first = acquire(100);
    const second = acquire(100);

    clearThumbnailCache();
    assert.equal(acquire(100), null);
    assert.equal(live.has(first.url), true);
    first.release();
    first.release();
    assert.equal(live.has(first.url), true);
    second.release();
    assert.deepEqual(revoked, [first.url]);
});

test('late encoders cannot repopulate a cleared cache or duplicate object URLs', () => {
    const callbacks = [];
    const canvas = {
        toBlob(callback) {
            callbacks.push(callback);
        },
    };
    cacheRenderedThumbnail('/scan.pdf', 1, 'card', 100, canvas);
    clearThumbnailCache();
    callbacks.shift()({ size: 1024 });
    assert.equal(live.size, 0);

    cacheRenderedThumbnail('/scan.pdf', 1, 'card', 100, canvas);
    cacheRenderedThumbnail('/scan.pdf', 1, 'card', 100, canvas);
    callbacks.forEach((callback) => callback({ size: 1024 }));
    assert.equal(live.size, 1);
    assert.equal(nextUrl, 1);
});
