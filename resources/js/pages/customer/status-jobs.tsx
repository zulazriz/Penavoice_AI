/* eslint-disable @typescript-eslint/no-unused-vars */
import AppLayout from '@/layouts/app-layout';
import { formatDuration, formatFileSize } from '@/lib/fileUtils';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Clock, Copy, Download, Eye, FileAudio, FileVideo, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Status Jobs',
        href: '/customer/status_jobs',
    },
];

// Define interfaces locally since we don't have access to the external types
interface ProcessingStep {
    step: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    timestamp?: Date;
}

interface UploadedFile {
    id: string;
    file: File;
    status: 'uploading' | 'pending' | 'processing' | 'completed' | 'error';
    uploadedAt: Date;
    duration?: number;
    transcriptionId?: string;
    transcriptionText?: string;
    processingSteps?: ProcessingStep[];
    progress?: number;
    filePath?: string;
}

interface StatusJobsProps {
    uploadedFiles?: UploadedFile[];
    onUpdateFile?: (id: string, updates: Partial<UploadedFile>) => void;
    onRemoveFile?: (id: string) => void;
}

export default function StatusJobs({ uploadedFiles = [], onUpdateFile = () => {}, onRemoveFile = () => {} }: StatusJobsProps) {
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
    const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);

    // Ensure uploadedFiles is always an array and handle potential null/undefined values
    const safeUploadedFiles = Array.isArray(uploadedFiles) ? uploadedFiles : [];

    const toggleExpanded = (fileId: string) => {
        setExpandedFiles((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(fileId)) {
                newSet.delete(fileId);
            } else {
                newSet.add(fileId);
            }
            return newSet;
        });
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('audio/')) {
            return <FileAudio className="h-6 w-6 text-blue-500" />;
        } else if (file.type.startsWith('video/')) {
            return <FileVideo className="h-6 w-6 text-purple-500" />;
        }
        return <FileAudio className="h-6 w-6 text-gray-500" />;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'processing':
            case 'pending':
                return <Clock className="h-5 w-5 text-blue-500" />;
            default:
                return <Clock className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'error':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'processing':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'uploading':
                return 'Uploading';
            case 'pending':
                return 'Pending';
            case 'processing':
                return 'Processing';
            case 'completed':
                return 'Completed';
            case 'error':
                return 'Failed';
            default:
                return status;
        }
    };

    const getStepIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'processing':
                return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };

    const exportTranscription = (file: UploadedFile) => {
        if (!file.transcriptionText) return;

        const blob = new Blob([file.transcriptionText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.file.name.split('.')[0]}_transcription.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            // You could add a toast notification here
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    const sortedFiles = [...safeUploadedFiles].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    const completedCount = safeUploadedFiles.filter((f) => f.status === 'completed').length;
    const processingCount = safeUploadedFiles.filter((f) => f.status === 'processing' || f.status === 'pending').length;
    const errorCount = safeUploadedFiles.filter((f) => f.status === 'error').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Status Jobs" />

            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
                <div className="container mx-auto px-4 py-8">
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="text-center">
                            <h1 className="mb-4 text-4xl font-bold text-gray-900">Transcription Status</h1>
                            <p className="mx-auto max-w-2xl text-xl text-gray-600">Monitor your transcription jobs and download completed results</p>
                        </div>

                        {/* Stats Cards */}
                        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-4">
                            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Files</p>
                                        <p className="text-3xl font-bold text-gray-900">{safeUploadedFiles.length}</p>
                                    </div>
                                    <FileAudio className="h-8 w-8 text-purple-500" />
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Completed</p>
                                        <p className="text-3xl font-bold text-green-600">{completedCount}</p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Processing</p>
                                        <p className="text-3xl font-bold text-blue-600">{processingCount}</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-blue-500" />
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Failed</p>
                                        <p className="text-3xl font-bold text-red-600">{errorCount}</p>
                                    </div>
                                    <AlertCircle className="h-8 w-8 text-red-500" />
                                </div>
                            </div>
                        </div>

                        {/* Files List */}
                        {sortedFiles.length > 0 ? (
                            <div className="mx-auto max-w-6xl">
                                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white/80 shadow-xl backdrop-blur-sm">
                                    <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4">
                                        <h3 className="text-xl font-semibold text-gray-900">All Transcription Jobs</h3>
                                    </div>

                                    <div className="divide-y divide-gray-100">
                                        {sortedFiles.map((file) => (
                                            <motion.div
                                                key={file.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="px-6 py-4 transition-colors duration-200 hover:bg-gray-50/50"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-1 items-center space-x-4">
                                                        {getFileIcon(file.file)}

                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="truncate text-lg font-semibold text-gray-900">{file.file.name}</h4>
                                                            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                                                                <span>{formatFileSize(file.file.size)}</span>
                                                                {file.duration && <span>{formatDuration(file.duration)}</span>}
                                                                <span>
                                                                    {file.uploadedAt.toLocaleDateString()} {file.uploadedAt.toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-4">
                                                        {getStatusIcon(file.status)}
                                                        <span
                                                            className={`rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(file.status)}`}
                                                        >
                                                            {getStatusText(file.status)}
                                                        </span>

                                                        {file.status === 'completed' && (
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    onClick={() => setSelectedFile(file)}
                                                                    className="rounded-lg p-2 text-blue-600 transition-colors duration-200 hover:bg-blue-50"
                                                                    title="View transcription"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => exportTranscription(file)}
                                                                    className="rounded-lg p-2 text-green-600 transition-colors duration-200 hover:bg-green-50"
                                                                    title="Download transcription"
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={() => toggleExpanded(file.id)}
                                                            className="rounded-lg p-2 text-gray-400 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-600"
                                                        >
                                                            {expandedFiles.has(file.id) ? (
                                                                <ChevronUp className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4" />
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() => onRemoveFile(file.id)}
                                                            className="rounded-lg p-2 text-gray-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-500"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expanded Details */}
                                                <AnimatePresence>
                                                    {expandedFiles.has(file.id) && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.3 }}
                                                            className="mt-4 border-t border-gray-100 pt-4"
                                                        >
                                                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                                                {/* Processing Steps */}
                                                                <div>
                                                                    <h5 className="mb-3 font-semibold text-gray-900">Processing Progress</h5>
                                                                    <div className="space-y-3">
                                                                        {file.processingSteps && file.processingSteps.length > 0 ? (
                                                                            file.processingSteps.map((step, index) => (
                                                                                <div key={index} className="flex items-center space-x-3">
                                                                                    {getStepIcon(step.status)}
                                                                                    <div className="flex-1">
                                                                                        <p className="text-sm font-medium text-gray-900">
                                                                                            {step.step}
                                                                                        </p>
                                                                                        {step.timestamp && (
                                                                                            <p className="text-xs text-gray-500">
                                                                                                {step.timestamp.toLocaleTimeString()}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <p className="text-sm text-gray-500">No processing steps available</p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* File Details */}
                                                                <div>
                                                                    <h5 className="mb-3 font-semibold text-gray-900">File Details</h5>
                                                                    <div className="space-y-2 text-sm">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-600">File Type:</span>
                                                                            <span className="font-medium">{file.file.type}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-gray-600">Size:</span>
                                                                            <span className="font-medium">{formatFileSize(file.file.size)}</span>
                                                                        </div>
                                                                        {file.duration && (
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600">Duration:</span>
                                                                                <span className="font-medium">{formatDuration(file.duration)}</span>
                                                                            </div>
                                                                        )}
                                                                        {file.transcriptionId && (
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600">Job ID:</span>
                                                                                <span className="font-mono text-xs">{file.transcriptionId}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mx-auto max-w-4xl py-12 text-center">
                                <div className="rounded-2xl border border-gray-100 bg-white/60 p-12 backdrop-blur-sm">
                                    <FileAudio className="mx-auto mb-4 h-24 w-24 text-gray-300" />
                                    <h3 className="mb-2 text-xl font-semibold text-gray-600">No transcription jobs yet</h3>
                                    <p className="text-gray-500">Upload some media files to get started with transcription</p>
                                </div>
                            </div>
                        )}

                        {/* Transcription Preview Modal */}
                        {selectedFile && (
                            <div className="fixed inset-0 z-50 overflow-y-auto">
                                <div className="flex min-h-full items-center justify-center p-4">
                                    <div
                                        className="bg-opacity-75 fixed inset-0 bg-gray-500 backdrop-blur-sm transition-opacity"
                                        onClick={() => setSelectedFile(null)}
                                    />

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="relative max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl"
                                    >
                                        <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-xl font-semibold text-gray-900">Transcription Preview</h3>
                                                    <p className="text-sm text-gray-600">{selectedFile.file.name}</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => copyToClipboard(selectedFile.transcriptionText || '')}
                                                        className="rounded-lg p-2 text-blue-600 transition-colors duration-200 hover:bg-blue-100"
                                                        title="Copy to clipboard"
                                                    >
                                                        <Copy className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => exportTranscription(selectedFile)}
                                                        className="rounded-lg p-2 text-green-600 transition-colors duration-200 hover:bg-green-100"
                                                        title="Download transcription"
                                                    >
                                                        <Download className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedFile(null)}
                                                        className="rounded-lg p-2 text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="max-h-96 overflow-y-auto p-6">
                                            <div className="prose max-w-none">
                                                <p className="leading-relaxed whitespace-pre-wrap text-gray-800">
                                                    {selectedFile.transcriptionText || 'No transcription text available'}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
