<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentAuditResource;
use App\Models\Document;
use App\Models\DocumentAudit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DocumentAuditController extends Controller
{
    public function __invoke(Request $request, Document $document): JsonResponse
    {
        $validated = $request->validate([
            'cursor' => ['sometimes', 'nullable', 'string', 'max:500'],
            'filter' => ['sometimes', 'required', Rule::in(['activity', 'ocr', 'all'])],
        ]);

        $actions = match ($validated['filter'] ?? 'activity') {
            'ocr' => DocumentAudit::OCR_ACTIONS,
            'all' => [...DocumentAudit::ACTIVITY_ACTIONS, ...DocumentAudit::OCR_ACTIONS],
            default => DocumentAudit::ACTIVITY_ACTIONS,
        };
        $entries = $document->audits()->whereIn('action', $actions)->orderByDesc('occurred_at')->orderByDesc('id')->cursorPaginate(25);

        return response()->json([
            'data' => DocumentAuditResource::collection($entries->getCollection())->resolve(),
            'nextCursor' => $entries->nextCursor()?->encode(),
        ]);
    }
}
