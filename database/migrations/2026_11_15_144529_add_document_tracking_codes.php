<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('tracking_code', 40)->nullable()->unique();
        });

        Schema::create('tracking_code_settings', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary();
            $table->string('prefix', 10);
            $table->timestamps();
        });

        DB::table('tracking_code_settings')->insert(['id' => 1, 'prefix' => 'DTMS', 'created_at' => now(), 'updated_at' => now()]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tracking_code_settings');
        Schema::table('documents', function (Blueprint $table) {
            $table->dropUnique(['tracking_code']);
            $table->dropColumn('tracking_code');
        });
    }
};
