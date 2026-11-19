import { router } from '@inertiajs/react';
import {
    FileSearch,
    FilterX,
    LayoutGrid,
    LayoutList,
    List,
} from 'lucide-react';
import { Fragment, type FormEvent, useEffect, useRef, useState } from 'react';
import DocumentCardView from './document-card-view';
import DocumentAdvancedFilters from './document-advanced-filters';
import DocumentListView from './document-list-view';
import DocumentPagination from './document-pagination';
import DocumentPreviewView from './document-preview-view';
import DocumentSortMenu from './document-sort-menu';
import DocumentOcrFilter from './document-ocr-filter';
import DocumentStatusFilter from './document-status-filter';
import DocumentSearchModeSwitch from './document-search-mode-switch';
import DocumentTypeFilter from './document-type-filter';
import DocumentChain from '@/components/documents/history/document-chain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    SearchBar,
    searchBarSelectorClassName,
    searchBarOptionsClassName,
    searchBarOptionClassName,
} from '@/components/ui/search-bar';
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
    DocumentDateFilters,
    DocumentViewMode,
    DocumentSortDirection,
    DocumentSortField,
    DocumentSortFilters,
    SearchFieldOption,
    DocumentOcrReviewFilter,
    DocumentStatusFilter as DocumentStatusFilterValue,
    DocumentSearchMode,
    DocumentTypeOption,
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
    ocrReview?: DocumentOcrReviewFilter;
    documentStatus?: DocumentStatusFilterValue;
    searchMode?: DocumentSearchMode;
    documentType?: string;
    documentTypes: DocumentTypeOption[];
    dateFilters: DocumentDateFilters;
    sortDirection: DocumentSortDirection;
    sortField: DocumentSortField;
    searchFields: SearchFieldOption[];
    viewMode: DocumentViewMode;
    onViewModeChange: (viewMode: DocumentViewMode) => void;
    onViewDocument: (document: ArchivedDocument) => void;
};

export default function DocumentBrowser({
    documents,
    searchQuery,
    searchField,
    ocrReview: initialOcrReview = 'all',
    documentStatus: initialDocumentStatus = 'all',
    searchMode: initialSearchMode = 'all',
    documentType: initialDocumentType = 'all',
    documentTypes,
    dateFilters: initialDateFilters,
    sortDirection,
    sortField,
    searchFields,
    viewMode,
    onViewModeChange,
    onViewDocument,
}: DocumentBrowserProps) {
    const [query, setQuery] = useState(searchQuery);
    const [field, setField] = useState(searchField);
    const [ocrReview, setOcrReview] = useState(initialOcrReview);
    const [documentStatus, setDocumentStatus] = useState(initialDocumentStatus);
    const [searchMode, setSearchMode] = useState(initialSearchMode);
    const [documentType, setDocumentType] = useState(initialDocumentType);
    useEffect(() => setOcrReview(initialOcrReview), [initialOcrReview]);
    useEffect(
        () => setDocumentStatus(initialDocumentStatus),
        [initialDocumentStatus],
    );
    useEffect(() => setSearchMode(initialSearchMode), [initialSearchMode]);
    useEffect(
        () => setDocumentType(initialDocumentType),
        [initialDocumentType],
    );
    const showSearchModeSwitch = documentType === 'all';
    const showStatusFilter = !documentTypes.find(
        (type) => String(type.id) === documentType,
    )?.usesTaxFields;
    const {
        date_field: dateField,
        letter_date_from: letterDateFrom,
        letter_date_to: letterDateTo,
        declaration_date_from: declarationDateFrom,
        declaration_date_to: declarationDateTo,
        date_added_from: dateAddedFrom,
        date_added_to: dateAddedTo,
        date_timezone: dateTimezone,
    } = initialDateFilters;
    const [dateFilters, setDateFilters] = useState(initialDateFilters);
    const [direction, setDirection] = useState(sortDirection);
    const [sort, setSort] = useState(sortField);
    const [isSearching, setIsSearching] = useState(false);
    const [chainDocument, setChainDocument] = useState<ArchivedDocument | null>(
        null,
    );
    const debounceRef = useRef<number | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isTypingRef = useRef(false);
    const activeSearchRef = useRef<symbol | null>(null);

    useEffect(() => {
        if (!isTypingRef.current) {
            setQuery(searchQuery);
        }
    }, [searchQuery]);

    useEffect(() => {
        setField(searchField);
    }, [searchField]);

    useEffect(() => {
        setDirection(sortDirection);
        setSort(sortField);
    }, [sortDirection, sortField]);

    useEffect(() => {
        setDateFilters({
            date_field: dateField,
            letter_date_from: letterDateFrom,
            letter_date_to: letterDateTo,
            declaration_date_from: declarationDateFrom,
            declaration_date_to: declarationDateTo,
            date_added_from: dateAddedFrom,
            date_added_to: dateAddedTo,
            date_timezone: dateTimezone,
        });
    }, [
        dateField,
        letterDateFrom,
        letterDateTo,
        declarationDateFrom,
        declarationDateTo,
        dateAddedFrom,
        dateAddedTo,
        dateTimezone,
    ]);

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
    const hasDateFilters = Boolean(
        letterDateFrom ||
        letterDateTo ||
        declarationDateFrom ||
        declarationDateTo ||
        dateAddedFrom ||
        dateAddedTo,
    );
    const documentCount = `${documents.total.toLocaleString()} ${documents.total === 1 ? 'document' : 'documents'}`;
    const paginationDisabled =
        isSearching ||
        query.trim() !== searchQuery ||
        ocrReview !== initialOcrReview ||
        documentStatus !== initialDocumentStatus ||
        searchMode !== initialSearchMode ||
        documentType !== initialDocumentType;
    const hasFilters = Boolean(
        query.trim() ||
        field !== 'all' ||
        ocrReview !== 'all' ||
        documentStatus !== 'all' ||
        searchMode !== 'all' ||
        documentType !== 'all' ||
        dateFilters.declaration_date_from ||
        dateFilters.declaration_date_to ||
        dateFilters.letter_date_from ||
        dateFilters.letter_date_to ||
        dateFilters.date_field !== 'letter_date' ||
        dateFilters.date_added_from ||
        dateFilters.date_added_to,
    );

    function documentDeleted(document: ArchivedDocument) {
        if (chainDocument?.id === document.id) setChainDocument(null);
        const query = Object.fromEntries(
            new URLSearchParams(window.location.search),
        );
        const page =
            documents.data.length === 1
                ? Math.max(1, documents.current_page - 1)
                : documents.current_page;
        if (page > 1) query.page = String(page);
        else delete query.page;
        router.flushAll();
        router.get(
            documentsIndex.url({ query }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () =>
                    searchInputRef.current?.focus({ preventScroll: true }),
            },
        );
    }

    function clearDebounce() {
        if (debounceRef.current !== null) {
            window.clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
    }

    function visitSearch(
        nextQuery: string,
        nextField: string,
        nextDates = dateFilters,
        page?: number,
        nextDirection = direction,
        nextSort = sort,
        nextOcrReview = ocrReview,
        nextDocumentType = documentType,
        nextSearchMode = searchMode,
        nextStatus = documentStatus,
    ) {
        const q = nextQuery.trim();
        const nextNormalizedField = nextField === '' ? 'all' : nextField;
        const currentField = searchField === '' ? 'all' : searchField;

        isTypingRef.current = false;

        if (
            q === searchQuery &&
            nextNormalizedField === currentField &&
            nextDirection === sortDirection &&
            nextSort === sortField &&
            nextOcrReview === initialOcrReview &&
            nextStatus === initialDocumentStatus &&
            nextSearchMode === initialSearchMode &&
            nextDocumentType === initialDocumentType &&
            nextDates.declaration_date_from === declarationDateFrom &&
            nextDates.declaration_date_to === declarationDateTo &&
            nextDates.date_field === dateField &&
            nextDates.letter_date_from === letterDateFrom &&
            nextDates.letter_date_to === letterDateTo &&
            nextDates.date_added_from === dateAddedFrom &&
            nextDates.date_added_to === dateAddedTo &&
            (!(nextDates.date_added_from || nextDates.date_added_to) ||
                nextDates.date_timezone === dateTimezone) &&
            (page === undefined || page === documents.current_page) &&
            activeSearchRef.current === null
        ) {
            return;
        }

        const params: Record<string, string> = {};

        if (q !== '') {
            params.q = q;
        }

        if (nextNormalizedField !== 'all') {
            params.field = nextNormalizedField;
        }

        for (const key of [
            'letter_date_from',
            'letter_date_to',
            'declaration_date_from',
            'declaration_date_to',
            'date_added_from',
            'date_added_to',
        ] as const) {
            if (nextDates[key] !== '') params[key] = nextDates[key];
        }
        if (nextDates.date_added_from || nextDates.date_added_to) {
            params.date_timezone = nextDates.date_timezone;
        }
        if (nextDates.date_field === 'declaration_date')
            params.date_field = nextDates.date_field;
        if (page !== undefined && page > 1) params.page = String(page);
        if (nextDirection !== 'desc') params.direction = nextDirection;
        if (nextSort !== 'created_at') params.sort = nextSort;
        if (nextOcrReview !== 'all') params.ocr_review = nextOcrReview;
        if (nextStatus !== 'all') params.status = nextStatus;
        if (nextDocumentType !== 'all') params.type = nextDocumentType;
        if (nextDocumentType === 'all' && nextSearchMode === 'tax') {
            params.search_mode = nextSearchMode;
        }

        const visit = Symbol();
        activeSearchRef.current = visit;
        setIsSearching(true);

        router.get(
            documentsIndex.url(
                Object.keys(params).length === 0 ? {} : { query: params },
            ),
            {},
            {
                preserveState: true,
                preserveScroll: page === undefined,
                replace: page === undefined,
                only: ['documents', 'filters', 'searchFields'],
                onFinish: () => {
                    if (activeSearchRef.current === visit) {
                        activeSearchRef.current = null;
                        setIsSearching(false);
                    }
                },
            },
        );
    }

    function changePage(page: number) {
        if (
            paginationDisabled ||
            page < 1 ||
            page > documents.last_page ||
            page === documents.current_page
        )
            return;
        clearDebounce();
        visitSearch(query, field, dateFilters, page);
    }

    function scheduleSearch(nextQuery: string, nextField: string) {
        clearDebounce();
        debounceRef.current = window.setTimeout(() => {
            debounceRef.current = null;
            visitSearch(nextQuery, nextField);
        }, SEARCH_DEBOUNCE_MS);
    }

    function applyDateFilters(filters: DocumentDateFilters) {
        clearDebounce();
        setDateFilters(filters);
        visitSearch(query, field, filters);
    }

    function changeSort(next: DocumentSortFilters) {
        clearDebounce();
        setDirection(next.direction);
        setSort(next.sort);
        visitSearch(
            query,
            field,
            dateFilters,
            undefined,
            next.direction,
            next.sort,
        );
    }

    function clearFilters() {
        clearDebounce();
        const dates = {
            date_field: 'letter_date' as const,
            letter_date_from: '',
            letter_date_to: '',
            declaration_date_from: '',
            declaration_date_to: '',
            date_added_from: '',
            date_added_to: '',
            date_timezone: dateFilters.date_timezone,
        };
        setQuery('');
        setField('all');
        setOcrReview('all');
        setDocumentStatus('all');
        setSearchMode('all');
        setDocumentType('all');
        setDateFilters(dates);
        visitSearch(
            '',
            'all',
            dates,
            undefined,
            direction,
            sort,
            'all',
            'all',
            'all',
            'all',
        );
    }

    function changeDocumentStatus(value: DocumentStatusFilterValue) {
        clearDebounce();
        setDocumentStatus(value);
        visitSearch(
            query,
            field,
            dateFilters,
            undefined,
            direction,
            sort,
            ocrReview,
            documentType,
            searchMode,
            value,
        );
    }

    function changeOcrReview(value: DocumentOcrReviewFilter) {
        clearDebounce();
        setOcrReview(value);
        visitSearch(
            query,
            field,
            dateFilters,
            undefined,
            direction,
            sort,
            value,
        );
    }

    function changeDocumentType(value: string) {
        clearDebounce();
        const nextStatus = documentTypes.find(
            (type) => String(type.id) === value,
        )?.usesTaxFields
            ? 'all'
            : documentStatus;
        setDocumentStatus(nextStatus);
        setDocumentType(value);
        setSearchMode('all');
        setField('all');
        visitSearch(
            query,
            'all',
            dateFilters,
            undefined,
            direction,
            sort,
            ocrReview,
            value,
            'all',
            nextStatus,
        );
    }

    function changeSearchMode(value: DocumentSearchMode) {
        clearDebounce();
        setSearchMode(value);
        setField('all');
        visitSearch(
            query,
            'all',
            dateFilters,
            undefined,
            direction,
            sort,
            ocrReview,
            documentType,
            value,
        );
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
        <Card className="isolate min-w-0 gap-0 overflow-visible rounded-none border-slate-200 bg-card py-0 shadow-none dark:border-neutral-800 dark:bg-black">
            <CardHeader
                aria-hidden="true"
                className="h-14 shrink-0 border-b border-slate-200 dark:border-neutral-800"
            />
            <CardContent className="px-0 py-0">
                <div className="sticky top-16 z-30 flex flex-wrap items-center gap-1 border-b border-slate-200 bg-card p-3 shadow-sm dark:border-neutral-800 dark:bg-black">
                    <form
                        onSubmit={submitSearch}
                        className="min-w-0 basis-full xl:flex-1 xl:basis-0"
                    >
                        <SearchBar
                            ref={searchInputRef}
                            selector={
                                <Select
                                    value={field}
                                    onValueChange={changeSearchField}
                                    items={searchFields}
                                >
                                    <SelectTrigger
                                        aria-label="Search in"
                                        className={searchBarSelectorClassName}
                                    >
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent
                                        align="start"
                                        side="bottom"
                                        className={searchBarOptionsClassName}
                                    >
                                        {showSearchModeSwitch ? (
                                            <>
                                                <DocumentSearchModeSwitch
                                                    value={searchMode}
                                                    onChange={changeSearchMode}
                                                />
                                                <SelectSeparator />
                                            </>
                                        ) : null}
                                        {searchFields.map((option, index) => (
                                            <Fragment key={option.value}>
                                                {index === 1 ? (
                                                    <SelectSeparator />
                                                ) : null}
                                                <SelectItem
                                                    value={option.value}
                                                    className={
                                                        searchBarOptionClassName
                                                    }
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            </Fragment>
                                        ))}
                                    </SelectContent>
                                </Select>
                            }
                            name="q"
                            value={query}
                            onChange={(event) =>
                                changeQuery(event.target.value)
                            }
                            maxLength={200}
                            autoComplete="off"
                            aria-label="Search documents"
                            placeholder={placeholder}
                        />
                    </form>
                    <DocumentAdvancedFilters
                        value={dateFilters}
                        onApply={applyDateFilters}
                    />
                    <DocumentTypeFilter
                        value={documentType}
                        types={documentTypes}
                        onChange={changeDocumentType}
                    />
                    <DocumentOcrFilter
                        value={ocrReview}
                        onChange={changeOcrReview}
                    />
                    {showStatusFilter && (
                        <DocumentStatusFilter
                            value={documentStatus}
                            onChange={changeDocumentStatus}
                        />
                    )}
                    <div
                        role="group"
                        aria-label="Document view"
                        className="inline-flex h-[31px] w-fit shrink-0 overflow-hidden rounded-md border border-blue-900 bg-slate-50 p-0 dark:bg-neutral-900"
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
                                    className="h-full w-[31px] rounded-none text-slate-600 shadow-none hover:bg-blue-900 hover:text-white focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-inset aria-pressed:bg-blue-900 aria-pressed:text-white aria-pressed:hover:bg-blue-900 aria-pressed:focus-visible:ring-white motion-reduce:transition-none dark:text-neutral-400 dark:hover:text-white dark:aria-pressed:text-white"
                                >
                                    <ViewIcon
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                </Button>
                            ),
                        )}
                    </div>
                    <DocumentSortMenu
                        value={{ sort, direction }}
                        onChange={changeSort}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        disabled={!hasFilters}
                        onClick={clearFilters}
                        className="h-[31px] shrink-0 gap-0.5 border-blue-900 bg-white px-1.5 text-[13px] font-normal text-blue-900 shadow-none hover:bg-blue-900 hover:text-white focus-visible:border-blue-900 focus-visible:ring-blue-900/20 has-[>svg]:px-1.5 dark:bg-neutral-900 dark:text-white dark:hover:bg-blue-900 dark:focus-visible:ring-white/50"
                    >
                        <FilterX aria-hidden="true" className="size-4" />
                        Clear filters
                    </Button>
                </div>
                <div
                    className="flex items-center justify-between gap-3 px-3 pt-2 text-xs text-slate-600 dark:text-neutral-400"
                    data-slot="document-results"
                >
                    <span aria-live="polite">{documentCount}</span>
                    <DocumentPagination
                        currentPage={documents.current_page}
                        pageCount={documents.last_page}
                        disabled={paginationDisabled}
                        onPageChange={changePage}
                    />
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
                                onShowChain={setChainDocument}
                            />
                        ) : (
                            <DocumentCardView
                                onDocumentDeleted={documentDeleted}
                                documents={documents.data}
                                onViewDocument={onViewDocument}
                                onShowChain={setChainDocument}
                            />
                        )}
                        <div className="flex flex-col justify-between gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-5 dark:border-neutral-800 dark:text-neutral-400">
                            <span>
                                Showing {documents.from}–{documents.to} of{' '}
                                {documents.total} documents
                            </span>
                            <DocumentPagination
                                currentPage={documents.current_page}
                                pageCount={documents.last_page}
                                disabled={paginationDisabled}
                                onPageChange={changePage}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex min-h-64 flex-col items-center justify-center px-4 py-12 text-center">
                        <span className="mb-4 flex size-12 items-center justify-center bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-white">
                            <FileSearch aria-hidden="true" className="size-6" />
                        </span>
                        {searchQuery !== '' ||
                        hasDateFilters ||
                        initialOcrReview !== 'all' ||
                        initialDocumentStatus !== 'all' ||
                        initialDocumentType !== 'all' ? (
                            <>
                                <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                                    No matching documents
                                </h2>
                                <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-neutral-400">
                                    {initialDocumentStatus !== 'all' ? (
                                        'No documents match these filters. Choose a different document status or clear the filters.'
                                    ) : initialOcrReview !== 'all' ? (
                                        'No documents match these filters. Choose a different OCR review status or clear the filters.'
                                    ) : initialDocumentType !== 'all' ? (
                                        'No documents match these filters. Choose a different type or clear the filters.'
                                    ) : hasDateFilters ? (
                                        'No documents match these filters. Try a different date range or clear the date filter.'
                                    ) : (
                                        <>
                                            Nothing in the archive matches “
                                            {searchQuery}” in{' '}
                                            {selectedLabel.toLowerCase()}. Try a
                                            different term or field.
                                        </>
                                    )}
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
            <DocumentChain
                document={chainDocument}
                onViewDocument={onViewDocument}
                onOpenChange={(open) => {
                    if (!open) {
                        setChainDocument(null);
                    }
                }}
            />
        </Card>
    );
}
