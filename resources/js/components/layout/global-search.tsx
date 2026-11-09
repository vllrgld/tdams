import { search as systemSearch } from '@/routes/system';
import { search as searchDocuments } from '@/routes/documents';
import { index as documentsIndex } from '@/routes/documents';
import { index as archiveIndex } from '@/routes/archive';
import { index as bookmarksIndex } from '@/routes/bookmarks';
import { index as cabinetsIndex } from '@/routes/manage/cabinets';
import { index as booksIndex } from '@/routes/manage/books';
import { index as foldersIndex } from '@/routes/manage/folders';
import { router } from '@inertiajs/react';
import {
    Archive,
    Bookmark,
    BookMarked,
    FileSearch,
    Folder,
    Folders,
    LayoutDashboard,
    LoaderCircle,
    Palette,
    Rows3,
    ScanText,
    Search,
    Shield,
    SlidersHorizontal,
    Upload,
    UserRound,
    type LucideIcon,
} from 'lucide-react';
import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from 'react';
import DrawerIcon from '@/components/filing/drawer-icon';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn, toUrl } from '@/lib/utils';
import {
    commandSearchGroups as groupOrder,
    getActiveCommandIndex,
    matchesCommand,
    orderCommandResults,
} from '@/lib/command-search';
import { dashboard } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editAccessibility } from '@/routes/accessibility';
import { edit as editOcr } from '@/routes/ocr';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';

type PageEntry = {
    title: string;
    group: 'Pages' | 'Settings';
    hint: string;
    href: string;
    keywords: string;
    icon: LucideIcon;
};

type RecordMatch = {
    id: number;
    kind?: 'book' | 'folder';
    title: string;
    hint: string;
    url: string;
};

type PlaceResult = {
    cabinets: RecordMatch[];
    drawers: RecordMatch[];
    books: RecordMatch[];
};

type DocumentMatch = {
    id: number;
    title: string;
    owner: string | null;
    propertyLocation: string;
    url: string;
    location: {
        cabinet: string;
        drawer: string;
        book: string;
        url: string;
    } | null;
};

type DocumentResult = { data: DocumentMatch[]; hasMore: boolean };

type SearchItem = {
    key: string;
    group: string;
    title: string;
    hint: string;
    icon: LucideIcon;
} & ({ url: string; action?: never } | { action: () => void; url?: never });

const pages: PageEntry[] = [
    {
        title: 'Dashboard',
        group: 'Pages',
        hint: 'Menu',
        href: toUrl(dashboard()),
        keywords: 'home overview',
        icon: LayoutDashboard,
    },
    {
        title: 'Documents',
        group: 'Pages',
        hint: 'Menu',
        href: documentsIndex.url(),
        keywords:
            'declaration tax file search ocr content cards preview list filter filters dates date added relative sort sorting ascending descending clear reset',
        icon: FileSearch,
    },
    {
        title: 'Archive',
        group: 'Pages',
        hint: 'Menu',
        href: archiveIndex.url(),
        keywords: 'filing cabinet drawer book',
        icon: Archive,
    },
    {
        title: 'Bookmarks',
        group: 'Pages',
        hint: 'Menu',
        href: bookmarksIndex.url(),
        keywords: 'saved favorites',
        icon: Bookmark,
    },
    {
        title: 'Cabinets',
        group: 'Pages',
        hint: 'Menu > Manage',
        href: cabinetsIndex.url(),
        keywords: 'cabinet drawer filing manage',
        icon: Folders,
    },
    {
        title: 'Books',
        group: 'Pages',
        hint: 'Menu > Manage',
        href: booksIndex.url(),
        keywords: 'folder book volume manage',
        icon: BookMarked,
    },
    {
        title: 'Folders',
        group: 'Pages',
        hint: 'Menu > Manage',
        href: foldersIndex.url(),
        keywords: 'folder filing manage',
        icon: Folder,
    },
    {
        title: 'Profile',
        group: 'Settings',
        hint: 'Settings > Account',
        href: toUrl(editProfile()),
        keywords: 'settings account name email user',
        icon: UserRound,
    },
    {
        title: 'Security',
        group: 'Settings',
        hint: 'Settings > Account',
        href: toUrl(editSecurity()),
        keywords: 'settings password passkey two-factor',
        icon: Shield,
    },
    {
        title: 'Appearance',
        group: 'Settings',
        hint: 'Settings > Account',
        href: toUrl(editAppearance()),
        keywords: 'settings theme dark light',
        icon: Palette,
    },
    {
        title: 'Accessibility',
        group: 'Settings',
        hint: 'Settings > Account',
        href: toUrl(editAccessibility()),
        keywords:
            'settings accessibility animation animations motion pickup return fade books folders',
        icon: SlidersHorizontal,
    },
    {
        title: 'OCR',
        group: 'Settings',
        hint: 'Settings > Account',
        href: toUrl(editOcr()),
        keywords: 'settings scan recognition compression',
        icon: ScanText,
    },
];

const uploadCommand = {
    title: 'Upload document',
    hint: 'Add a PDF or scanned image',
    keywords: 'upload import scan scanned pdf image add new document',
};

async function fetchSearchResults<T>(
    url: string,
    signal: AbortSignal,
): Promise<T> {
    const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        signal,
    });
    if (!response.ok) throw new Error('Search unavailable');
    return (await response.json()) as T;
}

function documentHint(match: DocumentMatch): string {
    if (match.location) {
        return `${match.location.cabinet} > ${match.location.drawer} > ${match.location.book}`;
    }

    const details = [match.owner, match.propertyLocation].filter(Boolean);

    return details.length > 0 ? details.join(' · ') : 'Documents';
}

export default function GlobalSearch({
    className,
    onUploadDocument,
}: {
    className?: string;
    onUploadDocument?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [navigating, setNavigating] = useState(false);
    const [query, setQuery] = useState('');
    const [places, setPlaces] = useState<PlaceResult | null>(null);
    const [documents, setDocuments] = useState<DocumentResult | null>(null);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const [dialogBounds, setDialogBounds] = useState<{
        left: number;
        top: number;
        width: number;
        startScale: number;
    } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listId = useId();
    const normalizedQuery = query.trim();
    const canSearch = Array.from(normalizedQuery).length >= 2;
    const loading =
        canSearch && (places === null || documents === null) && !error;

    const items = useMemo(() => {
        const next: SearchItem[] = pages
            .filter((page) => matchesCommand(page, normalizedQuery))
            .map((page) => ({
                key: `page-${page.href}`,
                group: page.group,
                title: page.title,
                hint: page.hint,
                url: page.href,
                icon: page.icon,
            }));

        if (
            onUploadDocument &&
            matchesCommand(uploadCommand, normalizedQuery)
        ) {
            next.push({
                key: 'action-upload',
                group: 'Actions',
                title: uploadCommand.title,
                hint: uploadCommand.hint,
                action: onUploadDocument,
                icon: Upload,
            });
        }

        if (!canSearch || places === null || documents === null) {
            return orderCommandResults(next);
        }

        for (const cabinet of places.cabinets) {
            next.push({
                key: `cabinet-${cabinet.id}`,
                group: 'Cabinets',
                title: cabinet.title,
                hint: cabinet.hint,
                url: cabinet.url,
                icon: DrawerIcon,
            });
        }

        for (const drawer of places.drawers) {
            next.push({
                key: `drawer-${drawer.id}`,
                group: 'Drawers',
                title: drawer.title,
                hint: drawer.hint,
                url: drawer.url,
                icon: Rows3,
            });
        }

        for (const book of places.books) {
            next.push({
                key: `book-${book.id}`,
                group: book.kind === 'folder' ? 'Folders' : 'Books',
                title: book.title,
                hint: book.hint,
                url: book.url,
                icon: book.kind === 'folder' ? Folder : BookMarked,
            });
        }

        for (const match of documents.data) {
            next.push({
                key: `document-${match.id}`,
                group: 'Documents',
                title: match.title,
                hint: documentHint(match),
                url: match.url,
                icon: FileSearch,
            });
        }

        if (documents.hasMore) {
            next.push({
                key: 'documents-more',
                group: 'Documents',
                title: 'View all document results',
                hint: `Documents > ${normalizedQuery}`,
                url: documentsIndex.url({ query: { q: normalizedQuery } }),
                icon: FileSearch,
            });
        }

        return orderCommandResults(next);
    }, [canSearch, documents, normalizedQuery, onUploadDocument, places]);

    const groups = groupOrder
        .map((name) => ({
            name,
            items: items
                .map((item, index) => ({ item, index }))
                .filter((entry) => entry.item.group === name),
        }))
        .filter((group) => group.items.length > 0);

    const selected = items[activeIndex];

    useEffect(() => {
        const trigger = triggerRef.current;

        if (!trigger) {
            return;
        }

        const slot = trigger.parentElement;

        function updateDialogBounds() {
            if (!window.matchMedia('(min-width: 48rem)').matches) {
                setDialogBounds(null);
                return;
            }

            const bounds = triggerRef.current?.getBoundingClientRect();
            const slotBounds = slot?.getBoundingClientRect();

            if (!bounds || !slotBounds || slotBounds.width === 0) {
                return;
            }

            setDialogBounds({
                left: bounds.left + bounds.width / 2,
                top: bounds.top,
                width: slotBounds.width,
                startScale: bounds.width / slotBounds.width,
            });
        }

        const observer = new ResizeObserver(updateDialogBounds);
        observer.observe(trigger);

        if (slot) {
            observer.observe(slot);
        }

        const header = trigger.closest('header');

        if (header) {
            observer.observe(header);
        }

        window.addEventListener('resize', updateDialogBounds);
        updateDialogBounds();

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateDialogBounds);
        };
    }, []);

    useEffect(() => {
        function handleShortcut(event: KeyboardEvent) {
            if (
                !(event.ctrlKey || event.metaKey) ||
                event.key.toLowerCase() !== 'k'
            ) {
                return;
            }

            if (
                !open &&
                document.querySelector('[role="dialog"][aria-modal="true"]')
            ) {
                return;
            }

            event.preventDefault();
            setNavigating(false);
            setQuery('');
            setPlaces(null);
            setDocuments(null);
            setError(false);
            setActiveIndex(0);
            setOpen((current) => !current);
        }

        window.addEventListener('keydown', handleShortcut);

        return () => window.removeEventListener('keydown', handleShortcut);
    }, [open]);

    useEffect(() => {
        if (!open || normalizedQuery === '') {
            return;
        }

        function clearOnEscape(event: KeyboardEvent) {
            if (event.key !== 'Escape') {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            setQuery('');
            setPlaces(null);
            setDocuments(null);
            setError(false);
            setActiveIndex(0);
        }

        window.addEventListener('keydown', clearOnEscape, true);

        return () => window.removeEventListener('keydown', clearOnEscape, true);
    }, [normalizedQuery, open]);

    useEffect(() => router.on('navigate', () => setOpen(false)), []);

    useEffect(() => {
        if (!open || !canSearch) {
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                const [placeResult, documentResult] = await Promise.allSettled([
                    fetchSearchResults<PlaceResult>(
                        systemSearch.url({ query: { q: normalizedQuery } }),
                        controller.signal,
                    ),
                    fetchSearchResults<DocumentResult>(
                        searchDocuments.url({ query: { q: normalizedQuery } }),
                        controller.signal,
                    ),
                ]);

                if (controller.signal.aborted) {
                    return;
                }

                setPlaces(
                    placeResult.status === 'fulfilled'
                        ? placeResult.value
                        : { cabinets: [], drawers: [], books: [] },
                );
                setDocuments(
                    documentResult.status === 'fulfilled'
                        ? documentResult.value
                        : { data: [], hasMore: false },
                );
                setError(
                    placeResult.status === 'rejected' ||
                        documentResult.status === 'rejected',
                );
            } catch {
                if (!controller.signal.aborted) {
                    setError(true);
                }
            }
        }, 250);

        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [attempt, canSearch, normalizedQuery, open]);

    useEffect(() => {
        const nextIndex = getActiveCommandIndex(activeIndex, items.length);
        if (nextIndex !== activeIndex) setActiveIndex(nextIndex);
    }, [activeIndex, items.length]);

    useEffect(() => {
        if (!open || activeIndex < 0) {
            return;
        }

        document
            .getElementById(`${listId}-${activeIndex}`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, listId, open]);

    function clearQuery() {
        setQuery('');
        setPlaces(null);
        setDocuments(null);
        setError(false);
        setActiveIndex(0);
        inputRef.current?.focus();
    }

    function activate(item: SearchItem) {
        setNavigating(true);
        setOpen(false);
        if (item.action) {
            item.action();
        } else {
            router.visit(item.url);
        }
    }

    function moveActive(direction: 1 | -1) {
        if (items.length === 0) {
            return;
        }

        setActiveIndex((current) => {
            if (current < 0) {
                return direction === 1 ? 0 : items.length - 1;
            }

            return (current + direction + items.length) % items.length;
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (nextOpen) {
                    setNavigating(false);
                    setQuery('');
                    setPlaces(null);
                    setDocuments(null);
                    setError(false);
                    setActiveIndex(0);
                }

                setOpen(nextOpen);
            }}
        >
            <DialogTrigger
                render={
                    <Button
                        ref={triggerRef}
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'size-[31px] shrink-0 md:w-[calc(100%-3rem)] md:justify-start md:border md:border-white/20 md:bg-white/10 md:px-2.5 md:hover:bg-white/15',
                            className,
                        )}
                        aria-label="Search"
                        title="Search (Ctrl+K)"
                    />
                }
            >
                <Search aria-hidden="true" className="size-4" />
                <span className="hidden text-xs md:inline">Search</span>
                <kbd className="ml-auto hidden rounded border border-white/25 px-1 py-0.5 font-sans text-[10px] text-blue-100 md:inline">
                    Ctrl K
                </kbd>
            </DialogTrigger>
            <DialogContent
                showClose={false}
                className="top-[12vh] origin-top translate-y-0 gap-0 overflow-hidden rounded-lg p-0 transition-[opacity,scale] ease-out data-ending-style:scale-[var(--search-start-scale,0.95)] data-starting-style:scale-[var(--search-start-scale,0.95)] motion-reduce:transition-none sm:max-w-xl"
                style={
                    dialogBounds
                        ? ({
                              left: dialogBounds.left,
                              top: dialogBounds.top,
                              width: dialogBounds.width,
                              '--search-start-scale': dialogBounds.startScale,
                          } as CSSProperties)
                        : undefined
                }
                initialFocus={inputRef}
                finalFocus={navigating ? false : undefined}
            >
                <DialogTitle className="sr-only">Search the system</DialogTitle>
                <DialogDescription className="sr-only">
                    Find a page, setting, action, cabinet, folder, book, or
                    document. Arrow keys move, Enter opens.
                </DialogDescription>
                <div className="flex items-center gap-2 border-b px-3">
                    <Search
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                    />
                    <input
                        ref={inputRef}
                        value={query}
                        maxLength={200}
                        autoComplete="off"
                        placeholder="Search the system…"
                        className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        role="combobox"
                        aria-label="Search the system"
                        aria-autocomplete="list"
                        aria-expanded={open}
                        aria-controls={listId}
                        aria-activedescendant={
                            selected ? `${listId}-${activeIndex}` : undefined
                        }
                        onChange={(event) => {
                            const nextQuery = event.target.value;

                            if (nextQuery.trim() !== normalizedQuery) {
                                setPlaces(null);
                                setDocuments(null);
                                setError(false);
                                setActiveIndex(0);
                            }

                            setQuery(nextQuery);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'ArrowDown') {
                                event.preventDefault();
                                moveActive(1);
                            } else if (event.key === 'ArrowUp') {
                                event.preventDefault();
                                moveActive(-1);
                            } else if (event.key === 'Enter' && selected) {
                                event.preventDefault();
                                activate(selected);
                            }
                        }}
                    />
                    {loading && (
                        <LoaderCircle
                            aria-hidden="true"
                            className="size-4 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none"
                        />
                    )}
                    <button
                        type="button"
                        className="shrink-0 rounded px-1 text-sm text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                        disabled={normalizedQuery === ''}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={clearQuery}
                    >
                        Clear
                    </button>
                </div>
                <div
                    id={listId}
                    role="listbox"
                    aria-label="Search results"
                    aria-busy={loading}
                    className="max-h-[min(24rem,50vh)] overflow-y-auto"
                >
                    {groups.length === 0 && loading && (
                        <p
                            role="status"
                            className="px-3 py-10 text-center text-sm text-muted-foreground"
                        >
                            Searching…
                        </p>
                    )}
                    {groups.length === 0 && !loading && !error && (
                        <p
                            role="status"
                            className="px-3 py-10 text-center text-sm text-muted-foreground"
                        >
                            No matches. Try a page, cabinet, or declaration.
                        </p>
                    )}
                    {error && (
                        <div
                            role="alert"
                            className="flex items-center justify-between gap-3 border-b px-3 py-2 text-xs text-muted-foreground"
                        >
                            <span>
                                Some archive results could not be loaded.
                                Available results still work.
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setError(false);
                                    setPlaces(null);
                                    setDocuments(null);
                                    setAttempt((value) => value + 1);
                                    inputRef.current?.focus();
                                }}
                            >
                                Try again
                            </Button>
                        </div>
                    )}
                    {groups.map((group) => (
                        <div
                            key={group.name}
                            role="group"
                            aria-label={group.name}
                        >
                            <div className="sticky top-0 z-10 flex items-center justify-between bg-muted/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                                <span>{group.name}</span>
                                <span>{group.items.length}</span>
                            </div>
                            {group.items.map(({ item, index }) => {
                                const Icon = item.icon;

                                return (
                                    <button
                                        key={item.key}
                                        id={`${listId}-${index}`}
                                        role="option"
                                        aria-selected={activeIndex === index}
                                        tabIndex={-1}
                                        type="button"
                                        className={cn(
                                            'flex w-full items-center gap-3 border-b px-3 py-2.5 text-left outline-none last:border-b-0',
                                            activeIndex === index
                                                ? 'bg-neutral-100 text-foreground dark:bg-neutral-800'
                                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60',
                                        )}
                                        onPointerMove={() =>
                                            setActiveIndex(index)
                                        }
                                        onPointerDown={(event) =>
                                            event.preventDefault()
                                        }
                                        onClick={() => activate(item)}
                                    >
                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                                            <Icon
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">
                                                {item.title}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {item.hint}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                    <span>
                        {normalizedQuery === ''
                            ? 'Nothing to clear.'
                            : loading
                              ? 'Searching…'
                              : items.length === 1
                                ? '1 result'
                                : `${items.length} results`}
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-background px-1 font-sans text-[10px]">
                                ↑
                            </kbd>
                            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-background px-1 font-sans text-[10px]">
                                ↓
                            </kbd>
                            move
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-background px-1 font-sans text-[10px]">
                                ↵
                            </kbd>
                            open
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-background px-1 font-sans text-[10px]">
                                Esc
                            </kbd>
                            {normalizedQuery === '' ? 'close' : 'clear'}
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
