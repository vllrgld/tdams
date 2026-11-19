<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('document_endorsements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('routing_version');
            $table->foreignId('document_route_step_id')->constrained()->cascadeOnDelete();
            $table->foreignId('office_id')->constrained()->cascadeOnDelete();
            $table->foreignId('endorsed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('endorsed_at');
            $table->unique(['document_id', 'routing_version', 'document_route_step_id', 'office_id'], 'document_endorsement_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_endorsements');
    }
};
