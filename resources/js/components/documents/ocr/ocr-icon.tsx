import { cn } from '@/lib/utils';

export default function OcrIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 32 16"
            className={cn('h-4 w-8', className)}
            aria-hidden="true"
        >
            <path
                d="M1 5.5V1.5H5M27 1.5h4v4M31 10.5v4h-4M5 14.5H1v-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
            />
            <text
                x="16"
                y="11.5"
                textAnchor="middle"
                fill="currentColor"
                fontSize="8"
                fontWeight="700"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
                OCR
            </text>
        </svg>
    );
}
