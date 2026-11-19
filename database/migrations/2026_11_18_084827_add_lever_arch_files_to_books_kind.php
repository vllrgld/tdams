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
        Schema::table('books', function (Blueprint $table): void {
            $table->enum('kind', ['book', 'folder', 'lever_arch'])->default('book')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::table('books')->where('kind', 'lever_arch')->exists()) {
            throw new RuntimeException('Move or remove lever arch files before rolling back their filing type.');
        }

        Schema::table('books', function (Blueprint $table): void {
            $table->enum('kind', ['book', 'folder'])->default('book')->change();
        });
    }
};
