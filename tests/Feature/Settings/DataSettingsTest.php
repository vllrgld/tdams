<?php

namespace Tests\Feature\Settings;

use App\Models\Book;
use App\Models\Document;
use App\Models\OcrSetting;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery;
use PHPUnit\Framework\Attributes\TestWith;
use RuntimeException;
use Tests\TestCase;

class DataSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_data_page_shows_archive_counts(): void
    {
        $user = User::factory()->create();
        $this->document($user);

        $this->actingAs($user)->get(route('data.edit'))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('settings/data')
            ->where('canResetData', true)
            ->where('counts.documents', 1)
            ->where('counts.declarations', 1)
            ->where('counts.cabinets', 1)
            ->where('counts.books', 1));
    }

    public function test_guests_cannot_view_or_reset_data(): void
    {
        $this->get(route('data.edit'))->assertRedirect(route('login'));
        $this->delete(route('data.destroy'), ['confirmation' => 'RESET'])->assertRedirect(route('login'));
    }

    public function test_production_does_not_expose_or_allow_reset(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/sample.jpg', 'original');
        $user = User::factory()->create();
        $this->document($user);
        $this->app->instance('env', 'production');

        $this->actingAs($user)->get(route('data.edit'))->assertNotFound();
        $this->withSession(['_token' => 'reset-test-token'])
            ->delete(route('data.destroy'), ['confirmation' => 'RESET', '_token' => 'reset-test-token'])
            ->assertNotFound();
        $this->get(route('ocr.edit'))->assertInertia(fn (Assert $page) => $page->where('canResetData', false));

        $this->assertDatabaseCount('documents', 1);
        Storage::disk('local')->assertExists('documents/sample.jpg');
    }

    #[TestWith([''])]
    #[TestWith(['reset'])]
    #[TestWith(['DELETE'])]
    public function test_reset_requires_explicit_confirmation(string $confirmation): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/sample.jpg', 'original');
        $user = User::factory()->create();
        $this->document($user);

        $this->actingAs($user)->from(route('data.edit'))
            ->delete(route('data.destroy'), ['confirmation' => $confirmation])
            ->assertRedirect(route('data.edit'))
            ->assertSessionHasErrors(['confirmation' => 'Type RESET to confirm the archive reset.']);

        $this->assertDatabaseCount('documents', 1);
        Storage::disk('local')->assertExists('documents/sample.jpg');
    }

    public function test_reset_clears_archive_and_private_documents_but_preserves_accounts_and_settings(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        $user = User::factory()->create(['remember_token' => 'keep-this-token']);
        $password = $user->getRawOriginal('password');
        $document = $this->document($user);
        $this->document($user, ['tax_declaration_number' => 'TD-2', 'previous_tax_declaration_number' => 'TD-1']);
        OcrSetting::current()->forceFill(['driver' => 'paddle', 'model' => OcrSetting::MODEL_VL, 'token' => 'keep-token'])->save();
        DB::table('passkeys')->insert([
            'user_id' => $user->id, 'name' => 'Keep passkey', 'credential_id' => 'keep-credential',
            'credential' => '{}', 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('sessions')->insert(['id' => 'keep-session', 'user_id' => $user->id, 'payload' => 'keep-payload', 'last_activity' => now()->timestamp]);
        DB::table('password_reset_tokens')->insert(['email' => $user->email, 'token' => 'keep-reset-token', 'created_at' => now()]);
        $migrationCount = DB::table('migrations')->count();
        foreach (['documents/sample.jpg', 'documents/ocr/'.$document->id.'.pdf', 'documents/thumbnails/'.$document->id.'.jpg', 'documents/orphan.pdf', 'unrelated/keep.txt'] as $path) {
            Storage::disk('local')->put($path, 'file contents');
        }
        Storage::disk('public')->put('keep.jpg', 'public file');

        $this->actingAs($user)->delete(route('data.destroy'), ['confirmation' => 'RESET'])
            ->assertRedirect(route('data.edit'))->assertSessionHasNoErrors()->assertSessionHas('status', 'archive-reset');

        foreach (['documents', 'tax_declarations', 'declaration_owners', 'properties', 'owners', 'books', 'drawers', 'cabinets'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
        $this->assertSame([], Storage::disk('local')->allFiles('documents'));
        Storage::disk('local')->assertExists('unrelated/keep.txt');
        Storage::disk('public')->assertExists('keep.jpg');
        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'password' => $password, 'remember_token' => 'keep-this-token']);
        $this->assertDatabaseHas('passkeys', ['credential_id' => 'keep-credential']);
        $this->assertDatabaseHas('sessions', ['id' => 'keep-session', 'payload' => 'keep-payload']);
        $this->assertDatabaseHas('password_reset_tokens', ['email' => $user->email, 'token' => 'keep-reset-token']);
        $this->assertDatabaseCount('migrations', $migrationCount);
        $this->assertSame('keep-token', OcrSetting::current()->resolvedToken());
        $this->assertSame(OcrSetting::MODEL_VL, OcrSetting::current()->resolvedModel());
    }

    #[TestWith(['pending'])]
    #[TestWith(['processing'])]
    public function test_active_ocr_prevents_records_and_files_being_cleared(string $status): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/sample.jpg', 'original');
        $user = User::factory()->create();
        $this->document($user, ['ocr_status' => $status]);

        $this->actingAs($user)->from(route('data.edit'))
            ->delete(route('data.destroy'), ['confirmation' => 'RESET'])
            ->assertSessionHasErrors(['confirmation' => 'Wait for OCR to finish before resetting the archive.']);

        $this->assertDatabaseCount('documents', 1);
        $this->assertDatabaseCount('books', 1);
        Storage::disk('local')->assertExists('documents/sample.jpg');
    }

    public function test_file_cleanup_failure_is_reported_and_a_repeat_reset_cleans_remaining_files(): void
    {
        $disk = Storage::fake('local');
        $disk->put('documents/orphan.pdf', 'original');
        $user = User::factory()->create();
        $this->document($user);
        $failingDisk = Mockery::mock($disk);
        $failingDisk->shouldReceive('delete')->once()->andReturnFalse();
        Storage::set('local', $failingDisk);
        Exceptions::fake();

        $this->actingAs($user)->from(route('data.edit'))
            ->delete(route('data.destroy'), ['confirmation' => 'RESET'])
            ->assertSessionHasErrors(['confirmation' => 'Archive records were cleared, but some stored files could not be removed. Try resetting again.']);

        $this->assertDatabaseCount('documents', 0);
        $disk->assertExists('documents/orphan.pdf');
        Exceptions::assertReported(RuntimeException::class);

        Storage::set('local', $disk);
        $this->delete(route('data.destroy'), ['confirmation' => 'RESET'])
            ->assertSessionHasNoErrors()->assertSessionHas('status', 'archive-reset');
        $disk->assertMissing('documents/orphan.pdf');
        $this->assertDatabaseCount('users', 1);
    }

    /** @param array<string, mixed> $attributes */
    private function document(User $user, array $attributes = []): Document
    {
        return app(DocumentWriter::class)->create([
            'original_filename' => 'sample.jpg', 'storage_path' => 'documents/sample.jpg', 'mime_type' => 'image/jpeg',
            'file_size' => 8, 'uploaded_by' => $user->id, 'ocr_status' => 'completed', 'ocr_text' => 'Tax declaration',
            'book_id' => Book::factory()->create()->id, 'tax_declaration_number' => 'TD-1',
            'registered_owner' => 'Sample Owner', 'lot_number' => '1543',
            ...$attributes,
        ]);
    }
}
