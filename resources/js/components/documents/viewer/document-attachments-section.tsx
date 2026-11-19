import {
    useEffect,
    useId,
    useRef,
    useState,
    type FormEvent,
} from 'react';
import { ArrowRight, Paperclip, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    destroy as destroyAttachment,
    store as storeAttachment,
    update as updateAttachment,
} from '@/routes/documents/attachments';
import type { ArchivedDocument, DocumentAttachment } from '@/types/documents';

function csrfToken(): string {
    const cookie = globalThis.document.cookie
        .split('; ')
        .find((value) => value.startsWith('XSRF-TOKEN='));

    return cookie
        ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length))
        : '';
}

async function requestDocument(
    url: string,
    init: RequestInit,
    signal: AbortSignal,
): Promise<ArchivedDocument> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('X-XSRF-TOKEN', csrfToken());

    const response = await fetch(url, {
        credentials: 'same-origin',
        ...init,
        headers,
        signal,
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
        const validationErrors = result?.errors as
            | Record<string, string[]>
            | undefined;
        const message =
            Object.values(validationErrors ?? {})[0]?.[0] ??
            result?.message ??
            'Could not update attachments. Please try again.';

        throw new Error(message);
    }

    if (!result?.document) {
        throw new Error(
            'The saved document could not be loaded. Please try again.',
        );
    }

    return result.document as ArchivedDocument;
}

function attachmentPageIsInScan(
    page: number | null,
    scannedPageCount: number | null,
): boolean {
    return (
        page !== null &&
        scannedPageCount !== null &&
        page >= 1 &&
        scannedPageCount >= page
    );
}

function attachmentPageIsMissingFromScan(
    page: number | null,
    scannedPageCount: number | null,
): boolean {
    return (
        page !== null &&
        scannedPageCount !== null &&
        page >= 1 &&
        scannedPageCount < page
    );
}

export default function DocumentAttachmentsSection({
    documentId,
    attachments,
    active,
    onSaved,
    scannedPageCount = null,
    onGoToPage,
    embedded = false,
}: {
    documentId: number;
    attachments: DocumentAttachment[];
    active: boolean;
    onSaved: (document: ArchivedDocument) => void;
    scannedPageCount?: number | null;
    onGoToPage?: (page: number) => void;
    embedded?: boolean;
}) {
    const id = useId();
    const request = useRef<AbortController | null>(null);
    const [description, setDescription] = useState('');
    const [page, setPage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const busy = saving || updatingId !== null;

    useEffect(() => () => request.current?.abort(), []);

    useEffect(() => {
        if (!active) {
            request.current?.abort();
            request.current = null;
            setSaving(false);
            setUpdatingId(null);
        }
    }, [active]);

    useEffect(() => {
        setDescription('');
        setPage('');
        setError(null);
    }, [documentId]);

    async function run(
        action: (signal: AbortSignal) => Promise<ArchivedDocument>,
        success: string,
        attachmentId: number | null = null,
    ): Promise<boolean> {
        if (request.current) {
            return false;
        }

        const controller = new AbortController();
        request.current = controller;
        setError(null);
        if (attachmentId === null) {
            setSaving(true);
        } else {
            setUpdatingId(attachmentId);
        }

        try {
            const updated = await action(controller.signal);
            if (controller.signal.aborted) {
                return false;
            }
            onSaved(updated);
            toast.success(success);
            return true;
        } catch (exception) {
            if (!controller.signal.aborted) {
                setError(
                    exception instanceof Error
                        ? exception.message
                        : 'Could not update attachments. Please try again.',
                );
            }
            return false;
        } finally {
            if (!controller.signal.aborted) {
                request.current = null;
                setSaving(false);
                setUpdatingId(null);
            }
        }
    }

    async function addAttachment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const nextDescription = description.trim();
        if (nextDescription === '') {
            setError('Describe what is attached to this letter.');
            return;
        }

        const added = await run(
            (signal) =>
                requestDocument(
                    storeAttachment.url({ document: documentId }),
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            description: nextDescription,
                            page: page.trim() === '' ? null : page.trim(),
                        }),
                    },
                    signal,
                ),
            'Attachment listed.',
        );

        if (!added) {
            return;
        }

        setDescription('');
        setPage('');
    }

    function saveAttachment(
        attachment: DocumentAttachment,
        nextDescription: string,
        nextPage: string,
        success: string,
    ) {
        const currentPage =
            attachment.page === null ? '' : String(attachment.page);
        const currentDescription = attachment.description;
        const descriptionValue = nextDescription.trim();
        const pageValue = nextPage.trim();

        if (
            descriptionValue === currentDescription &&
            pageValue === currentPage
        ) {
            return;
        }

        if (descriptionValue === '') {
            setError('Describe what is attached to this letter.');
            return;
        }

        void run(
            (signal) =>
                requestDocument(
                    updateAttachment.url({
                        document: documentId,
                        attachment: attachment.id,
                    }),
                    {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            description: descriptionValue,
                            page: pageValue === '' ? null : pageValue,
                        }),
                    },
                    signal,
                ),
            success,
            attachment.id,
        );
    }

    function removeAttachment(attachment: DocumentAttachment) {
        void run(
            (signal) =>
                requestDocument(
                    destroyAttachment.url({
                        document: documentId,
                        attachment: attachment.id,
                    }),
                    { method: 'DELETE' },
                    signal,
                ),
            'Attachment removed.',
            attachment.id,
        );
    }

    const rowClassName =
        'grid grid-cols-[minmax(0,1fr)_2.5rem_auto] items-center gap-1.5';

    const heading = (
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-border pb-2">
            <h3
                id={`${id}-heading`}
                className="text-sm font-semibold text-foreground"
            >
                Attachments
            </h3>
            <Paperclip
                aria-hidden="true"
                className="size-3.5 text-muted-foreground"
            />
        </div>
    );

    return (
        <section
            {...(embedded
                ? { 'aria-label': 'Attachments' }
                : { 'aria-labelledby': `${id}-heading` })}
        >
            {embedded ? null : heading}
            <div className="grid gap-3">
                {attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Name each enclosure and the page it occupies in a full
                        scan.
                    </p>
                ) : (
                    <div className="grid gap-2">
                        <div
                            className={`${rowClassName} text-xs text-muted-foreground`}
                        >
                            <span>Attachment</span>
                            <span className="text-center">Page</span>
                            <span className="sr-only">Actions</span>
                        </div>
                        <ul className="grid gap-2">
                            {attachments.map((attachment) => {
                            const descriptionId = `${id}-description-${attachment.id}`;
                            const pageId = `${id}-page-${attachment.id}`;
                            const updating = updatingId === attachment.id;
                            const canJump = attachmentPageIsInScan(
                                attachment.page,
                                scannedPageCount,
                            );
                            const missingFromScan =
                                attachmentPageIsMissingFromScan(
                                    attachment.page,
                                    scannedPageCount,
                                );
                            const pageValue =
                                attachment.page === null
                                    ? ''
                                    : String(attachment.page);

                            return (
                                <li
                                    key={attachment.id}
                                    className={rowClassName}
                                >
                                    <Input
                                        key={`${attachment.id}-${attachment.description}`}
                                        id={descriptionId}
                                        type="text"
                                        maxLength={255}
                                        disabled={busy}
                                        defaultValue={attachment.description}
                                        aria-label="Attachment"
                                        onBlur={(event) =>
                                            saveAttachment(
                                                attachment,
                                                event.target.value,
                                                pageValue,
                                                'Attachment saved.',
                                            )
                                        }
                                        className="h-8 min-w-0 px-2"
                                    />
                                    <Input
                                        key={`${attachment.id}-${attachment.page ?? 'none'}`}
                                        id={pageId}
                                        type="number"
                                        min={1}
                                        max={9999}
                                        inputMode="numeric"
                                        disabled={busy}
                                        defaultValue={
                                            attachment.page === null
                                                ? ''
                                                : attachment.page
                                        }
                                        aria-label="Page"
                                        title={
                                            missingFromScan
                                                ? `Page ${attachment.page} is not in this scan.`
                                                : undefined
                                        }
                                        onBlur={(event) =>
                                            saveAttachment(
                                                attachment,
                                                attachment.description,
                                                event.target.value,
                                                'Attachment page saved.',
                                            )
                                        }
                                        className="h-8 px-1 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                    <div className="flex justify-end">
                                        {canJump &&
                                        onGoToPage &&
                                        attachment.page !== null ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 text-muted-foreground hover:text-foreground"
                                                disabled={busy}
                                                aria-label={`Go to page ${attachment.page}`}
                                                title={`Go to page ${attachment.page}`}
                                                onClick={() =>
                                                    onGoToPage(
                                                        attachment.page as number,
                                                    )
                                                }
                                            >
                                                <ArrowRight
                                                    className="size-3.5"
                                                    aria-hidden="true"
                                                />
                                            </Button>
                                        ) : null}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 text-muted-foreground hover:text-foreground"
                                            disabled={busy}
                                            aria-label={`Remove ${attachment.description}`}
                                            title={`Remove ${attachment.description}`}
                                            onClick={() =>
                                                removeAttachment(attachment)
                                            }
                                        >
                                            {updating ? (
                                                <Spinner />
                                            ) : (
                                                <Trash2
                                                    className="size-3.5"
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </Button>
                                    </div>
                                </li>
                            );
                            })}
                        </ul>
                    </div>
                )}
                <form
                    onSubmit={(event) => void addAttachment(event)}
                    className="grid gap-2"
                    aria-busy={saving}
                >
                    {attachments.length === 0 ? (
                        <div
                            className={`${rowClassName} text-xs text-muted-foreground`}
                        >
                            <Label
                                htmlFor={`${id}-description`}
                                className="text-xs font-normal text-muted-foreground"
                            >
                                Attachment
                            </Label>
                            <Label
                                htmlFor={`${id}-new-page`}
                                className="text-center text-xs font-normal text-muted-foreground"
                            >
                                Page
                            </Label>
                            <span className="sr-only">Add attachment</span>
                        </div>
                    ) : null}
                    <div className={rowClassName}>
                        <Input
                            id={`${id}-description`}
                            type="text"
                            maxLength={255}
                            value={description}
                            disabled={busy}
                            placeholder="Certified true copy of title"
                            aria-label="Add attachment"
                            onChange={(event) => {
                                setDescription(event.target.value);
                                setError(null);
                            }}
                            className="h-8 min-w-0 px-2"
                        />
                        <Input
                            id={`${id}-new-page`}
                            type="number"
                            min={1}
                            max={9999}
                            inputMode="numeric"
                            value={page}
                            disabled={busy}
                            placeholder="—"
                            aria-label="Page"
                            onChange={(event) => setPage(event.target.value)}
                            className="h-8 px-1 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                variant="ghost"
                                size="icon"
                                disabled={busy || description.trim() === ''}
                                className="size-7 text-muted-foreground hover:text-foreground"
                                aria-label="Add attachment"
                                title="Add attachment"
                            >
                                {saving ? (
                                    <Spinner />
                                ) : (
                                    <Plus
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                )}
                            </Button>
                        </div>
                    </div>
                    {error && (
                        <p role="alert" className="text-sm text-destructive">
                            {error}
                        </p>
                    )}
                </form>
            </div>
        </section>
    );
}
