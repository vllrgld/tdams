type UploadPhase =
    | 'destination'
    | 'file'
    | 'confirm'
    | 'upload'
    | 'ocr'
    | 'retry-ocr'
    | 'ocr-failed'
    | 'ocr-complete'
    | 'review'
    | 'map'
    | 'save';

type PreparationStep = 'destination' | 'file' | 'confirm';

export function getUploadPreparationSteps(filingPath: 'archive' | 'route') {
    return filingPath === 'archive'
        ? (['confirm', 'file'] as const)
        : (['file', 'confirm'] as const);
}

export function canEnterUploadPreparationStep(
    next: PreparationStep,
    selection: {
        filingPath: 'archive' | 'route';
        hasFile: boolean;
        hasArchiveLocation: boolean;
    },
) {
    const [first] = getUploadPreparationSteps(selection.filingPath);
    if (next === 'destination' || next === first) return true;

    return selection.filingPath === 'archive'
        ? selection.hasArchiveLocation
        : selection.hasFile;
}

export function getUploadStep(phase: UploadPhase) {
    if (
        phase === 'upload' ||
        phase === 'ocr-failed' ||
        phase === 'retry-ocr' ||
        phase === 'ocr-complete'
    ) {
        return 'ocr';
    }

    if (phase === 'map' || phase === 'save') return 'review';

    return phase;
}

export function getUploadConnectorStart(
    index: number,
    currentIndex: number,
    tracedThroughStep: number,
) {
    if (index >= currentIndex) return 0;

    return index < Math.max(tracedThroughStep, currentIndex - 1) ? 1 : 0;
}

export function getUploadProgress(phase: UploadPhase) {
    const currentIndex =
        phase === 'review' || phase === 'map' || phase === 'save'
            ? 2
            : phase === 'ocr' ||
                phase === 'retry-ocr' ||
                phase === 'ocr-failed' ||
                phase === 'ocr-complete'
              ? 1
              : 0;

    return {
        labels: ['Upload', 'Process', 'Verify'],
        currentIndex,
    };
}
