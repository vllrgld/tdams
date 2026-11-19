<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('document_attachments')) {
            return;
        }

        if (
            Schema::hasColumn('document_attachments', 'description')
            && ! Schema::hasColumn('document_attachments', 'original_filename')
        ) {
            return;
        }

        if (! Schema::hasColumn('document_attachments', 'description')) {
            Schema::table('document_attachments', function (Blueprint $table) {
                $table->string('description')->default('');
            });
        }

        if (! Schema::hasColumn('document_attachments', 'original_filename')) {
            return;
        }

        foreach (DB::table('document_attachments')->orderBy('id')->get() as $row) {
            $description = is_string($row->description) && $row->description !== ''
                ? $row->description
                : (string) $row->original_filename;

            if (is_string($row->storage_path) && $row->storage_path !== '') {
                Storage::disk('local')->delete($row->storage_path);
            }

            DB::table('document_attachments')->where('id', $row->id)->update([
                'description' => $description,
            ]);
        }

        Schema::table('document_attachments', function (Blueprint $table) {
            $table->dropColumn(['original_filename', 'storage_path', 'mime_type', 'file_size']);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('document_attachments')) {
            return;
        }

        if (Schema::hasColumn('document_attachments', 'original_filename')) {
            return;
        }

        Schema::table('document_attachments', function (Blueprint $table) {
            $table->string('original_filename')->default('');
            $table->string('storage_path')->default('');
            $table->string('mime_type')->default('application/octet-stream');
            $table->unsignedInteger('file_size')->default(0);
        });

        foreach (DB::table('document_attachments')->orderBy('id')->get() as $row) {
            DB::table('document_attachments')->where('id', $row->id)->update([
                'original_filename' => is_string($row->description) && $row->description !== ''
                    ? $row->description
                    : 'attachment',
            ]);
        }

        if (Schema::hasColumn('document_attachments', 'description')) {
            Schema::table('document_attachments', function (Blueprint $table) {
                $table->dropColumn('description');
            });
        }
    }
};
