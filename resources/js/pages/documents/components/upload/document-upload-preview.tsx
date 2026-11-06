import ClientOnly from '@/components/client-only';
import { Spinner } from '@/components/ui/spinner';
import { useClientComponent } from '@/hooks/use-client-component';

function loadPdfPreview() {
    return import('@/components/pdf/pdf-preview');
}

function ClientPdfPreview({ url, title }: { url: string; title: string }) {
    const [PdfPreview, viewerError] = useClientComponent(loadPdfPreview);

    if (viewerError) {
        return (
            <p
                role="alert"
                className="flex h-full items-center justify-center p-6 text-center text-sm text-red-800 dark:text-red-300"
            >
                The PDF viewer could not be loaded. {viewerError}
            </p>
        );
    }

    if (!PdfPreview) {
        return (
            <div className="flex h-full min-h-64 items-center justify-center gap-2 text-sm text-slate-600 dark:text-neutral-300">
                <Spinner />
                Loading PDF viewer…
            </div>
        );
    }

    return <PdfPreview url={url} title={title} defaultFit="page" />;
}

export default function DocumentUploadPreview({
    pdfUrl,
    file,
    mimeType = file?.type,
}: {
    pdfUrl: string | null;
    file: File | null;
    mimeType?: string;
}) {
    return (
        <div className="flex h-80 min-h-80 flex-col overflow-hidden border border-slate-200 md:h-full md:min-h-0 dark:border-neutral-800">
            {pdfUrl &&
            (pdfUrl.includes('/ocr-pdf') || mimeType === 'application/pdf') ? (
                <ClientOnly
                    fallback={
                        <div className="flex min-h-64 items-center justify-center">
                            <Spinner />
                        </div>
                    }
                >
                    <ClientPdfPreview
                        url={pdfUrl}
                        title={file?.name ?? 'Document'}
                    />
                </ClientOnly>
            ) : pdfUrl ? (
                <div className="flex min-h-80 items-center justify-center overflow-auto bg-slate-100 p-2 dark:bg-neutral-900">
                    <img
                        src={pdfUrl}
                        alt={file?.name ?? 'Document'}
                        className="max-h-full max-w-full object-contain"
                    />
                </div>
            ) : (
                <p className="p-4 text-sm text-slate-600 dark:text-neutral-400">
                    The document preview is not available.
                </p>
            )}
        </div>
    );
}
