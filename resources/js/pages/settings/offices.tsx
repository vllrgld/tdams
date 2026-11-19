import { Head, router, useForm } from '@inertiajs/react';
import {
    Building2,
    EllipsisVertical,
    Plus,
    Settings2,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { destroy, index, store, update } from '@/routes/offices';
import { update as updatePermissions } from '@/routes/offices/permissions';

type OfficeRecord = {
    id: number;
    name: string;
    documentCount: number;
    canManageRouting: boolean;
    canRouteDocuments: boolean;
    canUploadToReceiving: boolean;
    canManageDocumentTypes: boolean;
    canTakeDocumentAction: boolean;
    isReceiving: boolean;
};

const permissionOptions = [
    {
        key: 'can_take_document_action',
        property: 'canTakeDocumentAction',
        title: 'Take action',
        description:
            'Approve or disapprove documents after fixed routing and required endorsements are complete.',
    },
    {
        key: 'can_manage_document_types',
        property: 'canManageDocumentTypes',
        title: 'Manage document types',
        description:
            'Add and edit document types available when uploading documents.',
    },
    {
        key: 'can_upload_to_receiving',
        property: 'canUploadToReceiving',
        title: 'Upload to Receiving',
        description:
            'Upload incoming documents to Receiving for processing. Archive uploads remain available when this is off.',
    },
    {
        key: 'can_manage_routing',
        property: 'canManageRouting',
        title: 'Manage routing',
        description:
            'Create and edit the sequences of offices a document follows.',
    },
    {
        key: 'can_route_documents',
        property: 'canRouteDocuments',
        title: 'Assign routing on release',
        description:
            'Choose or change document routing when releasing it from this office.',
    },
] as const;
type PermissionKey = (typeof permissionOptions)[number]['key'];

export default function Offices({ offices }: { offices: OfficeRecord[] }) {
    const [permissionChange, setPermissionChange] = useState<{
        officeId: number;
        field: PermissionKey;
        value: boolean;
    } | null>(null);
    const permissionSaving = useRef(false);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [permissionSaved, setPermissionSaved] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState<OfficeRecord | null>(null);
    const [deleting, setDeleting] = useState<OfficeRecord | null>(null);
    const form = useForm({
        name: '',
        can_manage_routing: false,
        can_route_documents: false,
        can_upload_to_receiving: true,
        can_manage_document_types: false,
        can_take_document_action: false,
    });
    const deleteForm = useForm({ office: '' });
    const nameDialogOpen = addOpen || editing !== null;

    function changePermission(
        office: OfficeRecord,
        field: PermissionKey,
        value: boolean,
    ) {
        if (permissionSaving.current) return;
        permissionSaving.current = true;
        setPermissionChange({ officeId: office.id, field, value });
        setPermissionError(null);
        setPermissionSaved(false);
        router.patch(
            updatePermissions.url(office.id),
            { [field]: value },
            {
                preserveScroll: true,
                only: ['offices', 'officePermissions'],
                onSuccess: () => setPermissionSaved(true),
                onError: (errors) =>
                    setPermissionError(
                        Object.values(errors)[0] ??
                            'The permission could not be saved. Try again.',
                    ),
                onFinish: () => {
                    permissionSaving.current = false;
                    setPermissionChange(null);
                },
            },
        );
    }

    function closeNameDialog() {
        if (form.processing) return;
        setAddOpen(false);
        setEditing(null);
        form.reset();
        form.clearErrors();
    }

    function closeDeleteDialog() {
        if (deleteForm.processing) {
            return;
        }

        setDeleting(null);
        deleteForm.clearErrors();
        deleteForm.reset();
    }

    function openAdd() {
        form.reset();
        form.clearErrors();
        setDeleting(null);
        setEditing(null);
        setAddOpen(true);
    }

    function openEdit(office: OfficeRecord) {
        form.clearErrors();
        form.setData({
            name: office.name,
            can_manage_routing: office.canManageRouting,
            can_route_documents: office.canRouteDocuments,
            can_upload_to_receiving: office.canUploadToReceiving,
            can_manage_document_types: office.canManageDocumentTypes,
            can_take_document_action: office.canTakeDocumentAction,
        });
        setDeleting(null);
        setAddOpen(false);
        setEditing(office);
    }

    function openDelete(office: OfficeRecord) {
        if (office.documentCount > 0 || office.isReceiving) {
            return;
        }

        form.clearErrors();
        setAddOpen(false);
        setEditing(null);
        deleteForm.clearErrors();
        deleteForm.reset();
        setDeleting(office);
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setAddOpen(false);
                setEditing(null);
                form.reset();
                form.clearErrors();
            },
        };

        if (editing) {
            form.patch(update.url(editing.id), options);

            return;
        }

        form.post(store.url(), options);
    }

    function submitDelete(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (deleting === null) {
            return;
        }

        deleteForm.delete(destroy.url(deleting.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleting(null);
                deleteForm.clearErrors();
                deleteForm.reset();
            },
        });
    }

    return (
        <>
            <Head title="Offices" />
            <main className="min-h-full flex-1 bg-background p-4 sm:p-6 xl:p-8">
                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
                    <header className="flex flex-col justify-between gap-4 pb-1 sm:flex-row sm:items-start">
                        <div>
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-neutral-50">
                                    Offices
                                </h1>
                            </div>
                            <p className="mt-2 max-w-[65ch] text-sm text-slate-600 dark:text-neutral-400">
                                Set what each office can do. Incoming documents
                                start in Receiving; archive uploads stay in the
                                current office.
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={openAdd}
                            className="w-fit shrink-0 rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                            <Plus aria-hidden="true" />
                            Add office
                        </Button>
                    </header>

                    <section
                        aria-label="Office permissions"
                        className="overflow-hidden rounded-lg border border-border bg-card dark:bg-neutral-900/60"
                    >
                        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3.5 sm:px-5">
                            <h2 className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                                <Building2
                                    aria-hidden="true"
                                    className="size-4 text-muted-foreground"
                                />
                                Office permissions
                            </h2>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {offices.length}{' '}
                                {offices.length === 1 ? 'office' : 'offices'}
                            </span>
                        </div>
                        <table className="w-full text-left text-sm">
                            <caption className="sr-only">
                                Offices and their upload and routing permissions
                            </caption>
                            <thead className="border-b border-border text-xs text-muted-foreground">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 font-medium sm:px-5"
                                    >
                                        Office
                                    </th>
                                    {permissionOptions.map((permission) => (
                                        <th
                                            key={permission.key}
                                            scope="col"
                                            className="hidden w-36 px-3 py-3 font-medium xl:table-cell"
                                        >
                                            {permission.title}
                                        </th>
                                    ))}
                                    <th
                                        scope="col"
                                        className="hidden w-24 px-3 py-3 text-right font-medium sm:table-cell"
                                    >
                                        Documents
                                    </th>
                                    <th scope="col" className="w-14 px-3 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {offices.map((office) => (
                                    <tr
                                        key={office.id}
                                        className="transition-colors hover:bg-muted/30"
                                    >
                                        <th
                                            scope="row"
                                            className="px-4 py-4 font-normal sm:px-5"
                                        >
                                            <div className="text-sm font-medium [overflow-wrap:anywhere] text-foreground">
                                                {office.name}
                                            </div>
                                            <div className="mt-1 text-xs font-normal text-muted-foreground">
                                                {office.isReceiving
                                                    ? 'Incoming documents start here'
                                                    : 'Receive and release documents'}
                                            </div>
                                            <div className="mt-1 text-xs font-normal text-muted-foreground xl:hidden">
                                                {
                                                    permissionOptions.filter(
                                                        (permission) =>
                                                            office[
                                                                permission
                                                                    .property
                                                            ],
                                                    ).length
                                                }{' '}
                                                of {permissionOptions.length}{' '}
                                                permissions enabled
                                                <span className="sm:hidden">
                                                    {' '}
                                                    &middot;{' '}
                                                    {office.documentCount}{' '}
                                                    {office.documentCount === 1
                                                        ? 'document'
                                                        : 'documents'}
                                                </span>
                                            </div>
                                        </th>
                                        {permissionOptions.map((permission) => {
                                            const pending =
                                                permissionChange?.officeId ===
                                                    office.id &&
                                                permissionChange.field ===
                                                    permission.key;
                                            const enabled = pending
                                                ? permissionChange.value
                                                : office[permission.property];
                                            return (
                                                <td
                                                    key={permission.key}
                                                    className="hidden px-3 py-4 xl:table-cell"
                                                >
                                                    <label className="inline-flex cursor-pointer items-center gap-2.5 text-xs text-foreground">
                                                        <Checkbox
                                                            aria-label={`${permission.title} for ${office.name}`}
                                                            checked={enabled}
                                                            disabled={
                                                                permissionChange !==
                                                                null
                                                            }
                                                            onCheckedChange={(
                                                                checked,
                                                            ) =>
                                                                changePermission(
                                                                    office,
                                                                    permission.key,
                                                                    checked ===
                                                                        true,
                                                                )
                                                            }
                                                        />
                                                        {pending ? (
                                                            <span className="flex items-center gap-1.5">
                                                                <Spinner className="size-3" />{' '}
                                                                Saving
                                                            </span>
                                                        ) : enabled ? (
                                                            'Allowed'
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                Off
                                                            </span>
                                                        )}
                                                    </label>
                                                </td>
                                            );
                                        })}
                                        <td className="hidden px-3 py-4 text-right text-xs text-muted-foreground tabular-nums sm:table-cell">
                                            {office.documentCount}
                                        </td>
                                        <td className="px-3 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    aria-label={`Actions for ${office.name}`}
                                                    disabled={
                                                        permissionChange !==
                                                        null
                                                    }
                                                    render={
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 rounded-md"
                                                        />
                                                    }
                                                >
                                                    <EllipsisVertical
                                                        aria-hidden="true"
                                                        className="size-4"
                                                    />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            openEdit(office)
                                                        }
                                                    >
                                                        <Settings2 aria-hidden="true" />{' '}
                                                        Edit office &amp;
                                                        permissions
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        disabled={
                                                            office.documentCount >
                                                                0 ||
                                                            office.isReceiving
                                                        }
                                                        onClick={() =>
                                                            openDelete(office)
                                                        }
                                                    >
                                                        <Trash2 aria-hidden="true" />{' '}
                                                        Delete office
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                                {offices.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={
                                                permissionOptions.length + 3
                                            }
                                            className="px-5 py-12 text-center text-sm text-muted-foreground"
                                        >
                                            No offices yet. Add an office to
                                            configure its permissions.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-5">
                            <p className="hidden xl:block">
                                Select a permission to update it. Changes save
                                automatically.
                            </p>
                            <p className="xl:hidden">
                                Use the office menu to edit its permissions.
                            </p>
                            <p
                                aria-live="polite"
                                role={permissionError ? 'alert' : 'status'}
                                className={
                                    permissionError
                                        ? 'text-red-700 dark:text-red-400'
                                        : undefined
                                }
                            >
                                {permissionError ??
                                    (permissionChange
                                        ? 'Saving permissions...'
                                        : permissionSaved
                                          ? 'Permissions updated.'
                                          : 'Every office can receive, release, and archive.')}
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            <Dialog
                open={nameDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeNameDialog();
                    }
                }}
            >
                <DialogContent
                    showClose={!form.processing}
                    className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg sm:max-w-lg dark:border-neutral-800 dark:bg-black"
                >
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit office' : 'Add office'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing
                                ? 'Update the office name and what staff can do from this office.'
                                : 'Name the office and choose its permissions.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="office-name">Name</Label>
                            <Input
                                id="office-name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                required
                                disabled={form.processing}
                                maxLength={100}
                                placeholder="Receiving Office"
                                className="rounded-md"
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <fieldset className="grid gap-3 border-t border-border pt-5">
                            <legend className="sr-only">
                                Office permissions
                            </legend>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <ShieldCheck
                                    aria-hidden="true"
                                    className="size-4 text-muted-foreground"
                                />
                                Office permissions
                            </div>
                            {permissionOptions.map((permission) => (
                                <div
                                    key={permission.key}
                                    className="rounded-md border border-border p-3.5"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor={permission.key}
                                                className="cursor-pointer text-sm font-medium"
                                            >
                                                {permission.title}
                                            </Label>
                                            <p
                                                id={`${permission.key}-description`}
                                                className="text-xs leading-5 text-muted-foreground"
                                            >
                                                {permission.description}
                                            </p>
                                        </div>
                                        <Checkbox
                                            id={permission.key}
                                            aria-describedby={`${permission.key}-description`}
                                            checked={form.data[permission.key]}
                                            disabled={form.processing}
                                            onCheckedChange={(checked) =>
                                                form.setData(
                                                    permission.key,
                                                    checked === true,
                                                )
                                            }
                                        />
                                    </div>
                                    <InputError
                                        message={form.errors[permission.key]}
                                        className="mt-2"
                                    />
                                </div>
                            ))}
                            <p className="text-xs leading-5 text-muted-foreground">
                                Every office can receive, release, and archive
                                documents.
                            </p>
                        </fieldset>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={form.processing}
                                onClick={closeNameDialog}
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
                                      : 'Add office'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleting !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDeleteDialog();
                    }
                }}
            >
                <DialogContent
                    showClose={!deleteForm.processing}
                    className="rounded-none sm:max-w-md dark:border-neutral-800 dark:bg-black"
                >
                    <DialogHeader>
                        <DialogTitle>Delete this office?</DialogTitle>
                        <DialogDescription>
                            {deleting?.name} will be removed. Offices that still
                            have documents cannot be deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitDelete} className="grid gap-4">
                        <InputError message={deleteForm.errors.office} />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={deleteForm.processing}
                                onClick={closeDeleteDialog}
                                className="rounded-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={deleteForm.processing}
                                className="rounded-none"
                            >
                                {deleteForm.processing
                                    ? 'Deleting…'
                                    : 'Delete office'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

Offices.layout = {
    breadcrumbs: [{ title: 'Offices', href: index() }],
};
