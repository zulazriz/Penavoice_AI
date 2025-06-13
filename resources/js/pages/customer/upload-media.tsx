import Modal from '@/components/ui/modal';
import AppLayout from '@/layouts/app-layout';
// import { formatFileSize, formatDuration, getFileDuration, generateUniqueFileName } from '@/lib/fileUtils'; //Prod process
import { useNotifications } from '@/contexts/NotificationContext';
import { useModal } from '@/hooks/use-modal';
import type { BreadcrumbItem, UploadedFile } from '@/types';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, FileAudio, FileVideo, Upload as UploadIcon, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Upload Media',
        href: '/customer/upload_media',
    },
];

export default function UploadMedia() {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const { modal, hideModal, showSuccess, showError } = useModal();
    const { addNotification } = useNotifications();

    const processFileUpload = useCallback(
        async (uploadFile: UploadedFile) => {
            try {
                // Simulate upload progress
                const interval = setInterval(() => {
                    setUploadedFiles((prev) =>
                        prev.map((file) => {
                            if (file.id === uploadFile.id && file.status === 'uploading') {
                                const newProgress = Math.min(file.progress + Math.random() * 15 + 5, 100);

                                if (newProgress >= 100) {
                                    clearInterval(interval);

                                    // Simulate success/failure (95% success rate)
                                    const isSuccess = Math.random() > 0.05;

                                    if (isSuccess) {
                                        // Add notification for successful upload
                                        addNotification({
                                            title: 'Upload Successful',
                                            message: `${uploadFile.file.name} has been uploaded and queued for transcription.`,
                                            type: 'success',
                                        });

                                        showSuccess(
                                            'Upload Successful!',
                                            `${uploadFile.file.name} has been uploaded successfully. Your file will be transcribed by our transcriptor. Please wait and be patient. We will let you know once it's done.`,
                                        );

                                        // Simulate transcription process after successful upload
                                        setTimeout(() => {
                                            addNotification({
                                                title: 'Transcription Started',
                                                message: `Transcription for ${uploadFile.file.name} has started. This may take a few minutes.`,
                                                type: 'info',
                                            });

                                            setUploadedFiles((prev) =>
                                                prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'processing' } : f)),
                                            );

                                            // Simulate transcription completion
                                            setTimeout(
                                                () => {
                                                    addNotification({
                                                        title: 'Transcription Complete',
                                                        message: `${uploadFile.file.name} has been successfully transcribed and is ready for review.`,
                                                        type: 'success',
                                                    });

                                                    setUploadedFiles((prev) =>
                                                        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'completed' } : f)),
                                                    );
                                                },
                                                Math.random() * 5000 + 3000,
                                            ); // 3-8 seconds
                                        }, 2000); // 2 seconds delay

                                        return {
                                            ...file,
                                            progress: 100,
                                            status: 'pending' as const,
                                            transcriptionId: Math.random().toString(36).substr(2, 9),
                                        };
                                    } else {
                                        // Add notification for failed upload
                                        addNotification({
                                            title: 'Upload Failed',
                                            message: `Failed to upload ${uploadFile.file.name}. Please try again.`,
                                            type: 'error',
                                        });

                                        showError('Upload Failed', `Failed to upload ${uploadFile.file.name}. Please try again.`);
                                        return { ...file, progress: 100, status: 'error' as const };
                                    }
                                }

                                return { ...file, progress: newProgress };
                            }
                            return file;
                        }),
                    );
                }, 200);
            } catch (error) {
                console.error('Upload process error:', error);
                setUploadedFiles((prev) => prev.map((file) => (file.id === uploadFile.id ? { ...file, status: 'error' } : file)));

                addNotification({
                    title: 'Upload Error',
                    message: `An unexpected error occurred while uploading ${uploadFile.file.name}.`,
                    type: 'error',
                });

                showError('Upload Error', `An unexpected error occurred while uploading ${uploadFile.file.name}.`);
            }
        },
        [showSuccess, showError, addNotification],
    );

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                progress: 0,
                status: 'uploading',
                uploadedAt: new Date(),
            }));

            setUploadedFiles((prev) => [...prev, ...newFiles]);

            // Add notification for starting upload
            if (newFiles.length > 0) {
                addNotification({
                    title: 'Upload Started',
                    message: `Started uploading ${newFiles.length} file${newFiles.length > 1 ? 's' : ''}`,
                    type: 'info',
                });
            }

            newFiles.forEach(processFileUpload);
        },
        [processFileUpload, addNotification],
    );

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
        maxSize: 500 * 1024 * 1024, // 500MB
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
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
            case 'error':
                return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
            case 'processing':
                return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400';
            case 'pending':
                return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
            default:
                return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400';
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

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Upload Media" />

            <div className="max-w-8xl mx-auto">
                {/* Header */}
                <div className="mt-10 mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Upload Your Media Files</h1>
                    <p className="max-w-2l text-l mx-auto text-gray-600 dark:text-white">
                        Transform your audio and video files into accurate transcriptions with our AI-powered service
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
                                    <p>• 1 minute of audio/video = 50 Credits</p>
                                    <p>• Credits are only deducted after successful transcription</p>
                                    <p>• Failed uploads do not consume credits</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Area */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-5 mb-8"
                >
                    <div
                        {...getRootProps()}
                        className={`transform cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 hover:scale-[1.02] ${
                            isDragActive
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
                                <button className="transform rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl">
                                    Browse Files
                                </button>
                            </div>
                        </div>
                    </div>
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
                                <span>Recent Uploads ({uploadedFiles.length})</span>
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
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatFileSize(uploadedFile.file.size)} • {uploadedFile.uploadedAt.toLocaleTimeString()}
                                                    </p>
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

                                        {/* Status Messages */}
                                        {uploadedFile.status === 'pending' && (
                                            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                                                <p className="flex items-center space-x-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                                                    <Clock className="h-4 w-4" />
                                                    <span>
                                                        Your uploaded file will be transcribed by transcriptor. Please wait and be patient. We will
                                                        let you know once it's done.
                                                    </span>
                                                </p>
                                            </div>
                                        )}

                                        {uploadedFile.status === 'processing' && (
                                            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                                                <p className="flex items-center space-x-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                                                    <Clock className="h-4 w-4 animate-spin" />
                                                    <span>Transcription in progress... This may take a few minutes.</span>
                                                </p>
                                            </div>
                                        )}

                                        {uploadedFile.status === 'completed' && (
                                            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                                                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                                    ✅ Transcription completed successfully! View details in Status Jobs.
                                                </p>
                                            </div>
                                        )}

                                        {uploadedFile.status === 'error' && (
                                            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                                                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                                    ❌ Upload failed - Please try again
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                        </div>
                    </motion.div>
                )}

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
