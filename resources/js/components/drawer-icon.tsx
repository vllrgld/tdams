import type { LucideIcon } from 'lucide-react';
import { forwardRef, type SVGProps } from 'react';

type DrawerIconProps = SVGProps<SVGSVGElement> & {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
};

const DrawerIcon = forwardRef<SVGSVGElement, DrawerIconProps>(
    function DrawerIcon(
        {
            color = 'currentColor',
            size = 24,
            strokeWidth = 2,
            absoluteStrokeWidth,
            className,
            ...props
        },
        ref,
    ) {
        return (
            <svg
                ref={ref}
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth={
                    absoluteStrokeWidth
                        ? (Number(strokeWidth) * 24) / Number(size)
                        : strokeWidth
                }
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
                {...props}
            >
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <rect width="18" height="12" x="3" y="7" rx="2" />
                <path d="M9 13h6" />
            </svg>
        );
    },
) as LucideIcon;

export default DrawerIcon;
