import { Link } from '@inertiajs/react';
import {
    Archive,
    Bookmark,
    BookMarked,
    FileSearch,
    Folders,
    LayoutDashboard,
    Palette,
    ScanText,
    Shield,
    UserRound,
} from 'lucide-react';
import DrawerIcon from '@/components/drawer-icon';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editOcr } from '@/routes/ocr';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'Documents',
        href: '/documents',
        icon: FileSearch,
    },
    {
        title: 'Archive',
        href: '/archive',
        icon: Archive,
    },
    {
        title: 'Bookmarks',
        href: '/bookmarks',
        icon: Bookmark,
    },
    {
        title: 'Manage',
        href: '/manage/cabinets',
        icon: Folders,
        items: [
            {
                title: 'Cabinets',
                href: '/manage/cabinets',
                icon: DrawerIcon,
            },
            {
                title: 'Books',
                href: '/manage/books',
                icon: BookMarked,
            },
        ],
    },
];

const accountNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: editProfile(),
        icon: UserRound,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: Shield,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: Palette,
    },
    {
        title: 'OCR',
        href: editOcr(),
        icon: ScanText,
    },
];

export function AppSidebar() {
    return (
        <Sidebar
            collapsible="icon"
            variant="sidebar"
            className="border-sidebar-border"
        >
            <SidebarHeader className="app-sidebar-brand -mr-px h-16 shrink-0 flex-row items-center border-b border-sidebar-border py-0">
                <SidebarMenu className="min-w-0 flex-1">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="h-12 gap-3 rounded-md py-0"
                            render={
                                <Link
                                    href={dashboard()}
                                    aria-label="Tax Declaration Archive Management System"
                                    title="Tax Declaration Archive Management System"
                                    prefetch
                                />
                            }
                        >
                            <img
                                src="/logo.png"
                                alt=""
                                className="size-9 shrink-0 object-contain group-data-[collapsible=icon]:size-8"
                            />
                            <span className="grid min-w-0 gap-0.5 whitespace-nowrap group-data-[collapsible=icon]:hidden">
                                <span className="truncate text-[13px] leading-4 font-semibold">
                                    Tax Declaration Archive
                                </span>
                                <span className="truncate text-[11px] leading-4 font-normal text-blue-100">
                                    Management System
                                </span>
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarTrigger className="size-8 shrink-0 md:hidden" />
            </SidebarHeader>

            <SidebarContent className="overflow-x-hidden py-2">
                <NavMain label="Menu" items={mainNavItems} />
                <SidebarSeparator />
                <NavMain label="Account" items={accountNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
