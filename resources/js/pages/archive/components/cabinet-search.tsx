import { Search } from 'lucide-react';
import { Fragment, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export const CABINET_SEARCH_FIELDS = [
    { value: 'all', label: 'All' },
    { value: 'name', label: 'Name' },
    { value: 'drawer', label: 'Drawer' },
    { value: 'book', label: 'Book' },
] as const;

export type CabinetSearchField =
    (typeof CABINET_SEARCH_FIELDS)[number]['value'];

export default function CabinetSearch({
    query,
    field,
    onQueryChange,
    onFieldChange,
    placeholderAll = 'Search cabinets…',
    ariaLabel = 'Search cabinets',
}: {
    query: string;
    field: CabinetSearchField;
    onQueryChange: (query: string) => void;
    onFieldChange: (field: CabinetSearchField) => void;
    placeholderAll?: string;
    ariaLabel?: string;
}) {
    const selectedField =
        CABINET_SEARCH_FIELDS.find((option) => option.value === field) ??
        CABINET_SEARCH_FIELDS[0];
    const selectedLabel = selectedField.label;
    const placeholder =
        field === 'all'
            ? placeholderAll
            : `Search ${selectedLabel.toLowerCase()}…`;
    const items = CABINET_SEARCH_FIELDS.map((option) => ({
        value: option.value,
        label: option.label,
    }));

    function submitSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
    }

    function changeSearchField(value: unknown) {
        if (typeof value !== 'string') {
            return;
        }

        const option = CABINET_SEARCH_FIELDS.find(
            (item) => item.value === value,
        );

        if (!option) {
            return;
        }

        onFieldChange(option.value);
    }

    return (
        <form onSubmit={submitSearch} className="min-w-0 flex-1">
            <div className="flex h-10 min-w-0 overflow-hidden rounded-none border border-slate-300 bg-card focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:border-neutral-700 dark:bg-black">
                <Select
                    value={field}
                    onValueChange={changeSearchField}
                    items={items}
                >
                    <SelectTrigger
                        aria-label="Search in"
                        className="h-full w-40 shrink-0 rounded-none border-0 border-r border-slate-300 bg-transparent px-3 shadow-none focus-visible:border-transparent focus-visible:ring-0 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:truncate dark:border-neutral-700 dark:bg-transparent"
                    >
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent
                        align="start"
                        side="bottom"
                        className="min-w-40 rounded-none"
                    >
                        {CABINET_SEARCH_FIELDS.map((option, index) => (
                            <Fragment key={option.value}>
                                {index === 1 ? <SelectSeparator /> : null}
                                <SelectItem
                                    value={option.value}
                                    className="rounded-none"
                                >
                                    {option.label}
                                </SelectItem>
                            </Fragment>
                        ))}
                    </SelectContent>
                </Select>
                <div className="relative min-w-0 flex-1">
                    <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                        name="q"
                        value={query}
                        onChange={(event) => onQueryChange(event.target.value)}
                        maxLength={200}
                        autoComplete="off"
                        aria-label={ariaLabel}
                        placeholder={placeholder}
                        className="h-full rounded-none border-0 bg-transparent pl-9 shadow-none focus-visible:border-transparent focus-visible:ring-0"
                    />
                </div>
            </div>
        </form>
    );
}
