<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->date('declaration_date')->nullable()->after('tax_declaration_number');
            $table->date('previous_declaration_date')->nullable()->after('previous_tax_declaration_number');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn([
                'declaration_date',
                'previous_declaration_date',
            ]);
        });
    }
};
