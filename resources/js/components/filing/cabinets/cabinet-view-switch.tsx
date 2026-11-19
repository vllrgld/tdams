import { Button } from '@/components/ui/button';

export type CabinetView = 'model' | 'current';

export default function CabinetViewSwitch({
    value,
    onChange,
}: {
    value: CabinetView;
    onChange: (value: CabinetView) => void;
}) {
    return (
        <div
            role="group"
            aria-label="Cabinet preview style"
            className="flex shrink-0 justify-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900"
        >
            {(['model', 'current'] as const).map((view) => (
                <Button
                    key={view}
                    type="button"
                    size="sm"
                    variant={value === view ? 'secondary' : 'ghost'}
                    aria-pressed={value === view}
                    className="rounded-lg text-xs"
                    onClick={() => onChange(view)}
                >
                    {view === 'model' ? '3D model' : 'Current view'}
                </Button>
            ))}
        </div>
    );
}
