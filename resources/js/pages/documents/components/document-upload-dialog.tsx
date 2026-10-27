import { router } from '@inertiajs/react';
import { ScanLine } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import ClientOnly from '@/components/client-only';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useClientComponent } from '@/hooks/use-client-component';
import { formatFileSize } from '../lib/formatters';
import { metadataSections } from '../lib/metadata';
import type { ArchivePlacementCabinet, MetadataField } from '../types';
import DeclarationNumberSearch from './declaration-number-search';

type Step = 'file' | 'confirm' | 'ocr' | 'review';

type FieldValues = Record<MetadataField, string>;

type DocumentUploadDialogProps = {
    archive: ArchivePlacementCabinet[];
    mappingModels: string[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function loadPdfPreview() {
    return import('@/components/pdf-preview');
}

function ClientPdfPreview({ url, title }: { url: string; title: string }) {
    const PdfPreview = useClientComponent(loadPdfPreview);

    if (!PdfPreview) {
        return (
            <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-600 dark:text-neutral-300">
                <Spinner />
                Loading PDF viewer…
            </div>
        );
    }

    return <PdfPreview url={url} title={title} />;
}

function csrfToken(): string {
    const cookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='));

    return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : '';
}

function blankFields(): FieldValues {
    const fields = { remarks: '' } as FieldValues;

    for (const section of metadataSections) {
        for (const field of section.fields) {
            fields[field.name] = '';
        }
    }

    return fields;
}

function fieldNames(): MetadataField[] {
    return Object.keys(blankFields()) as MetadataField[];
}

const BOUNDARY_FIELDS: MetadataField[] = [
    'boundary_north',
    'boundary_south',
    'boundary_east',
    'boundary_west',
];

const REMARKS_KEY = 'remarks';

function filled(value: string | undefined): boolean {
    return (value ?? '').trim() !== '';
}

function sectionKey(title: string): string {
    return `section:${title}`;
}

function boundaryHasText(values: FieldValues): boolean {
    return BOUNDARY_FIELDS.some((name) => filled(values[name]));
}

function sectionCanBeChecked(
    section: (typeof metadataSections)[number],
    values: FieldValues,
): boolean {
    const hasField = section.fields.some(
        (field) =>
            !field.name.startsWith('boundary_') && filled(values[field.name]),
    );

    return (
        hasField ||
        (section.title === 'Land details' && boundaryHasText(values))
    );
}

function checklistKeys(): string[] {
    return [
        ...metadataSections.map((section) => sectionKey(section.title)),
        REMARKS_KEY,
    ];
}

function itemCanBeChecked(key: string, values: FieldValues): boolean {
    if (key === REMARKS_KEY) {
        return filled(values.remarks);
    }

    const section = metadataSections.find(
        (item) => sectionKey(item.title) === key,
    );

    return section ? sectionCanBeChecked(section, values) : false;
}

function sectionKeyForField(name: MetadataField): string {
    const section = metadataSections.find((item) =>
        item.fields.some((field) => field.name === name),
    );

    return section ? sectionKey(section.title) : name;
}

async function errorMessage(response: Response): Promise<string> {
    const body = (await response.json().catch(() => null)) as {
        message?: string;
        errors?: Record<string, string[]>;
    } | null;
    const first = body?.errors ? Object.values(body.errors)[0]?.[0] : null;

    return first || body?.message || 'The request failed.';
}

export default function DocumentUploadDialog({
    archive,
    mappingModels = [],
    open,
    onOpenChange,
}: DocumentUploadDialogProps) {
    const openRef = useRef(open);
    const [step, setStep] = useState<Step>('file');
    const [file, setFile] = useState<File | null>(null);
    const [cabinetId, setCabinetId] = useState('');
    const [drawerId, setDrawerId] = useState('');
    const [bookId, setBookId] = useState('');
    const [documentId, setDocumentId] = useState<number | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [values, setValues] = useState<FieldValues>(blankFields);
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [model, setModel] = useState(
        mappingModels.includes('gpt-oss:20b')
            ? 'gpt-oss:20b'
            : (mappingModels[0] ?? ''),
    );
    const [pending, setPending] = useState<null | 'upload' | 'map' | 'save'>(
        null,
    );
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [confirmSave, setConfirmSave] = useState(false);

    const cabinetsWithBooks = useMemo(
        () =>
            archive.filter((cabinet) =>
                cabinet.drawers.some((drawer) => drawer.books.length > 0),
            ),
        [archive],
    );
    const selectedCabinet = cabinetsWithBooks.find(
        (cabinet) => cabinet.id === cabinetId,
    );
    const drawersWithBooks = selectedCabinet?.drawers.filter(
        (drawer) => drawer.books.length > 0,
    );
    const selectedDrawer = drawersWithBooks?.find(
        (drawer) => drawer.id === drawerId,
    );
    const hasCheckedField = checklistKeys().some(
        (key) => checked[key] === true && itemCanBeChecked(key, values),
    );
    const busy = pending !== null;

    useEffect(() => {
        openRef.current = open;
    }, [open]);

    useEffect(() => {
        if (open) {
            return;
        }

        setStep('file');
        setFile(null);
        setCabinetId('');
        setDrawerId('');
        setBookId('');
        setDocumentId(null);
        setPdfUrl(null);
        setValues(blankFields());
        setChecked({});
        setPending(null);
        setError(null);
        setFieldErrors({});
        setConfirmSave(false);
    }, [open]);

    useEffect(() => {
        if (!open || step !== 'ocr' || documentId === null) {
            return;
        }

        let stopped = false;
        let timer = 0;

        const poll = async () => {
            try {
                const response = await fetch(`/documents/${documentId}/ocr`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });

                if (!response.ok) {
                    throw new Error(await errorMessage(response));
                }

                const payload = (await response.json()) as {
                    status: string;
                    error: string | null;
                    pdfUrl: string | null;
                    mimeType?: string | null;
                };

                if (stopped) {
                    return;
                }

                if (payload.status === 'completed') {
                    setPdfUrl(payload.pdfUrl);
                    setStep('review');
                    setPending(null);

                    return;
                }

                if (payload.status === 'failed') {
                    setError(payload.error || 'OCR failed for this document.');
                    setPending(null);

                    return;
                }

                timer = window.setTimeout(() => {
                    void poll();
                }, 2000);
            } catch (exception) {
                if (!stopped) {
                    setError(
                        exception instanceof Error
                            ? exception.message
                            : 'OCR status could not be read.',
                    );
                    setPending(null);
                }
            }
        };

        void poll();

        return () => {
            stopped = true;
            window.clearTimeout(timer);
        };
    }, [documentId, open, step]);

    function close(next: boolean) {
        if (!next && documentId !== null) {
            router.reload({ only: ['documents'] });
        }

        onOpenChange(next);
    }

    async function upload() {
        if (!file || bookId === '') {
            return;
        }

        setPending('upload');
        setError(null);
        const body = new FormData();
        body.append('file', file);
        body.append('book_id', bookId);

        try {
            const response = await fetch('/documents', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': csrfToken(),
                },
                credentials: 'same-origin',
                body,
            });

            if (!response.ok) {
                throw new Error(await errorMessage(response));
            }

            const payload = (await response.json()) as { id: number };

            if (!openRef.current) {
                router.reload({ only: ['documents'] });

                return;
            }

            setDocumentId(payload.id);
            setStep('ocr');
        } catch (exception) {
            setError(
                exception instanceof Error
                    ? exception.message
                    : 'The document could not be uploaded.',
            );
            setPending(null);
        }
    }

    async function mapFields() {
        if (documentId === null || model === '') {
            return;
        }

        setPending('map');
        setError(null);

        try {
            const response = await fetch(`/documents/${documentId}/map`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': csrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ model }),
            });

            if (!response.ok) {
                throw new Error(await errorMessage(response));
            }

            const payload = (await response.json()) as {
                fields: Record<string, string | null>;
            };
            setValues((current) => {
                const next = { ...current };

                for (const name of fieldNames()) {
                    const value = payload.fields[name];
                    next[name] = typeof value === 'string' ? value : '';
                }

                return next;
            });
            setChecked({});
            setConfirmSave(false);
        } catch (exception) {
            setError(
                exception instanceof Error
                    ? exception.message
                    : 'The fields could not be mapped.',
            );
        } finally {
            setPending(null);
        }
    }

    async function saveChecked(force = false) {
        if (documentId === null || !hasCheckedField) {
            return;
        }

        if (
            !force &&
            checklistKeys().some((key) => checked[key] !== true)
        ) {
            setConfirmSave(true);

            return;
        }

        setConfirmSave(false);
        setPending('save');
        setError(null);
        setFieldErrors({});
        const payload: Record<string, string> = {};

        for (const section of metadataSections) {
            if (checked[sectionKey(section.title)] !== true) {
                continue;
            }

            for (const field of section.fields) {
                if (filled(values[field.name])) {
                    payload[field.name] = values[field.name];
                }
            }
        }

        if (checked[REMARKS_KEY] === true && filled(values.remarks)) {
            payload.remarks = values.remarks;
        }

        try {
            const response = await fetch(`/documents/${documentId}/fields`, {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': csrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const body = (await response.json().catch(() => null)) as {
                    message?: string;
                    errors?: Record<string, string[]>;
                } | null;
                const errors: Record<string, string> = {};

                for (const [key, messages] of Object.entries(
                    body?.errors ?? {},
                )) {
                    if (messages[0]) {
                        errors[key] = messages[0];
                    }
                }

                setFieldErrors(errors);
                throw new Error(
                    Object.values(errors)[0] ||
                        body?.message ||
                        'The fields could not be saved.',
                );
            }

            toast.success('Checked fields saved.');
            close(false);
        } catch (exception) {
            setError(
                exception instanceof Error
                    ? exception.message
                    : 'The fields could not be saved.',
            );
            setPending(null);
        }
    }

    function updateValue(name: MetadataField, value: string) {
        setValues((current) => ({ ...current, [name]: value }));
        setChecked((current) => ({
            ...current,
            [sectionKeyForField(name)]: false,
        }));
        setConfirmSave(false);
    }

    function setSectionChecked(key: string, next: boolean) {
        if (!itemCanBeChecked(key, values)) {
            return;
        }

        setChecked((current) => ({ ...current, [key]: next }));
        setConfirmSave(false);
    }

    function checkAll() {
        setChecked((current) => {
            const next = { ...current };

            for (const key of checklistKeys()) {
                next[key] = itemCanBeChecked(key, values);
            }

            return next;
        });
        setConfirmSave(false);
    }

    const reviewing = step === 'review';

    return (
        <>
            <Button
                type="button"
                aria-label="Upload document"
                title="Upload document"
                onClick={() => onOpenChange(true)}
                className="fixed right-5 bottom-5 z-40 size-14 rounded-full bg-blue-900 text-white shadow-lg shadow-slate-950/20 transition-transform hover:scale-105 hover:bg-blue-800 sm:right-8 sm:bottom-8 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
                <ScanLine aria-hidden="true" className="size-6" />
            </Button>

            <Dialog open={open} onOpenChange={close}>
                <DialogContent
                    className={
                        reviewing
                            ? 'flex max-h-[92vh] flex-col overflow-hidden rounded-none sm:max-w-6xl dark:border-neutral-800 dark:bg-black'
                            : 'max-h-[90vh] overflow-y-auto rounded-none sm:max-w-2xl dark:border-neutral-800 dark:bg-black'
                    }
                >
                    <DialogHeader>
                        <DialogTitle>
                            {step === 'file' && 'Add document to archive'}
                            {step === 'confirm' && 'Confirm upload'}
                            {step === 'ocr' && 'Reading the document'}
                            {step === 'review' && 'Review mapped fields'}
                        </DialogTitle>
                        <DialogDescription>
                            {step === 'file' &&
                                'Choose a scanned PDF or image. Nothing is stored until you confirm the upload.'}
                            {step === 'confirm' &&
                                'Choose where to file this document, then confirm the upload.'}
                            {step === 'ocr' &&
                                'The file is in the archive. OCR runs before the fields can be mapped.'}
                            {step === 'review' &&
                                'Map the OCR text, check the fields you want to keep, then save.'}
                        </DialogDescription>
                    </DialogHeader>

                    {step === 'file' && (
                        <div className="grid gap-2">
                            <Label htmlFor="document-file">
                                Scanned document
                            </Label>
                            <Input
                                id="document-file"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff,application/pdf,image/jpeg,image/png,image/tiff"
                                onChange={(event) =>
                                    setFile(event.target.files?.[0] ?? null)
                                }
                                className="h-auto rounded-none border-dashed p-3 file:mr-3 file:rounded-none file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:font-medium file:text-blue-950 dark:file:bg-blue-950 dark:file:text-blue-100"
                            />
                            <p className="text-xs text-slate-500 dark:text-neutral-400">
                                PDF, JPEG, PNG, or TIFF · maximum file size 50
                                MB
                            </p>
                        </div>
                    )}

                    {step === 'confirm' && file && (
                        <div className="grid gap-5">
                            <p className="text-sm text-slate-700 dark:text-neutral-300">
                                Upload{' '}
                                <span className="font-medium">
                                    {file.name}
                                </span>{' '}
                                ({formatFileSize(file.size)})?
                            </p>
                            <ArchiveSelectors
                                cabinets={cabinetsWithBooks}
                                cabinetId={cabinetId}
                                drawerId={drawerId}
                                bookId={bookId}
                                drawers={drawersWithBooks ?? []}
                                books={selectedDrawer?.books ?? []}
                                onCabinetChange={(value) => {
                                    setCabinetId(value);
                                    setDrawerId('');
                                    setBookId('');
                                }}
                                onDrawerChange={(value) => {
                                    setDrawerId(value);
                                    setBookId('');
                                }}
                                onBookChange={setBookId}
                            />
                        </div>
                    )}

                    {step === 'ocr' && (
                        <div className="flex items-center gap-3 py-6 text-sm text-slate-700 dark:text-neutral-300">
                            {!error && <Spinner />}
                            <span>
                                {error
                                    ? error
                                    : 'Waiting for OCR to finish. This can take a few minutes.'}
                            </span>
                        </div>
                    )}

                    {reviewing && (
                        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
                            <div className="min-h-80 overflow-hidden border border-slate-200 dark:border-neutral-800">
                                {pdfUrl &&
                                (pdfUrl.includes('/ocr-pdf') ||
                                    file?.type === 'application/pdf') ? (
                                    <ClientOnly
                                        fallback={
                                            <div className="flex min-h-64 items-center justify-center">
                                                <Spinner />
                                            </div>
                                        }
                                    >
                                        <ClientPdfPreview
                                            url={pdfUrl}
                                            title={file?.name ?? 'Document'}
                                        />
                                    </ClientOnly>
                                ) : pdfUrl ? (
                                    <div className="flex min-h-80 items-center justify-center overflow-auto bg-slate-100 p-2 dark:bg-neutral-900">
                                        <img
                                            src={pdfUrl}
                                            alt={file?.name ?? 'Document'}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <p className="p-4 text-sm text-slate-600 dark:text-neutral-400">
                                        The document preview is not available.
                                    </p>
                                )}
                            </div>
                            <div className="grid max-h-[68vh] content-start gap-4 overflow-y-auto pr-1">
                                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                                    <div className="grid gap-2">
                                        <Label htmlFor="mapping-model">
                                            Model
                                        </Label>
                                        <Select
                                            value={model}
                                            onValueChange={(value) =>
                                                setModel(String(value ?? ''))
                                            }
                                            items={mappingModels.map(
                                                (item) => ({
                                                    value: item,
                                                    label: item,
                                                }),
                                            )}
                                        >
                                            <SelectTrigger
                                                id="mapping-model"
                                                className="w-full rounded-none"
                                            >
                                                <SelectValue placeholder="Select a model" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none">
                                                {mappingModels.map((item) => (
                                                    <SelectItem
                                                        key={item}
                                                        value={item}
                                                        className="rounded-none"
                                                    >
                                                        {item}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={busy}
                                            onClick={checkAll}
                                            className="rounded-none"
                                        >
                                            Check all
                                        </Button>
                                        <Button
                                            type="button"
                                            disabled={busy || model === ''}
                                            onClick={() => void mapFields()}
                                            className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                                        >
                                            {pending === 'map'
                                                ? 'Mapping…'
                                                : 'Map'}
                                        </Button>
                                    </div>
                                </div>

                                {metadataSections.map((section) => (
                                    <section key={section.title}>
                                        <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-neutral-800">
                                            <input
                                                id={`document-section-${section.title.replaceAll(' ', '-').toLowerCase()}`}
                                                type="checkbox"
                                                checked={
                                                    checked[
                                                        sectionKey(
                                                            section.title,
                                                        )
                                                    ] === true &&
                                                    sectionCanBeChecked(
                                                        section,
                                                        values,
                                                    )
                                                }
                                                disabled={
                                                    busy ||
                                                    !sectionCanBeChecked(
                                                        section,
                                                        values,
                                                    )
                                                }
                                                onChange={(event) =>
                                                    setSectionChecked(
                                                        sectionKey(
                                                            section.title,
                                                        ),
                                                        event.target.checked,
                                                    )
                                                }
                                                className="size-4 accent-blue-900"
                                            />
                                            <Label
                                                htmlFor={`document-section-${section.title.replaceAll(' ', '-').toLowerCase()}`}
                                                className="text-sm font-semibold text-slate-900 dark:text-neutral-100"
                                            >
                                                {section.title}
                                            </Label>
                                        </div>
                                        <div className="grid gap-4">
                                            {section.fields
                                                .filter(
                                                    (field) =>
                                                        !field.name.startsWith(
                                                            'boundary_',
                                                        ),
                                                )
                                                .map((field) => (
                                                <FieldRow
                                                    key={field.name}
                                                    id={`document-${field.name}`}
                                                    label={field.label}
                                                    error={
                                                        fieldErrors[field.name]
                                                    }
                                                >
                                                    {field.name ===
                                                    'previous_tax_declaration_number' ? (
                                                        <DeclarationNumberSearch
                                                            id={`document-${field.name}`}
                                                            value={
                                                                values[
                                                                    field.name
                                                                ]
                                                            }
                                                            onChange={(
                                                                value,
                                                                match,
                                                            ) => {
                                                                updateValue(
                                                                    field.name,
                                                                    value,
                                                                );

                                                                if (
                                                                    match?.declarationDate
                                                                ) {
                                                                    updateValue(
                                                                        'previous_declaration_date',
                                                                        match.declarationDate,
                                                                    );
                                                                }
                                                            }}
                                                            excludeNumber={
                                                                values.tax_declaration_number
                                                            }
                                                            maxLength={
                                                                field.maxLength
                                                            }
                                                            disabled={busy}
                                                        />
                                                    ) : (
                                                        <Input
                                                            id={`document-${field.name}`}
                                                            type={
                                                                field.type ??
                                                                (field.name ===
                                                                'area'
                                                                    ? 'number'
                                                                    : 'text')
                                                            }
                                                            step={
                                                                field.name ===
                                                                'area'
                                                                    ? '0.0001'
                                                                    : undefined
                                                            }
                                                            min={
                                                                field.name ===
                                                                'area'
                                                                    ? '0'
                                                                    : undefined
                                                            }
                                                            value={
                                                                values[
                                                                    field.name
                                                                ]
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                updateValue(
                                                                    field.name,
                                                                    event
                                                                        .target
                                                                        .value,
                                                                )
                                                            }
                                                            maxLength={
                                                                field.maxLength
                                                            }
                                                            className="rounded-none"
                                                        />
                                                    )}
                                                </FieldRow>
                                            ))}
                                            {section.title === 'Land details' && (
                                                <BoundaryEditor
                                                    values={values}
                                                    errors={fieldErrors}
                                                    busy={busy}
                                                    onValueChange={updateValue}
                                                />
                                            )}
                                        </div>
                                    </section>
                                ))}

                                <section>
                                    <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-neutral-800">
                                        <input
                                            id="document-remarks-check"
                                            type="checkbox"
                                            checked={
                                                checked[REMARKS_KEY] === true &&
                                                filled(values.remarks)
                                            }
                                            disabled={
                                                busy || !filled(values.remarks)
                                            }
                                            onChange={(event) =>
                                                setSectionChecked(
                                                    REMARKS_KEY,
                                                    event.target.checked,
                                                )
                                            }
                                            className="size-4 accent-blue-900"
                                        />
                                        <Label
                                            htmlFor="document-remarks-check"
                                            className="text-sm font-semibold text-slate-900 dark:text-neutral-100"
                                        >
                                            Remarks
                                        </Label>
                                    </div>
                                    <textarea
                                        id="document-remarks"
                                        value={values.remarks}
                                        aria-label="Remarks"
                                        onChange={(event) =>
                                            updateValue(
                                                'remarks',
                                                event.target.value,
                                            )
                                        }
                                        maxLength={10000}
                                        rows={3}
                                        className="w-full min-w-0 rounded-none border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    />
                                    <InputError message={fieldErrors.remarks} />
                                </section>
                            </div>
                        </div>
                    )}

                    {error && step !== 'ocr' && <InputError message={error} />}

                    <DialogFooter>
                        {step === 'file' && (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => close(false)}
                                    className="rounded-none"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    disabled={!file}
                                    onClick={() => setStep('confirm')}
                                    className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    Continue
                                </Button>
                            </>
                        )}
                        {step === 'confirm' && (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() => setStep('file')}
                                    className="rounded-none"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    disabled={busy || bookId === ''}
                                    onClick={() => void upload()}
                                    className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    {pending === 'upload'
                                        ? 'Uploading…'
                                        : 'Upload'}
                                </Button>
                            </>
                        )}
                        {step === 'ocr' && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => close(false)}
                                className="rounded-none"
                            >
                                Close
                            </Button>
                        )}
                        {reviewing && confirmSave && (
                            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <p className="text-sm text-slate-700 dark:text-neutral-300">
                                    Some sections are not checked. Would you like
                                    to continue saving?
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() => setConfirmSave(false)}
                                    className="rounded-none"
                                >
                                    Go back
                                </Button>
                                <Button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void saveChecked(true)}
                                    className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    {pending === 'save'
                                        ? 'Saving…'
                                        : 'Continue'}
                                </Button>
                            </div>
                        )}
                        {reviewing && !confirmSave && (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() => close(false)}
                                    className="rounded-none"
                                >
                                    Close
                                </Button>
                                <Button
                                    type="button"
                                    disabled={busy || !hasCheckedField}
                                    onClick={() => void saveChecked()}
                                    className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    {pending === 'save'
                                        ? 'Saving…'
                                        : 'Save checked fields'}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function BoundaryEditor({
    values,
    errors,
    busy,
    onValueChange,
}: {
    values: FieldValues;
    errors: Record<string, string>;
    busy: boolean;
    onValueChange: (name: MetadataField, value: string) => void;
}) {
    const corner = 'bg-slate-50 dark:bg-neutral-900';
    const sides: {
        name: MetadataField;
        direction: string;
        label: string;
    }[] = [
        { name: 'boundary_north', direction: 'N', label: 'North' },
        { name: 'boundary_west', direction: 'W', label: 'West' },
        { name: 'boundary_east', direction: 'E', label: 'East' },
        { name: 'boundary_south', direction: 'S', label: 'South' },
    ];

    function cell(side: (typeof sides)[number]) {
        return (
            <div
                key={side.name}
                className="flex min-h-16 min-w-0 flex-col gap-1 bg-card p-2"
            >
                <Label
                    htmlFor={`document-${side.name}`}
                    className="text-[10px] font-semibold text-blue-900 dark:text-blue-300"
                >
                    <abbr title={side.label} className="no-underline">
                        {side.direction}
                    </abbr>
                </Label>
                <Input
                    id={`document-${side.name}`}
                    value={values[side.name]}
                    disabled={busy}
                    maxLength={255}
                    aria-label={`${side.label} boundary`}
                    onChange={(event) =>
                        onValueChange(side.name, event.target.value)
                    }
                    className="h-8 rounded-none text-xs"
                />
                <InputError message={errors[side.name]} />
            </div>
        );
    }

    return (
        <div className="grid min-w-0 gap-2">
            <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                Boundaries
            </p>
            <div className="grid grid-cols-3 gap-px border border-slate-200 bg-slate-200 dark:border-neutral-800 dark:bg-neutral-800">
                <div className={corner} />
                {cell(sides[0])}
                <div className={corner} />
                {cell(sides[1])}
                <div className="flex min-h-16 flex-col items-center justify-center bg-card p-2 text-center">
                    <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase dark:text-neutral-400">
                        Lot
                    </span>
                    <span className="max-w-full truncate text-xs font-semibold text-slate-900 dark:text-neutral-100">
                        {values.lot_number || '—'}
                    </span>
                </div>
                {cell(sides[2])}
                <div className={corner} />
                {cell(sides[3])}
                <div className={corner} />
            </div>
        </div>
    );
}

function FieldRow({
    id,
    label,
    error,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function ArchiveSelectors({
    cabinets,
    cabinetId,
    drawerId,
    bookId,
    drawers,
    books,
    onCabinetChange,
    onDrawerChange,
    onBookChange,
}: {
    cabinets: ArchivePlacementCabinet[];
    cabinetId: string;
    drawerId: string;
    bookId: string;
    drawers: ArchivePlacementCabinet['drawers'];
    books: ArchivePlacementCabinet['drawers'][number]['books'];
    onCabinetChange: (value: string) => void;
    onDrawerChange: (value: string) => void;
    onBookChange: (value: string) => void;
}) {
    if (cabinets.length === 0) {
        return (
            <p className="text-sm text-slate-600 dark:text-neutral-400">
                Add a book from Manage Cabinets before filing a document.
            </p>
        );
    }

    const cabinetItems = cabinets.map((cabinet) => ({
        value: cabinet.id,
        label: cabinet.name,
    }));
    const drawerItems = drawers.map((drawer) => ({
        value: drawer.id,
        label: drawer.label,
    }));
    const bookItems = books.map((book) => ({
        value: book.id,
        label: book.label,
    }));

    return (
        <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
                <Label htmlFor="document-cabinet">Cabinet</Label>
                <Select
                    value={cabinetId}
                    onValueChange={(value) =>
                        onCabinetChange(String(value ?? ''))
                    }
                    items={cabinetItems}
                >
                    <SelectTrigger
                        id="document-cabinet"
                        className="w-full rounded-none"
                    >
                        <SelectValue placeholder="Select cabinet" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                        {cabinetItems.map((item) => (
                            <SelectItem
                                key={item.value}
                                value={item.value}
                                className="rounded-none"
                            >
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="document-drawer">Drawer</Label>
                <Select
                    value={drawerId}
                    onValueChange={(value) =>
                        onDrawerChange(String(value ?? ''))
                    }
                    items={drawerItems}
                    disabled={!cabinetId}
                >
                    <SelectTrigger
                        id="document-drawer"
                        className="w-full rounded-none"
                    >
                        <SelectValue placeholder="Select drawer" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                        {drawerItems.map((item) => (
                            <SelectItem
                                key={item.value}
                                value={item.value}
                                className="rounded-none"
                            >
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="document-book">Book</Label>
                <Select
                    value={bookId}
                    onValueChange={(value) => onBookChange(String(value ?? ''))}
                    items={bookItems}
                    disabled={!drawerId}
                >
                    <SelectTrigger
                        id="document-book"
                        className="w-full rounded-none"
                    >
                        <SelectValue placeholder="Select book" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                        {bookItems.map((item) => (
                            <SelectItem
                                key={item.value}
                                value={item.value}
                                className="rounded-none"
                            >
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
