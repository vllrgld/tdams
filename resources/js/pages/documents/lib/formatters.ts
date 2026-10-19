export function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(date: string | null): string {
    const parsed = parseDisplayDate(date);

    if (parsed === null) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
    }).format(parsed);
}

export function declarationYear(date: string | null): string {
    const parsed = parseDisplayDate(date);

    if (parsed === null) {
        return '—';
    }

    return String(parsed.getFullYear());
}

function parseDisplayDate(date: string | null): Date | null {
    if (!date) {
        return null;
    }

    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

    if (dateOnly) {
        return new Date(
            Number(dateOnly[1]),
            Number(dateOnly[2]) - 1,
            Number(dateOnly[3]),
        );
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
}
