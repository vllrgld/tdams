import type { ComponentProps, ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const searchBarSelectorClassName = "z-10 h-full w-auto max-w-[50%] shrink-0 gap-0.5 rounded-none rounded-l-md border border-blue-900 bg-transparent px-1.5 py-1 text-[13px] text-blue-900 shadow-none hover:bg-blue-900 hover:text-white focus-visible:border-blue-900 focus-visible:ring-[3px] focus-visible:ring-blue-900/20 data-[size=default]:h-full *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:truncate dark:bg-transparent dark:text-white dark:hover:bg-blue-900 dark:focus-visible:ring-white/50 [&_svg]:opacity-100 [&_svg:not([class*='text-'])]:text-current";

export const searchBarOptionsClassName = 'w-(--anchor-width) min-w-36 rounded-none rounded-l-md border-blue-900 text-blue-900 *:min-w-0 dark:text-white';

export const searchBarOptionClassName = "rounded-none text-sm focus:bg-blue-900 focus:text-white data-highlighted:bg-blue-900 data-highlighted:text-white [&_svg:not([class*='text-'])]:text-current";

export function SearchBar({
    selector,
    className,
    ...props
}: ComponentProps<typeof Input> & { selector?: ReactNode }) {
    return (
        <div data-slot="search-bar" className="flex h-[31px] min-w-0 w-full rounded-md bg-card dark:bg-black">
            {selector}
            <div className={cn(
                'relative min-w-0 flex-1 rounded-md border border-slate-300 focus-within:border-slate-400 focus-within:ring-[3px] focus-within:ring-slate-300/40 dark:border-neutral-700 dark:focus-within:border-neutral-500 dark:focus-within:ring-neutral-500/40',
                selector && 'rounded-l-none border-l-0',
            )}>
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                    {...props}
                    className={cn(
                        'h-full rounded-md border-0 bg-transparent pl-7.5 text-[13px] shadow-none focus-visible:border-transparent focus-visible:ring-0 md:text-[13px]',
                        selector && 'rounded-l-none',
                        className,
                    )}
                />
            </div>
        </div>
    );
}
