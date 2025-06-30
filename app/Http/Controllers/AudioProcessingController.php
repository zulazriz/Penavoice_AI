<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AudioJobs;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AudioProcessingController extends Controller
{
    public function dataAudioJobs()
    {
        $userId = Auth::user()->id;

        $audioJobs = AudioJobs::with('user')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        $countFileProcessed = AudioJobs::where('user_id', $userId)
            ->where('status', 'completed')
            ->count();

        Log::info("[GET] Get all audio data:\n" . json_encode($audioJobs, JSON_PRETTY_PRINT));
        Log::info("[GET] Get count audio data:\n" . json_encode($countFileProcessed, JSON_PRETTY_PRINT));

        return response()->json([
            'status' => 'success',
            'data' => $audioJobs,
            'countFileProcessed' => $countFileProcessed,
        ]);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:mp3,wav,m4a,aac,ogg',
        ]);

        Log::info("[UPLOAD] Request:\n" . json_encode([$request->all()], JSON_PRETTY_PRINT));

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $mimeType = $file->getMimeType();
        $fileSize = $file->getSize();
        $generatedJobId = 'job_' . uniqid() . '_' . now()->format('ymd');

        Log::info("[UPLOAD] Received file for local processing:\n" . json_encode([
            'file_name' => $originalName,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
        ], JSON_PRETTY_PRINT));

        // Generate unique filename to prevent conflicts
        $filename = Str::uuid() . '_' . $originalName;

        // Store file in local storage
        $filePath = $file->storeAs('audio_uploads', $filename, 'local');

        Log::info("[UPLOAD] File stored locally:\n" . json_encode([
            'file_path' => $filePath,
            'filename' => $filename,
        ], JSON_PRETTY_PRINT));

        Log::info("AUTH USER: " . json_encode(Auth::user(), JSON_PRETTY_PRINT));

        // Create database record
        $audioJob = AudioJobs::create([
            'user_id' => Auth::user()->id,
            'job_id' => $generatedJobId,
            'file_name' => $originalName,
            'file_path' => $filePath,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
            'status' => 'queued',
            'current_step' => 'File uploaded, queued for processing',
        ]);

        Log::info("[UPLOAD] Database record created:\n" . json_encode([
            'job_id' => $generatedJobId,
            'file_name' => $originalName,
        ], JSON_PRETTY_PRINT));


        return response()->json([
            'success' => true,
            'job_id' => $audioJob->id,
            'file_name' => $originalName,
            'file_path' => $filePath,
            'message' => 'File uploaded successfully and queued for processing',
        ]);
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'job_id' => 'required|string',
            'file_name' => 'required|string',
            'status' => 'required|string|in:queued,processing,completed,failed',
            'current_step' => 'required|string',
            'transcription' => 'nullable|string',
        ]);

        Log::info("[UPDATE] Request:\n" . json_encode([$request->all()], JSON_PRETTY_PRINT));

        $jobId = $request->input('job_id');
        // $generatedJobId = 'job_' . uniqid() . '_' . now()->format('ymd');
        $fileName = $request->input('file_name');
        $fileSize = $request->input('file_size');
        $status = $request->input('status');
        $currentStep = $request->input('current_step');
        $transcription = $request->input('transcription');

        Log::info("[UPDATE] Updating job status:\n" . json_encode([
            'job_id'            => $jobId,
            'file_name'         => $fileName,
            'file_size'         => $fileSize,
            'status'            => $status,
            'current_step'      => $currentStep,
            'has_transcription' => !empty($transcription),
        ], JSON_PRETTY_PRINT));

        // Find or create the audio job record
        // $audioJob = AudioJobs::where('file_name', $fileName)->first();
        $audioJob = AudioJobs::where('job_id', $jobId)->first();

        if (!$audioJob) {
            // If no record exists, create one (fallback)
            $audioJob = AudioJobs::create([
                'user_id' => Auth::user()->id,
                'job_id' => $jobId,
                'file_name' => $fileName,
                'file_path' => 'unknown',
                'mime_type' => 'unknown',
                'file_size' => $fileSize,
                'status' => $status,
                'current_step' => $currentStep,
                'transcription' => $transcription,
            ]);

            Log::info('[UPDATE] Created new job record', ['job_id' => $audioJob->job_id]);
        } else {
            // Update existing record
            $updateData = [
                'status' => $status,
                'current_step' => $currentStep,
            ];

            if ($transcription !== null) {
                $updateData['transcription'] = $transcription;
            }

            if ($status === 'failed') {
                $updateData['error'] = $currentStep;
            }

            $audioJob->update($updateData);

            Log::info('[UPDATE] Updated existing job record', [
                'job_id' => $audioJob->id,
                'updated_fields' => array_keys($updateData),
            ]);
        }

        return response()->json([
            'success' => true,
            'job_id' => $audioJob->job_id,
            'status' => $audioJob->status,
            'current_step' => $audioJob->current_step,
            'message' => 'Job status updated successfully',
        ]);
    }

    public function getStatus(Request $request)
    {
        $request->validate([
            'job_id' => 'required|integer',
        ]);

        $jobId = $request->input('job_id');

        Log::info('🔍 [STATUS] Checking job status', ['job_id' => $jobId]);

        $audioJob = AudioJobs::find($jobId);

        if (!$audioJob) {
            Log::warning('⚠️ [STATUS] Job not found', ['job_id' => $jobId]);

            return response()->json([
                'success' => false,
                'message' => 'Job not found',
            ], 404);
        }

        Log::info('[STATUS] Job status retrieved', [
            'job_id' => $jobId,
            'status' => $audioJob->status,
            'current_step' => $audioJob->current_step,
        ]);

        return response()->json([
            'success' => true,
            'job_id' => $audioJob->id,
            'file_name' => $audioJob->file_name,
            'status' => $audioJob->status,
            'current_step' => $audioJob->current_step,
            'transcription' => $audioJob->transcription,
            'error' => $audioJob->error,
            'created_at' => $audioJob->created_at,
            'updated_at' => $audioJob->updated_at,
        ]);
    }

    public function getAllJobs()
    {
        Log::info('📋 [JOBS] Retrieving all jobs');

        $jobs = AudioJobs::orderBy('created_at', 'desc')->get();

        Log::info('✅ [JOBS] Retrieved jobs', ['count' => $jobs->count()]);

        return response()->json([
            'success' => true,
            'jobs' => $jobs,
            'total_count' => $jobs->count(),
        ]);
    }

    public function deleteJob(Request $request, $jobId)
    {
        Log::info('🗑️ [DELETE] Deleting job', ['job_id' => $jobId]);

        $audioJob = AudioJobs::find($jobId);

        if (!$audioJob) {
            Log::warning('⚠️ [DELETE] Job not found', ['job_id' => $jobId]);

            return response()->json([
                'success' => false,
                'message' => 'Job not found',
            ], 404);
        }

        // Delete the file if it exists
        if ($audioJob->file_path && Storage::disk('local')->exists($audioJob->file_path)) {
            Storage::disk('local')->delete($audioJob->file_path);
            Log::info('🗂️ [DELETE] File deleted from storage', ['file_path' => $audioJob->file_path]);
        }

        // Delete the database record
        $audioJob->delete();

        Log::info('✅ [DELETE] Job deleted successfully', ['job_id' => $jobId]);

        return response()->json([
            'success' => true,
            'message' => 'Job deleted successfully',
        ]);
    }
}
