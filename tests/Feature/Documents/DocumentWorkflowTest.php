<?php

namespace Tests\Feature\Documents;

use App\Models\Document;
use App\Models\DocumentRoute;
use App\Models\DocumentType;
use App\Models\Office;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class DocumentWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_status_permission_changes_and_final_decision_protection(): void
    {
        $office = Office::factory()->create();
        $document = $this->document($office);
        $this->assertSame('under_review', $document->status);
        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $office->id]);
        $this->getJson(route('documents.workflow.show', $document))->assertOk()->assertJsonPath('canTakeAction', false);
        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'approved', 'routing_version' => $document->refresh()->routing_version])->assertForbidden();
        $this->patch(route('offices.permissions.update', $office), ['can_take_document_action' => true])->assertRedirect();
        $this->assertTrue($office->refresh()->can_take_document_action);
        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'approved', 'comments' => 'Reviewed and approved.', 'routing_version' => 0])->assertOk()
            ->assertJsonPath('decision.comments', 'Reviewed and approved.')->assertJsonPath('canTakeAction', false);
        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'approved', 'routing_version' => 0])->assertForbidden();
        $this->assertSame(1, $document->audits()->where('action', 'status_updated')->count());
        $entry = $document->audits()->where('action', 'status_updated')->sole();
        $this->assertSame(['before' => 'Under review', 'after' => 'Approved'], $entry->changes['status']);
        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'invented'])->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->assertSame('approved', $document->refresh()->status);
    }

    public function test_endorsement_is_required_before_release_and_actions_wait_for_final_receipt(): void
    {
        $source = Office::factory()->create(['can_take_document_action' => true]);
        $last = Office::factory()->create(['can_take_document_action' => true]);
        $routing = $this->routing([$source, $last]);
        $document = $this->document($source, ['document_route_id' => $routing->id]);
        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $source->id]);
        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'approved', 'routing_version' => $document->refresh()->routing_version])->assertForbidden();
        $this->release($document, $source)->assertUnprocessable()->assertJsonValidationErrors('document_id');
        $this->assertDatabaseCount('document_transfers', 0);
        $this->postJson(route('documents.workflow.endorse', $document))->assertOk()->assertJsonPath('canEndorse', false);
        $this->postJson(route('documents.workflow.endorse', $document))->assertOk();
        $this->assertSame(1, $document->endorsements()->count());
        $this->assertSame(1, $document->audits()->where('action', 'endorsed')->count());
        $this->release($document, $source)->assertOk();
        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'approved', 'routing_version' => $document->refresh()->routing_version])->assertNotFound();
        $this->postJson(route('documents.workflow.endorse', $document))->assertNotFound();
        $this->receive($document, $last)->assertOk();
        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'approved', 'routing_version' => $document->refresh()->routing_version])->assertOk();
        $this->assertSame('approved', $document->refresh()->status);
        $this->getJson(route('documents.audit', $document))->assertOk()->assertJsonPath('data.0.action', 'status_updated');
        $this->withSession(['current_office_id' => $source->id])->patchJson(route('documents.workflow.update', $document), ['status' => 'under_review'])->assertNotFound();
    }

    public function test_final_office_needs_route_permission_and_all_other_office_endorsements(): void
    {
        $first = Office::factory()->create();
        $last = Office::factory()->create(['can_take_document_action' => true]);
        $routing = $this->routing([$first, $last]);
        $document = $this->document($last, ['document_route_id' => $routing->id]);
        $document->forceFill(['routing_started' => true])->save();
        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $last->id]);
        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'approved', 'routing_version' => $document->refresh()->routing_version])->assertForbidden();
        $this->postJson(route('documents.workflow.endorse', $document))->assertForbidden();
        $routing->steps()->where('office_id', $first->id)->update(['needs_endorsement' => false]);
        $routing->steps()->where('office_id', $last->id)->update(['can_take_action' => false]);
        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'approved', 'routing_version' => $document->refresh()->routing_version])->assertForbidden();
        $this->assertSame('in_progress', $document->refresh()->status);
    }

    public function test_initial_assignment_requires_explicit_endorsement_and_rolls_back_on_failure(): void
    {
        $source = Office::factory()->create(['can_route_documents' => true]);
        $last = Office::factory()->create();
        $routing = $this->routing([$source, $last]);
        $document = $this->document($source);
        $this->actingAs(User::factory()->create());
        $this->release($document, $source, ['document_route_id' => $routing->id])->assertUnprocessable();
        $this->assertNull($document->refresh()->document_route_id);
        $this->assertSame('under_review', $document->status);
        $this->assertDatabaseCount('document_endorsements', 0);
        $this->release($document, $source, ['document_route_id' => $routing->id, 'endorse' => true])->assertOk();
        $this->assertSame(1, $document->refresh()->routing_version);
        $this->assertSame('in_progress', $document->status);
        $this->assertSame('fixed_routing', $document->audits()->where('action', 'status_updated')->sole()->context['reason']);
        $this->assertSame(1, $document->endorsements()->sole()->routing_version);
        $this->assertDatabaseCount('document_transfers', 1);
    }

    public function test_routing_removal_cannot_skip_a_required_endorsement(): void
    {
        $source = Office::factory()->create(['can_route_documents' => true]);
        $last = Office::factory()->create();
        $routing = $this->routing([$source, $last]);
        $document = $this->document($source, ['document_route_id' => $routing->id]);
        $this->actingAs(User::factory()->create());
        $this->release($document, $source, ['document_route_id' => null, 'destination_office_id' => $last->id])->assertUnprocessable();
        $this->assertSame($routing->id, $document->refresh()->document_route_id);
        $this->release($document, $source, ['document_route_id' => null, 'destination_office_id' => $last->id, 'endorse' => true])->assertOk();
        $this->assertSame(1, $document->endorsements()->count());
    }

    public function test_old_endorsements_do_not_apply_to_a_new_routing_cycle(): void
    {
        $source = Office::factory()->create(['can_route_documents' => true]);
        $last = Office::factory()->create(['can_route_documents' => true]);
        $routing = $this->routing([$source, $last]);
        $document = $this->document($source);
        $this->actingAs(User::factory()->create());
        $this->release($document, $source, ['document_route_id' => $routing->id, 'endorse' => true])->assertOk();
        $this->receive($document, $last)->assertOk();
        $this->release($document, $last, ['document_route_id' => null, 'destination_office_id' => $source->id])->assertOk();
        $this->receive($document, $source)->assertOk();
        $this->release($document, $source, ['document_route_id' => $routing->id])->assertUnprocessable();
        $this->assertSame(1, $document->endorsements()->count());
        $this->release($document, $source, ['document_route_id' => $routing->id, 'endorse' => true])->assertOk();
        $this->assertSame(2, $document->endorsements()->count());
    }

    public function test_assigned_routes_cannot_be_rewritten_or_drop_saved_endorsements_on_rename(): void
    {
        $office = Office::factory()->create(['can_manage_routing' => true]);
        $next = Office::factory()->create();
        $route = $this->routing([$office, $next]);
        $document = $this->document($office, ['document_route_id' => $route->id]);
        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $office->id]);
        $this->postJson(route('documents.workflow.endorse', $document))->assertOk();
        $steps = $route->steps->map(fn ($step): array => ['office_id' => $step->office_id, 'can_take_action' => $step->can_take_action, 'needs_endorsement' => $step->needs_endorsement])->all();
        $this->patch(route('manage.document-routes.update', $route), ['name' => 'Renamed routing', 'steps' => $steps])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame(1, $document->endorsements()->count());
        $steps[0]['needs_endorsement'] = false;
        $this->patchJson(route('manage.document-routes.update', $route), ['name' => 'Renamed routing', 'steps' => $steps])->assertUnprocessable()->assertJsonValidationErrors('steps');
        $this->assertTrue($route->steps()->firstOrFail()->needs_endorsement);
    }

    public function test_assigning_a_route_from_a_later_office_still_starts_at_the_first_step(): void
    {
        $first = Office::factory()->create();
        $last = Office::factory()->create(['can_route_documents' => true, 'can_take_document_action' => true]);
        $route = $this->routing([$first, $last]);
        $document = $this->document($last);
        $this->actingAs(User::factory()->create());
        $this->release($document, $last, ['document_route_id' => $route->id])->assertOk();
        $this->assertSame($first->id, $document->transfers()->sole()->to_office_id);
        $this->withSession(['current_office_id' => $last->id])->patchJson(route('documents.workflow.update', $document), ['status' => 'approved', 'routing_version' => $document->refresh()->routing_version])->assertNotFound();
    }

    public function test_fixed_routing_starts_progress_for_office_documents_only(): void
    {
        $office = Office::factory()->create();
        $route = $this->routing([$office, Office::factory()->create()]);
        $routed = $this->document($office, ['document_route_id' => $route->id]);
        $free = $this->document($office);
        $tax = $this->document($office, ['document_type_id' => DocumentType::taxDeclaration()->id, 'document_route_id' => $route->id]);

        $this->assertSame('in_progress', $routed->status);
        $this->assertSame('under_review', $free->status);
        $this->assertSame('under_review', $tax->status);
    }

    public function test_disapproval_requires_comments_and_preserves_the_decision_and_author_in_audit(): void
    {
        $this->freezeTime();
        $office = Office::factory()->create(['can_take_document_action' => true]);
        $user = User::factory()->create(['name' => 'Approving officer']);
        $document = $this->document($office);
        $this->actingAs($user)->withSession(['current_office_id' => $office->id]);
        foreach ([null, '', '   ', [], str_repeat('a', 5001)] as $comments) {
            $this->patchJson(route('documents.workflow.update', $document), ['status' => 'disapproved', 'comments' => $comments, 'routing_version' => 0])
                ->assertUnprocessable()->assertJsonValidationErrors('comments');
        }
        $this->assertSame('under_review', $document->refresh()->status);
        $this->assertSame(0, $document->audits()->where('action', 'status_updated')->count());
        $comments = "Missing supporting documents.\nPlease resubmit with the signed request.";

        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'disapproved', 'comments' => $comments, 'routing_version' => 0])
            ->assertOk()->assertJsonPath('status', 'disapproved')->assertJsonPath('canTakeAction', false)
            ->assertJsonPath('decision.comments', $comments)->assertJsonPath('decision.actorName', $user->name)
            ->assertJsonPath('decision.officeName', $office->name)->assertJsonPath('decision.decidedAt', now()->toIso8601String());

        $this->assertSame('disapproved', $document->refresh()->status);
        $entry = $document->audits()->where('action', 'status_updated')->sole();
        $this->assertSame($comments, $entry->context['comments']);
        $this->assertSame(['before' => 'Under review', 'after' => 'Disapproved'], $entry->changes['status']);
        $this->assertSame($user->id, $entry->actor_id);
        $this->assertSame($office->id, $entry->actor_office_id);
        $this->getJson(route('documents.audit', $document))->assertOk()->assertJsonPath('data.0.context.comments', $comments);
        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'approved', 'routing_version' => 0])->assertForbidden();
        $this->assertSame(1, $document->audits()->where('action', 'status_updated')->count());
    }

    public function test_approval_comments_are_optional_and_manual_status_changes_are_rejected(): void
    {
        $office = Office::factory()->create(['can_take_document_action' => true]);
        $document = $this->document($office);
        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $office->id]);
        foreach (['under_review', 'in_progress', 'completed'] as $status) {
            $this->patchJson(route('documents.workflow.update', $document), ['status' => $status, 'routing_version' => 0])->assertUnprocessable()->assertJsonValidationErrors('status');
        }

        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'approved', 'routing_version' => 0])->assertOk()->assertJsonPath('decision.comments', null);

        $this->assertSame('approved', $document->refresh()->status);
    }

    public function test_stale_routing_and_changed_office_permissions_cannot_approve_a_document(): void
    {
        $office = Office::factory()->create(['can_take_document_action' => true]);
        $document = $this->document($office);
        $this->actingAs(User::factory()->create())->withSession(['current_office_id' => $office->id]);
        $this->getJson(route('documents.workflow.show', $document))->assertJsonPath('routingVersion', 0)->assertJsonPath('canTakeAction', true);
        $document->forceFill(['routing_version' => 1])->save();
        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'approved', 'routing_version' => 0])
            ->assertUnprocessable()->assertJsonValidationErrors('routing_version');
        $office->update(['can_take_document_action' => false]);
        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'approved', 'routing_version' => 1])->assertForbidden();
        $this->assertSame('under_review', $document->refresh()->status);
        $this->assertSame(0, $document->audits()->where('action', 'status_updated')->count());
    }

    public function test_decisions_are_authenticated_office_scoped_and_exclude_tax_declarations(): void
    {
        $office = Office::factory()->create(['can_take_document_action' => true]);
        $document = $this->document($office);
        $payload = ['status' => 'approved', 'routing_version' => 0];
        $this->patchJson(route('documents.workflow.update', $document), $payload)->assertUnauthorized();
        $user = User::factory()->create();
        $this->actingAs($user)->withSession(['current_office_id' => Office::factory()->create()->id])
            ->patchJson(route('documents.workflow.update', $document), $payload)->assertNotFound();
        $tax = $this->document($office, ['document_type_id' => DocumentType::taxDeclaration()->id]);
        $this->withSession(['current_office_id' => $office->id])->patchJson(route('documents.workflow.update', $tax), $payload)->assertForbidden();
        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'approved'])->assertUnprocessable()->assertJsonValidationErrors('routing_version');
        $this->assertSame('under_review', $document->refresh()->status);
    }

    public function test_existing_fixed_routing_is_backfilled_once_without_changing_final_or_tax_statuses(): void
    {
        $office = Office::factory()->create();
        $route = $this->routing([$office, Office::factory()->create()]);
        $routed = $this->document($office, ['document_route_id' => $route->id]);
        $routed->forceFill(['status' => 'under_review'])->save();
        $free = $this->document($office);
        $approved = $this->document($office, ['document_route_id' => $route->id, 'status' => 'approved']);
        $tax = $this->document($office, ['document_type_id' => DocumentType::taxDeclaration()->id, 'document_route_id' => $route->id]);
        $migration = require database_path('migrations/2026_11_15_232636_mark_fixed_routing_documents_in_progress.php');

        $migration->up();
        $migration->up();

        $this->assertSame('in_progress', $routed->refresh()->status);
        $this->assertSame('under_review', $free->refresh()->status);
        $this->assertSame('under_review', $tax->refresh()->status);
        $this->assertSame('approved', $approved->refresh()->status);
        $entry = $routed->audits()->where('action', 'status_updated')->sole();
        $this->assertSame('system', $entry->actor_type);
        $this->assertSame('fixed_routing', $entry->context['reason']);
    }

    /** @param array<string, mixed> $extra */
    private function release(Document $document, Office $office, array $extra = []): TestResponse
    {
        return $this->withSession(['current_office_id' => $office->id])->postJson(route('documents.office-actions.release'), ['office_id' => $office->id, 'document_id' => $document->id, ...$extra]);
    }

    private function receive(Document $document, Office $office): TestResponse
    {
        return $this->withSession(['current_office_id' => $office->id])->postJson(route('documents.office-actions.receive'), ['office_id' => $office->id, 'document_id' => $document->id]);
    }

    /** @param array<string, mixed> $attributes */
    private function document(Office $office, array $attributes = []): Document
    {
        $attributes['document_type_id'] ??= DocumentType::query()->firstOrCreate(['slug' => 'letter'], ['name' => 'Letter', 'uses_tax_declaration_fields' => false])->id;

        return app(DocumentWriter::class)->create(['office_id' => $office->id, 'filing_path' => 'route', 'original_filename' => 'workflow.pdf', 'storage_path' => 'documents/workflow.pdf', 'mime_type' => 'application/pdf', 'file_size' => 1024, 'uploaded_by' => User::factory()->create()->id, 'ocr_status' => 'completed', ...$attributes]);
    }

    /** @param list<Office> $offices */
    private function routing(array $offices): DocumentRoute
    {
        $route = DocumentRoute::factory()->create();
        foreach ($offices as $index => $office) {
            $route->steps()->create(['office_id' => $office->id, 'name' => $office->name, 'position' => $index + 1, 'needs_endorsement' => $index === 0, 'can_take_action' => true]);
        }

        return $route;
    }
}
