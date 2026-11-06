import { AppContent } from '@/components/layout/app-content';
import { AppShell } from '@/components/layout/app-shell';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppSidebarHeader } from '@/components/layout/app-sidebar-header';
import { ArchiveHeaderProvider } from '@/components/layout/archive-header-context';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <ArchiveHeaderProvider>
            <AppShell variant="sidebar">
                <AppSidebar />
                <AppContent
                    variant="sidebar"
                    className="min-w-0 overflow-x-clip pt-16"
                >
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    {children}
                </AppContent>
            </AppShell>
        </ArchiveHeaderProvider>
    );
}
