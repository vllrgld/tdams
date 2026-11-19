import { Fragment, type FormEvent } from 'react';
import {
    SearchBar,
    searchBarSelectorClassName,
    searchBarOptionsClassName,
    searchBarOptionClassName,
} from '@/components/ui/search-bar';
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
    { value: 'book', label: 'Folder / book' },
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
            <SearchBar
                selector={
                    <Select
                        value={field}
                        onValueChange={changeSearchField}
                        items={items}
                    >
                        <SelectTrigger
                            aria-label="Search in"
                            className={searchBarSelectorClassName}
                        >
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent
                            align="start"
                            side="bottom"
                            className={searchBarOptionsClassName}
                        >
                            {CABINET_SEARCH_FIELDS.map((option, index) => (
                                <Fragment key={option.value}>
                                    {index === 1 ? <SelectSeparator /> : null}
                                    <SelectItem
                                        value={option.value}
                                        className={searchBarOptionClassName}
                                    >
                                        {option.label}
                                    </SelectItem>
                                </Fragment>
                            ))}
                        </SelectContent>
                    </Select>
                }
                name="q"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                maxLength={200}
                autoComplete="off"
                aria-label={ariaLabel}
                placeholder={placeholder}
            />
        </form>
    );
}
