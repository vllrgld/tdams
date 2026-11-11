<?php

use App\Http\Controllers\Settings\AccessibilitySettingsController;
use App\Http\Controllers\Settings\DataSettingsController;
use App\Http\Controllers\Settings\OcrSettingsController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->middleware(RequirePassword::class)
        ->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
    Route::get('settings/accessibility', [AccessibilitySettingsController::class, 'edit'])->name('accessibility.edit');
    Route::put('settings/accessibility', [AccessibilitySettingsController::class, 'update'])->name('accessibility.update');
    Route::redirect('settings/animations', '/settings/accessibility')->name('animations.edit');

    Route::get('settings/ocr', [OcrSettingsController::class, 'edit'])->name('ocr.edit');
    Route::put('settings/ocr', [OcrSettingsController::class, 'update'])->name('ocr.update');
    Route::redirect('settings/compression', '/settings/ocr');

    Route::get('settings/data', [DataSettingsController::class, 'edit'])->name('data.edit');
    Route::delete('settings/data', [DataSettingsController::class, 'destroy'])
        ->middleware('throttle:2,1')
        ->name('data.destroy');
});

Route::get('.well-known/passkey-endpoints', function () {
    return response()->json([
        'enroll' => route('security.edit'),
        'manage' => route('security.edit'),
    ]);
})->name('well-known.passkeys');
