import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    checkedFieldPayload,
    createReviewState,
    mergeMappedFields,
    sectionCanBeChecked,
    unusedMappedAttachments,
    updateReviewField,
    type MappedDocumentFields,
} from '@/pages/documents/lib/metadata';
import { createUploadSession } from '@/pages/documents/lib/upload-session';
import {
    canEnterUploadPreparationStep,
    getUploadPreparationSteps,
    getUploadProgress,
    getUploadStep,
} from '@/pages/documents/lib/upload-progress';
import { documentFileError } from '@/pages/documents/lib/upload-file';
import { resolveMappingModel } from '@/pages/documents/lib/mapping-models';
import {
    pollOcrStatus,
    type OcrStatus,
} from '@/pages/documents/lib/ocr-polling';
import type { ArchivedDocument, DocumentAttachment } from '@/types/documents';
import type {
    DocumentFieldSection,
    DocumentTypeOption,
    FilingPath,
    MetadataField,
    UploadDocumentPayload,
} from '@/pages/documents/types';
import {
    fields,
    index as documentsIndex,
    map,
    ocr,
    store,
} from '@/routes/documents';
import { store as storeAttachment } from '@/routes/documents/attachments';
import { retry as retryDocumentOcr } from '@/routes/documents/ocr';

type UploadStage =
    | { phase: 'destination' | 'file' | 'confirm' | 'upload' }
    | { phase: 'ocr' | 'retry-ocr'; documentId: number }
    | { phase: 'ocr-failed'; documentId: number; retryJob: boolean }
    | {
          phase: 'ocr-complete' | 'review' | 'map' | 'save';
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

function reviewSectionId(
    sections: DocumentFieldSection[],
    usesTaxFields: boolean,
): string {
    if (
        usesTaxFields &&
        sections.some((section) => section.id === 'declaration')
    ) {
        return 'declaration';
    }

    return sections[0]?.id ?? 'document';
}

export function useDocumentUpload({
    open,
    onOpenChange,
    mappingModels,
    documentTypes,
    fieldSections,
    metadataFieldSections,
    reviewDocument,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mappingModels: string[];
    documentTypes: DocumentTypeOption[];
    fieldSections: DocumentFieldSection[];
    metadataFieldSections: DocumentFieldSection[];
    reviewDocument?: ArchivedDocument | null;
}) {
    const [session] = useState(createUploadSession);
    const [stage, setStage] = useState<UploadStage>({ phase: 'destination' });
    const [file, setFile] = useState<File | null>(null);
    const [cabinetId, setCabinetId] = useState('');
    const [drawerId, setDrawerId] = useState('');
    const [itemId, setItemId] = useState('');
    const [documentTypeId, setDocumentTypeId] = useState('');
    const [filingPath, setFilingPath] = useState<FilingPath>('archive');
    const changedOfficeForUpload = useRef(false);
    const selectedType = documentTypes.find(
        (type) => String(type.id) === documentTypeId,
    );
    const usesTaxFields =
        selectedType?.usesTaxFields ?? reviewDocument?.usesTaxFields ?? true;
    const activeFieldSections = usesTaxFields
        ? fieldSections
        : metadataFieldSections;
    const [review, setReview] = useState(() =>
        createReviewState([...fieldSections, ...metadataFieldSections]),
    );
    const [selectedModel, setModel] = useState('');
    const model = resolveMappingModel(mappingModels, selectedModel);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [confirmSave, setConfirmSave] = useState(false);
    const [attachments, setAttachments] = useState<DocumentAttachment[]>([]);
    const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
    const [activeReviewSection, setActiveReviewSection] = useState(() =>
        reviewSectionId(fieldSections, true),
    );
    const documentId = 'documentId' in stage ? stage.documentId : null;
    const pdfUrl = 'pdfUrl' in stage ? stage.pdfUrl : null;
    const mimeType = 'mimeType' in stage ? stage.mimeType : file?.type;
    const pending =
        stage.phase === 'upload' ||
        stage.phase === 'ocr' ||
        stage.phase === 'ocr-complete' ||
        stage.phase === 'retry-ocr'
            ? 'upload'
            : stage.phase === 'map' || stage.phase === 'save'
              ? stage.phase
              : null;
    const step = getUploadStep(stage.phase);
    const hasCheckedField =
        Object.keys(checkedFieldPayload(review, activeFieldSections)).length >
        0;

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
        setDocumentTypeId(
            reviewDocument.documentTypeId
                ? String(reviewDocument.documentTypeId)
                : '',
        );
        setStage({ phase: 'ocr', documentId: reviewDocument.id });
        setFile(null);
        setReview(
            createReviewState(
                [...fieldSections, ...metadataFieldSections],
                reviewDocument,
            ),
        );
        setError(null);
        setFieldErrors({});
        setConfirmSave(false);
        setAttachments(reviewDocument.attachments);
        setTitleSuggestions([]);
        setActiveReviewSection(
            reviewSectionId(
                reviewDocument.usesTaxFields
                    ? fieldSections
                    : metadataFieldSections,
                reviewDocument.usesTaxFields,
            ),
        );
    }, [reviewDocument, fieldSections, metadataFieldSections]);

    function reset() {
        setStage({ phase: 'destination' });
        setFile(null);
        setCabinetId('');
        setDrawerId('');
        setItemId('');
        setDocumentTypeId('');
        setFilingPath('archive');
        setReview(
            createReviewState([...fieldSections, ...metadataFieldSections]),
        );
        setError(null);
        setFieldErrors({});
        setConfirmSave(false);
        setAttachments([]);
        setTitleSuggestions([]);
        setActiveReviewSection(reviewSectionId(fieldSections, true));
    }

    useEffect(() => {
        if (!open || stage.phase !== 'ocr') return;

        const id = stage.documentId;
        return pollOcrStatus(
            (signal) => requestJson<OcrStatus>(ocr.url(id), { signal }),
            (payload) => {
                setError(null);
                if (payload.status === 'completed') {
                    setReview(
                        createReviewState([
                            ...fieldSections,
                            ...metadataFieldSections,
                        ]),
                    );
                    setTitleSuggestions([]);
                    setAttachments(reviewDocument?.attachments ?? []);
                    setActiveReviewSection(
                        reviewSectionId(activeFieldSections, usesTaxFields),
                    );
                    setStage({
                        phase: 'ocr-complete',
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

    const finishOcrProgress = useCallback(() => {
        setStage((current) =>
            current.phase === 'ocr-complete'
                ? { ...current, phase: 'review' }
                : current,
        );
    }, []);

    function close(next: boolean) {
        if (!next) {
            if (stage.phase === 'upload' || stage.phase === 'save') return;
            session.close();
            if (stage.phase === 'map') {
                setStage({ ...stage, phase: 'review' });
            } else if (stage.phase === 'retry-ocr') {
                setStage({ phase: 'ocr', documentId: stage.documentId });
            }
            if (changedOfficeForUpload.current) {
                changedOfficeForUpload.current = false;
                router.get(documentsIndex.url());
            } else if (documentId !== null) {
                router.reload({
                    only: ['documents', 'cabinets', 'recentArchiveItemIds'],
                    preserveErrors: true,
                });
            } else {
                reset();
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
        const placingInArchive = filingPath === 'archive';
        const [, uploadStep] = getUploadPreparationSteps(filingPath);
        if (
            !file ||
            (placingInArchive && itemId === '') ||
            stage.phase !== uploadStep
        ) {
            return;
        }

        const fileError = documentFileError(file);
        if (fileError) {
            setError(fileError);
            setStage({ phase: 'file' });
            return;
        }

        setStage({ phase: 'upload' });
        setError(null);
        const payload: UploadDocumentPayload = {
            file,
            document_type_id: null,
            filing_path: filingPath,
            ...(placingInArchive ? { book_id: itemId } : {}),
        };
        const body = new FormData();
        body.append('file', payload.file);
        body.append('document_type_id', '');
        body.append('filing_path', payload.filing_path);
        if (payload.book_id) {
            body.append('book_id', payload.book_id);
        }

        await session.run(
            (signal) =>
                requestJson<{
                    id: number;
                    switchedOffice: boolean;
                    office: {
                        officeId: number;
                        officeName: string;
                        officePermissions: {
                            canManageRouting: boolean;
                            canRouteDocuments: boolean;
                            canUploadToReceiving: boolean;
                            canManageDocumentTypes: boolean;
                        };
                    } | null;
                }>(store.url(), {
                    method: 'POST',
                    body,
                    signal,
                }),
            (result) => {
                const continueReview = () =>
                    setStage({ phase: 'ocr', documentId: result.id });
                if (result.switchedOffice && result.office) {
                    toast.info(
                        'Switched to Receiving to complete OCR and mapping.',
                    );
                    changedOfficeForUpload.current = true;
                    const office = result.office;
                    router.replace({
                        props: (props) => ({ ...props, ...office }),
                        preserveState: true,
                        preserveScroll: true,
                        onFinish: continueReview,
                    });
                } else {
                    continueReview();
                }
            },
            (exception) => {
                setError(
                    messageFrom(
                        exception,
                        'The document could not be uploaded.',
                    ),
                );
                setStage({ phase: uploadStep });
            },
        );
    }

    async function mapFields() {
        if (stage.phase !== 'review' || model === '') return;
        setStage({ ...stage, phase: 'map' });
        setError(null);
        const documentKey = stage.documentId;
        const currentAttachments = attachments;
        const persistAttachments = !usesTaxFields;

        await session.run(
            async (signal) => {
                const result = await requestJson<{
                    fields: MappedDocumentFields;
                    titleSuggestions?: string[];
                }>(map.url(documentKey), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model, tax_fields: usesTaxFields }),
                    signal,
                });
                const mapped = {
                    fields: result.fields,
                    titleSuggestions: result.titleSuggestions ?? [],
                };
                const unused = persistAttachments
                    ? unusedMappedAttachments(
                          currentAttachments,
                          result.fields.attachments,
                      )
                    : [];

                if (unused.length === 0) {
                    return {
                        ...mapped,
                        attachments: null,
                        addedCount: 0,
                        attachmentError: null,
                    };
                }

                let latest = currentAttachments;

                try {
                    for (const item of unused) {
                        const body = await requestJson<{
                            document: ArchivedDocument;
                        }>(storeAttachment.url(documentKey), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                description: item.description,
                                page: item.page,
                            }),
                            signal,
                        });
                        latest = body.document.attachments;
                    }

                    return {
                        ...mapped,
                        attachments: latest,
                        addedCount: unused.length,
                        attachmentError: null,
                    };
                } catch (error) {
                    return {
                        ...mapped,
                        attachments:
                            latest === currentAttachments ? null : latest,
                        addedCount: Math.max(
                            0,
                            latest.length - currentAttachments.length,
                        ),
                        attachmentError: messageFrom(
                            error,
                            'The listed attachments could not be saved.',
                        ),
                    };
                }
            },
            (result) => {
                setTitleSuggestions(result.titleSuggestions);
                setReview((current) =>
                    mergeMappedFields(
                        current,
                        activeFieldSections,
                        result.fields,
                    ),
                );
                setConfirmSave(false);
                if (result.attachments !== null) {
                    setAttachments(result.attachments);
                }
                if (result.addedCount > 0) {
                    toast.success(
                        result.addedCount === 1
                            ? 'Attachment listed.'
                            : `${result.addedCount} attachments listed.`,
                    );
                }
                if (result.attachmentError !== null) {
                    setError(result.attachmentError);
                }
            },
            (exception) =>
                setError(
                    messageFrom(exception, 'The fields could not be mapped.'),
                ),
            () => setStage({ ...stage, phase: 'review' }),
        );
    }

    async function saveChecked(force = false) {
        if (stage.phase !== 'review' || documentTypeId === '') return;
        if (
            !force &&
            hasCheckedField &&
            activeFieldSections.some((section) => !review.checked[section.id])
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
                    body: JSON.stringify({
                        ...checkedFieldPayload(review, activeFieldSections),
                        document_type_id: documentTypeId,
                    }),
                    signal,
                }),
            () => {
                toast.success('Document saved.');
                close(false);
                reset();
            },
            (exception) => {
                const errors =
                    exception instanceof DocumentRequestError
                        ? exception.errors
                        : {};
                setFieldErrors(errors);
                const section = activeFieldSections.find((item) =>
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
            updateReviewField(current, activeFieldSections, name, value),
        );
        setConfirmSave(false);
    }

    function setSectionChecked(key: string, next: boolean) {
        const section = activeFieldSections.find((item) => item.id === key);
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
                activeFieldSections.map((section) => [
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

    function chooseDestination(next: FilingPath) {
        if (pending !== null || documentId !== null) return;
        setFilingPath(next);
        setError(null);
        const [firstStep] = getUploadPreparationSteps(next);
        setStage({ phase: firstStep });
    }

    function selectDocumentType(next: string) {
        if (stage.phase !== 'review' || next === documentTypeId) return;
        const type = documentTypes.find((item) => String(item.id) === next);
        if (!type) return;
        setDocumentTypeId(next);
        setReview((current) => ({ ...current, checked: {} }));
        setActiveReviewSection(
            reviewSectionId(
                type.usesTaxFields ? fieldSections : metadataFieldSections,
                type.usesTaxFields,
            ),
        );
        setConfirmSave(false);
        setFieldErrors({});
        setError(null);
    }

    function setStep(next: 'destination' | 'file' | 'confirm') {
        if (pending !== null || documentId !== null) return;
        if (
            !canEnterUploadPreparationStep(next, {
                filingPath,
                hasFile: file !== null,
                hasArchiveLocation: itemId !== '',
            })
        )
            return;
        setError(null);
        setStage({ phase: next });
    }

    function selectFile(next: File | null) {
        if (pending !== null || documentId !== null) return;
        const fileError = next ? documentFileError(next) : null;
        setError(fileError);
        setFile(fileError ? null : next);
    }

    function saveAttachments(document: ArchivedDocument) {
        setAttachments(document.attachments);
    }

    return {
        step,
        uploadProgress: getUploadProgress(stage.phase),
        ocrComplete: stage.phase === 'ocr-complete',
        finishOcrProgress,
        pending,
        busy: pending !== null,
        file,
        setFile: selectFile,
        cabinetId,
        setCabinetId,
        drawerId,
        setDrawerId,
        itemId,
        setItemId,
        documentTypeId,
        setDocumentTypeId: selectDocumentType,
        filingPath,
        chooseDestination,
        activeFieldSections,
        documentId,
        uploading: stage.phase === 'upload',
        pdfUrl,
        mimeType,
        canDismiss: stage.phase !== 'upload' && stage.phase !== 'save',
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
        usesTaxFields,
        attachments,
        saveAttachments,
        titleSuggestions,
        setTitleSuggestions,
    };
}
