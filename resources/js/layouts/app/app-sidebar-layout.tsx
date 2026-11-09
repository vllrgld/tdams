import { AppContent } from '@/components/layout/app-content';
import { AppShell } from '@/components/layout/app-shell';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppSidebarHeader } from '@/components/layout/app-sidebar-header';
import { ArchiveHeaderProvider } from '@/components/layout/archive-header-context';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { uploadOptions as uploadOptionsRoute } from '@/routes/documents';
import type { AppLayoutProps } from '@/types';
import type { DocumentUploadOptions } from '@/pages/documents/types';

type UploadDialogModule =
    typeof import('@/pages/documents/components/upload/document-upload-dialog');
type UploadDialogComponent = UploadDialogModule['default'];
let uploadDialogPromise: Promise<UploadDialogModule> | null = null;

function loadUploadDialog() {
    uploadDialogPromise ??=
        import('@/pages/documents/components/upload/document-upload-dialog').catch(
            (error: unknown) => {
                uploadDialogPromise = null;
                throw error;
            },
        );
    return uploadDialogPromise;
}

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const page = usePage<Partial<DocumentUploadOptions>>();
    const [uploadOptions, setUploadOptions] =
        useState<DocumentUploadOptions | null>(null);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [UploadDialog, setUploadDialog] =
        useState<UploadDialogComponent | null>(null);
    const [loadingUpload, setLoadingUpload] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const uploadRequest = useRef<AbortController | null>(null);
    const optionsPage = useRef<typeof page.props | null>(null);
    const uploadButton = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setUploadOpen(false);
        setLoadingUpload(false);
        setUploadError(null);
        return () => {
            uploadRequest.current?.abort();
            uploadRequest.current = null;
        };
    }, [page.component, page.url]);

    function preloadUpload() {
        void loadUploadDialog().catch(() => {});
    }

    function changeUploadOpen(open: boolean) {
        if (!open) {
            uploadRequest.current?.abort();
            uploadRequest.current = null;
            setLoadingUpload(false);
        }
        setUploadOpen(open);
    }

    async function openUpload() {
        if (uploadRequest.current !== null) return;
        const suppliedOptions =
            page.props.archive &&
            page.props.mappingModels &&
            page.props.fieldSections
                ? {
                      archive: page.props.archive,
                      mappingModels: page.props.mappingModels,
                      fieldSections: page.props.fieldSections,
                  }
                : null;
        const availableOptions =
            suppliedOptions ??
            (optionsPage.current === page.props ? uploadOptions : null);
        setUploadOptions(availableOptions);
        setUploadError(null);
        setUploadOpen(true);
        if (availableOptions && UploadDialog) return;

        const controller = new AbortController();
        uploadRequest.current = controller;
        setLoadingUpload(true);
        try {
            const optionsPromise = availableOptions
                ? Promise.resolve(availableOptions)
                : fetch(uploadOptionsRoute.url(), {
                      headers: { Accept: 'application/json' },
                      credentials: 'same-origin',
                      signal: controller.signal,
                  }).then(async (response) => {
                      if (!response.ok)
                          throw new Error(
                              'Upload options could not be loaded. Try again.',
                          );
                      return (await response.json()) as DocumentUploadOptions;
                  });
            const [module, options] = await Promise.all([
                loadUploadDialog(),
                optionsPromise,
            ]);
            if (uploadRequest.current !== controller) return;
            optionsPage.current = page.props;
            setUploadDialog(() => module.default);
            setUploadOptions(options);
        } catch {
            if (
                uploadRequest.current === controller &&
                !controller.signal.aborted
            ) {
                setUploadError(
                    'The uploader could not be loaded. Check your connection and try again.',
                );
            }
        } finally {
            if (uploadRequest.current === controller) {
                uploadRequest.current = null;
                setLoadingUpload(false);
            }
        }
    }

    const ready = UploadDialog && uploadOptions && !uploadError;

    return (
        <ArchiveHeaderProvider>
            <AppShell variant="sidebar">
                <AppSidebar />
                <AppContent
                    variant="sidebar"
                    className="min-w-0 overflow-x-clip pt-16"
                >
                    <AppSidebarHeader
                        breadcrumbs={breadcrumbs}
                        onUploadDocument={openUpload}
                        onUploadIntent={preloadUpload}
                        uploadButtonRef={uploadButton}
                        loadingUpload={loadingUpload}
                    />
                    {children}
                    {uploadOpen &&
                        (ready ? (
                            <UploadDialog
                                {...uploadOptions}
                                open={uploadOpen}
                                onOpenChange={changeUploadOpen}
                                finalFocus={uploadButton}
                            />
                        ) : (
                            <Dialog
                                open={uploadOpen}
                                onOpenChange={changeUploadOpen}
                            >
                                <DialogContent
                                    finalFocus={uploadButton}
                                    className="rounded-none sm:max-w-2xl dark:border-neutral-800 dark:bg-black"
                                >
                                    <DialogHeader>
                                        <DialogTitle>
                                            Add document to archive
                                        </DialogTitle>
                                        <DialogDescription>
                                            Choose a scanned PDF or image to
                                            upload.
                                        </DialogDescription>
                                    </DialogHeader>
                                    {uploadError ? (
                                        <div className="space-y-3">
                                            <p
                                                role="alert"
                                                className="text-sm text-red-700 dark:text-red-400"
                                            >
                                                {uploadError}
                                            </p>
                                            <Button
                                                type="button"
                                                onClick={openUpload}
                                            >
                                                Try again
                                            </Button>
                                        </div>
                                    ) : (
                                        <div
                                            role="status"
                                            className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground"
                                        >
                                            <Spinner className="size-4 text-blue-900 dark:text-white" />
                                            Loading uploader…
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>
                        ))}
                </AppContent>
            </AppShell>
        </ArchiveHeaderProvider>
    );
}
