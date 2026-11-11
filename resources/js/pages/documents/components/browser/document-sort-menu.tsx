import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DocumentSortFilters } from '../../types';

type DocumentSortMenuProps = {
    value: DocumentSortFilters;
    onChange: (value: DocumentSortFilters) => void;
};

export default function DocumentSortMenu({
    value,
    onChange,
}: DocumentSortMenuProps) {
    const directionLabel =
        value.direction === 'asc' ? 'Ascending' : 'Descending';
    const fieldLabel =
        value.sort === 'declaration_date' ? 'Declaration date' : 'Date added';
    const SortIcon = value.direction === 'asc' ? ArrowUp : ArrowDown;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={<Button variant="outline" />}
                aria-label="Sort documents"
                title={`${fieldLabel}, ${directionLabel.toLowerCase()}`}
                className="h-[31px] shrink-0 gap-1.5 border-blue-900 bg-white px-2.5 text-[13px] font-normal text-blue-900 shadow-none hover:bg-blue-900 hover:text-white focus-visible:border-blue-900 focus-visible:ring-blue-900/20 has-[>svg]:px-2.5 data-popup-open:bg-blue-900 data-popup-open:text-white dark:bg-neutral-900 dark:text-white dark:hover:bg-blue-900 dark:focus-visible:ring-white/50 dark:data-popup-open:bg-blue-900"
            >
                <SortIcon aria-hidden="true" className="size-4" />
                <span>Sort</span>
                <ChevronDown aria-hidden="true" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                positionerClassName="z-20"
                className="w-72 max-w-[calc(100vw-1.5rem)] border-blue-900 text-blue-900 dark:text-white"
            >
                <DropdownMenuRadioGroup
                    aria-label="Sort direction"
                    value={value.direction}
                    onValueChange={(direction: unknown) => {
                        if (direction === 'asc' || direction === 'desc') {
                            onChange({ ...value, direction });
                        }
                    }}
                    className="grid grid-cols-2 gap-2 p-1"
                >
                    {[
                        { value: 'asc', label: 'Ascending', icon: ArrowUp },
                        { value: 'desc', label: 'Descending', icon: ArrowDown },
                    ].map(
                        ({ value: direction, label, icon: DirectionIcon }) => (
                            <DropdownMenuRadioItem
                                key={direction}
                                value={direction}
                                closeOnClick={false}
                                className="justify-center gap-1.5 rounded-md border border-blue-900 px-2 focus:bg-blue-50 focus:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-900 data-checked:bg-blue-900 data-checked:text-white data-checked:focus:bg-blue-900 data-checked:focus:text-white dark:focus:bg-neutral-800 dark:focus:text-white dark:data-checked:focus:bg-blue-900 [&>span]:hidden"
                            >
                                <DirectionIcon
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                {label}
                            </DropdownMenuRadioItem>
                        ),
                    )}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                    aria-label="Sort by"
                    value={value.sort}
                    onValueChange={(sort: unknown) => {
                        if (
                            sort === 'created_at' ||
                            sort === 'declaration_date'
                        ) {
                            onChange({ ...value, sort });
                        }
                    }}
                >
                    {[
                        { value: 'created_at', label: 'Date added' },
                        {
                            value: 'declaration_date',
                            label: 'Declaration date',
                        },
                    ].map((field) => (
                        <DropdownMenuRadioItem
                            key={field.value}
                            value={field.value}
                            className="pl-2 focus:bg-blue-900 focus:text-white data-checked:bg-blue-900 data-checked:text-white data-highlighted:bg-blue-900 data-highlighted:text-white [&>span]:hidden"
                        >
                            {field.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
