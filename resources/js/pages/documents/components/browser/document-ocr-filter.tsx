import {
    Check,
    ChevronDown,
    CircleDashed,
    Files,
    ScanText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { DocumentOcrReviewFilter } from '../../types';

const choices = [
    { value: 'all', label: 'All documents', icon: Files },
    { value: 'reviewed', label: 'Reviewed', icon: Check },
    { value: 'unreviewed', label: 'Not reviewed', icon: CircleDashed },
] as const;

export default function DocumentOcrFilter({
    value,
    onChange,
}: {
    value: DocumentOcrReviewFilter;
    onChange: (value: DocumentOcrReviewFilter) => void;
}) {
    const label =
        choices.find((choice) => choice.value === value)?.label ??
        'All documents';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={<Button variant="outline" />}
                aria-label={`OCR filter: ${label}`}
                title={`Filter OCR review: ${label}`}
                className={cn(
                    'h-[31px] shrink-0 gap-1.5 border-blue-900 px-2.5 text-[13px] font-normal shadow-none hover:bg-blue-900 hover:text-white focus-visible:border-blue-900 focus-visible:ring-blue-900/20 has-[>svg]:px-2.5 data-popup-open:bg-blue-900 data-popup-open:text-white dark:hover:bg-blue-900 dark:focus-visible:ring-white/50',
                    value === 'all'
                        ? 'bg-white text-blue-900 dark:bg-neutral-900 dark:text-white'
                        : 'bg-blue-900 text-white dark:bg-blue-900 dark:text-white',
                )}
            >
                <ScanText aria-hidden="true" className="size-4" />
                <span>OCR</span>
                <ChevronDown aria-hidden="true" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                positionerClassName="z-20"
                className="w-44 border-blue-900 text-blue-900 dark:text-white"
            >
                <DropdownMenuRadioGroup
                    aria-label="OCR review"
                    value={value}
                    onValueChange={(next: unknown) => {
                        if (
                            next === 'all' ||
                            next === 'reviewed' ||
                            next === 'unreviewed'
                        )
                            onChange(next);
                    }}
                >
                    {choices.map(({ value, label, icon: Icon }) => (
                        <DropdownMenuRadioItem
                            key={value}
                            value={value}
                            closeOnClick
                            className="gap-2 pl-2 focus:bg-blue-900 focus:text-white data-checked:bg-blue-900 data-checked:text-white data-highlighted:bg-blue-900 data-highlighted:text-white [&>span]:hidden"
                        >
                            <Icon aria-hidden="true" className="size-4" />
                            {label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
