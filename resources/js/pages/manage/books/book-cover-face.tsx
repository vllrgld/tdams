import { cn } from '@/lib/utils';
import { DEFAULT_COVER_TITLE } from '@/pages/archive/data/cabinets';

function coverTitleLines(title: string): string[] {
    const words = title.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return coverTitleLines(DEFAULT_COVER_TITLE);
    }

    if (words.length <= 2) {
        return words;
    }

    const mid = Math.ceil(words.length / 2);

    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

export default function BookCoverFace({
    title,
    size = 'open',
    className,
}: {
    title: string;
    size?: 'open' | 'preview';
    className?: string;
}) {
    const lines = coverTitleLines(title);
    const open = size === 'open';

    return (
        <div
            className={cn(
                'book-cover-linen relative flex h-full w-full flex-col items-center justify-center',
                open ? 'gap-5 px-8 py-10' : 'gap-3 px-5 py-6',
                className,
            )}
        >
            <img
                src="/logo.png"
                alt=""
                className={cn(
                    'object-contain opacity-90',
                    open ? 'h-12 w-12' : 'h-8 w-8',
                )}
            />
            <p
                className={cn(
                    'text-center font-cinzel leading-[1.05] font-semibold tracking-[0.04em]',
                    open ? 'text-4xl' : 'text-2xl',
                )}
            >
                {lines.map((line, index) => (
                    <span key={`${index}-${line}`} className="block">
                        {line}
                    </span>
                ))}
            </p>
            <span
                aria-hidden="true"
                className={cn(
                    'bg-amber-200/80',
                    open ? 'h-px w-24' : 'h-px w-16',
                )}
            />
        </div>
    );
}
