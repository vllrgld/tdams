<?php

namespace Tests\Feature\Manage;

use App\Models\DocumentRoute;
use App\Models\Office;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DocumentRoutesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withSession(['current_office_id' => Office::query()->where('name', Office::PA_NAME)->sole()->id]);
    }

    public function test_guests_are_redirected_from_routes(): void
    {
        $this->get(route('manage.document-routes.index'))->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_add_routing_with_office_permissions(): void
    {
        $receiving = Office::factory()->create(['name' => 'Receiving']);
        $records = Office::factory()->create(['name' => 'Records']);

        $this->actingAs(User::factory()->create())
            ->post(route('manage.document-routes.store'), [
                'name' => 'Receiving to records',
                'steps' => [
                    ['office_id' => $receiving->id, 'can_take_action' => false, 'needs_endorsement' => true],
                    ['office_id' => $records->id, 'can_take_action' => true, 'needs_endorsement' => false],
                ],
            ])
            ->assertRedirect(route('manage.document-routes.index'));

        $route = DocumentRoute::query()->where('name', 'Receiving to records')->first();

        $this->assertNotNull($route);
        $this->assertSame(['Receiving', 'Records'], $route->toOptionArray()['steps']);
        $this->assertDatabaseHas('document_route_steps', ['document_route_id' => $route->id, 'office_id' => $receiving->id, 'position' => 1, 'can_take_action' => false, 'needs_endorsement' => true]);
        $this->assertDatabaseHas('document_route_steps', ['document_route_id' => $route->id, 'office_id' => $records->id, 'position' => 2, 'can_take_action' => true, 'needs_endorsement' => false]);
    }

    public function test_a_route_needs_a_name_and_at_least_two_processes(): void
    {
        $user = User::factory()->create();
        $office = Office::factory()->create();
        $step = ['office_id' => $office->id, 'can_take_action' => false, 'needs_endorsement' => false];

        $this->actingAs($user)
            ->post(route('manage.document-routes.store'), [])
            ->assertSessionHasErrors(['name', 'steps']);

        $this->actingAs($user)
            ->post(route('manage.document-routes.store'), [
                'name' => 'Too short',
                'steps' => [$step],
            ])
            ->assertSessionHasErrors('steps');

        $this->actingAs($user)
            ->post(route('manage.document-routes.store'), [
                'name' => 'Repeated',
                'steps' => [$step, $step],
            ])
            ->assertSessionHasErrors(['steps.0.office_id', 'steps.1.office_id']);

        $this->assertSame(0, DocumentRoute::query()->count());
    }

    public function test_the_routing_page_lists_legacy_steps_and_all_available_offices(): void
    {
        $office = Office::factory()->create(['name' => 'Finance']);
        $route = DocumentRoute::factory()->withSteps(['Receiving', 'Records'])->create([
            'name' => 'Receiving to records',
        ]);

        $this->actingAs(User::factory()->create())
            ->get(route('manage.document-routes.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('manage/document-routes/index')
                ->has('routes', 1)
                ->where('routes.0.id', $route->id)
                ->where('routes.0.name', 'Receiving to records')
                ->where('routes.0.steps', ['Receiving', 'Records'])
                ->where('routes.0.officeSteps.0.office_id', null)
                ->where('routes.0.officeSteps.0.can_take_action', false)
                ->where('routes.0.officeSteps.0.needs_endorsement', false)
                ->has('offices', 3)
                ->where('offices.0.id', $office->id)
                ->where('offices.0.name', 'Finance')
                ->where('routes.0.documentCount', 0));
    }

    public function test_guests_cannot_edit_a_route(): void
    {
        $route = DocumentRoute::factory()->withSteps()->create();

        $this->patch(route('manage.document-routes.update', $route))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_edit_a_route(): void
    {
        $receiving = Office::factory()->create(['name' => 'Receiving']);
        $release = Office::factory()->create(['name' => 'Release']);
        $route = DocumentRoute::factory()->withSteps(['Receiving', 'Records'])->create([
            'name' => 'Receiving to records',
        ]);

        $this->actingAs(User::factory()->create())
            ->patch(route('manage.document-routes.update', $route), [
                'name' => 'Receiving to release',
                'steps' => [
                    ['office_id' => $receiving->id, 'can_take_action' => true, 'needs_endorsement' => true],
                    ['office_id' => $release->id, 'can_take_action' => false, 'needs_endorsement' => false],
                ],
            ])
            ->assertRedirect(route('manage.document-routes.index'));

        $route->refresh();

        $this->assertSame('Receiving to release', $route->name);
        $this->assertSame(
            ['Receiving', 'Release'],
            $route->steps()->orderBy('position')->pluck('name')->all(),
        );
        $this->assertSame([true, false], $route->steps->pluck('can_take_action')->all());
        $this->assertSame([true, false], $route->steps->pluck('needs_endorsement')->all());
    }

    public function test_an_invalid_route_edit_keeps_the_existing_processes(): void
    {
        $route = DocumentRoute::factory()->withSteps(['Receiving', 'Records'])->create([
            'name' => 'Receiving to records',
        ]);

        $this->actingAs(User::factory()->create())
            ->patch(route('manage.document-routes.update', $route), [
                'name' => 'Receiving to records',
                'steps' => ['Receiving', 'receiving'],
            ])
            ->assertSessionHasErrors('steps.0');

        $this->assertSame(
            ['Receiving', 'Records'],
            $route->steps()->orderBy('position')->pluck('name')->all(),
        );
    }

    public function test_routing_rejects_an_unavailable_office_without_saving(): void
    {
        $office = Office::factory()->create();

        $this->actingAs(User::factory()->create())
            ->post(route('manage.document-routes.store'), [
                'name' => 'Unavailable office',
                'steps' => [
                    ['office_id' => $office->id, 'can_take_action' => false, 'needs_endorsement' => false],
                    ['office_id' => 999999, 'can_take_action' => false, 'needs_endorsement' => true],
                ],
            ])
            ->assertSessionHasErrors(['steps.1.office_id' => 'Select an available office.']);

        $this->assertDatabaseMissing('document_routes', ['name' => 'Unavailable office']);
    }

    public function test_routing_rejects_invalid_permission_values(): void
    {
        $offices = Office::factory()->count(2)->create();

        $this->actingAs(User::factory()->create())
            ->post(route('manage.document-routes.store'), [
                'name' => 'Invalid permissions',
                'steps' => [
                    ['office_id' => $offices[0]->id, 'can_take_action' => 'yes', 'needs_endorsement' => 'no'],
                    ['office_id' => $offices[1]->id, 'can_take_action' => false],
                ],
            ])
            ->assertSessionHasErrors(['steps.0.can_take_action', 'steps.0.needs_endorsement', 'steps.1.needs_endorsement']);

        $this->assertDatabaseMissing('document_routes', ['name' => 'Invalid permissions']);
    }

    public function test_routing_displays_the_current_office_name_after_a_rename(): void
    {
        $office = Office::factory()->create(['name' => 'Finance']);
        $route = DocumentRoute::factory()->withSteps()->create();
        $route->steps()->firstOrFail()->update(['office_id' => $office->id]);

        $this->actingAs(User::factory()->create())
            ->patch(route('offices.update', $office), ['name' => 'Finance Office'])
            ->assertRedirect(route('offices.index'));

        $this->get(route('manage.document-routes.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('routes.0.steps.0', 'Finance Office')
                ->where('routes.0.officeSteps.0.office_id', $office->id));
    }

    public function test_an_office_used_in_routing_cannot_be_deleted(): void
    {
        $office = Office::factory()->create();
        $routing = DocumentRoute::factory()->withSteps()->create();
        $routing->steps()->firstOrFail()->update(['office_id' => $office->id]);

        $this->actingAs(User::factory()->create())
            ->delete(route('offices.destroy', $office))
            ->assertSessionHasErrors(['office' => 'This office is used in routing. Update the routing before deleting it.']);

        $this->assertModelExists($office);
    }

    public function test_an_office_without_permission_cannot_view_create_or_change_routing(): void
    {
        $office = Office::factory()->create(['can_route_documents' => true]);
        $routing = DocumentRoute::factory()->withSteps()->create();
        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $office->id]);
        $this->get(route('manage.document-routes.index'))->assertForbidden();
        $this->post(route('manage.document-routes.store'), ['name' => 'Forbidden'])->assertForbidden();
        $this->patch(route('manage.document-routes.update', $routing), ['name' => 'Forbidden'])->assertForbidden();
        $this->assertDatabaseMissing('document_routes', ['name' => 'Forbidden']);

        $office->update(['can_manage_routing' => true]);
        $this->get(route('manage.document-routes.index'))->assertOk();
        $office->update(['can_manage_routing' => false]);
        $this->get(route('manage.document-routes.index'))->assertForbidden();
    }
}
