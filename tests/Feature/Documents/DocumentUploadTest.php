<?php

namespace Tests\Feature\Documents;

use App\Jobs\OcrDocument;
use App\Models\Book;
use App\Models\Cabinet;
use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DocumentUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();
    }

    public function test_authenticated_user_can_upload_a_document_with_property_details(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $book = $this->bookForUpload();

        $response = $this->actingAs($user)->post(route('documents.store'), [
            'file' => UploadedFile::fake()->create('declaration.pdf', 1024, 'application/pdf'),
            'book_id' => $book->id,
            'tax_declaration_number' => 'TD-2026-00481',
            'declaration_date' => '2026-03-15',
            'lot_number' => 'LOT-0182',
            'registered_owner' => 'Sample Owner',
            'municipality' => 'Laoag City',
            'barangay' => 'Barangay 1',
            'previous_tax_declaration_number' => 'TD-2020-00123',
            'previous_declaration_date' => '2020-06-01',
            'title_number' => 'T-12345',
            'property_location_street' => 'Rizal Street',
            'property_location_barangay' => 'Barangay 2',
            'property_location_district' => 'District 1',
            'property_location_municipality' => 'Laoag City',
            'owner_address_street' => 'Bonifacio Street',
            'owner_address_barangay' => 'Barangay 3',
            'owner_address_district' => 'District 2',
            'owner_address_city_municipality' => 'Batac City',
            'province' => 'Ilocos Norte',
            'pin' => '012-34-567-890',
            'boundary_north' => 'Road',
            'boundary_south' => 'Lot 12',
            'boundary_east' => 'Creek',
            'boundary_west' => 'Lot 10',
            'area' => '1250.5000',
            'remarks' => 'Sample remarks',
        ]);

        $response->assertRedirect(route('documents.index'));

        $document = Document::query()->sole();

        $this->assertSame('TD-2026-00481', $document->tax_declaration_number);
        $this->assertSame('2026-03-15', $document->declaration_date?->toDateString());
        $this->assertSame('LOT-0182', $document->lot_number);
        $this->assertSame('Sample Owner', $document->registered_owner);
        $this->assertSame('TD-2020-00123', $document->previous_tax_declaration_number);
        $this->assertSame('2020-06-01', $document->previous_declaration_date?->toDateString());
        $this->assertSame('T-12345', $document->title_number);
        $this->assertSame('Rizal Street', $document->property_location_street);
        $this->assertSame('Barangay 2', $document->property_location_barangay);
        $this->assertSame('Bonifacio Street', $document->owner_address_street);
        $this->assertSame('012-34-567-890', $document->pin);
        $this->assertEquals(1250.5, (float) $document->area);
        $this->assertSame('Road', $document->boundary_north);
        $this->assertSame('Sample remarks', $document->remarks);
        $this->assertSame($user->id, $document->uploaded_by);
        $this->assertSame($book->id, $document->book_id);
        $this->assertSame(1, $document->position);
        Storage::disk('local')->assertExists($document->storage_path);
    }

    public function test_upload_queues_ocr_and_leaves_the_document_pending(): void
    {
        Storage::fake('local');
        Queue::fake();

        $this->actingAs(User::factory()->create())
            ->post(route('documents.store'), [
                'file' => UploadedFile::fake()->create('scan.pdf', 512, 'application/pdf'),
                'book_id' => $this->bookForUpload()->id,
            ])
            ->assertRedirect(route('documents.index'));

        $document = Document::query()->sole();

        $this->assertSame('pending', $document->ocr_status);
        $this->assertNull($document->ocr_text);
        Queue::assertPushed(OcrDocument::class, function (OcrDocument $job) use ($document): bool {
            return $job->documentId === $document->id;
        });
    }

    public function test_document_metadata_is_optional_when_uploading_a_file(): void
    {
        Storage::fake('local');

        $book = $this->bookForUpload();

        $response = $this->actingAs(User::factory()->create())
            ->post(route('documents.store'), [
                'file' => UploadedFile::fake()->create('scan.pdf', 512, 'application/pdf'),
                'book_id' => $book->id,
            ]);

        $response->assertRedirect(route('documents.index'));
        $document = Document::query()->where('original_filename', 'scan.pdf')->first();
        $this->assertNotNull($document);
        $this->assertNull($document->tax_declaration_number);
        $this->assertNull($document->registered_owner);
        $this->assertDatabaseCount('tax_declarations', 0);
    }

    public function test_unsupported_files_are_rejected(): void
    {
        Storage::fake('local');

        $response = $this->actingAs(User::factory()->create())
            ->post(route('documents.store'), [
                'file' => UploadedFile::fake()->create('notes.txt', 10, 'text/plain'),
            ]);

        $response->assertSessionHasErrors('file');
        $this->assertDatabaseCount('documents', 0);
    }

    public function test_documents_page_lists_uploaded_archive_records(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $book = $this->bookForUpload();

        $this->actingAs($user)->post(route('documents.store'), [
            'file' => UploadedFile::fake()->create('declaration.pdf', 1024, 'application/pdf'),
            'book_id' => $book->id,
            'tax_declaration_number' => 'TD-2026-00481',
            'previous_tax_declaration_number' => 'TD-2020-00123',
            'property_location_barangay' => 'Barangay 2',
            'owner_address_city_municipality' => 'Batac City',
            'boundary_west' => 'Lot 10',
            'area' => '1250.5000',
            'remarks' => 'Survey note',
        ]);

        $this->actingAs($user)
            ->get(route('documents.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('documents/index')
                ->where('filters.q', '')
                ->where('filters.field', 'all')
                ->where('documents.total', 1)
                ->where('documents.data.0.taxDeclarationNumber', 'TD-2026-00481')
                ->where('documents.data.0.previousTaxDeclarationNumber', 'TD-2020-00123')
                ->where('documents.data.0.propertyLocationBarangay', 'Barangay 2')
                ->where('documents.data.0.ownerAddressCityMunicipality', 'Batac City')
                ->where('documents.data.0.boundaryWest', 'Lot 10')
                ->where('documents.data.0.area', '1250.5000')
                ->where('documents.data.0.remarks', 'Survey note')
                ->where('documents.data.0.originalFilename', 'declaration.pdf'));
    }

    public function test_authenticated_user_can_view_an_archived_document_inline(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('documents.store'), [
            'file' => UploadedFile::fake()->create('declaration.pdf', 1024, 'application/pdf'),
            'book_id' => $this->bookForUpload()->id,
            'tax_declaration_number' => 'TD-2026-00481',
        ]);
        $document = Document::query()->sole();

        $this->get(route('documents.view', $document))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Content-Disposition', 'inline; filename=declaration.pdf');
    }

    public function test_guests_cannot_view_an_archived_document(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('documents.store'), [
            'file' => UploadedFile::fake()->create('declaration.pdf', 1024, 'application/pdf'),
            'book_id' => $this->bookForUpload()->id,
        ]);
        $document = Document::query()->sole();
        auth()->logout();

        $this->get(route('documents.view', $document))
            ->assertRedirect(route('login'));
    }

    public function test_documents_in_a_book_are_ordered_by_upload_position(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $book = $this->bookForUpload();

        $this->actingAs($user)->post(route('documents.store'), [
            'file' => UploadedFile::fake()->create('first.pdf', 512, 'application/pdf'),
            'book_id' => $book->id,
            'tax_declaration_number' => 'TD-1',
        ]);
        $this->actingAs($user)->post(route('documents.store'), [
            'file' => UploadedFile::fake()->create('second.pdf', 512, 'application/pdf'),
            'book_id' => $book->id,
            'tax_declaration_number' => 'TD-2',
        ]);

        $this->assertSame(
            [1, 2],
            $book->documents()->pluck('position')->all(),
        );
        $this->assertSame(
            ['TD-1', 'TD-2'],
            $book->documents->pluck('tax_declaration_number')->all(),
        );
    }

    public function test_upload_requires_a_book(): void
    {
        Storage::fake('local');

        $this->actingAs(User::factory()->create())
            ->post(route('documents.store'), [
                'file' => UploadedFile::fake()->create('scan.pdf', 512, 'application/pdf'),
            ])
            ->assertSessionHasErrors('book_id');

        $this->assertDatabaseCount('documents', 0);
    }

    public function test_upload_rejects_an_unknown_book(): void
    {
        Storage::fake('local');

        $this->actingAs(User::factory()->create())
            ->post(route('documents.store'), [
                'file' => UploadedFile::fake()->create('scan.pdf', 512, 'application/pdf'),
                'book_id' => 999,
            ])
            ->assertSessionHasErrors('book_id');

        $this->assertDatabaseCount('documents', 0);
    }

    public function test_json_upload_returns_the_document_id_and_queues_ocr(): void
    {
        Storage::fake('local');
        $book = $this->bookForUpload();

        $response = $this->actingAs(User::factory()->create())
            ->post(route('documents.store'), [
                'file' => UploadedFile::fake()->create('declaration.pdf', 100, 'application/pdf'),
                'book_id' => $book->id,
            ], [
                'Accept' => 'application/json',
            ]);

        $response->assertOk()->assertJsonPath('id', Document::query()->sole()->id);
        Queue::assertPushed(OcrDocument::class);
        $this->assertSame('pending', Document::query()->sole()->ocr_status);
    }

    public function test_documents_page_includes_archive_placement_tree(): void
    {
        $user = User::factory()->create();
        $book = $this->bookForUpload();

        $this->actingAs($user)
            ->get(route('documents.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('documents/index')
                ->has('archive', 1)
                ->where('archive.0.drawers.0.books.0.id', (string) $book->id)
                ->where('archive.0.drawers.0.books.0.label', $book->label));
    }

    private function bookForUpload(): Book
    {
        $cabinet = Cabinet::factory()->withDrawers(1)->create();

        return $cabinet->drawers()->firstOrFail()->books()->create([
            'label' => 'Book 1',
            'position' => 1,
        ]);
    }
}
