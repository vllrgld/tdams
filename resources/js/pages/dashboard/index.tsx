import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    CheckCheck,
    Clock3,
    FileSearch,
    Files,
    MapPin,
    ScanText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import IlocosNorteMap, {
    bucketFor,
    lguRows,
    provinceTotals,
} from './components/ilocos-norte-map';

const metrics = [
    {
        label: 'Papers received today',
        value: '36',
        comparison: '+12%',
        detail: 'vs. previous day',
        icon: Files,
        trend: 'up',
        iconClass:
            'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200',
    },
    {
        label: 'Archived this month',
        value: '684',
        comparison: '+8.4%',
        detail: 'vs. previous month',
        icon: CheckCheck,
        trend: 'up',
        iconClass:
            'bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
    },
    {
        label: 'OCR in progress',
        value: '14',
        comparison: '6.2 min',
        detail: 'average processing time',
        icon: ScanText,
        trend: 'steady',
        iconClass:
            'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    },
    {
        label: 'Needs field review',
        value: '56',
        comparison: '8.1%',
        detail: 'of this month’s archive',
        icon: Clock3,
        trend: 'down',
        iconClass:
            'bg-slate-100 text-slate-800 dark:bg-neutral-800 dark:text-neutral-200',
    },
];

const dailyIntake = [
    { day: 'Fri', date: 'Oct 03', count: 18 },
    { day: 'Sat', date: 'Oct 04', count: 24 },
    { day: 'Sun', date: 'Oct 05', count: 13 },
    { day: 'Mon', date: 'Oct 06', count: 32 },
    { day: 'Tue', date: 'Oct 07', count: 27 },
    { day: 'Wed', date: 'Oct 08', count: 41 },
    { day: 'Thu', date: 'Oct 09', count: 36 },
];

const archiveStatus = [
    {
        name: 'Indexed successfully',
        count: 2412,
        percent: 97,
        color: 'bg-blue-900 dark:bg-blue-400',
    },
    {
        name: 'Needs verification',
        count: 56,
        percent: 2,
        color: 'bg-amber-600 dark:bg-amber-400',
    },
    {
        name: 'OCR processing',
        count: 18,
        percent: 1,
        color: 'bg-slate-400 dark:bg-neutral-500',
    },
];

export default function Dashboard() {
    const [activePcode, setActivePcode] = useState<string | null>(null);
    const [selectedPcode, setSelectedPcode] = useState<string | null>(null);
    const highlightedPcode = activePcode ?? selectedPcode;
    const maxLots = lguRows[0]?.lots ?? 1;

    const toggleSelected = (pcode: string) =>
        setSelectedPcode((current) => (current === pcode ? null : pcode));

    return (
        <>
            <Head title="Archive Analytics" />

            <main className="min-h-full bg-background p-4 sm:p-6 xl:p-8">
                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
                    <header className="flex flex-col justify-between gap-4 border-b-2 border-amber-700/70 pb-5 sm:flex-row sm:items-end dark:border-amber-500/60">
                        <div>
                            <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-blue-900 uppercase dark:text-blue-200">
                                Provincial Assessor&apos;s Office
                            </p>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-neutral-50">
                                Archive Analytics
                            </h1>
                            <p className="mt-1 text-sm text-slate-600 dark:text-neutral-400">
                                Incoming papers, digitization performance, and
                                property locations.
                            </p>
                        </div>
                        <Button
                            render={<Link href="/documents" />}
                            className="w-full rounded-none bg-blue-900 text-white hover:bg-blue-800 sm:w-auto dark:bg-blue-800 dark:hover:bg-blue-700"
                        >
                            <FileSearch aria-hidden="true" />
                            Browse documents
                            <ArrowRight aria-hidden="true" />
                        </Button>
                    </header>

                    <div
                        role="note"
                        className="border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
                    >
                        Analytics preview — all figures and locations are
                        illustrative and are not connected to live archive
                        records.
                    </div>

                    <section aria-labelledby="key-indicators-heading">
                        <div className="mb-3 flex items-center gap-2">
                            <span className="h-4 w-1 bg-amber-700 dark:bg-amber-500" />
                            <h2
                                id="key-indicators-heading"
                                className="text-sm font-semibold tracking-wide text-slate-800 uppercase dark:text-neutral-200"
                            >
                                Key indicators
                            </h2>
                            <Badge
                                variant="outline"
                                className="ml-auto rounded-none border-slate-300 text-slate-600 dark:border-neutral-700 dark:text-neutral-400"
                            >
                                Today · Oct 09, 2026
                            </Badge>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                            {metrics.map((metric) => {
                                const TrendIcon =
                                    metric.trend === 'down'
                                        ? ArrowDownRight
                                        : ArrowUpRight;

                                return (
                                    <Card
                                        key={metric.label}
                                        className="gap-4 rounded-none border-slate-200 bg-white py-4 shadow-none dark:border-neutral-800 dark:bg-black"
                                    >
                                        <CardContent className="px-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-600 dark:text-neutral-400">
                                                        {metric.label}
                                                    </p>
                                                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 tabular-nums dark:text-white">
                                                        {metric.value}
                                                    </p>
                                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-neutral-400">
                                                        {metric.trend !==
                                                            'steady' && (
                                                            <TrendIcon
                                                                aria-hidden="true"
                                                                className="size-3.5 text-emerald-700 dark:text-emerald-400"
                                                            />
                                                        )}
                                                        <span className="font-semibold text-slate-700 dark:text-neutral-200">
                                                            {metric.comparison}
                                                        </span>
                                                        {metric.detail}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`flex size-10 shrink-0 items-center justify-center ${metric.iconClass}`}
                                                >
                                                    <metric.icon
                                                        aria-hidden="true"
                                                        className="size-5"
                                                    />
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>

                    <section
                        aria-label="Archive activity analytics"
                        className="grid min-w-0 gap-4 xl:grid-cols-12"
                    >
                        <Card className="min-w-0 gap-0 rounded-none border-slate-200 bg-white py-0 shadow-none xl:col-span-12 dark:border-neutral-800 dark:bg-black">
                            <CardHeader className="flex-row items-start justify-between border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-neutral-800">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base text-slate-950 dark:text-white">
                                        <Files
                                            aria-hidden="true"
                                            className="size-4 text-blue-900 dark:text-blue-200"
                                        />
                                        Daily incoming papers
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Documents received for scanning · last 7
                                        days
                                    </CardDescription>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="rounded-none border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
                                >
                                    191 papers
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5">
                                <div
                                    role="img"
                                    aria-label="Bar chart of daily incoming papers for the last seven days, ranging from 13 to 41 documents per day"
                                    className="grid h-56 grid-cols-7 gap-2 sm:gap-4"
                                >
                                    {dailyIntake.map((item, index) => (
                                        <div
                                            key={item.date}
                                            className="flex min-w-0 flex-col items-center justify-end gap-2"
                                        >
                                            <span className="text-xs font-semibold text-slate-700 tabular-nums dark:text-neutral-300">
                                                {item.count}
                                            </span>
                                            <div className="flex h-36 w-full items-end border-b border-slate-200 bg-slate-50 px-1 dark:border-neutral-800 dark:bg-neutral-900">
                                                <div
                                                    className={`w-full ${index === dailyIntake.length - 1 ? 'bg-amber-600 dark:bg-amber-400' : 'bg-blue-900 dark:bg-blue-500'}`}
                                                    style={{
                                                        height: `${(item.count / 45) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-medium text-slate-700 dark:text-neutral-300">
                                                    {item.day}
                                                </p>
                                                <p className="hidden text-[11px] text-slate-500 sm:block dark:text-neutral-400">
                                                    {item.date}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-neutral-800 dark:text-neutral-400">
                                    <span>Average: 27 papers per day</span>
                                    <span>Peak: 41 papers · Oct 08</span>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <section aria-labelledby="coverage-heading">
                        <Card className="min-w-0 gap-0 rounded-none border-slate-200 bg-white py-0 shadow-none dark:border-neutral-800 dark:bg-black">
                            <CardHeader className="flex-row items-start justify-between border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-neutral-800">
                                <div>
                                    <CardTitle
                                        id="coverage-heading"
                                        className="flex items-center gap-2 text-base text-slate-950 dark:text-white"
                                    >
                                        <MapPin
                                            aria-hidden="true"
                                            className="size-4 text-blue-900 dark:text-blue-200"
                                        />
                                        Ilocos Norte coverage
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Archived lots by city and municipality ·
                                        illustrative figures
                                    </CardDescription>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="rounded-none border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
                                >
                                    {provinceTotals.lgus} LGUs ·{' '}
                                    {provinceTotals.lots.toLocaleString()} lots
                                </Badge>
                            </CardHeader>
                            <CardContent className="grid gap-5 p-4 sm:p-5 xl:grid-cols-12">
                                <div className="min-w-0 xl:col-span-7">
                                    <IlocosNorteMap
                                        activePcode={activePcode}
                                        selectedPcode={selectedPcode}
                                        onActiveChange={setActivePcode}
                                        onSelect={toggleSelected}
                                    />
                                </div>
                                <div className="flex min-w-0 flex-col xl:col-span-5">
                                    <div className="mb-2 flex items-center justify-between text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-neutral-400">
                                        <span>Ranked by archived lots</span>
                                        {selectedPcode && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedPcode(null)
                                                }
                                                className="cursor-pointer text-blue-900 normal-case underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none dark:text-blue-300"
                                            >
                                                Clear selection
                                            </button>
                                        )}
                                    </div>
                                    <ol className="max-h-[36rem] min-h-0 flex-1 overflow-y-auto border border-slate-200 dark:border-neutral-800">
                                        {lguRows.map((row, index) => {
                                            const isHighlighted =
                                                row.pcode === highlightedPcode;

                                            return (
                                                <li
                                                    key={row.pcode}
                                                    className="border-b border-slate-100 last:border-b-0 dark:border-neutral-800"
                                                >
                                                    <button
                                                        type="button"
                                                        aria-pressed={
                                                            selectedPcode ===
                                                            row.pcode
                                                        }
                                                        onClick={() =>
                                                            toggleSelected(
                                                                row.pcode,
                                                            )
                                                        }
                                                        onMouseEnter={() =>
                                                            setActivePcode(
                                                                row.pcode,
                                                            )
                                                        }
                                                        onMouseLeave={() =>
                                                            setActivePcode(null)
                                                        }
                                                        onFocus={() =>
                                                            setActivePcode(
                                                                row.pcode,
                                                            )
                                                        }
                                                        onBlur={() =>
                                                            setActivePcode(null)
                                                        }
                                                        className={cn(
                                                            'w-full cursor-pointer space-y-1.5 px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none focus-visible:ring-inset',
                                                            isHighlighted
                                                                ? 'bg-amber-50 dark:bg-amber-950/40'
                                                                : 'hover:bg-slate-50 dark:hover:bg-neutral-900',
                                                        )}
                                                    >
                                                        <span className="flex items-center justify-between gap-3 text-sm">
                                                            <span className="flex min-w-0 items-center gap-2 font-medium text-slate-800 dark:text-neutral-200">
                                                                <span className="w-5 text-xs text-slate-400 tabular-nums dark:text-neutral-500">
                                                                    {String(
                                                                        index +
                                                                            1,
                                                                    ).padStart(
                                                                        2,
                                                                        '0',
                                                                    )}
                                                                </span>
                                                                <span
                                                                    aria-hidden="true"
                                                                    className={cn(
                                                                        'size-2.5 shrink-0 border border-slate-300 dark:border-neutral-700',
                                                                        bucketFor(
                                                                            row.lots,
                                                                        )
                                                                            .swatch,
                                                                    )}
                                                                />
                                                                <span className="truncate">
                                                                    {row.name}
                                                                </span>
                                                            </span>
                                                            <span className="shrink-0 font-semibold text-slate-700 tabular-nums dark:text-neutral-300">
                                                                {row.lots.toLocaleString()}
                                                            </span>
                                                        </span>
                                                        <span
                                                            aria-hidden="true"
                                                            className="block h-1.5 bg-slate-100 dark:bg-neutral-800"
                                                        >
                                                            <span
                                                                className={cn(
                                                                    'block h-full',
                                                                    isHighlighted
                                                                        ? 'bg-amber-600 dark:bg-amber-400'
                                                                        : 'bg-blue-900 dark:bg-blue-500',
                                                                )}
                                                                style={{
                                                                    width: `${(row.lots / maxLots) * 100}%`,
                                                                }}
                                                            />
                                                        </span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                    <Button
                                        render={<Link href="/documents" />}
                                        variant="outline"
                                        className="mt-3 w-full justify-between rounded-none border-slate-300 dark:border-neutral-700"
                                    >
                                        Explore archive records
                                        <ArrowRight aria-hidden="true" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <section
                        aria-label="Archive processing analytics"
                        className="grid min-w-0 gap-4 xl:grid-cols-12"
                    >
                        <Card className="min-w-0 gap-0 rounded-none border-slate-200 bg-white py-0 shadow-none xl:col-span-12 dark:border-neutral-800 dark:bg-black">
                            <CardHeader className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-neutral-800">
                                <CardTitle className="flex items-center gap-2 text-base text-slate-950 dark:text-white">
                                    <ScanText
                                        aria-hidden="true"
                                        className="size-4 text-blue-900 dark:text-blue-200"
                                    />
                                    OCR and indexing status
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Illustrative status across archived
                                    documents
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5">
                                <div
                                    className="flex h-3 overflow-hidden bg-slate-100 dark:bg-neutral-800"
                                    role="img"
                                    aria-label="Archive status: 97 percent indexed successfully, 2 percent needs verification, 1 percent OCR processing"
                                >
                                    {archiveStatus.map((status) => (
                                        <div
                                            key={status.name}
                                            className={status.color}
                                            style={{
                                                width: `${status.percent}%`,
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                                    {archiveStatus.map((status) => (
                                        <div
                                            key={status.name}
                                            className="flex items-start gap-2"
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={`mt-1 size-2 shrink-0 ${status.color}`}
                                            />
                                            <div>
                                                <p className="text-xs text-slate-600 dark:text-neutral-400">
                                                    {status.name}
                                                </p>
                                                <p className="mt-1 text-lg font-semibold text-slate-950 tabular-nums dark:text-white">
                                                    {status.count.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </main>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
