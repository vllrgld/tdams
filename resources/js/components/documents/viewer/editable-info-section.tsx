import {
    useEffect,
    useId,
    useRef,
    useState,
    type FormEvent,
    type ReactNode,
} from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
    changedDocumentFields,
    documentSectionValues,
    type DocumentInfoField,
} from '@/lib/document-info-fields';
import { fields as saveDocumentFields } from '@/routes/documents';
import type { ArchivedDocument } from '@/types/documents';
import DeclarationNumberSearch from '../declaration-number-search';
import BoundaryCompass from './boundary-compass';

export default function EditableInfoSection({
    title,
    document,
    fields,
    active,
    onSaved,
    children,
}: {
    title: string;
    document: ArchivedDocument;
    fields: DocumentInfoField[];
    active: boolean;
    onSaved: (document: ArchivedDocument) => void;
    children: ReactNode;
}) {
    const id = useId();
    const [editing, setEditing] = useState(false);
    const [initial, setInitial] = useState<Record<string, string>>({});
    const [values, setValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const request = useRef<AbortController | null>(null);
    const editButton = useRef<HTMLButtonElement | null>(null);
    const changed = changedDocumentFields(initial, values);

    useEffect(() => () => request.current?.abort(), []);

    useEffect(() => {
        if (!active) {
            request.current?.abort();
            request.current = null;
            setSaving(false);
            setEditing(false);
        }
    }, [active]);

    function updateValue(name: string, value: string) {
        setValues((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: '' }));
        setError(null);
    }

    function finishEditing() {
        setEditing(false);
        setErrors({});
        setError(null);
        requestAnimationFrame(() => editButton.current?.focus());
    }

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (request.current || Object.keys(changed).length === 0) return;
        const controller = new AbortController();
        request.current = controller;
        setSaving(true);
        setErrors({});
        setError(null);
        try {
            const cookie = globalThis.document.cookie
                .split('; ')
                .find((value) => value.startsWith('XSRF-TOKEN='));
            const response = await fetch(saveDocumentFields.url(document.id), {
                method: 'PUT',
                credentials: 'same-origin',
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': cookie
                        ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length))
                        : '',
                },
                body: JSON.stringify(changed),
            });
            const result = await response.json().catch(() => null);
            if (controller.signal.aborted) return;
            if (!response.ok) {
                const validationErrors = result?.errors as
                    | Record<string, string[]>
                    | undefined;
                setErrors(
                    Object.fromEntries(
                        Object.entries(validationErrors ?? {}).map(
                            ([name, messages]) => [name, messages[0]],
                        ),
                    ),
                );
                setError(
                    result?.message ??
                        'Could not save this section. Please try again.',
                );
                return;
            }
            if (!result?.document || result.document.id !== document.id) {
                throw new Error(
                    'The saved document could not be loaded. Please try again.',
                );
            }
            finishEditing();
            onSaved(result.document as ArchivedDocument);
            toast.success(`${title} saved.`);
        } catch (exception) {
            if (!controller.signal.aborted)
                setError(
                    exception instanceof Error
                        ? exception.message
                        : 'Could not save this section. Please try again.',
                );
        } finally {
            if (!controller.signal.aborted) {
                request.current = null;
                setSaving(false);
            }
        }
    }

    return (
        <section aria-labelledby={`${id}-heading`}>
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-border pb-2">
                <h3
                    id={`${id}-heading`}
                    className="text-sm font-semibold text-foreground"
                >
                    {title}
                </h3>
                {!editing && (
                    <Button
                        ref={editButton}
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        aria-label={`Edit ${title.toLowerCase()}`}
                        title={`Edit ${title.toLowerCase()}`}
                        onClick={() => {
                            const next = documentSectionValues(
                                document,
                                fields,
                            );
                            setInitial(next);
                            setValues(next);
                            setErrors({});
                            setError(null);
                            setEditing(true);
                        }}
                    >
                        <Pencil className="size-3.5" aria-hidden="true" />
                    </Button>
                )}
            </div>
            {editing ? (
                <form
                    onSubmit={(event) => void save(event)}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            event.stopPropagation();
                            event.preventDefault();
                            if (!saving) finishEditing();
                        }
                    }}
                    className="grid gap-4"
                    aria-busy={saving}
                >
                    <fieldset
                        disabled={saving}
                        className="grid min-w-0 gap-x-4 gap-y-3 sm:grid-cols-2"
                    >
                        <legend className="sr-only">
                            Edit {title.toLowerCase()}
                        </legend>
                        {fields
                            .filter(
                                (field) => !field.name.startsWith('boundary_'),
                            )
                            .map((field, index) => {
                                const fieldId = `${id}-${field.name}`;
                                return (
                                    <div
                                        key={field.name}
                                        className={cn(
                                            'grid min-w-0 gap-1.5',
                                            field.fullWidth && 'sm:col-span-2',
                                        )}
                                    >
                                        <Label
                                            htmlFor={fieldId}
                                            className="text-xs text-muted-foreground"
                                        >
                                            {field.label}
                                        </Label>
                                        {field.name ===
                                        'previous_tax_declaration_number' ? (
                                            <DeclarationNumberSearch
                                                id={fieldId}
                                                value={values[field.name]}
                                                maxLength={field.maxLength}
                                                disabled={saving}
                                                excludeId={document.id}
                                                excludeNumber={
                                                    values.tax_declaration_number ||
                                                    document.taxDeclarationNumber
                                                }
                                                aria-describedby={
                                                    errors[field.name]
                                                        ? `${fieldId}-error`
                                                        : undefined
                                                }
                                                onChange={(value, match) => {
                                                    updateValue(
                                                        field.name,
                                                        value,
                                                    );
                                                    if (match?.declarationDate)
                                                        updateValue(
                                                            'previous_declaration_date',
                                                            match.declarationDate,
                                                        );
                                                }}
                                            />
                                        ) : field.type === 'textarea' ? (
                                            <textarea
                                                id={fieldId}
                                                value={values[field.name]}
                                                maxLength={field.maxLength}
                                                autoFocus={index === 0}
                                                onChange={(event) =>
                                                    updateValue(
                                                        field.name,
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    errors[field.name],
                                                )}
                                                aria-describedby={
                                                    errors[field.name]
                                                        ? `${fieldId}-error`
                                                        : undefined
                                                }
                                                className="min-h-48 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
                                            />
                                        ) : (
                                            <Input
                                                id={fieldId}
                                                type={field.type ?? 'text'}
                                                value={values[field.name]}
                                                maxLength={field.maxLength}
                                                min={
                                                    field.type === 'number'
                                                        ? 0
                                                        : undefined
                                                }
                                                step={
                                                    field.type === 'number'
                                                        ? '0.0001'
                                                        : undefined
                                                }
                                                autoFocus={index === 0}
                                                aria-invalid={Boolean(
                                                    errors[field.name],
                                                )}
                                                aria-describedby={
                                                    errors[field.name]
                                                        ? `${fieldId}-error`
                                                        : undefined
                                                }
                                                onChange={(event) =>
                                                    updateValue(
                                                        field.name,
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        )}
                                        <InputError
                                            id={`${fieldId}-error`}
                                            message={errors[field.name]}
                                        />
                                    </div>
                                );
                            })}
                        {fields.some((field) =>
                            field.name.startsWith('boundary_'),
                        ) && (
                            <dl className="min-w-0 sm:col-span-2">
                                <BoundaryCompass
                                    document={document}
                                    renderBoundary={(name, label) => {
                                        const fieldId = `${id}-${name}`;
                                        return (
                                            <>
                                                <Label
                                                    htmlFor={fieldId}
                                                    className="sr-only"
                                                >
                                                    {label}
                                                </Label>
                                                <Input
                                                    id={fieldId}
                                                    value={values[name]}
                                                    maxLength={255}
                                                    className="h-8 px-2 text-xs md:text-xs"
                                                    aria-invalid={Boolean(
                                                        errors[name],
                                                    )}
                                                    aria-describedby={
                                                        errors[name]
                                                            ? `${fieldId}-error`
                                                            : undefined
                                                    }
                                                    onChange={(event) =>
                                                        updateValue(
                                                            name,
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    id={`${fieldId}-error`}
                                                    message={errors[name]}
                                                />
                                            </>
                                        );
                                    }}
                                />
                            </dl>
                        )}
                    </fieldset>
                    {error && (
                        <p role="alert" className="text-sm text-destructive">
                            {error}
                        </p>
                    )}
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={saving}
                            onClick={finishEditing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                saving || Object.keys(changed).length === 0
                            }
                            className="bg-foreground text-background hover:bg-foreground/90"
                        >
                            {saving && <Spinner />}
                            {saving ? 'Saving…' : 'Save'}
                        </Button>
                    </div>
                </form>
            ) : (
                <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                    {children}
                </dl>
            )}
        </section>
    );
}
