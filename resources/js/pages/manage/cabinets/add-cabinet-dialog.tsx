import type { FormEvent } from 'react';
import type { InertiaFormProps } from '@inertiajs/react';
import { Plus } from 'lucide-react';
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

type CabinetForm = {
    name: string;
    drawer_count: number;
};

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
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-none sm:max-w-md dark:border-neutral-800 dark:bg-black">
                <DialogHeader>
                    <DialogTitle>Add cabinet</DialogTitle>
                    <DialogDescription>
                        Set the cabinet name and how many drawers it has.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="cabinet-name">Name</Label>
                        <Input
                            id="cabinet-name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            required
                            maxLength={150}
                            className="rounded-none"
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="cabinet-drawer-count">Drawers</Label>
                        <Input
                            id="cabinet-drawer-count"
                            type="number"
                            min={1}
                            max={8}
                            value={form.data.drawer_count}
                            onChange={(event) =>
                                form.setData(
                                    'drawer_count',
                                    Number(event.target.value),
                                )
                            }
                            required
                            className="rounded-none"
                        />
                        <InputError message={form.errors.drawer_count} />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={form.processing}
                            onClick={() => onOpenChange(false)}
                            className="rounded-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                            <Plus aria-hidden="true" />
                            {form.processing ? 'Adding…' : 'Add cabinet'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
