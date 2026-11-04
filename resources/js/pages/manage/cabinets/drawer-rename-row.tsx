import { Link, useForm } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CabinetListDrawer } from '@/pages/archive/data/cabinets';

const MAX_BOOKS_PER_DRAWER = 16;

export default function DrawerRenameRow({
    drawer,
    onAddBook,
}: {
    drawer: CabinetListDrawer;
    onAddBook: (drawer: CabinetListDrawer) => void;
}) {
    const [editing, setEditing] = useState(false);
    const saving = useRef(false);
    const form = useForm({
        label: drawer.label,
    });
    const canAddBook = drawer.books.length < MAX_BOOKS_PER_DRAWER;
    const bookCount = drawer.books.length;
    const kind = drawer.books[0]?.kind;
    const itemName = kind === 'folder' ? 'folder' : 'book';
    const addLabel = `Add ${kind ? itemName : 'book or folder'} to ${drawer.label}`;

    function startEditing() {
        form.setData('label', drawer.label);
        setEditing(true);
    }

    function stopEditing() {
        saving.current = false;
        form.setData('label', drawer.label);
        form.clearErrors();
        setEditing(false);
    }

    function save() {
        const next = form.data.label.trim();

        if (saving.current || form.processing) {
            return;
        }

        if (next === '' || next === drawer.label) {
            stopEditing();
            return;
        }

        saving.current = true;
        form.setData('label', next);
        form.patch(`/manage/drawers/${drawer.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                saving.current = false;
                setEditing(false);
                toast.success('Drawer renamed.');
            },
            onError: () => {
                saving.current = false;
            },
            onFinish: () => {
                saving.current = false;
            },
        });
    }

    return (
        <li className="border-t border-slate-200 first:border-t-0 dark:border-neutral-800">
            <div className="grid min-h-12 min-w-0 grid-cols-[minmax(0,1fr)_auto_4.25rem] items-center gap-3 px-4 py-2">
                {editing ? (
                    <div className="grid min-w-0 flex-1 gap-1">
                        <Input
                            aria-label={`Rename ${drawer.label}`}
                            value={form.data.label}
                            maxLength={100}
                            disabled={form.processing}
                            autoFocus
                            onFocus={(event) => event.target.select()}
                            onChange={(event) =>
                                form.setData('label', event.target.value)
                            }
                            onBlur={save}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    save();
                                }

                                if (event.key === 'Escape') {
                                    event.preventDefault();
                                    stopEditing();
                                }
                            }}
                            className="h-8 rounded-none text-sm"
                        />
                        <InputError message={form.errors.label} />
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={startEditing}
                        title={drawer.label}
                        className="min-w-0 truncate py-1 text-left text-sm text-slate-800 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:text-neutral-200 dark:hover:text-blue-200"
                    >
                        {drawer.label}
                    </button>
                )}
                {bookCount > 0 ? (
                    <Link
                        href={`/manage/${kind === 'folder' ? 'folders' : 'books'}?drawer=${drawer.id}`}
                        aria-label={
                            bookCount > 0
                                ? `View ${bookCount} ${itemName}${bookCount === 1 ? '' : 's'} in ${drawer.label}`
                                : undefined
                        }
                        title={
                            bookCount > 0
                                ? `View ${bookCount} ${itemName}${bookCount === 1 ? '' : 's'} in ${drawer.label}`
                                : undefined
                        }
                        className="text-xs whitespace-nowrap text-slate-600 tabular-nums underline-offset-4 hover:text-blue-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:text-neutral-400 dark:hover:text-blue-200"
                    >
                        {bookCount} {itemName}
                        {bookCount === 1 ? '' : 's'}
                    </Link>
                ) : (
                    <span className="text-xs whitespace-nowrap text-slate-500 tabular-nums dark:text-neutral-400">
                        Empty
                    </span>
                )}
                <div className="flex items-center justify-end gap-1">
                    {canAddBook && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={addLabel}
                            title={addLabel}
                            onClick={() => onAddBook(drawer)}
                            className="size-8 shrink-0 rounded-none text-slate-500 hover:text-blue-900 dark:text-neutral-400 dark:hover:text-blue-200"
                        >
                            <Plus aria-hidden="true" className="size-3.5" />
                        </Button>
                    )}
                    {!editing && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Rename ${drawer.label}`}
                            title={`Rename ${drawer.label}`}
                            onClick={startEditing}
                            className="size-8 shrink-0 rounded-none text-slate-500 hover:text-blue-900 dark:text-neutral-400 dark:hover:text-blue-200"
                        >
                            <Pencil aria-hidden="true" className="size-3.5" />
                        </Button>
                    )}
                </div>
            </div>
        </li>
    );
}
