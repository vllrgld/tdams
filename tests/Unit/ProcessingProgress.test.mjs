import assert from 'node:assert/strict';
import { test } from 'node:test';
import { estimateProcessingProgress } from '../../resources/js/lib/processing-progress.ts';

void test('processing estimate starts visibly and increases more slowly over time', () => {
    assert.equal(estimateProcessingProgress(0), 25);
    const early = estimateProcessingProgress(5_000);
    const middle = estimateProcessingProgress(10_000);
    const later = estimateProcessingProgress(15_000);

    assert.ok(early >= 50);
    assert.ok(middle > early);
    assert.ok(later > middle);
    assert.ok(later >= 80);
    assert.ok(middle - early > later - middle);
});

void test('processing estimate stays below completion for long running documents', () => {
    assert.equal(estimateProcessingProgress(300_000), 95);
    assert.equal(estimateProcessingProgress(3_600_000), 95);
});

void test('processing estimate handles a clock adjustment without going backwards past its start', () => {
    assert.equal(estimateProcessingProgress(-1_000), 25);
});

void test('available OCR content immediately completes the bar regardless of elapsed time', () => {
    assert.equal(estimateProcessingProgress(0, true), 100);
    assert.equal(estimateProcessingProgress(1_000, true), 100);
    assert.equal(estimateProcessingProgress(300_000, true), 100);
});

void test('upload estimates start immediately and reserve most progress for reading', () => {
    assert.equal(estimateProcessingProgress(0, false, 'uploading'), 5);
    assert.ok(estimateProcessingProgress(2_000, false, 'uploading') > 5);
    assert.equal(estimateProcessingProgress(300_000, false, 'uploading'), 25);
});

void test('switching from upload to reading never restarts or moves the bar backwards', () => {
    const readingStart = estimateProcessingProgress(0, false, 'reading');

    for (const uploadDuration of [0, 150, 2_000, 10_000, 300_000]) {
        const uploadProgress = estimateProcessingProgress(
            uploadDuration,
            false,
            'uploading',
        );
        assert.ok(readingStart >= uploadProgress);
    }

    assert.ok(
        estimateProcessingProgress(2_000, false, 'reading') > readingStart,
    );
});
