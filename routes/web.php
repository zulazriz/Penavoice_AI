<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'verified'])
    ->prefix('customer')
    ->group(function () {
        Route::get('/credits', function () {
            return Inertia::render('customer/credits');
        })->name('credits');

        Route::get('/upload_media', function () {
            return Inertia::render('customer/upload-media');
        })->name('upload_media');

        Route::get('/status_jobs', function () {
            return Inertia::render('customer/status-jobs');
        })->name('status_jobs');
    });

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
