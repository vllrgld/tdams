<?php

namespace Tests\Feature\Documents;

use App\Models\Book;
use App\Models\Document;
use App\Models\DocumentRoute;
use App\Models\Office;
use App\Models\User;
use App\Services\Documents\DocumentOfficeActions;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentLocationTest extends TestCase
{
    use RefreshDatabase;

    public function test_location_is_private_office_scoped_and_does_not_add_audit_entries(): void
    {
        $office = Office::factory()->create();
        $document = $this->document($office);
        $count = $document->audits()->count();
        $this->getJson(route('documents.location', $document))->assertUnauthorized();
        $this->actingAs(User::factory()->unverified()->create())->withSession(['current_office_id' => $office->id])->getJson(route('documents.location', $document))->assertForbidden();
        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => Office::query()->where('is_receiving', true)->sole()->id])->getJson(route('documents.location', $document))->assertNotFound();
        $this->withSession(['current_office_id' => $office->id])->getJson(route('documents.location', $document))->assertOk()->assertJsonPath('office.id', $office->id);
        $this->assertSame($count, $document->audits()->count());
    }

    public function test_fixed_routing_shows_all_steps_and_actual_transit_and_receipt(): void
    {
        $this->freezeTime();
        $source = Office::factory()->create();
        $last = Office::factory()->create();
        $route = DocumentRoute::factory()->create();
        foreach ([$source, $last] as $index => $office) {
            $route->steps()->create(['name' => $office->name, 'office_id' => $office->id, 'position' => $index + 1]);
        }
        $document = $this->document($source, ['document_route_id' => $route->id]);
        $user = User::factory()->create();
        app(DocumentOfficeActions::class)->release($document->id, $source, $user, null);
        $this->actingAs($user)->withSession(['current_office_id' => $source->id])->getJson(route('documents.location', $document))
            ->assertNotFound();
        app(DocumentOfficeActions::class)->receive($document->id, $last, $user);
        $this->withSession(['current_office_id' => $last->id])->getJson(route('documents.location', $document))
            ->assertOk()->assertJsonPath('office.id', $last->id)->assertJsonPath('destination', null)
            ->assertJsonCount(2, 'routing.steps')->assertJsonPath('routing.steps.0.office.id', $source->id)
            ->assertJsonPath('routing.steps.1.office.id', $last->id)
            ->assertJsonPath('transfers.0.receivedAt', now()->toIso8601String());
    }

    public function test_unfixed_history_keeps_repeat_offices_and_archive_link_targets_the_current_book(): void
    {
        $first = Office::query()->where('is_receiving', true)->sole();
        $second = Office::factory()->create();
        $user = User::factory()->create();
        $book = Book::factory()->create(['label' => 'Letters']);
        $document = $this->document($first, ['filing_path' => 'archive', 'book_id' => $book->id]);
        $this->actingAs($user)->getJson(route('documents.location', $document))->assertOk()
            ->assertJsonPath('archive.bookId', (string) $book->id)->assertJsonPath('archive.item', 'Letters')
            ->assertJsonPath('archive.cabinet', $book->drawer->cabinet->name);
        $actions = app(DocumentOfficeActions::class);
        foreach ([[$first, $second], [$second, $first], [$first, $second]] as [$from, $to]) {
            $actions->release($document->id, $from, $user, $to->id);
            $actions->receive($document->id, $to, $user);
        }
        $this->withSession(['current_office_id' => $second->id])->getJson(route('documents.location', $document))
            ->assertOk()->assertJsonPath('routing', null)->assertJsonCount(3, 'transfers')
            ->assertJsonPath('transfers.0.from.id', $first->id)->assertJsonPath('transfers.1.to.id', $first->id)
            ->assertJsonPath('transfers.2.to.id', $second->id)->assertJsonPath('archive', null);
    }

    /** @param array<string, mixed> $attributes */
    private function document(Office $office, array $attributes = []): Document
    {
        return app(DocumentWriter::class)->create(['office_id' => $office->id, 'filing_path' => 'route', 'original_filename' => 'location.pdf', 'storage_path' => 'documents/location.pdf', 'mime_type' => 'application/pdf', 'file_size' => 1024, 'uploaded_by' => User::factory()->create()->id, 'ocr_status' => 'completed', ...$attributes]);
    }
}
