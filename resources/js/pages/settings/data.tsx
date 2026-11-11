import { Head, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import Heading from '@/components/heading';
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
import { destroy, edit } from '@/routes/data';

export default function Data({
    counts,
    status,
}: {
    counts: {
        documents: number;
        declarations: number;
        cabinets: number;
        books: number;
    };
    status?: string;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({ confirmation: '' });

    function changeOpen(value: boolean) {
        if (form.processing) return;
        setOpen(value);
        form.reset();
        form.clearErrors();
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.delete(destroy.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    }

    return (
        <>
            <Head title="Data settings" />
            <h1 className="sr-only">Data settings</h1>
            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Data"
                    description="Manage the local archive and its stored documents."
                />
                {status === 'archive-reset' && (
                    <p role="status" className="text-sm text-foreground">
                        Archive data and stored files cleared. Accounts and OCR
                        settings retained.
                    </p>
                )}
                <dl className="divide-y border-y text-sm">
                    {[
                        ['Documents', counts.documents],
                        ['Tax declarations', counts.declarations],
                        ['Cabinets', counts.cabinets],
                        ['Books and folders', counts.books],
                    ].map(([label, count]) => (
                        <div
                            key={label}
                            className="flex items-center justify-between gap-4 py-3"
                        >
                            <dt className="text-muted-foreground">{label}</dt>
                            <dd className="font-medium tabular-nums">
                                {count}
                            </dd>
                        </div>
                    ))}
                </dl>
                <section
                    aria-labelledby="reset-archive-title"
                    className="space-y-4"
                >
                    <h2
                        id="reset-archive-title"
                        className="text-sm font-semibold"
                    >
                        Reset archive data
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Permanently delete all documents, OCR results, preview
                        files, declarations, properties, owners, cabinets,
                        drawers, books, and folders.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        User accounts, sign-in details, and OCR settings are
                        retained. Finish any pending OCR before resetting.
                    </p>
                    <Button
                        variant="destructive"
                        onClick={() => changeOpen(true)}
                    >
                        Reset archive data
                    </Button>
                </section>
            </div>
            <Dialog open={open} onOpenChange={changeOpen}>
                <DialogContent showClose={!form.processing}>
                    <DialogHeader>
                        <DialogTitle>Reset the local archive?</DialogTitle>
                        <DialogDescription>
                            All archive records and stored document files will
                            be permanently deleted. Accounts and OCR settings
                            will stay. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="reset-confirmation">
                                Type RESET to confirm
                            </Label>
                            <Input
                                id="reset-confirmation"
                                autoFocus
                                autoComplete="off"
                                spellCheck={false}
                                value={form.data.confirmation}
                                disabled={form.processing}
                                aria-invalid={Boolean(form.errors.confirmation)}
                                aria-describedby={
                                    form.errors.confirmation
                                        ? 'reset-confirmation-error'
                                        : undefined
                                }
                                onChange={(event) =>
                                    form.setData(
                                        'confirmation',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError
                                id="reset-confirmation-error"
                                message={form.errors.confirmation}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={form.processing}
                                onClick={() => changeOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={
                                    form.processing ||
                                    form.data.confirmation !== 'RESET'
                                }
                            >
                                {form.processing
                                    ? 'Resetting…'
                                    : 'Reset archive data'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

Data.layout = { breadcrumbs: [{ title: 'Data settings', href: edit() }] };
