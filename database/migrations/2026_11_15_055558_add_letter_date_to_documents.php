<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('documents', 'letter_date')) {
            return;
        }

        Schema::table('documents', function (Blueprint $table) {
            $table->date('letter_date')->nullable()->after('title');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('documents', 'letter_date')) {
            return;
        }

        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn('letter_date');
        });
    }
};
