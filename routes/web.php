<?php

use App\Http\Controllers\ArchiveController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\CabinetController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DocumentSearchController;
use App\Http\Controllers\DrawerController;
use App\Http\Controllers\GlobalSearchController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard/index')->name('dashboard');
    Route::get('documents', [DocumentController::class, 'index'])->name('documents.index');
    Route::post('documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::get('documents/search', DocumentSearchController::class)->name('documents.search');
    Route::get('search', GlobalSearchController::class)->name('system.search');
    Route::get('documents/declaration-numbers', [DocumentController::class, 'declarationNumbers'])->name('documents.declaration-numbers');
    Route::get('documents/{document}/history', [DocumentController::class, 'history'])->name('documents.history');
    Route::get('documents/{document}/ocr', [DocumentController::class, 'ocr'])->name('documents.ocr');
    Route::post('documents/{document}/map', [DocumentController::class, 'map'])->name('documents.map');
    Route::put('documents/{document}/fields', [DocumentController::class, 'saveFields'])->name('documents.fields');
    Route::get('documents/{document}/ocr-pdf', [DocumentController::class, 'ocrPdf'])->name('documents.ocr-pdf');
    Route::get('documents/{document}/chain', [DocumentController::class, 'chain'])->name('documents.chain');
    Route::patch('documents/{document}', [DocumentController::class, 'update'])->name('documents.update');
    Route::get('documents/{document}/thumbnail', [DocumentController::class, 'thumbnail'])->name('documents.thumbnail');
    Route::get('documents/{document}/view', [DocumentController::class, 'view'])->name('documents.view');
    Route::get('archive', [ArchiveController::class, 'index'])->name('archive.index');
    Route::get('archive/books/{book}', [ArchiveController::class, 'book'])->name('archive.books.show');
    Route::get('archive/documents', [ArchiveController::class, 'locate'])->name('archive.documents.locate');
    Route::get('manage/cabinets', [CabinetController::class, 'index'])->name('manage.cabinets.index');
    Route::post('manage/cabinets', [CabinetController::class, 'store'])->name('manage.cabinets.store');
    Route::patch('manage/cabinets/{cabinet}', [CabinetController::class, 'update'])->name('manage.cabinets.update');
    Route::patch('manage/drawers/{drawer}', [DrawerController::class, 'update'])->name('manage.drawers.update');
    Route::post('manage/drawers/{drawer}/books', [BookController::class, 'store'])->name('manage.drawers.books.store');
    Route::get('manage/books', [BookController::class, 'index'])->name('manage.books.index');
    Route::patch('manage/books/{book}', [BookController::class, 'update'])->name('manage.books.update');
    Route::redirect('archive/cabinets', '/manage/cabinets');
    Route::redirect('archive/books', '/manage/books');
    Route::redirect('filing-cabinets', '/archive');
    Route::inertia('bookmarks', 'bookmarks/index')->name('bookmarks.index');
});

require __DIR__.'/settings.php';
