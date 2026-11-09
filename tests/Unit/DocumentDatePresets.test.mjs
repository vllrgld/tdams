import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDocumentDatePresets } from '../../resources/js/pages/documents/lib/document-date-presets.ts';

const ranges = (now, timezone = 'Asia/Manila') =>
    Object.fromEntries(
        getDocumentDatePresets(new Date(now), timezone).map(
            ({ value, from, to }) => [value, [from, to]],
        ),
    );

void test('relative presets resolve to calendar ranges matching the reference', () => {
    assert.deepEqual(ranges('2026-11-09T04:00:00Z'), {
        'within-week': ['2026-11-02', '2026-11-09'],
        'within-month': ['2026-10-09', '2026-11-09'],
        'within-three-months': ['2026-08-09', '2026-11-09'],
        'within-year': ['2025-11-09', '2026-11-09'],
        'this-year': ['2026-01-01', '2026-12-31'],
        'this-month': ['2026-11-01', '2026-11-30'],
        today: ['2026-11-09', '2026-11-09'],
    });
});

void test('presets use the selected timezone around midnight', () => {
    assert.deepEqual(ranges('2026-11-08T16:30:00Z').today, [
        '2026-11-09',
        '2026-11-09',
    ]);
    assert.deepEqual(ranges('2026-11-08T16:30:00Z', 'UTC').today, [
        '2026-11-08',
        '2026-11-08',
    ]);
    assert.deepEqual(
        ranges('2026-11-09T01:00:00Z', 'America/Los_Angeles').today,
        ['2026-11-08', '2026-11-08'],
    );
});

void test('month subtraction clamps to the end of shorter months', () => {
    const result = ranges('2026-03-31T04:00:00Z');
    assert.deepEqual(result['within-month'], ['2026-02-28', '2026-03-31']);
    assert.deepEqual(result['within-three-months'], [
        '2025-12-31',
        '2026-03-31',
    ]);
    assert.deepEqual(result['this-month'], ['2026-03-01', '2026-03-31']);
});

void test('leap days resolve to a valid prior year and full leap month', () => {
    const result = ranges('2024-02-29T04:00:00Z');
    assert.deepEqual(result['within-year'], ['2023-02-28', '2024-02-29']);
    assert.deepEqual(result['this-month'], ['2024-02-01', '2024-02-29']);
});

void test('week and year ranges cross year boundaries correctly', () => {
    const result = ranges('2026-01-01T04:00:00Z');
    assert.deepEqual(result['within-week'], ['2025-12-25', '2026-01-01']);
    assert.deepEqual(result['within-month'], ['2025-12-01', '2026-01-01']);
    assert.deepEqual(result['this-year'], ['2026-01-01', '2026-12-31']);
});

void test('daylight saving does not shift calendar boundaries or mutate the reference', () => {
    const now = new Date('2026-03-08T15:00:00Z');
    const result = getDocumentDatePresets(now, 'America/New_York');
    assert.deepEqual(
        result.find(({ value }) => value === 'within-week')?.from,
        '2026-03-01',
    );
    assert.deepEqual(
        result.find(({ value }) => value === 'today')?.from,
        '2026-03-08',
    );
    assert.equal(now.toISOString(), '2026-03-08T15:00:00.000Z');
});
