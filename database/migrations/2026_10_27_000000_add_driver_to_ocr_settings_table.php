<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ocr_settings', function (Blueprint $table) {
            $table->string('driver', 32)->default('local')->after('id');
            $table->string('job_url')->nullable()->after('driver');
            $table->text('token')->nullable()->after('job_url');
            $table->string('model', 100)->nullable()->after('token');
        });
    }

    public function down(): void
    {
        Schema::table('ocr_settings', function (Blueprint $table) {
            $table->dropColumn(['driver', 'job_url', 'token', 'model']);
        });
    }
};
