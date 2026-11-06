import type { FormEvent } from 'react';
import type { InertiaFormProps } from '@inertiajs/react';
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
import RotatableFilingItem from '@/components/filing/rotatable-filing-item';
import type { FilingKind } from '@/types/filing';

export type FilingItemForm = {
    label: string;
    kind: FilingKind;
};

type AddFilingItemDialogProps = {
    form: InertiaFormProps<FilingItemForm>;
    drawerLabel: string;
    coverTitle: string;
    folderCoverTitle: string;
    lockedKind?: FilingKind;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function AddFilingItemDialog({
    form,
    drawerLabel,
    coverTitle,
    folderCoverTitle,
    lockedKind,
    open,
    onOpenChange,
    onSubmit,
}: AddFilingItemDialogProps) {
    const itemName = form.data.kind === 'folder' ? 'folder' : 'book';
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-3xl dark:border-neutral-800 dark:bg-black">
                <DialogHeader className="shrink-0 px-5 pt-5 pb-2 text-left sm:px-6">
                    <DialogTitle className="text-xl font-semibold tracking-tight">
                        Add {itemName}
                    </DialogTitle>
                    <DialogDescription>
                        Add a {itemName} to {drawerLabel}. It will show in that
                        drawer on the Archive floor.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="flex min-h-0 flex-col">
                    <div className="grid min-h-0 overflow-y-auto md:grid-cols-[20rem_minmax(0,1fr)]">
                        <div className="min-w-0 px-5 py-3 sm:px-6">
                            {open && (
                                <RotatableFilingItem
                                    key={form.data.kind}
                                    label={
                                        form.data.label.trim() ||
                                        `New ${itemName}`
                                    }
                                    coverTitle={
                                        form.data.kind === 'folder'
                                            ? folderCoverTitle
                                            : coverTitle
                                    }
                                    kind={form.data.kind}
                                    compact
                                    upright
                                />
                            )}
                        </div>
                        <div className="grid content-start gap-2 p-5 sm:p-6">
                            <fieldset className="mb-4 grid gap-3 border-0 p-0">
                                <legend className="mb-2 text-sm font-medium">
                                    File as
                                </legend>
                                <div className="flex gap-6">
                                    {(['book', 'folder'] as const).map(
                                        (kind) => (
                                            <label
                                                key={kind}
                                                className="flex items-center gap-2 text-sm has-disabled:opacity-50"
                                            >
                                                <input
                                                    type="radio"
                                                    name="filing-kind"
                                                    value={kind}
                                                    checked={
                                                        form.data.kind === kind
                                                    }
                                                    disabled={
                                                        form.processing ||
                                                        (lockedKind !==
                                                            undefined &&
                                                            lockedKind !== kind)
                                                    }
                                                    onChange={() => {
                                                        const automaticName =
                                                            form.data.label.match(
                                                                /^(?:Book|Folder) (\d+)$/,
                                                            );
                                                        form.setData({
                                                            ...form.data,
                                                            kind,
                                                            label: automaticName
                                                                ? `${kind === 'folder' ? 'Folder' : 'Book'} ${automaticName[1]}`
                                                                : form.data
                                                                      .label,
                                                        });
                                                    }}
                                                    className="size-4 accent-blue-900"
                                                />
                                                {kind === 'book'
                                                    ? 'Book'
                                                    : 'Folder'}
                                            </label>
                                        ),
                                    )}
                                </div>
                                <p className="text-xs leading-5 text-slate-600 dark:text-neutral-400">
                                    {lockedKind
                                        ? `This drawer holds ${lockedKind}s only.`
                                        : 'The first item determines whether this drawer holds books or folders.'}
                                </p>
                                <InputError message={form.errors.kind} />
                            </fieldset>
                            <Label htmlFor="book-label">
                                {itemName === 'folder'
                                    ? 'Folder name'
                                    : 'Label'}
                            </Label>
                            <Input
                                id="book-label"
                                value={form.data.label}
                                onChange={(event) =>
                                    form.setData('label', event.target.value)
                                }
                                required
                                maxLength={100}
                                disabled={form.processing}
                                className="rounded-none"
                            />
                            <InputError message={form.errors.label} />
                        </div>
                    </div>

                    <DialogFooter className="shrink-0 flex-row items-center justify-end border-t border-slate-200 px-5 py-4 sm:px-6 dark:border-neutral-800">
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={form.processing}
                            onClick={() => onOpenChange(false)}
                            className="rounded-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700"
                        >
                            {form.processing ? 'Adding…' : `Add ${itemName}`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
