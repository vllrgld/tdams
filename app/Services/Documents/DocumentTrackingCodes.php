<?php

namespace App\Services\Documents;

use App\Models\Document;
use App\Models\TrackingCodeSetting;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class DocumentTrackingCodes
{
    public function __construct(private DocumentAuditRecorder $audit) {}

    public function assign(Document $document, bool $recordAudit = true): ?string
    {
        $code = DB::transaction(function () use ($document, $recordAudit): ?string {
            $locked = Document::query()->whereKey($document->id)->lockForUpdate()->firstOrFail();

            if ($locked->tracking_code !== null || $locked->filing_path !== Document::FILING_ROUTE) {
                return $locked->tracking_code;
            }

            $prefix = TrackingCodeSetting::current()->prefix;

            for ($attempt = 0; $attempt < 10; $attempt++) {
                $random = strtr(strtoupper(Str::random(8)), ['0' => '2', '1' => '3', 'I' => 'J', 'O' => 'P', 'L' => 'M']);
                $candidate = $prefix.'-'.now()->format('Y').'-'.substr($random, 0, 4).'-'.substr($random, 4);

                try {
                    DB::transaction(function () use ($locked, $candidate, $recordAudit): void {
                        $locked->tracking_code = $candidate;
                        $locked->save();
                        if ($recordAudit) {
                            $this->audit->record($locked, 'tracking_code_assigned', ['tracking_code' => ['before' => null, 'after' => $candidate]]);
                        }
                    });

                    return $candidate;
                } catch (UniqueConstraintViolationException $exception) {
                    if (! Document::query()->where('tracking_code', $candidate)->exists()) {
                        throw $exception;
                    }
                }
            }

            throw new RuntimeException('A unique tracking code could not be assigned. Please try again.');
        }, 3);

        $document->tracking_code = $code;

        return $code;
    }

    public function assignMissing(): int
    {
        $count = 0;
        Document::query()->where('filing_path', Document::FILING_ROUTE)->whereNull('tracking_code')
            ->chunkById(100, function (Collection $documents) use (&$count): void {
                foreach ($documents as $document) {
                    if ($this->assign($document) !== null) {
                        $count++;
                    }
                }
            });

        return $count;
    }
}
