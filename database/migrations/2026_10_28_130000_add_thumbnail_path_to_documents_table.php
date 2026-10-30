<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('documents', 'thumbnail_path')) {
            return;
        }

        Schema::table('documents', function (Blueprint $table) {
            $table->string('thumbnail_path')->nullable()->after('ocr_pdf_size');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('documents', 'thumbnail_path')) {
            return;
        }

        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn('thumbnail_path');
        });
    }
};
