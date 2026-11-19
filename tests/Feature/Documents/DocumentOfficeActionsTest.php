<?php

namespace Tests\Feature\Documents;

use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\DocumentRoute;
use App\Models\DocumentTransfer;
use App\Models\DocumentType;
use App\Models\Office;
use App\Models\User;
use App\Services\Documents\DocumentWriter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DocumentOfficeActionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_list_receive_or_release_documents(): void
    {
        $this->getJson(route('documents.office-actions.index', ['action' => 'release']))->assertUnauthorized();
        $this->postJson(route('documents.office-actions.release'))->assertUnauthorized();
        $this->postJson(route('documents.office-actions.receive'))->assertUnauthorized();
    }

    public function test_a_document_without_fixed_routing_is_released_without_a_destination(): void
    {
        $this->freezeTime();
        $user = User::factory()->create();
        $source = Office::factory()->create();
        $destination = Office::factory()->create();
        $document = $this->document($user, $source);

        $this->release($user, $source, $document, $destination)->assertOk();

        $this->assertSame($source->id, $document->refresh()->office_id);
        $this->assertDatabaseHas('document_transfers', [
            'document_id' => $document->id, 'from_office_id' => $source->id, 'to_office_id' => null,
            'released_by' => $user->id, 'released_at' => now()->toDateTimeString(), 'received_at' => null,
        ]);
        $location = (new DocumentResource($document->load(Document::archiveRelations())))->resolve()['officeLocation'];
        $this->assertSame(['officeName' => $source->name, 'inTransit' => true, 'destinationOfficeName' => null, 'releasedAt' => now()->toIso8601String()], $location);
    }

    public function test_receiving_updates_the_office_and_preserves_the_transfer_record(): void
    {
        $this->freezeTime();
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $source = Office::factory()->create();
        $destination = Office::factory()->create();
        $document = $this->document($sender, $source);
        $this->release($sender, $source, $document, $destination)->assertOk();

        $this->receive($receiver, $destination, $document)->assertOk();

        $this->assertSame($destination->id, $document->refresh()->office_id);
        $this->assertDatabaseHas('document_transfers', ['document_id' => $document->id, 'released_by' => $sender->id, 'received_by' => $receiver->id, 'received_at' => now()->toDateTimeString()]);
        $this->assertNull($document->pendingTransfer()->first());
        $this->getJson(route('documents.office-actions.index', ['action' => 'receive']))->assertJsonCount(0, 'documents');
        $this->withSession(['current_office_id' => $source->id])->getJson(route('documents.ocr', $document))->assertNotFound();
    }

    public function test_a_fixed_route_selects_the_next_office_and_rejects_a_different_destination(): void
    {
        $user = User::factory()->create();
        $source = Office::factory()->create();
        $next = Office::factory()->create();
        $last = Office::factory()->create();
        $route = $this->routing([$source, $next, $last]);
        $document = $this->document($user, $source, ['document_route_id' => $route->id, 'filing_path' => 'route']);

        $this->release($user, $source, $document, $last)->assertUnprocessable()->assertJsonValidationErrors('destination_office_id');
        $this->assertDatabaseCount('document_transfers', 0);
        $this->release($user, $source, $document)->assertOk();
        $this->assertDatabaseHas('document_transfers', ['document_id' => $document->id, 'to_office_id' => $next->id]);
        $this->receive($user, $next, $document)->assertOk();
        $this->release($user, $next, $document)->assertOk();
        $this->assertDatabaseHas('document_transfers', ['document_id' => $document->id, 'from_office_id' => $next->id, 'to_office_id' => $last->id]);
    }

    public function test_a_document_outside_its_fixed_route_is_sent_to_the_first_office(): void
    {
        $user = User::factory()->create();
        $source = Office::factory()->create();
        $first = Office::factory()->create();
        $last = Office::factory()->create();
        $route = $this->routing([$first, $last]);
        $document = $this->document($user, $source, ['document_route_id' => $route->id, 'filing_path' => 'route']);

        $this->release($user, $source, $document)->assertOk();

        $this->assertDatabaseHas('document_transfers', ['document_id' => $document->id, 'to_office_id' => $first->id]);
    }

    public function test_a_document_at_the_end_of_fixed_routing_cannot_be_released_elsewhere(): void
    {
        $user = User::factory()->create();
        $first = Office::factory()->create();
        $last = Office::factory()->create();
        $route = $this->routing([$first, $last]);
        $document = $this->document($user, $last, ['document_route_id' => $route->id, 'filing_path' => 'route']);

        $this->release($user, $last, $document, $first)->assertUnprocessable()
            ->assertJsonPath('errors.document_id.0', 'This document has reached the last office in its fixed routing.');

        $this->assertDatabaseCount('document_transfers', 0);
    }

    public function test_legacy_routing_needs_offices_before_a_document_can_be_released(): void
    {
        $user = User::factory()->create();
        $source = Office::factory()->create();
        $destination = Office::factory()->create();
        $route = DocumentRoute::factory()->withSteps()->create();
        $document = $this->document($user, $source, ['document_route_id' => $route->id, 'filing_path' => 'route']);

        $this->release($user, $source, $document, $destination)->assertUnprocessable()
            ->assertJsonPath('errors.document_id.0', 'Assign offices to every step in Routing before releasing this document.');

        $this->assertDatabaseCount('document_transfers', 0);
    }

    public function test_free_release_does_not_use_a_client_supplied_destination(): void
    {
        $user = User::factory()->create();
        $office = Office::factory()->create();
        $document = $this->document($user, $office);

        $this->actingAs($user)->withSession(['current_office_id' => $office->id])
            ->postJson(route('documents.office-actions.release'), ['document_id' => $document->id, 'office_id' => $office->id, 'destination_office_id' => 999999])
            ->assertOk();
        $this->assertDatabaseHas('document_transfers', ['document_id' => $document->id, 'to_office_id' => null]);
    }

    public function test_only_the_holding_office_can_release_and_only_the_destination_can_receive(): void
    {
        $user = User::factory()->create();
        $source = Office::factory()->create();
        $destination = Office::factory()->create();
        $other = Office::factory()->create();
        $routing = $this->routing([$source, $destination]);
        $document = $this->document($user, $source, ['document_route_id' => $routing->id, 'filing_path' => 'route']);

        $this->release($user, $other, $document, $destination)->assertNotFound();
        $this->release($user, $source, $document, $destination)->assertOk();
        $this->receive($user, $other, $document)->assertNotFound();
        $this->receive($user, $source, $document)->assertUnprocessable();
        $this->assertSame($source->id, $document->refresh()->office_id);
        $this->assertNull(DocumentTransfer::query()->sole()->received_at);
    }

    public function test_duplicate_release_and_receipt_do_not_create_extra_transfers(): void
    {
        $user = User::factory()->create();
        $source = Office::factory()->create();
        $destination = Office::factory()->create();
        $document = $this->document($user, $source);

        $this->release($user, $source, $document, $destination)->assertOk();
        $this->release($user, $source, $document, $destination)->assertUnprocessable();
        $this->receive($user, $destination, $document)->assertOk();
        $this->receive($user, $destination, $document)->assertUnprocessable();

        $this->assertDatabaseCount('document_transfers', 1);
        $this->assertSame($destination->id, $document->refresh()->office_id);
    }

    public function test_the_picker_only_lists_documents_eligible_for_the_active_office(): void
    {
        $user = User::factory()->create();
        $source = Office::factory()->create();
        $destination = Office::factory()->create();
        $other = Office::factory()->create();
        $outgoing = $this->document($user, $source, ['title' => 'Budget request']);
        $held = $this->document($user, $source, ['title' => 'Office memo']);
        $this->document($user, $other, ['title' => 'Private memo']);
        $this->release($user, $source, $outgoing, $destination)->assertOk();

        $response = $this->getJson(route('documents.office-actions.index', ['action' => 'release']))->assertOk()
            ->assertJsonCount(1, 'documents')->assertJsonPath('documents.0.id', $held->id);
        $this->withSession(['current_office_id' => $destination->id])->getJson(route('documents.office-actions.index', ['action' => 'receive', 'q' => 'Budget']))
            ->assertOk()->assertJsonCount(1, 'documents')->assertJsonPath('documents.0.id', $outgoing->id)
            ->assertJsonPath('documents.0.fromOfficeName', $source->name);
        $this->getJson(route('documents.office-actions.index', ['action' => 'receive', 'q' => 'memo']))->assertJsonCount(0, 'documents');
        $this->withSession(['current_office_id' => $other->id])->getJson(route('documents.office-actions.index', ['action' => 'receive']))->assertJsonCount(1, 'documents');
    }

    public function test_stale_office_requests_are_rejected(): void
    {
        $user = User::factory()->create();
        $source = Office::factory()->create();
        $other = Office::factory()->create();
        $document = $this->document($user, $source);

        $this->actingAs($user)->withSession(['current_office_id' => $source->id])->postJson(route('documents.office-actions.release'), [
            'document_id' => $document->id, 'office_id' => $other->id, 'destination_office_id' => $other->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('office_id');
        $this->postJson(route('documents.office-actions.receive'), ['document_id' => $document->id, 'office_id' => $other->id])
            ->assertUnprocessable()->assertJsonValidationErrors('office_id');
        $this->assertDatabaseCount('document_transfers', 0);
    }

    public function test_action_payloads_and_picker_modes_are_validated(): void
    {
        $this->actingAs(User::factory()->create());
        $this->postJson(route('documents.office-actions.release'))->assertUnprocessable()->assertJsonValidationErrors(['document_id', 'office_id']);
        $this->postJson(route('documents.office-actions.receive'), ['document_id' => 'invalid', 'office_id' => []])->assertUnprocessable()->assertJsonValidationErrors(['document_id', 'office_id']);
        $this->getJson(route('documents.office-actions.index', ['action' => 'delete']))->assertUnprocessable()->assertJsonValidationErrors('action');
        $this->getJson(route('documents.office-actions.index', ['action' => ['release']]))->assertUnprocessable()->assertJsonValidationErrors('action');
    }

    public function test_offices_with_transfer_history_cannot_be_deleted(): void
    {
        $user = User::factory()->create();
        $source = Office::factory()->create();
        $destination = Office::factory()->create();
        $document = $this->document($user, $source);
        $this->release($user, $source, $document, $destination)->assertOk();
        $this->receive($user, $destination, $document)->assertOk();

        $this->delete(route('offices.destroy', $source))->assertSessionHasErrors('office');
        $this->assertModelExists($source);
    }

    public function test_archive_reset_also_removes_transfers_and_preserves_accounts(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documents/request.pdf', 'original');
        $user = User::factory()->create();
        $source = Office::factory()->create();
        $destination = Office::factory()->create();
        $document = $this->document($user, $source);
        $this->release($user, $source, $document, $destination)->assertOk();

        $this->delete(route('data.destroy'), ['confirmation' => 'RESET'])->assertRedirect(route('data.edit'));

        $this->assertDatabaseCount('document_transfers', 0);
        $this->assertDatabaseCount('documents', 0);
        $this->assertModelExists($user);
        Storage::disk('local')->assertMissing('documents/request.pdf');
    }

    public function test_pa_can_assign_fixed_routing_only_as_part_of_a_successful_release(): void
    {
        $user = User::factory()->create();
        $pa = Office::query()->where('name', Office::PA_NAME)->sole();
        $next = Office::factory()->create();
        $wrong = Office::factory()->create();
        $routing = $this->routing([$pa, $next]);
        $document = $this->document($user, $pa, ['filing_path' => 'route']);
        $code = $document->tracking_code;

        $this->actingAs($user)->withSession(['current_office_id' => $pa->id]);
        $this->getJson(route('documents.office-actions.index', ['action' => 'release']))
            ->assertJsonPath('canRouteDocuments', true)
            ->assertJsonPath('routing.0.id', $routing->id)
            ->assertJsonPath('routing.0.nextOfficeId', $next->id);

        $payload = ['office_id' => $pa->id, 'document_id' => $document->id, 'document_route_id' => $routing->id];
        $this->postJson(route('documents.office-actions.release'), [...$payload, 'destination_office_id' => $wrong->id])
            ->assertUnprocessable()->assertJsonValidationErrors('destination_office_id');
        $this->assertNull($document->refresh()->document_route_id);
        $this->assertDatabaseCount('document_transfers', 0);

        $this->postJson(route('documents.office-actions.release'), $payload)->assertOk();
        $this->assertSame($routing->id, $document->refresh()->document_route_id);
        $this->assertSame($code, $document->tracking_code);
        $this->assertDatabaseHas('document_transfers', ['document_id' => $document->id, 'to_office_id' => $next->id]);
        $this->receive($user, $next, $document)->assertOk();
    }

    public function test_an_office_cannot_assign_or_remove_routing_without_release_permission(): void
    {
        $user = User::factory()->create();
        $source = Office::factory()->create(['can_manage_routing' => true]);
        $next = Office::factory()->create();
        $routing = $this->routing([$source, $next]);
        $document = $this->document($user, $source, ['filing_path' => 'route', 'document_route_id' => $routing->id]);
        $this->actingAs($user)->withSession(['current_office_id' => $source->id]);
        $this->getJson(route('documents.office-actions.index', ['action' => 'release']))
            ->assertJsonPath('canRouteDocuments', false)->assertJsonCount(0, 'routing');

        foreach ([$routing->id, null] as $routeId) {
            $this->postJson(route('documents.office-actions.release'), [
                'office_id' => $source->id, 'document_id' => $document->id,
                'document_route_id' => $routeId, 'destination_office_id' => $next->id,
            ])->assertForbidden();
        }

        $this->assertSame($routing->id, $document->refresh()->document_route_id);
        $this->assertDatabaseCount('document_transfers', 0);
        $this->release($user, $source, $document)->assertOk();
    }

    public function test_authorized_offices_can_replace_or_clear_routing_at_release(): void
    {
        $user = User::factory()->create();
        $source = Office::factory()->create(['can_route_documents' => true]);
        $next = Office::factory()->create();
        $last = Office::factory()->create();
        $old = $this->routing([$source, $next]);
        $replacement = $this->routing([$source, $last]);

        foreach ([$replacement->id, null] as $routeId) {
            $document = $this->document($user, $source, ['filing_path' => 'route', 'document_route_id' => $old->id]);
            $this->actingAs($user)->withSession(['current_office_id' => $source->id])
                ->postJson(route('documents.office-actions.release'), [
                    'office_id' => $source->id, 'document_id' => $document->id,
                    'document_route_id' => $routeId, 'destination_office_id' => $last->id,
                ])->assertOk();
            $this->assertSame($routeId, $document->refresh()->document_route_id);
            $this->assertDatabaseHas('document_transfers', ['document_id' => $document->id, 'to_office_id' => $routeId === null ? null : $last->id]);
        }
    }

    public function test_release_rechecks_permissions_and_rejects_invalid_routing_without_changing_the_document(): void
    {
        $user = User::factory()->create();
        $source = Office::factory()->create(['can_route_documents' => true]);
        $next = Office::factory()->create();
        $routing = $this->routing([$source, $next]);
        $document = $this->document($user, $source);
        $this->actingAs($user)->withSession(['current_office_id' => $source->id]);
        $payload = ['office_id' => $source->id, 'document_id' => $document->id, 'destination_office_id' => $next->id];
        $this->postJson(route('documents.office-actions.release'), [...$payload, 'document_route_id' => 999999])
            ->assertUnprocessable()->assertJsonValidationErrors('document_route_id');
        $source->update(['can_route_documents' => false]);
        $this->postJson(route('documents.office-actions.release'), [...$payload, 'document_route_id' => $routing->id])->assertForbidden();
        $this->assertNull($document->refresh()->document_route_id);
        $this->assertSame(Document::FILING_ARCHIVE, $document->filing_path);
        $this->assertDatabaseCount('document_transfers', 0);
    }

    public function test_released_documents_disappear_from_lists_search_and_private_endpoints_immediately(): void
    {
        $user = User::factory()->create();
        $office = Office::factory()->create();
        $document = $this->document($user, $office, ['title' => 'Hidden released letter']);
        $this->release($user, $office, $document)->assertOk();

        $this->get(route('documents.index', ['type' => 'all', 'document' => $document->id]))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('documents.total', 0)->where('selectedDocument', null));
        $this->getJson(route('documents.search', ['q' => 'Hidden released']))->assertExactJson(['data' => [], 'hasMore' => false]);
        foreach (['documents.view', 'documents.thumbnail', 'documents.ocr', 'documents.ocr-pdf', 'documents.location', 'documents.audit', 'documents.workflow.show'] as $endpoint) {
            $this->getJson(route($endpoint, $document))->assertNotFound();
        }
        $this->patchJson(route('documents.workflow.update', $document), ['status' => 'completed'])->assertNotFound();
        $this->getJson(route('documents.office-actions.index', ['action' => 'release']))->assertJsonCount(0, 'documents');
    }

    public function test_any_other_office_can_claim_a_free_release_exactly_once_using_its_tracking_code(): void
    {
        $user = User::factory()->create();
        $source = Office::factory()->create();
        $receiver = Office::factory()->create();
        $other = Office::factory()->create();
        $document = $this->document($user, $source);
        $this->release($user, $source, $document)->assertOk();
        $code = $document->refresh()->tracking_code;
        $this->receive($user, $source, $document)->assertUnprocessable();
        $this->getJson(route('documents.office-actions.index', ['action' => 'receive']))->assertJsonCount(0, 'documents');
        $this->withSession(['current_office_id' => $other->id])->getJson(route('documents.office-actions.index', ['action' => 'receive', 'q' => $code]))
            ->assertJsonCount(1, 'documents')->assertJsonPath('documents.0.id', $document->id);

        $this->withSession(['current_office_id' => $receiver->id])->postJson(route('documents.office-actions.receive'), ['office_id' => $receiver->id, 'tracking_code' => strtolower($code)])->assertOk();

        $this->assertSame($receiver->id, $document->refresh()->office_id);
        $this->assertDatabaseHas('document_transfers', ['document_id' => $document->id, 'to_office_id' => $receiver->id, 'received_by' => $user->id]);
        $this->receive($user, $other, $document)->assertNotFound();
        $this->assertSame(1, $document->audits()->where('action', 'received')->count());
        $this->withSession(['current_office_id' => $receiver->id])->getJson(route('documents.location', $document))->assertOk()->assertJsonPath('transfers.0.to.id', $receiver->id);
    }

    public function test_only_the_last_three_releases_are_revertible_and_older_releases_do_not_resurface(): void
    {
        $user = User::factory()->create();
        $office = Office::factory()->create();
        $documents = [];
        foreach (range(1, 4) as $number) {
            $document = $this->document($user, $office, ['title' => 'Letter '.$number]);
            $this->release($user, $office, $document)->assertOk();
            $documents[] = $document;
        }
        $this->getJson(route('documents.office-actions.index', ['action' => 'revert']))->assertOk()
            ->assertJsonCount(3, 'documents')->assertJsonPath('documents.0.id', $documents[3]->id)->assertJsonPath('documents.2.id', $documents[1]->id);
        $this->revert($user, $office, $documents[0], $documents[0]->transfers()->sole()->id)->assertUnprocessable()->assertJsonValidationErrors('document_id');

        $this->revert($user, $office, $documents[3], $documents[3]->transfers()->sole()->id)->assertOk();

        $this->getJson(route('documents.office-actions.index', ['action' => 'revert']))->assertJsonCount(2, 'documents');
        $this->assertNotNull($documents[0]->pendingTransfer()->first());
        $this->assertNull($documents[3]->pendingTransfer()->first());
    }

    public function test_reverting_restores_access_and_keeps_routing_endorsements_tracking_and_audit_history(): void
    {
        $this->freezeTime();
        $user = User::factory()->create();
        $office = Office::factory()->create(['can_route_documents' => true]);
        $next = Office::factory()->create();
        $route = $this->routing([$office, $next]);
        $route->steps()->where('office_id', $office->id)->update(['needs_endorsement' => true]);
        $document = $this->document($user, $office, ['filing_path' => 'route']);
        $this->actingAs($user)->withSession(['current_office_id' => $office->id])->postJson(route('documents.office-actions.release'), [
            'office_id' => $office->id, 'document_id' => $document->id, 'document_route_id' => $route->id, 'endorse' => true,
        ])->assertOk();
        $transfer = $document->transfers()->sole();
        $code = $document->refresh()->tracking_code;

        $this->revert($user, $office, $document, $transfer->id)->assertOk();

        $this->assertDatabaseHas('document_transfers', ['id' => $transfer->id, 'received_at' => null, 'reverted_at' => now()->toDateTimeString(), 'reverted_by' => $user->id]);
        $this->assertSame($route->id, $document->refresh()->document_route_id);
        $this->assertSame(1, $document->routing_version);
        $this->assertSame($code, $document->tracking_code);
        $this->assertSame(1, $document->endorsements()->count());
        $this->get(route('documents.index', ['type' => 'all', 'document' => $document->id]))->assertInertia(fn (Assert $page) => $page->where('documents.total', 1)->where('selectedDocument.id', $document->id));
        $this->getJson(route('documents.location', $document))->assertOk()->assertJsonPath('releasedAt', null)->assertJsonPath('transfers.0.revertedAt', now()->toIso8601String());
        $this->getJson(route('documents.audit', $document))->assertOk()->assertJsonPath('data.0.action', 'release_reverted');
        $entry = $document->audits()->where('action', 'release_reverted')->sole();
        $this->assertSame($user->id, $entry->actor_id);
        $this->assertSame($office->id, $entry->actor_office_id);
        $this->assertSame($transfer->id, $entry->context['transferId']);
        $this->assertSame(1, $document->audits()->where('action', 'released')->count());
        $this->receive($user, $next, $document)->assertNotFound();
    }

    public function test_a_stale_revert_cannot_cancel_a_new_release_of_the_same_document(): void
    {
        $user = User::factory()->create();
        $office = Office::factory()->create();
        $document = $this->document($user, $office);
        $this->release($user, $office, $document)->assertOk();
        $first = $document->transfers()->sole();
        $this->revert($user, $office, $document, $first->id)->assertOk();
        $this->release($user, $office, $document)->assertOk();

        $this->revert($user, $office, $document, $first->id)->assertUnprocessable()->assertJsonValidationErrors('document_id');

        $this->assertNotNull($document->pendingTransfer()->first());
        $this->assertSame(1, $document->audits()->where('action', 'release_reverted')->count());
        $this->revert($user, $office, $document, $document->pendingTransfer()->sole()->id)->assertOk();
    }

    public function test_revert_is_restricted_to_the_releasing_office_and_unreceived_transfers(): void
    {
        $user = User::factory()->create();
        $source = Office::factory()->create();
        $receiver = Office::factory()->create();
        $document = $this->document($user, $source);
        $this->release($user, $source, $document)->assertOk();
        $transfer = $document->transfers()->sole();
        $this->revert($user, $receiver, $document, $transfer->id)->assertNotFound();
        $this->receive($user, $receiver, $document)->assertOk();

        $this->revert($user, $source, $document, $transfer->id)->assertNotFound();
        $this->revert($user, $receiver, $document, $transfer->id)->assertUnprocessable();

        $this->assertSame($receiver->id, $document->refresh()->office_id);
        $this->assertNull($transfer->refresh()->reverted_at);
        $this->assertSame(0, $document->audits()->where('action', 'release_reverted')->count());
    }

    public function test_revert_requires_authentication_valid_input_and_the_expected_active_office(): void
    {
        $this->postJson(route('documents.office-actions.revert'))->assertUnauthorized();
        $user = User::factory()->create();
        $office = Office::factory()->create();
        $document = $this->document($user, $office);
        $this->release($user, $office, $document)->assertOk();
        $this->postJson(route('documents.office-actions.revert'))->assertUnprocessable()->assertJsonValidationErrors(['document_id', 'transfer_id', 'office_id']);
        $this->postJson(route('documents.office-actions.revert'), ['office_id' => $office->id + 100, 'document_id' => $document->id, 'transfer_id' => $document->transfers()->sole()->id])
            ->assertUnprocessable()->assertJsonValidationErrors('office_id');
        $this->assertNotNull($document->pendingTransfer()->first());
    }

    private function revert(User $user, Office $office, Document $document, int $transferId): TestResponse
    {
        return $this->actingAs($user)->withSession(['current_office_id' => $office->id])->postJson(route('documents.office-actions.revert'), [
            'office_id' => $office->id, 'document_id' => $document->id, 'transfer_id' => $transferId,
        ]);
    }

    private function release(User $user, Office $office, Document $document, ?Office $destination = null): TestResponse
    {
        return $this->actingAs($user)->withSession(['current_office_id' => $office->id])->postJson(route('documents.office-actions.release'), [
            'office_id' => $office->id, 'document_id' => $document->id, 'destination_office_id' => $destination?->id,
        ]);
    }

    private function receive(User $user, Office $office, Document $document): TestResponse
    {
        return $this->actingAs($user)->withSession(['current_office_id' => $office->id])->postJson(route('documents.office-actions.receive'), [
            'office_id' => $office->id, 'document_id' => $document->id,
        ]);
    }

    /** @param array<string, mixed> $attributes */
    private function document(User $user, Office $office, array $attributes = []): Document
    {
        $type = DocumentType::query()->firstOrCreate(['slug' => 'letter'], ['name' => 'Letter', 'uses_tax_declaration_fields' => false]);

        return app(DocumentWriter::class)->create([
            'office_id' => $office->id, 'document_type_id' => $type->id, 'title' => 'Purchase request',
            'original_filename' => 'request.pdf', 'storage_path' => 'documents/request.pdf', 'mime_type' => 'application/pdf',
            'file_size' => 1024, 'uploaded_by' => $user->id, 'ocr_status' => 'completed', ...$attributes,
        ]);
    }

    /** @param list<Office> $offices */
    private function routing(array $offices): DocumentRoute
    {
        $route = DocumentRoute::factory()->create(['name' => fake()->unique()->sentence(3)]);

        foreach ($offices as $index => $office) {
            $route->steps()->create(['office_id' => $office->id, 'name' => $office->name, 'position' => $index + 1]);
        }

        return $route;
    }
}
