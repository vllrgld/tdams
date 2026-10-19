import { useEffect, useState } from 'react';
import { BellDot, Maximize, Minimize, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { toast } from 'sonner';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const syncFullscreenState = () => {
            setIsFullscreen(document.fullscreenElement !== null);
        };

        document.addEventListener('fullscreenchange', syncFullscreenState);

        return () => {
            document.removeEventListener(
                'fullscreenchange',
                syncFullscreenState,
            );
        };
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await document.documentElement.requestFullscreen();
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Unable to change fullscreen mode.',
            );
        }
    };

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="ml-auto flex items-center gap-1">
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Notifications"
                                title="Notifications"
                            />
                        }
                    >
                        <BellDot
                            aria-hidden="true"
                            className="size-5"
                            strokeWidth={1.8}
                        />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-4">
                        <p className="text-sm font-medium">Notifications</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            No notifications yet.
                        </p>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                    title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                    onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
                >
                    {isDark ? (
                        <Sun aria-hidden="true" className="size-5" />
                    ) : (
                        <Moon aria-hidden="true" className="size-5" />
                    )}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={
                        isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
                    }
                    title={
                        isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
                    }
                    onClick={toggleFullscreen}
                >
                    {isFullscreen ? (
                        <Minimize aria-hidden="true" className="size-5" />
                    ) : (
                        <Maximize aria-hidden="true" className="size-5" />
                    )}
                </Button>
            </div>
        </header>
    );
}
