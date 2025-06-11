export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

export function getFileDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const audio = document.createElement('audio');
        const video = document.createElement('video');
        const element = file.type.startsWith('audio/') ? audio : video;

        element.preload = 'metadata';

        element.onloadedmetadata = () => {
            window.URL.revokeObjectURL(element.src);
            resolve(element.duration);
        };

        element.onerror = () => {
            window.URL.revokeObjectURL(element.src);
            reject(new Error('Could not load media file'));
        };

        element.src = window.URL.createObjectURL(file);
    });
}

export function generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, '');

    return `${nameWithoutExtension}_${timestamp}_${random}.${extension}`;
}
