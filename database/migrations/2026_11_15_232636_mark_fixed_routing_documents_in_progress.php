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
        DB::table('documents')->whereNotNull('document_route_id')->where('status', 'under_review')
            ->whereIn('document_type_id', DB::table('document_types')->where('uses_tax_declaration_fields', false)->select('id'))
            ->orderBy('id')->chunkById(100, function (Collection $documents): void {
                DB::transaction(function () use ($documents): void {
                    $pending = DB::table('documents')->whereIn('id', $documents->pluck('id'))
                        ->whereNotNull('document_route_id')->where('status', 'under_review')
                        ->whereIn('document_type_id', DB::table('document_types')->where('uses_tax_declaration_fields', false)->select('id'))
                        ->lockForUpdate()->get();
                    foreach ($pending as $document) {
                        DB::table('documents')->where('id', $document->id)->update(['status' => 'in_progress']);
                        DB::table('document_audits')->insert([
                            'document_id' => $document->id, 'document_reference' => $document->id,
                            'action' => 'status_updated', 'actor_type' => 'system', 'actor_name' => 'System',
                            'context' => json_encode(['reason' => 'fixed_routing'], JSON_THROW_ON_ERROR),
                            'changes' => json_encode(['status' => ['before' => 'Under review', 'after' => 'In progress']], JSON_THROW_ON_ERROR),
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
        // Keep corrected statuses and their audit history when rolling back.
    }
};
