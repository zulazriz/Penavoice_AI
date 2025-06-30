/**
 * File utilities for media processing with accurate metadata extraction and credit calculation
 *
 * CREDIT CALCULATION LOGIC:
 * - Base calculation: 1 minute = specific credits based on processing duration
 * - Pricing (RM per minute → credits):
 *   - 3 days: RM6.20 = 62 credits/min
 *   - 7 days: RM5.30 = 53 credits/min
 *   - 14 days: RM4.40 = 44 credits/min
 *   - 21 days: RM3.50 = 35 credits/min
 *
 * CREDIT ROUNDING LOGIC:
 * - Duration is in seconds (decimals allowed)
 * - Duration is not rounded — but total credits are rounded to the nearest integer
 * - Display values may round duration up to full minutes, but billing uses precise time
 */

/**
 * Media file metadata interface with accurate duration and size
 */
export interface MediaFileMetadata {
    fileName: string;
    fileSize: number;
    fileType: string;
    duration: number; // seconds
    creditsRequired: number; // rounded up for display (not actual billing)
    lastModified: number;
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
    const rounded = Math.round(seconds);
    const hours = Math.floor(rounded / 3600);
    const minutes = Math.floor((rounded % 3600) / 60);
    const secs = rounded % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate display credits for showing estimated minutes (UI only)
 */
export function calculateCreditsForDuration(durationInSeconds: number): number {
    return Math.ceil(durationInSeconds / 60); // For display only
}

/**
 * Real credit calculation for billing, based on precise duration
 */
export function calculateTotalCreditsRequired(durationInSeconds: number, processingDays: number): number {
    const minutes = durationInSeconds / 60;

    let creditsPerMinute = 35;
    switch (processingDays) {
        case 3:
            creditsPerMinute = 62;
            break;
        case 7:
            creditsPerMinute = 53;
            break;
        case 14:
            creditsPerMinute = 44;
            break;
        case 21:
            creditsPerMinute = 35;
            break;
    }

    const totalCredits = minutes * creditsPerMinute; // keep as decimal
    return Math.floor(totalCredits);
}

/**
 * Multiplier to show plan level (optional UI usage)
 */
export function getProcessingMultiplier(processingDays: number): number {
    switch (processingDays) {
        case 3:
            return 4;
        case 7:
            return 3;
        case 14:
            return 2;
        case 21:
            return 1;
        default:
            return 1;
    }
}

/**
 * Extract accurate metadata from media files
 * This function ensures we get precise duration and file information
 */
export async function getMediaFileMetadata(file: File): Promise<MediaFileMetadata> {
    const url = URL.createObjectURL(file);

    const metadata: MediaFileMetadata = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        duration: 0, // Accurate decimal duration in seconds
        creditsRequired: 0, // Display only (rounded up minutes)
        lastModified: file.lastModified,
    };

    const cleanup = () => URL.revokeObjectURL(url);

    const extractDuration = (media: HTMLMediaElement) => {
        return new Promise<number>((resolve, reject) => {
            media.preload = 'metadata';
            media.onloadedmetadata = () => {
                cleanup();
                const duration = media.duration;

                if (isFinite(duration) && duration > 0) {
                    resolve(duration);
                } else {
                    reject(new Error('Invalid media duration'));
                }
            };

            media.onerror = () => {
                cleanup();
                reject(new Error('Failed to load media'));
            };

            media.src = url;
        });
    };

    try {
        let duration = 0;

        if (file.type.startsWith('audio/')) {
            const audio = new Audio();
            duration = await extractDuration(audio);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            duration = await extractDuration(video);
        } else {
            throw new Error('Unsupported file type');
        }

        // ✅ Fix metadata by rounding to whole seconds for display only
        const roundedSeconds = Math.round(duration);

        // ✅ Set accurate duration
        metadata.duration = duration;

        // ✅ Calculate display-friendly minutes (UI only)
        metadata.creditsRequired = Math.ceil(duration / 60);

        console.log(`[METADATA] ${file.name} — Exact: ${duration}s → Display: ${formatDuration(roundedSeconds)}`);
        console.log(`[METADATA] File: ${file.name}`);
        console.log(`[METADATA] Exact duration: ${duration}s → Display: ${formatDuration(roundedSeconds)}`);
    } catch {
        // Fallback estimate if metadata extraction fails
        console.warn(`[fallback] Metadata failed for ${file.name}. Estimating...`);

        const estimated = estimateFileDurationFromSize(file);
        metadata.duration = estimated;
        metadata.creditsRequired = Math.ceil(estimated / 60);
    }

    return metadata;
}

/**
 * Estimate duration based on file size and type if media fails to load
 */
function estimateFileDurationFromSize(file: File): number {
    let avgBitrate = 128000; // Default

    if (file.type.includes('mp3')) avgBitrate = 128000;
    else if (file.type.includes('wav')) avgBitrate = 1411200;
    else if (file.type.includes('flac')) avgBitrate = 1000000;
    else if (file.type.includes('mp4')) avgBitrate = 1000000;
    else if (file.type.includes('mov')) avgBitrate = 1500000;
    else if (file.type.includes('avi')) avgBitrate = 2000000;

    const estimated = (file.size * 8) / avgBitrate;

    const bounded = Math.max(10, Math.min(estimated, file.size / (100 * 1024)));

    console.log(`[ESTIMATE] ${file.name}: ${formatFileSize(file.size)}, est. ${bounded.toFixed(2)}s`);

    return bounded;
}
