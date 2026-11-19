import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentSearchMode } from '../../types';

const choices = [
    { value: 'all', label: 'All' },
    { value: 'tax', label: 'Tax' },
] as const;

export default function DocumentSearchModeSwitch({
    value,
    onChange,
}: {
    value: DocumentSearchMode;
    onChange: (value: DocumentSearchMode) => void;
}) {
    return (
        <div
            role="group"
            aria-label="Search by"
            className="flex flex-col"
            onPointerDown={(event) => event.preventDefault()}
        >
            {choices.map((choice) => {
                const selected = value === choice.value;

                return (
                    <button
                        key={choice.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onChange(choice.value)}
                        className={cn(
                            'relative flex w-full cursor-default items-center rounded-none py-1.5 pr-8 pl-2 text-left text-sm outline-hidden select-none hover:bg-blue-900 hover:text-white focus-visible:bg-blue-900 focus-visible:text-white',
                            selected
                                ? 'bg-blue-900 text-white'
                                : 'text-blue-900 dark:text-white',
                        )}
                    >
                        {choice.label}
                        {selected ? (
                            <Check
                                aria-hidden="true"
                                className="absolute right-2 size-4"
                            />
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
}
