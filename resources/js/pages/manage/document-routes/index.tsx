import { Head, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index, store, update } from '@/routes/manage/document-routes';

type DocumentRouteRecord = {
    id: number;
    name: string;
    steps: string[];
    officeSteps: {
        office_id: number | null;
        can_take_action: boolean;
        needs_endorsement: boolean;
    }[];
    documentCount: number;
};

type RoutingStep = {
    office_id: string;
    can_take_action: boolean;
    needs_endorsement: boolean;
};

function emptyStep(): RoutingStep {
    return { office_id: '', can_take_action: false, needs_endorsement: false };
}

export default function DocumentRoutes({
    routes,
    offices,
}: {
    routes: DocumentRouteRecord[];
    offices: { id: number; name: string }[];
}) {
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState<DocumentRouteRecord | null>(null);
    const form = useForm<{ name: string; steps: RoutingStep[] }>({
        name: '',
        steps: [emptyStep(), emptyStep()],
    });
    const dialogOpen = addOpen || editing !== null;
    const stepError =
        form.errors.steps ??
        Object.entries(form.errors).find(([key]) =>
            key.startsWith('steps.'),
        )?.[1];

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

    function openEdit(route: DocumentRouteRecord) {
        form.clearErrors();
        form.setData({
            name: route.name,
            steps: route.officeSteps.map((step) => ({
                ...step,
                office_id:
                    step.office_id === null ? '' : String(step.office_id),
            })),
        });
        setAddOpen(false);
        setEditing(route);
    }

    function updateStep(index: number, values: Partial<RoutingStep>) {
        form.setData(
            'steps',
            form.data.steps.map((step, stepIndex) =>
                stepIndex === index ? { ...step, ...values } : step,
            ),
        );
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
            <Head title="Routing" />
            <main className="min-h-full flex-1 bg-background p-4 sm:p-6 xl:p-8">
                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
                    <header className="flex flex-col justify-between gap-4 border-b border-blue-900 pb-5 sm:flex-row sm:items-start dark:border-blue-200">
                        <div>
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-neutral-50">
                                    Routing
                                </h1>
                                <p className="text-sm text-slate-600 tabular-nums dark:text-neutral-400">
                                    {routes.length}{' '}
                                    {routes.length === 1
                                        ? 'configuration'
                                        : 'configurations'}
                                </p>
                            </div>
                            <p className="mt-2 max-w-[65ch] text-sm text-slate-600 dark:text-neutral-400">
                                Set the offices a document passes through, in
                                order, and what each office can do.
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={openAdd}
                            disabled={offices.length < 2}
                            className="w-fit shrink-0 rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                            <Plus aria-hidden="true" />
                            Add routing
                        </Button>
                    </header>

                    {routes.length === 0 ? (
                        <p className="border border-slate-200 bg-card px-5 py-10 text-sm leading-6 text-slate-600 dark:border-neutral-800 dark:bg-black dark:text-neutral-400">
                            {offices.length < 2
                                ? 'Add at least two offices in Settings to set up routing.'
                                : 'No routing yet. Add one to send a document between offices.'}
                        </p>
                    ) : (
                        <ul
                            aria-label="Routing"
                            className="divide-y divide-slate-200 border border-slate-200 bg-card dark:divide-neutral-800 dark:border-neutral-800 dark:bg-black"
                        >
                            {routes.map((route) => (
                                <li
                                    key={route.id}
                                    className="flex items-center justify-between gap-4 px-4 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-950 dark:text-neutral-50">
                                            {route.name}
                                        </p>
                                        <p className="truncate text-xs text-slate-500 dark:text-neutral-400">
                                            {route.steps.join(' → ')}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-4">
                                        <p className="text-xs text-slate-600 tabular-nums dark:text-neutral-400">
                                            {route.documentCount}{' '}
                                            {route.documentCount === 1
                                                ? 'document'
                                                : 'documents'}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => openEdit(route)}
                                            className="rounded-none"
                                        >
                                            Edit
                                        </Button>
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
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-none sm:max-w-3xl dark:border-neutral-800 dark:bg-black">
                    <DialogHeader className="shrink-0">
                        <DialogTitle>
                            {editing ? 'Edit routing' : 'Add routing'}
                        </DialogTitle>
                        <DialogDescription>
                            Choose offices in order. Set whether each office can
                            take action or needs to endorse the document.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={submit}
                        className="grid min-h-0 gap-4 overflow-y-auto"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="route-name">Name</Label>
                            <Input
                                id="route-name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                required
                                maxLength={100}
                                placeholder="Receiving to records"
                                className="rounded-none"
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <fieldset className="grid gap-2">
                            <legend className="text-sm font-medium text-slate-950 dark:text-neutral-50">
                                Offices
                            </legend>
                            {editing?.officeSteps.some(
                                (step) => step.office_id === null,
                            ) && (
                                <p className="text-xs text-muted-foreground">
                                    Select an office for each existing step
                                    before saving.
                                </p>
                            )}
                            {form.data.steps.map((step, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border py-2 last:border-0 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
                                >
                                    <span className="w-5 text-xs text-slate-500 tabular-nums dark:text-neutral-400">
                                        {index + 1}
                                    </span>
                                    <Select
                                        value={step.office_id}
                                        onValueChange={(value) =>
                                            updateStep(index, {
                                                office_id:
                                                    typeof value === 'string'
                                                        ? value
                                                        : '',
                                            })
                                        }
                                        items={offices.map((office) => ({
                                            value: String(office.id),
                                            label: office.name,
                                        }))}
                                        required
                                        disabled={form.processing}
                                    >
                                        <SelectTrigger
                                            aria-label={`Office ${index + 1}`}
                                            className="w-full min-w-0 rounded-none"
                                        >
                                            <SelectValue placeholder="Select an office" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none">
                                            {offices.map((office) => (
                                                <SelectItem
                                                    key={office.id}
                                                    value={String(office.id)}
                                                    disabled={form.data.steps.some(
                                                        (other, otherIndex) =>
                                                            otherIndex !==
                                                                index &&
                                                            other.office_id ===
                                                                String(
                                                                    office.id,
                                                                ),
                                                    )}
                                                >
                                                    {office.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="col-start-2 row-start-2 flex flex-wrap items-center gap-x-4 gap-y-3 py-1 sm:col-start-3 sm:row-start-1">
                                        <Label className="flex items-center gap-2 text-xs font-normal whitespace-nowrap">
                                            <Checkbox
                                                checked={step.can_take_action}
                                                onCheckedChange={(checked) =>
                                                    updateStep(index, {
                                                        can_take_action:
                                                            checked,
                                                    })
                                                }
                                                disabled={form.processing}
                                            />
                                            <span className="sr-only">
                                                Office {index + 1}:{' '}
                                            </span>
                                            Can take action
                                        </Label>
                                        <Label className="flex items-center gap-2 text-xs font-normal whitespace-nowrap">
                                            <Checkbox
                                                checked={step.needs_endorsement}
                                                onCheckedChange={(checked) =>
                                                    updateStep(index, {
                                                        needs_endorsement:
                                                            checked,
                                                    })
                                                }
                                                disabled={form.processing}
                                            />
                                            <span className="sr-only">
                                                Office {index + 1}:{' '}
                                            </span>
                                            Need endorsement
                                        </Label>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={
                                            form.processing ||
                                            form.data.steps.length <= 2
                                        }
                                        onClick={() =>
                                            form.setData(
                                                'steps',
                                                form.data.steps.filter(
                                                    (_, stepIndex) =>
                                                        stepIndex !== index,
                                                ),
                                            )
                                        }
                                        className="col-start-3 row-start-1 rounded-none sm:col-start-4"
                                        aria-label={`Remove office ${index + 1}`}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                            <InputError message={stepError} />
                            <Button
                                type="button"
                                variant="outline"
                                disabled={
                                    form.processing ||
                                    form.data.steps.length >=
                                        Math.min(12, offices.length)
                                }
                                onClick={() =>
                                    form.setData('steps', [
                                        ...form.data.steps,
                                        emptyStep(),
                                    ])
                                }
                                className="w-fit rounded-none"
                            >
                                Add office
                            </Button>
                        </fieldset>
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
                                      : 'Add routing'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

DocumentRoutes.layout = {
    breadcrumbs: [
        { title: 'Manage', href: index() },
        { title: 'Routing', href: index() },
    ],
};
