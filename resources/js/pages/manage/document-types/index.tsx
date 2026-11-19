import { Head, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
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
import { index, store, update } from '@/routes/manage/document-types';

type DocumentTypeRecord = {
    id: number;
    name: string;
    slug: string;
    usesTaxFields: boolean;
    documentCount: number;
    editable: boolean;
};

export default function DocumentTypes({ types }: { types: DocumentTypeRecord[] }) {
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState<DocumentTypeRecord | null>(null);
    const form = useForm({ name: '' });
    const dialogOpen = addOpen || editing !== null;

    function closeDialog() {
        setAddOpen(false);
        setEditing(null);
        form.reset();
        form.clearErrors();
    }

    function openAdd() {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setAddOpen(true);
    }

    function openEdit(type: DocumentTypeRecord) {
        form.clearErrors();
        form.setData('name', type.name);
        setAddOpen(false);
        setEditing(type);
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                closeDialog();
            },
        };

        if (editing) {
            form.patch(update.url(editing.id), options);

            return;
        }

        form.post(store.url(), options);
    }

    return (
        <>
            <Head title="Document types" />
            <main className="min-h-full flex-1 bg-background p-4 sm:p-6 xl:p-8">
                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
                    <header className="flex flex-col justify-between gap-4 border-b border-blue-900 pb-5 sm:flex-row sm:items-start dark:border-blue-200">
                        <div>
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-neutral-50">
                                    Document types
                                </h1>
                                <p className="text-sm text-slate-600 tabular-nums dark:text-neutral-400">
                                    {types.length}{' '}
                                    {types.length === 1
                                        ? 'document type'
                                        : 'document types'}
                                </p>
                            </div>
                            <p className="mt-2 max-w-[65ch] text-sm text-slate-600 dark:text-neutral-400">
                                Choose a type when a document is uploaded.
                                Mapping reads the correspondent from the scan.
                                Tax declarations also use the declaration
                                fields.
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={openAdd}
                            className="w-fit shrink-0 rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                            <Plus aria-hidden="true" />
                            Add document type
                        </Button>
                    </header>

                    {types.length === 0 ? (
                        <p className="border border-slate-200 bg-card px-5 py-10 text-sm leading-6 text-slate-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-400">
                            No document types yet. Add a type before staff can
                            choose it during upload.
                        </p>
                    ) : (
                        <ul
                            aria-label="Document types"
                            className="divide-y divide-slate-200 border border-slate-200 bg-card dark:divide-neutral-800 dark:border-neutral-800 dark:bg-black"
                        >
                            {types.map((type) => (
                                <li
                                    key={type.id}
                                    className="flex items-center justify-between gap-4 px-4 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-950 dark:text-neutral-50">
                                            {type.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-neutral-400">
                                            {type.usesTaxFields
                                                ? 'Tax declaration fields and correspondent'
                                                : 'Correspondent'}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-4">
                                        <p className="text-xs text-slate-600 tabular-nums dark:text-neutral-400">
                                            {type.documentCount}{' '}
                                            {type.documentCount === 1
                                                ? 'document'
                                                : 'documents'}
                                        </p>
                                        {type.editable && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => openEdit(type)}
                                                className="rounded-none"
                                            >
                                                Edit
                                            </Button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDialog();
                    }
                }}
            >
                <DialogContent className="rounded-none sm:max-w-md dark:border-neutral-800 dark:bg-black">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit document type' : 'Add document type'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? 'Change the name staff see when a document is uploaded.'
                                : 'Name the type staff will choose when a document is uploaded.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="document-type-name">Name</Label>
                            <Input
                                id="document-type-name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                required
                                maxLength={100}
                                placeholder="Certification"
                                className="rounded-none"
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={form.processing}
                                onClick={closeDialog}
                                className="rounded-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                            >
                                {form.processing
                                    ? 'Saving…'
                                    : editing
                                      ? 'Save'
                                      : 'Add document type'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

DocumentTypes.layout = {
    breadcrumbs: [
        { title: 'Manage', href: index() },
        { title: 'Document types', href: index() },
    ],
};
