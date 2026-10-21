import { Head, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import DrawerIcon from '@/components/drawer-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type {
    CabinetListDrawer,
    CabinetListItem,
} from '@/pages/archive/data/cabinets';
import AddBookDialog from './add-book-dialog';
import AddCabinetDialog from './add-cabinet-dialog';
import CabinetRenameTitle from './cabinet-rename-title';
import DrawerRenameRow from './drawer-rename-row';

export default function Cabinets({
    cabinets,
}: {
    cabinets: CabinetListItem[];
}) {
    const [addOpen, setAddOpen] = useState(false);
    const [addBookDrawer, setAddBookDrawer] =
        useState<CabinetListDrawer | null>(null);
    const form = useForm({
        name: '',
        drawer_count: 4,
    });
    const bookForm = useForm({
        label: '',
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
        bookForm.setData('label', `Book ${drawer.books.length + 1}`);
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
                toast.success('Book added.');
            },
        });
    }

    return (
        <>
            <Head title="Cabinets" />
            <main className="min-h-full flex-1 bg-background p-4 sm:p-6 xl:p-8">
                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
                    <Card className="min-w-0 gap-0 overflow-visible rounded-none border-slate-200 bg-card py-0 shadow-none dark:border-neutral-800 dark:bg-black">
                        <CardHeader className="flex-row items-start justify-between border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-neutral-800">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base text-slate-950 dark:text-white">
                                    <DrawerIcon
                                        aria-hidden="true"
                                        className="size-4 text-blue-900 dark:text-blue-200"
                                    />
                                    Cabinets
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Add filing cabinets and see them on the
                                    Archive floor
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="w-fit rounded-none border-slate-300 text-slate-700 dark:border-neutral-700 dark:text-neutral-300"
                                >
                                    {cabinets.length}{' '}
                                    {cabinets.length === 1
                                        ? 'cabinet'
                                        : 'cabinets'}
                                </Badge>
                                <Button
                                    type="button"
                                    onClick={() => setAddOpen(true)}
                                    className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    <Plus aria-hidden="true" />
                                    Add cabinet
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0 py-0">
                            {cabinets.length === 0 ? (
                                <p className="px-4 py-8 text-sm text-slate-600 sm:px-5 dark:text-neutral-400">
                                    No cabinets yet. Add a cabinet to start
                                    organizing drawers.
                                </p>
                            ) : (
                                <ul className="grid gap-4 p-4 sm:grid-cols-2 sm:px-5 xl:grid-cols-4">
                                    {cabinets.map((cabinet) => (
                                        <li
                                            key={cabinet.id}
                                            className="min-w-0 rounded-none border border-slate-200 dark:border-neutral-800"
                                        >
                                            <div className="flex items-start justify-between gap-2 border-b border-slate-200 px-3 py-2.5 dark:border-neutral-800">
                                                <div className="min-w-0 flex-1">
                                                    <CabinetRenameTitle
                                                        cabinet={cabinet}
                                                    />
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className="shrink-0 rounded-none border-slate-300 text-xs text-slate-700 dark:border-neutral-700 dark:text-neutral-300"
                                                >
                                                    {cabinet.drawers.length}{' '}
                                                    {cabinet.drawers.length ===
                                                    1
                                                        ? 'drawer'
                                                        : 'drawers'}
                                                </Badge>
                                            </div>
                                            {cabinet.drawers.length > 0 && (
                                                <ul>
                                                    {cabinet.drawers.map(
                                                        (drawer) => (
                                                            <DrawerRenameRow
                                                                key={drawer.id}
                                                                drawer={drawer}
                                                                onAddBook={
                                                                    openAddBook
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
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
