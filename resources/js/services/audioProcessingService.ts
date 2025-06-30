import axios from 'axios';

export interface ProcessingJob {
    id: string;
    fileId: string;
    fileName: string;
    fileSize: number;
    fileDuration: number; // in seconds (exact duration with decimals)
    status: 'queued' | 'processing' | 'completed' | 'failed';
    currentStep: string;
    progress: number;
    steps: {
        mediaIdentification: ProcessingStepStatus;
        audioSeparation: ProcessingStepStatus;
        audioCleanup: ProcessingStepStatus;
        vocalBoost: ProcessingStepStatus;
        transcription: ProcessingStepStatus;
        qualityCheck: ProcessingStepStatus;
    };
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    transcriptionText?: string;
    creditsUsed?: number; // EXACT credits to be deducted (calculated with pricing)
    creditsDeducted?: boolean;

    // Processing duration and credit tracking
    processingDays?: number; // Processing duration selected (3, 7, 14, or 21 days)
    baseMinutes?: number; // Base minutes (rounded up from duration)
}

interface ProcessingStepStatus {
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    startedAt?: Date;
    completedAt?: Date;
    details?: string;
    error?: string;
}

interface DatabaseUpdatePayload {
    job_id: string;
    file_name: string;
    file_size: number;
    status: string;
    current_step: string;
    transcription?: string;
    credits_used?: number;
    processing_days?: number; // Added to track processing duration in database
}

class AudioProcessingService {
    private jobs = new Map<string, ProcessingJob>();
    private processingQueue: string[] = [];
    private isProcessing = false;

    private readonly API = {
        upload: '/customer/audio/upload',
        update: '/customer/audio/update',
    };

    /**
     * Create a new processing job with accurate credit calculation
     *
     * @param fileId - Unique file identifier
     * @param fileName - Name of the file being processed
     * @param fileSize - Size of the file in bytes
     * @param fileDuration - EXACT duration of the media file in seconds (with decimals)
     * @param processingDays - Processing duration (3, 7, 14, or 21 days) - defaults to 21
     * @returns ProcessingJob object with accurate credit calculation
     */
    createJob(fileId: string, fileName: string, fileSize: number, fileDuration: number, processingDays: number = 21): ProcessingJob {
        const malaysiaTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
        const formattedDate = `${String(malaysiaTime.getDate()).padStart(2, '0')}${String(malaysiaTime.getMonth() + 1).padStart(2, '0')}${malaysiaTime.getFullYear()}`;
        const randomStr = Math.random().toString(36).slice(8);

        // Calculate base minutes (always round UP)
        const baseMinutes = Math.floor(fileDuration / 60);

        // Calculate exact credits based on processing duration and pricing
        const creditsUsed = this.calculateCreditsForProcessing(fileDuration, processingDays);

        console.log(`[AUDIO SERVICE] Creating job for ${fileName}:`);
        console.log(`  - Exact duration: ${fileDuration} seconds`);
        console.log(`  - Base minutes (rounded up): ${baseMinutes} minutes`);
        console.log(`  - Processing duration: ${processingDays} days`);
        console.log(`  - Credits per minute: ${this.getCreditsPerMinute(processingDays)}`);
        console.log(`  - Total credits to use: ${creditsUsed} credits`);

        const job: ProcessingJob = {
            id: `job_${randomStr}_${formattedDate}`,
            fileId,
            fileName,
            fileSize,
            fileDuration,
            status: 'queued',
            currentStep: 'Queued for processing',
            progress: 0,
            steps: {
                mediaIdentification: { status: 'pending', progress: 0 },
                audioSeparation: { status: 'pending', progress: 0 },
                audioCleanup: { status: 'pending', progress: 0 },
                vocalBoost: { status: 'pending', progress: 0 },
                transcription: { status: 'pending', progress: 0 },
                qualityCheck: { status: 'pending', progress: 0 },
            },
            // Store processing duration and credit information
            processingDays, // Store selected processing duration
            baseMinutes, // Store base minutes (for reference)
            creditsUsed, // Store EXACT credits that will be deducted
        };

        this.jobs.set(job.id, job);
        this.processingQueue.push(job.id);
        if (!this.isProcessing) this.processQueue();

        return job;
    }

    /**
     * Calculate exact credits required based on processing duration and pricing
     *
     * Pricing structure:
     * - 3 days: RM6.20 per minute = 62 credits per minute
     * - 7 days: RM5.30 per minute = 53 credits per minute
     * - 14 days: RM4.40 per minute = 44 credits per minute
     * - 21 days: RM3.50 per minute = 35 credits per minute
     *
     * @param durationInSeconds - Exact duration of media file in seconds
     * @param processingDays - Processing duration (3, 7, 14, or 21 days)
     * @returns Total credits required for processing
     */
    private calculateCreditsForProcessing(durationInSeconds: number, processingDays: number): number {
        const minutes = durationInSeconds / 60; // ✅ exact duration in decimal minutes
        const creditsPerMinute = this.getCreditsPerMinute(processingDays);
        const totalCredits = minutes * creditsPerMinute;

        console.log(
            `[CREDIT CALCULATION] ${durationInSeconds}s = ${minutes.toFixed(3)} min × ${creditsPerMinute} credits/min = ${totalCredits.toFixed(3)} credits`,
        );

        return Math.floor(totalCredits);
    }

    /**
     * Get credits per minute based on processing duration
     * Based on RM pricing converted to credits (RM1 = 10 credits)
     */
    private getCreditsPerMinute(processingDays: number): number {
        switch (processingDays) {
            case 3: // Express processing - RM6.20 per minute
                return 62;
            case 7: // Standard processing - RM5.30 per minute
                return 53;
            case 14: // Extended processing - RM4.40 per minute
                return 44;
            case 21: // Archive processing - RM3.50 per minute (cheapest)
                return 35;
            default:
                // Default to cheapest option for unknown durations
                console.warn(`Unknown processing duration: ${processingDays} days. Using 21-day pricing (35 credits/minute).`);
                return 35;
        }
    }

    getJob(jobId: string) {
        return this.jobs.get(jobId);
    }

    getJobByFileId(fileId: string) {
        return [...this.jobs.values()].find((j) => j.fileId === fileId);
    }

    getAllJobs(): ProcessingJob[] {
        return [...this.jobs.values()];
    }

    getQueueStatus() {
        const jobs = [...this.jobs.values()];
        return {
            queueLength: this.processingQueue.length,
            totalJobs: jobs.length,
            completedJobs: jobs.filter((j) => j.status === 'completed').length,
            failedJobs: jobs.filter((j) => j.status === 'failed').length,
            isProcessing: this.isProcessing,
        };
    }

    private async processQueue() {
        if (this.isProcessing || this.processingQueue.length === 0) return;

        this.isProcessing = true;
        while (this.processingQueue.length > 0) {
            const jobId = this.processingQueue.shift();
            if (!jobId) continue;

            const job = this.jobs.get(jobId);
            if (job) await this.processJob(job);
        }
        this.isProcessing = false;
    }

    private async processJob(job: ProcessingJob) {
        try {
            job.status = 'processing';
            job.startedAt = new Date();

            console.log(`🎧 Processing ${job.fileName}:`);
            console.log(`  - Duration: ${job.fileDuration} seconds (${job.baseMinutes || 0} minutes)`);
            console.log(`  - Processing duration: ${job.processingDays || 21} days`);
            console.log(`  - Credits to use: ${job.creditsUsed || 0}`);

            await this.updateJobInDatabase(job, 'processing', 'Started processing');

            await this.updateStep(job, 'mediaIdentification', async () => {
                await this.updateJobInDatabase(job, 'processing', 'Identifying media...');
                await this.delay(1500);
            });

            await this.updateStep(job, 'audioSeparation', async () => {
                await this.updateJobInDatabase(job, 'processing', 'Separating audio...');
                await this.delay(3000);
            });

            await this.updateStep(job, 'audioCleanup', async () => {
                await this.updateJobInDatabase(job, 'processing', 'Cleaning audio...');
                await this.delay(2500);
            });

            await this.updateStep(job, 'vocalBoost', async () => {
                await this.updateJobInDatabase(job, 'processing', 'Boosting vocals...');
                await this.delay(2000);
            });

            await this.updateStep(job, 'transcription', async () => {
                await this.updateJobInDatabase(job, 'processing', 'Transcribing...');
                await this.delay(4000);
                const transcriptions = [
                    'Hello, this is a sample transcription of your audio file. The AI has successfully processed and converted your speech to text.',
                    'Welcome to our advanced audio transcription system. Your file has been processed with high accuracy using state-of-the-art AI technology.',
                    'This is a demonstration of how your transcribed text will appear after processing. The system has enhanced the audio quality and extracted clear speech patterns.',
                    'Thank you for using our AI-powered transcription service! Your audio has been successfully converted to text with professional-grade accuracy.',
                ];
                job.transcriptionText = transcriptions[Math.floor(Math.random() * transcriptions.length)];
            });

            await this.updateStep(job, 'qualityCheck', async () => {
                await this.updateJobInDatabase(job, 'processing', 'Quality check...');
                await this.delay(1000);
                if (!job.transcriptionText || job.transcriptionText.length < 10) {
                    throw new Error('Transcription quality check failed - text too short');
                }
            });

            job.status = 'completed';
            job.completedAt = new Date();
            job.progress = 100;
            job.currentStep = 'Processing complete!';

            await this.updateJobInDatabase(
                job,
                'completed',
                'Audio processing completed successfully',
                job.transcriptionText,
                job.creditsUsed,
                job.processingDays,
            );

            console.log(`✅ Job ${job.id} completed successfully:`);
            console.log(`  - Credits to deduct: ${job.creditsUsed || 0}`);
            console.log(`  - Processing duration: ${job.processingDays || 21} days`);
            console.log(`  - Transcription length: ${job.transcriptionText?.length || 0} characters`);
        } catch (error: unknown) {
            this.failJob(job, error instanceof Error ? error.message : 'Unknown processing error');
        }
    }

    private async updateStep(job: ProcessingJob, stepName: keyof ProcessingJob['steps'], processor: () => Promise<void>) {
        const step = job.steps[stepName];
        const label = this.formatStepName(stepName);

        job.currentStep = label;
        step.status = 'processing';
        step.startedAt = new Date();

        // Simulate step progress
        for (let i = 0; i <= 100; i += 10) {
            step.progress = i;
            job.progress = this.estimateProgress(job);
            await this.delay(200);
        }

        await processor();

        step.status = 'completed';
        step.completedAt = new Date();
        step.progress = 100;
        job.progress = this.estimateProgress(job);

        await this.delay(300);
    }

    private async updateJobInDatabase(
        job: ProcessingJob,
        status: string,
        currentStep: string,
        transcription?: string,
        creditsUsed?: number,
        processingDays?: number,
    ) {
        const payload: DatabaseUpdatePayload = {
            job_id: job.id,
            file_name: job.fileName,
            file_size: job.fileSize,
            status,
            current_step: currentStep,
            ...(transcription && { transcription }),
            ...(creditsUsed !== undefined && { credits_used: creditsUsed }),
            ...(processingDays !== undefined && { processing_days: processingDays }),
        };

        try {
            await axios.post(this.API.update, payload);
            console.log(`[DATABASE] Updated job ${job.id} - Status: ${status}`);
        } catch (err) {
            console.error(`[DATABASE ERROR] Failed to update job ${job.id}:`, err);
        }
    }

    private failJob(job: ProcessingJob, message: string) {
        job.status = 'failed';
        job.error = message;
        job.completedAt = new Date();
        job.creditsUsed = 0; // No credits charged for failed processing
        job.currentStep = `❌ Failed: ${message}`;

        // Mark all processing steps as failed
        Object.values(job.steps).forEach((step) => {
            if (step.status === 'processing') {
                step.status = 'error';
                step.error = message;
                step.completedAt = new Date();
            }
        });

        this.updateJobInDatabase(job, 'failed', job.currentStep, undefined, 0, job.processingDays);

        console.log(`❌ Job ${job.id} failed:`);
        console.log(`  - Error: ${message}`);
        console.log(`  - Credits charged: 0 (no charge for failed processing)`);
    }

    private estimateProgress(job: ProcessingJob): number {
        const steps = Object.values(job.steps);
        const total = steps.reduce((acc, step) => acc + step.progress, 0);
        return Math.round(total / steps.length);
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private formatStepName(step: string): string {
        return step.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
    }
}

export const audioProcessingService = new AudioProcessingService();
