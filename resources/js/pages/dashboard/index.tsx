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
import { dashboard } from '@/routes';

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
            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
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

const propertyLocations = [
    { name: 'Laoag City', count: 462, share: 100 },
    { name: 'Batac City', count: 328, share: 71 },
    { name: 'San Nicolas', count: 244, share: 53 },
    { name: 'Paoay', count: 196, share: 42 },
    { name: 'Bacarra', count: 158, share: 34 },
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
        color: 'bg-slate-400 dark:bg-slate-500',
    },
];

export default function Dashboard() {
    return (
        <>
            <Head title="Archive Analytics" />

            <main className="min-h-full bg-slate-50/70 p-4 sm:p-6 xl:p-8 dark:bg-background">
                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
                    <header className="flex flex-col justify-between gap-4 border-b-2 border-amber-700/70 pb-5 sm:flex-row sm:items-end dark:border-amber-500/60">
                        <div>
                            <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-blue-900 uppercase dark:text-blue-200">
                                Provincial Assessor&apos;s Office
                            </p>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-slate-50">
                                Archive Analytics
                            </h1>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
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
                                className="text-sm font-semibold tracking-wide text-slate-800 uppercase dark:text-slate-200"
                            >
                                Key indicators
                            </h2>
                            <Badge
                                variant="outline"
                                className="ml-auto rounded-none border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"
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
                                        className="gap-4 rounded-none border-slate-200 bg-white py-4 shadow-none dark:border-slate-800 dark:bg-slate-950"
                                    >
                                        <CardContent className="px-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                        {metric.label}
                                                    </p>
                                                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 tabular-nums dark:text-white">
                                                        {metric.value}
                                                    </p>
                                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                        {metric.trend !==
                                                            'steady' && (
                                                            <TrendIcon
                                                                aria-hidden="true"
                                                                className="size-3.5 text-emerald-700 dark:text-emerald-400"
                                                            />
                                                        )}
                                                        <span className="font-semibold text-slate-700 dark:text-slate-200">
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
                        aria-label="Archive activity and location analytics"
                        className="grid min-w-0 gap-4 xl:grid-cols-12"
                    >
                        <Card className="min-w-0 gap-0 rounded-none border-slate-200 bg-white py-0 shadow-none xl:col-span-8 dark:border-slate-800 dark:bg-slate-950">
                            <CardHeader className="flex-row items-start justify-between border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-slate-800">
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
                                            <span className="text-xs font-semibold text-slate-700 tabular-nums dark:text-slate-300">
                                                {item.count}
                                            </span>
                                            <div className="flex h-36 w-full items-end border-b border-slate-200 bg-slate-50 px-1 dark:border-slate-800 dark:bg-slate-900">
                                                <div
                                                    className={`w-full ${index === dailyIntake.length - 1 ? 'bg-amber-600 dark:bg-amber-400' : 'bg-blue-900 dark:bg-blue-500'}`}
                                                    style={{
                                                        height: `${(item.count / 45) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                    {item.day}
                                                </p>
                                                <p className="hidden text-[11px] text-slate-500 sm:block dark:text-slate-400">
                                                    {item.date}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                    <span>Average: 27 papers per day</span>
                                    <span>Peak: 41 papers · Oct 08</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="min-w-0 gap-0 rounded-none border-slate-200 bg-white py-0 shadow-none xl:col-span-4 dark:border-slate-800 dark:bg-slate-950">
                            <CardHeader className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-slate-800">
                                <CardTitle className="flex items-center gap-2 text-base text-slate-950 dark:text-white">
                                    <MapPin
                                        aria-hidden="true"
                                        className="size-4 text-blue-900 dark:text-blue-200"
                                    />
                                    Property locations
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Archived lots by municipality
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 p-4 sm:p-5">
                                {propertyLocations.map((location, index) => (
                                    <div
                                        key={location.name}
                                        className="space-y-1.5"
                                    >
                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <span className="flex min-w-0 items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                                                <span className="text-xs text-slate-400 tabular-nums dark:text-slate-500">
                                                    {String(index + 1).padStart(
                                                        2,
                                                        '0',
                                                    )}
                                                </span>
                                                <span className="truncate">
                                                    {location.name}
                                                </span>
                                            </span>
                                            <span className="shrink-0 font-semibold text-slate-700 tabular-nums dark:text-slate-300">
                                                {location.count.toLocaleString()}
                                            </span>
                                        </div>
                                        <div
                                            className="h-2 bg-slate-100 dark:bg-slate-800"
                                            role="img"
                                            aria-label={`${location.name}: ${location.count} archived lots`}
                                        >
                                            <div
                                                className="h-full bg-blue-900 dark:bg-blue-500"
                                                style={{
                                                    width: `${location.share}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <p className="border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                    Grouped by municipality from property
                                    location fields.
                                </p>
                            </CardContent>
                        </Card>
                    </section>

                    <section
                        aria-label="Archive processing analytics"
                        className="grid min-w-0 gap-4 xl:grid-cols-12"
                    >
                        <Card className="min-w-0 gap-0 rounded-none border-slate-200 bg-white py-0 shadow-none xl:col-span-7 dark:border-slate-800 dark:bg-slate-950">
                            <CardHeader className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-slate-800">
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
                                    className="flex h-3 overflow-hidden bg-slate-100 dark:bg-slate-800"
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
                                                <p className="text-xs text-slate-600 dark:text-slate-400">
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

                        <Card className="min-w-0 gap-0 rounded-none border-slate-200 bg-white py-0 shadow-none xl:col-span-5 dark:border-slate-800 dark:bg-slate-950">
                            <CardHeader className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-slate-800">
                                <CardTitle className="flex items-center gap-2 text-base text-slate-950 dark:text-white">
                                    <MapPin
                                        aria-hidden="true"
                                        className="size-4 text-blue-900 dark:text-blue-200"
                                    />
                                    Geographic coverage
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Sample of the most represented
                                    municipalities
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex h-full flex-col justify-between gap-4 p-4 sm:p-5">
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    Property locations can help staff see where
                                    the archive is most active and identify
                                    municipalities with fewer digitized records.
                                </p>
                                <Button
                                    render={<Link href="/documents" />}
                                    variant="outline"
                                    className="w-full justify-between rounded-none border-slate-300 dark:border-slate-700"
                                >
                                    Explore archive records
                                    <ArrowRight aria-hidden="true" />
                                </Button>
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
