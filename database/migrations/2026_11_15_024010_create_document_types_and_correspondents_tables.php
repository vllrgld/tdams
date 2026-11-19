<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->boolean('uses_tax_declaration_fields')->default(false);
            $table->timestamps();
        });

        Schema::create('correspondents', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        $now = now();

        DB::table('document_types')->insert([
            'name' => 'Tax declaration',
            'slug' => 'tax-declaration',
            'uses_tax_declaration_fields' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('document_type_id')->nullable()->constrained('document_types')->restrictOnDelete();
            $table->foreignId('correspondent_id')->nullable()->constrained('correspondents')->nullOnDelete();
        });

        $typeId = DB::table('document_types')->where('slug', 'tax-declaration')->value('id');

        DB::table('documents')->whereNull('document_type_id')->update([
            'document_type_id' => $typeId,
        ]);
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('correspondent_id');
            $table->dropConstrainedForeignId('document_type_id');
        });

        Schema::dropIfExists('correspondents');
        Schema::dropIfExists('document_types');
    }
};
