import { Tabs } from '@base-ui/react/tabs';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { useDocumentUpload } from '@/pages/documents/hooks/use-document-upload';
import { filled, sectionCanBeChecked } from '../../lib/metadata';
import { mappingModelLabel } from '../../lib/mapping-models';
import type {
    DocumentFieldDefinition,
    DocumentFieldSection,
    DocumentFieldValues,
    MetadataField,
} from '../../types';
import DeclarationNumberSearch from '@/components/documents/declaration-number-search';

const REMARKS_KEY = 'remarks';

export default function DocumentFieldReview({
    workflow,
    mappingModels,
    fieldSections,
}: {
    workflow: ReturnType<typeof useDocumentUpload>;
    mappingModels: string[];
    fieldSections: DocumentFieldSection[];
}) {
    const {
        activeReviewSection,
        setActiveReviewSection,
        model,
        setModel,
        busy,
        checkAll,
        mapFields,
        pending,
        values,
        checked,
        edited,
        fieldErrors,
        setSectionChecked,
        updateValue,
        documentId,
    } = workflow;
    const reviewSections = fieldSections.filter(
        (section) => section.id !== 'remarks',
    );
    const remarksField = fieldSections.find(
        (section) => section.id === 'remarks',
    )?.fields[0];
    return (
        <Tabs.Root
            value={activeReviewSection}
            onValueChange={(value) => {
                if (typeof value === 'string') setActiveReviewSection(value);
            }}
            className="flex min-h-96 min-w-0 flex-col gap-3 md:min-h-0"
        >
            <div className="grid shrink-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] md:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto]">
                <div className="grid min-w-0 gap-2">
                    <Label htmlFor="mapping-model">Model</Label>
                    <Select
                        disabled={busy}
                        value={model}
                        onValueChange={(value) =>
                            setModel(typeof value === 'string' ? value : '')
                        }
                        items={mappingModels.map((item) => ({
                            value: item,
                            label: mappingModelLabel(item),
                        }))}
                    >
                        <SelectTrigger
                            id="mapping-model"
                            className="w-full rounded-none"
                        >
                            <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                            {mappingModels.map((item) => (
                                <SelectItem
                                    key={item}
                                    value={item}
                                    className="rounded-none"
                                >
                                    {mappingModelLabel(item)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={checkAll}
                        className="rounded-none"
                    >
                        Check all
                    </Button>
                    <Button
                        type="button"
                        disabled={busy || model === ''}
                        onClick={() => void mapFields()}
                        className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                    >
                        {pending === 'map' ? 'Mapping…' : 'Map'}
                    </Button>
                </div>
            </div>

            <Tabs.List
                aria-label="Review sections"
                className="flex shrink-0 flex-wrap gap-1 border-b border-slate-200 pb-2 dark:border-neutral-800"
            >
                {reviewSections.map((section) => (
                    <Tabs.Tab
                        key={section.id}
                        value={section.id}
                        className="rounded-none px-2 py-1.5 text-xs font-medium text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-700 data-active:bg-blue-900 data-active:text-white dark:text-neutral-300 dark:hover:bg-neutral-900 dark:data-active:bg-blue-900 dark:data-active:text-white"
                    >
                        {section.tabLabel}
                    </Tabs.Tab>
                ))}
                <Tabs.Tab
                    value={REMARKS_KEY}
                    className="rounded-none px-2 py-1.5 text-xs font-medium text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-700 data-active:bg-blue-900 data-active:text-white dark:text-neutral-300 dark:hover:bg-neutral-900 dark:data-active:bg-blue-900 dark:data-active:text-white"
                >
                    Remarks
                </Tabs.Tab>
            </Tabs.List>

            {reviewSections.map((section) => (
                <Tabs.Panel
                    key={section.id}
                    value={section.id}
                    className="max-h-[48dvh] min-h-0 flex-1 overflow-y-auto pr-1 outline-none md:max-h-none"
                >
                    <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-neutral-800">
                        <input
                            id={`document-section-${section.id}`}
                            type="checkbox"
                            checked={
                                checked[section.id] === true &&
                                sectionCanBeChecked(section, values, edited)
                            }
                            disabled={
                                busy ||
                                !sectionCanBeChecked(section, values, edited)
                            }
                            onChange={(event) =>
                                setSectionChecked(
                                    section.id,
                                    event.target.checked,
                                )
                            }
                            className="size-4 accent-blue-900"
                        />
                        <Label
                            htmlFor={`document-section-${section.id}`}
                            className="text-sm font-semibold text-slate-900 dark:text-neutral-100"
                        >
                            {section.title}
                        </Label>
                    </div>
                    <div
                        className={
                            section.id === 'property'
                                ? 'grid gap-4 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2'
                                : 'grid gap-4'
                        }
                    >
                        {section.fields
                            .filter(
                                (field) => !field.name.startsWith('boundary_'),
                            )
                            .map((field) => (
                                <FieldRow
                                    key={field.name}
                                    id={`document-${field.name}`}
                                    label={field.label}
                                    error={fieldErrors[field.name]}
                                >
                                    {field.name ===
                                    'previous_tax_declaration_number' ? (
                                        <DeclarationNumberSearch
                                            excludeId={documentId ?? undefined}
                                            id={`document-${field.name}`}
                                            value={values[field.name]}
                                            onChange={(value, match) => {
                                                updateValue(field.name, value);

                                                if (match?.declarationDate) {
                                                    updateValue(
                                                        'previous_declaration_date',
                                                        match.declarationDate,
                                                    );
                                                }
                                            }}
                                            excludeNumber={
                                                values.tax_declaration_number
                                            }
                                            maxLength={field.maxLength}
                                            disabled={busy}
                                        />
                                    ) : (
                                        <Input
                                            id={`document-${field.name}`}
                                            disabled={busy}
                                            type={
                                                field.type ??
                                                (field.name === 'area'
                                                    ? 'number'
                                                    : 'text')
                                            }
                                            step={
                                                field.name === 'area'
                                                    ? '0.0001'
                                                    : undefined
                                            }
                                            min={
                                                field.name === 'area'
                                                    ? '0'
                                                    : undefined
                                            }
                                            value={values[field.name]}
                                            onChange={(event) =>
                                                updateValue(
                                                    field.name,
                                                    event.target.value,
                                                )
                                            }
                                            maxLength={field.maxLength}
                                            className="rounded-none"
                                        />
                                    )}
                                </FieldRow>
                            ))}
                        {section.id === 'boundaries' && (
                            <BoundaryEditor
                                fields={section.fields}
                                values={values}
                                errors={fieldErrors}
                                busy={busy}
                                onValueChange={updateValue}
                            />
                        )}
                    </div>
                </Tabs.Panel>
            ))}

            <Tabs.Panel
                value={REMARKS_KEY}
                className="max-h-[48dvh] min-h-0 flex-1 overflow-y-auto pr-1 outline-none md:max-h-none"
            >
                <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-neutral-800">
                    <input
                        id="document-remarks-check"
                        type="checkbox"
                        checked={
                            checked[REMARKS_KEY] === true &&
                            (filled(values.remarks) || edited.remarks === true)
                        }
                        disabled={
                            busy || (!filled(values.remarks) && !edited.remarks)
                        }
                        onChange={(event) =>
                            setSectionChecked(REMARKS_KEY, event.target.checked)
                        }
                        className="size-4 accent-blue-900"
                    />
                    <Label
                        htmlFor="document-remarks-check"
                        className="text-sm font-semibold text-slate-900 dark:text-neutral-100"
                    >
                        Remarks
                    </Label>
                </div>
                <textarea
                    id="document-remarks"
                    disabled={busy}
                    value={values.remarks}
                    aria-label="Remarks"
                    onChange={(event) =>
                        updateValue('remarks', event.target.value)
                    }
                    maxLength={remarksField?.maxLength}
                    rows={8}
                    className="w-full min-w-0 rounded-none border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                <InputError message={fieldErrors.remarks} />
            </Tabs.Panel>
        </Tabs.Root>
    );
}

function BoundaryEditor({
    fields,
    values,
    errors,
    busy,
    onValueChange,
}: {
    fields: DocumentFieldDefinition[];
    values: DocumentFieldValues;
    errors: Record<string, string>;
    busy: boolean;
    onValueChange: (name: MetadataField, value: string) => void;
}) {
    const sides: {
        name: MetadataField;
        direction: string;
        label: string;
    }[] = [
        { name: 'boundary_northwest', direction: 'NW', label: 'Northwest' },
        { name: 'boundary_north', direction: 'N', label: 'North' },
        { name: 'boundary_northeast', direction: 'NE', label: 'Northeast' },
        { name: 'boundary_west', direction: 'W', label: 'West' },
        { name: 'boundary_east', direction: 'E', label: 'East' },
        { name: 'boundary_southwest', direction: 'SW', label: 'Southwest' },
        { name: 'boundary_south', direction: 'S', label: 'South' },
        { name: 'boundary_southeast', direction: 'SE', label: 'Southeast' },
    ];

    function cell(side: (typeof sides)[number]) {
        return (
            <div
                key={side.name}
                className="flex min-h-16 min-w-0 flex-col gap-1 bg-card p-2"
            >
                <Label
                    htmlFor={`document-${side.name}`}
                    className="text-[10px] font-semibold text-blue-900 dark:text-white"
                >
                    <abbr title={side.label} className="no-underline">
                        {side.direction}
                    </abbr>
                </Label>
                <Input
                    id={`document-${side.name}`}
                    value={values[side.name]}
                    disabled={busy}
                    maxLength={
                        fields.find((field) => field.name === side.name)
                            ?.maxLength
                    }
                    aria-label={`${side.label} boundary`}
                    onChange={(event) =>
                        onValueChange(side.name, event.target.value)
                    }
                    className="h-8 rounded-none text-xs"
                />
                <InputError message={errors[side.name]} />
            </div>
        );
    }

    return (
        <div className="grid min-w-0 gap-2">
            <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                Boundaries
            </p>
            <div className="grid grid-cols-3 gap-px border border-slate-200 bg-slate-200 dark:border-neutral-800 dark:bg-neutral-800">
                {cell(sides[0])}
                {cell(sides[1])}
                {cell(sides[2])}
                {cell(sides[3])}
                <div className="flex min-h-16 flex-col items-center justify-center bg-card p-2 text-center">
                    <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase dark:text-neutral-400">
                        Lot
                    </span>
                    <span className="max-w-full truncate text-xs font-semibold text-slate-900 dark:text-neutral-100">
                        {values.lot_number || '—'}
                    </span>
                </div>
                {cell(sides[4])}
                {cell(sides[5])}
                {cell(sides[6])}
                {cell(sides[7])}
            </div>
        </div>
    );
}

function FieldRow({
    id,
    label,
    error,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
