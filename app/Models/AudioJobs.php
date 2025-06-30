<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;

class AudioJobs extends Model
{
    use HasFactory, Notifiable;

    protected $table = 'audio_jobs';

    protected $fillable = [
        'user_id',
        'job_id',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
        'status',
        'current_step',
        'error',
        'transcription',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the status display name
     */
    public function getStatusDisplayAttribute()
    {
        return match ($this->status) {
            'queued' => 'Queued',
            'processing' => 'Processing',
            'completed' => 'Completed',
            'failed' => 'Failed',
            default => 'Unknown',
        };
    }

    /**
     * Check if the job is completed
     */
    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    /**
     * Check if the job has failed
     */
    public function hasFailed()
    {
        return $this->status === 'failed';
    }

    /**
     * Check if the job is currently processing
     */
    public function isProcessing()
    {
        return $this->status === 'processing';
    }

    /**
     * Get the file size in human readable format
     */
    public function getReadableFileSizeAttribute()
    {
        $bytes = $this->file_size ?? 0;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes >= 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}
