<?php

namespace Tests\Feature\Manage;

use App\Models\DocumentType;
use App\Models\Office;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DocumentTypesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withSession(['current_office_id' => Office::query()->where('name', Office::PA_NAME)->sole()->id]);
    }

    public function test_guests_are_redirected_from_document_types(): void
    {
        $this->get(route('manage.document-types.index'))->assertRedirect(route('login'));
    }

    public function test_authenticated_users_see_the_tax_declaration_type(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('manage.document-types.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('manage/document-types/index')
                ->has('types', 1)
                ->where('types.0.name', 'Tax declaration')
                ->where('types.0.slug', 'tax-declaration')
                ->where('types.0.usesTaxFields', true)
                ->where('types.0.editable', false)
                ->where('types.0.documentCount', 0));
    }

    public function test_authenticated_user_can_add_a_document_type(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('manage.document-types.store'), [
                'name' => 'Memorandum',
            ])
            ->assertRedirect(route('manage.document-types.index'));

        $type = DocumentType::query()->where('slug', 'memorandum')->first();

        $this->assertNotNull($type);
        $this->assertSame('Memorandum', $type->name);
        $this->assertFalse($type->uses_tax_declaration_fields);
    }

    public function test_a_document_type_name_is_required_and_unique(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('manage.document-types.store'), [])
            ->assertSessionHasErrors('name');

        $this->actingAs($user)
            ->post(route('manage.document-types.store'), [
                'name' => 'Tax declaration',
            ])
            ->assertSessionHasErrors('name');

        $this->assertSame(1, DocumentType::query()->count());
    }

    public function test_a_name_that_slugs_to_an_existing_type_gets_a_distinct_slug(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('manage.document-types.store'), [
                'name' => 'Tax declaration!',
            ])
            ->assertRedirect(route('manage.document-types.index'));

        $this->assertTrue(
            DocumentType::query()->where('slug', 'tax-declaration-2')->where('uses_tax_declaration_fields', false)->exists(),
        );
    }

    public function test_guests_cannot_edit_a_document_type(): void
    {
        $this->patch(route('manage.document-types.update', DocumentType::taxDeclaration()))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_rename_a_document_type(): void
    {
        $type = DocumentType::query()->create([
            'name' => 'Memorandum',
            'slug' => 'memorandum',
            'uses_tax_declaration_fields' => false,
        ]);

        $this->actingAs(User::factory()->create())
            ->patch(route('manage.document-types.update', $type), [
                'name' => 'Office memorandum',
            ])
            ->assertRedirect(route('manage.document-types.index'));

        $type->refresh();

        $this->assertSame('Office memorandum', $type->name);
        $this->assertSame('memorandum', $type->slug);
        $this->assertFalse($type->uses_tax_declaration_fields);
    }

    public function test_the_tax_declaration_type_cannot_be_edited(): void
    {
        $type = DocumentType::taxDeclaration();

        $this->actingAs(User::factory()->create())
            ->patch(route('manage.document-types.update', $type), [
                'name' => 'Renamed declaration',
            ])
            ->assertForbidden();

        $this->assertSame('Tax declaration', $type->refresh()->name);
    }

    public function test_an_edited_document_type_name_must_stay_unique(): void
    {
        $type = DocumentType::query()->create([
            'name' => 'Memorandum',
            'slug' => 'memorandum',
            'uses_tax_declaration_fields' => false,
        ]);

        $this->actingAs(User::factory()->create())
            ->patch(route('manage.document-types.update', $type), [
                'name' => 'Tax declaration',
            ])
            ->assertSessionHasErrors('name');

        $this->assertSame('Memorandum', $type->refresh()->name);
    }

    public function test_an_office_without_permission_cannot_view_add_or_edit_document_types(): void
    {
        $office = Office::factory()->create(['can_manage_routing' => true]);
        $type = DocumentType::query()->create(['name' => 'Memorandum', 'slug' => 'memorandum', 'uses_tax_declaration_fields' => false]);
        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $office->id]);
        $this->get(route('manage.document-types.index'))->assertForbidden();
        $this->post(route('manage.document-types.store'), ['name' => 'Forbidden type'])->assertForbidden();
        $this->patch(route('manage.document-types.update', $type), ['name' => 'Forbidden edit'])->assertForbidden();
        $this->assertDatabaseMissing('document_types', ['name' => 'Forbidden type']);
        $this->assertSame('Memorandum', $type->refresh()->name);
        $this->getJson(route('documents.upload-options'))->assertOk()->assertJsonCount(2, 'documentTypes');
    }

    public function test_document_type_management_can_be_granted_and_revoked_for_an_office(): void
    {
        $office = Office::factory()->create();
        $user = User::factory()->create();
        $this->actingAs($user)->withSession(['current_office_id' => $office->id]);
        $this->post(route('manage.document-types.store'), ['name' => 'Office letter'])->assertForbidden();
        $this->patch(route('offices.permissions.update', $office), ['can_manage_document_types' => true])
            ->assertRedirect(route('offices.index'));
        $this->get(route('manage.document-types.index'))->assertOk();
        $this->post(route('manage.document-types.store'), ['name' => 'Office letter'])->assertRedirect(route('manage.document-types.index'));
        $type = DocumentType::query()->where('name', 'Office letter')->sole();
        $this->patch(route('manage.document-types.update', $type), ['name' => 'Updated letter'])->assertRedirect(route('manage.document-types.index'));
        $this->patch(route('offices.permissions.update', $office), ['can_manage_document_types' => false])->assertRedirect(route('offices.index'));
        $this->get(route('manage.document-types.index'))->assertForbidden();
        $this->post(route('manage.document-types.store'), ['name' => 'Another letter'])->assertForbidden();
        $this->patch(route('manage.document-types.update', $type), ['name' => 'Revoked edit'])->assertForbidden();
        $this->assertSame('Updated letter', $type->refresh()->name);
    }
}
