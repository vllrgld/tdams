import type { ArchivedDocument } from '@/types/documents';
import type {
    DocumentFieldSection,
    DocumentFieldValues,
    MetadataField,
    SaveDocumentFieldsPayload,
} from '../types';

export type DocumentReviewState = {
    values: DocumentFieldValues;
    edited: Partial<Record<MetadataField, true>>;
    checked: Record<string, boolean>;
};

export function filled(value: string | undefined): boolean {
    return (value ?? '').trim() !== '';
}

export function createReviewState(
    sections: DocumentFieldSection[],
    document?: ArchivedDocument,
): DocumentReviewState {
    const state: DocumentReviewState = {
        values: Object.fromEntries(
            sections.flatMap((section) =>
                section.fields.map((field) => [field.name, '']),
            ),
        ) as DocumentFieldValues,
        edited: {},
        checked: {},
    };

    if (document) {
        for (const section of sections) {
            for (const { name } of section.fields) {
                const key = name.replace(/_([a-z])/g, (_, letter: string) =>
                    letter.toUpperCase(),
                ) as keyof ArchivedDocument;
                const value = document[key];
                if (typeof value === 'string' && filled(value)) {
                    state.values[name] = value;
                    state.edited[name] = true;
                }
            }
        }
    }

    return state;
}

export function sectionCanBeChecked(
    section: DocumentFieldSection,
    values: DocumentFieldValues,
    edited: DocumentReviewState['edited'] = {},
): boolean {
    return section.fields.some(
        (field) => filled(values[field.name]) || edited[field.name],
    );
}

export function updateReviewField(
    state: DocumentReviewState,
    sections: DocumentFieldSection[],
    name: MetadataField,
    value: string,
): DocumentReviewState {
    const section = sections.find((item) =>
        item.fields.some((field) => field.name === name),
    );
    return {
        values: { ...state.values, [name]: value },
        edited: { ...state.edited, [name]: true },
        checked: {
            ...state.checked,
            ...(section ? { [section.id]: false } : {}),
        },
    };
}

export function mergeMappedFields(
    state: DocumentReviewState,
    sections: DocumentFieldSection[],
    fields: Partial<Record<MetadataField, string | null>>,
): DocumentReviewState {
    const values = { ...state.values };
    const checked = { ...state.checked };
    for (const section of sections) {
        for (const field of section.fields) {
            if (state.edited[field.name]) continue;
            const value = fields[field.name] ?? '';
            if (values[field.name] !== value) {
                values[field.name] = value;
                checked[section.id] = false;
            }
        }
    }
    return { ...state, values, checked };
}

export function checkedFieldPayload(
    state: DocumentReviewState,
    sections: DocumentFieldSection[],
): SaveDocumentFieldsPayload {
    const payload: SaveDocumentFieldsPayload = {};
    for (const section of sections) {
        if (!state.checked[section.id]) continue;
        for (const field of section.fields) {
            if (filled(state.values[field.name]) || state.edited[field.name])
                payload[field.name] = state.values[field.name];
        }
    }
    return payload;
}
