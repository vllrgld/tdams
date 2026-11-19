import type { ReactNode, Ref } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type FloatingActionMenuOption = {
    label: string;
    Icon: ReactNode;
    onClick: () => void;
    disabled?: boolean;
};

type FloatingActionMenuProps = {
    options: readonly FloatingActionMenuOption[];
    label?: string;
    menuLabel?: string;
    triggerRef?: Ref<HTMLButtonElement>;
    disabled?: boolean;
    onIntent?: () => void;
    className?: string;
};

export default function FloatingActionMenu({
    options,
    label = 'Actions',
    menuLabel,
    triggerRef,
    disabled = false,
    onIntent,
    className,
}: FloatingActionMenuProps) {
    return (
        <div className={cn('relative z-20 w-fit', className)} data-slot="floating-action-menu">
            <DropdownMenu>
                <DropdownMenuTrigger
                    ref={triggerRef}
                    aria-label={label}
                    title={label}
                    disabled={disabled}
                    onPointerEnter={onIntent}
                    onFocus={onIntent}
                    render={
                        <Button
                            type="button"
                            size="icon"
                            className="group relative size-12 rounded-full border border-neutral-300 bg-neutral-200 text-neutral-700 shadow-lg shadow-black/15 transition-colors duration-150 hover:bg-black hover:text-white focus-visible:ring-ring/50 data-popup-open:bg-black data-popup-open:text-white motion-reduce:transition-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:shadow-black/30 dark:hover:bg-black dark:hover:text-white dark:data-popup-open:bg-black dark:data-popup-open:text-white"
                        />
                    }
                >
                    <Plus aria-hidden="true" className="size-5 transition-transform duration-150 ease-out group-data-popup-open:rotate-45 motion-reduce:transition-none" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    side="top"
                    align="end"
                    sideOffset={12}
                    aria-label={menuLabel ?? label}
                    positionerClassName="z-[70]"
                    className="flex w-56 max-w-[calc(100vw-2rem)] flex-col gap-2 overflow-visible border-0 bg-transparent p-0 shadow-none outline-none duration-150 motion-reduce:transition-none"
                >
                    {menuLabel && (
                        <DropdownMenuLabel className="max-w-full self-end truncate rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-normal text-muted-foreground shadow-sm" title={menuLabel}>
                            {menuLabel}
                        </DropdownMenuLabel>
                    )}
                    {options.length > 0 ? options.map(({ label, Icon, onClick, disabled }) => (
                        <DropdownMenuItem
                            key={label}
                            label={label}
                            closeOnClick
                            disabled={disabled}
                            onClick={onClick}
                            className="min-h-11 cursor-pointer gap-2.5 rounded-full border border-border bg-popover px-4 py-2.5 text-[13px] font-medium text-popover-foreground shadow-md shadow-black/10 focus:bg-accent data-highlighted:bg-accent dark:shadow-black/25 [&_svg:not([class*='text-'])]:text-current"
                        >
                            <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center [&>svg]:size-4">{Icon}</span>
                            <span className="min-w-0 flex-1">{label}</span>
                        </DropdownMenuItem>
                    )) : (
                        <DropdownMenuItem disabled className="rounded-full border border-border bg-popover px-4 py-3 shadow-md">
                            No actions available
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
