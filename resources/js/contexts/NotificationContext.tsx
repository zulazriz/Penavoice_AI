import { Notification } from '@/types';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((newNotification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
        const notification: Notification = {
            ...newNotification,
            id: Math.random().toString(36).substr(2, 9),
            read: false,
            createdAt: new Date(),
        };

        setNotifications((prev) => [notification, ...prev]);

        // Auto-remove success notifications after 5 seconds
        if (newNotification.type === 'success') {
            setTimeout(() => {
                setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
            }, 5000);
        }
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications((prev) => prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
    };

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
