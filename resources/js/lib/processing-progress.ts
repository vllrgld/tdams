export type ProcessingPhase = 'uploading' | 'reading';

export function estimateProcessingProgress(
    elapsedMs: number,
    complete = false,
    phase: ProcessingPhase = 'reading',
): number {
    if (complete) return 100;

    const uploading = phase === 'uploading';
    const start = uploading ? 5 : 25;
    const ceiling = uploading ? 25 : 95;
    const duration = uploading ? 4_000 : 8_000;

    return Math.min(
        ceiling,
        Math.round(
            start +
                (ceiling - start) *
                    (1 - Math.exp(-Math.max(0, elapsedMs) / duration)),
        ),
    );
}
