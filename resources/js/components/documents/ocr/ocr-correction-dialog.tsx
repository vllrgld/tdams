import { useLayoutEffect, useState, type FormEvent } from 'react';
import { Popover } from '@base-ui/react/popover';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';

export default function OcrCorrectionDialog({
    text,
    anchor,
    onConfirm,
    onClose,
}: {
    text: string;
    anchor: HTMLElement;
    onConfirm: (text: string) => Promise<void>;
    onClose: () => void;
}) {
    const [draft, setDraft] = useState(text);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>();
    const [boundary, setBoundary] = useState<HTMLElement | null>(null);

    useLayoutEffect(() => {
        const viewport = anchor.closest<HTMLElement>(
            '[data-document-viewport]',
        );
        if (!viewport) return;
        const update = () =>
            setBoundary(viewport.clientWidth >= 360 ? viewport : null);
        const observer = new ResizeObserver(update);
        update();
        observer.observe(viewport);
        return () => observer.disconnect();
    }, [anchor]);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (saving || !draft.trim() || draft === text) return;
        setSaving(true);
        setError(undefined);
        try {
            await onConfirm(draft);
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                setError(error.message);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Popover.Root
            open
            modal
            onOpenChange={(open) => {
                if (!open && !saving) onClose();
            }}
        >
            <Popover.Portal>
                <Popover.Backdrop className="fixed inset-0 z-[70] bg-transparent" />
                <Popover.Positioner
                    anchor={anchor}
                    positionMethod="fixed"
                    side="bottom"
                    align="start"
                    sideOffset={8}
                    collisionBoundary={boundary ?? undefined}
                    collisionPadding={8}
                    sticky
                    className="z-[75]"
                >
                    <Popover.Popup
                        finalFocus={() => (anchor.isConnected ? anchor : false)}
                        className="relative grid max-h-[min(32rem,var(--available-height))] w-[min(28rem,calc(100vw-2rem))] max-w-[var(--available-width)] gap-4 overflow-y-auto rounded-none border border-border bg-background p-4 text-foreground shadow-lg outline-none"
                    >
                        <form onSubmit={submit} className="grid gap-4">
                            <DialogHeader className="pr-6 text-left">
                                <Popover.Title className="text-lg leading-none font-semibold">
                                    Correct OCR text
                                </Popover.Title>
                                <Popover.Description className="text-sm text-muted-foreground">
                                    Update the text recognized in this block.
                                </Popover.Description>
                            </DialogHeader>
                            <textarea
                                aria-label="Corrected OCR text"
                                aria-invalid={Boolean(error)}
                                aria-describedby={
                                    error ? 'ocr-correction-error' : undefined
                                }
                                value={draft}
                                onChange={(event) =>
                                    setDraft(event.target.value)
                                }
                                disabled={saving}
                                maxLength={20000}
                                rows={6}
                                className="max-h-[50vh] min-h-40 w-full resize-y rounded-none border border-input bg-muted/30 p-3 text-sm leading-6 text-foreground outline-none selection:bg-blue-200 selection:text-slate-950 focus-visible:border-blue-900 focus-visible:ring-2 focus-visible:ring-blue-900/20 disabled:opacity-50 dark:focus-visible:border-white dark:focus-visible:ring-white/20"
                            />
                            <InputError
                                id="ocr-correction-error"
                                message={error}
                            />
                            <DialogFooter>
                                <Popover.Close
                                    render={
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={saving}
                                            className="rounded-none"
                                        />
                                    }
                                >
                                    Cancel
                                </Popover.Close>
                                <Button
                                    type="submit"
                                    disabled={
                                        saving ||
                                        !draft.trim() ||
                                        draft === text
                                    }
                                    className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700"
                                >
                                    {saving && <Spinner />}
                                    {saving ? 'Saving…' : 'Confirm'}
                                </Button>
                            </DialogFooter>
                        </form>
                        {!saving && (
                            <Popover.Close
                                aria-label="Close"
                                className="absolute top-4 right-4 opacity-70 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:outline-none dark:focus-visible:ring-white"
                            >
                                <X className="size-4" aria-hidden="true" />
                            </Popover.Close>
                        )}
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}
