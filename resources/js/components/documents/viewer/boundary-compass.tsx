import type { ReactNode } from 'react';
import type { ArchivedDocument } from '@/types/documents';

export default function BoundaryCompass({
    document,
    renderBoundary,
}: {
    document: ArchivedDocument;
    renderBoundary?: (name: string, label: string) => ReactNode;
}) {
    return (
        <div className="grid min-w-0 gap-2 sm:col-span-2">
            <dt className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                Boundaries
            </dt>
            <dd>
                <dl className="grid grid-cols-3 gap-px border border-slate-200 bg-slate-200 dark:border-neutral-800 dark:bg-neutral-800">
                    <BoundaryCell direction="NW" label="Northwest">
                        {renderBoundary?.(
                            'boundary_northwest',
                            'Northwest boundary',
                        ) ?? document.boundaryNorthwest}
                    </BoundaryCell>
                    <BoundaryCell direction="N" label="North">
                        {renderBoundary?.('boundary_north', 'North boundary') ??
                            document.boundaryNorth}
                    </BoundaryCell>
                    <BoundaryCell direction="NE" label="Northeast">
                        {renderBoundary?.(
                            'boundary_northeast',
                            'Northeast boundary',
                        ) ?? document.boundaryNortheast}
                    </BoundaryCell>
                    <BoundaryCell direction="W" label="West">
                        {renderBoundary?.('boundary_west', 'West boundary') ??
                            document.boundaryWest}
                    </BoundaryCell>
                    <div className="flex min-h-16 flex-col items-center justify-center bg-card p-2 text-center">
                        <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase dark:text-neutral-400">
                            Lot
                        </span>
                        <span className="max-w-full truncate text-xs font-semibold text-slate-900 dark:text-neutral-100">
                            {document.lotNumber || '—'}
                        </span>
                    </div>
                    <BoundaryCell direction="E" label="East">
                        {renderBoundary?.('boundary_east', 'East boundary') ??
                            document.boundaryEast}
                    </BoundaryCell>
                    <BoundaryCell direction="SW" label="Southwest">
                        {renderBoundary?.(
                            'boundary_southwest',
                            'Southwest boundary',
                        ) ?? document.boundarySouthwest}
                    </BoundaryCell>
                    <BoundaryCell direction="S" label="South">
                        {renderBoundary?.('boundary_south', 'South boundary') ??
                            document.boundarySouth}
                    </BoundaryCell>
                    <BoundaryCell direction="SE" label="Southeast">
                        {renderBoundary?.(
                            'boundary_southeast',
                            'Southeast boundary',
                        ) ?? document.boundarySoutheast}
                    </BoundaryCell>
                </dl>
            </dd>
        </div>
    );
}

function BoundaryCell({
    direction,
    label,
    children,
}: {
    direction: string;
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex min-h-16 min-w-0 flex-col gap-1 bg-card p-2">
            <dt className="text-[10px] font-semibold text-blue-900 dark:text-white">
                <abbr title={label} className="no-underline">
                    {direction}
                </abbr>
            </dt>
            <dd className="text-xs break-words text-slate-900 dark:text-neutral-100">
                {children || '—'}
            </dd>
        </div>
    );
}
