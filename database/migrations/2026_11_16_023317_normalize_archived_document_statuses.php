<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $labels = ['under_review' => 'Under review', 'in_progress' => 'In progress', 'approved' => 'Approved', 'disapproved' => 'Disapproved', 'completed' => 'Completed'];

        DB::table('documents')->where('filing_path', 'archive')->where('status', '!=', 'archived')
            ->chunkById(100, function (Collection $documents) use ($labels): void {
                DB::transaction(function () use ($documents, $labels): void {
                    $archives = DB::table('documents')->whereIn('id', $documents->pluck('id'))
                        ->where('filing_path', 'archive')->where('status', '!=', 'archived')
                        ->lockForUpdate()->get();
                    foreach ($archives as $document) {
                        DB::table('documents')->where('id', $document->id)->update(['status' => 'archived']);
                        DB::table('document_audits')->insert([
                            'document_id' => $document->id, 'document_reference' => $document->id,
                            'action' => 'status_updated', 'actor_type' => 'system', 'actor_name' => 'System',
                            'context' => json_encode(['reason' => 'archive_upload'], JSON_THROW_ON_ERROR),
                            'changes' => json_encode(['status' => ['before' => $labels[$document->status] ?? $document->status, 'after' => 'Archived']], JSON_THROW_ON_ERROR),
                            'imported' => false, 'occurred_at' => now(),
                        ]);
                    }
                });
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Retain corrected archive statuses and their audit history on rollback.
    }
};
