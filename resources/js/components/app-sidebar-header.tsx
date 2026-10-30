import { useEffect, useState } from 'react';
import { Fragment } from 'react';
import {
    BellDot,
    ChevronDown,
    Maximize,
    Minimize,
    Moon,
    Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useArchiveHeaderTrail } from '@/components/archive-header-context';
import GlobalSearch from '@/components/global-search';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useAppearance } from '@/hooks/use-appearance';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { toast } from 'sonner';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const { isMobile, open } = useSidebar();
    const archiveTrail = useArchiveHeaderTrail();
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
        <header
            className="app-sidebar-header fixed top-0 right-0 z-30 grid h-16 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-sidebar-border/50 px-4 md:grid-cols-[minmax(8rem,1fr)_minmax(0,36rem)_minmax(8rem,1fr)]"
            style={{
                left: isMobile
                    ? 0
                    : open
                      ? 'var(--sidebar-width)'
                      : 'var(--sidebar-width-icon)',
            }}
        >
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1 size-8 shrink-0" />
                <Separator
                    orientation="vertical"
                    className="mr-1 shrink-0 bg-blue-100/25 data-[orientation=vertical]:h-4"
                />
                <div className="min-w-0 flex-1">
                    {archiveTrail.length > 0 ? (
                        <>
                            <Breadcrumb
                                aria-label="Archive location"
                                className="hidden sm:block"
                            >
                                <BreadcrumbList>
                                    {archiveTrail.map((item, index) => (
                                        <Fragment key={index}>
                                            <BreadcrumbItem>
                                                {index ===
                                                archiveTrail.length - 1 ? (
                                                    <BreadcrumbPage
                                                        title={item.title}
                                                    >
                                                        {item.title}
                                                    </BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink
                                                        render={
                                                            <button
                                                                type="button"
                                                                onClick={
                                                                    item.onSelect
                                                                }
                                                                title={
                                                                    item.title
                                                                }
                                                            />
                                                        }
                                                    >
                                                        {item.title}
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                            {index <
                                                archiveTrail.length - 1 && (
                                                <BreadcrumbSeparator />
                                            )}
                                        </Fragment>
                                    ))}
                                </BreadcrumbList>
                            </Breadcrumb>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <Button
                                            variant="ghost"
                                            className="h-8 max-w-full min-w-0 gap-1 px-0 sm:hidden"
                                            aria-label="Archive location"
                                        />
                                    }
                                >
                                    <span className="truncate text-sm font-semibold">
                                        {archiveTrail.at(-1)?.title}
                                    </span>
                                    <ChevronDown
                                        aria-hidden="true"
                                        className="size-3 shrink-0"
                                    />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="start"
                                    className="max-w-[calc(100vw-2rem)]"
                                >
                                    {archiveTrail.map((item, index) => (
                                        <DropdownMenuItem
                                            key={index}
                                            onClick={item.onSelect}
                                            className="max-w-72 truncate"
                                            aria-current={
                                                index ===
                                                archiveTrail.length - 1
                                                    ? 'location'
                                                    : undefined
                                            }
                                        >
                                            {item.title}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    )}
                </div>
            </div>
            <div className="flex min-w-0 justify-center">
                <GlobalSearch />
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1">
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label="Notifications"
                                title="Notifications"
                            />
                        }
                    >
                        <BellDot
                            aria-hidden="true"
                            className="size-4"
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
                <Separator
                    orientation="vertical"
                    className="mx-1 bg-blue-100/25 data-[orientation=vertical]:h-4"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                    title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                    onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
                >
                    {isDark ? (
                        <Sun aria-hidden="true" className="size-4" />
                    ) : (
                        <Moon aria-hidden="true" className="size-4" />
                    )}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={
                        isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
                    }
                    title={
                        isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
                    }
                    onClick={toggleFullscreen}
                >
                    {isFullscreen ? (
                        <Minimize aria-hidden="true" className="size-4" />
                    ) : (
                        <Maximize aria-hidden="true" className="size-4" />
                    )}
                </Button>
            </div>
        </header>
    );
}
