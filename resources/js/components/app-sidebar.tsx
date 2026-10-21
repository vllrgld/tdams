import { Link } from '@inertiajs/react';
import {
    Archive,
    Bookmark,
    BookMarked,
    FileSearch,
    LayoutGrid,
    Palette,
    Settings2,
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
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
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
        title: 'Manage',
        href: '/manage/cabinets',
        icon: Settings2,
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
        title: 'Bookmarks',
        href: '/bookmarks',
        icon: Bookmark,
    },
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
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader className="border-b border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="h-auto min-h-12 rounded-none py-2"
                            render={<Link href={dashboard()} prefetch />}
                        >
                            <img
                                src="/logo.png"
                                alt=""
                                className="size-9 shrink-0 object-contain"
                            />
                            <span className="min-w-0 text-xs leading-tight font-semibold whitespace-normal group-data-[collapsible=icon]:hidden">
                                Tax Declaration Archive
                                <br />
                                Management System
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="overflow-x-hidden">
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
