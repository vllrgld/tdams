import { Check, RefreshCw, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { titleSuggestions as suggestDocumentTitles } from '@/routes/documents';

export default function DocumentTitleSuggestions({
    documentId,
    model,
    suggestions,
    value,
    disabled,
    onSuggestionsChange,
    onLoadingChange,
    onSelect,
}: {
    documentId: number | null;
    model: string;
    suggestions: string[];
    value: string;
    disabled: boolean;
    onSuggestionsChange: (suggestions: string[]) => void;
    onLoadingChange: (loading: boolean) => void;
    onSelect: (title: string) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const request = useRef<AbortController | null>(null);

    useEffect(
        () => () => {
            request.current?.abort();
            onLoadingChange(false);
        },
        [onLoadingChange],
    );

    useEffect(() => setError(null), [suggestions]);

    async function generate() {
        if (
            documentId === null ||
            disabled ||
            model === '' ||
            request.current
        ) {
            return;
        }

        const controller = new AbortController();
        request.current = controller;
        setLoading(true);
        onLoadingChange(true);
        setError(null);

        try {
            const cookie = document.cookie
                .split('; ')
                .find((item) => item.startsWith('XSRF-TOKEN='));
            const response = await fetch(
                suggestDocumentTitles.url(documentId),
                {
                    method: 'POST',
                    credentials: 'same-origin',
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': cookie
                            ? decodeURIComponent(
                                  cookie.slice('XSRF-TOKEN='.length),
                              )
                            : '',
                    },
                    body: JSON.stringify({ model, tax_fields: false }),
                },
            );
            const result = await response.json().catch(() => null);
            if (controller.signal.aborted) return;

            if (!response.ok) {
                const errors = result?.errors as
                    | Record<string, string[]>
                    | undefined;
                throw new Error(
                    Object.values(errors ?? {}).flat()[0] ||
                        result?.message ||
                        'Title suggestions could not be generated. Try again.',
                );
            }

            const titles = result?.titleSuggestions;
            if (
                !Array.isArray(titles) ||
                titles.length !== 2 ||
                titles.some(
                    (title) => typeof title !== 'string' || title.trim() === '',
                )
            ) {
                throw new Error(
                    'Two title suggestions could not be generated. Try again.',
                );
            }

            onSuggestionsChange(titles);
        } catch (exception) {
            if (!controller.signal.aborted) {
                setError(
                    exception instanceof Error
                        ? exception.message
                        : 'Title suggestions could not be generated. Try again.',
                );
            }
        } finally {
            if (!controller.signal.aborted) {
                request.current = null;
                setLoading(false);
                onLoadingChange(false);
            }
        }
    }

    return (
        <div className="grid min-w-0 gap-1.5" aria-busy={loading}>
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                {suggestions.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                        AI title suggestions
                    </span>
                )}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={
                        disabled ||
                        loading ||
                        model === '' ||
                        documentId === null
                    }
                    onClick={() => void generate()}
                    className="h-7 gap-1.5 rounded-lg px-1.5 text-xs font-normal text-muted-foreground hover:text-foreground"
                >
                    {loading ? (
                        <Spinner className="size-3.5" />
                    ) : suggestions.length > 0 ? (
                        <RefreshCw aria-hidden="true" className="size-3.5" />
                    ) : (
                        <Sparkles aria-hidden="true" className="size-3.5" />
                    )}
                    {loading
                        ? 'Generating titles…'
                        : suggestions.length > 0
                          ? 'Refresh suggestions'
                          : 'Suggest titles'}
                </Button>
            </div>
            {suggestions.length > 0 && (
                <div
                    role="group"
                    aria-label="AI title suggestions"
                    className="grid min-w-0 gap-1.5"
                >
                    {suggestions.map((title) => (
                        <Button
                            key={title}
                            type="button"
                            variant="outline"
                            disabled={disabled || loading}
                            aria-label={`Use title: ${title}`}
                            aria-pressed={value === title}
                            onClick={() => onSelect(title)}
                            className="h-auto min-h-8 w-full justify-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs leading-5 font-normal whitespace-normal aria-pressed:border-primary aria-pressed:bg-muted"
                        >
                            {value === title && (
                                <Check
                                    aria-hidden="true"
                                    className="size-3.5 shrink-0"
                                />
                            )}
                            <span className="min-w-0 break-words">{title}</span>
                        </Button>
                    ))}
                </div>
            )}
            <InputError message={error ?? undefined} />
        </div>
    );
}
