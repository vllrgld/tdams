<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        Schema::create('passkeys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('credential_id')->unique();
            $table->json('credential');
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            $table->index('user_id');
        });

        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->bigInteger('expiration')->index();
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->bigInteger('expiration')->index();
        });

        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedSmallInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->string('connection');
            $table->string('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
            $table->index(['connection', 'queue', 'failed_at']);
        });

        Schema::create('cabinets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('location');
            $table->timestamps();
        });

        Schema::create('drawers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cabinet_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('range')->nullable();
            $table->unsignedTinyInteger('position');
            $table->timestamps();
        });

        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drawer_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('cover_title', 80)->default('Tax Declaration');
            $table->unsignedTinyInteger('position');
            $table->timestamps();
            $table->unique(['drawer_id', 'position']);
        });

        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('pin')->nullable()->unique();
            $table->string('lot_number')->nullable();
            $table->string('title_number')->nullable();
            $table->decimal('area', 14, 4)->nullable();
            $table->string('province')->nullable();
            $table->string('street')->nullable();
            $table->string('barangay')->nullable();
            $table->string('district')->nullable();
            $table->string('municipality')->nullable();
            $table->string('boundary_north')->nullable();
            $table->string('boundary_northeast')->nullable();
            $table->string('boundary_east')->nullable();
            $table->string('boundary_southeast')->nullable();
            $table->string('boundary_south')->nullable();
            $table->string('boundary_southwest')->nullable();
            $table->string('boundary_west')->nullable();
            $table->string('boundary_northwest')->nullable();
            $table->timestamps();
        });

        Schema::create('owners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('normalized_name')->index();
            $table->string('street')->nullable();
            $table->string('barangay')->nullable();
            $table->string('district')->nullable();
            $table->string('municipality')->nullable();
            $table->timestamps();
        });

        Schema::create('tax_declarations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->nullable()->constrained()->nullOnDelete();
            $table->string('tax_declaration_number')->nullable()->unique();
            $table->date('declaration_date')->nullable();
            $table->unsignedBigInteger('previous_declaration_id')->nullable();
            $table->string('previous_tax_declaration_number')->nullable();
            $table->date('previous_declaration_date')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::table('tax_declarations', function (Blueprint $table) {
            $table->foreign('previous_declaration_id')
                ->references('id')
                ->on('tax_declarations')
                ->nullOnDelete();
        });

        Schema::create('declaration_owners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tax_declaration_id')->constrained()->cascadeOnDelete();
            $table->foreignId('owner_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->unique(['tax_declaration_id', 'owner_id']);
            $table->unique(['tax_declaration_id', 'position']);
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('position')->nullable();
            $table->foreignId('tax_declaration_id')->nullable()->constrained()->nullOnDelete();
            $table->string('original_filename');
            $table->string('storage_path');
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ocr_status')->default('pending');
            $table->longText('ocr_text')->nullable();
            $table->json('ocr_pages')->nullable();
            $table->json('ocr_regions')->nullable();
            $table->string('ocr_pdf_path')->nullable();
            $table->unsignedBigInteger('ocr_pdf_size')->nullable();
            $table->string('thumbnail_path')->nullable();
            $table->text('ocr_error')->nullable();
            $table->timestamp('ocr_completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('ocr_settings', function (Blueprint $table) {
            $table->id();
            $table->string('driver', 32)->default('local');
            $table->string('job_url')->nullable();
            $table->text('token')->nullable();
            $table->string('model', 100)->nullable();
            $table->unsignedTinyInteger('optimize')->default(3);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ocr_settings');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('declaration_owners');
        Schema::table('tax_declarations', function (Blueprint $table) {
            $table->dropForeign(['previous_declaration_id']);
        });
        Schema::dropIfExists('tax_declarations');
        Schema::dropIfExists('owners');
        Schema::dropIfExists('properties');
        Schema::dropIfExists('books');
        Schema::dropIfExists('drawers');
        Schema::dropIfExists('cabinets');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('passkeys');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
