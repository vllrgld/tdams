import { MoreVertical, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { destroy } from '@/routes/documents';
import type { ArchivedDocument } from '@/types/documents';
import { documentHeading } from './document-view-helpers';

export default function DocumentCardMenu({
    document,
    onDeleted,
}: {
    document: ArchivedDocument;
    onDeleted: (document: ArchivedDocument) => void;
}) {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const request = useRef<AbortController | null>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const cancel = useRef<HTMLButtonElement>(null);
    useEffect(() => () => request.current?.abort(), []);

    async function remove() {
        if (request.current) return;
        const controller = new AbortController();
        request.current = controller;
        setPending(true);
        setError(null);
        const cookie = window.document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='));
        try {
            const response = await fetch(destroy.url(document.id), {
                method: 'DELETE',
                credentials: 'same-origin',
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': cookie
                        ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length))
                        : '',
                },
            });
            const data = await response.json().catch(() => null);
            if (!response.ok)
                throw new Error(
                    data?.errors?.document?.[0] ||
                        data?.message ||
                        'The document could not be deleted. Try again.',
                );
            if (controller.signal.aborted) return;
            setOpen(false);
            if (data?.cleanupPending)
                toast.warning(
                    'Document deleted. Stored file cleanup will retry automatically.',
                );
            else toast.success('Document deleted.');
            onDeleted(document);
        } catch (exception) {
            if (!controller.signal.aborted)
                setError(
                    exception instanceof Error
                        ? exception.message
                        : 'The document could not be deleted. Try again.',
                );
        } finally {
            if (!controller.signal.aborted) {
                request.current = null;
                setPending(false);
            }
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            ref={trigger}
                            type="button"
                            variant="ghost"
                            size="icon"
                        />
                    }
                    aria-label={`Document actions for ${document.originalFilename}`}
                    className="absolute right-1.5 bottom-1.5 z-30 size-8 rounded-none text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                >
                    <MoreVertical aria-hidden="true" className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" positionerClassName="z-70">
                    <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                            setError(null);
                            setOpen(true);
                        }}
                    >
                        <Trash2 aria-hidden="true" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Dialog
                open={open}
                onOpenChange={(next) => {
                    if (!pending) setOpen(next);
                }}
            >
                <DialogContent
                    initialFocus={cancel}
                    finalFocus={trigger}
                    showClose={!pending}
                    className="rounded-none dark:border-neutral-800 dark:bg-black"
                >
                    <DialogHeader>
                        <DialogTitle>Delete document?</DialogTitle>
                        <DialogDescription>
                            Permanently delete this document, its OCR results,
                            activity, attachments, and stored files. Remaining
                            documents in its filing item will move up. This
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <p className="text-sm font-medium break-words">
                        {documentHeading(document)}
                    </p>
                    <InputError message={error ?? undefined} role="alert" />
                    <DialogFooter>
                        <Button
                            ref={cancel}
                            type="button"
                            variant="outline"
                            disabled={pending}
                            onClick={() => setOpen(false)}
                            className="rounded-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={pending}
                            onClick={() => void remove()}
                            className="rounded-none"
                        >
                            {pending ? (
                                <>
                                    <Spinner /> Deleting…
                                </>
                            ) : (
                                'Delete document'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
