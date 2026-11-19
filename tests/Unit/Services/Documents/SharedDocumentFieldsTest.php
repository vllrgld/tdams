<?php

namespace Tests\Unit\Services\Documents;

use App\Services\Documents\SharedDocumentFields;
use PHPUnit\Framework\TestCase;

class SharedDocumentFieldsTest extends TestCase
{
    public function test_normalize_returns_listed_attachments_with_printed_pages(): void
    {
        $fields = SharedDocumentFields::normalize([
            'attachments' => [
                ['description' => 'Certified true copy of title', 'page' => '3'],
                'Sketch plan',
            ],
        ], false);

        $this->assertSame([
            ['description' => 'Certified true copy of title', 'page' => 3],
            ['description' => 'Sketch plan', 'page' => null],
        ], $fields[SharedDocumentFields::ATTACHMENTS]);
    }

    public function test_normalize_discards_blank_invalid_and_duplicate_attachments(): void
    {
        $fields = SharedDocumentFields::normalize([
            'attachments' => [
                '',
                '___',
                ['description' => '   ', 'page' => '2'],
                ['description' => 'Deed of sale', 'page' => 'not-a-page'],
                ['description' => 'deed of sale', 'page' => 4],
                ['page' => 1],
            ],
        ], false);

        $this->assertSame([
            ['description' => 'Deed of sale', 'page' => null],
        ], $fields[SharedDocumentFields::ATTACHMENTS]);
    }

    public function test_normalize_does_not_add_attachments_for_tax_fields(): void
    {
        $fields = SharedDocumentFields::normalize([
            'correspondent' => 'Office of the Governor',
            'attachments' => [
                ['description' => 'Invented enclosure', 'page' => '1'],
            ],
        ], true);

        $this->assertArrayNotHasKey(SharedDocumentFields::ATTACHMENTS, $fields);
        $this->assertSame('Office of the Governor', $fields[SharedDocumentFields::CORRESPONDENT]);
    }

    public function test_normalize_caps_attachments_at_thirty(): void
    {
        $items = [];

        for ($index = 1; $index <= 31; $index++) {
            $items[] = 'Enclosure '.$index;
        }

        $fields = SharedDocumentFields::normalize([
            'attachments' => $items,
        ], false);

        $this->assertCount(30, $fields[SharedDocumentFields::ATTACHMENTS]);
        $this->assertSame('Enclosure 1', $fields[SharedDocumentFields::ATTACHMENTS][0]['description']);
        $this->assertSame('Enclosure 30', $fields[SharedDocumentFields::ATTACHMENTS][29]['description']);
    }
}
