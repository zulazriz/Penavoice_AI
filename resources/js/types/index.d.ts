import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    roles?: string[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface Roles {
    id: number;
    role_name: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role_id: number;
    role?: Role;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface CreditPackage {
    id: string;
    name: string;
    price: number;
    credits: number;
    bonusCredits: number;
    totalCredits: number;
    popular?: boolean;
    features: string[];
    description: string;
    pricePerCredit: number;
    savings?: number;
}

export interface PackageCategory {
    id: string;
    name: string;
    title: string;
    description: string;
    icon: string;
    packages: CreditPackage[];
    color: string;
    targetAudience: string;
}
