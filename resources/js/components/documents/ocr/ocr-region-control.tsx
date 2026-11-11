import { Popover } from '@base-ui/react/popover';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function OcrRegionControl({
    id,
    index,
    label,
    selected,
    onSelect,
    onHover,
    onCorrect,
    className,
}: {
    id: string;
    index: number;
    label: string;
    selected: boolean;
    onSelect?: (index: number) => void;
    onHover?: (index: number | null) => void;
    onCorrect?: (index: number) => void;
    className?: string;
}) {
    const trigger = (
        <button
            data-pan-region
            id={id}
            type="button"
            aria-label={label}
            aria-pressed={selected}
            onPointerEnter={() => onHover?.(index)}
            onPointerLeave={() => onHover?.(null)}
            onFocus={() => onHover?.(index)}
            onBlur={() => onHover?.(null)}
            onClick={() => onSelect?.(index)}
            className={cn(
                'absolute inset-0 size-full cursor-pointer bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-900',
                className,
            )}
        />
    );

    if (!onCorrect) return trigger;

    return (
        <Popover.Root>
            <Popover.Trigger
                render={trigger}
                openOnHover
                delay={150}
                closeDelay={150}
            />
            <Popover.Portal>
                <Popover.Positioner
                    side="bottom"
                    align="end"
                    sideOffset={4}
                    className="z-[70]"
                >
                    <Popover.Popup
                        aria-label="OCR block actions"
                        className="border border-border bg-card p-1 text-foreground shadow-lg"
                        onPointerEnter={() => onHover?.(index)}
                        onPointerLeave={() => onHover?.(null)}
                    >
                        <Popover.Close
                            render={
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 rounded-none px-2 text-xs"
                                    onClick={() => onCorrect(index)}
                                />
                            }
                        >
                            <Pencil aria-hidden="true" />
                            Correct
                        </Popover.Close>
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}
