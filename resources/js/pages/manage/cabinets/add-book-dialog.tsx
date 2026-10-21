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

type BookForm = {
    label: string;
};

type AddBookDialogProps = {
    form: InertiaFormProps<BookForm>;
    drawerLabel: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function AddBookDialog({
    form,
    drawerLabel,
    open,
    onOpenChange,
    onSubmit,
}: AddBookDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-none sm:max-w-md dark:border-neutral-800 dark:bg-black">
                <DialogHeader>
                    <DialogTitle>Add book</DialogTitle>
                    <DialogDescription>
                        Add a book to {drawerLabel}. It will show in that drawer
                        on the Archive floor.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="book-label">Label</Label>
                        <Input
                            id="book-label"
                            value={form.data.label}
                            onChange={(event) =>
                                form.setData('label', event.target.value)
                            }
                            required
                            maxLength={100}
                            className="rounded-none"
                        />
                        <InputError message={form.errors.label} />
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
                            {form.processing ? 'Adding…' : 'Add book'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
