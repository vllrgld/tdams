import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    checkedFieldPayload,
    createReviewState,
    mergeMappedFields,
    sectionCanBeChecked,
    updateReviewField,
} from '@/pages/documents/lib/metadata';
import { createUploadSession } from '@/pages/documents/lib/upload-session';
import {
    pollOcrStatus,
    type OcrStatus,
} from '@/pages/documents/lib/ocr-polling';
import type { ArchivedDocument } from '@/types/documents';
import type {
    DocumentFieldSection,
    MetadataField,
    UploadDocumentPayload,
} from '@/pages/documents/types';
import { fields, map, ocr, store } from '@/routes/documents';
import { retry as retryDocumentOcr } from '@/routes/documents/ocr';

type UploadStage =
    | { phase: 'file' | 'confirm' | 'upload' }
    | { phase: 'ocr' | 'retry-ocr'; documentId: number }
    | { phase: 'ocr-failed'; documentId: number; retryJob: boolean }
    | {
          phase: 'review' | 'map' | 'save';
          documentId: number;
          pdfUrl: string | null;
          mimeType: string;
      };

class DocumentRequestError extends Error {
    errors: Record<string, string>;
    status: number;

    constructor(
        message: string,
        errors: Record<string, string>,
        status: number,
    ) {
        super(message);
        this.errors = errors;
        this.status = status;
    }
}

async function requestJson<T>(url: string, options: RequestInit): Promise<T> {
    const cookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='));
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    headers.set(
        'X-XSRF-TOKEN',
        cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : '',
    );
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers,
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
        const errors: Record<string, string> = {};
        const validationErrors = body?.errors as
            | Record<string, string[]>
            | undefined;

        for (const [key, messages] of Object.entries(validationErrors ?? {})) {
            if (messages[0]) errors[key] = messages[0];
        }

        throw new DocumentRequestError(
            Object.values(errors)[0] || body?.message || 'The request failed.',
            errors,
            response.status,
        );
    }

    return body as T;
}

function messageFrom(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

export function useDocumentUpload({
    open,
    onOpenChange,
    mappingModels,
    fieldSections,
    reviewDocument,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mappingModels: string[];
    fieldSections: DocumentFieldSection[];
    reviewDocument?: ArchivedDocument | null;
}) {
    const [session] = useState(createUploadSession);
    const [stage, setStage] = useState<UploadStage>({ phase: 'file' });
    const [file, setFile] = useState<File | null>(null);
    const [cabinetId, setCabinetId] = useState('');
    const [drawerId, setDrawerId] = useState('');
    const [itemId, setItemId] = useState('');
    const [review, setReview] = useState(() =>
        createReviewState(fieldSections),
    );
    const [model, setModel] = useState(
        mappingModels.includes('gpt-oss:20b')
            ? 'gpt-oss:20b'
            : (mappingModels[0] ?? ''),
    );
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [confirmSave, setConfirmSave] = useState(false);
    const [activeReviewSection, setActiveReviewSection] =
        useState('declaration');
    const documentId = 'documentId' in stage ? stage.documentId : null;
    const pdfUrl = 'pdfUrl' in stage ? stage.pdfUrl : null;
    const mimeType = 'mimeType' in stage ? stage.mimeType : file?.type;
    const pending =
        stage.phase === 'upload' ||
        stage.phase === 'ocr' ||
        stage.phase === 'retry-ocr'
            ? 'upload'
            : stage.phase === 'map' || stage.phase === 'save'
              ? stage.phase
              : null;
    const step =
        stage.phase === 'upload'
            ? 'confirm'
            : stage.phase === 'ocr-failed' || stage.phase === 'retry-ocr'
              ? 'ocr'
              : stage.phase === 'map' || stage.phase === 'save'
                ? 'review'
                : stage.phase;
    const hasCheckedField =
        Object.keys(checkedFieldPayload(review, fieldSections)).length > 0;

    useEffect(() => {
        if (open) {
            session.open();
        } else {
            session.close();
        }
        return () => session.close();
    }, [open, session]);

    useEffect(() => {
        if (!reviewDocument) return;
        setStage({ phase: 'ocr', documentId: reviewDocument.id });
        setFile(null);
        setReview(createReviewState(fieldSections, reviewDocument));
        setError(null);
        setFieldErrors({});
        setConfirmSave(false);
        setActiveReviewSection('declaration');
    }, [reviewDocument, fieldSections]);

    function reset() {
        setStage({ phase: 'file' });
        setFile(null);
        setCabinetId('');
        setDrawerId('');
        setItemId('');
        setReview(createReviewState(fieldSections));
        setError(null);
        setFieldErrors({});
        setConfirmSave(false);
        setActiveReviewSection('declaration');
    }

    useEffect(() => {
        if (!open || stage.phase !== 'ocr') return;

        const id = stage.documentId;
        return pollOcrStatus(
            (signal) => requestJson<OcrStatus>(ocr.url(id), { signal }),
            (payload) => {
                setError(null);
                if (payload.status === 'completed') {
                    setStage({
                        phase: 'review',
                        documentId: id,
                        pdfUrl: payload.pdfUrl,
                        mimeType: payload.mimeType,
                    });
                } else if (payload.status === 'failed') {
                    setError(payload.error || 'OCR failed for this document.');
                    setStage({
                        phase: 'ocr-failed',
                        documentId: id,
                        retryJob: true,
                    });
                }
            },
            (exception) => {
                const retryable =
                    !(exception instanceof DocumentRequestError) ||
                    exception.status === 429 ||
                    exception.status >= 500;
                setError(
                    retryable
                        ? 'OCR status is temporarily unavailable. Checking again automatically.'
                        : messageFrom(
                              exception,
                              'OCR status could not be read.',
                          ),
                );
                if (!retryable)
                    setStage({
                        phase: 'ocr-failed',
                        documentId: id,
                        retryJob: false,
                    });
                return retryable;
            },
        );
    }, [open, stage]);

    function close(next: boolean) {
        if (!next) {
            if (stage.phase === 'upload') return;
            session.close();
            if (stage.phase === 'map' || stage.phase === 'save') {
                setStage({ ...stage, phase: 'review' });
            } else if (stage.phase === 'retry-ocr') {
                setStage({ phase: 'ocr', documentId: stage.documentId });
            }
            if (documentId !== null) {
                router.reload({ only: ['documents'] });
            }
        }
        onOpenChange(next);
    }

    function startNewUpload() {
        if (pending !== null) return;
        reset();
    }

    async function retryOcr() {
        if (stage.phase !== 'ocr-failed' && stage.phase !== 'ocr') return;
        const id = stage.documentId;
        setError(null);
        if (stage.phase !== 'ocr-failed' || !stage.retryJob) {
            setStage({ phase: 'ocr', documentId: id });
            return;
        }
        setStage({ phase: 'retry-ocr', documentId: id });
        await session.run(
            (signal) =>
                requestJson(retryDocumentOcr.url(id), {
                    method: 'POST',
                    signal,
                }),
            () => setStage({ phase: 'ocr', documentId: id }),
            (exception) => {
                setError(messageFrom(exception, 'OCR could not be retried.'));
                setStage({
                    phase: 'ocr-failed',
                    documentId: id,
                    retryJob: true,
                });
            },
        );
    }

    async function upload() {
        if (!file || itemId === '' || stage.phase !== 'confirm') return;

        setStage({ phase: 'upload' });
        setError(null);
        const payload: UploadDocumentPayload = { file, book_id: itemId };
        const body = new FormData();
        body.append('file', payload.file);
        body.append('book_id', payload.book_id);

        await session.run(
            (signal) =>
                requestJson<{ id: number }>(store.url(), {
                    method: 'POST',
                    body,
                    signal,
                }),
            (result) => setStage({ phase: 'ocr', documentId: result.id }),
            (exception) => {
                setError(
                    messageFrom(
                        exception,
                        'The document could not be uploaded.',
                    ),
                );
                setStage({ phase: 'confirm' });
            },
        );
    }

    async function mapFields() {
        if (stage.phase !== 'review' || model === '') return;

        setStage({ ...stage, phase: 'map' });
        setError(null);
        await session.run(
            (signal) =>
                requestJson<{
                    fields: Partial<Record<MetadataField, string | null>>;
                }>(map.url(stage.documentId), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model }),
                    signal,
                }),
            (result) => {
                setReview((current) =>
                    mergeMappedFields(current, fieldSections, result.fields),
                );
                setConfirmSave(false);
            },
            (exception) =>
                setError(
                    messageFrom(exception, 'The fields could not be mapped.'),
                ),
            () => setStage({ ...stage, phase: 'review' }),
        );
    }

    async function saveChecked(force = false) {
        if (stage.phase !== 'review' || !hasCheckedField) return;
        if (
            !force &&
            fieldSections.some((section) => !review.checked[section.id])
        ) {
            setConfirmSave(true);
            return;
        }

        setStage({ ...stage, phase: 'save' });
        setConfirmSave(false);
        setError(null);
        setFieldErrors({});
        await session.run(
            (signal) =>
                requestJson(fields.url(stage.documentId), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(
                        checkedFieldPayload(review, fieldSections),
                    ),
                    signal,
                }),
            () => {
                toast.success('Checked fields saved.');
                close(false);
                reset();
            },
            (exception) => {
                const errors =
                    exception instanceof DocumentRequestError
                        ? exception.errors
                        : {};
                setFieldErrors(errors);
                const section = fieldSections.find((item) =>
                    item.fields.some((field) => errors[field.name]),
                );
                if (section) setActiveReviewSection(section.id);
                setError(
                    messageFrom(exception, 'The fields could not be saved.'),
                );
                setStage({ ...stage, phase: 'review' });
            },
        );
    }

    function updateValue(name: MetadataField, value: string) {
        setReview((current) =>
            updateReviewField(current, fieldSections, name, value),
        );
        setConfirmSave(false);
    }

    function setSectionChecked(key: string, next: boolean) {
        const section = fieldSections.find((item) => item.id === key);
        if (
            !section ||
            !sectionCanBeChecked(section, review.values, review.edited)
        )
            return;
        setReview((current) => ({
            ...current,
            checked: { ...current.checked, [key]: next },
        }));
        setConfirmSave(false);
    }

    function checkAll() {
        setReview((current) => ({
            ...current,
            checked: Object.fromEntries(
                fieldSections.map((section) => [
                    section.id,
                    sectionCanBeChecked(
                        section,
                        current.values,
                        current.edited,
                    ),
                ]),
            ),
        }));
        setConfirmSave(false);
    }

    function setStep(next: 'file' | 'confirm') {
        if (pending === null) setStage({ phase: next });
    }

    return {
        step,
        pending,
        busy: pending !== null,
        file,
        setFile,
        cabinetId,
        setCabinetId,
        drawerId,
        setDrawerId,
        itemId,
        setItemId,
        documentId,
        pdfUrl,
        mimeType,
        canDismiss: stage.phase !== 'upload',
        canRetryOcr:
            stage.phase === 'ocr-failed' ||
            (stage.phase === 'ocr' && error !== null),
        retryOcrLabel:
            stage.phase === 'ocr-failed' && stage.retryJob
                ? 'Retry OCR'
                : 'Check status',
        values: review.values,
        checked: review.checked,
        edited: review.edited,
        model,
        setModel,
        error,
        fieldErrors,
        confirmSave,
        setConfirmSave,
        activeReviewSection,
        setActiveReviewSection,
        hasCheckedField,
        close,
        retryOcr,
        startNewUpload,
        upload,
        mapFields,
        saveChecked,
        updateValue,
        setSectionChecked,
        checkAll,
        setStep,
    };
}
