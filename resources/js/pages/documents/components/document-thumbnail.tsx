import { lazy, Suspense, useState } from 'react';
import { FileImage, FileText } from 'lucide-react';

const PdfThumbnail = lazy(() => import('./pdf-thumbnail'));

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
            className={`relative w-full overflow-hidden bg-slate-100 dark:bg-slate-900 ${
                fit === 'cover'
                    ? 'h-full'
                    : 'flex h-48 items-center justify-center'
            } ${className ?? ''}`}
        >
            {mimeType === 'application/pdf' ? (
                <Suspense
                    fallback={
                        <div className="flex h-full w-full items-center justify-center">
                            <FileText
                                aria-hidden="true"
                                className="size-10 text-slate-400"
                            />
                        </div>
                    }
                >
                    <PdfThumbnail url={url} fit={fit} />
                </Suspense>
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
