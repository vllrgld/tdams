<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('ocr_status')->default('pending');
            $table->longText('ocr_text')->nullable();
            $table->json('ocr_pages')->nullable();
            $table->text('ocr_error')->nullable();
            $table->timestamp('ocr_completed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn([
                'ocr_status',
                'ocr_text',
                'ocr_pages',
                'ocr_error',
                'ocr_completed_at',
            ]);
        });
    }
};
