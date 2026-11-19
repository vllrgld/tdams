<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $receivingId = DB::table('offices')->where('is_receiving', true)->value('id');

        if ($receivingId === null) {
            throw new LogicException('Configure the Receiving Office before assigning archive ownership.');
        }

        Schema::table('cabinets', function (Blueprint $table) {
            $table->foreignId('office_id')->nullable()->index()->constrained()->restrictOnDelete();
        });

        DB::transaction(function () use ($receivingId): void {
            DB::table('cabinets')->whereNull('office_id')->orderBy('id')->chunkById(100, function ($cabinets) use ($receivingId): void {
                foreach ($cabinets as $cabinet) {
                    $officeIds = DB::table('documents')
                        ->join('books', 'books.id', '=', 'documents.book_id')
                        ->join('drawers', 'drawers.id', '=', 'books.drawer_id')
                        ->where('drawers.cabinet_id', $cabinet->id)
                        ->whereNotNull('documents.office_id')
                        ->distinct()->orderBy('documents.office_id')->pluck('documents.office_id');
                    $ownerId = $officeIds->first() ?? $receivingId;
                    DB::table('cabinets')->where('id', $cabinet->id)->update(['office_id' => $ownerId]);

                    $drawers = DB::table('drawers')->where('cabinet_id', $cabinet->id)->orderBy('position')->get();

                    foreach ($drawers as $drawer) {
                        $bookIds = DB::table('books')->where('drawer_id', $drawer->id)->pluck('id');
                        DB::table('documents')->whereIn('book_id', $bookIds)->whereNull('office_id')->update(['office_id' => $ownerId]);
                    }

                    foreach ($officeIds->slice(1) as $officeId) {
                        $copyId = DB::table('cabinets')->insertGetId([
                            'office_id' => $officeId,
                            'name' => $cabinet->name,
                            'location' => $cabinet->location,
                            'created_at' => $cabinet->created_at,
                            'updated_at' => $cabinet->updated_at,
                        ]);

                        foreach ($drawers as $drawer) {
                            $drawerId = DB::table('drawers')->insertGetId([
                                'cabinet_id' => $copyId,
                                'label' => $drawer->label,
                                'range' => $drawer->range,
                                'position' => $drawer->position,
                                'created_at' => $drawer->created_at,
                                'updated_at' => $drawer->updated_at,
                            ]);

                            foreach (DB::table('books')->where('drawer_id', $drawer->id)->orderBy('position')->get() as $book) {
                                $bookId = DB::table('books')->insertGetId([
                                    'drawer_id' => $drawerId,
                                    'label' => $book->label,
                                    'kind' => $book->kind,
                                    'cover_title' => $book->cover_title,
                                    'position' => $book->position,
                                    'created_at' => $book->created_at,
                                    'updated_at' => $book->updated_at,
                                ]);
                                DB::table('documents')->where('book_id', $book->id)->where('office_id', $officeId)->update(['book_id' => $bookId]);
                            }
                        }
                    }
                }
            });
        });

        Schema::table('cabinets', function (Blueprint $table) {
            $table->foreignId('office_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('cabinets', function (Blueprint $table) {
            $table->dropForeign(['office_id']);
            $table->dropIndex(['office_id']);
            $table->dropColumn('office_id');
        });
    }
};
