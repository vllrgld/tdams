<?php

namespace Tests\Feature\Manage;

use App\Models\Book;
use App\Models\Cabinet;
use App\Models\Document;
use App\Models\Office;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ArchiveOfficeMigrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->artisan('migrate:fresh', ['--force' => true])->assertSuccessful();
        $this->beforeApplicationDestroyed(static function (): void {
            RefreshDatabaseState::$migrated = false;
        });
    }

    public function test_existing_archives_are_assigned_to_their_documents_office_and_shared_structures_are_split_without_losing_placement(): void
    {
        $receiving = Office::query()->where('is_receiving', true)->sole();
        $other = Office::factory()->create();
        $cabinet = Cabinet::factory()->for($receiving)->withDrawers(2)->create(['name' => 'Legacy cabinet']);
        $empty = Cabinet::factory()->for($receiving)->withDrawers(1)->create(['name' => 'Empty cabinet']);
        $book = $cabinet->drawers[0]->books()->create(['label' => 'Book', 'kind' => 'book', 'position' => 1]);
        $folder = $cabinet->drawers[1]->books()->create(['label' => 'Folder', 'kind' => 'folder', 'position' => 1]);
        $user = User::factory()->create();
        $first = $this->document($user, $book, $receiving, 1);
        $second = $this->document($user, $book, $other, 2);
        $third = $this->document($user, $folder, $other, 1);
        $unassigned = $this->document($user, $folder, $receiving, 2);
        DB::table('documents')->where('id', $unassigned->id)->update(['office_id' => null]);
        $migration = require database_path('migrations/2026_11_15_182115_add_office_id_to_cabinets_table.php');

        $migration->down();
        $migration->up();

        $this->assertDatabaseCount('cabinets', 3);
        $this->assertSame($receiving->id, $cabinet->refresh()->office_id);
        $this->assertSame($receiving->id, $empty->refresh()->office_id);
        $this->assertSame($book->id, $first->refresh()->book_id);
        $this->assertSame($folder->id, $unassigned->refresh()->book_id);
        $this->assertSame($receiving->id, $unassigned->office_id);
        $copy = Cabinet::query()->forOffice($other->id)->sole();
        $this->assertSame('Legacy cabinet', $copy->name);
        $this->assertSame(2, $copy->drawers()->count());
        $this->assertSame($copy->id, $second->refresh()->book->drawer->cabinet_id);
        $this->assertSame($copy->id, $third->refresh()->book->drawer->cabinet_id);
        $this->assertSame('book', $second->book->kind);
        $this->assertSame('folder', $third->book->kind);
        $this->assertSame($book->cover_title, $second->book->cover_title);
        $this->assertSame($folder->label, $third->book->label);
        $this->assertSame(2, $second->position);
        $this->assertSame(1, $third->position);
        $this->assertSame(1, $second->book->position);
        $this->assertSame(2, $third->book->drawer->position);
        $this->assertDatabaseCount('documents', 4);
    }

    private function document(User $user, Book $book, Office $office, int $position): Document
    {
        return app(DocumentWriter::class)->create([
            'office_id' => $office->id,
            'book_id' => $book->id,
            'position' => $position,
            'original_filename' => 'legacy.pdf',
            'storage_path' => 'documents/legacy.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'uploaded_by' => $user->id,
        ]);
    }
}
