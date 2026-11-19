<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_routes', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('document_route_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_route_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('position');
            $table->unique(['document_route_id', 'position']);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->string('filing_path', 16)->default('archive');
            $table->foreignId('document_route_id')->nullable()->constrained('document_routes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('document_route_id');
            $table->dropColumn('filing_path');
        });

        Schema::dropIfExists('document_route_steps');
        Schema::dropIfExists('document_routes');
    }
};
