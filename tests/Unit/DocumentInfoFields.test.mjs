import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    changedDocumentFields,
    documentInfoFields,
    documentSectionValues,
} from '../../resources/js/lib/document-info-fields.ts';

void test('section saves include only changed fields and preserve explicit clearing', () => {
    assert.deepEqual(
        changedDocumentFields(
            {
                lot_number: '001543',
                pin: '033-10',
                registered_owner: 'Original Owner',
            },
            {
                lot_number: ' 001544 ',
                pin: '',
                registered_owner: 'Original Owner',
                ocr_text: 'unrelated',
            },
        ),
        { lot_number: '001544', pin: null },
    );
});

void test('opening and saving a section without changing values does not send blank or untouched fields', () => {
    const initial = documentSectionValues(
        { area: '0.2528', province: 'Romblon' },
        documentInfoFields.land,
    );
    assert.equal(initial.area, '0.2528');
    assert.equal(initial.boundary_north, '');
    assert.deepEqual(
        changedDocumentFields(initial, { ...initial, province: ' Romblon ' }),
        {},
    );
});

void test('location editing starts with the same legacy fallback values shown by the viewer', () => {
    const initial = documentSectionValues(
        {
            propertyLocationBarangay: null,
            barangay: 'Tumingad',
            municipality: 'Odiongan',
        },
        documentInfoFields.location,
    );
    assert.equal(initial.property_location_barangay, 'Tumingad');
    assert.equal(initial.property_location_municipality, 'Odiongan');
    assert.deepEqual(
        changedDocumentFields(initial, {
            ...initial,
            property_location_barangay: 'District 1',
        }),
        { property_location_barangay: 'District 1' },
    );
});

void test('remarks preserve line breaks and declaration identifiers preserve leading zeros', () => {
    assert.deepEqual(
        changedDocumentFields(
            { remarks: 'Old notes' },
            { remarks: 'General Revision 2008\nCorrected lot number.' },
        ),
        { remarks: 'General Revision 2008\nCorrected lot number.' },
    );
    const values = documentSectionValues(
        {
            taxDeclarationNumber: '00072',
            declarationDate: '2014-07-23',
            pin: '033-10-0-24-02',
        },
        documentInfoFields.declaration,
    );
    assert.equal(values.tax_declaration_number, '00072');
    assert.equal(values.declaration_date, '2014-07-23');
    assert.equal(values.pin, '033-10-0-24-02');
});
