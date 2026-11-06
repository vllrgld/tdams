import { router } from '@inertiajs/react';
import { FileSearch, LayoutGrid, LayoutList, List, Search } from 'lucide-react';
import { Fragment, type FormEvent, useEffect, useRef, useState } from 'react';
import DocumentCardView from './document-card-view';
import DocumentListView from './document-list-view';
import DocumentPreviewView from './document-preview-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import type { ArchivedDocument } from '@/types/documents';
import type {
    DocumentsPageProps,
    DocumentViewMode,
    SearchFieldOption,
} from '../../types';

const SEARCH_DEBOUNCE_MS = 300;
const DOCUMENT_VIEWS = [
    { value: 'cards', label: 'Card view', icon: LayoutGrid },
    { value: 'preview', label: 'Preview view', icon: LayoutList },
    { value: 'list', label: 'List view', icon: List },
] as const;

type DocumentBrowserProps = {
    documents: DocumentsPageProps['documents'];
    searchQuery: string;
    searchField: string;
    searchFields: SearchFieldOption[];
    viewMode: DocumentViewMode;
    onViewModeChange: (viewMode: DocumentViewMode) => void;
    onViewDocument: (document: ArchivedDocument) => void;
};

export default function DocumentBrowser({
    documents,
    searchQuery,
    searchField,
    searchFields,
    viewMode,
    onViewModeChange,
    onViewDocument,
}: DocumentBrowserProps) {
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
    const selectedLabel = selectedField?.label ?? 'All';
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
        <Card className="min-w-0 gap-0 overflow-visible rounded-none border-slate-200 bg-card py-0 shadow-none dark:border-neutral-800 dark:bg-black">
            <CardHeader className="items-end border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-neutral-800">
                <Badge
                    variant="outline"
                    className="w-fit rounded-none border-slate-300 text-slate-700 dark:border-neutral-700 dark:text-neutral-300"
                >
                    {documents.total.toLocaleString()}{' '}
                    {documents.total === 1 ? 'document' : 'documents'}
                </Badge>
            </CardHeader>

            <CardContent className="px-0 py-0">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:p-4 dark:border-neutral-800">
                    <form onSubmit={submitSearch} className="min-w-0 flex-1">
                        <div className="flex h-10 min-w-0 rounded-md bg-card dark:bg-black">
                            <Select
                                value={field}
                                onValueChange={changeSearchField}
                                items={searchFields}
                            >
                                <SelectTrigger
                                    aria-label="Search in"
                                    className="z-10 h-full w-40 shrink-0 rounded-none rounded-l-md border border-blue-900 bg-transparent px-3 text-blue-900 shadow-none focus-visible:border-blue-900 focus-visible:ring-[3px] focus-visible:ring-blue-900/20 data-[size=default]:h-full *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:truncate dark:bg-transparent [&_svg]:opacity-100 [&_svg:not([class*='text-'])]:text-blue-900"
                                >
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent
                                    align="start"
                                    side="bottom"
                                    className="min-w-40 rounded-none border-blue-900 text-blue-900"
                                >
                                    {searchFields.map((option, index) => (
                                        <Fragment key={option.value}>
                                            {index === 1 ? (
                                                <SelectSeparator />
                                            ) : null}
                                            <SelectItem
                                                value={option.value}
                                                className="rounded-none focus:bg-blue-50 focus:text-blue-900 data-highlighted:bg-blue-50 data-highlighted:text-blue-900 dark:focus:bg-blue-900 dark:focus:text-white dark:data-highlighted:bg-blue-900 dark:data-highlighted:text-white [&_svg:not([class*='text-'])]:text-current"
                                            >
                                                {option.label}
                                            </SelectItem>
                                        </Fragment>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="relative min-w-0 flex-1 rounded-r-md border border-l-0 border-slate-300 focus-within:border-slate-400 focus-within:ring-[3px] focus-within:ring-slate-300/40 dark:border-neutral-700 dark:focus-within:border-neutral-500 dark:focus-within:ring-neutral-500/40">
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
                                    className="h-full rounded-none rounded-r-md border-0 bg-transparent pl-9 shadow-none focus-visible:border-transparent focus-visible:ring-0"
                                />
                            </div>
                        </div>
                    </form>
                    <div
                        role="group"
                        aria-label="Document view"
                        className="inline-flex h-10 w-fit shrink-0 overflow-hidden rounded-md border border-blue-900 bg-slate-50 p-0 dark:bg-neutral-900"
                    >
                        {DOCUMENT_VIEWS.map(
                            ({ value, label, icon: ViewIcon }) => (
                                <Button
                                    key={value}
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={label}
                                    aria-pressed={viewMode === value}
                                    title={label}
                                    onClick={() => onViewModeChange(value)}
                                    className="h-full w-9 rounded-none text-slate-600 shadow-none hover:bg-slate-200 hover:text-blue-900 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-inset aria-pressed:bg-blue-900 aria-pressed:text-white aria-pressed:hover:bg-blue-800 aria-pressed:focus-visible:ring-white motion-reduce:transition-none dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white dark:aria-pressed:text-white dark:aria-pressed:hover:bg-blue-800"
                                >
                                    <ViewIcon aria-hidden="true" />
                                </Button>
                            ),
                        )}
                    </div>
                </div>

                {documents.data.length > 0 ? (
                    <>
                        {viewMode === 'list' ? (
                            <DocumentListView
                                documents={documents.data}
                                onViewDocument={onViewDocument}
                            />
                        ) : viewMode === 'preview' ? (
                            <DocumentPreviewView
                                documents={documents.data}
                                onViewDocument={onViewDocument}
                            />
                        ) : (
                            <DocumentCardView
                                documents={documents.data}
                                onViewDocument={onViewDocument}
                            />
                        )}
                        <div className="flex flex-col justify-between gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-5 dark:border-neutral-800 dark:text-neutral-400">
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
                                <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-neutral-400">
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
                                <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-neutral-400">
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
