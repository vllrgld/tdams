import { ClipboardList, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { audit } from '@/routes/documents';

const auditFilters = [
    { value: 'activity', label: 'Activity' },
    { value: 'ocr', label: 'OCR' },
    { value: 'all', label: 'All' },
] as const;
type AuditFilter = (typeof auditFilters)[number]['value'];

type Office = { id: number; name: string };
type AuditEntry = {
    id: number;
    action: string;
    label: string;
    actor: { id: number | null; name: string; type: 'user' | 'system' };
    actingOffice: string | null;
    occurredAt: string;
    imported: boolean;
    changes: {
        field: string;
        label: string;
        before: unknown;
        after: unknown;
    }[];
    context: {
        comments?: string | null;
        reason?: string;
        fromOffice?: Office | null;
        toOffice?: Office | null;
        routing?: {
            name: string;
        } | null;
        trackingCode?: string | null;
        sharedRecord?: boolean;
        automatic?: boolean;
        page?: number;
    };
};
type AuditPage = { data: AuditEntry[]; nextCursor: string | null };

function displayValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return 'Not set';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'bigint')
        return value.toString();
    return JSON.stringify(value) ?? 'Not set';
}

async function fetchEntries(
    documentId: number,
    filter: AuditFilter,
    signal: AbortSignal,
    cursor?: string,
): Promise<AuditPage> {
    const response = await fetch(
        audit.url(documentId, {
            query: { filter, ...(cursor ? { cursor } : {}) },
        }),
        {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
            signal,
        },
    );
    if (!response.ok) {
        throw new Error(
            response.status === 404
                ? 'This document is no longer available in your office.'
                : 'The audit trail could not be loaded. Try again.',
        );
    }
    return response.json() as Promise<AuditPage>;
}

export default function DocumentAuditPanel({
    documentId,
}: {
    documentId: number;
}) {
    const [filter, setFilter] = useState<AuditFilter>('activity');
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const moreRequest = useRef<AbortController | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        moreRequest.current?.abort();
        moreRequest.current = null;
        setLoading(true);
        setLoadingMore(false);
        setEntries([]);
        setNextCursor(null);
        setError(null);
        fetchEntries(documentId, filter, controller.signal)
            .then((page) => {
                if (controller.signal.aborted) return;
                setEntries(page.data);
                setNextCursor(page.nextCursor);
            })
            .catch((exception: unknown) => {
                if (!controller.signal.aborted)
                    setError(
                        exception instanceof Error
                            ? exception.message
                            : 'The audit trail could not be loaded.',
                    );
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => {
            controller.abort();
            moreRequest.current?.abort();
        };
    }, [documentId, filter, attempt]);

    async function loadMore() {
        if (!nextCursor || moreRequest.current) return;
        const controller = new AbortController();
        moreRequest.current = controller;
        setLoadingMore(true);
        setError(null);
        try {
            const page = await fetchEntries(
                documentId,
                filter,
                controller.signal,
                nextCursor,
            );
            if (!controller.signal.aborted) {
                setEntries((previous) => [...previous, ...page.data]);
                setNextCursor(page.nextCursor);
            }
        } catch (exception) {
            if (!controller.signal.aborted)
                setError(
                    exception instanceof Error
                        ? exception.message
                        : 'Older activity could not be loaded.',
                );
        } finally {
            if (!controller.signal.aborted) {
                setLoadingMore(false);
                moreRequest.current = null;
            }
        }
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col text-foreground">
            <div className="flex shrink-0 items-center gap-3 border-b border-border p-4 pr-12">
                <ClipboardList aria-hidden="true" className="size-5 shrink-0" />
                <div className="min-w-0 flex-1">
                    <DialogTitle className="text-base font-semibold">
                        Document audit
                    </DialogTitle>
                    <DialogDescription className="mt-0.5 text-xs">
                        Activity for this document, most recent first.
                    </DialogDescription>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label="Refresh audit trail"
                    title="Refresh audit trail"
                    disabled={loading || loadingMore}
                    onClick={() => setAttempt((value) => value + 1)}
                >
                    <RefreshCw aria-hidden="true" className="size-4" />
                </Button>
            </div>
            <div className="shrink-0 border-b border-border px-4 py-2">
                <ToggleGroup
                    aria-label="Audit activity filter"
                    value={[filter]}
                    onValueChange={(values) => {
                        const selected = auditFilters.find(
                            (item) => item.value === values[0],
                        );
                        if (selected) setFilter(selected.value);
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full"
                >
                    {auditFilters.map((item) => (
                        <ToggleGroupItem
                            key={item.value}
                            value={item.value}
                            className="h-8 flex-1 text-xs"
                        >
                            {item.label}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </div>
            <div
                className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"
                aria-busy={loading || loadingMore}
            >
                {loading ? (
                    <div role="status" className="space-y-6 py-5">
                        <span className="sr-only">Loading audit trail</span>
                        {[0, 1, 2].map((item) => (
                            <div
                                key={item}
                                className="animate-pulse space-y-2 motion-reduce:animate-none"
                            >
                                <div className="h-4 w-3/4 rounded bg-muted" />
                                <div className="h-3 w-1/2 rounded bg-muted" />
                                <div className="h-3 w-2/3 rounded bg-muted" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {entries.some((entry) => entry.imported) && (
                            <p className="border-b border-border py-3 text-xs leading-relaxed text-muted-foreground">
                                Imported entries use saved upload and transfer
                                records. Earlier edits and unrecorded offices
                                cannot be reconstructed.
                            </p>
                        )}
                        <ol
                            aria-label="Document audit entries"
                            className="divide-y divide-border"
                        >
                            {entries.map((entry) => (
                                <AuditItem key={entry.id} entry={entry} />
                            ))}
                        </ol>
                        {!entries.length && !error && (
                            <p className="py-8 text-sm text-muted-foreground">
                                {filter === 'ocr'
                                    ? 'No OCR activity recorded yet.'
                                    : 'No recorded activity yet.'}
                            </p>
                        )}
                        {error && (
                            <div role="alert" className="space-y-2 py-4">
                                <p className="text-sm text-destructive">
                                    {error}
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        entries.length
                                            ? void loadMore()
                                            : setAttempt((value) => value + 1)
                                    }
                                >
                                    Try again
                                </Button>
                            </div>
                        )}
                        {nextCursor && !error && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-3 w-full"
                                disabled={loadingMore}
                                onClick={() => void loadMore()}
                            >
                                {loadingMore && <Spinner />}{' '}
                                {loadingMore
                                    ? 'Loading activity'
                                    : 'Load older activity'}
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function AuditItem({ entry }: { entry: AuditEntry }) {
    const context = entry.context;
    const date = new Date(entry.occurredAt);
    return (
        <li className="space-y-2 py-4 text-sm">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="font-medium">{entry.label}</h3>
                {entry.imported && (
                    <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        Imported
                    </span>
                )}
            </div>
            <time
                dateTime={entry.occurredAt}
                title={date.toLocaleString()}
                className="block text-xs text-muted-foreground"
            >
                {new Intl.DateTimeFormat('en-PH', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                }).format(date)}
            </time>
            <p className="break-words">
                <span className="font-medium">{entry.actor.name}</span>
                {entry.actingOffice && (
                    <span className="text-muted-foreground">
                        {' '}
                        · {entry.actingOffice}
                    </span>
                )}
            </p>
            {context.fromOffice && context.toOffice ? (
                <p className="text-xs leading-relaxed break-words">
                    <span className="text-muted-foreground">From </span>
                    {context.fromOffice.name}
                    <span className="text-muted-foreground"> to </span>
                    {context.toOffice.name}
                </p>
            ) : null}
            {entry.imported &&
                entry.action === 'uploaded' &&
                !entry.actingOffice && (
                    <p className="text-xs text-muted-foreground">
                        Original office was not recorded.
                    </p>
                )}
            {context.routing && (
                <p className="text-xs break-words">
                    <span className="text-muted-foreground">Routing: </span>
                    {context.routing.name}
                </p>
            )}
            {context.comments && (
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {context.comments}
                </p>
            )}
            {context.reason === 'fixed_routing' && (
                <p className="text-xs text-muted-foreground">
                    Fixed routing moved the document to In progress.
                </p>
            )}
            {context.trackingCode && (
                <p className="text-xs break-all">
                    <span className="text-muted-foreground">Tracking: </span>
                    {context.trackingCode}
                </p>
            )}
            {context.sharedRecord && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                    Updated through a shared property or tax declaration.
                </p>
            )}
            {context.automatic && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                    Linked automatically when the matching declaration became
                    available.
                </p>
            )}
            {context.page !== undefined && (
                <p className="text-xs text-muted-foreground">
                    Page {context.page}
                </p>
            )}
            {!!entry.changes.length && (
                <details className="group pt-1">
                    <summary className="cursor-pointer rounded text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                        View{' '}
                        {entry.changes.length === 1
                            ? 'change'
                            : `${entry.changes.length} changes`}
                    </summary>
                    <dl className="mt-3 space-y-4">
                        {entry.changes.map((change) => (
                            <div
                                key={change.field}
                                className="min-w-0 space-y-1 border-l border-border pl-3"
                            >
                                <dt className="text-xs font-medium">
                                    {change.label}
                                </dt>
                                <dd className="space-y-1 text-xs leading-relaxed break-words whitespace-pre-wrap">
                                    <p className="text-muted-foreground">
                                        <span className="font-medium">
                                            Before:{' '}
                                        </span>
                                        {displayValue(change.before)}
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            After:{' '}
                                        </span>
                                        {displayValue(change.after)}
                                    </p>
                                </dd>
                            </div>
                        ))}
                    </dl>
                </details>
            )}
        </li>
    );
}
