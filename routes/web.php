<?php

use App\Http\Controllers\ArchiveController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\CabinetController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DrawerController;
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
    Route::get('archive', [ArchiveController::class, 'index'])->name('archive.index');
    Route::get('manage/cabinets', [CabinetController::class, 'index'])->name('manage.cabinets.index');
    Route::post('manage/cabinets', [CabinetController::class, 'store'])->name('manage.cabinets.store');
    Route::patch('manage/cabinets/{cabinet}', [CabinetController::class, 'update'])->name('manage.cabinets.update');
    Route::patch('manage/drawers/{drawer}', [DrawerController::class, 'update'])->name('manage.drawers.update');
    Route::post('manage/drawers/{drawer}/books', [BookController::class, 'store'])->name('manage.drawers.books.store');
    Route::patch('manage/books/{book}', [BookController::class, 'update'])->name('manage.books.update');
    Route::inertia('manage/books', 'manage/books/index')->name('manage.books.index');
    Route::redirect('archive/cabinets', '/manage/cabinets');
    Route::redirect('archive/books', '/manage/books');
    Route::redirect('filing-cabinets', '/archive');
    Route::inertia('bookmarks', 'bookmarks/index')->name('bookmarks.index');
});

require __DIR__.'/settings.php';
