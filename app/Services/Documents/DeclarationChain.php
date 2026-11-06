<?php

namespace App\Services\Documents;

use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\TaxDeclaration;

class DeclarationChain
{
    /**
     * @return list<array{taxDeclarationNumber: string, document: array<string, mixed>|null, declarationDate: string|null}>
     */
    public function previous(Document $document): array
    {
        $document->loadMissing('taxDeclaration');
        $declaration = $document->taxDeclaration;

        if (! $declaration instanceof TaxDeclaration) {
            return [];
        }

        $chain = [];
        $seenDeclarationIds = [$declaration->id];
        $current = $declaration;

        while (true) {
            $previousId = $current->previous_declaration_id;
            $printed = $current->previous_tax_declaration_number;

            if (is_int($previousId) && ! in_array($previousId, $seenDeclarationIds, true)) {
                $previous = TaxDeclaration::query()
                    ->with(['property', 'owners', 'documents'])
                    ->find($previousId);

                if (! $previous instanceof TaxDeclaration) {
                    if (is_string($printed) && $printed !== '') {
                        $chain[] = [
                            'taxDeclarationNumber' => $printed,
                            'document' => null,
                            'declarationDate' => $current->previous_declaration_date?->toDateString(),
                        ];
                    }

                    break;
                }

                $seenDeclarationIds[] = $previous->id;
                $file = $previous->documents->sortByDesc('id')->first();
                $chain[] = [
                    'taxDeclarationNumber' => $previous->tax_declaration_number ?? (is_string($printed) ? $printed : ''),
                    'document' => $file === null ? null : (new DocumentResource($file))->resolve(),
                    'declarationDate' => $previous->declaration_date?->toDateString()
                        ?? $current->previous_declaration_date?->toDateString(),
                ];
                $current = $previous;

                continue;
            }

            if (is_string($printed) && $printed !== '') {
                $chain[] = [
                    'taxDeclarationNumber' => $printed,
                    'document' => null,
                    'declarationDate' => $current->previous_declaration_date?->toDateString(),
                ];
            }

            break;
        }

        return $chain;
    }

    /**
     * @param  list<int>  $seenIds
     * @return list<array{taxDeclarationNumber: string, document: array<string, mixed>|null, declarationDate: string|null}>
     */
    public function following(Document $document, array $seenIds = []): array
    {
        $document->loadMissing('taxDeclaration');
        $declaration = $document->taxDeclaration;

        if (! $declaration instanceof TaxDeclaration) {
            return [];
        }

        $chain = [];
        $seenIds = $seenIds === [] ? [$document->id] : $seenIds;

        if (! in_array($document->id, $seenIds, true)) {
            $seenIds[] = $document->id;
        }

        $seenDeclarationIds = [$declaration->id];
        $current = $declaration;

        while (true) {
            $next = TaxDeclaration::query()
                ->with(['property', 'owners', 'documents'])
                ->where('previous_declaration_id', $current->id)
                ->latest('id')
                ->first();

            if (! $next instanceof TaxDeclaration || in_array($next->id, $seenDeclarationIds, true)) {
                break;
            }

            $file = $next->documents->sortByDesc('id')->first();

            if ($file instanceof Document && in_array($file->id, $seenIds, true)) {
                break;
            }

            $seenDeclarationIds[] = $next->id;

            if ($file instanceof Document) {
                $seenIds[] = $file->id;
                $file->setRelation('taxDeclaration', $next);
            }

            $chain[] = [
                'taxDeclarationNumber' => $next->tax_declaration_number ?? '',
                'document' => $file === null ? null : (new DocumentResource($file))->resolve(),
                'declarationDate' => $next->declaration_date?->toDateString(),
            ];
            $current = $next;
        }

        return $chain;
    }

    /**
     * @return array{originId: int, entries: list<array{taxDeclarationNumber: string, document: array<string, mixed>|null, declarationDate: string|null}>}
     */
    public function full(Document $document): array
    {
        $previous = $this->previous($document);
        $seenIds = [$document->id];

        foreach ($previous as $entry) {
            $documentId = $entry['document']['id'] ?? null;

            if (is_int($documentId)) {
                $seenIds[] = $documentId;
            }
        }

        return [
            'originId' => $document->id,
            'entries' => [
                ...array_reverse($previous),
                [
                    'taxDeclarationNumber' => $document->tax_declaration_number ?? '',
                    'document' => (new DocumentResource($document))->resolve(),
                    'declarationDate' => $document->declaration_date?->toDateString(),
                ],
                ...$this->following($document, $seenIds),
            ],
        ];
    }
}
