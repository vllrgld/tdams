<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentLocationResource;
use App\Models\Document;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\JsonResponse;

class DocumentLocationController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Document $document): JsonResponse
    {
        $document->load([
            'office', 'book.drawer.cabinet', 'documentRoute.steps.office', 'pendingTransfer.toOffice',
            'transfers' => fn (HasMany $transfers) => $transfers->with(['fromOffice', 'toOffice'])->orderBy('released_at')->orderBy('id'),
            'audits' => fn (HasMany $audits) => $audits->where('action', 'uploaded')->orderBy('occurred_at')->orderBy('id')->limit(1),
        ]);

        return response()->json((new DocumentLocationResource($document))->resolve());
    }
}
