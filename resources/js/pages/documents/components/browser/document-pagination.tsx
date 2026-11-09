import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DocumentPaginationProps = {
    currentPage: number;
    pageCount: number;
    disabled: boolean;
    onPageChange: (page: number) => void;
};

export default function DocumentPagination({
    currentPage,
    pageCount,
    disabled,
    onPageChange,
}: DocumentPaginationProps) {
    return (
        <nav
            aria-label="Document pages"
            aria-busy={disabled}
            className="inline-flex h-7 shrink-0 overflow-hidden rounded-md border border-slate-300 dark:border-neutral-700"
        >
            <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Previous page"
                disabled={disabled || currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="h-full w-7 rounded-none text-blue-900 focus-visible:ring-inset dark:text-white"
            >
                <ChevronLeft aria-hidden="true" className="size-3.5" />
            </Button>
            <span
                aria-current="page"
                aria-label={`Page ${currentPage} of ${pageCount}`}
                title={`Page ${currentPage} of ${pageCount}`}
                className="flex min-w-7 items-center justify-center bg-blue-900 px-2 text-sm font-medium text-white tabular-nums"
            >
                {currentPage}
            </span>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Next page"
                disabled={disabled || currentPage >= pageCount}
                onClick={() => onPageChange(currentPage + 1)}
                className="h-full w-7 rounded-none text-blue-900 focus-visible:ring-inset dark:text-white"
            >
                <ChevronRight aria-hidden="true" className="size-3.5" />
            </Button>
        </nav>
    );
}
