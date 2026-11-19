import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    Circle,
    CircleDot,
    MapPin,
    RefreshCw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { location } from '@/routes/documents';
import { index as archiveIndex } from '@/routes/archive';

type Office = { id: number; name: string };
type DocumentLocation = {
    office: Office | null;
    destination: Office | null;
    releasedAt: string | null;
    archived: boolean;
    archive: {
        bookId: string;
        cabinet: string;
        drawer: string;
        item: string;
        kind: string;
    } | null;
    origin: { office: Office; at: string } | null;
    routing: {
        name: string;
        steps: {
            id: number;
            office: Office | null;
            name: string;
            canTakeAction: boolean;
            needsEndorsement: boolean;
        }[];
    } | null;
    transfers: {
        id: number;
        from: Office;
        to: Office | null;
        releasedAt: string;
        receivedAt: string | null;
        revertedAt: string | null;
    }[];
};

function time(value: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function DocumentLocationPanel({
    documentId,
    onNavigate,
}: {
    documentId: number;
    onNavigate: () => void;
}) {
    const [data, setData] = useState<DocumentLocation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setData(null);
        setError(null);
        fetch(location.url(documentId), {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok)
                    throw new Error(
                        response.status === 404
                            ? 'This document is no longer available in your office.'
                            : 'The document location could not be loaded.',
                    );
                return response.json() as Promise<DocumentLocation>;
            })
            .then((result) => {
                if (!controller.signal.aborted) setData(result);
            })
            .catch((exception: unknown) => {
                if (!controller.signal.aborted)
                    setError(
                        exception instanceof Error
                            ? exception.message
                            : 'The document location could not be loaded.',
                    );
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [documentId, attempt]);
    const visited = new Set(
        data?.transfers
            .filter((transfer) => transfer.receivedAt)
            .map((transfer) => transfer.to?.id),
    );
    if (data?.origin) visited.add(data.origin.office.id);
    return (
        <div className="flex min-h-0 flex-1 flex-col text-foreground">
            <div className="flex shrink-0 items-center gap-3 border-b border-border p-4 pr-12">
                <MapPin aria-hidden="true" className="size-5 shrink-0" />
                <div className="min-w-0 flex-1">
                    <DialogTitle className="text-base font-semibold">
                        Document location
                    </DialogTitle>
                    <DialogDescription className="mt-0.5 text-xs">
                        Current office, routing, and filing location.
                    </DialogDescription>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label="Refresh document location"
                    disabled={loading}
                    onClick={() => setAttempt((value) => value + 1)}
                >
                    <RefreshCw aria-hidden="true" className="size-4" />
                </Button>
            </div>
            <div
                className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4"
                aria-busy={loading}
            >
                {loading && (
                    <div
                        role="status"
                        className="animate-pulse space-y-3 motion-reduce:animate-none"
                    >
                        <span className="sr-only">
                            Loading document location
                        </span>
                        <div className="h-4 w-3/4 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                )}
                {error && (
                    <div role="alert" className="space-y-3">
                        <p className="text-sm text-destructive">{error}</p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAttempt((value) => value + 1)}
                        >
                            Try again
                        </Button>
                    </div>
                )}
                {data && (
                    <>
                        <section className="space-y-2">
                            <h3 className="text-xs font-medium text-muted-foreground">
                                {data.releasedAt
                                    ? 'Released from'
                                    : 'Current office'}
                            </h3>
                            <p className="text-sm font-semibold break-words">
                                {data.office?.name ?? 'Office not recorded'}
                            </p>
                            {data.releasedAt && (
                                <>
                                    <p className="flex items-start gap-2 text-sm">
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="mt-0.5 size-4 shrink-0"
                                        />
                                        <span className="break-words">
                                            {data.destination?.name ??
                                                'Any receiving office'}
                                        </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        In transit · awaiting receipt
                                        {data.releasedAt
                                            ? ` · ${time(data.releasedAt)}`
                                            : ''}
                                    </p>
                                </>
                            )}
                        </section>
                        {data.archived && (
                            <section className="space-y-3 border-t border-border pt-4">
                                <h3 className="text-sm font-medium">
                                    Archived location
                                </h3>
                                {data.archive ? (
                                    <>
                                        <dl className="space-y-2 text-sm">
                                            {[
                                                [
                                                    'Cabinet',
                                                    data.archive.cabinet,
                                                ],
                                                ['Drawer', data.archive.drawer],
                                                [
                                                    data.archive.kind ===
                                                    'folder'
                                                        ? 'Folder'
                                                        : 'Book',
                                                    data.archive.item,
                                                ],
                                            ].map(([label, value]) => (
                                                <div
                                                    key={label}
                                                    className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3"
                                                >
                                                    <dt className="text-xs text-muted-foreground">
                                                        {label}
                                                    </dt>
                                                    <dd className="break-words">
                                                        {value}
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            nativeButton={false}
                                            render={
                                                <Link
                                                    href={archiveIndex({
                                                        query: {
                                                            book: data.archive
                                                                .bookId,
                                                        },
                                                    })}
                                                    onClick={onNavigate}
                                                />
                                            }
                                        >
                                            Go to archive
                                            <ArrowRight aria-hidden="true" />
                                        </Button>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        A cabinet, drawer, and filing item have
                                        not been recorded.
                                    </p>
                                )}
                            </section>
                        )}
                        {data.routing && (
                            <section className="space-y-4 border-t border-border pt-4">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium">
                                        Fixed routing
                                    </h3>
                                    <p className="text-xs break-words text-muted-foreground">
                                        {data.routing.name}
                                    </p>
                                </div>
                                <ol
                                    className="space-y-4"
                                    aria-label="Document routing"
                                >
                                    {data.routing.steps.map((step) => {
                                        const current =
                                            step.office?.id === data.office?.id;
                                        const destination =
                                            step.office !== null &&
                                            step.office.id ===
                                                data.destination?.id;
                                        const passed =
                                            step.office !== null &&
                                            visited.has(step.office.id);
                                        const Icon =
                                            current || destination
                                                ? CircleDot
                                                : passed
                                                  ? Check
                                                  : Circle;
                                        return (
                                            <li
                                                key={step.id}
                                                className="flex items-start gap-3"
                                            >
                                                <Icon
                                                    aria-hidden="true"
                                                    className="mt-0.5 size-4 shrink-0"
                                                />
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-sm font-medium break-words">
                                                        {step.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {step.office === null
                                                            ? 'Office unavailable'
                                                            : destination
                                                              ? 'Awaiting receipt'
                                                              : current
                                                                ? data.destination
                                                                    ? 'Released'
                                                                    : 'Current location'
                                                                : passed
                                                                  ? 'Visited'
                                                                  : 'Upcoming'}
                                                    </p>
                                                    {(step.canTakeAction ||
                                                        step.needsEndorsement) && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {[
                                                                step.canTakeAction
                                                                    ? 'Can take action'
                                                                    : null,
                                                                step.needsEndorsement
                                                                    ? 'Needs endorsement'
                                                                    : null,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(' · ')}
                                                        </p>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </section>
                        )}
                        <section className="space-y-4 border-t border-border pt-4">
                            <h3 className="text-sm font-medium">
                                Office movements
                            </h3>
                            <ol
                                className="space-y-4"
                                aria-label="Office movement history"
                            >
                                {data.origin && (
                                    <li className="space-y-1">
                                        <p className="text-sm break-words">
                                            Uploaded to{' '}
                                            {data.origin.office.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {time(data.origin.at)}
                                        </p>
                                    </li>
                                )}
                                {data.transfers.map((transfer) => (
                                    <li key={transfer.id} className="space-y-1">
                                        <p className="text-sm break-words">
                                            {transfer.from.name} →{' '}
                                            {transfer.to?.name ?? 'In transit'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Released {time(transfer.releasedAt)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {transfer.revertedAt
                                                ? `Release reverted ${time(transfer.revertedAt)}`
                                                : transfer.receivedAt
                                                  ? `Received ${time(transfer.receivedAt)}`
                                                  : 'Awaiting receipt'}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                            {!data.transfers.length && (
                                <p className="text-sm text-muted-foreground">
                                    No office transfers recorded.
                                </p>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
