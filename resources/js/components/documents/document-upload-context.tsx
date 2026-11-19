import { createContext, useContext, type ReactNode } from 'react';

type DocumentUploadActions = {
    openUpload: (trigger?: HTMLButtonElement | null) => void;
    preloadUpload: () => void;
    loadingUpload: boolean;
};

const DocumentUploadContext = createContext<DocumentUploadActions | null>(null);

export function DocumentUploadProvider({
    value,
    children,
}: {
    value: DocumentUploadActions;
    children: ReactNode;
}) {
    return (
        <DocumentUploadContext value={value}>{children}</DocumentUploadContext>
    );
}

export function useDocumentUploadActions() {
    return useContext(DocumentUploadContext);
}
