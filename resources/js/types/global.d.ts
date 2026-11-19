import type { Auth } from '@/types/auth';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            canResetData: boolean;
            officeName: string | null;
            officeId: number | null;
            officePermissions: {
                canManageRouting: boolean;
                canRouteDocuments: boolean;
                canUploadToReceiving: boolean;
                canManageDocumentTypes: boolean;
            };
            offices: { id: number; name: string }[];
            [key: string]: unknown;
        };
    }
}
