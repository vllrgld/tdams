import type { FormEvent } from 'react';
import type { InertiaFormProps } from '@inertiajs/react';
import { ScanLine, Upload } from 'lucide-react';
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
import { metadataSections } from '../lib/metadata';
import type { UploadForm } from '../types';
import DeclarationNumberSearch from './declaration-number-search';

type DocumentUploadDialogProps = {
    form: InertiaFormProps<UploadForm>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function DocumentUploadDialog({
    form,
    open,
    onOpenChange,
    onSubmit,
}: DocumentUploadDialogProps) {
    return (
        <>
            <Button
                type="button"
                aria-label="Upload document"
                title="Upload document"
                onClick={() => onOpenChange(true)}
                className="fixed right-5 bottom-5 z-40 size-14 rounded-full bg-blue-900 text-white shadow-lg shadow-slate-950/20 transition-transform hover:scale-105 hover:bg-blue-800 sm:right-8 sm:bottom-8 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
                <ScanLine aria-hidden="true" className="size-6" />
            </Button>

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add document to archive</DialogTitle>
                        <DialogDescription>
                            Upload a scanned PDF or image and add the property
                            details. All details are optional.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={onSubmit}
                        className="grid gap-5"
                        encType="multipart/form-data"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="document-file">
                                Scanned document
                            </Label>
                            <Input
                                id="document-file"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff,application/pdf,image/jpeg,image/png,image/tiff"
                                required
                                onChange={(event) =>
                                    form.setData(
                                        'file',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                                className="h-auto rounded-none border-dashed p-3 file:mr-3 file:rounded-none file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:font-medium file:text-blue-950 dark:file:bg-blue-950 dark:file:text-blue-100"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                PDF, JPEG, PNG, or TIFF · maximum file size 50
                                MB
                            </p>
                            <InputError message={form.errors.file} />
                        </div>

                        <div>
                            {metadataSections.map((section) => (
                                <section
                                    key={section.title}
                                    className="mb-5 last:mb-0"
                                >
                                    <h3 className="mb-3 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
                                        {section.title}
                                    </h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {section.fields.map((field) => {
                                            const id = `document-${field.name}`;

                                            return (
                                                <div
                                                    key={field.name}
                                                    className="grid gap-2"
                                                >
                                                    <Label htmlFor={id}>
                                                        {field.label}
                                                    </Label>
                                                    {field.name ===
                                                    'previous_tax_declaration_number' ? (
                                                        <DeclarationNumberSearch
                                                            id={id}
                                                            value={
                                                                form.data
                                                                    .previous_tax_declaration_number
                                                            }
                                                            onChange={(
                                                                value,
                                                                match,
                                                            ) => {
                                                                form.setData(
                                                                    'previous_tax_declaration_number',
                                                                    value,
                                                                );

                                                                if (
                                                                    match?.declarationDate
                                                                ) {
                                                                    form.setData(
                                                                        'previous_declaration_date',
                                                                        match.declarationDate,
                                                                    );
                                                                }
                                                            }}
                                                            excludeNumber={
                                                                form.data
                                                                    .tax_declaration_number
                                                            }
                                                            maxLength={
                                                                field.maxLength
                                                            }
                                                            disabled={
                                                                form.processing
                                                            }
                                                        />
                                                    ) : (
                                                        <Input
                                                            id={id}
                                                            type={
                                                                field.type ??
                                                                (field.name ===
                                                                'area'
                                                                    ? 'number'
                                                                    : 'text')
                                                            }
                                                            step={
                                                                field.name ===
                                                                'area'
                                                                    ? '0.0001'
                                                                    : undefined
                                                            }
                                                            min={
                                                                field.name ===
                                                                'area'
                                                                    ? '0'
                                                                    : undefined
                                                            }
                                                            value={
                                                                form.data[
                                                                    field.name
                                                                ]
                                                            }
                                                            onChange={(event) =>
                                                                form.setData(
                                                                    field.name,
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            maxLength={
                                                                field.maxLength
                                                            }
                                                            className="rounded-none"
                                                        />
                                                    )}
                                                    <InputError
                                                        message={
                                                            form.errors[
                                                                field.name
                                                            ]
                                                        }
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                            <div className="grid gap-2">
                                <Label htmlFor="document-remarks">
                                    Remarks
                                </Label>
                                <textarea
                                    id="document-remarks"
                                    value={form.data.remarks}
                                    onChange={(event) =>
                                        form.setData(
                                            'remarks',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={10000}
                                    rows={3}
                                    className="w-full min-w-0 rounded-none border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />
                                <InputError message={form.errors.remarks} />
                            </div>
                        </div>

                        {form.progress && (
                            <div
                                className="h-2 bg-slate-100 dark:bg-slate-800"
                                role="progressbar"
                                aria-label="Upload progress"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={form.progress.percentage}
                            >
                                <div
                                    className="h-full bg-blue-900 transition-all dark:bg-blue-400"
                                    style={{
                                        width: `${form.progress.percentage}%`,
                                    }}
                                />
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={form.processing}
                                onClick={() => onOpenChange(false)}
                                className="rounded-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing || !form.data.file}
                                className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                            >
                                <Upload aria-hidden="true" />
                                {form.processing
                                    ? 'Uploading…'
                                    : 'Add to archive'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
