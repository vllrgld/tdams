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
        Schema::table('offices', function (Blueprint $table) {
            $table->boolean('can_manage_routing')->default(false);
            $table->boolean('can_route_documents')->default(false);
            $table->boolean('is_receiving')->default(false);
        });

        $now = now();
        $paName = "Provincial Administrator's Office";

        DB::table('offices')->insertOrIgnore([
            'name' => $paName,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('offices')->where('name', $paName)->update([
            'can_manage_routing' => true,
            'can_route_documents' => true,
        ]);
        DB::table('offices')->insertOrIgnore([
            'name' => 'Receiving Office',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('offices')->where('name', 'Receiving Office')->update(['is_receiving' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('offices', function (Blueprint $table) {
            $table->dropColumn(['can_manage_routing', 'can_route_documents', 'is_receiving']);
        });
    }
};
