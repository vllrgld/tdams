import type { KeyboardEvent } from 'react';
import { Mercator } from '@visx/geo';
import type { Feature, MultiPolygon } from 'geojson';
import { cn } from '@/lib/utils';
import { ilocosNorte, type LguFeature } from '../data/ilocos-norte-geo';
import { lguStats } from '../data/lgu-placeholder';

const WIDTH = 400;
const HEIGHT = 520;
const PADDING = 16;
const LABEL_MIN_AREA = 1400;

export type LguRow = {
    pcode: string;
    name: string;
    lots: number;
    documents: number;
    share: number;
};

export const LOT_BUCKETS = [
    {
        min: 0,
        label: '0–49',
        fill: 'fill-blue-100',
        swatch: 'bg-blue-100',
    },
    {
        min: 50,
        label: '50–99',
        fill: 'fill-blue-200',
        swatch: 'bg-blue-200',
    },
    {
        min: 100,
        label: '100–199',
        fill: 'fill-blue-400',
        swatch: 'bg-blue-400',
    },
    {
        min: 200,
        label: '200–349',
        fill: 'fill-blue-600',
        swatch: 'bg-blue-600',
    },
    {
        min: 350,
        label: '350+',
        fill: 'fill-blue-900',
        swatch: 'bg-blue-900',
    },
] as const;

export function bucketFor(lots: number) {
    return (
        [...LOT_BUCKETS].reverse().find((bucket) => lots >= bucket.min) ??
        LOT_BUCKETS[0]
    );
}

const totalLots = ilocosNorte.features.reduce(
    (sum, feature) => sum + (lguStats[feature.properties.pcode]?.lots ?? 0),
    0,
);

export const lguRows: LguRow[] = ilocosNorte.features
    .map((feature) => {
        const stats = lguStats[feature.properties.pcode] ?? {
            lots: 0,
            documents: 0,
        };

        return {
            pcode: feature.properties.pcode,
            name: feature.properties.name,
            lots: stats.lots,
            documents: stats.documents,
            share: totalLots === 0 ? 0 : (stats.lots / totalLots) * 100,
        };
    })
    .sort((first, second) => second.lots - first.lots);

export const provinceTotals = {
    lgus: lguRows.length,
    lots: totalLots,
    documents: lguRows.reduce((sum, row) => sum + row.documents, 0),
};

const rowsByPcode = new Map(lguRows.map((row) => [row.pcode, row]));

const provinceOutline: Feature<MultiPolygon> = {
    type: 'Feature',
    properties: {},
    geometry: {
        type: 'MultiPolygon',
        coordinates: ilocosNorte.features.flatMap((feature) =>
            feature.geometry.type === 'Polygon'
                ? [feature.geometry.coordinates]
                : feature.geometry.coordinates,
        ),
    },
};

type IlocosNorteMapProps = {
    activePcode: string | null;
    selectedPcode: string | null;
    onActiveChange: (pcode: string | null) => void;
    onSelect: (pcode: string) => void;
};

export default function IlocosNorteMap({
    activePcode,
    selectedPcode,
    onActiveChange,
    onSelect,
}: IlocosNorteMapProps) {
    const highlightedPcode = activePcode ?? selectedPcode;
    const highlighted = highlightedPcode
        ? rowsByPcode.get(highlightedPcode)
        : undefined;

    function handleKeyDown(
        event: KeyboardEvent<SVGPathElement>,
        pcode: string,
    ) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(pcode);
        }
    }

    return (
        <div className="flex min-w-0 flex-col gap-3">
            <div className="relative border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900/60">
                <svg
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    className="mx-auto block h-auto max-h-[34rem] w-full"
                    role="group"
                    aria-label="Map of Ilocos Norte showing illustrative archived lots per city and municipality"
                >
                    <Mercator<LguFeature>
                        data={ilocosNorte.features}
                        fitExtent={[
                            [
                                [PADDING, PADDING],
                                [WIDTH - PADDING, HEIGHT - PADDING],
                            ],
                            provinceOutline,
                        ]}
                    >
                        {({ features, path }) => {
                            const highlightedFeature = features.find(
                                ({ feature }) =>
                                    feature.properties.pcode ===
                                    highlightedPcode,
                            );

                            return (
                                <g>
                                    {features.map(({ feature, path: d }) => {
                                        const row = rowsByPcode.get(
                                            feature.properties.pcode,
                                        );
                                        const lots = row?.lots ?? 0;
                                        const pcode = feature.properties.pcode;

                                        return (
                                            <path
                                                key={pcode}
                                                d={d ?? undefined}
                                                role="button"
                                                tabIndex={0}
                                                aria-pressed={
                                                    selectedPcode === pcode
                                                }
                                                aria-label={`${feature.properties.name}: ${lots.toLocaleString()} archived lots`}
                                                className={cn(
                                                    'cursor-pointer stroke-white stroke-1 transition-[fill,opacity] outline-none dark:stroke-neutral-500',
                                                    bucketFor(lots).fill,
                                                    highlightedPcode &&
                                                        highlightedPcode !==
                                                            pcode &&
                                                        'opacity-70',
                                                )}
                                                onMouseEnter={() =>
                                                    onActiveChange(pcode)
                                                }
                                                onMouseLeave={() =>
                                                    onActiveChange(null)
                                                }
                                                onFocus={() =>
                                                    onActiveChange(pcode)
                                                }
                                                onBlur={() =>
                                                    onActiveChange(null)
                                                }
                                                onClick={() => onSelect(pcode)}
                                                onKeyDown={(event) =>
                                                    handleKeyDown(event, pcode)
                                                }
                                            />
                                        );
                                    })}

                                    {highlightedFeature?.path && (
                                        <path
                                            d={highlightedFeature.path}
                                            aria-hidden="true"
                                            className={cn(
                                                'pointer-events-none fill-none stroke-[2.5]',
                                                activePcode
                                                    ? 'stroke-blue-900 dark:stroke-white'
                                                    : 'stroke-slate-950 dark:stroke-white',
                                            )}
                                        />
                                    )}

                                    {features.map(({ feature, centroid }) => {
                                        const pcode = feature.properties.pcode;
                                        const isHighlighted =
                                            pcode === highlightedPcode;

                                        if (
                                            !isHighlighted &&
                                            path.area(feature) < LABEL_MIN_AREA
                                        ) {
                                            return null;
                                        }

                                        return (
                                            <text
                                                key={pcode}
                                                x={centroid[0]}
                                                y={centroid[1]}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                aria-hidden="true"
                                                className={cn(
                                                    'pointer-events-none fill-slate-900 stroke-white stroke-[3] text-[9px] [paint-order:stroke] dark:fill-white dark:stroke-black',
                                                    isHighlighted
                                                        ? 'text-[11px] font-semibold'
                                                        : 'font-medium',
                                                )}
                                            >
                                                {feature.properties.name}
                                            </text>
                                        );
                                    })}
                                </g>
                            );
                        }}
                    </Mercator>

                    <g
                        transform={`translate(${WIDTH - 36} 28)`}
                        aria-hidden="true"
                    >
                        <path
                            d="M0 -14 L7 6 L0 2 L-7 6 Z"
                            className="fill-slate-800 dark:fill-neutral-200"
                        />
                        <text
                            y={20}
                            textAnchor="middle"
                            className="fill-slate-700 text-[10px] font-semibold dark:fill-neutral-300"
                        >
                            N
                        </text>
                    </g>
                </svg>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-600 dark:text-neutral-400">
                <span className="font-medium text-slate-700 dark:text-neutral-300">
                    Archived lots
                </span>
                {LOT_BUCKETS.map((bucket) => (
                    <span
                        key={bucket.label}
                        className="flex items-center gap-1.5"
                    >
                        <span
                            aria-hidden="true"
                            className={cn(
                                'size-3 border border-slate-300 dark:border-neutral-700',
                                bucket.swatch,
                            )}
                        />
                        <span className="tabular-nums">{bucket.label}</span>
                    </span>
                ))}
            </div>

            <div
                aria-live="polite"
                className="grid grid-cols-3 gap-px border border-slate-200 bg-slate-200 dark:border-neutral-800 dark:bg-neutral-800"
            >
                <DetailCell
                    label={highlighted ? 'City / municipality' : 'Province'}
                    value={highlighted?.name ?? 'Ilocos Norte'}
                />
                <DetailCell
                    label="Archived lots"
                    value={(
                        highlighted?.lots ?? provinceTotals.lots
                    ).toLocaleString()}
                    detail={
                        highlighted
                            ? `${highlighted.share.toFixed(1)}% of province`
                            : `${provinceTotals.lgus} LGUs`
                    }
                />
                <DetailCell
                    label="Documents"
                    value={(
                        highlighted?.documents ?? provinceTotals.documents
                    ).toLocaleString()}
                />
            </div>
        </div>
    );
}

function DetailCell({
    label,
    value,
    detail,
}: {
    label: string;
    value: string;
    detail?: string;
}) {
    return (
        <div className="min-w-0 bg-card px-3 py-2">
            <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-neutral-400">
                {label}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-950 tabular-nums dark:text-white">
                {value}
            </p>
            {detail && (
                <p className="text-[11px] text-slate-500 tabular-nums dark:text-neutral-400">
                    {detail}
                </p>
            )}
        </div>
    );
}
