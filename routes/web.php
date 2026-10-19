<?php

use App\Http\Controllers\DocumentController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard/index')->name('dashboard');
    Route::get('documents', [DocumentController::class, 'index'])->name('documents.index');
    Route::post('documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::get('documents/declaration-numbers', [DocumentController::class, 'declarationNumbers'])->name('documents.declaration-numbers');
    Route::get('documents/{document}/history', [DocumentController::class, 'history'])->name('documents.history');
    Route::get('documents/{document}/chain', [DocumentController::class, 'chain'])->name('documents.chain');
    Route::patch('documents/{document}', [DocumentController::class, 'update'])->name('documents.update');
    Route::get('documents/{document}/view', [DocumentController::class, 'view'])->name('documents.view');
    Route::inertia('filing-cabinets', 'filing-cabinets/index')->name('filing-cabinets.index');
});

require __DIR__.'/settings.php';
