import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    contentText,
    displayOcrText,
    hasPosition,
    hasUncoveredText,
    wordPositions,
} from '../../resources/js/components/documents/ocr/ocr-content-data.ts';

const region = (text, overrides = {}) => ({
    page: 1,
    text,
    box: [10, 10, 900, 40],
    pageWidth: 1000,
    pageHeight: 1000,
    ...overrides,
});

void test('OCR checkboxes display as plain checkmarks without emoji presentation', () => {
    assert.equal(
        displayOcrText('☑ LAND ✅ BUILDING ✔ Verified ✓ Correct ☐ Empty'),
        '✓\uFE0E LAND ✓\uFE0E BUILDING ✓\uFE0E Verified ✓\uFE0E Correct ☐\uFE0E Empty',
    );
    assert.equal(
        displayOcrText('  PIN\t001-02\n\nPeña'),
        '  PIN\t001-02\n\nPeña',
    );
});

void test('word positions preserve column gaps without stretching the spaces between words', () => {
    const words = wordPositions(
        region('LABEL VALUE', {
            words: [
                { text: 'LABEL', box: [10, 10, 80, 40] },
                { text: 'VALUE', box: [800, 10, 900, 40] },
            ],
        }),
    );
    assert.equal(words.length, 2);
    assert.equal(words[0].left, 0);
    assert.equal(words[0].width, 70 / 890);
    assert.equal(words[1].left, 790 / 890);
    assert.equal(words[1].left + words[1].width, 1);
});

void test('partial or invalid word geometry falls back to complete region text', () => {
    assert.deepEqual(
        wordPositions(
            region('LABEL', { words: [{ text: 'LABEL', box: null }] }),
        ),
        [],
    );
    assert.deepEqual(
        wordPositions(
            region('LABEL VALUE', {
                words: [{ text: 'LABEL', box: [10, 10, 80, 40] }],
            }),
        ),
        [],
    );
    assert.deepEqual(
        wordPositions(
            region('LABEL', {
                words: [{ text: 'LABEL', box: [0, 10, 80, 40] }],
            }),
        ),
        [],
    );
    assert.deepEqual(
        wordPositions(
            region('LABEL', {
                box: null,
                words: [{ text: 'LABEL', box: [10, 10, 80, 40] }],
            }),
        ),
        [],
    );
});

void test('invalid page coordinates cannot be positioned', () => {
    assert.equal(hasPosition(region('A')), true);
    assert.equal(hasPosition(region('A', { pageWidth: 0 })), false);
    assert.equal(
        hasPosition(region('A', { box: [0, 0, Infinity, 20] })),
        false,
    );
    assert.equal(hasPosition(region('A', { box: [-1, 0, 20, 30] })), false);
});

void test('coverage detects missing text and repeated values without depending on region order', () => {
    assert.equal(
        hasUncoveredText('Owner Peña\nPIN 001-02', [
            region('PIN 001-02'),
            region('Owner Peña'),
        ]),
        false,
    );
    assert.equal(
        hasUncoveredText('Owner Peña\nMissing line', [region('Owner Peña')]),
        true,
    );
    assert.equal(hasUncoveredText('100 100', [region('100')]), true);
    assert.equal(
        hasUncoveredText('Unpositioned text', [
            region('Unpositioned text', { box: null }),
        ]),
        false,
    );
});

void test('coverage uses cell text rather than HTML tags and includes empty merged cells', () => {
    const content = [
        {
            type: 'table',
            rows: [
                [
                    { text: 'Lot', rowSpan: 1, colSpan: 2, header: true },
                    { text: '', rowSpan: 1, colSpan: 1, header: false },
                ],
                [{ text: '007', rowSpan: 1, colSpan: 1, header: false }],
            ],
        },
    ];
    assert.equal(contentText(content), 'Lot\t\n007');
    assert.equal(
        hasUncoveredText('Lot 007', [
            region('<table>...</table>', { content }),
        ]),
        false,
    );
    assert.equal(contentText(undefined, '  spaces\t\n\n'), '  spaces\t\n\n');
});
