import { useUploadedFiles } from '@/contexts/UploadedFilesContext';
import { useAudioProcessing } from '@/hooks/useAudioProcessing';
import AppLayout from '@/layouts/app-layout';
import { formatDuration, formatFileSize } from '@/lib/fileUtils';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    AlertCircle,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    Copy,
    Cpu,
    Download,
    Eye,
    FileAudio,
    FileText,
    FileVideo,
    Shield,
    Trash2,
    Volume2,
    Waves,
} from 'lucide-react';
import { FC, SVGProps, useEffect, useState } from 'react';

interface SelectedFile {
    id: string;
    file: File;
    transcriptionText?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Status Jobs',
        href: '/customer/status_jobs',
    },
];

export default function StatusJobs() {
    const { uploadedFiles, removeFile } = useUploadedFiles();
    const { getJobByFileId, startPolling, stopPolling, getQueueStatus } = useAudioProcessing();
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
    const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

    const page = usePage<SharedData>();
    const { auth } = page.props;
    const user = auth?.user || { name: 'User' };

    // Start polling when component mounts
    useEffect(() => {
        startPolling();
        return () => stopPolling();
    }, [startPolling, stopPolling]);

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
                return <Activity className="h-5 w-5 animate-pulse text-blue-500" />;
            case 'pending':
                return <Clock className="h-5 w-5 text-yellow-500" />;
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
                return 'Queued';
            case 'processing':
                return 'AI Processing';
            case 'completed':
                return 'Completed';
            case 'error':
                return 'Failed';
            default:
                return status;
        }
    };

    const getProcessingStepIcon = (stepName: string, status: string) => {
        const icons: Record<string, FC<SVGProps<SVGSVGElement>>> = {
            'Media Identification': Cpu,
            'Audio Separation': Waves,
            'Audio Cleanup': Volume2,
            'Vocal Enhancement': Volume2,
            'Speech Transcription': FileText,
            'Quality Validation': Shield,
        };
        const IconComponent = icons[stepName] || Clock;

        if (status === 'processing') {
            return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />;
        }

        return (
            <IconComponent
                className={`h-4 w-4 ${
                    status === 'completed'
                        ? 'text-green-500'
                        : status === 'error'
                          ? 'text-red-500'
                          : status === 'processing'
                            ? 'text-blue-500'
                            : 'text-gray-400'
                }`}
            />
        );
    };

    const getStepStatusText = (status: string, progress: number) => {
        if (status === 'completed') {
            return 'Completed';
        } else if (status === 'processing') {
            return `Processing... ${progress}%`;
        } else if (status === 'error') {
            return 'Failed';
        } else {
            return progress > 0 ? `${progress}%` : 'Pending...';
        }
    };

    const exportTranscription = (file: SelectedFile) => {
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

    const sortedFiles = [...uploadedFiles].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    const completedCount = uploadedFiles.filter((f) => f.status === 'completed').length;
    const processingCount = uploadedFiles.filter((f) => f.status === 'processing' || f.status === 'pending').length;
    const errorCount = uploadedFiles.filter((f) => f.status === 'error').length;

    const queueStatus = getQueueStatus();

    console.log('USER:', user);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Status Jobs" />

            <div className="max-w-8xl min-h-screen">
                <div className="container mx-auto px-4 py-8">
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="mt-2 text-center">
                            <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Processing Status</h1>
                            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-white">
                                Monitor your AI-powered audio processing jobs and download enhanced results
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-4">
                            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg backdrop-blur-sm dark:shadow-[0_4px_20px_rgba(255,255,255,1.0)] dark:backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Files</p>
                                        <p className="text-3xl font-bold text-gray-900">{uploadedFiles.length}</p>
                                    </div>
                                    <FileAudio className="h-8 w-8 text-purple-500" />
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg backdrop-blur-sm dark:shadow-[0_4px_20px_rgba(255,255,255,1.0)] dark:backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Completed</p>
                                        <p className="text-3xl font-bold text-green-600">{completedCount}</p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg backdrop-blur-sm dark:shadow-[0_4px_20px_rgba(255,255,255,1.0)] dark:backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Processing</p>
                                        <p className="text-3xl font-bold text-blue-600">{processingCount}</p>
                                    </div>
                                    <Activity className="h-8 w-8 text-blue-500" />
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg backdrop-blur-sm dark:shadow-[0_4px_20px_rgba(255,255,255,1.0)] dark:backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Failed</p>
                                        <p className="text-3xl font-bold text-red-600">{errorCount}</p>
                                    </div>
                                    <AlertCircle className="h-8 w-8 text-red-500" />
                                </div>
                            </div>
                        </div>

                        {/* Processing Queue Status */}
                        {queueStatus.totalJobs > 0 && (
                            <div className="mx-auto max-w-6xl">
                                <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                                                <Activity className={`h-8 w-8 text-purple-600 ${queueStatus.isProcessing ? 'animate-pulse' : ''}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-purple-900">AI Processing Engine</h3>
                                                <p className="text-sm text-purple-700">
                                                    {queueStatus.isProcessing
                                                        ? 'Local AI services actively processing...'
                                                        : 'Processing engine ready'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="space-y-1 text-sm text-purple-700">
                                                <p>
                                                    <strong>Queue:</strong> {queueStatus.queueLength} files
                                                </p>
                                                <p>
                                                    <strong>Completed:</strong> {queueStatus.completedJobs} jobs
                                                </p>
                                                <p>
                                                    <strong>Failed:</strong> {queueStatus.failedJobs} jobs
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Files List */}
                        {sortedFiles.length > 0 ? (
                            <div className="mx-auto max-w-6xl">
                                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl backdrop-blur-sm dark:bg-white dark:shadow-[0_4px_20px_rgba(255,255,255,1.0)] dark:backdrop-blur-sm">
                                    <div className="-mx-6 -mt-6 mb-6 rounded-t-2xl border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4">
                                        <h3 className="text-xl font-semibold text-gray-900">Jobs</h3>
                                    </div>

                                    <div className="divide-y divide-gray-100">
                                        {sortedFiles.map((file) => {
                                            const job = getJobByFileId(file.id);
                                            return (
                                                <motion.div
                                                    key={file.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="-mx-6 px-6 py-4 transition-colors duration-200 hover:bg-gray-50/50"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-1 items-center space-x-4">
                                                            {getFileIcon(file.file)}

                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="text-md truncate font-semibold text-gray-900">{file.file.name}</h4>
                                                                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                                                                    <span>{formatFileSize(file.file.size)}</span>
                                                                    {file.duration && <span>{formatDuration(file.duration)}</span>}
                                                                    <span>
                                                                        {file.uploadedAt.toLocaleDateString()}{' '}
                                                                        {new Date(file.uploadedAt).toLocaleTimeString('en-US', {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                            hour12: true,
                                                                        })}
                                                                    </span>

                                                                    {job && (
                                                                        <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                                                                            Job: {job.id}
                                                                        </span>
                                                                    )}
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
s
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

                                                            {user.role_id === 4 && (
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
                                                            )}

                                                            {user.role_id === 4 && (
                                                                <button
                                                                    onClick={() => removeFile(file.id)}
                                                                    className="rounded-lg p-2 text-gray-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-500"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Job Progress */}
                                                    {job && job.status === 'processing' && (
                                                        <div className="mt-4 space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="font-medium text-blue-600">{job.currentStep}</span>
                                                                <span className="text-gray-500">{job.progress}%</span>
                                                            </div>
                                                            <div className="h-2 w-full rounded-full bg-gray-200">
                                                                <motion.div
                                                                    className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${job.progress}%` }}
                                                                    transition={{ duration: 0.3 }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

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
                                                                    {/* AI Processing Steps */}
                                                                    <div>
                                                                        <h5 className="mb-3 font-semibold text-gray-900">AI Processing Pipeline</h5>
                                                                        <div className="space-y-3">
                                                                            {job
                                                                                ? Object.entries(job.steps).map(([stepName, stepData], index) => (
                                                                                      <div key={index} className="flex items-center space-x-3">
                                                                                          {getProcessingStepIcon(stepName, stepData.status)}
                                                                                          <div className="flex-1">
                                                                                              <p className="text-sm font-medium text-gray-900">
                                                                                                  {stepName
                                                                                                      .replace(/([A-Z])/g, ' $1')
                                                                                                      .replace(/^./, (str) => str.toUpperCase())}
                                                                                              </p>
                                                                                              <div className="flex items-center space-x-2">
                                                                                                  <p className="text-xs text-gray-500">
                                                                                                      {getStepStatusText(
                                                                                                          stepData.status,
                                                                                                          stepData.progress,
                                                                                                      )}
                                                                                                  </p>
                                                                                              </div>
                                                                                          </div>
                                                                                      </div>
                                                                                  ))
                                                                                : file.processingSteps?.map((step, index) => (
                                                                                      <div key={index} className="flex items-center space-x-3">
                                                                                          {getProcessingStepIcon(step.step, step.status)}
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
                                                                                  ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* File Details */}
                                                                    <div>
                                                                        <h5 className="mb-3 font-semibold text-gray-900">Processing Details</h5>
                                                                        <div className="space-y-2 text-sm dark:text-black">
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
                                                                                    <span className="font-medium">
                                                                                        {formatDuration(file.duration)}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            {job && (
                                                                                <>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-gray-600">Job ID:</span>
                                                                                        <span className="font-mono text-xs">{job.id}</span>
                                                                                    </div>
                                                                                    {job.startedAt && (
                                                                                        <div className="flex justify-between">
                                                                                            <span className="text-gray-600">Start Time:</span>
                                                                                            <span className="font-medium">
                                                                                                {new Date(job.startedAt).toLocaleTimeString('en-US', {
                                                                                                    hour: '2-digit',
                                                                                                    minute: '2-digit',
                                                                                                    second: '2-digit',
                                                                                                    hour12: true,
                                                                                                })}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                    {job.completedAt && (
                                                                                        <div className="flex justify-between">
                                                                                            <span className="text-gray-600">Complete Time:</span>
                                                                                            <span className="font-medium">
                                                                                                {new Date(job.completedAt).toLocaleTimeString(
                                                                                                    'en-US',
                                                                                                    {
                                                                                                        hour: '2-digit',
                                                                                                        minute: '2-digit',
                                                                                                        second: '2-digit',
                                                                                                        hour12: true,
                                                                                                    },
                                                                                                )}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mx-auto max-w-4xl py-12 text-center">
                                <div className="rounded-2xl border border-gray-100 bg-white p-12 shadow-2xl backdrop-blur-sm dark:bg-white dark:shadow-[0_4px_20px_rgba(255,255,255,1.0)] dark:backdrop-blur-sm">
                                    <Activity className="mx-auto mb-4 h-24 w-24 text-gray-400 dark:text-black" />
                                    <h3 className="text-black-600 mb-2 text-xl font-semibold dark:text-black">No processing jobs yet</h3>
                                    <p className="text-gray-500 dark:text-black">Upload some media files to start AI-powered processing</p>
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
                                                    <h3 className="text-xl font-semibold text-gray-900">AI-Enhanced Transcription</h3>
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
