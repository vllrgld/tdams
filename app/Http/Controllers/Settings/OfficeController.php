<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\DocumentTransfer;
use App\Models\Office;
use App\Services\Offices\CurrentOffice;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OfficeController extends Controller
{
    public function index(): Response
    {
        $offices = Office::query()
            ->withCount('documents')
            ->orderBy('name')
            ->get()
            ->map(fn (Office $office): array => [
                'id' => $office->id,
                'name' => $office->name,
                'documentCount' => (int) $office->documents_count,
                'canManageRouting' => $office->can_manage_routing,
                'canRouteDocuments' => $office->can_route_documents,
                'canUploadToReceiving' => $office->can_upload_to_receiving,
                'canManageDocumentTypes' => $office->can_manage_document_types,
                'canTakeDocumentAction' => $office->can_take_document_action,
                'isReceiving' => $office->is_receiving,
            ])
            ->values();

        return Inertia::render('settings/offices', [
            'offices' => $offices,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('offices', 'name')],
            'can_manage_routing' => ['sometimes', 'required', 'boolean'],
            'can_route_documents' => ['sometimes', 'required', 'boolean'],
            'can_upload_to_receiving' => ['sometimes', 'required', 'boolean'],
            'can_manage_document_types' => ['sometimes', 'required', 'boolean'],
            'can_take_document_action' => ['sometimes', 'required', 'boolean'],
        ]);

        Office::query()->create($validated);

        return to_route('offices.index');
    }

    public function update(Request $request, Office $office): RedirectResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('offices', 'name')->ignore($office),
            ],
            'can_manage_routing' => ['sometimes', 'required', 'boolean'],
            'can_route_documents' => ['sometimes', 'required', 'boolean'],
            'can_upload_to_receiving' => ['sometimes', 'required', 'boolean'],
            'can_manage_document_types' => ['sometimes', 'required', 'boolean'],
            'can_take_document_action' => ['sometimes', 'required', 'boolean'],
        ]);

        $office->update($validated);

        return to_route('offices.index');
    }

    public function updatePermissions(Request $request, Office $office): RedirectResponse
    {
        $permissions = $request->validate([
            'can_upload_to_receiving' => ['sometimes', 'required', 'boolean'],
            'can_manage_routing' => ['sometimes', 'required', 'boolean'],
            'can_route_documents' => ['sometimes', 'required', 'boolean'],
            'can_manage_document_types' => ['sometimes', 'required', 'boolean'],
            'can_take_document_action' => ['sometimes', 'required', 'boolean'],
        ]);

        if ($permissions === []) {
            throw ValidationException::withMessages(['permissions' => 'Choose a permission to update.']);
        }

        $office->update($permissions);

        return to_route('offices.index');
    }

    public function destroy(Request $request, Office $office, CurrentOffice $currentOffice): RedirectResponse
    {
        if ($office->is_receiving) {
            throw ValidationException::withMessages(['office' => 'The receiving office is required for incoming documents and cannot be deleted.']);
        }

        if ($office->documents()->exists()) {
            $this->rejectDeleteWhileDocumentsRemain();
        }

        $this->rejectDeleteWhileCabinetsRemain($office);

        $this->rejectDeleteWhileRoutingUsesOffice($office);

        $wasCurrent = $currentOffice->id() === $office->id;

        try {
            $office->deleteOrFail();
        } catch (QueryException $exception) {
            $this->rejectDeleteWhileCabinetsRemain($office);
            $this->rejectDeleteWhileRoutingUsesOffice($office);
            if ($office->documents()->exists()) {
                $this->rejectDeleteWhileDocumentsRemain();
            }

            throw $exception;
        }

        if ($wasCurrent) {
            $fallback = Office::query()->orderBy('id')->first();

            if ($fallback instanceof Office) {
                $currentOffice->switch($fallback);
            } else {
                $request->session()->forget(CurrentOffice::SESSION_KEY);
            }
        }

        return to_route('offices.index');
    }

    public function updateCurrent(Request $request, CurrentOffice $currentOffice): RedirectResponse
    {
        $request->validate([
            'office_id' => ['required', 'integer', Rule::exists('offices', 'id')],
        ]);

        $office = Office::query()->findOrFail($request->integer('office_id'));
        $currentOffice->switch($office);

        return back();
    }

    private function rejectDeleteWhileDocumentsRemain(): never
    {
        throw ValidationException::withMessages([
            'office' => 'This office cannot be deleted while it still has documents.',
        ]);
    }

    private function rejectDeleteWhileCabinetsRemain(Office $office): void
    {
        if ($office->cabinets()->exists()) {
            throw ValidationException::withMessages([
                'office' => 'This office cannot be deleted while it still has cabinets.',
            ]);
        }
    }

    private function rejectDeleteWhileRoutingUsesOffice(Office $office): void
    {
        if (DocumentTransfer::query()->where('from_office_id', $office->id)->orWhere('to_office_id', $office->id)->exists()) {
            throw ValidationException::withMessages([
                'office' => 'This office has document transfer history and cannot be deleted.',
            ]);
        }

        if ($office->routingSteps()->exists()) {
            throw ValidationException::withMessages([
                'office' => 'This office is used in routing. Update the routing before deleting it.',
            ]);
        }
    }
}
