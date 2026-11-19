import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    canEnterUploadPreparationStep,
    getUploadPreparationSteps,
    getUploadConnectorStart,
    getUploadProgress,
    getUploadStep,
} from '../../resources/js/pages/documents/lib/upload-progress.ts';

void test('Archive chooses placement before selecting and uploading a file', () => {
    assert.deepEqual(getUploadPreparationSteps('archive'), ['confirm', 'file']);
    const selection = {
        filingPath: 'archive',
        hasFile: false,
        hasArchiveLocation: false,
    };

    assert.equal(canEnterUploadPreparationStep('confirm', selection), true);
    assert.equal(canEnterUploadPreparationStep('file', selection), false);
    assert.equal(
        canEnterUploadPreparationStep('file', {
            ...selection,
            hasArchiveLocation: true,
        }),
        true,
    );
});

void test('Receiving still selects a file before confirming its destination', () => {
    assert.deepEqual(getUploadPreparationSteps('route'), ['file', 'confirm']);
    const selection = {
        filingPath: 'route',
        hasFile: false,
        hasArchiveLocation: false,
    };

    assert.equal(canEnterUploadPreparationStep('file', selection), true);
    assert.equal(canEnterUploadPreparationStep('confirm', selection), false);
    assert.equal(
        canEnterUploadPreparationStep('confirm', {
            ...selection,
            hasFile: true,
        }),
        true,
    );
});

void test('both preparation paths can return to destination selection', () => {
    for (const filingPath of ['archive', 'route']) {
        assert.equal(
            canEnterUploadPreparationStep('destination', {
                filingPath,
                hasFile: false,
                hasArchiveLocation: false,
            }),
            true,
        );
    }
});

void test('the newest connector animates on first entry to a main step', () => {
    assert.equal(getUploadConnectorStart(0, 1, 0), 0);
    assert.equal(getUploadConnectorStart(1, 2, 1), 0);
});

void test('entered steps keep their filled connectors when the modal remounts', () => {
    assert.equal(getUploadConnectorStart(0, 1, 1), 1);
    assert.equal(getUploadConnectorStart(0, 2, 2), 1);
    assert.equal(getUploadConnectorStart(1, 2, 2), 1);
});

void test('earlier completed connectors remain filled when entering a later step', () => {
    assert.equal(getUploadConnectorStart(0, 2, -1), 1);
    assert.equal(getUploadConnectorStart(1, 2, -1), 0);
});

void test('pending connectors stay empty even before old trace history is cleared', () => {
    assert.equal(getUploadConnectorStart(0, 0, 2), 0);
    assert.equal(getUploadConnectorStart(1, 1, 2), 0);
});

void test('destination, file, details, and upload remain within the first stage', () => {
    for (const phase of ['destination', 'file', 'confirm', 'upload']) {
        const progress = getUploadProgress(phase);
        assert.equal(progress.currentIndex, 0);
    }
});

void test('processing, retries, errors, and the OCR completion animation stay on Process', () => {
    for (const phase of ['ocr', 'retry-ocr', 'ocr-failed', 'ocr-complete']) {
        assert.equal(getUploadProgress(phase).currentIndex, 1);
    }
});

void test('mapping and field review keep the Verify stage active', () => {
    assert.equal(getUploadProgress('map').currentIndex, 2);
    assert.equal(getUploadProgress('review').currentIndex, 2);
});

void test('saving remains on Verify without an additional Archive or Save stage', () => {
    const saving = getUploadProgress('save');
    assert.equal(saving.currentIndex, 2);
    assert.deepEqual(saving.labels, ['Upload', 'Process', 'Verify']);
});

void test('upload opens the processing modal immediately and stays there when reading starts', () => {
    assert.equal(getUploadStep('upload'), 'ocr');
    assert.equal(getUploadStep('ocr'), 'ocr');
    assert.equal(getUploadProgress('upload').currentIndex, 0);
    assert.equal(getUploadProgress('ocr').currentIndex, 1);
});

void test('processing failures and completion stay in the processing modal until review', () => {
    for (const phase of ['ocr-failed', 'retry-ocr', 'ocr-complete']) {
        assert.equal(getUploadStep(phase), 'ocr');
    }

    for (const phase of ['review', 'map', 'save']) {
        assert.equal(getUploadStep(phase), 'review');
    }

    assert.equal(getUploadStep('confirm'), 'confirm');
    assert.equal(getUploadStep('file'), 'file');
    assert.equal(getUploadStep('destination'), 'destination');
});
