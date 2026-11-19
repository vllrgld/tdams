import { ChevronDown, FileType, Files } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { DocumentTypeOption } from '../../types';

export default function DocumentTypeFilter({
    value,
    types,
    onChange,
}: {
    value: string;
    types: DocumentTypeOption[];
    onChange: (value: string) => void;
}) {
    const selected = types.find((type) => String(type.id) === value);
    const active = value !== 'all';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={<Button variant="outline" />}
                aria-label={`Document Type filter: ${selected?.name ?? 'All types'}`}
                title={`Filter by document type: ${selected?.name ?? 'All types'}`}
                className={cn(
                    'h-[31px] shrink-0 gap-0.5 border-blue-900 px-1.5 text-[13px] font-normal shadow-none hover:bg-blue-900 hover:text-white focus-visible:border-blue-900 focus-visible:ring-blue-900/20 has-[>svg]:px-1.5 data-popup-open:bg-blue-900 data-popup-open:text-white dark:hover:bg-blue-900 dark:focus-visible:ring-white/50',
                    active
                        ? 'bg-blue-900 text-white dark:bg-blue-900 dark:text-white'
                        : 'bg-white text-blue-900 dark:bg-neutral-900 dark:text-white',
                )}
            >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
                    <path
                        fill="currentColor"
                        d="M6 2.25h7.1L13.35 8.15h6.4V20A1.75 1.75 0 0 1 18 21.75H6A1.75 1.75 0 0 1 4.25 20V4A1.75 1.75 0 0 1 6 2.25Z"
                    />
                    <path
                        fill="currentColor"
                        fillOpacity="0.45"
                        d="M13.1 2.45 19.55 8.15h-4.7a1.75 1.75 0 0 1-1.75-1.75V2.45Z"
                    />
                </svg>
                <span>Document Type</span>
                <ChevronDown aria-hidden="true" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                positionerClassName="z-20"
                className="max-h-72 w-56 overflow-y-auto border-blue-900 text-blue-900 dark:text-white"
            >
                <DropdownMenuRadioGroup
                    aria-label="Document type"
                    value={value}
                    onValueChange={(next: unknown) => {
                        if (typeof next === 'string' && next !== '') {
                            onChange(next);
                        }
                    }}
                >
                    <DropdownMenuRadioItem
                        value="all"
                        closeOnClick
                        className="gap-2 pl-2 focus:bg-blue-900 focus:text-white data-checked:bg-blue-900 data-checked:text-white data-highlighted:bg-blue-900 data-highlighted:text-white [&>span]:hidden"
                    >
                        <Files aria-hidden="true" className="size-4" />
                        All types
                    </DropdownMenuRadioItem>
                    {types.map((type) => (
                        <DropdownMenuRadioItem
                            key={type.id}
                            value={String(type.id)}
                            closeOnClick
                            className="gap-2 pl-2 focus:bg-blue-900 focus:text-white data-checked:bg-blue-900 data-checked:text-white data-highlighted:bg-blue-900 data-highlighted:text-white [&>span]:hidden"
                        >
                            <FileType aria-hidden="true" className="size-4" />
                            {type.name}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
