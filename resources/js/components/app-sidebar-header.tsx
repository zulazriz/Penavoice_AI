import AppearanceToggle from '@/components/appearance-toggle';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useNotifications } from '@/contexts/NotificationContext';
import { useInitials } from '@/hooks/use-initials';
import type { BreadcrumbItem as BreadcrumbItemType, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Bell, CreditCard } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const handleNotificationClick = () => {
        setShowNotifications(!showNotifications);
    };

    const handleNotificationItemClick = (notificationId: string) => {
        markAsRead(notificationId);
    };

    // Close notifications dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="flex h-16 shrink-0 items-center border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="ml-auto flex items-center gap-2">
                {/* Credits Value */}
                <div className="hidden items-center space-x-2 rounded-full bg-purple-50 px-3 py-1 sm:flex dark:bg-purple-500/20">
                    <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    {/* <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{auth?.tokens?.toLocaleString()} tokens</span> */}
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">10,000 Credits</span>
                </div>

                {/* Appearance Toggle Button */}
                <AppearanceToggle />

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={handleNotificationClick}
                        className="relative rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => {
                                            markAllAsRead();
                                            setShowNotifications(false);
                                        }}
                                        className="text-sm text-purple-600 transition-colors hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-64 overflow-y-auto text-sm text-gray-500 dark:text-white">
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-6 text-center">
                                        {/* <Bell className="mx-auto mb-2 h-8 w-8 opacity-50 dark:text-white" /> */}
                                        <Bell className="text-gray-white mx-auto mb-2 h-8 w-8 dark:text-white" />
                                        <p>No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.slice(0, 10).map((notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleNotificationItemClick(notification.id)}
                                            className={`cursor-pointer border-b border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 ${
                                                !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                            }`}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div
                                                    className={`mt-2 h-2 w-2 rounded-full transition-colors ${
                                                        !notification.read ? 'bg-blue-500' : 'bg-gray-300'
                                                    }`}
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        {notification.createdAt instanceof Date
                                                            ? notification.createdAt.toLocaleTimeString()
                                                            : new Date(notification.createdAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

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
                            <span
                                className={`rounded-full px-2 py-1 text-xs text-white ${auth.user.role?.role_name === 'Customer' ? 'bg-blue-500' : ''} ${auth.user.role?.role_name === 'Transcriptor' ? 'bg-green-500' : ''} ${!['Customer', 'Transcriptor'].includes(auth.user.role?.role_name ?? '') ? 'bg-gray-200 text-black dark:bg-gray-600 dark:text-white' : ''} `}
                            >
                                {auth.user.role?.role_name}
                            </span>
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
