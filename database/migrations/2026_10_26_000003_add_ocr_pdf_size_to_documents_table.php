<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->unsignedBigInteger('ocr_pdf_size')->nullable()->after('ocr_pdf_path');
        });

        DB::table('documents')
            ->whereNotNull('ocr_pdf_path')
            ->orderBy('id')
            ->lazy()
            ->each(function (object $document): void {
                $path = $document->ocr_pdf_path;

                if (! is_string($path) || $path === '' || ! Storage::disk('local')->exists($path)) {
                    return;
                }

                DB::table('documents')->where('id', $document->id)->update([
                    'ocr_pdf_size' => Storage::disk('local')->size($path),
                ]);
            });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn('ocr_pdf_size');
        });
    }
};
