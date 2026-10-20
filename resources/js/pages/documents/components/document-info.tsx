import { router } from '@inertiajs/react';
import { FileSearch, LayoutGrid, List, Search } from 'lucide-react';
import { Fragment, type FormEvent, useEffect, useRef, useState } from 'react';
import DocumentCardView from './views/document-cardview';
import DocumentListView from './views/document-listview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index as documentsIndex } from '@/routes/documents';
import type {
    ArchivedDocument,
    DocumentsPageProps,
    SearchFieldOption,
} from '../types';

const SEARCH_DEBOUNCE_MS = 300;

type DocumentArchiveProps = {
    documents: DocumentsPageProps['documents'];
    searchQuery: string;
    searchField: string;
    searchFields: SearchFieldOption[];
    viewMode: 'list' | 'cards';
    onViewModeChange: (viewMode: 'list' | 'cards') => void;
    onViewDocument: (document: ArchivedDocument) => void;
};

export default function DocumentInfo({
    documents,
    searchQuery,
    searchField,
    searchFields,
    viewMode,
    onViewModeChange,
    onViewDocument,
}: DocumentArchiveProps) {
    const [query, setQuery] = useState(searchQuery);
    const [field, setField] = useState(searchField);
    const debounceRef = useRef<number | null>(null);
    const isTypingRef = useRef(false);

    useEffect(() => {
        if (!isTypingRef.current) {
            setQuery(searchQuery);
        }
    }, [searchQuery]);

    useEffect(() => {
        setField(searchField);
    }, [searchField]);

    useEffect(() => {
        return () => {
            if (debounceRef.current !== null) {
                window.clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const selectedField =
        searchFields.find((option) => option.value === field) ??
        searchFields[0];
    const selectedLabel = selectedField?.label ?? 'All fields';
    const placeholder =
        field === 'all'
            ? 'Search documents…'
            : `Search ${selectedLabel.toLowerCase()}…`;

    function clearDebounce() {
        if (debounceRef.current !== null) {
            window.clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
    }

    function visitSearch(nextQuery: string, nextField: string) {
        const q = nextQuery.trim();
        const nextNormalizedField = nextField === '' ? 'all' : nextField;
        const currentField = searchField === '' ? 'all' : searchField;

        isTypingRef.current = false;

        if (q === searchQuery && nextNormalizedField === currentField) {
            return;
        }

        const params: Record<string, string> = {};

        if (q !== '') {
            params.q = q;
        }

        if (nextNormalizedField !== 'all') {
            params.field = nextNormalizedField;
        }

        router.get(
            documentsIndex.url(
                Object.keys(params).length === 0 ? {} : { query: params },
            ),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['documents', 'filters'],
            },
        );
    }

    function scheduleSearch(nextQuery: string, nextField: string) {
        clearDebounce();
        debounceRef.current = window.setTimeout(() => {
            debounceRef.current = null;
            visitSearch(nextQuery, nextField);
        }, SEARCH_DEBOUNCE_MS);
    }

    function submitSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        clearDebounce();
        visitSearch(query, field);
    }

    function changeQuery(value: string) {
        isTypingRef.current = true;
        setQuery(value);
        scheduleSearch(value, field);
    }

    function changeSearchField(value: unknown) {
        if (typeof value !== 'string') {
            return;
        }

        setField(value);
        clearDebounce();

        if (query.trim() !== '') {
            visitSearch(query, value);
        }
    }

    return (
        <Card className="min-w-0 gap-0 overflow-visible rounded-none border-slate-200 bg-card py-0 shadow-none dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-slate-800">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base text-slate-950 dark:text-white">
                            <FileSearch
                                aria-hidden="true"
                                className="size-4 text-blue-900 dark:text-blue-200"
                            />
                            Archive
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Search and review archived tax declaration files
                        </CardDescription>
                    </div>
                    <Badge
                        variant="outline"
                        className="w-fit rounded-none border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                    >
                        {documents.total.toLocaleString()}{' '}
                        {documents.total === 1 ? 'document' : 'documents'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="px-0 py-0">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:p-4 dark:border-slate-800">
                    <form onSubmit={submitSearch} className="min-w-0 flex-1">
                        <div className="flex h-10 min-w-0 overflow-hidden rounded-none border border-slate-300 bg-card focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:border-slate-700 dark:bg-slate-950">
                            <Select
                                value={field}
                                onValueChange={changeSearchField}
                                items={searchFields}
                            >
                                <SelectTrigger
                                    aria-label="Search in"
                                    className="h-full w-40 shrink-0 rounded-none border-0 border-r border-slate-300 bg-transparent px-3 shadow-none focus-visible:border-transparent focus-visible:ring-0 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-transparent"
                                >
                                    <SelectValue placeholder="All fields" />
                                </SelectTrigger>
                                <SelectContent
                                    align="start"
                                    side="bottom"
                                    className="min-w-40 rounded-none"
                                >
                                    {searchFields.map((option, index) => (
                                        <Fragment key={option.value}>
                                            {index === 1 ? (
                                                <SelectSeparator />
                                            ) : null}
                                            <SelectItem
                                                value={option.value}
                                                className="rounded-none"
                                            >
                                                {option.label}
                                            </SelectItem>
                                        </Fragment>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="relative min-w-0 flex-1">
                                <Search
                                    aria-hidden="true"
                                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                                />
                                <Input
                                    name="q"
                                    value={query}
                                    onChange={(event) =>
                                        changeQuery(event.target.value)
                                    }
                                    maxLength={200}
                                    autoComplete="off"
                                    aria-label="Search documents"
                                    placeholder={placeholder}
                                    className="h-full rounded-none border-0 bg-transparent pl-9 shadow-none focus-visible:border-transparent focus-visible:ring-0"
                                />
                            </div>
                        </div>
                    </form>
                    <div
                        role="group"
                        aria-label="Document view"
                        className="flex shrink-0"
                    >
                        <Button
                            type="button"
                            variant={
                                viewMode === 'cards' ? 'secondary' : 'ghost'
                            }
                            size="icon"
                            aria-label="Card view"
                            aria-pressed={viewMode === 'cards'}
                            title="Card view"
                            onClick={() => onViewModeChange('cards')}
                            className="size-10 rounded-none border border-slate-300 dark:border-slate-700"
                        >
                            <LayoutGrid aria-hidden="true" />
                        </Button>
                        <Button
                            type="button"
                            variant={
                                viewMode === 'list' ? 'secondary' : 'ghost'
                            }
                            size="icon"
                            aria-label="List view"
                            aria-pressed={viewMode === 'list'}
                            title="List view"
                            onClick={() => onViewModeChange('list')}
                            className="-ml-px size-10 rounded-none border border-slate-300 dark:border-slate-700"
                        >
                            <List aria-hidden="true" />
                        </Button>
                    </div>
                </div>

                {documents.data.length > 0 ? (
                    <>
                        {viewMode === 'list' ? (
                            <DocumentListView
                                documents={documents.data}
                                onViewDocument={onViewDocument}
                            />
                        ) : (
                            <DocumentCardView
                                documents={documents.data}
                                onViewDocument={onViewDocument}
                            />
                        )}
                        <div className="flex flex-col justify-between gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-5 dark:border-slate-800 dark:text-slate-400">
                            <span>
                                Showing {documents.from}–{documents.to} of{' '}
                                {documents.total} documents
                            </span>
                            <span className="tabular-nums">
                                Page {documents.current_page} of{' '}
                                {documents.last_page}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex min-h-64 flex-col items-center justify-center px-4 py-12 text-center">
                        <span className="mb-4 flex size-12 items-center justify-center bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                            <FileSearch aria-hidden="true" className="size-6" />
                        </span>
                        {searchQuery !== '' ? (
                            <>
                                <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                                    No matching documents
                                </h2>
                                <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
                                    Nothing in the archive matches “
                                    {searchQuery}” in{' '}
                                    {selectedLabel.toLowerCase()}. Try a
                                    different term or field.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                                    No documents in the archive yet
                                </h2>
                                <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
                                    Use the upload button to add a scanned PDF
                                    or image with its property details.
                                </p>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
