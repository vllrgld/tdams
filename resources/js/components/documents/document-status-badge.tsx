import {
    Archive,
    CircleCheck,
    CircleDashed,
    CircleDot,
    CircleX,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { documentStatusLabels } from '@/lib/document-status';
import { cn } from '@/lib/utils';
import type { ArchivedDocument } from '@/types/documents';

const appearances = {
    archived: {
        icon: Archive,
        className:
            'border-neutral-200 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200',
    },
    under_review: {
        icon: CircleDashed,
        className:
            'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
    },
    in_progress: {
        icon: CircleDot,
        className:
            'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-white',
    },
    completed: {
        icon: CircleCheck,
        className:
            'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
    },
    approved: {
        icon: CircleCheck,
        className:
            'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
    },
    disapproved: {
        icon: CircleX,
        className:
            'border-red-200 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
    },
} as const;

export default function DocumentStatusBadge({
    document,
    className,
}: {
    document: Pick<ArchivedDocument, 'status' | 'usesTaxFields' | 'filingPath'>;
    className?: string;
}) {
    if (document.usesTaxFields) {
        return null;
    }

    const status =
        document.filingPath === 'archive'
            ? 'archived'
            : (document.status ?? 'under_review');
    const { icon: Icon, className: appearance } = appearances[status];

    return (
        <Badge
            variant="outline"
            className={cn(
                'gap-1 px-1.5 text-[11px] leading-4',
                appearance,
                className,
            )}
            data-slot="document-status"
        >
            <Icon aria-hidden="true" />
            <span className="sr-only">Document status: </span>
            {documentStatusLabels[status]}
        </Badge>
    );
}
