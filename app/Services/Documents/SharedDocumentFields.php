<?php

namespace App\Services\Documents;

class SharedDocumentFields
{
    public const TITLE = 'title';

    public const CORRESPONDENT = 'correspondent';

    public const LETTER_DATE = 'letter_date';

    public const REMARKS = 'remarks';

    public const ATTACHMENTS = 'attachments';

    /**
     * Columns stored on the document for non-tax types.
     *
     * @var list<string>
     */
    public const METADATA_COLUMNS = [
        self::TITLE,
        self::LETTER_DATE,
        self::REMARKS,
    ];

    public static function helpText(string $name): string
    {
        return match ($name) {
            self::TITLE => 'The document title or subject as printed, such as a memorandum subject or letter heading. Do not use the filename unless it is printed on the document.',
            self::CORRESPONDENT => 'The person, office, or organization that sent or issued the document, as printed. Do not substitute the property owner, recipient, or a signatory unless that name is printed as the sender or issuing office.',
            self::LETTER_DATE => 'Date printed on the letter. Do not use the upload date. Leave incomplete dates blank.',
            self::REMARKS => 'Notes, remarks, or a short description of the document as printed. Preserve wording; do not invent content.',
            self::ATTACHMENTS => 'Enclosures named on the letter under labels such as Attachment, Attachments, Attached, Enclosure, Encl., or Annex. Copy each item as printed. Include a page number only when the letter states which page that enclosure occupies. Return an empty list when none are listed. Do not invent items or use the first page of the scan as a default.',
            default => 'Copy only a value supported by the document. Leave absent or ambiguous values blank.',
        };
    }

    /**
     * @return array<string, array{label: string, max: int, date?: bool}>
     */
    public static function definitions(): array
    {
        return [
            self::CORRESPONDENT => ['label' => 'Correspondent', 'max' => 255],
        ];
    }

    /**
     * @return array<string, array{label: string, max: int, date?: bool}>
     */
    public static function metadataDefinitions(): array
    {
        return [
            self::TITLE => ['label' => 'Title', 'max' => 255],
            self::CORRESPONDENT => ['label' => 'Correspondent', 'max' => 255],
            self::LETTER_DATE => ['label' => 'Date of letter', 'max' => 10, 'date' => true],
            self::REMARKS => ['label' => 'Remarks', 'max' => 10000],
        ];
    }

    /**
     * @return array<string, array{label: string, max: int, date?: bool}>
     */
    public static function forMapping(bool $taxFields = true): array
    {
        return $taxFields ? self::definitions() : self::metadataDefinitions();
    }

    /**
     * @return array<string, list<string>>
     */
    public static function rules(): array
    {
        $rules = [];

        foreach (self::metadataDefinitions() as $name => $definition) {
            $rules[$name] = ($definition['date'] ?? false) === true
                ? ['nullable', 'date']
                : ['nullable', 'string', 'max:'.$definition['max']];
        }

        return $rules;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function normalize(array $payload, bool $taxFields = true): array
    {
        $fields = [];

        foreach (self::forMapping($taxFields) as $name => $definition) {
            $value = $payload[$name] ?? null;

            if (is_int($value) || is_float($value)) {
                $value = (string) $value;
            }

            if (! is_string($value)) {
                $fields[$name] = null;

                continue;
            }

            $value = trim($value);

            if ($value === '' || preg_match('/^[\s_.\x{2013}\x{2014}\x{2026}-]+$/u', $value) === 1) {
                $fields[$name] = null;

                continue;
            }

            if (($definition['date'] ?? false) === true) {
                $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);
                $fields[$name] = $date instanceof \DateTimeImmutable && $date->format('Y-m-d') === $value
                    ? $value
                    : null;

                continue;
            }

            $fields[$name] = mb_strlen($value) > $definition['max']
                ? mb_substr($value, 0, $definition['max'])
                : $value;
        }

        if (! $taxFields) {
            $fields[self::ATTACHMENTS] = self::normalizeAttachments($payload[self::ATTACHMENTS] ?? null);
        }

        return $fields;
    }

    /**
     * @return list<array{description: string, page: int|null}>
     */
    public static function normalizeAttachments(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $attachments = [];
        $seen = [];

        foreach ($value as $item) {
            $description = null;
            $page = null;

            if (is_string($item)) {
                $description = trim($item);
            } elseif (is_array($item) && ! array_is_list($item)) {
                $rawDescription = $item['description'] ?? null;
                $description = is_string($rawDescription) ? trim($rawDescription) : null;
                $page = self::normalizeAttachmentPage($item['page'] ?? null);
            }

            if (! is_string($description) || $description === '' || preg_match('/^[\s_.\x{2013}\x{2014}\x{2026}-]+$/u', $description) === 1) {
                continue;
            }

            if (mb_strlen($description) > 255) {
                $description = mb_substr($description, 0, 255);
            }

            $key = mb_strtolower($description);

            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $attachments[] = [
                'description' => $description,
                'page' => $page,
            ];

            if (count($attachments) === 30) {
                break;
            }
        }

        return $attachments;
    }

    private static function normalizeAttachmentPage(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value >= 1 && $value <= 9999 ? $value : null;
        }

        if (is_float($value) && $value === floor($value)) {
            return self::normalizeAttachmentPage((int) $value);
        }

        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        if ($value === '' || preg_match('/^\d+$/', $value) !== 1) {
            return null;
        }

        $page = (int) $value;

        return $page >= 1 && $page <= 9999 ? $page : null;
    }

    /**
     * @return array{id: string, title: string, tabLabel: string, fields: list<array{name: string, label: string, maxLength: int, type: string, help: string}>}
     */
    public static function reviewSection(): array
    {
        return self::section('document', 'Document', 'Document', [self::CORRESPONDENT]);
    }

    /**
     * @return list<array{id: string, title: string, tabLabel: string, fields: list<array{name: string, label: string, maxLength: int, type: string, help: string}>}>
     */
    public static function metadataReviewSections(): array
    {
        return [
            self::section('document', 'Document', 'Document', [self::TITLE, self::CORRESPONDENT, self::LETTER_DATE]),
            self::section('remarks', 'Remarks', 'Remarks', [self::REMARKS]),
        ];
    }

    /**
     * @param  list<string>  $names
     * @return array{id: string, title: string, tabLabel: string, fields: list<array{name: string, label: string, maxLength: int, type: string, help: string}>}
     */
    private static function section(string $id, string $title, string $tabLabel, array $names): array
    {
        $definitions = self::metadataDefinitions();
        $fields = [];

        foreach ($names as $name) {
            $definition = $definitions[$name];
            $fields[] = [
                'name' => $name,
                'label' => $definition['label'],
                'maxLength' => $definition['max'],
                'help' => self::helpText($name),
                'type' => match (true) {
                    ($definition['date'] ?? false) === true => 'date',
                    $name === self::REMARKS => 'textarea',
                    default => 'text',
                },
            ];
        }

        return [
            'id' => $id,
            'title' => $title,
            'tabLabel' => $tabLabel,
            'fields' => $fields,
        ];
    }
}
