<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Office;
use App\Models\User;
use App\Services\Documents\DocumentOfficeActions;
use App\Services\Offices\CurrentOffice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DocumentOfficeActionController extends Controller
{
    public function index(Request $request, CurrentOffice $currentOffice, DocumentOfficeActions $actions): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', Rule::in(['receive', 'release', 'revert'])],
            'q' => ['nullable', 'string', 'max:200'],
        ]);

        return response()->json($actions->options($this->office($currentOffice), $validated['action'], trim($validated['q'] ?? '')));
    }

    public function release(Request $request, CurrentOffice $currentOffice, DocumentOfficeActions $actions): JsonResponse
    {
        $validated = $request->validate([
            'document_id' => ['required_without:tracking_code', 'nullable', 'integer', 'min:1'],
            'tracking_code' => ['nullable', 'string', 'max:40'],
            'office_id' => ['required', 'integer'],
            'destination_office_id' => ['nullable', 'integer'],
            'document_route_id' => ['sometimes', 'nullable', 'integer', Rule::exists('document_routes', 'id')],
            'endorse' => ['sometimes', 'required', 'boolean'],
        ]);
        $office = $this->office($currentOffice);
        $this->ensureOffice($office, (int) $validated['office_id']);
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        if (isset($validated['document_route_id'])) {
            $validated['document_route_id'] = (int) $validated['document_route_id'];
        }

        $transfer = $actions->release(
            $this->documentId($request), $office, $user,
            isset($validated['destination_office_id']) ? (int) $validated['destination_office_id'] : null,
            Arr::only($validated, ['document_route_id']),
            (bool) ($validated['endorse'] ?? false),
        );

        return response()->json(['message' => 'Document released.', 'transferId' => $transfer->id, 'trackingCode' => $transfer->document->tracking_code]);
    }

    public function receive(Request $request, CurrentOffice $currentOffice, DocumentOfficeActions $actions): JsonResponse
    {
        $validated = $request->validate([
            'document_id' => ['required_without:tracking_code', 'nullable', 'integer', 'min:1'],
            'tracking_code' => ['nullable', 'string', 'max:40'],
            'office_id' => ['required', 'integer'],
        ]);
        $office = $this->office($currentOffice);
        $this->ensureOffice($office, (int) $validated['office_id']);
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $actions->receive($this->documentId($request), $office, $user);

        return response()->json(['message' => 'Document received.']);
    }

    private function office(CurrentOffice $currentOffice): Office
    {
        return $currentOffice->office() ?? abort(403, 'Select an office first.');
    }

    public function revert(Request $request, CurrentOffice $currentOffice, DocumentOfficeActions $actions): JsonResponse
    {
        $validated = $request->validate([
            'document_id' => ['required', 'integer', 'min:1'],
            'transfer_id' => ['required', 'integer', 'min:1'],
            'office_id' => ['required', 'integer'],
        ]);
        $office = $this->office($currentOffice);
        $this->ensureOffice($office, (int) $validated['office_id']);
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $actions->revert((int) $validated['document_id'], (int) $validated['transfer_id'], $office, $user);

        return response()->json(['message' => 'Release reverted. The document is back in your office.']);
    }

    private function documentId(Request $request): int
    {
        if ($request->filled('tracking_code')) {
            $query = Document::query()->where('tracking_code', strtoupper(trim($request->string('tracking_code')->toString())));

            if ($request->filled('document_id')) {
                $query->whereKey($request->integer('document_id'));
            }

            $id = $query->value('id');
            abort_unless(is_numeric($id), 404);

            return (int) $id;
        }

        return $request->integer('document_id');
    }

    private function ensureOffice(Office $office, int $expectedId): void
    {
        if ($office->id !== $expectedId) {
            throw ValidationException::withMessages(['office_id' => 'Your active office changed. Close and reopen this action.']);
        }
    }
}
