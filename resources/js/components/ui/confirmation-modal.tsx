import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Calendar, CheckCircle, Clock, FileAudio, FileVideo, Info, X, Zap } from 'lucide-react';
import { useState } from 'react';
import type { MediaFileMetadata } from '@/lib/fileUtils';
import { formatDuration, formatFileSize, calculateTotalCreditsRequired } from '@/lib/fileUtils';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedDays: number) => void;
    filesMetadata: MediaFileMetadata[];
    userCredits: number;
}

/**
 * Processing duration options with accurate pricing
 * Based on RM pricing converted to credits (RM 1 = 10 credits & RM 0.10 = 1 credits)
 */
const JOB_DURATION_OPTIONS = [
    { 
        days: 3, 
        label: '3 days', 
        description: 'Express processing', 
        pricePerMinute: 'RM6.20',
        creditsPerMinute: 62,
        badgeColor: 'bg-red-100 text-red-800', 
        icon: Zap 
    },
    { 
        days: 7, 
        label: '7 days', 
        description: 'Standard processing', 
        pricePerMinute: 'RM5.30',
        creditsPerMinute: 53,
        badgeColor: 'bg-blue-100 text-blue-800', 
        icon: Clock 
    },
    { 
        days: 14, 
        label: '14 days', 
        description: 'Extended processing', 
        pricePerMinute: 'RM4.40',
        creditsPerMinute: 44,
        badgeColor: 'bg-yellow-100 text-yellow-800', 
        icon: Calendar 
    },
    { 
        days: 21, 
        label: '21 days', 
        description: 'Archive processing', 
        pricePerMinute: 'RM3.50',
        creditsPerMinute: 35,
        badgeColor: 'bg-green-100 text-green-800', 
        icon: Calendar 
    },
];

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    filesMetadata,
    userCredits,
}: ConfirmationModalProps) {
    // Default to 21 days (cheapest option)
    const [selectedDays, setSelectedDays] = useState(21);
    const [isProcessing, setIsProcessing] = useState(false);

    // Calculate total credits required for selected processing duration
    const totalCreditsRequired = filesMetadata.reduce((total, metadata) => {
        return total + calculateTotalCreditsRequired(metadata.duration, selectedDays);
    }, 0);
    
    // Check if user has sufficient credits
    const hasInsufficientCredits = totalCreditsRequired > userCredits;
    const creditsShortfall = hasInsufficientCredits ? totalCreditsRequired - userCredits : 0;

    const handleConfirm = async () => {
        if (hasInsufficientCredits) return;
        
        setIsProcessing(true);
        try {
            await onConfirm(selectedDays);
        } finally {
            setIsProcessing(false);
        }
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('audio/')) {
            return <FileAudio className="h-5 w-5 text-blue-500" />;
        } else if (fileType.startsWith('video/')) {
            return <FileVideo className="h-5 w-5 text-purple-500" />;
        }
        return <FileAudio className="h-5 w-5 text-gray-500" />;
    };

    const selectedOption = JOB_DURATION_OPTIONS.find(option => option.days === selectedDays);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity"
                            onClick={onClose}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all"
                        >
                            {/* Header */}
                            <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                                            <Info className="h-6 w-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">Confirm Transcription Processing</h3>
                                            <p className="text-sm text-gray-600">Review file details and processing requirements</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="max-h-[60vh] overflow-y-auto p-6">
                                <div className="space-y-6">
                                    {/* Credit Summary */}
                                    <div className={`rounded-xl border-2 p-4 ${
                                        hasInsufficientCredits
                                            ? 'border-red-200 bg-red-50'
                                            : 'border-green-200 bg-green-50'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                {hasInsufficientCredits ? (
                                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                                ) : (
                                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                                )}
                                                <div>
                                                    <h4 className={`font-semibold ${
                                                        hasInsufficientCredits ? 'text-red-900' : 'text-green-900'
                                                    }`}>
                                                        {hasInsufficientCredits ? 'Insufficient Credits' : 'Credits Available'}
                                                    </h4>
                                                    
                                                    {/* Credit Calculation Breakdown */}
                                                    <div className={`text-sm space-y-1 ${
                                                        hasInsufficientCredits ? 'text-red-700' : 'text-green-700'
                                                    }`}>
                                                        <p>Processing duration: {selectedDays} days ({selectedOption?.pricePerMinute}/minute)</p>
                                                        <p>Total credits required: {totalCreditsRequired.toLocaleString()} credits</p>
                                                        <p>Available credits: {userCredits.toLocaleString()} credits</p>
                                                        {hasInsufficientCredits && (
                                                            <p className="font-semibold">Shortfall: {creditsShortfall.toLocaleString()} credits</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Files List */}
                                    <div>
                                        <h4 className="mb-3 text-lg font-semibold text-gray-900">
                                            Files to Process ({filesMetadata.length})
                                        </h4>
                                        <div className="space-y-3">
                                            {filesMetadata.map((metadata, index) => {
                                                // Calculate credits for this specific file
                                                const fileCreditsRequired = calculateTotalCreditsRequired(metadata.duration, selectedDays);
                                                // const fileMinutes = Math.ceil(metadata.duration / 60);
                                                
                                                return (
                                                    <div
                                                        key={index}
                                                        className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                {getFileIcon(metadata.fileType)}
                                                                <div>
                                                                    <h5 className="font-medium text-gray-900">{metadata.fileName}</h5>
                                                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                                        <span>{formatFileSize(metadata.fileSize)}</span>
                                                                        <span>{formatDuration(metadata.duration)}</span>
                                                                        <span>{metadata.fileType}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="space-y-1">
                                                                    <p className="text-xs text-gray-500">
                                                                        {formatDuration(metadata.duration)} min × {selectedOption?.creditsPerMinute} credits/min
                                                                    </p>
                                                                    <p className="text-lg font-semibold text-purple-600">
                                                                        {fileCreditsRequired.toLocaleString()} credits
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {selectedOption?.pricePerMinute}/minute
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Job Duration Selection */}
                                    <div>
                                        <h4 className="mb-3 flex items-center space-x-2 text-lg font-semibold text-gray-900">
                                            <Calendar className="h-5 w-5" />
                                            <span>Processing Duration & Pricing</span>
                                        </h4>
                                        <p className="mb-4 text-sm text-gray-600">
                                            Select processing speed. Faster processing costs more per minute. Jobs will complete within the selected timeframe.
                                        </p>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            {JOB_DURATION_OPTIONS.map((option) => {
                                                const optionCreditsRequired = filesMetadata.reduce((total, metadata) => {
                                                    return total + calculateTotalCreditsRequired(metadata.duration, option.days);
                                                }, 0);
                                                const IconComponent = option.icon;
                                                
                                                return (
                                                    <button
                                                        key={option.days}
                                                        onClick={() => setSelectedDays(option.days)}
                                                        className={`rounded-lg border-2 p-4 text-left transition-all ${
                                                            selectedDays === option.days
                                                                ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-md'
                                                                : 'border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-25 hover:shadow-sm'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start space-x-3">
                                                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                                                    selectedDays === option.days ? 'bg-purple-100' : 'bg-gray-100'
                                                                }`}>
                                                                    <IconComponent className={`h-4 w-4 ${
                                                                        selectedDays === option.days ? 'text-purple-600' : 'text-gray-600'
                                                                    }`} />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="font-semibold">{option.label}</span>
                                                                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${option.badgeColor}`}>
                                                                            {option.pricePerMinute}/min
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm opacity-75">{option.description}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-semibold text-purple-600">
                                                                    {optionCreditsRequired.toLocaleString()}
                                                                </p>
                                                                <p className="text-xs text-gray-500">credits</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Processing Info */}
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <h5 className="font-semibold text-blue-900">Processing Information</h5>
                                        <ul className="mt-2 space-y-1 text-sm text-blue-800">
                                            <li>• Pricing is per minute of audio/video content</li>
                                            <li>• Duration is rounded UP to the nearest minute</li>
                                            <li>• Credits are deducted only after successful transcription</li>
                                            <li>• Failed uploads do not consume credits</li>
                                            <li>• Processing uses advanced AI-powered transcription</li>
                                            <li>• Jobs will complete automatically within selected timeframe</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        <div className="space-y-1">
                                            <div>
                                                Total credits required: <span className="font-semibold text-gray-900">{totalCreditsRequired.toLocaleString()}</span>
                                            </div>
                                            <div>
                                                Duration: <span className="font-semibold text-gray-900">{selectedDays} days</span> • 
                                                Rate: <span className="font-semibold text-gray-900">{selectedOption?.pricePerMinute}/minute</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={onClose}
                                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            disabled={hasInsufficientCredits || isProcessing}
                                            className={`rounded-lg px-6 py-2 text-sm font-medium transition-all ${
                                                hasInsufficientCredits
                                                    ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                                                    : isProcessing
                                                    ? 'cursor-not-allowed bg-purple-400 text-white'
                                                    : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
                                            }`}
                                        >
                                            {isProcessing ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    <span>Starting...</span>
                                                </div>
                                            ) : hasInsufficientCredits ? (
                                                'Insufficient Credits'
                                            ) : (
                                                `Start Processing (${totalCreditsRequired.toLocaleString()} credits)`
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}