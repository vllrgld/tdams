import { useId, type FormEvent } from 'react';
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
import FilingCabinet from '@/pages/archive/components/cabinets/filing-cabinet';
import type { FilingCabinet as FilingCabinetData } from '@/pages/archive/data/cabinets';

type CabinetForm = {
    name: string;
    drawers: string[];
};

const ignorePreviewAction = () => undefined;

function drawerNames(current: string[], count: number): string[] {
    const size = Math.min(8, Math.max(1, count));

    const next = current.slice(0, size);

    while (next.length < size) {
        next.push(`Drawer ${next.length + 1}`);
    }

    return next;
}

type AddCabinetDialogProps = {
    form: InertiaFormProps<CabinetForm>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function AddCabinetDialog({
    form,
    open,
    onOpenChange,
    onSubmit,
}: AddCabinetDialogProps) {
    const previewId = useId();
    const previewCabinet: FilingCabinetData = {
        id: `preview-${previewId}`,
        name: form.data.name.trim() || 'New cabinet',
        location: '',
        drawers: form.data.drawers.map((label, index) => ({
            id: `${previewId}-${index}`,
            label: label.trim() || `Drawer ${index + 1}`,
            range: '',
            books: [],
        })),
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-4xl dark:border-neutral-800 dark:bg-black">
                <DialogHeader className="shrink-0 px-5 pt-5 pb-2 text-left sm:px-6">
                    <DialogTitle className="text-xl font-semibold tracking-tight">
                        Add cabinet
                    </DialogTitle>
                    <DialogDescription>
                        Set the cabinet name and how many drawers it has.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="flex min-h-0 flex-col">
                    <div className="grid min-h-0 overflow-y-auto md:grid-cols-[20rem_minmax(0,1fr)]">
                        <figure className="min-w-0 px-4 pt-5 md:py-6">
                            <figcaption className="sr-only">
                                Cabinet preview
                            </figcaption>
                            <div className="flex h-60 justify-center overflow-hidden md:h-[25rem]">
                                <div
                                    inert
                                    aria-hidden="true"
                                    className="pointer-events-none shrink-0 origin-top scale-[0.55] md:scale-90"
                                >
                                    {open && (
                                        <FilingCabinet
                                            cabinet={previewCabinet}
                                            openDrawerId={null}
                                            zoomed={false}
                                            onOpenDrawerChange={
                                                ignorePreviewAction
                                            }
                                            onZoomChange={ignorePreviewAction}
                                            onOpenBook={ignorePreviewAction}
                                        />
                                    )}
                                </div>
                            </div>
                        </figure>
                        <div className="grid content-start gap-5 p-5 sm:p-6">
                            <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-4 sm:grid-cols-[minmax(0,1fr)_6rem]">
                                <div className="grid gap-2">
                                    <Label htmlFor="cabinet-name">Name</Label>
                                    <Input
                                        id="cabinet-name"
                                        value={form.data.name}
                                        onChange={(event) =>
                                            form.setData(
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        maxLength={150}
                                        className="rounded-none"
                                    />
                                    <InputError message={form.errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="cabinet-drawer-count">
                                        Drawers
                                    </Label>
                                    <Input
                                        id="cabinet-drawer-count"
                                        type="number"
                                        min={1}
                                        max={8}
                                        value={form.data.drawers.length}
                                        onChange={(event) =>
                                            form.setData(
                                                'drawers',
                                                drawerNames(
                                                    form.data.drawers,
                                                    Number(event.target.value),
                                                ),
                                            )
                                        }
                                        required
                                        className="rounded-none"
                                    />
                                    <InputError message={form.errors.drawers} />
                                </div>
                            </div>

                            <fieldset className="min-w-0 border-0 p-0">
                                <legend className="mb-2 text-sm font-medium text-slate-800 dark:text-neutral-200">
                                    Drawer names
                                </legend>
                                {form.data.drawers.map((label, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 py-2"
                                    >
                                        <Label
                                            htmlFor={`drawer-name-${index}`}
                                            className="text-xs font-normal text-slate-600 dark:text-neutral-400"
                                        >
                                            Drawer {index + 1}
                                        </Label>
                                        <Input
                                            id={`drawer-name-${index}`}
                                            value={label}
                                            onChange={(event) => {
                                                const drawers = [
                                                    ...form.data.drawers,
                                                ];
                                                drawers[index] =
                                                    event.target.value;
                                                form.setData(
                                                    'drawers',
                                                    drawers,
                                                );
                                            }}
                                            required
                                            maxLength={100}
                                            className="rounded-none"
                                        />
                                        <InputError
                                            className="col-start-2"
                                            message={
                                                form.errors[`drawers.${index}`]
                                            }
                                        />
                                    </div>
                                ))}
                            </fieldset>
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
                            {form.processing ? 'Adding…' : 'Add cabinet'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
