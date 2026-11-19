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
        Schema::table('document_route_steps', function (Blueprint $table) {
            $table->foreignId('office_id')->nullable()->constrained()->restrictOnDelete();
            $table->boolean('can_take_action')->default(false);
            $table->boolean('needs_endorsement')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_route_steps', function (Blueprint $table) {
            $table->dropConstrainedForeignId('office_id');
            $table->dropColumn(['can_take_action', 'needs_endorsement']);
        });
    }
};
