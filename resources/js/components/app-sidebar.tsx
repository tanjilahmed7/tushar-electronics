import { Link } from '@inertiajs/react';
import { LayoutGrid, Percent, Smartphone, Tags, Wallet } from 'lucide-react';
import AppLogo from '@/components/app-logo';
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
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'ড্যাশবোর্ড',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'সিম ব্যবস্থাপনা',
        href: '/sims',
        icon: Smartphone,
    },
    {
        title: 'লেনদেনের ক্যাটাগরি',
        href: '/transaction-categories',
        icon: Tags,
    },
    {
        title: 'লেনদেন',
        href: '/transactions',
        icon: Wallet,
    },
    {
        title: 'কমিশন',
        href: '/commission',
        icon: Percent,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
