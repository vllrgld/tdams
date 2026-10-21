import { useForm } from '@inertiajs/react';
import { Book } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import type { CabinetListBook } from '@/pages/archive/data/cabinets';

export default function BookRenameRow({ book }: { book: CabinetListBook }) {
    const [editing, setEditing] = useState(false);
    const saving = useRef(false);
    const form = useForm({
        label: book.label,
    });

    function startEditing() {
        form.setData('label', book.label);
        setEditing(true);
    }

    function stopEditing() {
        saving.current = false;
        form.setData('label', book.label);
        form.clearErrors();
        setEditing(false);
    }

    function save() {
        const next = form.data.label.trim();

        if (saving.current || form.processing) {
            return;
        }

        if (next === '' || next === book.label) {
            stopEditing();
            return;
        }

        saving.current = true;
        form.setData('label', next);
        form.patch(`/manage/books/${book.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                saving.current = false;
                setEditing(false);
                toast.success('Book renamed.');
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
        <li className="border-t border-slate-200 px-3 py-1 dark:border-neutral-800">
            {editing ? (
                <div className="grid gap-1">
                    <Input
                        aria-label={`Rename ${book.label}`}
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
                <div className="flex min-w-0 items-center gap-2">
                    <Book
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-slate-500 dark:text-neutral-400"
                    />
                    <button
                        type="button"
                        aria-label={`Rename ${book.label}`}
                        onClick={startEditing}
                        className="min-w-0 flex-1 truncate rounded-none py-0.5 text-left text-sm text-slate-700 hover:text-blue-900 dark:text-neutral-300 dark:hover:text-blue-200"
                    >
                        {book.label}
                    </button>
                </div>
            )}
        </li>
    );
}
