import { router, usePage } from '@inertiajs/react';
import { Check, FileText, Inbox, Send, Upload, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
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
import FloatingActionMenu from '@/components/ui/floating-action-menu';
import { useDocumentUploadActions } from '@/components/documents/document-upload-context';
import { SearchBar } from '@/components/ui/search-bar';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
    index,
    receive,
    release,
    revert,
} from '@/routes/documents/office-actions';

type Action = 'receive' | 'release' | 'revert';
type DocumentOption = {
    id: number;
    title: string;
    filename: string;
    trackingCode: string | null;
    transferId: number | null;
    releasedAt: string | null;
    routeName: string | null;
    routeId: number | null;
    nextOfficeId: number | null;
    nextOfficeName: string | null;
    releaseError: string | null;
    fromOfficeName: string | null;
    endorsementRequired: boolean;
};
type Options = {
    officeId: number;
    canRouteDocuments: boolean;
    routing: {
        id: number;
        name: string;
        steps: string[];
        nextOfficeId: number | null;
        nextOfficeName: string | null;
        releaseError: string | null;
        endorsementRequired: boolean;
    }[];
    documents: DocumentOption[];
    hasMore: boolean;
};

export default function OfficeDocumentActions({
    onCompleted,
}: {
    onCompleted: () => void;
}) {
    const { officeId, officeName } = usePage().props;
    const uploadActions = useDocumentUploadActions();
    const [action, setAction] = useState<Action | null>(null);
    const actionButton = useRef<HTMLButtonElement | null>(null);

    function closeDialog() {
        setAction(null);
        requestAnimationFrame(() => actionButton.current?.focus());
    }

    return (
        <>
            <FloatingActionMenu
                className="fixed right-4 bottom-5 z-30 sm:right-6 sm:bottom-6"
                label="Office document actions"
                menuLabel={officeName ?? 'Current office'}
                triggerRef={actionButton}
                disabled={officeId === null}
                onIntent={uploadActions?.preloadUpload}
                options={[
                    {
                        label: 'Upload',
                        Icon: <Upload />,
                        disabled: !uploadActions || uploadActions.loadingUpload,
                        onClick: () =>
                            uploadActions?.openUpload(actionButton.current),
                    },
                    {
                        label: 'Receive',
                        Icon: <Inbox />,
                        onClick: () => setAction('receive'),
                    },
                    {
                        label: 'Release',
                        Icon: <Send />,
                        onClick: () => setAction('release'),
                    },
                    {
                        label: 'Recently released',
                        Icon: <Undo2 />,
                        onClick: () => setAction('revert'),
                    },
                ]}
            />
            {action && officeId !== null && (
                <OfficeActionDialog
                    key={`${officeId}:${action}`}
                    action={action}
                    officeId={officeId}
                    officeName={officeName ?? 'Current office'}
                    onClose={closeDialog}
                    onCompleted={() => {
                        closeDialog();
                        onCompleted();
                        router.flushAll();
                        router.reload({
                            only: [
                                'documents',
                                'selectedDocument',
                                'documentTypes',
                            ],
                        });
                    }}
                />
            )}
        </>
    );
}

function OfficeActionDialog({
    action,
    officeId,
    officeName,
    onClose,
    onCompleted,
}: {
    action: Action;
    officeId: number;
    officeName: string;
    onClose: () => void;
    onCompleted: () => void;
}) {
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<Options | null>(null);
    const [selected, setSelected] = useState<DocumentOption | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [retry, setRetry] = useState(0);
    const [saving, setSaving] = useState(false);
    const [routingId, setRoutingId] = useState<string | null>(null);
    const [endorse, setEndorse] = useState(false);
    const savingRef = useRef(false);
    const request = useRef<AbortController | null>(null);
    const receiving = action === 'receive';
    const reverting = action === 'revert';
    const releasing = action === 'release';

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(
            async () => {
                setLoading(true);
                setLoadError(null);
                try {
                    const response = await fetch(
                        index.url({ query: { action, q: query } }),
                        {
                            headers: { Accept: 'application/json' },
                            credentials: 'same-origin',
                            signal: controller.signal,
                        },
                    );
                    if (!response.ok || response.redirected)
                        throw new Error(
                            'Documents could not be loaded. Please try again.',
                        );
                    const data: Options = await response.json();
                    if (data.officeId !== officeId)
                        throw new Error(
                            'Your active office changed. Close and reopen this action.',
                        );
                    if (!controller.signal.aborted) {
                        setOptions(data);
                        const match = data.documents.find(
                            (item) =>
                                item.trackingCode?.toUpperCase() ===
                                query.trim().toUpperCase(),
                        );
                        if (match) setSelected(match);
                    }
                } catch (cause) {
                    if (!controller.signal.aborted)
                        setLoadError(
                            cause instanceof Error
                                ? cause.message
                                : 'Documents could not be loaded.',
                        );
                } finally {
                    if (!controller.signal.aborted) setLoading(false);
                }
            },
            query === '' ? 0 : 250,
        );
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [action, officeId, query, retry]);

    useEffect(() => () => request.current?.abort(), []);

    const canAssignRouting = releasing && options?.canRouteDocuments === true;
    const selectedRouting =
        routingId ??
        (selected?.routeId != null ? String(selected.routeId) : 'none');
    const chosenRouting = options?.routing.find(
        (route) => String(route.id) === selectedRouting,
    );
    const routingInfo =
        canAssignRouting && selectedRouting !== String(selected?.routeId)
            ? chosenRouting
            : selected;
    const endorsementRequired =
        releasing &&
        (routingInfo?.endorsementRequired === true ||
            selected?.endorsementRequired === true);
    useEffect(() => setEndorse(false), [selected?.id, selectedRouting]);
    const releaseError = releasing ? routingInfo?.releaseError : null;

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selected || savingRef.current) return;
        const controller = new AbortController();
        request.current = controller;
        savingRef.current = true;
        setSaving(true);
        setError(null);
        try {
            const cookie = document.cookie
                .split('; ')
                .find((value) => value.startsWith('XSRF-TOKEN='));
            const response = await fetch(
                (reverting ? revert : receiving ? receive : release).url(),
                {
                    method: 'POST',
                    credentials: 'same-origin',
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': cookie
                            ? decodeURIComponent(
                                  cookie.slice('XSRF-TOKEN='.length),
                              )
                            : '',
                    },
                    body: JSON.stringify({
                        ...(reverting
                            ? {
                                  document_id: selected.id,
                                  transfer_id: selected.transferId,
                              }
                            : selected.trackingCode
                              ? { tracking_code: selected.trackingCode }
                              : { document_id: selected.id }),
                        office_id: officeId,
                        ...(releasing
                            ? {
                                  endorse: endorsementRequired && endorse,
                                  ...(canAssignRouting
                                      ? {
                                            document_route_id:
                                                selectedRouting === 'none'
                                                    ? null
                                                    : Number(selectedRouting),
                                        }
                                      : {}),
                              }
                            : {}),
                    }),
                },
            );
            const data = await response.json().catch(() => null);
            if (
                !response.ok ||
                response.redirected ||
                typeof data?.message !== 'string'
            ) {
                const validation = data?.errors
                    ? Object.values(data.errors)
                          .flat()
                          .find((message) => typeof message === 'string')
                    : null;
                throw new Error(
                    typeof validation === 'string'
                        ? validation
                        : response.status === 419 || response.redirected
                          ? 'Your session expired. Refresh the page and try again.'
                          : (data?.message ??
                            'The document could not be updated. Please try again.'),
                );
            }
            toast.success(
                data.trackingCode
                    ? `${data.message} ${data.trackingCode}`
                    : data.message,
            );
            onCompleted();
        } catch (cause) {
            if (!controller.signal.aborted)
                setError(
                    cause instanceof Error
                        ? cause.message
                        : 'The document could not be updated.',
                );
        } finally {
            savingRef.current = false;
            if (!controller.signal.aborted) setSaving(false);
            request.current = null;
        }
    }

    return (
        <Dialog
            open
            disablePointerDismissal={saving}
            onOpenChange={(open) => {
                if (!open && !savingRef.current) onClose();
            }}
        >
            <DialogContent
                showClose={!saving}
                className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-none sm:max-w-lg dark:bg-black"
            >
                <DialogHeader className="text-left">
                    <DialogTitle>
                        {reverting
                            ? 'Recently released'
                            : receiving
                              ? 'Receive document'
                              : 'Release document'}
                    </DialogTitle>
                    <DialogDescription>{officeName}</DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={submit}
                    className="grid min-h-0 min-w-0 grid-cols-1 gap-4 overflow-y-auto"
                >
                    {reverting && (
                        <p className="text-sm leading-6 text-muted-foreground">
                            Revert any of your office’s last three releases that
                            have not been received. The document returns to your
                            office; its routing and endorsements are kept.
                        </p>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="office-document-search">
                            Find a document
                        </Label>
                        <SearchBar
                            id="office-document-search"
                            value={query}
                            maxLength={200}
                            disabled={saving}
                            placeholder="Scan tracking code, or search documents"
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setSelected(null);
                                setRoutingId(null);
                                setError(null);
                                setLoading(true);
                            }}
                        />
                    </div>
                    <div aria-live="polite" className="min-h-20">
                        {loading ? (
                            <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                                <Spinner /> Loading documents…
                            </p>
                        ) : loadError ? (
                            <div className="grid gap-3 text-sm">
                                <p role="alert">{loadError}</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setRetry((value) => value + 1)
                                    }
                                >
                                    Try again
                                </Button>
                            </div>
                        ) : options?.documents.length === 0 ? (
                            <p className="py-6 text-sm text-muted-foreground">
                                {query
                                    ? 'No matching documents. Try another search.'
                                    : reverting
                                      ? 'No recent releases are available to revert.'
                                      : receiving
                                        ? 'No documents are awaiting receipt at this office.'
                                        : 'No documents are available to release from this office.'}
                            </p>
                        ) : (
                            <div
                                role="group"
                                aria-label="Choose a document"
                                className="max-h-56 divide-y divide-border overflow-y-auto border border-border"
                            >
                                {options?.documents.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        disabled={saving}
                                        aria-pressed={selected?.id === item.id}
                                        onClick={() => {
                                            setSelected(item);
                                            setRoutingId(null);
                                            setError(null);
                                        }}
                                        className={cn(
                                            'flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset disabled:opacity-50',
                                            selected?.id === item.id &&
                                                'bg-accent',
                                        )}
                                    >
                                        {selected?.id === item.id ? (
                                            <Check
                                                className="mt-0.5 size-4 shrink-0"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <FileText
                                                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                                aria-hidden="true"
                                            />
                                        )}
                                        <span className="min-w-0">
                                            <span className="block truncate font-medium">
                                                {item.title}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {item.trackingCode &&
                                                    `${item.trackingCode} · `}
                                                {reverting && item.releasedAt
                                                    ? `Released ${new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.releasedAt))}`
                                                    : receiving
                                                      ? `From ${item.fromOfficeName ?? 'another office'}`
                                                      : item.filename}
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {options?.hasMore && !loading && (
                            <p className="mt-2 text-xs text-muted-foreground">
                                Showing 50 documents. Refine your search to find
                                another.
                            </p>
                        )}
                    </div>
                    {selected && canAssignRouting && (
                        <div className="grid gap-2">
                            <Label htmlFor="release-routing">Routing</Label>
                            <Select
                                value={selectedRouting}
                                disabled={saving}
                                onValueChange={(value) => {
                                    setRoutingId(
                                        typeof value === 'string'
                                            ? value
                                            : 'none',
                                    );
                                    setError(null);
                                }}
                                items={[
                                    {
                                        value: 'none',
                                        label: 'No fixed routing',
                                    },
                                    ...(options?.routing ?? []).map(
                                        (route) => ({
                                            value: String(route.id),
                                            label: route.name,
                                        }),
                                    ),
                                ]}
                            >
                                <SelectTrigger
                                    id="release-routing"
                                    className="w-full rounded-none"
                                >
                                    <SelectValue placeholder="No fixed routing" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        No fixed routing
                                    </SelectItem>
                                    {options?.routing.map((route) => (
                                        <SelectItem
                                            key={route.id}
                                            value={String(route.id)}
                                        >
                                            {route.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs leading-5 text-muted-foreground">
                                {chosenRouting
                                    ? chosenRouting.steps.join(' → ')
                                    : 'Any other office can receive this document after release.'}
                            </p>
                        </div>
                    )}
                    {selected &&
                        releasing &&
                        !releaseError &&
                        routingInfo?.nextOfficeName && (
                            <div className="grid gap-1 border border-border bg-muted/40 px-3 py-2.5 text-sm">
                                <p className="text-xs text-muted-foreground">
                                    Next office
                                </p>
                                <p className="font-medium">
                                    {routingInfo.nextOfficeName}
                                </p>
                            </div>
                        )}
                    {endorsementRequired && (
                        <label className="flex items-start gap-2 rounded-md border border-border p-3 text-sm">
                            <input
                                type="checkbox"
                                checked={endorse}
                                onChange={(event) =>
                                    setEndorse(event.target.checked)
                                }
                                disabled={saving}
                                className="mt-0.5 size-4 accent-blue-900"
                            />
                            <span>
                                Endorse this document for {officeName} before
                                releasing it.
                            </span>
                        </label>
                    )}
                    {selected && !releaseError && (
                        <p className="text-xs leading-5 text-muted-foreground">
                            {reverting
                                ? 'Revert this release and return the document to your office?'
                                : receiving
                                  ? `Confirm that the document has arrived at ${officeName}.`
                                  : selected.trackingCode
                                    ? routingInfo?.nextOfficeName
                                        ? 'The document will leave your office and stay in transit until the next office receives it.'
                                        : 'The document will leave your office and stay in transit. Any other office can receive it using its tracking code.'
                                    : 'A tracking code will be assigned when released. The document stays in transit until received.'}
                        </p>
                    )}
                    {(error || releaseError) && (
                        <p role="alert" className="text-sm text-destructive">
                            {error ?? releaseError}
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={saving}
                            onClick={onClose}
                            className="rounded-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                saving ||
                                loading ||
                                !!loadError ||
                                !selected ||
                                !!releaseError ||
                                (endorsementRequired && !endorse)
                            }
                            className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800"
                        >
                            {saving ? (
                                <Spinner />
                            ) : reverting ? (
                                <Undo2 aria-hidden="true" />
                            ) : receiving ? (
                                <Inbox aria-hidden="true" />
                            ) : (
                                <Send aria-hidden="true" />
                            )}
                            {saving
                                ? 'Saving…'
                                : reverting
                                  ? 'Revert release'
                                  : receiving
                                    ? 'Receive document'
                                    : 'Release document'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
