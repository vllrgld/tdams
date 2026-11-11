import type { ReactNode, RefObject } from 'react';
import { ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ViewerActions({
    label,
    triggerRef,
    children,
}: {
    label: string;
    triggerRef?: RefObject<HTMLButtonElement | null>;
    children?: ReactNode;
}) {
    return (
        <div className="absolute right-4 bottom-4 z-20">
            <DropdownMenu>
                <DropdownMenuTrigger
                    ref={triggerRef}
                    aria-label={label}
                    title="Take action"
                    render={
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-11 rounded-full bg-background text-foreground shadow-md hover:bg-accent"
                        />
                    }
                >
                    <ListChecks className="size-5" aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    side="top"
                    align="end"
                    sideOffset={8}
                    positionerClassName="z-[70]"
                    className="min-w-48"
                >
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                        Take action
                    </DropdownMenuLabel>
                    {children ?? (
                        <DropdownMenuItem disabled>
                            No actions available
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
