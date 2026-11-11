export type OcrContentBlock =
    | { type: 'text'; text: string }
    | {
          type: 'table';
          rows: {
              text: string;
              rowSpan: number;
              colSpan: number;
              header: boolean;
          }[][];
      };

export type OcrRegion = {
    kind?: 'line' | 'block';
    page: number;
    text: string;
    box: [number, number, number, number] | null;
    pageWidth: number | null;
    pageHeight: number | null;
    content?: OcrContentBlock[];
    words?: { text: string; box: [number, number, number, number] }[];
};

export function displayOcrText(text: string): string {
    return text
        .replace(/[\u2611\u2705\u2713\u2714][\uFE0E\uFE0F]?/gu, '\u2713\uFE0E')
        .replace(/\u2610[\uFE0E\uFE0F]?/gu, '\u2610\uFE0E');
}

export function contentText(
    content: OcrContentBlock[] | undefined,
    fallback = '',
): string {
    return content
        ? content
              .map((block) =>
                  block.type === 'text'
                      ? block.text
                      : block.rows
                            .map((row) =>
                                row.map((cell) => cell.text).join('\t'),
                            )
                            .join('\n'),
              )
              .join('\n')
        : fallback;
}

export function hasPosition(region: OcrRegion): boolean {
    const { box, pageWidth, pageHeight } = region;
    return (
        Array.isArray(box) &&
        box.length === 4 &&
        box.every(Number.isFinite) &&
        Number.isFinite(pageWidth) &&
        Number.isFinite(pageHeight) &&
        (pageWidth ?? 0) > 0 &&
        (pageHeight ?? 0) > 0 &&
        box[0] >= 0 &&
        box[1] >= 0 &&
        box[2] > box[0] &&
        box[3] > box[1] &&
        box[2] <= pageWidth! &&
        box[3] <= pageHeight!
    );
}

export function wordPositions(region: OcrRegion) {
    if (!hasPosition(region) || !region.words?.length) return [];
    const [left, top, right, bottom] = region.box!;
    const words = region.words;
    if (
        words.some(
            ({ text, box }) =>
                typeof text !== 'string' ||
                !text.trim() ||
                !Array.isArray(box) ||
                box.length !== 4 ||
                !box.every(Number.isFinite) ||
                box[0] < left ||
                box[1] < top ||
                box[2] > right ||
                box[3] > bottom ||
                box[2] <= box[0] ||
                box[3] <= box[1],
        )
    )
        return [];
    const normalize = (text: string) => text.trim().replace(/\s+/gu, ' ');
    if (
        normalize(words.map((word) => word.text).join(' ')) !==
        normalize(region.text)
    )
        return [];
    return words.map(({ text, box }) => ({
        text,
        left: (box[0] - left) / (right - left),
        top: (box[1] - top) / (bottom - top),
        width: (box[2] - box[0]) / (right - left),
        height: (box[3] - box[1]) / (bottom - top),
    }));
}

export function hasUncoveredText(text: string, regions: OcrRegion[]): boolean {
    const tokens = (value: string) =>
        value
            .normalize('NFKC')
            .toLowerCase()
            .match(/[\p{L}\p{N}]+/gu) ?? [];
    const available = new Map<string, number>();
    for (const region of regions) {
        for (const token of tokens(contentText(region.content, region.text))) {
            available.set(token, (available.get(token) ?? 0) + 1);
        }
    }
    for (const token of tokens(text)) {
        const count = available.get(token) ?? 0;
        if (count === 0) return true;
        available.set(token, count - 1);
    }
    return false;
}
