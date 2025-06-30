<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CreditController;
use App\Http\Controllers\AudioProcessingController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'verified', 'auth:sanctum'])
    ->prefix('customer')
    ->group(function () {
        Route::prefix('credits')->group(function () {
            Route::get('/', function () {
                return Inertia::render('customer/credits');
            })->name('credits');
            Route::get('/getCredits', [CreditController::class, 'getCredits']);
            Route::post('/deductCredits', [CreditController::class, 'deductCredits']);
            Route::post('/addCredits', [CreditController::class, 'addCredits']);
        });

        Route::prefix('upload-media')->group(function () {
            Route::get('/', function () {
                return Inertia::render('customer/upload-media');
            })->name('upload_media');
        });

        Route::prefix('status-jobs')->group(function () {
            Route::get('/', function () {
                return Inertia::render('customer/status-jobs');
            })->name('status_jobs');
        });

        Route::prefix('audio')->group(function () {
            Route::get('/audio_jobs', [AudioProcessingController::class, 'dataAudioJobs']);
            Route::post('/upload', [AudioProcessingController::class, 'upload']);
            Route::post('/update', [AudioProcessingController::class, 'updateStatus']);
            Route::get('/status', [AudioProcessingController::class, 'getStatus']);
            Route::get('/jobs', [AudioProcessingController::class, 'getAllJobs']);
            Route::delete('/jobs/{jobId}', [AudioProcessingController::class, 'deleteJob']);
        });
    });


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
