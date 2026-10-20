import { useState, type ReactNode } from 'react';
import { FileImage, FileText } from 'lucide-react';
import ClientOnly from '@/components/client-only';
import { useClientComponent } from '@/hooks/use-client-component';

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
}: {
    url: string;
    fit: 'contain' | 'cover';
}) {
    const PdfThumbnail = useClientComponent(loadPdfThumbnail);

    if (!PdfThumbnail) {
        return pdfFallback();
    }

    return <PdfThumbnail url={url} fit={fit} />;
}

type DocumentThumbnailProps = {
    mimeType: string;
    url: string;
    title: string;
    className?: string;
    fit?: 'contain' | 'cover';
};

export default function DocumentThumbnail({
    mimeType,
    url,
    title,
    className,
    fit = 'contain',
}: DocumentThumbnailProps) {
    const [imageError, setImageError] = useState(false);
    const isImage = mimeType.startsWith('image/');
    const TypeIcon = isImage ? FileImage : FileText;

    return (
        <div
            className={`relative w-full overflow-hidden bg-slate-100 dark:bg-neutral-900 ${
                fit === 'cover'
                    ? 'h-full'
                    : 'flex h-48 items-center justify-center'
            } ${className ?? ''}`}
        >
            {mimeType === 'application/pdf' ? (
                <ClientOnly fallback={pdfFallback()}>
                    <ClientPdfThumbnail url={url} fit={fit} />
                </ClientOnly>
            ) : isImage && !imageError ? (
                <img
                    src={url}
                    alt={`First page preview of ${title}`}
                    loading="lazy"
                    onError={() => setImageError(true)}
                    className={
                        fit === 'cover'
                            ? 'h-full w-full object-cover'
                            : 'h-full w-full object-contain p-1.5'
                    }
                />
            ) : (
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
