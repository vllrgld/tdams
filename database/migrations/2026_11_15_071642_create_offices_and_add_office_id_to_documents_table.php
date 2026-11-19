<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offices', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->timestamps();
        });

        $now = now();
        $officeId = DB::table('offices')->insertGetId([
            'name' => 'Receiving Office',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('office_id')->nullable()->after('id')->constrained()->restrictOnDelete();
        });

        DB::table('documents')->whereNull('office_id')->update(['office_id' => $officeId]);
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('office_id');
        });

        Schema::dropIfExists('offices');
    }
};
