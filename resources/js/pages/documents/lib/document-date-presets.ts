export type DocumentDatePreset = {
    value: string;
    label: string;
    from: string;
    to: string;
    throughToday?: boolean;
};

function subtractCalendarMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() - months);
    const monthEnd = new Date(result);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1, 0);
    result.setUTCDate(Math.min(date.getUTCDate(), monthEnd.getUTCDate()));
    return result;
}

export function getDocumentDatePresets(
    now: Date,
    timezone: string,
): DocumentDatePreset[] {
    const parts = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(now);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((item) => item.type === type)!.value;
    const today = new Date(
        `${part('year')}-${part('month')}-${part('day')}T00:00:00Z`,
    );
    const iso = (date: Date) => date.toISOString().slice(0, 10);
    const weekAgo = new Date(today);
    weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
    const monthStart = new Date(today);
    monthStart.setUTCDate(1);
    const monthEnd = new Date(monthStart);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1, 0);
    const year = part('year');

    return [
        {
            value: 'within-week',
            label: 'Within 1 week',
            from: iso(weekAgo),
            to: iso(today),
            throughToday: true,
        },
        {
            value: 'within-month',
            label: 'Within 1 month',
            from: iso(subtractCalendarMonths(today, 1)),
            to: iso(today),
            throughToday: true,
        },
        {
            value: 'within-three-months',
            label: 'Within 3 months',
            from: iso(subtractCalendarMonths(today, 3)),
            to: iso(today),
            throughToday: true,
        },
        {
            value: 'within-year',
            label: 'Within 1 year',
            from: iso(subtractCalendarMonths(today, 12)),
            to: iso(today),
            throughToday: true,
        },
        {
            value: 'this-year',
            label: 'This year',
            from: `${year}-01-01`,
            to: `${year}-12-31`,
        },
        {
            value: 'this-month',
            label: 'This month',
            from: iso(monthStart),
            to: iso(monthEnd),
        },
        { value: 'today', label: 'Today', from: iso(today), to: iso(today) },
    ];
}
