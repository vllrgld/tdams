import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function AppLogoIcon({
    className,
    alt = 'Document Archiving and Management System',
    ...props
}: HTMLAttributes<HTMLSpanElement> & { alt?: string }) {
    return (
        <span
            role="img"
            aria-label={alt}
            className={cn(
                'inline-flex items-center justify-center gap-3 text-blue-900 dark:text-white',
                className,
            )}
            {...props}
        >
            <img
                src="/logo.png"
                alt=""
                className="size-10 shrink-0 object-contain"
            />
            <span
                aria-hidden="true"
                className="text-left text-sm leading-tight font-semibold text-balance"
            >
                Document Archiving and Management System
            </span>
        </span>
    );
}
