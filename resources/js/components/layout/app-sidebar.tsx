import { index as documentsIndex } from '@/routes/documents';
import { index as archiveIndex } from '@/routes/archive';
import { index as cabinetsIndex } from '@/routes/manage/cabinets';
import { index as booksIndex } from '@/routes/manage/books';
import { index as leverArchIndex } from '@/routes/manage/lever-arch-files';
import { index as foldersIndex } from '@/routes/manage/folders';
import { index as documentTypesIndex } from '@/routes/manage/document-types';
import { index as documentRoutesIndex } from '@/routes/manage/document-routes';
import { Link, usePage } from '@inertiajs/react';
import {
    Archive,
    BookMarked,
    Building2,
    Database,
    FileSearch,
    FileType,
    Route,
    Hash,
    Folder,
    Folders,
    LayoutDashboard,
    SlidersHorizontal,
    Palette,
    ScanText,
    Shield,
    UserRound,
} from 'lucide-react';
import DrawerIcon from '@/components/filing/drawer-icon';
import { NavMain } from '@/components/layout/nav-main';
import { NavUser } from '@/components/layout/nav-user';
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
import { edit as editAccessibility } from '@/routes/accessibility';
import { edit as editData } from '@/routes/data';
import { edit as editOcr } from '@/routes/ocr';
import { index as officesIndex } from '@/routes/offices';
import { edit as editTrackingCodes } from '@/routes/tracking-codes';
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
        href: documentsIndex.url(),
        icon: FileSearch,
    },
    {
        title: 'Archive',
        href: archiveIndex.url(),
        icon: Archive,
    },
    {
        title: 'Manage',
        href: cabinetsIndex.url(),
        icon: Folders,
        items: [
            {
                title: 'Cabinets',
                href: cabinetsIndex.url(),
                icon: DrawerIcon,
            },
            {
                title: 'Books',
                href: booksIndex.url(),
                icon: BookMarked,
            },
            {
                title: 'Folders',
                href: foldersIndex.url(),
                icon: Folder,
            },
            {
                title: 'Lever arch files',
                href: leverArchIndex.url(),
                icon: BookMarked,
            },
            {
                title: 'Document types',
                href: documentTypesIndex.url(),
                icon: FileType,
            },
            {
                title: 'Routing',
                href: documentRoutesIndex.url(),
                icon: Route,
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
        title: 'Accessibility',
        href: editAccessibility(),
        icon: SlidersHorizontal,
    },
];

export function AppSidebar() {
    const { canResetData, officePermissions } = usePage().props;
    const officeNavItems = mainNavItems.map((item) => ({
        ...item,
        items: item.items?.filter(
            (child) =>
                (child.title !== 'Routing' ||
                    officePermissions?.canManageRouting) &&
                (child.title !== 'Document types' ||
                    officePermissions?.canManageDocumentTypes),
        ),
    }));
    const adminNavItems: NavItem[] = [
        {
            title: 'Offices',
            href: officesIndex.url(),
            icon: Building2,
        },
        {
            title: 'OCR',
            href: editOcr(),
            icon: ScanText,
        },
        {
            title: 'Tracking codes',
            href: editTrackingCodes.url(),
            icon: Hash,
        },
        ...(canResetData
            ? [
                  {
                      title: 'Data',
                      href: editData(),
                      icon: Database,
                  },
              ]
            : []),
    ];

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
                                    aria-label="Document Archiving and Management System"
                                    title="Document Archiving and Management System"
                                    prefetch
                                />
                            }
                        >
                            <img
                                src="/logo.png"
                                alt=""
                                className="size-9 shrink-0 object-contain group-data-[collapsible=icon]:size-8"
                            />
                            <span className="grid min-w-0 whitespace-nowrap group-data-[collapsible=icon]:hidden">
                                <span className="text-[13px] leading-[14px] font-semibold">
                                    Document Archiving
                                </span>
                                <span className="text-[11px] leading-[14px] font-normal text-blue-100">
                                    and Management System
                                </span>
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarTrigger className="size-8 shrink-0 md:hidden" />
            </SidebarHeader>

            <SidebarContent className="overflow-x-hidden py-2">
                <NavMain label="Menu" items={officeNavItems} />
                <SidebarSeparator />
                <NavMain label="Account" items={accountNavItems} />
                <SidebarSeparator />
                <NavMain label="Admin" items={adminNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
