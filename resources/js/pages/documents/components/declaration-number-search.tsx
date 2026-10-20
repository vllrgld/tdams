import { useEffect, useId, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { formatDate } from '../lib/formatters';
import type { DeclarationNumberMatch } from '../types';

type DeclarationNumberSearchProps = {
    id: string;
    value: string;
    onChange: (value: string, match?: DeclarationNumberMatch) => void;
    excludeId?: number;
    excludeNumber?: string | null;
    maxLength?: number;
    disabled?: boolean;
};

export default function DeclarationNumberSearch({
    id,
    value,
    onChange,
    excludeId,
    excludeNumber,
    maxLength = 100,
    disabled = false,
}: DeclarationNumberSearchProps) {
    const listboxId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const skipNextSearchRef = useRef(false);
    const [results, setResults] = useState<DeclarationNumberMatch[]>([]);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (skipNextSearchRef.current) {
            skipNextSearchRef.current = false;
            setResults([]);
            setOpen(false);
            setLoading(false);

            return;
        }

        const query = value.trim();

        if (query.length < 1) {
            setResults([]);
            setOpen(false);
            setLoading(false);

            return;
        }

        const controller = new AbortController();
        const timeout = window.setTimeout(async () => {
            setLoading(true);

            try {
                const params = new URLSearchParams({ q: query });

                if (excludeId) {
                    params.set('exclude', String(excludeId));
                }

                const response = await fetch(
                    `/documents/declaration-numbers?${params.toString()}`,
                    {
                        headers: { Accept: 'application/json' },
                        credentials: 'same-origin',
                        signal: controller.signal,
                    },
                );

                if (!response.ok) {
                    setResults([]);
                    setOpen(false);
                    return;
                }

                const data =
                    (await response.json()) as DeclarationNumberMatch[];
                const excluded = excludeNumber?.trim().toLowerCase();
                const matches = excluded
                    ? data.filter(
                          (item) =>
                              item.taxDeclarationNumber.toLowerCase() !==
                              excluded,
                      )
                    : data;

                setResults(matches);
                setActiveIndex(matches.length > 0 ? 0 : -1);
                setOpen(true);
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    setResults([]);
                    setOpen(false);
                }
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => {
            controller.abort();
            window.clearTimeout(timeout);
        };
    }, [excludeId, excludeNumber, value]);

    useEffect(() => {
        function handlePointerDown(event: PointerEvent) {
            if (
                rootRef.current &&
                !rootRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener('pointerdown', handlePointerDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
        };
    }, []);

    function selectMatch(match: DeclarationNumberMatch) {
        skipNextSearchRef.current = true;
        onChange(match.taxDeclarationNumber, match);
        setResults([]);
        setOpen(false);
    }

    return (
        <div ref={rootRef} className="relative">
            <Input
                id={id}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-activedescendant={
                    open && activeIndex >= 0
                        ? `${listboxId}-option-${activeIndex}`
                        : undefined
                }
                value={value}
                disabled={disabled}
                maxLength={maxLength}
                autoComplete="off"
                placeholder="Search archived declaration numbers…"
                onChange={(event) => onChange(event.target.value)}
                onFocus={() => {
                    if (results.length > 0) {
                        setOpen(true);
                    }
                }}
                onBlur={() => {
                    window.setTimeout(() => setOpen(false), 150);
                }}
                onKeyDown={(event) => {
                    if (
                        !open &&
                        (event.key === 'ArrowDown' || event.key === 'ArrowUp')
                    ) {
                        if (results.length > 0) {
                            setOpen(true);
                            event.preventDefault();
                        }

                        return;
                    }

                    if (!open) {
                        return;
                    }

                    if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setActiveIndex((index) =>
                            Math.min(results.length - 1, index + 1),
                        );
                    } else if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        setActiveIndex((index) => Math.max(0, index - 1));
                    } else if (event.key === 'Enter' && activeIndex >= 0) {
                        event.preventDefault();
                        selectMatch(results[activeIndex]);
                    } else if (event.key === 'Escape') {
                        event.preventDefault();
                        setOpen(false);
                    }
                }}
                className="rounded-none"
            />
            {open && (
                <ul
                    id={listboxId}
                    role="listbox"
                    aria-label="Available tax declaration numbers"
                    className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto border border-slate-200 bg-card shadow-md dark:border-neutral-700 dark:bg-black"
                >
                    {loading && results.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-slate-500 dark:text-neutral-400">
                            Searching…
                        </li>
                    ) : results.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-slate-500 dark:text-neutral-400">
                            No archived declaration numbers match. You can still
                            keep this number.
                        </li>
                    ) : (
                        results.map((match, index) => {
                            const details = [
                                match.registeredOwner,
                                match.lotNumber
                                    ? `Lot ${match.lotNumber}`
                                    : null,
                                match.municipality,
                            ]
                                .filter(Boolean)
                                .join(' · ');

                            return (
                                <li key={match.id} className="p-0">
                                    <button
                                        id={`${listboxId}-option-${index}`}
                                        type="button"
                                        role="option"
                                        aria-selected={index === activeIndex}
                                        onMouseEnter={() =>
                                            setActiveIndex(index)
                                        }
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            selectMatch(match);
                                        }}
                                        className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm ${
                                            index === activeIndex
                                                ? 'bg-blue-50 text-blue-950 dark:bg-blue-950 dark:text-blue-100'
                                                : 'text-slate-900 dark:text-neutral-100'
                                        }`}
                                    >
                                        <span className="font-medium">
                                            {match.taxDeclarationNumber}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-neutral-400">
                                            {details ||
                                                'No owner or lot details'}
                                            {match.declarationDate
                                                ? ` · ${formatDate(match.declarationDate)}`
                                                : match.createdAt
                                                  ? ` · ${formatDate(match.createdAt)}`
                                                  : ''}
                                        </span>
                                    </button>
                                </li>
                            );
                        })
                    )}
                </ul>
            )}
        </div>
    );
}
