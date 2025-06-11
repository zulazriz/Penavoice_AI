import AppearanceToggle from '@/components/appearance-toggle';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import type { BreadcrumbItem as BreadcrumbItemType, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();

    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="ml-auto flex items-center gap-2">
                <div className="hidden items-center space-x-2 rounded-full bg-purple-50 px-3 py-1 sm:flex dark:bg-purple-500/20">
                    <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    {/* <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{user?.tokens?.toLocaleString()} tokens</span> */}
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">10,000 Credits</span>
                </div>

                {/* Appearance Toggle Button */}
                <AppearanceToggle />

                {/* Profile */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                                <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                    {getInitials(auth.user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{auth.user.name}</span>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-56" align="end">
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
