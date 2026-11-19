import { Hash } from 'lucide-react';

export default function DocumentTrackingCode({
    code,
}: {
    code?: string | null;
}) {
    if (!code) return null;
    return (
        <span
            title={code}
            className="pointer-events-auto flex min-w-0 items-center gap-1.5 text-xs font-normal text-slate-600 dark:text-neutral-300"
        >
            <Hash aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="sr-only">Tracking code: </span>
            <span className="truncate select-all">{code}</span>
        </span>
    );
}
