import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    checkedFieldPayload,
    createReviewState,
    mergeMappedFields,
    sectionCanBeChecked,
    unusedMappedAttachments,
    updateReviewField,
} from '../../resources/js/pages/documents/lib/metadata.ts';
import { createUploadSession } from '../../resources/js/pages/documents/lib/upload-session.ts';
import { documentFileError } from '../../resources/js/pages/documents/lib/upload-file.ts';
import { pollOcrStatus } from '../../resources/js/pages/documents/lib/ocr-polling.ts';

const sections = [
    {
        id: 'declaration',
        title: 'Declaration details',
        tabLabel: 'Declaration',
        fields: [
            { name: 'tax_declaration_number', label: 'Declaration number' },
        ],
    },
    {
        id: 'property',
        title: 'Property details',
        tabLabel: 'Property',
        fields: [
            { name: 'lot_number', label: 'Lot' },
            { name: 'pin', label: 'PIN' },
        ],
    },
    {
        id: 'remarks',
        title: 'Remarks',
        tabLabel: 'Remarks',
        fields: [{ name: 'remarks', label: 'Remarks' }],
    },
];

void test('switching verification fields preserves edits and saves only the visible checked fields', () => {
    const metadataSections = [
        {
            id: 'document',
            title: 'Document',
            tabLabel: 'Document',
            fields: [{ name: 'title', label: 'Title' }],
        },
    ];
    let review = createReviewState([...sections, ...metadataSections]);
    review = updateReviewField(
        review,
        sections,
        'tax_declaration_number',
        'STAFF-TD',
    );
    review = mergeMappedFields(review, metadataSections, {
        title: 'Mapped title',
    });
    review.checked = { document: true };

    assert.deepEqual(checkedFieldPayload(review, metadataSections), {
        title: 'Mapped title',
    });
    assert.equal(review.values.tax_declaration_number, 'STAFF-TD');

    review = mergeMappedFields(review, sections, {
        tax_declaration_number: 'AI-TD',
    });
    review.checked = { declaration: true };

    assert.deepEqual(checkedFieldPayload(review, sections), {
        tax_declaration_number: 'STAFF-TD',
    });
    assert.equal(review.values.title, 'Mapped title');
});

void test('upload selection accepts supported scans including uppercase extensions at the size limit', () => {
    for (const name of [
        'scan.PDF',
        'scan.jpg',
        'scan.jpeg',
        'scan.png',
        'scan.tif',
        'scan.tiff',
    ]) {
        assert.equal(documentFileError({ name, size: 50 * 1024 * 1024 }), null);
    }
});

void test('upload selection rejects unsupported, empty, and oversized files before submission', () => {
    assert.match(
        documentFileError({ name: 'scan.docx', size: 100 }),
        /PDF, JPEG, PNG, or TIFF/,
    );
    assert.match(documentFileError({ name: 'scan.pdf', size: 0 }), /empty/);
    assert.match(
        documentFileError({ name: 'scan.pdf', size: 50 * 1024 * 1024 + 1 }),
        /larger than 50 MB/,
    );
});

void test('a delayed upload cannot select a document in a reopened session', async () => {
    const session = createUploadSession();
    session.open();
    let resolveUpload;
    let oldSignal;
    const selected = [];
    const upload = session.run(
        (signal) => {
            oldSignal = signal;
            return new Promise((resolve) => {
                resolveUpload = resolve;
            });
        },
        (document) => selected.push(document.id),
        (error) => assert.fail(error),
    );

    session.close();
    session.open();
    resolveUpload({ id: 10 });
    await upload;
    await session.run(
        async () => ({ id: 20 }),
        (document) => selected.push(document.id),
        assert.fail,
    );

    assert.equal(oldSignal.aborted, true);
    assert.deepEqual(selected, [20]);
});

void test('a delayed failure cannot clear the pending state of a new request', async () => {
    const session = createUploadSession();
    session.open();
    let rejectMapping;
    const changes = [];
    const mapping = session.run(
        () =>
            new Promise((resolve, reject) => {
                rejectMapping = reject;
            }),
        () => changes.push('old success'),
        () => changes.push('old error'),
        () => changes.push('old finished'),
    );

    session.close();
    session.open();
    rejectMapping(new Error('Old mapping failed'));
    await mapping;

    assert.deepEqual(changes, []);
});

void test('a delayed save cannot close a new upload dialog', async () => {
    const session = createUploadSession();
    session.open();
    let resolveSave;
    let dialogOpen = true;
    const saving = session.run(
        () =>
            new Promise((resolve) => {
                resolveSave = resolve;
            }),
        () => {
            dialogOpen = false;
        },
        assert.fail,
    );

    session.close();
    session.open();
    resolveSave({ document: { id: 10 } });
    await saving;

    assert.equal(dialogOpen, true);
});

void test('mapped attachments skip listed descriptions and keep only printed pages', () => {
    assert.deepEqual(
        unusedMappedAttachments(
            [{ description: 'Certified true copy of title' }],
            [
                { description: 'Certified true copy of title', page: 3 },
                { description: 'Sketch plan', page: '' },
                { description: 'Deed of sale', page: 4 },
                { description: '  deed of sale  ', page: 5 },
                { description: '   ', page: 1 },
                'Special power of attorney',
            ],
        ),
        [
            { description: 'Sketch plan', page: null },
            { description: 'Deed of sale', page: 4 },
            { description: 'Special power of attorney', page: null },
        ],
    );
});

void test('mapping preserves corrections and deliberate blanks while refreshing untouched fields', () => {
    let review = createReviewState(sections);
    review = mergeMappedFields(review, sections, {
        lot_number: 'OCR lot',
        pin: 'OLD PIN',
    });
    review = updateReviewField(
        review,
        sections,
        'tax_declaration_number',
        'STAFF-42',
    );
    review = updateReviewField(review, sections, 'lot_number', '');
    review.checked = { declaration: true, property: true };

    const mapped = mergeMappedFields(review, sections, {
        tax_declaration_number: 'OCR-99',
        lot_number: 'Invented lot',
        pin: 'NEW PIN',
    });

    assert.equal(mapped.values.tax_declaration_number, 'STAFF-42');
    assert.equal(mapped.values.lot_number, '');
    assert.equal(mapped.values.pin, 'NEW PIN');
    assert.equal(mapped.checked.declaration, true);
    assert.equal(mapped.checked.property, false);
});

void test('only verified nonempty fields are sent and review labels do not affect verification', () => {
    let review = createReviewState(sections);
    review = updateReviewField(
        review,
        sections,
        'tax_declaration_number',
        'TD-42',
    );
    review = updateReviewField(
        review,
        sections,
        'remarks',
        'Unverified model output',
    );
    review.checked = { declaration: true };
    const renamedSections = sections.map((section) => ({
        ...section,
        title: 'Translated title',
    }));

    assert.deepEqual(checkedFieldPayload(review, renamedSections), {
        tax_declaration_number: 'TD-42',
    });
});

void test('resuming review restores saved fields and mapping preserves them', () => {
    const review = createReviewState(sections, {
        taxDeclarationNumber: 'TD-STAFF',
        lotNumber: 'LOT-STAFF',
        pin: null,
        remarks: 'Saved remark',
    });
    const mapped = mergeMappedFields(review, sections, {
        tax_declaration_number: 'OCR-INCORRECT',
        lot_number: 'OCR-LOT',
        pin: 'NEW-PIN',
        remarks: 'Different remark',
    });

    assert.equal(mapped.values.tax_declaration_number, 'TD-STAFF');
    assert.equal(mapped.values.lot_number, 'LOT-STAFF');
    assert.equal(mapped.values.pin, 'NEW-PIN');
    assert.equal(mapped.values.remarks, 'Saved remark');
    assert.deepEqual(mapped.checked, { property: false });
});

void test('an intentional clear can be checked and saved without sending untouched blank fields', () => {
    let review = createReviewState(sections, { remarks: 'Old remark' });
    review = updateReviewField(review, sections, 'remarks', '');
    review.checked = { remarks: true, property: true };

    assert.equal(
        sectionCanBeChecked(sections[2], review.values, review.edited),
        true,
    );
    assert.equal(
        sectionCanBeChecked(sections[1], review.values, review.edited),
        false,
    );
    assert.deepEqual(checkedFieldPayload(review, sections), { remarks: '' });
});

const nextTurn = () => new Promise((resolve) => setImmediate(resolve));
const completedOcr = {
    status: 'completed',
    error: null,
    pdfUrl: '/preview.pdf',
    mimeType: 'application/pdf',
};

void test('OCR status polling recovers after a temporary failure and stops when completed', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let requests = 0;
    const results = [];
    const errors = [];
    const stop = pollOcrStatus(
        async () => {
            requests++;
            if (requests === 1)
                throw new TypeError('Temporary network failure');
            return completedOcr;
        },
        (result) => results.push(result),
        (error) => {
            errors.push(error);
            return true;
        },
    );
    t.after(stop);
    await nextTurn();
    t.mock.timers.tick(2000);
    await nextTurn();
    t.mock.timers.tick(60000);
    await nextTurn();

    assert.equal(errors.length, 1);
    assert.equal(requests, 2);
    assert.deepEqual(results, [completedOcr]);
});

void test('OCR status polling backs off repeated failures', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let requests = 0;
    const stop = pollOcrStatus(
        async () => {
            requests++;
            throw new TypeError('Offline');
        },
        () => assert.fail('No successful status expected'),
        () => true,
    );
    t.after(stop);
    await nextTurn();
    t.mock.timers.tick(2000);
    await nextTurn();
    assert.equal(requests, 2);
    t.mock.timers.tick(3999);
    await nextTurn();
    assert.equal(requests, 2);
    t.mock.timers.tick(1);
    await nextTurn();
    assert.equal(requests, 3);
});

void test('closing OCR polling cancels scheduled checks', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let requests = 0;
    const stop = pollOcrStatus(
        async () => {
            requests++;
            return { ...completedOcr, status: 'processing' };
        },
        () => {},
        () => assert.fail('No error expected'),
    );
    await nextTurn();
    stop();
    t.mock.timers.tick(60000);
    await nextTurn();

    assert.equal(requests, 1);
});

void test('closing OCR polling aborts an in-flight request and ignores its late response', async () => {
    let complete;
    let signal;
    const results = [];
    const stop = pollOcrStatus(
        (requestSignal) => {
            signal = requestSignal;
            return new Promise((resolve) => {
                complete = resolve;
            });
        },
        (result) => results.push(result),
        () => assert.fail('No error expected'),
    );
    stop();
    complete(completedOcr);
    await nextTurn();

    assert.equal(signal.aborted, true);
    assert.deepEqual(results, []);
});

void test('terminal OCR failure is shown once without repeatedly polling', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const results = [];
    const stop = pollOcrStatus(
        async () => ({
            ...completedOcr,
            status: 'failed',
            error: 'Provider failed',
        }),
        (result) => results.push(result),
        () => assert.fail('The failed status is a successful HTTP response'),
    );
    t.after(stop);
    await nextTurn();
    t.mock.timers.tick(60000);
    await nextTurn();

    assert.equal(results.length, 1);
    assert.equal(results[0].status, 'failed');
});

void test('nonretryable HTTP errors pause status checks for manual recovery', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let requests = 0;
    const stop = pollOcrStatus(
        async () => {
            requests++;
            throw new Error('Unauthenticated');
        },
        () => assert.fail('No status expected'),
        () => false,
    );
    t.after(stop);
    await nextTurn();
    t.mock.timers.tick(60000);
    await nextTurn();

    assert.equal(requests, 1);
});
