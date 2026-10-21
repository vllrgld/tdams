import { useForm } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CabinetListItem } from '@/pages/archive/data/cabinets';

export default function CabinetRenameTitle({
    cabinet,
}: {
    cabinet: Pick<CabinetListItem, 'id' | 'name'>;
}) {
    const [editing, setEditing] = useState(false);
    const saving = useRef(false);
    const form = useForm({
        name: cabinet.name,
    });

    function startEditing() {
        form.setData('name', cabinet.name);
        setEditing(true);
    }

    function stopEditing() {
        saving.current = false;
        form.setData('name', cabinet.name);
        form.clearErrors();
        setEditing(false);
    }

    function save() {
        const next = form.data.name.trim();

        if (saving.current || form.processing) {
            return;
        }

        if (next === '' || next === cabinet.name) {
            stopEditing();
            return;
        }

        saving.current = true;
        form.setData('name', next);
        form.patch(`/manage/cabinets/${cabinet.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                saving.current = false;
                setEditing(false);
                toast.success('Cabinet renamed.');
            },
            onError: () => {
                saving.current = false;
            },
            onFinish: () => {
                saving.current = false;
            },
        });
    }

    if (editing) {
        return (
            <div className="grid gap-1">
                <Input
                    aria-label={`Rename ${cabinet.name}`}
                    value={form.data.name}
                    maxLength={150}
                    disabled={form.processing}
                    autoFocus
                    onFocus={(event) => event.target.select()}
                    onChange={(event) =>
                        form.setData('name', event.target.value)
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
                    className="h-7 rounded-none text-sm font-medium"
                />
                <InputError message={form.errors.name} />
            </div>
        );
    }

    return (
        <div className="flex min-w-0 items-center gap-1">
            <button
                type="button"
                onClick={startEditing}
                className="min-w-0 flex-1 truncate rounded-none py-0.5 text-left text-sm font-medium text-slate-950 hover:text-blue-900 dark:text-white dark:hover:text-blue-200"
            >
                {cabinet.name}
            </button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Rename ${cabinet.name}`}
                title={`Rename ${cabinet.name}`}
                onClick={startEditing}
                className="size-7 shrink-0 rounded-none text-slate-500 hover:text-blue-900 dark:text-neutral-400 dark:hover:text-blue-200"
            >
                <Pencil aria-hidden="true" className="size-3.5" />
            </Button>
        </div>
    );
}
