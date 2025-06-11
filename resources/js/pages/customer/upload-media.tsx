import Modal from '@/components/ui/modal';
import AppLayout from '@/layouts/app-layout';
import { formatDuration, formatFileSize, getFileDuration } from '@/lib/fileUtils'; //Local process
// import { formatFileSize, formatDuration, getFileDuration, generateUniqueFileName } from '@/lib/fileUtils'; //Prod process
import type { UploadedFile } from '@/pages/customer/app-upload-media';
import { uploadFileLocally } from '@/services/uploadService';
import type { BreadcrumbItem } from '@/types';
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

interface UploadMediaProps {
    uploadedFiles: UploadedFile[];
    onAddFiles: (files: UploadedFile[]) => void;
    onUpdateFile: (id: string, updates: Partial<UploadedFile>) => void;
    onRemoveFile: (id: string) => void;
}

interface ModalState {
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
}

export default function UploadMedia({ uploadedFiles, onAddFiles, onUpdateFile, onRemoveFile }: UploadMediaProps) {
    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
    });

    const showModal = (type: 'success' | 'error', title: string, message: string) => {
        setModal({ isOpen: true, type, title, message });
    };

    const closeModal = () => {
        setModal((prev) => ({ ...prev, isOpen: false }));
    };

    const processFileUpload = useCallback(
        async (uploadFile: UploadedFile) => {
            try {
                // Get file duration
                let duration: number | undefined;
                try {
                    duration = await getFileDuration(uploadFile.file);
                    onUpdateFile(uploadFile.id, { duration });
                } catch (error) {
                    console.warn('Could not get file duration:', error);
                }

                // Upload file
                const uploadResult = await uploadFileLocally(uploadFile.file, (progress) => {
                    onUpdateFile(uploadFile.id, { progress: progress.percentage });
                });

                // Update file status based on upload result
                if (uploadResult.success) {
                    const processingSteps = [
                        { step: 'File uploaded', status: 'completed' as const, timestamp: new Date() },
                        { step: 'Audio extraction', status: 'pending' as const },
                        { step: 'Speech recognition', status: 'pending' as const },
                        { step: 'Text processing', status: 'pending' as const },
                        { step: 'Quality review', status: 'pending' as const },
                    ];

                    onUpdateFile(uploadFile.id, {
                        status: 'pending',
                        transcriptionId: uploadResult.fileId,
                        filePath: uploadResult.filePath,
                        processingSteps,
                    });

                    showModal(
                        'success',
                        'Upload Successful!',
                        `${uploadFile.file.name} has been uploaded successfully. Your file will be transcribed by our AI transcriptor. Please wait and be patient. We will let you know once it's done.`,
                    );

                    // Simulate transcription process
                    setTimeout(() => {
                        onUpdateFile(uploadFile.id, {
                            status: 'processing',
                            processingSteps: processingSteps.map((step, index) =>
                                index === 1 ? { ...step, status: 'processing', timestamp: new Date() } : step,
                            ),
                        });
                    }, 2000);

                    setTimeout(() => {
                        const completedSteps = processingSteps.map((step) => ({
                            ...step,
                            status: 'completed' as const,
                            timestamp: new Date(),
                        }));

                        onUpdateFile(uploadFile.id, {
                            status: 'completed',
                            processingSteps: completedSteps,
                            transcriptionText: `This is a sample transcription for ${uploadFile.file.name}. In a real application, this would contain the actual transcribed text from your audio/video file. The transcription would be generated using advanced AI speech recognition technology.`,
                        });
                    }, 8000);
                } else {
                    onUpdateFile(uploadFile.id, { status: 'error' });
                    showModal('error', 'Upload Failed', uploadResult.error || `Failed to upload ${uploadFile.file.name}. Please try again.`);
                }
            } catch (error) {
                console.error('Upload process error:', error);
                onUpdateFile(uploadFile.id, { status: 'error' });
                showModal('error', 'Upload Error', `An unexpected error occurred while uploading ${uploadFile.file.name}.`);
            }
        },
        [onUpdateFile],
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

            onAddFiles(newFiles);
            newFiles.forEach(processFileUpload);
        },
        [onAddFiles, processFileUpload],
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
    });

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
                return <Clock className="h-5 w-5 text-blue-500" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'error':
                return 'bg-red-100 text-red-800';
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
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

    // Ensure uploadedFiles is always an array
    const safeUploadedFiles = uploadedFiles || [];

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
                <div className="mx-auto mt-3 max-w-4xl">
                    <div
                        {...getRootProps()}
                        className={`transform cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 hover:scale-[1.02] ${
                            isDragActive
                                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg'
                                : 'hover:from-purple-25 hover:to-blue-25 border-gray-300 hover:border-purple-400 hover:bg-gradient-to-br hover:shadow-lg'
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
                                <p className="mb-6 text-gray-500 dark:text-white">Supports MP3, WAV, FLAC, MP4, MOV, AVI files up to 500MB</p>
                                <button className="transform rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl">
                                    Browse Files
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Uploaded Files */}
                {safeUploadedFiles.length > 0 && (
                    <div className="mx-auto max-w-4xl">
                        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                            <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4">
                                <h3 className="flex items-center space-x-2 text-xl font-semibold text-gray-900">
                                    <FileAudio className="h-6 w-6 text-purple-600" />
                                    <span>Recent Uploads ({safeUploadedFiles.length})</span>
                                </h3>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {safeUploadedFiles
                                    .slice(-5)
                                    .reverse()
                                    .map((uploadedFile) => (
                                        <motion.div
                                            key={uploadedFile.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="px-6 py-4 transition-colors duration-200 hover:bg-gray-50"
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    {getFileIcon(uploadedFile.file)}
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900">{uploadedFile.file.name}</h4>
                                                        <p className="text-xs text-gray-500">
                                                            {formatFileSize(uploadedFile.file.size)}
                                                            {uploadedFile.duration && ` • ${formatDuration(uploadedFile.duration)}`}
                                                            {' • ' + uploadedFile.uploadedAt.toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    {getStatusIcon(uploadedFile.status)}
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(uploadedFile.status)}`}
                                                    >
                                                        {getStatusText(uploadedFile.status)}
                                                    </span>
                                                    <button
                                                        onClick={() => onRemoveFile(uploadedFile.id)}
                                                        className="text-gray-400 transition-colors duration-200 hover:text-red-500"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            {uploadedFile.status === 'uploading' && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium text-purple-600">Uploading...</span>
                                                        <span className="text-gray-500">{uploadedFile.progress}%</span>
                                                    </div>
                                                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                                                        <motion.div
                                                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${uploadedFile.progress}%` }}
                                                            transition={{ duration: 0.3 }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {uploadedFile.status === 'pending' && (
                                                <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                                    <p className="flex items-center space-x-2 text-sm font-medium text-blue-700">
                                                        <Clock className="h-4 w-4" />
                                                        <span>
                                                            Your uploaded file will be transcribed by transcriptor. Please wait and be patient. We
                                                            will let you know once it's done.
                                                        </span>
                                                    </p>
                                                </div>
                                            )}

                                            {uploadedFile.status === 'processing' && (
                                                <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                                                    <p className="flex items-center space-x-2 text-sm font-medium text-yellow-700">
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent"></div>
                                                        <span>Processing your file for transcription...</span>
                                                    </p>
                                                </div>
                                            )}

                                            {uploadedFile.status === 'completed' && (
                                                <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                                                    <p className="text-sm font-medium text-green-700">
                                                        ✅ Transcription completed successfully! View details in Status Jobs.
                                                    </p>
                                                </div>
                                            )}

                                            {uploadedFile.status === 'error' && (
                                                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                                                    <p className="text-sm font-medium text-red-700">❌ Upload failed - Please try again</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                <Modal isOpen={modal.isOpen} onClose={closeModal} type={modal.type} title={modal.title} message={modal.message} />
            </div>
        </AppLayout>
    );
}
