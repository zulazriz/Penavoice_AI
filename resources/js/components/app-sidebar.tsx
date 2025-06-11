// import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
// import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import type { NavItem, SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Briefcase, Clock4, Coins, FolderUp, LayoutGrid } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
        roles: ['admin', 'customer'],
    },
    {
        title: 'Credit Packages',
        href: '/customer/credits',
        icon: Coins,
        roles: ['admin', 'customer'],
    },
    {
        title: 'Upload Media',
        href: '/customer/upload_media',
        icon: FolderUp,
        roles: ['admin', 'customer'],
    },
    {
        title: 'Status Jobs',
        href: '/customer/status_jobs',
        icon: Clock4,
        roles: ['admin', 'customer'],
    },
    {
        title: 'Case Management',
        href: '/customer/status_jobs',
        icon: Briefcase,
        roles: ['admin'],
    },
    {
        title: 'Support Enterprise',
        href: '/customer/status_jobs',
        icon: Briefcase,
        roles: ['admin'],
    },
];

// const footerNavItems: NavItem[] = [
//     {
//         title: 'Repository',
//         href: 'https://github.com/laravel/react-starter-kit',
//         icon: Folder,
//     },
//     {
//         title: 'Documentation',
//         href: 'https://laravel.com/docs/starter-kits#react',
//         icon: BookOpen,
//     },
// ];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const roleName = auth.user.role?.role_name ?? '';

    const allNavItems = mainNavItems.filter((item) => {
        return !item.roles || item.roles.map((role) => role.toLowerCase()).includes(roleName.toLowerCase());
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={allNavItems} />
            </SidebarContent>

            {/* <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter> */}
        </Sidebar>
    );
}
