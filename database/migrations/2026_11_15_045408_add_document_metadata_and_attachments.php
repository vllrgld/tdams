<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('title')->nullable()->after('correspondent_id');
            $table->date('letter_date')->nullable()->after('title');
            $table->text('remarks')->nullable()->after('letter_date');
        });

        Schema::create('document_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->unsignedInteger('page')->nullable();
            $table->unsignedInteger('position');
            $table->timestamps();

            $table->unique(['document_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_attachments');

        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['title', 'letter_date', 'remarks']);
        });
    }
};
