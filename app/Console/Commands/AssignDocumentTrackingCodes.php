<?php

namespace App\Console\Commands;

use App\Services\Documents\DocumentTrackingCodes;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('documents:assign-tracking-codes')]
#[Description('Assign missing tracking codes to routed documents without changing archived documents')]
class AssignDocumentTrackingCodes extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(DocumentTrackingCodes $codes): int
    {
        $this->info('Assigned '.$codes->assignMissing().' tracking codes.');

        return self::SUCCESS;
    }
}
