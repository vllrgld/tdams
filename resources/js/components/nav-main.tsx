import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

const activeButtonClass =
    'rounded-none data-[active=true]:shadow-[inset_2px_0_0_0_var(--sidebar-primary)]';

export function NavMain({ items, label }: { items: NavItem[]; label: string }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) =>
                    item.items && item.items.length > 0 ? (
                        <CollapsibleNavItem
                            key={item.title}
                            item={item}
                            isCurrentUrl={isCurrentUrl}
                        />
                    ) : (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                isActive={isCurrentUrl(item.href)}
                                tooltip={{ children: item.title }}
                                className={activeButtonClass}
                                render={<Link href={item.href} prefetch />}
                            >
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ),
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}

function CollapsibleNavItem({
    item,
    isCurrentUrl,
}: {
    item: NavItem;
    isCurrentUrl: (href: NavItem['href']) => boolean;
}) {
    const childActive = item.items?.some((child) => isCurrentUrl(child.href));
    const open = Boolean(childActive);

    return (
        <Collapsible defaultOpen={open} className="group/collapsible">
            <SidebarMenuItem>
                <SidebarMenuButton
                    isActive={open}
                    tooltip={{ children: item.title }}
                    className={activeButtonClass}
                    render={<CollapsibleTrigger />}
                >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronDown className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[open]/collapsible:rotate-180" />
                </SidebarMenuButton>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {item.items?.map((child) => (
                            <SidebarMenuSubItem key={child.title}>
                                <SidebarMenuSubButton
                                    isActive={isCurrentUrl(child.href)}
                                    className="rounded-none"
                                    render={<Link href={child.href} prefetch />}
                                >
                                    {child.icon && <child.icon />}
                                    <span>{child.title}</span>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}
