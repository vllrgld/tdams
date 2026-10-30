import { useEffect, useState, type ReactNode } from 'react';
import { FileImage, FileText } from 'lucide-react';
import ClientOnly from '@/components/client-only';
import { useClientComponent } from '@/hooks/use-client-component';
import { cn } from '@/lib/utils';
import type { ThumbnailQuality } from './pdf-thumbnail-cache';

function loadPdfThumbnail() {
    return import('./pdf-thumbnail');
}

function pdfFallback(): ReactNode {
    return (
        <div
            className="flex h-full w-full items-center justify-center"
            aria-busy="true"
        >
            <FileText
                aria-hidden="true"
                className="size-10 animate-pulse text-slate-400 motion-reduce:animate-none"
            />
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
    const [PdfThumbnail] = useClientComponent(loadPdfThumbnail);

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
    const [imageError, setImageError] = useState(false);
    const isImage = mimeType.startsWith('image/');
    const TypeIcon = isImage ? FileImage : FileText;

    useEffect(() => {
        setImageError(false);
    }, [url]);

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
                <img
                    src={thumbnailUrl}
                    alt=""
                    loading={eager ? 'eager' : 'lazy'}
                    className={
                        fit === 'cover'
                            ? 'h-full w-full object-cover object-top'
                            : fill
                              ? 'h-full w-full object-contain'
                              : 'h-full w-full object-contain p-1.5'
                    }
                />
            ) : mimeType === 'application/pdf' ? (
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
            ) : isImage && !imageError && pageNumber === 1 ? (
                <img
                    src={url}
                    alt={`Page ${pageNumber} preview of ${title}`}
                    loading={eager ? 'eager' : 'lazy'}
                    onError={() => setImageError(true)}
                    className={
                        fit === 'cover'
                            ? 'h-full w-full object-cover'
                            : fill
                              ? 'h-full w-full object-contain'
                              : 'h-full w-full object-contain p-1.5'
                    }
                />
            ) : pageNumber > 1 ? null : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
                    <TypeIcon aria-hidden="true" className="size-10" />
                    {imageError && (
                        <span className="text-xs">Preview unavailable</span>
                    )}
                </div>
            )}
        </div>
    );
}
