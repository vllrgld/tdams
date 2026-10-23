import { Link, useForm } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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
        <li className="border-t border-slate-200 dark:border-neutral-800">
            <div className="flex min-w-0 items-center gap-1 px-3 py-1">
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
                            className="h-7 rounded-none text-sm"
                        />
                        <InputError message={form.errors.label} />
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={startEditing}
                        className="min-w-0 flex-1 truncate rounded-none py-0.5 text-left text-sm text-slate-800 hover:text-blue-900 dark:text-neutral-200 dark:hover:text-blue-200"
                    >
                        {drawer.label}
                    </button>
                )}
                <Badge
                    variant="outline"
                    aria-label={
                        bookCount > 0
                            ? `View ${bookCount} ${bookCount === 1 ? 'book' : 'books'} in ${drawer.label}`
                            : undefined
                    }
                    title={
                        bookCount > 0
                            ? `View ${bookCount} ${bookCount === 1 ? 'book' : 'books'} in ${drawer.label}`
                            : undefined
                    }
                    render={
                        bookCount > 0 ? (
                            <Link href={`/manage/books?drawer=${drawer.id}`} />
                        ) : undefined
                    }
                    className={cn(
                        'shrink-0 rounded-none border-slate-300 text-[10px] text-slate-600 dark:border-neutral-700 dark:text-neutral-400',
                        bookCount > 0 &&
                            'hover:border-blue-900 hover:text-blue-900 dark:hover:border-blue-200 dark:hover:text-blue-200',
                    )}
                >
                    {bookCount} {bookCount === 1 ? 'book' : 'books'}
                </Badge>
                {canAddBook && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Add book to ${drawer.label}`}
                        title={`Add book to ${drawer.label}`}
                        onClick={() => onAddBook(drawer)}
                        className="size-7 shrink-0 rounded-none text-slate-500 hover:text-blue-900 dark:text-neutral-400 dark:hover:text-blue-200"
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
                        className="size-7 shrink-0 rounded-none text-slate-500 hover:text-blue-900 dark:text-neutral-400 dark:hover:text-blue-200"
                    >
                        <Pencil aria-hidden="true" className="size-3.5" />
                    </Button>
                )}
            </div>
        </li>
    );
}
