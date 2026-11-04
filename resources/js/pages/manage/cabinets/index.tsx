import { Head, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type {
    CabinetListDrawer,
    CabinetListItem,
} from '@/pages/archive/data/cabinets';
import AddBookDialog, { type BookForm } from './add-book-dialog';
import AddCabinetDialog from './add-cabinet-dialog';
import CabinetRenameTitle from './cabinet-rename-title';
import DrawerRenameRow from './drawer-rename-row';

export default function Cabinets({
    cabinets,
    coverTitle,
    folderCoverTitle,
}: {
    cabinets: CabinetListItem[];
    coverTitle: string;
    folderCoverTitle: string;
}) {
    const [addOpen, setAddOpen] = useState(false);
    const [addBookDrawer, setAddBookDrawer] =
        useState<CabinetListDrawer | null>(null);
    const form = useForm({
        name: '',
        drawers: ['Drawer 1', 'Drawer 2', 'Drawer 3', 'Drawer 4'],
    });
    const bookForm = useForm<BookForm>({
        label: '',
        kind: 'book',
    });

    function submitCabinet(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post('/manage/cabinets', {
            onSuccess: () => {
                setAddOpen(false);
                form.reset();
                toast.success('Cabinet added.');
            },
        });
    }

    function openAddBook(drawer: CabinetListDrawer) {
        const kind = drawer.books[0]?.kind ?? 'book';
        bookForm.setData({
            kind,
            label: `${kind === 'folder' ? 'Folder' : 'Book'} ${drawer.books.length + 1}`,
        });
        bookForm.clearErrors();
        setAddBookDrawer(drawer);
    }

    function submitBook(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!addBookDrawer) {
            return;
        }

        bookForm.post(`/manage/drawers/${addBookDrawer.id}/books`, {
            preserveScroll: true,
            onSuccess: () => {
                setAddBookDrawer(null);
                bookForm.reset();
                toast.success(
                    `${bookForm.data.kind === 'folder' ? 'Folder' : 'Book'} added.`,
                );
            },
        });
    }

    return (
        <>
            <Head title="Cabinets" />
            <main className="min-h-full flex-1 bg-background p-4 sm:p-6 xl:p-8">
                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
                    <header className="flex flex-col justify-between gap-4 border-b border-blue-900 pb-5 sm:flex-row sm:items-end dark:border-blue-200">
                        <div>
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-neutral-50">
                                    Cabinets
                                </h1>
                                <p className="text-sm text-slate-600 tabular-nums dark:text-neutral-400">
                                    {cabinets.length}{' '}
                                    {cabinets.length === 1
                                        ? 'cabinet'
                                        : 'cabinets'}
                                </p>
                            </div>
                            <p className="mt-2 max-w-[65ch] text-sm text-slate-600 dark:text-neutral-400">
                                Add filing cabinets and see them on the Archive
                                floor
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={() => setAddOpen(true)}
                            className="w-fit shrink-0 rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                            <Plus aria-hidden="true" />
                            Add cabinet
                        </Button>
                    </header>
                    {cabinets.length === 0 ? (
                        <p className="border border-slate-200 bg-card px-5 py-10 text-sm leading-6 text-slate-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-400">
                            No cabinets yet. Add a cabinet to start organizing
                            drawers.
                        </p>
                    ) : (
                        <ul
                            aria-label="Filing cabinets"
                            className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3"
                        >
                            {cabinets.map((cabinet) => (
                                <li
                                    key={cabinet.id}
                                    className="min-w-0 self-start border border-slate-200 bg-card dark:border-neutral-800 dark:bg-black"
                                >
                                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
                                        <div className="min-w-0 flex-1">
                                            <CabinetRenameTitle
                                                cabinet={cabinet}
                                            />
                                        </div>
                                        <span className="shrink-0 text-xs text-slate-600 tabular-nums dark:text-neutral-400">
                                            {cabinet.drawers.length}{' '}
                                            {cabinet.drawers.length === 1
                                                ? 'drawer'
                                                : 'drawers'}
                                        </span>
                                    </div>
                                    {cabinet.drawers.length > 0 ? (
                                        <ul
                                            aria-label={`Drawers in ${cabinet.name}`}
                                        >
                                            {cabinet.drawers.map((drawer) => (
                                                <DrawerRenameRow
                                                    key={drawer.id}
                                                    drawer={drawer}
                                                    onAddBook={openAddBook}
                                                />
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="px-4 py-5 text-sm text-slate-600 dark:text-neutral-400">
                                            No drawers in this cabinet.
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
            <AddCabinetDialog
                form={form}
                open={addOpen}
                onOpenChange={setAddOpen}
                onSubmit={submitCabinet}
            />
            <AddBookDialog
                form={bookForm}
                coverTitle={coverTitle}
                folderCoverTitle={folderCoverTitle}
                lockedKind={addBookDrawer?.books[0]?.kind}
                drawerLabel={addBookDrawer?.label ?? ''}
                open={addBookDrawer !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setAddBookDrawer(null);
                    }
                }}
                onSubmit={submitBook}
            />
        </>
    );
}

Cabinets.layout = {
    breadcrumbs: [
        {
            title: 'Manage',
            href: '/manage/cabinets',
        },
        {
            title: 'Cabinets',
            href: '/manage/cabinets',
        },
    ],
};
