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
    auth_token?: string;
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
    credits: number;
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

export interface ModalState {
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    showCancel?: boolean;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    read: boolean; // This controls highlight state - false = highlighted/new, true = read/no highlight
    createdAt: Date;
    data?: unknown;
}

export interface ProcessingStep {
    step: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    timestamp?: Date;
}

export interface UploadedFile {
    id: string;
    file: File;
    progress: number;
    status: 'uploading' | 'pending' | 'processing' | 'completed' | 'error';
    uploadedAt: Date;
    duration?: number; // EXACT duration in seconds (with decimals)
    creditsRequired?: number; // EXACT credits required based on processing duration and pricing
    creditsUsed?: number; // Actual credits deducted after processing (should match creditsRequired)
    processingDays?: number; // Processing duration selected (3, 7, 14, or 21 days)
    transcriptionId?: string;
    transcriptionText?: string;
    processingSteps?: ProcessingStep[];
}

export interface UploadedFilesContextType {
    uploadedFiles: UploadedFile[];
    addFiles: (files: UploadedFile[]) => void;
    updateFile: (id: string, updates: Partial<UploadedFile> | ((prev: UploadedFile) => Partial<UploadedFile>)) => void;
    removeFile: (id: string) => void;
    clearAllFiles: () => void;
}

// Media file metadata interface - represents accurate file analysis
export interface MediaFileMetadata {
    fileName: string;
    fileSize: number; // Exact file size in bytes
    fileType: string;
    duration: number; // EXACT duration in seconds (with decimals)
    creditsRequired: number; // Display minutes (rounded up) for reference only
    lastModified: number;
}

export interface AudioJob {
    id: number;
    user_id: number;
    job_id: string;
    file_name: string;
    file_path?: string;
    file_size?: string | number;
    mime_type?: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    current_step?: string;
    error?: string;
    transcription?: string;
    duration?: number; // Make sure your backend includes this field if needed
    created_at: string;
    updated_at: string;
}
