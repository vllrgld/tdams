import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    getActiveCommandIndex,
    matchesCommand,
    orderCommandResults,
} from '../../resources/js/lib/command-search.ts';

void test('late results and retries select the first result after an empty list', () => {
    assert.equal(getActiveCommandIndex(0, 0), -1);
    assert.equal(getActiveCommandIndex(-1, 3), 0);
    assert.equal(getActiveCommandIndex(4, 2), 0);
    assert.equal(getActiveCommandIndex(1, 3), 1);
});

void test('command matching accepts empty queries, case differences and word prefixes', () => {
    const entry = {
        title: 'Accessibility',
        hint: 'Settings > Account',
        keywords: 'animation motion',
    };

    assert.equal(matchesCommand(entry, ''), true);
    assert.equal(matchesCommand(entry, '  MOTION  settings '), true);
    assert.equal(matchesCommand(entry, 'animations'), true);
    assert.equal(matchesCommand(entry, 'access'), true);
    assert.equal(matchesCommand(entry, 'motion missing'), false);
});

void test('keyboard result order follows visible groups with mixed books and folders', () => {
    const items = [
        { key: 'folder-a', group: 'Folders' },
        { key: 'book-a', group: 'Books' },
        { key: 'folder-b', group: 'Folders' },
        { key: 'page', group: 'Pages' },
        { key: 'book-b', group: 'Books' },
        { key: 'setting', group: 'Settings' },
        { key: 'upload', group: 'Actions' },
        { key: 'document', group: 'Documents' },
    ];
    const result = orderCommandResults(items);

    assert.deepEqual(
        result.map(({ key }) => key),
        [
            'page',
            'upload',
            'setting',
            'book-a',
            'book-b',
            'folder-a',
            'folder-b',
            'document',
        ],
    );
    assert.equal(items[0].key, 'folder-a');
});
