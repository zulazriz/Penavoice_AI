// import StatusJobs from '@/pages/customer/status-jobs';
// import UploadMedia from '@/pages/customer/upload-media';
// import { Clock, FileAudio, Upload } from 'lucide-react';
// import { useState } from 'react';

// export type UploadedFile = {
//     id: string;
//     file: File;
//     progress: number;
//     status: 'uploading' | 'pending' | 'processing' | 'completed' | 'error';
//     transcriptionId?: string;
//     duration?: number;
//     filePath?: string;
//     uploadedAt: Date;
//     transcriptionText?: string;
//     processingSteps?: {
//         step: string;
//         status: 'pending' | 'processing' | 'completed' | 'error';
//         timestamp?: Date;
//     }[];
// };

// export default function AppUploadMedia() {
//     const [currentPage, setCurrentPage] = useState<'upload' | 'status'>('upload');
//     const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

//     const addUploadedFiles = (files: UploadedFile[]) => {
//         setUploadedFiles((prev) => {
//             // Merge new files with existing ones, avoiding duplicates
//             const existingIds = new Set(prev.map((f) => f.id));
//             const newFiles = files.filter((f) => !existingIds.has(f.id));
//             return [...prev, ...newFiles];
//         });
//     };

//     const updateUploadedFile = (id: string, updates: Partial<UploadedFile>) => {
//         setUploadedFiles((prev) => prev.map((file) => (file.id === id ? { ...file, ...updates } : file)));
//     };

//     const removeUploadedFile = (id: string) => {
//         setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
//     };

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
//             {/* Header */}
//             <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
//                 <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//                     <div className="flex h-16 items-center justify-between">
//                         <div className="flex items-center space-x-3">
//                             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600">
//                                 <FileAudio className="h-6 w-6 text-white" />
//                             </div>
//                             <div>
//                                 <h1 className="text-xl font-bold text-gray-900">TranscriptPro</h1>
//                                 <p className="text-xs text-gray-500">AI-Powered Transcription</p>
//                             </div>
//                         </div>

//                         <nav className="flex space-x-1">
//                             <button
//                                 onClick={() => setCurrentPage('upload')}
//                                 className={`flex items-center space-x-2 rounded-lg px-4 py-2 font-medium transition-all duration-200 ${
//                                     currentPage === 'upload'
//                                         ? 'bg-purple-100 text-purple-700 shadow-sm'
//                                         : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
//                                 }`}
//                             >
//                                 <Upload className="h-4 w-4" />
//                                 <span>Upload Media</span>
//                             </button>
//                             <button
//                                 onClick={() => setCurrentPage('status')}
//                                 className={`flex items-center space-x-2 rounded-lg px-4 py-2 font-medium transition-all duration-200 ${
//                                     currentPage === 'status'
//                                         ? 'bg-purple-100 text-purple-700 shadow-sm'
//                                         : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
//                                 }`}
//                             >
//                                 <Clock className="h-4 w-4" />
//                                 <span>Status Jobs</span>
//                                 {uploadedFiles.length > 0 && (
//                                     <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-xs text-white">
//                                         {uploadedFiles.length}
//                                     </span>
//                                 )}
//                             </button>
//                         </nav>
//                     </div>
//                 </div>
//             </header>

//             {/* Main Content */}
//             <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
//                 {currentPage === 'upload' ? (
//                     <UploadMedia
//                         uploadedFiles={uploadedFiles}
//                         onAddFiles={addUploadedFiles}
//                         onUpdateFile={updateUploadedFile}
//                         onRemoveFile={removeUploadedFile}
//                     />
//                 ) : (
//                     <StatusJobs uploadedFiles={uploadedFiles} onUpdateFile={updateUploadedFile} onRemoveFile={removeUploadedFile} />
//                 )}
//             </main>
//         </div>
//     );
// }
