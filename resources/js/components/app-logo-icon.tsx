import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({
    className,
    alt = 'TDAMS',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/tdams%20no%20logo.png"
            alt={alt}
            className={`object-contain ${className ?? ''}`}
            {...props}
        />
    );
}
