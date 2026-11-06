import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FileImage, FileText } from 'lucide-react';
import ClientOnly from '@/components/client-only';
import ThumbnailLoading from '@/components/pdf/thumbnail-loading';
import { useClientComponent } from '@/hooks/use-client-component';
import { cn } from '@/lib/utils';
import type { ThumbnailQuality } from '@/components/pdf/pdf-thumbnail-cache';

function loadPdfThumbnail() {
    return import('@/components/pdf/pdf-thumbnail');
}

function pdfFallback(): ReactNode {
    return (
        <div
            className="flex h-full w-full items-center justify-center"
            aria-busy="true"
        >
            <ThumbnailLoading />
        </div>
    );
}

function ClientPdfThumbnail({
    url,
    fit,
    pageNumber,
    fill,
    quality,
    eager,
}: {
    url: string;
    fit: 'contain' | 'cover';
    pageNumber: number;
    fill: boolean;
    quality: ThumbnailQuality;
    eager?: boolean;
}) {
    const [PdfThumbnail, error] = useClientComponent(loadPdfThumbnail);

    if (error) {
        return pageNumber > 1 ? null : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500 dark:text-neutral-400">
                Preview unavailable
            </div>
        );
    }

    if (!PdfThumbnail) {
        return pageNumber > 1 ? null : pdfFallback();
    }

    return (
        <PdfThumbnail
            url={url}
            fit={fit}
            pageNumber={pageNumber}
            fill={fill}
            quality={quality}
            eager={eager}
        />
    );
}

function ThumbnailImage({
    src,
    alt,
    eager,
    className,
    fallback,
}: {
    src: string;
    alt: string;
    eager: boolean;
    className: string;
    fallback: ReactNode;
}) {
    const imageRef = useRef<HTMLImageElement>(null);
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
        'loading',
    );

    useEffect(() => {
        const image = imageRef.current;

        if (image?.complete) {
            setStatus(image.naturalWidth > 0 ? 'loaded' : 'error');
        }
    }, []);

    if (status === 'error') {
        return fallback;
    }

    return (
        <div
            aria-busy={status === 'loading'}
            className="relative h-full w-full"
        >
            <img
                ref={imageRef}
                src={src}
                alt={alt}
                loading={eager ? 'eager' : 'lazy'}
                onLoad={() => setStatus('loaded')}
                onError={() => setStatus('error')}
                className={cn(className, status === 'loading' && 'opacity-0')}
            />
            {status === 'loading' && <ThumbnailLoading />}
        </div>
    );
}

type DocumentThumbnailProps = {
    mimeType: string;
    url: string;
    thumbnailUrl?: string | null;
    title: string;
    className?: string;
    fit?: 'contain' | 'cover';
    pageNumber?: number;
    fill?: boolean;
    quality?: ThumbnailQuality;
    eager?: boolean;
};

export default function DocumentThumbnail({
    mimeType,
    url,
    thumbnailUrl = null,
    title,
    className,
    fit = 'contain',
    pageNumber = 1,
    fill = false,
    quality = 'card',
    eager = false,
}: DocumentThumbnailProps) {
    const isImage = mimeType.startsWith('image/');
    const TypeIcon = isImage ? FileImage : FileText;
    const imageClassName =
        fit === 'cover'
            ? 'h-full w-full object-cover'
            : fill
              ? 'h-full w-full object-contain'
              : 'h-full w-full object-contain p-1.5';
    const unavailable = (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-500 dark:text-neutral-400">
            <TypeIcon aria-hidden="true" className="size-10" />
            {isImage && <span className="text-xs">Preview unavailable</span>}
        </div>
    );
    const preview =
        mimeType === 'application/pdf' ? (
            <ClientOnly fallback={pageNumber > 1 ? null : pdfFallback()}>
                <ClientPdfThumbnail
                    key={`${url}#${pageNumber}#${quality}`}
                    url={url}
                    fit={fit}
                    pageNumber={pageNumber}
                    fill={fill}
                    quality={quality}
                    eager={eager}
                />
            </ClientOnly>
        ) : isImage && pageNumber === 1 ? (
            <ThumbnailImage
                key={url}
                src={url}
                alt={`Page ${pageNumber} preview of ${title}`}
                eager={eager}
                className={imageClassName}
                fallback={unavailable}
            />
        ) : pageNumber > 1 ? null : (
            unavailable
        );

    return (
        <div
            className={cn(
                'relative w-full overflow-hidden',
                fill
                    ? 'h-full bg-transparent dark:bg-transparent'
                    : fit === 'cover'
                      ? 'h-full bg-white'
                      : 'bg-slate-100 dark:bg-neutral-900',
                fit === 'cover'
                    ? 'h-full'
                    : fill
                      ? 'flex h-full items-center justify-center'
                      : 'flex h-48 items-center justify-center',
                className,
            )}
        >
            {thumbnailUrl && pageNumber === 1 ? (
                <ThumbnailImage
                    key={thumbnailUrl}
                    src={thumbnailUrl}
                    alt=""
                    eager={eager}
                    className={cn(
                        imageClassName,
                        fit === 'cover' && 'object-top',
                    )}
                    fallback={preview}
                />
            ) : (
                preview
            )}
        </div>
    );
}
