<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class DeleteDocumentFiles implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public int $timeout = 60;

    /** @var list<int> */
    public array $backoff = [10, 30, 120, 300];

    /** @param list<string> $paths */
    public function __construct(public array $paths) {}

    public function handle(): void
    {
        if ($this->paths !== [] && ! Storage::disk('local')->delete($this->paths)) {
            throw new RuntimeException('Stored document files could not be removed.');
        }
    }
}
