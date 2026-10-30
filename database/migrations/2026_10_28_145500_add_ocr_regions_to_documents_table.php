<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('documents', 'ocr_regions')) {
            return;
        }

        Schema::table('documents', function (Blueprint $table) {
            $table->json('ocr_regions')->nullable()->after('ocr_pages');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('documents', 'ocr_regions')) {
            return;
        }

        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn('ocr_regions');
        });
    }
};
