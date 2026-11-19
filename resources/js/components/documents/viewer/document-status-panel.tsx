import { router } from '@inertiajs/react';
import { CircleDot, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { endorse, show } from '@/routes/documents/workflow';
import type { ArchivedDocument, DocumentWorkflow } from '@/types/documents';

export default function DocumentStatusPanel({
    documentId,
    onChanged,
}: {
    documentId: number;
    onChanged: (status: NonNullable<ArchivedDocument['status']>) => void;
}) {
    const [data, setData] = useState<DocumentWorkflow | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const request = useRef<AbortController | null>(null);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setData(null);
        setError(null);
        fetch(show.url(documentId), {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok)
                    throw new Error(
                        'The document workflow could not be loaded.',
                    );
                return response.json() as Promise<DocumentWorkflow>;
            })
            .then((result) => {
                if (!controller.signal.aborted) {
                    setData(result);
                }
            })
            .catch((exception: unknown) => {
                if (!controller.signal.aborted)
                    setError(
                        exception instanceof Error
                            ? exception.message
                            : 'The document workflow could not be loaded.',
                    );
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => {
            controller.abort();
            request.current?.abort();
        };
    }, [documentId, attempt]);
    async function save() {
        if (request.current) return;
        const controller = new AbortController();
        request.current = controller;
        setSaving(true);
        setError(null);
        try {
            const token = document.cookie
                .split('; ')
                .find((value) => value.startsWith('XSRF-TOKEN='));
            const response = await fetch(endorse.url(documentId), {
                method: 'POST',
                credentials: 'same-origin',
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': token
                        ? decodeURIComponent(token.slice('XSRF-TOKEN='.length))
                        : '',
                },
                body: JSON.stringify({}),
            });
            const result = await response.json();
            if (!response.ok)
                throw new Error(
                    result.message ?? 'The document could not be updated.',
                );
            if (!controller.signal.aborted) {
                const next = result as DocumentWorkflow;
                setData(next);
                setConfirm(false);
                router.flushAll();
                onChanged(next.status);
            }
        } catch (exception) {
            if (!controller.signal.aborted)
                setError(
                    exception instanceof Error
                        ? exception.message
                        : 'The document could not be updated.',
                );
        } finally {
            if (!controller.signal.aborted) {
                setSaving(false);
                request.current = null;
            }
        }
    }
    return (
        <div className="flex min-h-0 flex-1 flex-col text-foreground">
            <div className="flex shrink-0 items-center gap-3 border-b border-border p-4 pr-12">
                <CircleDot aria-hidden="true" className="size-5 shrink-0" />
                <div className="min-w-0 flex-1">
                    <DialogTitle className="text-base font-semibold">
                        Document status
                    </DialogTitle>
                    <DialogDescription className="mt-0.5 text-xs">
                        Review, endorsements, and actions.
                    </DialogDescription>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label="Refresh document status"
                    disabled={loading || saving}
                    onClick={() => setAttempt((value) => value + 1)}
                >
                    <RefreshCw aria-hidden="true" className="size-4" />
                </Button>
            </div>
            <div
                className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4"
                aria-busy={loading || saving}
            >
                {loading && (
                    <p
                        role="status"
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                        <Spinner />
                        Loading document status
                    </p>
                )}
                {error && (
                    <div role="alert" className="space-y-3">
                        <p className="text-sm text-destructive">{error}</p>
                        {!data && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setAttempt((value) => value + 1)}
                            >
                                Try again
                            </Button>
                        )}
                    </div>
                )}
                {data && (
                    <>
                        <section className="space-y-2">
                            <h3 className="text-xs font-medium text-muted-foreground">
                                Current status
                            </h3>
                            <p className="flex items-center gap-2 text-sm font-semibold">
                                <CircleDot
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                {data.label}
                            </p>
                        </section>
                        {data.routingName && (
                            <p className="text-xs break-words text-muted-foreground">
                                Routing: {data.routingName}
                            </p>
                        )}
                        {data.endorsementRequired && (
                            <section className="space-y-3 border-t border-border pt-4">
                                <h3 className="text-sm font-medium">
                                    Office endorsement
                                </h3>
                                {data.endorsedAt ? (
                                    <p className="text-sm">
                                        Endorsed ·{' '}
                                        {new Intl.DateTimeFormat('en-PH', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        }).format(new Date(data.endorsedAt))}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Your office must endorse this document
                                        before releasing it.
                                    </p>
                                )}
                                {data.canEndorse &&
                                    (confirm ? (
                                        <div className="space-y-3 rounded-md border border-border p-3">
                                            <p className="text-sm">
                                                Confirm your office’s
                                                endorsement of this document?
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={saving}
                                                    onClick={() => void save()}
                                                >
                                                    {saving && <Spinner />}
                                                    Confirm endorsement
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={saving}
                                                    onClick={() =>
                                                        setConfirm(false)
                                                    }
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setConfirm(true)}
                                        >
                                            Endorse document
                                        </Button>
                                    ))}
                            </section>
                        )}
                        {data.decision ? (
                            <section className="space-y-3 border-t border-border pt-4">
                                <h3 className="text-sm font-medium">
                                    Decision
                                </h3>
                                <p className="text-sm">
                                    {data.decision.actorName}
                                    {data.decision.officeName
                                        ? ' · ' + data.decision.officeName
                                        : ''}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Intl.DateTimeFormat('en-PH', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                    }).format(
                                        new Date(data.decision.decidedAt),
                                    )}
                                </p>
                                {data.decision.comments && (
                                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                        {data.decision.comments}
                                    </p>
                                )}
                            </section>
                        ) : (
                            data.actionBlock && (
                                <p className="border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
                                    {data.actionBlock}
                                </p>
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
