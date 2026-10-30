import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, FileSearch } from 'lucide-react';
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
    },
    {
        label: 'Archived this month',
        value: '684',
        comparison: '+8.4%',
        detail: 'vs. previous month',
    },
    {
        label: 'OCR in progress',
        value: '14',
        comparison: '6.2 min',
        detail: 'average processing time',
    },
    {
        label: 'Needs field review',
        value: '56',
        comparison: '8.1%',
        detail: 'of this month’s archive',
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
        color: 'bg-blue-900',
    },
    {
        name: 'Needs verification',
        count: 56,
        percent: 2,
        color: 'bg-blue-400',
    },
    {
        name: 'OCR processing',
        count: 18,
        percent: 1,
        color: 'bg-blue-200',
    },
];

export default function Dashboard() {
    const [activePcode, setActivePcode] = useState<string | null>(null);
    const [selectedPcode, setSelectedPcode] = useState<string | null>(null);
    const highlightedPcode = activePcode ?? selectedPcode;

    const toggleSelected = (pcode: string) =>
        setSelectedPcode((current) => (current === pcode ? null : pcode));

    return (
        <>
            <Head title="Archive Analytics" />

            <main className="min-h-full bg-background p-4 sm:p-6 xl:p-8">
                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
                    <header className="flex flex-col justify-between gap-4 border-b border-blue-900 pb-5 sm:flex-row sm:items-end">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-balance text-slate-950 sm:text-3xl dark:text-neutral-50">
                                Archive Analytics
                            </h1>
                            <p className="mt-2 max-w-[65ch] text-sm text-slate-600 dark:text-neutral-400">
                                Provincial Assessor&apos;s Office · incoming
                                papers, digitization, and property locations.
                            </p>
                        </div>
                        <Button
                            render={<Link href="/documents" />}
                            className="w-full rounded-none bg-blue-900 text-white hover:bg-blue-800 sm:w-auto"
                        >
                            <FileSearch aria-hidden="true" />
                            Browse documents
                            <ArrowRight aria-hidden="true" />
                        </Button>
                    </header>

                    <div
                        role="note"
                        className="border border-blue-900/25 px-4 py-3 text-sm text-blue-950 dark:border-blue-900 dark:text-neutral-200"
                    >
                        Analytics preview — all figures and locations are
                        illustrative and are not connected to live archive
                        records.
                    </div>

                    <section aria-labelledby="key-indicators-heading">
                        <div className="mb-3 flex items-baseline justify-between gap-4">
                            <h2
                                id="key-indicators-heading"
                                className="text-base font-semibold text-slate-950 dark:text-white"
                            >
                                Key indicators
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-neutral-400">
                                Oct 09, 2026
                            </p>
                        </div>
                        <div className="grid gap-px border border-blue-900/20 bg-blue-900/20 sm:grid-cols-2 2xl:grid-cols-4 dark:border-border dark:bg-border">
                            {metrics.map((metric) => (
                                <div
                                    key={metric.label}
                                    className="bg-card px-4 py-4"
                                >
                                    <p className="text-sm text-slate-600 dark:text-neutral-400">
                                        {metric.label}
                                    </p>
                                    <p className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 tabular-nums dark:text-neutral-50">
                                        {metric.value}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-600 dark:text-neutral-400">
                                        <span className="font-semibold text-blue-900 dark:text-neutral-200">
                                            {metric.comparison}
                                        </span>{' '}
                                        {metric.detail}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section
                        aria-label="Archive activity analytics"
                        className="grid min-w-0 gap-4 xl:grid-cols-12"
                    >
                        <Card className="min-w-0 gap-0 rounded-none border-border bg-card py-0 shadow-none xl:col-span-12">
                            <CardHeader className="flex-row items-start justify-between border-b border-border px-4 py-4 sm:px-5">
                                <div>
                                    <CardTitle className="text-base text-slate-950 dark:text-white">
                                        Daily incoming papers
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Documents received for scanning · last 7
                                        days
                                    </CardDescription>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="rounded-none border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-900 dark:text-white"
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
                                    {dailyIntake.map((item) => (
                                        <div
                                            key={item.date}
                                            className="flex min-w-0 flex-col items-center justify-end gap-2"
                                        >
                                            <span className="text-xs font-semibold text-slate-700 tabular-nums dark:text-neutral-300">
                                                {item.count}
                                            </span>
                                            <div className="flex h-36 w-full items-end border-b border-blue-900/30 px-1 dark:border-neutral-700">
                                                <div
                                                    className="w-full bg-blue-900 dark:ring-1 dark:ring-white/30 dark:ring-inset"
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
                        <Card className="min-w-0 gap-0 rounded-none border-border bg-card py-0 shadow-none">
                            <CardHeader className="flex-row items-start justify-between border-b border-border px-4 py-4 sm:px-5">
                                <div>
                                    <CardTitle
                                        id="coverage-heading"
                                        className="text-base text-slate-950 dark:text-white"
                                    >
                                        Ilocos Norte coverage
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Archived lots by city and municipality ·
                                        illustrative figures
                                    </CardDescription>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="rounded-none border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-900 dark:text-white"
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
                                    <div className="mb-2 flex items-center justify-between text-sm text-slate-600 dark:text-neutral-400">
                                        <span>Ranked by archived lots</span>
                                        {selectedPcode && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedPcode(null)
                                                }
                                                className="cursor-pointer text-blue-900 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none dark:text-neutral-200"
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
                                                            'w-full cursor-pointer px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none focus-visible:ring-inset',
                                                            isHighlighted
                                                                ? 'bg-blue-50 dark:bg-blue-950'
                                                                : 'hover:bg-blue-50/60 dark:hover:bg-blue-950/40',
                                                        )}
                                                    >
                                                        <span className="flex items-center justify-between gap-3 text-sm">
                                                            <span className="flex min-w-0 items-center gap-2 font-medium text-slate-800 dark:text-neutral-200">
                                                                <span className="w-5 text-xs text-slate-500 tabular-nums dark:text-neutral-400">
                                                                    {index + 1}
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
                                                            <span className="shrink-0 font-semibold text-blue-950 tabular-nums dark:text-neutral-100">
                                                                {row.lots.toLocaleString()}
                                                            </span>
                                                        </span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <section
                        aria-label="Archive processing analytics"
                        className="grid min-w-0 gap-4 xl:grid-cols-12"
                    >
                        <Card className="min-w-0 gap-0 rounded-none border-border bg-card py-0 shadow-none xl:col-span-12">
                            <CardHeader className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-neutral-800">
                                <CardTitle className="text-base text-slate-950 dark:text-white">
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
                                                <p className="text-sm text-slate-600 dark:text-neutral-400">
                                                    {status.name}
                                                </p>
                                                <p className="mt-1 text-lg font-semibold text-blue-950 tabular-nums dark:text-neutral-50">
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
