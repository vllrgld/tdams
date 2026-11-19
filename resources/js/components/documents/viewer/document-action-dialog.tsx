import { router } from '@inertiajs/react';
import { CircleCheck, CircleX } from 'lucide-react';
import {
    useEffect,
    useId,
    useRef,
    useState,
    type FormEvent,
    type RefObject,
} from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { show, update } from '@/routes/documents/workflow';
import type { DocumentStatus, DocumentWorkflow } from '@/types/documents';

type Decision = 'approved' | 'disapproved';

export default function DocumentActionDialog({
    documentId,
    title,
    finalFocus,
    onClose,
    onChanged,
}: {
    documentId: number;
    title: string;
    finalFocus: RefObject<HTMLButtonElement | null>;
    onClose: () => void;
    onChanged: (status: DocumentStatus) => void;
}) {
    const commentsId = useId();
    const [workflow, setWorkflow] = useState<DocumentWorkflow | null>(null);
    const [decision, setDecision] = useState<Decision | null>(null);
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const request = useRef<AbortController | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setWorkflow(null);
        setError(null);
        fetch(show.url(documentId), {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok || response.redirected)
                    throw new Error(
                        response.status === 404
                            ? 'This document is no longer available in your office.'
                            : 'The document workflow could not be loaded. Please try again.',
                    );
                return response.json() as Promise<DocumentWorkflow>;
            })
            .then((result) => {
                if (!controller.signal.aborted) setWorkflow(result);
            })
            .catch((cause: unknown) => {
                if (!controller.signal.aborted)
                    setError(
                        cause instanceof Error
                            ? cause.message
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

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (
            !workflow?.canTakeAction ||
            !decision ||
            request.current ||
            (decision === 'disapproved' && comments.trim() === '')
        )
            return;
        const controller = new AbortController();
        request.current = controller;
        setSaving(true);
        setError(null);
        try {
            const token = document.cookie
                .split('; ')
                .find((value) => value.startsWith('XSRF-TOKEN='));
            const response = await fetch(update.url(documentId), {
                method: 'PATCH',
                credentials: 'same-origin',
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': token
                        ? decodeURIComponent(token.slice('XSRF-TOKEN='.length))
                        : '',
                },
                body: JSON.stringify({
                    status: decision,
                    comments: comments.trim() || null,
                    routing_version: workflow.routingVersion,
                }),
            });
            const result = await response.json().catch(() => null);
            if (
                !response.ok ||
                response.redirected ||
                !['approved', 'disapproved'].includes(result?.status)
            ) {
                const validation = result?.errors
                    ? Object.values(result.errors)
                          .flat()
                          .find((value) => typeof value === 'string')
                    : null;
                throw new Error(
                    typeof validation === 'string'
                        ? validation
                        : response.status === 419 || response.redirected
                          ? 'Your session expired. Refresh the page and try again.'
                          : (result?.message ??
                            'The decision could not be saved. Please try again.'),
                );
            }
            if (!controller.signal.aborted) {
                router.flushAll();
                onChanged(result.status as Decision);
                toast.success(
                    decision === 'approved'
                        ? 'Document approved.'
                        : 'Document disapproved.',
                );
                onClose();
            }
        } catch (cause) {
            if (!controller.signal.aborted)
                setError(
                    cause instanceof Error
                        ? cause.message
                        : 'The decision could not be saved.',
                );
        } finally {
            if (!controller.signal.aborted) {
                request.current = null;
                setSaving(false);
            }
        }
    }

    const allowed = workflow?.canTakeAction === true;
    return (
        <Dialog
            open
            disablePointerDismissal={saving}
            onOpenChange={(open) => {
                if (!open && !request.current) onClose();
            }}
        >
            <DialogContent
                finalFocus={finalFocus}
                showClose={!saving}
                className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-lg"
            >
                <DialogHeader className="text-left">
                    <DialogTitle>Take action</DialogTitle>
                    <DialogDescription className="break-words">
                        {title}
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={submit}
                    className="grid min-h-0 min-w-0 grid-cols-1 gap-5 overflow-y-auto"
                >
                    {loading && (
                        <p
                            role="status"
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                            <Spinner /> Checking document workflow
                        </p>
                    )}
                    {workflow && !allowed && (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {workflow.actionBlock}
                        </p>
                    )}
                    {allowed && (
                        <>
                            <div
                                role="group"
                                aria-label="Decision"
                                className="grid grid-cols-2 gap-2"
                            >
                                <Button
                                    type="button"
                                    variant={
                                        decision === 'approved'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    aria-pressed={decision === 'approved'}
                                    disabled={saving}
                                    onClick={() => setDecision('approved')}
                                >
                                    <CircleCheck aria-hidden="true" /> Approve
                                </Button>
                                <Button
                                    type="button"
                                    variant={
                                        decision === 'disapproved'
                                            ? 'destructive'
                                            : 'outline'
                                    }
                                    aria-pressed={decision === 'disapproved'}
                                    disabled={saving}
                                    onClick={() => setDecision('disapproved')}
                                >
                                    <CircleX aria-hidden="true" /> Disapprove
                                </Button>
                            </div>
                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor={commentsId}>
                                    Comments
                                    {decision === 'disapproved'
                                        ? ' (required)'
                                        : ' (optional)'}
                                </Label>
                                <textarea
                                    id={commentsId}
                                    rows={5}
                                    maxLength={5000}
                                    value={comments}
                                    required={decision === 'disapproved'}
                                    disabled={saving}
                                    onChange={(event) =>
                                        setComments(event.target.value)
                                    }
                                    placeholder={
                                        decision === 'disapproved'
                                            ? 'Explain why this document is disapproved.'
                                            : 'Add comments about your decision.'
                                    }
                                    className="min-h-32 w-full min-w-0 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:opacity-50"
                                />
                                <p className="text-xs leading-5 text-muted-foreground">
                                    Your decision and comments will be saved in
                                    the document audit.
                                </p>
                            </div>
                        </>
                    )}
                    {error && (
                        <div
                            role="alert"
                            className="space-y-2 text-sm text-destructive"
                        >
                            <p>{error}</p>
                            {!workflow && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setAttempt((value) => value + 1)
                                    }
                                >
                                    Try again
                                </Button>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={saving}
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        {allowed && (
                            <Button
                                type="submit"
                                variant={
                                    decision === 'disapproved'
                                        ? 'destructive'
                                        : 'default'
                                }
                                disabled={
                                    saving ||
                                    !decision ||
                                    (decision === 'disapproved' &&
                                        comments.trim() === '')
                                }
                            >
                                {saving && <Spinner />}
                                {saving
                                    ? 'Saving decision…'
                                    : decision === 'approved'
                                      ? 'Confirm approval'
                                      : decision === 'disapproved'
                                        ? 'Confirm disapproval'
                                        : 'Save decision'}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
