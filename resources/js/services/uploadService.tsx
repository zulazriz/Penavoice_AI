interface UploadProgress {
    percentage: number;
    loaded: number;
    total: number;
}

interface UploadResult {
    success: boolean;
    fileId?: string;
    filePath?: string;
    error?: string;
}

export async function uploadFileLocally(file: File, onProgress: (progress: UploadProgress) => void): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
        // Simulate upload progress
        let progress = 0;
        const fileId = Math.random().toString(36).substr(2, 9);

        // 🔁 Calculate realistic total duration based on file size
        const uploadDuration = Math.min(3000, Math.max(500, file.size / 100)); // 0.5s–3s
        const updateInterval = uploadDuration / 10; // 10 steps

        const interval = setInterval(() => {
            progress = Math.min(progress + Math.random() * 20, 100);

            if (progress >= 100) {
                clearInterval(interval);

                if (typeof onProgress === 'function') {
                    onProgress({
                        percentage: 100,
                        loaded: file.size,
                        total: file.size,
                    });
                }

                // Simulate occasional upload failures (5% chance)
                const shouldFail = Math.random() < 0.05;

                setTimeout(() => {
                    if (shouldFail) {
                        reject(new Error('Network error occurred during upload'));
                    } else {
                        resolve({
                            success: true,
                            fileId,
                            filePath: `/uploads/${fileId}_${file.name}`,
                        });
                    }
                }, 500);
            } else {
                if (typeof onProgress === 'function') {
                    onProgress({
                        percentage: Math.round(progress),
                        loaded: Math.round((file.size * progress) / 100),
                        total: file.size,
                    });
                }
            }
        }, updateInterval); // ⏱ Use the calculated interval
    });
}

// Production upload service (commented out for local development)
/*
export const uploadFileToServer = async (
  file: File,
  onProgress: (progress: UploadProgress) => void
): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('originalName', file.name);
    formData.append('fileSize', file.size.toString());
    formData.append('fileType', file.type);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
      }
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      fileId: result.fileId,
      filePath: result.filePath,
      message: result.message || 'File uploaded successfully to server'
    };
    
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
};

// Database service for storing file metadata (commented out for local development)
export const saveFileMetadata = async (fileData: {
  fileId: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  duration: number;
  userId: string;
}) => {
  try {
    const response = await fetch('/api/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
      },
      body: JSON.stringify(fileData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save file metadata: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};
*/
