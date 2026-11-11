<?php

namespace App\Services\Ocr;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMText;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\Table\Table;
use League\CommonMark\Extension\Table\TableExtension;
use League\CommonMark\Extension\Table\TableRow;
use League\CommonMark\Parser\MarkdownParser;
use League\CommonMark\Renderer\HtmlRenderer;

/**
 * @phpstan-type Cell array{text: string, rowSpan: int, colSpan: int, header: bool}
 * @phpstan-type Content array{type: 'text', text: string}|array{type: 'table', rows: list<list<Cell>>}
 */
class OcrContentParser
{
    private ?Environment $markdownEnvironment = null;

    /** @return list<Content> */
    public function parse(string $text): array
    {
        $text = $this->readableText($text, preg_match('/<table\b/i', $text) === 1);

        if (! preg_match('/<table\b/i', $text)) {
            return $this->markdown($text);
        }

        $document = new DOMDocument;
        $previous = libxml_use_internal_errors(true);

        try {
            $loaded = $document->loadHTML('<?xml encoding="UTF-8"><html><body>'.$text.'</body></html>', LIBXML_NONET);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }

        $body = $document->getElementsByTagName('body')->item(0);

        if (! $loaded || $body === null) {
            return [['type' => 'text', 'text' => $text]];
        }

        $content = [];
        $buffer = '';
        $this->visit($body, $content, $buffer);
        $this->flush($content, $buffer);

        $rendered = [];

        foreach ($content as $block) {
            array_push($rendered, ...($block['type'] === 'text' && str_contains($block['text'], '|')
                ? $this->markdown($block['text'])
                : [$block]));
        }

        return $rendered;
    }

    /** @return list<array<string, mixed>> */
    public function regions(mixed $regions): array
    {
        $result = [];

        foreach (is_array($regions) ? $regions : [] as $region) {
            if (! is_array($region) || ! is_string($region['text'] ?? null)) {
                continue;
            }

            if (($region['kind'] ?? null) === 'line') {
                $result[] = $region;

                continue;
            }

            $readable = $this->readableText($region['text'], true);
            $content = $this->parse($readable);

            if (array_any($content, fn (array $block): bool => $block['type'] === 'table')
                || $readable !== $region['text'] || $this->plainText($region['text']) !== $region['text']) {
                $region['content'] = $content;
            }

            $result[] = $region;
        }

        return $result;
    }

    /** @return list<list<Content>> */
    public function pageContents(?string $text, mixed $regions): array
    {
        if ($text === null) {
            return [];
        }

        $regions = is_array($regions) ? $regions : [];
        $pages = [];

        foreach (explode("\f", $text) as $index => $page) {
            $pageRegions = array_filter($regions, fn (mixed $region): bool => is_array($region) && ($region['page'] ?? null) === $index + 1);
            $lineBased = $pageRegions !== [] && array_all($pageRegions, fn (array $region): bool => ($region['kind'] ?? null) === 'line');
            $pages[] = $lineBased ? [['type' => 'text', 'text' => $page]] : $this->parse($page);
        }

        return $pages;
    }

    public function plainText(string $text): string
    {
        return implode("\n", array_map(fn (array $block): string => $block['type'] === 'text'
            ? $block['text']
            : implode("\n", array_map(fn (array $row): string => implode("\t", array_column($row, 'text')), $block['rows'])), $this->parse($text)));
    }

    public function mappingText(string $text, mixed $regions): string
    {
        $parsedRegions = $this->regions($regions);

        if ($parsedRegions === []) {
            return $text;
        }

        $pages = [];

        foreach (explode("\f", $text) as $index => $page) {
            $pages[] = [
                'page' => $index + 1,
                'text' => $page,
                'regions' => array_values(array_map(fn (array $region): array => [
                    'text' => $region['text'],
                    'box' => $region['box'] ?? null,
                    'pageWidth' => $region['pageWidth'] ?? null,
                    'pageHeight' => $region['pageHeight'] ?? null,
                    ...(($region['corrected'] ?? false) === true ? ['corrected' => true] : []),
                ], array_filter($parsedRegions, fn (array $region): bool => ($region['page'] ?? null) === $index + 1))),
            ];
        }

        return json_encode(['pages' => $pages], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR);
    }

    private function readableText(string $text, bool $literalBreaks = false): string
    {
        $text = preg_replace_callback('/<[^>]+>/s', fn (array $match): string => str_replace(['\\"', "\\'"], ['"', "'"], $match[0]), $text) ?? $text;
        if ($literalBreaks) {
            $text = preg_replace('/\\\\+(?:r\\\\+n|n)/u', "\n", $text) ?? $text;
        }

        for ($depth = 0; $depth < 5; $depth++) {
            $text = preg_replace('/\\\\+(?:underline|text|mathrm|textrm|mathbf|mathit)\{([^{}]*)\}/u', '$1', $text) ?? $text;
        }

        $text = preg_replace('/\$\s*([^$\n]+?)\s*\$/u', '$1', $text) ?? $text;

        return preg_replace('/^\h{0,3}#{1,6}\h+/mu', '', $text) ?? $text;
    }

    /**
     * @param  list<Content>  $content
     */
    private function visit(DOMNode $node, array &$content, string &$buffer): void
    {
        if ($node instanceof DOMText) {
            $buffer .= $node->textContent;

            return;
        }

        $tag = strtolower($node->nodeName);

        if (in_array($tag, ['script', 'style', 'iframe', 'object', 'noscript', 'svg'], true)) {
            return;
        }

        if ($tag === 'table' && $node instanceof DOMElement) {
            $this->flush($content, $buffer);
            $rows = $this->tableRows($node);

            if ($rows !== []) {
                $content[] = ['type' => 'table', 'rows' => $rows];
            } else {
                $buffer .= $this->text($node);
            }

            return;
        }

        if ($tag === 'br') {
            $buffer .= "\n";

            return;
        }

        foreach ($node->childNodes as $child) {
            $this->visit($child, $content, $buffer);
        }

        if (in_array($tag, ['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4'], true)) {
            $buffer .= "\n";
        }
    }

    /** @return list<list<Cell>> */
    private function tableRows(DOMElement $table): array
    {
        $rows = [];

        foreach ($table->getElementsByTagName('tr') as $row) {
            $parent = $row->parentNode;

            while ($parent !== null && strtolower($parent->nodeName) !== 'table') {
                $parent = $parent->parentNode;
            }

            if ($parent !== $table) {
                continue;
            }

            $remaining = 0;

            for ($sibling = $row; $sibling !== null; $sibling = $sibling->nextSibling) {
                if (strtolower($sibling->nodeName) === 'tr') {
                    $remaining++;
                }
            }

            $cells = [];

            foreach ($row->childNodes as $cell) {
                if (! $cell instanceof DOMElement || ! in_array(strtolower($cell->tagName), ['td', 'th'], true)) {
                    continue;
                }

                $cells[] = [
                    'text' => $this->readableText($this->text($cell), true),
                    'rowSpan' => $this->span($cell->getAttribute('rowspan'), $remaining),
                    'colSpan' => $this->span($cell->getAttribute('colspan')),
                    'header' => strtolower($cell->tagName) === 'th',
                ];
            }

            if ($cells !== []) {
                $rows[] = $cells;
            }
        }

        return $rows;
    }

    private function span(string $value, int $remaining = 1): int
    {
        if (! ctype_digit($value)) {
            return 1;
        }

        return $value === '0' ? max(1, min(1000, $remaining)) : max(1, min(1000, (int) $value));
    }

    private function text(DOMNode $node): string
    {
        if ($node instanceof DOMText) {
            return $node->textContent;
        }

        $tag = strtolower($node->nodeName);

        if (in_array($tag, ['script', 'style', 'iframe', 'object', 'noscript', 'svg'], true)) {
            return '';
        }

        if ($tag === 'br') {
            return "\n";
        }

        if ($tag === 'tr') {
            $cells = [];

            foreach ($node->childNodes as $child) {
                if ($child instanceof DOMElement && in_array(strtolower($child->tagName), ['td', 'th'], true)) {
                    $cells[] = $this->text($child);
                }
            }

            return implode("\t", $cells)."\n";
        }

        $text = '';

        foreach ($node->childNodes as $child) {
            $text .= $this->text($child);
        }

        return ($tag === 'table' ? "\n" : '').$text.(in_array($tag, ['p', 'div'], true) ? "\n" : '');
    }

    /** @return list<Content> */
    private function markdown(string $text): array
    {
        if (! str_contains($text, '|')) {
            return [['type' => 'text', 'text' => $text]];
        }

        if ($this->markdownEnvironment === null) {
            $this->markdownEnvironment = new Environment(['allow_unsafe_links' => false, 'max_nesting_level' => 50]);
            $this->markdownEnvironment->addExtension(new CommonMarkCoreExtension);
            $this->markdownEnvironment->addExtension(new TableExtension);
        }

        $document = (new MarkdownParser($this->markdownEnvironment))->parse($text);
        $renderer = new HtmlRenderer($this->markdownEnvironment);
        $lines = explode("\n", $text);
        $content = [];
        $cursor = 0;
        $walker = $document->walker();

        while (($event = $walker->next()) !== null) {
            $table = $event->getNode();

            if (! $event->isEntering() || ! $table instanceof Table) {
                continue;
            }

            $start = $table->getStartLine();
            $end = $table->getEndLine();

            if ($start === null || $end === null || $start - 1 < $cursor) {
                continue;
            }

            $rowCount = 0;

            foreach ($table->iterator() as $node) {
                if ($node instanceof TableRow) {
                    $rowCount++;
                }
            }

            $start = max($start, $end - $rowCount);
            $buffer = implode("\n", array_slice($lines, $cursor, $start - 1 - $cursor));

            if ($start - 1 > $cursor) {
                $buffer .= "\n";
            }

            $this->flush($content, $buffer);
            array_push($content, ...$this->parse($renderer->renderNodes([$table])));
            $cursor = $end;
        }

        $buffer = implode("\n", array_slice($lines, $cursor));
        $this->flush($content, $buffer);

        return $content;
    }

    /** @param list<Content> $content */
    private function flush(array &$content, string &$buffer): void
    {
        if ($buffer !== '') {
            $content[] = ['type' => 'text', 'text' => $buffer];
            $buffer = '';
        }
    }
}
