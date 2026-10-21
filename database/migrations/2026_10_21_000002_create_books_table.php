<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drawer_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->unsignedTinyInteger('position');
            $table->timestamps();

            $table->unique(['drawer_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
