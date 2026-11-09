import { Popover } from '@base-ui/react/popover';
import { ChevronDown } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getDocumentDatePresets } from '../../lib/document-date-presets';
import type { DocumentDateFilters } from '../../types';

const DATE_RANGES = [
    {
        label: 'Declaration date',
        from: 'declaration_date_from',
        to: 'declaration_date_to',
    },
    { label: 'Date added', from: 'date_added_from', to: 'date_added_to' },
] as const;

const EMPTY_DATES = {
    declaration_date_from: '',
    declaration_date_to: '',
    date_added_from: '',
    date_added_to: '',
};

const dateFormatter = new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeZone: 'UTC',
});

function rangeLabel(from: string, to: string) {
    const format = (value: string) =>
        dateFormatter.format(new Date(`${value}T00:00:00Z`));
    if (from && to)
        return from === to ? format(from) : `${format(from)} – ${format(to)}`;
    return from ? `From ${format(from)}` : `Until ${format(to)}`;
}

type DocumentAdvancedFiltersProps = {
    value: DocumentDateFilters;
    onApply: (filters: DocumentDateFilters) => void;
};

export default function DocumentAdvancedFilters({
    value,
    onApply,
}: DocumentAdvancedFiltersProps) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(value);
    const [referenceDate, setReferenceDate] = useState(() => new Date());
    const [localTimezone] = useState(
        () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    const id = useId();
    const activeRanges = DATE_RANGES.filter(
        (range) => value[range.from] || value[range.to],
    );
    const invalid = DATE_RANGES.some(
        (range) =>
            draft[range.from] &&
            draft[range.to] &&
            draft[range.from] > draft[range.to],
    );
    const timezone =
        value.date_added_from || value.date_added_to
            ? value.date_timezone
            : localTimezone;
    const presets = getDocumentDatePresets(referenceDate, timezone);
    const summary = activeRanges
        .map(
            (range) =>
                `${range.label}: ${rangeLabel(value[range.from], value[range.to])}`,
        )
        .join('; ');

    function apply(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (invalid) return;
        onApply({ ...draft, date_timezone: timezone });
        setOpen(false);
    }

    return (
        <Popover.Root
            open={open}
            onOpenChange={(next) => {
                if (next) {
                    setDraft(value);
                    setReferenceDate(new Date());
                }
                setOpen(next);
            }}
        >
            <Popover.Trigger
                render={<Button variant="outline" />}
                aria-label={
                    activeRanges.length
                        ? `Dates, ${activeRanges.length} active`
                        : 'Dates'
                }
                title={summary || 'Filter by declaration date and date added'}
                className={cn(
                    'h-[31px] max-w-full min-w-0 shrink-0 gap-2 border-blue-900 px-2.5 text-[13px] font-normal shadow-none hover:bg-blue-900 hover:text-white focus-visible:border-blue-900 focus-visible:ring-blue-900/20 dark:hover:bg-blue-900 dark:hover:text-white dark:focus-visible:ring-white/50',
                    activeRanges.length > 0
                        ? 'bg-blue-900 text-white dark:bg-blue-900'
                        : 'bg-white text-blue-900 dark:bg-neutral-900 dark:text-white',
                )}
            >
                <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4"
                >
                    <path
                        fillRule="evenodd"
                        d="M5 4h14a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Zm-1 4v2h16V8H4Z"
                        clipRule="evenodd"
                    />
                    <path
                        d="M8 2v3m8-3v3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
                <span>Dates</span>
                {activeRanges.length > 0 && (
                    <span
                        aria-hidden="true"
                        className="flex size-5 items-center justify-center rounded-sm bg-white/20 text-xs tabular-nums"
                    >
                        {activeRanges.length}
                    </span>
                )}
                <ChevronDown aria-hidden="true" className="size-4" />
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Positioner
                    side="bottom"
                    align="end"
                    sideOffset={8}
                    collisionPadding={12}
                    className="z-20"
                >
                    <Popover.Popup className="max-h-[min(36rem,var(--available-height))] w-88 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-md border border-slate-200 bg-popover p-4 text-popover-foreground shadow-md outline-none dark:border-neutral-700">
                        <Popover.Title className="sr-only">Dates</Popover.Title>
                        <Popover.Description className="sr-only">
                            Documents must match every date range you set.
                            Either end can be left empty.
                        </Popover.Description>
                        <form onSubmit={apply} className="space-y-5">
                            {DATE_RANGES.map((range) => {
                                const invalidRange = Boolean(
                                    draft[range.from] &&
                                    draft[range.to] &&
                                    draft[range.from] > draft[range.to],
                                );
                                const errorId = `${id}-${range.from}-error`;
                                return (
                                    <fieldset
                                        key={range.from}
                                        className="min-w-0 space-y-2.5"
                                    >
                                        <legend className="text-[13px] font-semibold">
                                            {range.label}
                                        </legend>
                                        <Select
                                            items={presets}
                                            value={
                                                presets.find(
                                                    (preset) =>
                                                        preset.from ===
                                                            draft[range.from] &&
                                                        preset.to ===
                                                            draft[range.to],
                                                )?.value ?? null
                                            }
                                            onValueChange={(value) => {
                                                const preset = presets.find(
                                                    (item) =>
                                                        item.value === value,
                                                );
                                                if (!preset) return;
                                                setDraft((current) => ({
                                                    ...current,
                                                    [range.from]: preset.from,
                                                    [range.to]: preset.to,
                                                }));
                                            }}
                                        >
                                            <SelectTrigger
                                                aria-label={`${range.label} relative dates`}
                                                className="w-full border-blue-900 px-2.5 text-[13px] text-blue-900 shadow-none focus-visible:border-blue-900 focus-visible:ring-blue-900/20 data-[placeholder]:text-blue-900 dark:text-white dark:focus-visible:ring-white/50 dark:data-[placeholder]:text-white [&_svg]:opacity-100 [&_svg:not([class*='text-'])]:text-current"
                                            >
                                                <SelectValue placeholder="Relative dates" />
                                            </SelectTrigger>
                                            <SelectContent
                                                align="start"
                                                positionerClassName="z-20"
                                                className="w-(--anchor-width) max-w-[calc(100vw-1.5rem)] border-blue-900 text-blue-900 dark:text-white"
                                            >
                                                {presets.map((preset) => (
                                                    <SelectItem
                                                        key={preset.value}
                                                        value={preset.value}
                                                        className="text-[13px] *:last:flex-1 focus:bg-blue-50 focus:text-blue-900 data-highlighted:bg-blue-50 data-highlighted:text-blue-900 dark:focus:bg-blue-900 dark:focus:text-white dark:data-highlighted:bg-blue-900 dark:data-highlighted:text-white"
                                                    >
                                                        <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                                            <span>
                                                                {preset.label}
                                                            </span>
                                                            <span className="ml-auto text-[11px] text-slate-600 tabular-nums dark:text-neutral-300">
                                                                {preset.throughToday
                                                                    ? `${dateFormatter.format(new Date(`${preset.from}T00:00:00Z`))} – now`
                                                                    : rangeLabel(
                                                                          preset.from,
                                                                          preset.to,
                                                                      )}
                                                            </span>
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="grid grid-cols-2 gap-3">
                                            {(['from', 'to'] as const).map(
                                                (bound) => {
                                                    const name = range[bound];
                                                    const inputId = `${id}-${name}`;
                                                    return (
                                                        <div
                                                            key={name}
                                                            className="min-w-0 space-y-1.5"
                                                        >
                                                            <label
                                                                htmlFor={
                                                                    inputId
                                                                }
                                                                className="text-xs text-slate-600 dark:text-neutral-400"
                                                            >
                                                                {bound ===
                                                                'from'
                                                                    ? 'From'
                                                                    : 'To'}
                                                            </label>
                                                            <Input
                                                                id={inputId}
                                                                name={name}
                                                                type="date"
                                                                aria-label={`${range.label} ${bound}`}
                                                                min={
                                                                    bound ===
                                                                    'to'
                                                                        ? draft[
                                                                              range
                                                                                  .from
                                                                          ] ||
                                                                          '0001-01-01'
                                                                        : '0001-01-01'
                                                                }
                                                                max={
                                                                    bound ===
                                                                    'from'
                                                                        ? draft[
                                                                              range
                                                                                  .to
                                                                          ] ||
                                                                          '9999-12-31'
                                                                        : '9999-12-31'
                                                                }
                                                                value={
                                                                    draft[name]
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setDraft(
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            [name]: event
                                                                                .target
                                                                                .value,
                                                                        }),
                                                                    )
                                                                }
                                                                aria-invalid={
                                                                    invalidRange ||
                                                                    undefined
                                                                }
                                                                aria-describedby={
                                                                    invalidRange
                                                                        ? errorId
                                                                        : undefined
                                                                }
                                                                className="h-9 px-2 text-[13px] tabular-nums focus-visible:border-blue-900 focus-visible:ring-blue-900/20 md:text-[13px] dark:scheme-dark dark:focus-visible:ring-white/50"
                                                            />
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                        {range.from === 'date_added_from' && (
                                            <p className="text-xs text-slate-600 dark:text-neutral-400">
                                                Timezone:{' '}
                                                {timezone.replaceAll('_', ' ')}
                                            </p>
                                        )}
                                        {invalidRange && (
                                            <p
                                                id={errorId}
                                                role="alert"
                                                className="text-xs text-red-700 dark:text-red-400"
                                            >
                                                The end date must be on or after
                                                the start date.
                                            </p>
                                        )}
                                    </fieldset>
                                );
                            })}
                            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-neutral-700">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-[13px]"
                                    disabled={
                                        !activeRanges.length &&
                                        !DATE_RANGES.some(
                                            (range) =>
                                                draft[range.from] ||
                                                draft[range.to],
                                        )
                                    }
                                    onClick={() => {
                                        onApply({
                                            ...EMPTY_DATES,
                                            date_timezone: timezone,
                                        });
                                        setOpen(false);
                                    }}
                                >
                                    Clear all
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={invalid}
                                    className="bg-blue-900 text-[13px] text-white hover:bg-blue-800 focus-visible:ring-blue-900/20 dark:focus-visible:ring-white/50"
                                >
                                    Apply filters
                                </Button>
                            </div>
                        </form>
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}
