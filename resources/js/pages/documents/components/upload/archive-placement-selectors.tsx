import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BookOpen, Check, Folder } from 'lucide-react';
import { filingName, filingTitle } from '@/lib/filing-appearance';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { ArchivePlacementCabinet } from '../../types';

export default function ArchivePlacementSelectors({
    cabinets,
    recentItemIds = [],
    cabinetId,
    drawerId,
    itemId,
    drawers,
    items,
    onCabinetChange,
    onDrawerChange,
    onItemChange,
}: {
    cabinets: ArchivePlacementCabinet[];
    recentItemIds?: string[];
    cabinetId: string;
    drawerId: string;
    itemId: string;
    drawers: ArchivePlacementCabinet['drawers'];
    items: ArchivePlacementCabinet['drawers'][number]['books'];
    onCabinetChange: (value: string) => void;
    onDrawerChange: (value: string) => void;
    onItemChange: (value: string) => void;
}) {
    if (cabinets.length === 0) {
        return (
            <p className="text-sm text-slate-600 dark:text-neutral-400">
                Add a filing item from Manage Cabinets before filing a document.
            </p>
        );
    }

    const cabinetItems = cabinets.map((cabinet) => ({
        value: cabinet.id,
        label: cabinet.name,
    }));
    const drawerItems = drawers.map((drawer) => ({
        value: drawer.id,
        label: drawer.label,
    }));
    const bookItems = items.map((book) => ({
        value: book.id,
        label: book.label,
    }));
    const recentLocations = [...new Set(recentItemIds)]
        .flatMap((id) => {
            for (const cabinet of cabinets) {
                for (const drawer of cabinet.drawers) {
                    const item = drawer.books.find((book) => book.id === id);
                    if (item) return [{ cabinet, drawer, item }];
                }
            }
            return [];
        })
        .slice(0, 2);

    return (
        <div className="grid gap-4">
            {recentLocations.length > 0 && (
                <fieldset className="grid min-w-0 gap-2 border-b border-slate-200 pb-4 dark:border-neutral-800">
                    <legend className="mb-2 text-sm font-medium">
                        Recent locations
                    </legend>
                    {recentLocations.map(({ cabinet, drawer, item }) => {
                        const selected =
                            cabinetId === cabinet.id &&
                            drawerId === drawer.id &&
                            itemId === item.id;
                        const Icon = item.kind === 'folder' ? Folder : BookOpen;
                        return (
                            <Button
                                key={item.id}
                                type="button"
                                variant="outline"
                                aria-pressed={selected}
                                className={cn(
                                    'h-auto w-full min-w-0 justify-start gap-3 rounded-lg px-3 py-2.5 text-left whitespace-normal shadow-none',
                                    selected &&
                                        'border-blue-900 bg-blue-50 text-blue-950 dark:border-blue-200 dark:bg-neutral-900 dark:text-white',
                                )}
                                onClick={() => {
                                    onCabinetChange(cabinet.id);
                                    onDrawerChange(drawer.id);
                                    onItemChange(item.id);
                                }}
                            >
                                <Icon
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-blue-900 dark:text-blue-200"
                                />
                                <span className="grid min-w-0 flex-1 gap-1">
                                    <span className="text-sm font-medium break-words">
                                        {item.label}
                                    </span>
                                    <span className="text-xs leading-5 font-normal break-words text-muted-foreground">
                                        {cabinet.name} / {drawer.label}
                                    </span>
                                </span>
                                {selected && (
                                    <Check
                                        aria-hidden="true"
                                        className="size-4 shrink-0"
                                    />
                                )}
                            </Button>
                        );
                    })}
                </fieldset>
            )}
            <div className="grid gap-2">
                <Label htmlFor="document-cabinet">Cabinet</Label>
                <Select
                    value={cabinetId}
                    onValueChange={(value) =>
                        onCabinetChange(typeof value === 'string' ? value : '')
                    }
                    items={cabinetItems}
                >
                    <SelectTrigger
                        id="document-cabinet"
                        className="w-full rounded-lg"
                    >
                        <SelectValue placeholder="Select cabinet" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                        {cabinetItems.map((item) => (
                            <SelectItem
                                key={item.value}
                                value={item.value}
                                className="rounded-md"
                            >
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="document-drawer">Drawer</Label>
                <Select
                    value={drawerId}
                    onValueChange={(value) =>
                        onDrawerChange(typeof value === 'string' ? value : '')
                    }
                    items={drawerItems}
                    disabled={!cabinetId}
                >
                    <SelectTrigger
                        id="document-drawer"
                        className="w-full rounded-lg"
                    >
                        <SelectValue placeholder="Select drawer" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                        {drawerItems.map((item) => (
                            <SelectItem
                                key={item.value}
                                value={item.value}
                                className="rounded-md"
                            >
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="document-book">
                    {items.length ? filingTitle(items[0].kind) : 'Filing item'}
                </Label>
                <Select
                    value={itemId}
                    onValueChange={(value) =>
                        onItemChange(typeof value === 'string' ? value : '')
                    }
                    items={bookItems}
                    disabled={!drawerId}
                >
                    <SelectTrigger
                        id="document-book"
                        className="w-full rounded-lg"
                    >
                        <SelectValue
                            placeholder={`Select ${filingName(items[0]?.kind)}`}
                        />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                        {bookItems.map((item) => (
                            <SelectItem
                                key={item.value}
                                value={item.value}
                                className="rounded-md"
                            >
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
