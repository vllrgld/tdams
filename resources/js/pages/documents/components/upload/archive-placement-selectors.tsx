import { Label } from '@/components/ui/label';
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
                Add a folder or book from Manage Cabinets before filing a
                document.
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

    return (
        <div className="grid gap-4">
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
                        className="w-full rounded-none"
                    >
                        <SelectValue placeholder="Select cabinet" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                        {cabinetItems.map((item) => (
                            <SelectItem
                                key={item.value}
                                value={item.value}
                                className="rounded-none"
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
                        className="w-full rounded-none"
                    >
                        <SelectValue placeholder="Select drawer" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                        {drawerItems.map((item) => (
                            <SelectItem
                                key={item.value}
                                value={item.value}
                                className="rounded-none"
                            >
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="document-book">
                    {items[0]?.kind === 'folder'
                        ? 'Folder'
                        : items.length
                          ? 'Book'
                          : 'Folder or book'}
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
                        className="w-full rounded-none"
                    >
                        <SelectValue
                            placeholder={
                                items[0]?.kind === 'folder'
                                    ? 'Select folder'
                                    : 'Select book'
                            }
                        />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                        {bookItems.map((item) => (
                            <SelectItem
                                key={item.value}
                                value={item.value}
                                className="rounded-none"
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
