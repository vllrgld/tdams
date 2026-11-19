<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\User;
use App\Services\Documents\DocumentWorkflow;
use App\Services\Offices\CurrentOffice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DocumentWorkflowController extends Controller
{
    public function show(Document $document, DocumentWorkflow $workflow, CurrentOffice $currentOffice): JsonResponse
    {
        return response()->json($workflow->details($document, $currentOffice->office() ?? abort(403)));
    }

    public function endorse(Request $request, Document $document, DocumentWorkflow $workflow, CurrentOffice $currentOffice): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $document = $workflow->endorse($document->id, $currentOffice->office() ?? abort(403), $user);

        return $this->show($document, $workflow, $currentOffice);
    }

    public function update(Request $request, Document $document, DocumentWorkflow $workflow, CurrentOffice $currentOffice): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(Document::DECISION_STATUSES)],
            'comments' => ['required_if:status,disapproved', 'nullable', 'string', 'max:5000'],
            'routing_version' => ['required', 'integer', 'min:0'],
        ], [
            'status.in' => 'Choose approve or disapprove.',
            'comments.required_if' => 'Add a comment explaining why this document is disapproved.',
        ]);
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $document = $workflow->updateStatus($document->id, $currentOffice->office() ?? abort(403), $user, $validated['status'], $validated['comments'] ?? null, (int) $validated['routing_version']);

        return $this->show($document, $workflow, $currentOffice);
    }
}
