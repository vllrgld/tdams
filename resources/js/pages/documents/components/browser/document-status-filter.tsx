import { ChevronDown, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { documentStatusLabels } from '@/lib/document-status';
import { cn } from '@/lib/utils';
import type { DocumentStatusFilter } from '../../types';

const choices = { all: 'All statuses', ...documentStatusLabels };

export default function DocumentStatusFilter({
    value,
    onChange,
}: {
    value: DocumentStatusFilter;
    onChange: (value: DocumentStatusFilter) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={<Button variant="outline" />}
                aria-label={`Document status filter: ${choices[value]}`}
                title={`Filter document status: ${choices[value]}`}
                className={cn(
                    'h-[31px] shrink-0 gap-0.5 border-blue-900 px-1.5 text-[13px] font-normal shadow-none hover:bg-blue-900 hover:text-white focus-visible:border-blue-900 focus-visible:ring-blue-900/20 has-[>svg]:px-1.5 data-popup-open:bg-blue-900 data-popup-open:text-white dark:hover:bg-blue-900 dark:focus-visible:ring-white/50',
                    value === 'all'
                        ? 'bg-white text-blue-900 dark:bg-neutral-900 dark:text-white'
                        : 'bg-blue-900 text-white dark:bg-blue-900 dark:text-white',
                )}
            >
                <CircleDot aria-hidden="true" className="size-4" />
                <span>Status</span>
                <ChevronDown aria-hidden="true" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                positionerClassName="z-20"
                className="w-44 border-blue-900 text-blue-900 dark:text-white"
            >
                <DropdownMenuRadioGroup
                    aria-label="Document status"
                    value={value}
                    onValueChange={(next: unknown) => {
                        if (
                            typeof next === 'string' &&
                            Object.hasOwn(choices, next)
                        ) {
                            onChange(next as DocumentStatusFilter);
                        }
                    }}
                >
                    {Object.entries(choices).map(([value, label]) => (
                        <DropdownMenuRadioItem
                            key={value}
                            value={value}
                            closeOnClick
                            className="pl-2 focus:bg-blue-900 focus:text-white data-checked:bg-blue-900 data-checked:text-white data-highlighted:bg-blue-900 data-highlighted:text-white [&>span]:hidden"
                        >
                            {label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
