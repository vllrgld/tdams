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
        Schema::create('document_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('document_reference');
            $table->string('action', 50);
            $table->string('actor_type', 16);
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_name')->nullable();
            $table->foreignId('actor_office_id')->nullable()->constrained('offices')->nullOnDelete();
            $table->string('actor_office_name', 100)->nullable();
            $table->json('context');
            $table->json('changes');
            $table->boolean('imported')->default(false);
            $table->timestamp('occurred_at', 6);
            $table->index(['document_id', 'occurred_at', 'id']);
        });

        $users = DB::table('users')->pluck('name', 'id');
        $offices = DB::table('offices')->pluck('name', 'id');
        DB::table('documents')->orderBy('id')->chunkById(100, function ($documents) use ($users): void {
            foreach ($documents as $document) {
                DB::table('document_audits')->insert([
                    'document_id' => $document->id,
                    'document_reference' => $document->id,
                    'action' => 'uploaded',
                    'actor_type' => 'user',
                    'actor_id' => $document->uploaded_by,
                    'actor_name' => $users[$document->uploaded_by] ?? null,
                    'actor_office_id' => null,
                    'actor_office_name' => null,
                    'context' => json_encode(['fileName' => $document->original_filename, 'fileSize' => $document->file_size, 'office' => null, 'location' => null], JSON_THROW_ON_ERROR),
                    'changes' => '[]',
                    'imported' => true,
                    'occurred_at' => $document->created_at ?? now(),
                ]);
            }
        });
        DB::table('document_transfers')->orderBy('id')->chunkById(100, function ($transfers) use ($users, $offices): void {
            foreach ($transfers as $transfer) {
                foreach (['released', 'received'] as $action) {
                    $at = $action === 'released' ? $transfer->released_at : $transfer->received_at;
                    if ($at === null) {
                        continue;
                    }
                    $actorId = $action === 'released' ? $transfer->released_by : $transfer->received_by;
                    $officeId = $action === 'released' ? $transfer->from_office_id : $transfer->to_office_id;
                    $from = ['id' => $transfer->from_office_id, 'name' => $offices[$transfer->from_office_id] ?? 'Unknown office'];
                    $to = ['id' => $transfer->to_office_id, 'name' => $offices[$transfer->to_office_id] ?? 'Unknown office'];
                    DB::table('document_audits')->insert([
                        'document_id' => $transfer->document_id,
                        'document_reference' => $transfer->document_id,
                        'action' => $action,
                        'actor_type' => 'user',
                        'actor_id' => $actorId,
                        'actor_name' => $users[$actorId] ?? null,
                        'actor_office_id' => $officeId,
                        'actor_office_name' => $offices[$officeId] ?? null,
                        'context' => json_encode(['fromOffice' => $from, 'toOffice' => $to, 'office' => $action === 'released' ? $from : $to, 'transferId' => $transfer->id], JSON_THROW_ON_ERROR),
                        'changes' => '[]',
                        'imported' => true,
                        'occurred_at' => $at,
                    ]);
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_audits');
    }
};
