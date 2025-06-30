import ConfirmationModal from '@/components/ui/confirmation-modal';
import Modal from '@/components/ui/modal';
import { useCredits } from '@/contexts/CreditContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useUploadedFiles } from '@/contexts/UploadedFilesContext';
import { useModal } from '@/hooks/use-modal';
import { useAudioProcessing } from '@/hooks/useAudioProcessing';
import AppLayout from '@/layouts/app-layout';
import { calculateTotalCreditsRequired, formatDuration, formatFileSize, getMediaFileMetadata, type MediaFileMetadata } from '@/lib/fileUtils';
import type { BreadcrumbItem, UploadedFile } from '@/types';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, Cpu, FileAudio, FileText, FileVideo, Shield, Upload as UploadIcon, Volume2, Waves, X } from 'lucide-react';
import { FC, SVGProps, useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Upload Media',
        href: '/customer/upload_media',
    },
];

interface PendingFile {
    id: string;
    file: File;
    metadata?: MediaFileMetadata;
    status: 'analyzing' | 'ready' | 'error';
}

export default function UploadMedia() {
    const { uploadedFiles, addFiles, updateFile, removeFile } = useUploadedFiles();
    const { modal, hideModal, showSuccess, showError } = useModal();
    const { addNotification } = useNotifications();
    const { credits } = useCredits();
    const { startProcessing, startPolling, stopPolling } = useAudioProcessing();

    // State for pending files and confirmation modal
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [processingFiles, setProcessingFiles] = useState<MediaFileMetadata[]>([]);

    // Start polling when component mounts
    useEffect(() => {
        startPolling();
        return () => stopPolling();
    }, [startPolling, stopPolling]);

    /**
     * Analyze uploaded files to extract accurate metadata (duration, file size, etc.)
     * This determines the base information needed for credit calculation
     */
    const analyzeFiles = useCallback(async (files: File[]) => {
        const pendingFilesData: PendingFile[] = files.map((file) => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            status: 'analyzing' as const,
        }));

        setPendingFiles(pendingFilesData);

        // Analyze each file to get accurate metadata (duration, size, type)
        const analysisPromises = pendingFilesData.map(async (pendingFile) => {
            try {
                const metadata = await getMediaFileMetadata(pendingFile.file);

                setPendingFiles((prev) => prev.map((pf) => (pf.id === pendingFile.id ? { ...pf, metadata, status: 'ready' } : pf)));

                return { pendingFile, metadata };
            } catch (error) {
                console.error(`Error analyzing ${pendingFile.file.name}:`, error);

                setPendingFiles((prev) => prev.map((pf) => (pf.id === pendingFile.id ? { ...pf, status: 'error' } : pf)));

                return null;
            }
        });

        // Wait for all analyses to complete
        const results = await Promise.all(analysisPromises);
        const successfulResults = results.filter((result) => result !== null) as Array<{ pendingFile: PendingFile; metadata: MediaFileMetadata }>;

        if (successfulResults.length > 0) {
            const filesMetadata = successfulResults.map((r) => r.metadata);
            setProcessingFiles(filesMetadata);
            setShowConfirmation(true);
        }
    }, []);

    // Handle file drop from drag-and-drop or file picker
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return;

            // Clear any previous pending files
            setPendingFiles([]);

            // Start analyzing files to get accurate duration and metadata
            analyzeFiles(acceptedFiles);
        },
        [analyzeFiles],
    );

    /**
     * Handle confirmation modal confirmation
     * This is where the accurate credit calculation with processing duration pricing happens
     */
    const handleConfirmProcessing = useCallback(
        async (selectedDays: number) => {
            const readyFiles = pendingFiles.filter((pf) => pf.status === 'ready' && pf.metadata);

            if (readyFiles.length === 0) {
                showError('No Files Ready', 'No files are ready for processing.');
                return;
            }

            // Create uploaded files with accurate credit calculations
            const newFiles: UploadedFile[] = readyFiles.map((pendingFile) => {
                // Calculate EXACT credits required based on processing duration and pricing
                const creditsRequired = calculateTotalCreditsRequired(pendingFile.metadata!.duration, selectedDays);

                console.log(`[FILE PROCESSING] ${pendingFile.metadata!.fileName}:`);
                console.log(`  - Exact duration: ${pendingFile.metadata!.duration} seconds`);
                console.log(`  - Minutes (rounded up): ${Math.ceil(pendingFile.metadata!.duration / 60)} minutes`);
                console.log(`  - Processing duration: ${selectedDays} days`);
                console.log(`  - Credits required: ${creditsRequired} credits`);

                return {
                    id: pendingFile.id,
                    file: pendingFile.file,
                    progress: 0,
                    status: 'uploading',
                    uploadedAt: new Date(),
                    duration: pendingFile.metadata!.duration,
                    creditsRequired: creditsRequired, // Store EXACT credits required
                    creditsUsed: 0, // Will be set after processing completes
                    processingDays: selectedDays, // Store processing duration for later use
                    processingSteps: [
                        { step: 'File Upload', status: 'processing', timestamp: new Date() },
                        { step: 'Media Identification', status: 'pending' },
                        { step: 'Audio Separation', status: 'pending' },
                        { step: 'Audio Cleanup', status: 'pending' },
                        { step: 'Vocal Enhancement', status: 'pending' },
                        { step: 'Speech Transcription', status: 'pending' },
                        { step: 'Quality Validation', status: 'pending' },
                    ],
                };
            });

            // Add files to context (this will trigger UI updates)
            addFiles(newFiles);

            // Close confirmation modal and clear temporary state
            setShowConfirmation(false);
            setPendingFiles([]);
            setProcessingFiles([]);

            // Start processing each file
            newFiles.forEach(async (uploadFile) => {
                try {
                    // Simulate file upload progress (visual feedback for user)
                    const uploadInterval = setInterval(() => {
                        updateFile(uploadFile.id, (prev) => {
                            if (prev.status === 'uploading') {
                                const newProgress = Math.min(prev.progress + Math.random() * 15 + 5, 100);

                                if (newProgress >= 100) {
                                    clearInterval(uploadInterval);

                                    // Simulate upload success (95% success rate)
                                    const isUploadSuccess = Math.random() > 0.05;

                                    if (isUploadSuccess) {
                                        // Send success notification for upload completion
                                        // Note: This is separate from processing completion
                                        addNotification({
                                            title: 'Upload Complete',
                                            message: `${uploadFile.file.name} uploaded successfully and queued for processing.`,
                                            type: 'success',
                                        });

                                        // Start backend processing simulation with processing duration
                                        setTimeout(() => {
                                            startProcessing(
                                                uploadFile.id,
                                                uploadFile.file.name,
                                                uploadFile.file.size,
                                                uploadFile.duration!,
                                                uploadFile.processingDays || 21, // Pass processing duration to service
                                            );
                                        }, 1000);

                                        return {
                                            progress: 100,
                                            status: 'pending' as const,
                                        };
                                    } else {
                                        // Upload failed - no credits deducted
                                        return { progress: 100, status: 'error' as const };
                                    }
                                }

                                return { progress: newProgress };
                            }
                            return {};
                        });
                    }, 200);
                } catch (error) {
                    console.error('Upload process error:', error);
                    updateFile(uploadFile.id, { status: 'error' });
                }
            });

            const totalCreditsForAllFiles = newFiles.reduce((sum, file) => sum + (file.creditsRequired || 0), 0);

            showSuccess(
                'Processing Started!',
                `${newFiles.length} file${newFiles.length > 1 ? 's' : ''} uploaded successfully and queued for processing. Processing duration: ${selectedDays} days. Total credits required: ${totalCreditsForAllFiles.toLocaleString()}.`,
            );
        },
        [pendingFiles, addFiles, updateFile, startProcessing, showSuccess, showError, addNotification],
    );

    // Handle confirmation modal close
    const handleCloseConfirmation = useCallback(() => {
        setShowConfirmation(false);
        setPendingFiles([]);
        setProcessingFiles([]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'audio/mp3': ['.mp3'],
            'audio/mpeg': ['.mp3'],
            'audio/wav': ['.wav'],
            'audio/flac': ['.flac'],
            'video/mp4': ['.mp4'],
            'video/mov': ['.mov'],
            'video/avi': ['.avi'],
        },
        maxSize: 500 * 1024 * 1024, // 500MB max file size
        multiple: true,
    });

    const removeFile = (id: string) => {
        setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('audio/')) {
            return <FileAudio className="h-8 w-8 text-blue-500" />;
        } else if (file.type.startsWith('video/')) {
            return <FileVideo className="h-8 w-8 text-purple-500" />;
        }
        return <FileAudio className="h-8 w-8 text-gray-500" />;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'processing':
            case 'pending':
                return <Clock className="h-5 w-5 animate-spin text-blue-500" />;
                return <Clock className="h-5 w-5 animate-spin text-blue-500" />;
            default:
                return null;
        }
    };

    const getProcessingStepIcon = (stepName: string) => {
        const icons: Record<string, FC<SVGProps<SVGSVGElement>>> = {
            'Media Identification': Cpu,
            'Audio Separation': Waves,
            'Audio Cleanup': Volume2,
            'Vocal Enhancement': Volume2,
            'Speech Transcription': FileText,
            'Quality Validation': Shield,
        };
        const IconComponent = icons[stepName] || Clock;
        return <IconComponent className="h-4 w-4" />;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
                return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
            case 'error':
                return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
                return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
            case 'processing':
                return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400';
                return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400';
            case 'pending':
                return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
                return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
            default:
                return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400';
                return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'uploading':
                return 'Uploading';
            case 'pending':
                return 'Queued';
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Upload Media" />

            <div className="max-w-8xl mx-auto">
                {/* Header */}
                <div className="mt-10 mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Upload Your Media Files</h1>
                    <p className="max-w-2l text-l mx-auto text-gray-600 dark:text-white">
                        Transform your audio and video files into accurate transcriptions with our advanced AI-powered service
                    </p>
                </div>

                {/* Credits Info */}
                <div className="mx-auto max-w-4xl">
                    <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                    <AlertCircle className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                            <div>
                                <h3 className="mb-2 text-lg font-semibold text-blue-900">Credits Usage Information</h3>
                                <div className="space-y-1 text-sm text-blue-700">
                                    <p>• Processing duration affects pricing:</p>
                                    <p className="ml-4">- 3 days (express): RM6.20/minute = 62 credits/minute</p>
                                    <p className="ml-4">- 7 days (standard): RM5.30/minute = 53 credits/minute</p>
                                    <p className="ml-4">- 14 days (extended): RM4.40/minute = 44 credits/minute</p>
                                    <p className="ml-4">- 21 days (archive): RM3.50/minute = 35 credits/minute</p>
                                    <p>• Credits are deducted only after successful transcription</p>
                                    <p>• Failed uploads do not consume credits</p>
                                    <p>
                                        • Current balance: <strong>{credits.toLocaleString()} credits</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Files Analysis */}
                {pendingFiles.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 mb-8">
                        <div className="rounded-2xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-6">
                            <h3 className="mb-4 text-xl font-semibold text-yellow-900">Analyzing Files...</h3>
                            <div className="space-y-3">
                                {pendingFiles.map((pendingFile) => (
                                    <div key={pendingFile.id} className="flex items-center space-x-3">
                                        {getFileIcon(pendingFile.file)}
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{pendingFile.file.name}</p>
                                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                <span>{formatFileSize(pendingFile.file.size)}</span>
                                                <span>{pendingFile.file.type}</span>
                                                {pendingFile.metadata && (
                                                    <span>
                                                        {formatDuration(pendingFile.metadata.duration)} • {pendingFile.metadata.creditsRequired}{' '}
                                                        minutes
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {pendingFile.status === 'analyzing' && (
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                            )}
                                            {pendingFile.status === 'ready' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                            {pendingFile.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                                            <span
                                                className={`text-sm font-medium ${
                                                    pendingFile.status === 'ready'
                                                        ? 'text-green-600'
                                                        : pendingFile.status === 'error'
                                                          ? 'text-red-600'
                                                          : 'text-blue-600'
                                                }`}
                                            >
                                                {pendingFile.status === 'analyzing'
                                                    ? 'Analyzing...'
                                                    : pendingFile.status === 'ready'
                                                      ? 'Ready'
                                                      : 'Error'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Upload Area */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-8 mb-8"
                >
                    <div
                        {...getRootProps()}
                        className={`transform cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 hover:scale-[1.02] ${
                            isDragActive
                                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg dark:from-purple-900/20 dark:to-blue-900/20'
                                : 'hover:from-purple-25 hover:to-blue-25 border-gray-300 hover:border-purple-400 hover:bg-gradient-to-br hover:shadow-lg dark:border-gray-600 dark:hover:from-purple-900/10 dark:hover:to-blue-900/10'
                                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg dark:from-purple-900/20 dark:to-blue-900/20'
                                : 'hover:from-purple-25 hover:to-blue-25 border-gray-300 hover:border-purple-400 hover:bg-gradient-to-br hover:shadow-lg dark:border-gray-600 dark:hover:from-purple-900/10 dark:hover:to-blue-900/10'
                        }`}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center space-y-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                                <UploadIcon className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <h3 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
                                    {isDragActive ? 'Drop files here' : 'Choose files or drag them here'}
                                </h3>
                                <p className="mb-6 text-gray-500 dark:text-gray-400">Supports MP3, WAV, FLAC, MP4, MOV, AVI files up to 500MB each</p>
                                <button className="transform cursor-pointer rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl">
                                    Browse Files
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
                </motion.div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mb-20 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
                    >
                        <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 dark:border-gray-700 dark:from-purple-900/20 dark:to-blue-900/20">
                            <h3 className="flex items-center space-x-2 text-xl font-semibold text-gray-900 dark:text-white">
                                <FileAudio className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                <span>Processing Queue ({uploadedFiles.length})</span>
                            </h3>
                        </div>

                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {uploadedFiles
                                .slice(-10)
                                .reverse()
                                .map((uploadedFile, index) => (
                                    <motion.div
                                        key={uploadedFile.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        className="px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                {getFileIcon(uploadedFile.file)}
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{uploadedFile.file.name}</h4>
                                                    <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                                                        <span>{formatFileSize(uploadedFile.file.size)}</span>
                                                        {uploadedFile.duration && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{formatDuration(uploadedFile.duration)}</span>
                                                            </>
                                                        )}
                                                        <span>•</span>
                                                        <span>
                                                            Uploaded: {uploadedFile.uploadedAt.toLocaleDateString()}{' '}
                                                            {uploadedFile.uploadedAt.toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true,
                                                            })}
                                                        </span>
                                                    </div>

                                                    <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                                                        {uploadedFile.creditsRequired && (
                                                            <div className="flex items-center gap-1">
                                                                <span>•</span>
                                                                <span className="m-0 text-blue-600">
                                                                    Required: {uploadedFile.creditsRequired.toLocaleString()} credits
                                                                </span>
                                                            </div>
                                                        )}
                                                        {typeof uploadedFile.creditsUsed === 'number' && uploadedFile.creditsUsed > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <span>•</span>
                                                                <span className="m-0 text-blue-500">
                                                                    Used: {uploadedFile.creditsUsed.toLocaleString()} credits
                                                                </span>
                                                            </div>
                                                        )}
                                                        {uploadedFile.processingDays && (
                                                            <div className="flex items-center gap-1">
                                                                <span>•</span>
                                                                <span className="m-0 text-green-600">
                                                                    {uploadedFile.processingDays} days processing
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                {getStatusIcon(uploadedFile.status)}
                                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(uploadedFile.status)}`}>
                                                    {getStatusText(uploadedFile.status)}
                                                </span>
                                                <button
                                                    onClick={() => removeFile(uploadedFile.id)}
                                                    className="text-gray-400 transition-colors hover:text-red-500 dark:hover:text-red-400"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {uploadedFile.status === 'uploading' && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium text-purple-600 dark:text-purple-400">Uploading...</span>
                                                    <span className="text-gray-500 dark:text-gray-400">{Math.round(uploadedFile.progress)}%</span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <motion.div
                                                        className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${uploadedFile.progress}%` }}
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {/* Progress Bar */}
                                        {uploadedFile.status === 'uploading' && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium text-purple-600 dark:text-purple-400">Uploading...</span>
                                                    <span className="text-gray-500 dark:text-gray-400">{Math.round(uploadedFile.progress)}%</span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <motion.div
                                                        className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${uploadedFile.progress}%` }}
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Processing Steps */}
                                        {(uploadedFile.status === 'processing' || uploadedFile.status === 'completed') &&
                                            uploadedFile.processingSteps && (
                                                <div className="mt-4 space-y-2">
                                                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Processing Pipeline:</h5>
                                                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                                                        {uploadedFile.processingSteps.slice(1).map((step, stepIndex) => (
                                                            <div key={stepIndex} className="flex items-center space-x-2 text-xs">
                                                                <div
                                                                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                                                        step.status === 'completed'
                                                                            ? 'bg-green-100 text-green-600'
                                                                            : step.status === 'processing'
                                                                              ? 'bg-blue-100 text-blue-600'
                                                                              : step.status === 'error'
                                                                                ? 'bg-red-100 text-red-600'
                                                                                : 'bg-gray-100 text-gray-400'
                                                                    }`}
                                                                >
                                                                    {step.status === 'processing' ? (
                                                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                                                    ) : (
                                                                        getProcessingStepIcon(step.step)
                                                                    )}
                                                                </div>
                                                                <span
                                                                    className={`${
                                                                        step.status === 'completed'
                                                                            ? 'text-green-600'
                                                                            : step.status === 'processing'
                                                                              ? 'text-blue-600'
                                                                              : step.status === 'error'
                                                                                ? 'text-red-600'
                                                                                : 'text-gray-500'
                                                                    }`}
                                                                >
                                                                    {step.step}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        {/* Status Messages */}
                                        {uploadedFile.status === 'pending' && (
                                            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                                                <p className="flex items-center space-x-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                                                    <Clock className="h-4 w-4" />
                                                    <span>Queued for AI processing. Your file will be processed using advanced AI services.</span>
                                                </p>
                                            </div>
                                        )}

                                        {uploadedFile.status === 'processing' && (
                                            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                                                <p className="flex items-center space-x-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                                                    <Cpu className="h-4 w-4 animate-pulse" />
                                                    <span>AI processing in progress... Audio enhancement and transcription underway.</span>
                                                </p>
                                            </div>
                                        )}

                                        {uploadedFile.status === 'completed' && (
                                            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                                                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                                    ✅ AI processing completed successfully! Enhanced audio and transcription ready for review.
                                                </p>
                                            </div>
                                        )}

                                        {uploadedFile.status === 'error' && (
                                            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                                                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                                    ❌ Processing failed - Please try uploading again. No credits were deducted.
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                        </div>
                    </motion.div>
                )}

                {/* Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showConfirmation}
                    onClose={handleCloseConfirmation}
                    onConfirm={handleConfirmProcessing}
                    filesMetadata={processingFiles}
                    userCredits={credits}
                />

                {/* Modal */}
                <Modal
                    isOpen={modal.isOpen}
                    onClose={hideModal}
                    type={modal.type}
                    title={modal.title}
                    message={modal.message}
                    confirmText={modal.confirmText}
                    cancelText={modal.cancelText}
                    onConfirm={modal.onConfirm}
                    showCancel={modal.showCancel}
                />
            </div>
        </AppLayout>
    );
}
