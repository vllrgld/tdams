import { useEffect, useState } from 'react';
import { CheckIcon, FileTextIcon } from 'lucide-react';
import {
    Progress,
    ProgressLabel,
    ProgressValue,
} from '@/components/ui/progress';
import { formatFileSize } from '@/lib/document-formatters';
import {
    estimateProcessingProgress,
    type ProcessingPhase,
} from '@/lib/processing-progress';

type DocumentProcessingProgressProps = {
    filename: string;
    fileSize?: number;
    uploading?: boolean;
    complete: boolean;
    onComplete: () => void;
};

export default function DocumentProcessingProgress({
    filename,
    fileSize,
    uploading = false,
    complete,
    onComplete,
}: DocumentProcessingProgressProps) {
    const phase: ProcessingPhase = uploading ? 'uploading' : 'reading';
    const [timing, setTiming] = useState({ phase, elapsedMs: 0 });
    const elapsedMs = timing.phase === phase ? timing.elapsedMs : 0;
    const progress = estimateProcessingProgress(elapsedMs, complete, phase);

    useEffect(() => {
        if (complete) {
            const timer = setTimeout(onComplete, 450);
            return () => clearTimeout(timer);
        }

        const startedAt = performance.now();
        const timer = setInterval(() => {
            const elapsed = performance.now() - startedAt;
            setTiming({ phase, elapsedMs: elapsed });
            if (
                estimateProcessingProgress(elapsed, false, phase) ===
                (uploading ? 25 : 95)
            )
                clearInterval(timer);
        }, 150);

        return () => clearInterval(timer);
    }, [complete, onComplete, phase, uploading]);

    return (
        <div aria-busy={!complete} className="flex w-full flex-col gap-4">
            <div className="flex min-w-0 items-center gap-3 border-b border-slate-200 pb-4 dark:border-neutral-800">
                <div className="flex size-10 shrink-0 items-center justify-center bg-slate-50 text-blue-900 dark:bg-neutral-950 dark:text-blue-200">
                    {complete ? (
                        <CheckIcon aria-hidden="true" className="size-5" />
                    ) : (
                        <FileTextIcon aria-hidden="true" className="size-5" />
                    )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p
                        title={filename}
                        className="truncate text-sm font-medium text-slate-900 dark:text-neutral-100"
                    >
                        {filename}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                        {fileSize !== undefined &&
                            `${formatFileSize(fileSize)} · `}
                        {uploading ? 'Uploading file' : 'File saved'}
                    </p>
                </div>
            </div>
            <Progress
                value={progress}
                className="**:data-[slot=progress-indicator]:rounded-none **:data-[slot=progress-indicator]:bg-blue-900 **:data-[slot=progress-track]:h-1.5 **:data-[slot=progress-track]:rounded-none **:data-[slot=progress-track]:bg-slate-100 dark:**:data-[slot=progress-indicator]:bg-blue-700 dark:**:data-[slot=progress-track]:bg-neutral-900"
            >
                <ProgressLabel className="font-medium text-slate-700 dark:text-neutral-300">
                    {complete
                        ? 'Processing complete'
                        : uploading
                          ? 'Uploading document'
                          : 'Reading document'}
                </ProgressLabel>
                <ProgressValue className="font-medium text-blue-900 dark:text-blue-200" />
            </Progress>
        </div>
    );
}
