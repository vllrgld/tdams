<?php

namespace Tests\Feature\Settings;

use App\Models\Office;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OfficesSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_or_change_offices(): void
    {
        $office = Office::query()->where('name', Office::RECEIVING_NAME)->firstOrFail();

        $this->get(route('offices.index'))->assertRedirect(route('login'));
        $this->post(route('offices.store'), ['name' => 'Assessment Office'])->assertRedirect(route('login'));
        $this->put(route('offices.current.update'), ['office_id' => 1])->assertRedirect(route('login'));
        $this->patch(route('offices.update', $office), ['name' => 'Assessment Office'])->assertRedirect(route('login'));
        $this->delete(route('offices.destroy', $office))->assertRedirect(route('login'));
        $this->patch(route('offices.permissions.update', $office), ['can_manage_routing' => true])->assertRedirect(route('login'));
    }

    public function test_offices_page_lists_receiving_office_for_signed_in_users(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('offices.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/offices')
                ->where('officeName', Office::RECEIVING_NAME)
                ->has('offices', 2)
                ->where('offices.0.name', Office::PA_NAME)
                ->where('offices.0.canManageRouting', true)
                ->where('offices.0.canRouteDocuments', true)
                ->where('offices.0.canManageDocumentTypes', true)
                ->where('offices.1.name', Office::RECEIVING_NAME)
                ->where('offices.1.isReceiving', true)
                ->where('offices.1.canManageRouting', false)
                ->where('offices.1.canRouteDocuments', false)
                ->where('offices.1.canUploadToReceiving', true)
                ->where('offices.1.canManageDocumentTypes', false)
                ->where('officePermissions.canManageRouting', false)
                ->where('offices.1.documentCount', 0));
    }

    public function test_authenticated_user_can_add_an_office(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('offices.store'), [
                'name' => 'Assessment Office',
            ])
            ->assertRedirect(route('offices.index'));

        $this->assertTrue(Office::query()->where('name', 'Assessment Office')->exists());
    }

    public function test_an_office_name_is_required_and_unique(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('offices.store'), [])
            ->assertSessionHasErrors('name');

        $this->actingAs($user)
            ->post(route('offices.store'), [
                'name' => Office::RECEIVING_NAME,
            ])
            ->assertSessionHasErrors('name');

        $this->assertSame(2, Office::query()->count());
    }

    public function test_signed_in_users_can_switch_the_current_office(): void
    {
        $user = User::factory()->create();
        $office = Office::factory()->create(['name' => 'Assessment Office']);

        $this->actingAs($user)
            ->from(route('offices.index'))
            ->put(route('offices.current.update'), [
                'office_id' => $office->id,
            ])
            ->assertRedirect(route('offices.index'));

        $this->get(route('offices.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('officeName', 'Assessment Office')
                ->where('officeId', $office->id));
    }

    public function test_switching_office_requires_an_existing_office(): void
    {
        $this->actingAs(User::factory()->create())
            ->from(route('offices.index'))
            ->put(route('offices.current.update'), [
                'office_id' => 999,
            ])
            ->assertRedirect(route('offices.index'))
            ->assertSessionHasErrors('office_id');
    }

    public function test_authenticated_user_can_rename_an_office(): void
    {
        $office = Office::factory()->create(['name' => 'Assessment Office']);

        $this->actingAs(User::factory()->create())
            ->patch(route('offices.update', $office), [
                'name' => 'Records Office',
            ])
            ->assertRedirect(route('offices.index'));

        $this->assertSame('Records Office', $office->refresh()->name);
    }

    public function test_an_edited_office_name_must_stay_unique(): void
    {
        $office = Office::factory()->create(['name' => 'Assessment Office']);

        $this->actingAs(User::factory()->create())
            ->from(route('offices.index'))
            ->patch(route('offices.update', $office), [
                'name' => Office::RECEIVING_NAME,
            ])
            ->assertRedirect(route('offices.index'))
            ->assertSessionHasErrors('name');

        $this->assertSame('Assessment Office', $office->refresh()->name);
    }

    public function test_authenticated_user_can_delete_an_empty_office(): void
    {
        $office = Office::factory()->create(['name' => 'Assessment Office']);

        $this->actingAs(User::factory()->create())
            ->delete(route('offices.destroy', $office))
            ->assertRedirect(route('offices.index'));

        $this->assertModelMissing($office);
    }

    public function test_an_office_with_documents_cannot_be_deleted(): void
    {
        $user = User::factory()->create();
        $office = Office::factory()->create(['name' => 'Assessment Office']);
        $this->document($user, $office);

        $this->actingAs($user)
            ->from(route('offices.index'))
            ->delete(route('offices.destroy', $office))
            ->assertRedirect(route('offices.index'))
            ->assertSessionHasErrors([
                'office' => 'This office cannot be deleted while it still has documents.',
            ]);

        $this->assertModelExists($office);
    }

    public function test_an_office_with_documents_can_still_be_renamed(): void
    {
        $user = User::factory()->create();
        $office = Office::factory()->create(['name' => 'Assessment Office']);
        $this->document($user, $office);

        $this->actingAs($user)
            ->patch(route('offices.update', $office), [
                'name' => 'Records Office',
            ])
            ->assertRedirect(route('offices.index'));

        $this->assertSame('Records Office', $office->refresh()->name);
        $this->assertSame(1, $office->documents()->count());
    }

    public function test_deleting_the_current_office_switches_to_another_office(): void
    {
        $user = User::factory()->create();
        $office = Office::factory()->create(['name' => 'Assessment Office']);
        $receiving = Office::query()->where('name', Office::RECEIVING_NAME)->firstOrFail();

        $this->actingAs($user)
            ->withSession(['current_office_id' => $office->id])
            ->delete(route('offices.destroy', $office))
            ->assertRedirect(route('offices.index'));

        $this->assertModelMissing($office);

        $this->get(route('offices.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('officeName', Office::RECEIVING_NAME)
                ->where('officeId', $receiving->id));
    }

    public function test_office_permissions_can_be_configured_independently_and_survive_renaming(): void
    {
        $office = Office::factory()->create();
        $this->actingAs(User::factory()->create())
            ->patch(route('offices.update', $office), [
                'name' => 'Routing Desk',
                'can_manage_routing' => true,
                'can_route_documents' => false,
                'can_upload_to_receiving' => false,
                'can_manage_document_types' => false,
            ])->assertRedirect(route('offices.index'));

        $this->assertTrue($office->refresh()->can_manage_routing);
        $this->assertFalse($office->can_route_documents);
        $this->assertFalse($office->can_upload_to_receiving);
        $this->assertFalse($office->can_manage_document_types);
        $this->patch(route('offices.update', $office), [
            'name' => 'Release Desk',
            'can_manage_routing' => false,
            'can_route_documents' => true,
            'can_upload_to_receiving' => true,
            'can_manage_document_types' => true,
        ])->assertRedirect(route('offices.index'));
        $this->assertFalse($office->refresh()->can_manage_routing);
        $this->assertTrue($office->can_route_documents);
        $this->assertTrue($office->can_upload_to_receiving);
        $this->assertTrue($office->can_manage_document_types);

        $this->withSession(['current_office_id' => $office->id])->get(route('offices.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('officePermissions.canManageRouting', false)
                ->where('officePermissions.canUploadToReceiving', true)
                ->where('officePermissions.canManageDocumentTypes', true)
                ->where('officePermissions.canRouteDocuments', true));
    }

    public function test_new_offices_have_no_routing_permissions_unless_granted(): void
    {
        $this->actingAs(User::factory()->create())->post(route('offices.store'), ['name' => 'New Office'])
            ->assertRedirect(route('offices.index'));
        $office = Office::query()->where('name', 'New Office')->sole();
        $this->assertFalse($office->can_manage_routing);
        $this->assertFalse($office->can_route_documents);
        $this->assertTrue($office->can_upload_to_receiving);
        $this->assertFalse($office->can_manage_document_types);

        $this->post(route('offices.store'), ['name' => 'Routing Desk', 'can_manage_routing' => true, 'can_route_documents' => true, 'can_upload_to_receiving' => false, 'can_manage_document_types' => true])
            ->assertRedirect(route('offices.index'));
        $this->assertTrue(Office::query()->where('name', 'Routing Desk')->sole()->can_route_documents);
        $this->assertFalse(Office::query()->where('name', 'Routing Desk')->sole()->can_upload_to_receiving);
        $this->assertTrue(Office::query()->where('name', 'Routing Desk')->sole()->can_manage_document_types);
    }

    public function test_invalid_permissions_do_not_save_office_changes(): void
    {
        $office = Office::factory()->create();
        $name = $office->name;
        $this->actingAs(User::factory()->create())->patch(route('offices.update', $office), [
            'name' => 'Invalid', 'can_manage_routing' => 'yes', 'can_route_documents' => ['true'], 'can_upload_to_receiving' => 'yes', 'can_manage_document_types' => 'yes',
        ])->assertSessionHasErrors(['can_manage_routing', 'can_route_documents', 'can_upload_to_receiving', 'can_manage_document_types']);
        $this->assertSame($name, $office->refresh()->name);
    }

    public function test_the_receiving_office_cannot_be_deleted_even_when_empty(): void
    {
        $office = Office::query()->where('is_receiving', true)->sole();
        $this->actingAs(User::factory()->create())->delete(route('offices.destroy', $office))
            ->assertSessionHasErrors('office');
        $this->assertModelExists($office);
    }

    public function test_inline_permission_changes_only_update_the_selected_permission(): void
    {
        $office = Office::factory()->create(['can_manage_routing' => true, 'can_route_documents' => false]);
        $name = $office->name;
        $this->actingAs(User::factory()->create())->patch(route('offices.permissions.update', $office), [
            'can_upload_to_receiving' => false,
            'name' => 'Unexpected rename',
            'is_receiving' => true,
        ])->assertRedirect(route('offices.index'));

        $this->assertFalse($office->refresh()->can_upload_to_receiving);
        $this->assertTrue($office->can_manage_routing);
        $this->assertFalse($office->can_route_documents);
        $this->assertFalse($office->is_receiving);
        $this->assertSame($name, $office->name);
    }

    public function test_inline_permission_changes_reject_invalid_or_missing_values(): void
    {
        $office = Office::factory()->create();
        $this->actingAs(User::factory()->create())->patch(route('offices.permissions.update', $office), [
            'can_upload_to_receiving' => 'off',
        ])->assertSessionHasErrors('can_upload_to_receiving');
        $this->patch(route('offices.permissions.update', $office), [])->assertSessionHasErrors('permissions');
        $this->assertTrue($office->refresh()->can_upload_to_receiving);
    }

    public function test_unverified_users_cannot_change_office_permissions(): void
    {
        $office = Office::factory()->create();
        $this->actingAs(User::factory()->unverified()->create())->patch(route('offices.permissions.update', $office), [
            'can_manage_routing' => true,
        ])->assertRedirect(route('verification.notice'));
        $this->assertFalse($office->refresh()->can_manage_routing);
    }

    private function document(User $user, Office $office): void
    {
        app(DocumentWriter::class)->create([
            'original_filename' => 'office.pdf',
            'storage_path' => 'documents/office.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'uploaded_by' => $user->id,
            'office_id' => $office->id,
        ]);
    }
}
