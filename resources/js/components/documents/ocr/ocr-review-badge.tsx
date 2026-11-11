import { Check, CircleDashed, ScanText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OcrReviewBadge({
    reviewedAt,
    className,
    compact = false,
    tone = 'default',
}: {
    reviewedAt: string | null;
    className?: string;
    compact?: boolean;
    tone?: 'default' | 'details';
}) {
    const reviewed = Boolean(reviewedAt);
    const Icon = reviewed ? Check : CircleDashed;

    return (
        <span
            title={
                reviewed
                    ? 'The OCR transcription has been reviewed against the document.'
                    : 'The OCR transcription has not been reviewed against the document.'
            }
            className={cn(
                'inline-flex shrink-0 items-center gap-1 text-xs leading-4 font-normal whitespace-nowrap',
                tone === 'details'
                    ? 'gap-1.5 text-[13px] leading-5 text-slate-700 dark:text-neutral-200'
                    : reviewed
                      ? 'text-blue-900 dark:text-white'
                      : 'text-slate-500 dark:text-neutral-400',
                className,
            )}
        >
            {tone === 'details' ? (
                <ScanText className="size-3.5 shrink-0" aria-hidden="true" />
            ) : (
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>
                <span className={compact ? 'sr-only' : undefined}>OCR </span>
                {compact
                    ? reviewed
                        ? 'Reviewed'
                        : 'Not reviewed'
                    : reviewed
                      ? 'reviewed'
                      : 'not reviewed'}
            </span>
        </span>
    );
}
