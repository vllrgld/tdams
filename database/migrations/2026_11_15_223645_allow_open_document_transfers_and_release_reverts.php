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
        Schema::table('document_transfers', function (Blueprint $table) {
            $table->unsignedBigInteger('to_office_id')->nullable()->change();
            $table->timestamp('reverted_at')->nullable();
            $table->foreignId('reverted_by')->nullable()->constrained('users')->nullOnDelete();
        });

        DB::table('document_transfers')->whereNull('received_at')
            ->whereIn('document_id', DB::table('documents')->whereNull('document_route_id')->select('id'))
            ->update(['to_office_id' => null]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::table('document_transfers')->whereNull('to_office_id')->exists()) {
            throw new RuntimeException('Open transfers must have a recorded destination before rolling back this migration.');
        }

        Schema::table('document_transfers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reverted_by');
            $table->dropColumn('reverted_at');
            $table->unsignedBigInteger('to_office_id')->nullable(false)->change();
        });
    }
};
