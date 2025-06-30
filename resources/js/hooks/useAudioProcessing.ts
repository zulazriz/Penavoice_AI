import { useCredits } from '@/contexts/CreditContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useUploadedFiles } from '@/contexts/UploadedFilesContext';
import { audioProcessingService, type ProcessingJob } from '@/services/audioProcessingService';
import { useCallback, useEffect, useState } from 'react';

export function useAudioProcessing() {
    const [jobs, setJobs] = useState<ProcessingJob[]>([]);
    const [isPolling, setIsPolling] = useState(false);
    const { addNotification } = useNotifications();
    const { updateFile } = useUploadedFiles();
    const { deductCredits } = useCredits();

    /**
     * Start processing a file with specified processing duration
     * This creates a processing job and initializes the file status
     * @param fileId - Unique file identifier
     * @param fileName - Name of the file being processed
     * @param fileSize - Size of the file in bytes
     * @param fileDuration - EXACT duration of the media file in seconds (with decimals)
     * @param processingDays - Processing duration (3, 7, 14, or 21 days)
     */
    const startProcessing = useCallback(
        (fileId: string, fileName: string, fileSize: number, fileDuration: number, processingDays: number = 21) => {
            // Create job with processing duration information and accurate credit calculation
            const job = audioProcessingService.createJob(fileId, fileName, fileSize, fileDuration, processingDays);

            console.log(`[AUDIO PROCESSING] Started processing job for ${fileName}`);
            console.log(`  - File ID: ${fileId}`);
            console.log(`  - Exact duration: ${fileDuration} seconds`);
            console.log(`  - Processing duration: ${processingDays} days`);
            console.log(`  - Base minutes: ${job.baseMinutes || 0}`);
            console.log(`  - Total credits to use: ${job.creditsUsed || 0}`);

            // Update file status to processing
            updateFile(fileId, {
                status: 'processing',
                transcriptionId: job.id,
                duration: fileDuration,
                processingSteps: [
                    { step: 'Media Identification', status: 'pending' },
                    { step: 'Audio Separation', status: 'pending' },
                    { step: 'Audio Cleanup', status: 'pending' },
                    { step: 'Vocal Enhancement', status: 'pending' },
                    { step: 'Speech Transcription', status: 'pending' },
                    { step: 'Quality Validation', status: 'pending' },
                ],
            });

            return job;
        },
        [updateFile],
    );

    // Get job by file ID
    const getJobByFileId = useCallback((fileId: string) => {
        return audioProcessingService.getJobByFileId(fileId);
    }, []);

    // Get job by job ID
    const getJob = useCallback((jobId: string) => {
        return audioProcessingService.getJob(jobId);
    }, []);

    /**
     * Poll for job updates and handle credit deduction
     * This runs continuously to check for processing status changes
     */
    useEffect(() => {
        if (!isPolling) return;

        const pollInterval = setInterval(() => {
            const allJobs = audioProcessingService.getAllJobs();
            setJobs(allJobs);

            // Check for job status changes and update files accordingly
            allJobs.forEach(async (job) => {
                const steps = Object.entries(job.steps);
                const processingSteps = steps.map(([stepName, stepData]) => ({
                    step: stepName.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
                    status: stepData.status,
                    timestamp: stepData.startedAt || stepData.completedAt,
                }));

                // Update file with current processing status
                updateFile(job.fileId, {
                    progress: job.progress,
                    processingSteps,
                    status: job.status === 'completed' ? 'completed' : job.status === 'failed' ? 'error' : 'processing',
                    duration: job.fileDuration,
                });

                // Handle major status changes (completion or failure)
                if (job.status === 'completed' && job.completedAt) {
                    const timeSinceCompletion = Date.now() - job.completedAt.getTime();

                    if (timeSinceCompletion < 2000) {
                        const creditKey = `deducted_${job.fileId}`;

                        if (!job.creditsDeducted && !sessionStorage.getItem(creditKey)) {
                            console.log(`[PROCESSING COMPLETE] Deducting credits for ${job.fileName}`);
                            console.log(`  - Duration: ${job.fileDuration}`);
                            console.log(`  - Credits: ${job.creditsUsed}`);
                            console.log(`  - Processing Days: ${job.processingDays}`);

                            const success = await deductCredits(job.creditsUsed || 0, job.fileName, job.fileDuration, job.processingDays || 21);

                            if (success) {
                                job.creditsDeducted = true;
                                sessionStorage.setItem(creditKey, 'true');
                            }
                        }

                        // Send notification regardless
                        addNotification({
                            title: 'Transcription Complete',
                            message: `${job.fileName} has been successfully transcribed! Credits used: ${job.creditsUsed || 0}`,
                            type: 'success',
                        });

                        updateFile(job.fileId, {
                            transcriptionText: job.transcriptionText,
                            status: 'completed',
                            creditsUsed: job.creditsUsed,
                        });
                    }
                } else if (job.status === 'failed' && job.completedAt) {
                    sessionStorage.removeItem(`deducted_${job.fileId}`);

                    const timeSinceFailure = Date.now() - job.completedAt.getTime();

                    // Only handle recently failed jobs (within 2 seconds)
                    if (timeSinceFailure < 2000) {
                        console.log(`[PROCESSING FAILED] ${job.fileName} failed: ${job.error}`);

                        // Send error notification (persistent until user interaction)
                        addNotification({
                            title: 'Processing Failed',
                            message: `Failed to process ${job.fileName}: ${job.error}. No credits deducted.`,
                            type: 'error',
                        });

                        updateFile(job.fileId, {
                            status: 'error',
                            creditsUsed: 0, // Ensure no credits are charged for failed processing
                        });
                    }
                }
            });
        }, 1000); // Poll every second for real-time updates

        return () => clearInterval(pollInterval);
    }, [isPolling, addNotification, updateFile, deductCredits]);

    // Start/stop polling
    const startPolling = useCallback(() => {
        console.log('[AUDIO PROCESSING] Starting polling for job updates');
        setIsPolling(true);
    }, []);

    const stopPolling = useCallback(() => {
        console.log('[AUDIO PROCESSING] Stopping polling for job updates');
        setIsPolling(false);
    }, []);

    // Get queue status
    const getQueueStatus = useCallback(() => {
        return audioProcessingService.getQueueStatus();
    }, []);

    return {
        jobs,
        startProcessing,
        getJobByFileId,
        getJob,
        startPolling,
        stopPolling,
        isPolling,
        getQueueStatus,
    };
}
