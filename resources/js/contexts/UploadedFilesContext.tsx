/* eslint-disable @typescript-eslint/no-explicit-any */
import type { UploadedFile, UploadedFilesContextType } from '@/types';
import React, { createContext, ReactNode, useContext, useState } from 'react';

export const UploadedFilesContext = createContext<UploadedFilesContextType | undefined>(undefined);

interface UploadedFilesProviderProps {
    children: ReactNode;
}

export function UploadedFilesProvider({ children }: UploadedFilesProviderProps) {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(() => {
        // Load from localStorage on initialization
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('uploadedFiles');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Convert date strings back to Date objects and recreate File objects
                    return parsed.map((file: any) => ({
                        ...file,
                        uploadedAt: new Date(file.uploadedAt),
                        processingSteps: file.processingSteps?.map((step: any) => ({
                            ...step,
                            timestamp: step.timestamp ? new Date(step.timestamp) : undefined,
                        })),
                        // Note: File objects can't be serialized, so we'll need to handle this differently in a real app
                        file: new File([''], file.fileName || 'unknown', { type: file.fileType || 'application/octet-stream' }),
                    }));
                }
            } catch (error) {
                console.error('Error loading uploaded files from localStorage:', error);
            }
        }
        return [];
    });

    // Save to localStorage whenever uploadedFiles changes
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                // Serialize the files for storage (excluding the actual File object)
                const serializable = uploadedFiles.map((file) => ({
                    ...file,
                    fileName: file.file.name,
                    fileSize: file.file.size,
                    fileType: file.file.type,
                    // Don't store the actual File object as it can't be serialized
                    file: undefined,
                }));
                localStorage.setItem('uploadedFiles', JSON.stringify(serializable));
            } catch (error) {
                console.error('Error saving uploaded files to localStorage:', error);
            }
        }
    }, [uploadedFiles]);

    const addFiles = (files: UploadedFile[]) => {
        setUploadedFiles((prev) => [...prev, ...files]);
    };

    const updateFile = (id: string, updates: Partial<UploadedFile> | ((prev: UploadedFile) => Partial<UploadedFile>)) => {
        setUploadedFiles((prev) =>
            prev.map((file) => {
                if (file.id !== id) return file;
                const updateObject = typeof updates === 'function' ? updates(file) : updates;
                return { ...file, ...updateObject };
            }),
        );
    };

    const removeFile = (id: string) => {
        setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
    };

    const clearAllFiles = () => {
        setUploadedFiles([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('uploadedFiles');
        }
    };

    return (
        <UploadedFilesContext.Provider
            value={{
                uploadedFiles,
                addFiles,
                updateFile,
                removeFile,
                clearAllFiles,
            }}
        >
            {children}
        </UploadedFilesContext.Provider>
    );
}

export function useUploadedFiles() {
    const context = useContext(UploadedFilesContext);
    if (context === undefined) {
        throw new Error('useUploadedFiles must be used within an UploadedFilesProvider');
    }
    return context;
}
