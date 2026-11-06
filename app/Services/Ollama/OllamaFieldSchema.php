<?php

namespace App\Services\Ollama;

use App\Services\Documents\DocumentFieldDefinitions as FieldDefinitions;

class OllamaFieldSchema
{
    private const REMARKS_GUIDANCE = 'For remarks, extract the actual text in areas labeled Remarks, Note, Notes, or Memoranda. Include printed notes as well as typed or handwritten annotations. Taxation and valuation notes are remarks too: retain their full wording, including ordinance and resolution citations, dates, and exceptions. Preserve the source wording; do not summarize or add unrelated page text. Exclude blank cancellation or previous-assessment templates, officer names, job titles, signatures, office headings, and routing stamps. Do not treat the word Memoranda followed only by staff credentials as a remark. Do not discard a note because it is printed, legal wording, or near a signature or page footer. Keep populated cancellation details and property-specific remarks. Treat section labels as boundaries: a Notes paragraph after a Memoranda staff block is a separate entry. Example: for "Remarks: This declaration cancels TD No. ____ PIN ____ Previous A.V Php ____ Previous Owner: ____. Memoranda: TEST OFFICER, ASSESSOR. Notes: For taxation purposes only under Ordinance No. 123.", return "For taxation purposes only under Ordinance No. 123." as remarks. If multiple relevant entries exist, include them all. If these areas are blank or contain only the excluded material, return an empty string for remarks.';

    /**
     * @return array<string, mixed>
     */
    public static function jsonSchema(): array
    {
        $properties = [];

        foreach (FieldDefinitions::definitions() as $name => $definition) {
            $properties[$name] = [
                'type' => 'string',
                'description' => $name === 'remarks'
                    ? self::REMARKS_GUIDANCE
                    : $definition['label'].'. Use an empty string when the text does not contain this value.',
            ];
        }

        return [
            'type' => 'object',
            'properties' => $properties,
            'required' => array_keys(FieldDefinitions::definitions()),
            'additionalProperties' => false,
        ];
    }

    public static function instructions(): string
    {
        $lines = [
            'Extract tax declaration fields from the OCR text.',
            'Return only the requested JSON object.',
            'Use an empty string when a value is not present. Do not guess.',
            'Dates must be YYYY-MM-DD.',
            'Area must be digits and an optional decimal point, without units.',
            self::REMARKS_GUIDANCE,
        ];

        foreach (FieldDefinitions::definitions() as $name => $definition) {
            $lines[] = $name.': '.$definition['label'];
        }

        return implode("\n", $lines);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, string|null>
     */
    public static function normalize(array $payload): array
    {
        $fields = [];

        foreach (FieldDefinitions::definitions() as $name => $definition) {
            $fields[$name] = self::normalizeValue($payload[$name] ?? null, $definition, $name);
        }

        return $fields;
    }

    /**
     * @param  array{label: string, max: int, date?: bool}  $definition
     */
    private static function normalizeValue(mixed $value, array $definition, string $name): ?string
    {
        if (is_int($value) || is_float($value)) {
            $value = (string) $value;
        }

        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        if ($value === '') {
            return null;
        }

        if ($name === 'remarks' && self::isBlankCancellationTemplate($value)) {
            return null;
        }

        if (($definition['date'] ?? false) === true) {
            $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);

            return $date instanceof \DateTimeImmutable && $date->format('Y-m-d') === $value
                ? $value
                : null;
        }

        if ($name === 'area') {
            return is_numeric($value) ? $value : null;
        }

        if (mb_strlen($value) > $definition['max']) {
            return mb_substr($value, 0, $definition['max']);
        }

        return $value;
    }

    private static function isBlankCancellationTemplate(string $value): bool
    {
        $blank = '[\s_\x{2013}\x{2014}\x{2026}.\-]*';

        return preg_match(
            '/^This\s+declaration\s+cancels\s+T\.?\s*D\.?\s*(?:No\.?|Number)\s*:?'.$blank
            .'P\.?\s*I\.?\s*N\.?\s*:?'.$blank
            .'Previous\s+A\.?\s*V\.?\s*(?:Php|PHP|\x{20B1})?\s*:?'.$blank
            .'Previous\s+Owner\s*:?'.$blank.'$/iu',
            $value,
        ) === 1;
    }
}
