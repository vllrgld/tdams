import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    BookMarked,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import DrawerIcon from '@/components/drawer-icon';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import CabinetSearch, {
    CABINET_SEARCH_FIELDS,
    type CabinetSearchField,
} from '@/pages/archive/components/cabinet-search';
import {
    DEFAULT_COVER_TITLE,
    type ManageBook,
} from '@/pages/archive/data/cabinets';
import RotatableClosedBook from './rotatable-closed-book';

type CabinetGroup = {
    id: string;
    name: string;
    drawers: { id: string; label: string; books: ManageBook[] }[];
};

function groupManageBooks(books: ManageBook[]): CabinetGroup[] {
    const cabinets: CabinetGroup[] = [];
    for (const book of books) {
        let cabinet = cabinets.find((entry) => entry.id === book.cabinetId);
        if (!cabinet) {
            cabinet = {
                id: book.cabinetId,
                name: book.cabinetName,
                drawers: [],
            };
            cabinets.push(cabinet);
        }
        let drawer = cabinet.drawers.find(
            (entry) => entry.id === book.drawerId,
        );
        if (!drawer) {
            drawer = { id: book.drawerId, label: book.drawerLabel, books: [] };
            cabinet.drawers.push(drawer);
        }
        drawer.books.push(book);
    }
    return cabinets;
}

function drawerIdFromUrl(url: string): string | null {
    const queryIndex = url.indexOf('?');
    return queryIndex === -1
        ? null
        : new URLSearchParams(url.slice(queryIndex + 1)).get('drawer');
}

function bookFromDrawer(
    books: ManageBook[],
    drawerId: string | null,
): ManageBook | null {
    return books.find((book) => book.drawerId === drawerId) ?? books[0] ?? null;
}

function bookMatchesSearch(
    book: ManageBook,
    query: string,
    field: CabinetSearchField,
): boolean {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    const values = {
        name: book.cabinetName,
        drawer: book.drawerLabel,
        book: book.label,
    };
    return (field === 'all' ? Object.values(values) : [values[field]]).some(
        (value) => value.toLowerCase().includes(needle),
    );
}

function BookNavigation({
    groups,
    selectedId,
    openCabinetId,
    filtering,
    processing,
    onCabinetChange,
    onSelect,
}: {
    groups: CabinetGroup[];
    selectedId: string | null;
    openCabinetId: string | null;
    filtering: boolean;
    processing: boolean;
    onCabinetChange: (id: string | null) => void;
    onSelect: (book: ManageBook) => void;
}) {
    return (
        <ul className="divide-y divide-slate-200 dark:divide-neutral-800">
            {groups.map((cabinet) => {
                const count = cabinet.drawers.reduce(
                    (total, drawer) => total + drawer.books.length,
                    0,
                );
                return (
                    <li key={cabinet.id}>
                        <Collapsible
                            open={filtering || openCabinetId === cabinet.id}
                            onOpenChange={(open) => {
                                if (!filtering)
                                    onCabinetChange(open ? cabinet.id : null);
                            }}
                            className="group/cabinet"
                        >
                            <CollapsibleTrigger
                                aria-label={`Books in ${cabinet.name}`}
                                className="flex w-full items-center gap-2 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-900 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900 dark:focus-visible:outline-blue-200"
                            >
                                <ChevronDown
                                    aria-hidden="true"
                                    className="size-3.5 shrink-0 text-slate-500 transition-transform duration-150 group-data-[open]/cabinet:rotate-180 motion-reduce:transition-none"
                                />
                                <span className="min-w-0 flex-1 break-words">
                                    {cabinet.name}
                                </span>
                                <span className="shrink-0 text-xs font-normal text-slate-600 tabular-nums dark:text-neutral-400">
                                    {count}
                                </span>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                {cabinet.drawers.map((drawer) => (
                                    <div key={drawer.id} className="pb-2">
                                        <p className="flex items-center gap-2 px-4 pt-3 pb-2 text-xs font-medium text-slate-600 dark:text-neutral-400">
                                            <DrawerIcon
                                                aria-hidden="true"
                                                className="size-3.5 shrink-0"
                                            />
                                            <span className="min-w-0 break-words">
                                                {drawer.label}
                                            </span>
                                        </p>
                                        <ul>
                                            {drawer.books.map((book) => (
                                                <li key={book.id}>
                                                    <button
                                                        type="button"
                                                        aria-pressed={
                                                            book.id ===
                                                            selectedId
                                                        }
                                                        disabled={processing}
                                                        onClick={() =>
                                                            onSelect(book)
                                                        }
                                                        className={cn(
                                                            'flex w-full items-center gap-2.5 py-2.5 pr-4 pl-9 text-left text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-900 disabled:cursor-wait dark:focus-visible:outline-blue-200',
                                                            book.id ===
                                                                selectedId
                                                                ? 'bg-blue-50 font-medium text-blue-900 dark:bg-blue-950/50 dark:text-blue-100'
                                                                : 'text-slate-700 hover:bg-slate-50 dark:text-neutral-300 dark:hover:bg-neutral-900',
                                                        )}
                                                    >
                                                        <BookMarked
                                                            aria-hidden="true"
                                                            className="size-3.5 shrink-0"
                                                        />
                                                        <span className="min-w-0 flex-1 break-words">
                                                            {book.label}
                                                        </span>
                                                        {book.id ===
                                                            selectedId && (
                                                            <ChevronRight
                                                                aria-hidden="true"
                                                                className="size-3.5 shrink-0"
                                                            />
                                                        )}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </CollapsibleContent>
                        </Collapsible>
                    </li>
                );
            })}
        </ul>
    );
}

export default function Books({
    books,
    coverTitle,
}: {
    books: ManageBook[];
    coverTitle: string;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchField, setSearchField] = useState<CabinetSearchField>(
        CABINET_SEARCH_FIELDS[0].value,
    );
    const visibleBooks = useMemo(
        () =>
            books.filter((book) =>
                bookMatchesSearch(book, searchQuery, searchField),
            ),
        [books, searchQuery, searchField],
    );
    const groups = groupManageBooks(visibleBooks);
    const isFiltering = searchQuery.trim() !== '';
    const { url } = usePage();
    const landing = bookFromDrawer(books, drawerIdFromUrl(url));
    const [selectedId, setSelectedId] = useState(landing?.id ?? null);
    const [openCabinetId, setOpenCabinetId] = useState(
        landing?.cabinetId ?? null,
    );
    const selected =
        books.find((book) => book.id === selectedId) ?? books[0] ?? null;
    const sharedCover = coverTitle || DEFAULT_COVER_TITLE;
    const form = useForm({
        label: selected?.label ?? '',
        cover_title: sharedCover,
    });
    const dirty =
        selected !== null &&
        (form.data.label.trim() !== selected.label ||
            form.data.cover_title.trim() !== sharedCover);

    function selectBook(book: ManageBook) {
        setSelectedId(book.id);
        setOpenCabinetId(book.cabinetId);
        form.setData('label', book.label);
        form.clearErrors('label');
    }

    function discardChanges() {
        form.setData({
            label: selected?.label ?? '',
            cover_title: sharedCover,
        });
        form.clearErrors();
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selected || form.processing) return;
        form.setData({
            label: form.data.label.trim(),
            cover_title: form.data.cover_title.trim(),
        });
        form.patch(`/manage/books/${selected.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Book updated.');
            },
        });
    }

    return (
        <>
            <Head title="Books" />
            <main className="min-h-full flex-1 bg-background p-4 sm:p-6 xl:p-8">
                <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
                    <header className="flex flex-col justify-between gap-4 border-b border-blue-900 pb-5 sm:flex-row sm:items-end dark:border-blue-200">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-neutral-50">
                                Books
                            </h1>
                            <p className="mt-2 max-w-[65ch] text-sm text-slate-600 dark:text-neutral-400">
                                Manage spine names and cover text for the
                                physical archive.
                            </p>
                        </div>
                        <Button
                            render={<Link href="/manage/cabinets" />}
                            variant="outline"
                            className="w-fit shrink-0 rounded-none border-slate-300 dark:border-neutral-700"
                        >
                            Manage cabinets <ArrowUpRight aria-hidden="true" />
                        </Button>
                    </header>

                    {books.length === 0 ? (
                        <section
                            className="border border-slate-200 bg-card px-6 py-14 dark:border-neutral-800"
                            aria-labelledby="no-books-heading"
                        >
                            <h2
                                id="no-books-heading"
                                className="text-base font-semibold text-slate-950 dark:text-neutral-100"
                            >
                                No books yet
                            </h2>
                            <p className="mt-2 max-w-[65ch] text-sm text-slate-600 dark:text-neutral-400">
                                Add books to a cabinet drawer in Manage
                                Cabinets. They will appear here for naming and
                                cover updates.
                            </p>
                            <Link
                                href="/manage/cabinets"
                                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-blue-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-900 dark:text-blue-200"
                            >
                                Go to Manage Cabinets{' '}
                                <ArrowUpRight
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            </Link>
                        </section>
                    ) : (
                        <section
                            aria-label="Book management"
                            className="min-w-0 border border-slate-200 bg-card dark:border-neutral-800"
                        >
                            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center dark:border-neutral-800">
                                <div className="w-full min-w-0 sm:max-w-lg">
                                    <CabinetSearch
                                        query={searchQuery}
                                        field={searchField}
                                        onQueryChange={setSearchQuery}
                                        onFieldChange={setSearchField}
                                        placeholderAll="Search books…"
                                        ariaLabel="Search books"
                                    />
                                </div>
                                <p
                                    aria-live="polite"
                                    className="shrink-0 text-xs text-slate-600 tabular-nums dark:text-neutral-400"
                                >
                                    {isFiltering
                                        ? `${visibleBooks.length} of ${books.length}`
                                        : books.length}{' '}
                                    {books.length === 1 ? 'book' : 'books'}
                                </p>
                            </div>
                            <div className="grid min-w-0 lg:grid-cols-[17rem_minmax(0,1fr)]">
                                <nav
                                    aria-label="Books by cabinet and drawer"
                                    className="min-w-0 border-b border-slate-200 lg:border-r lg:border-b-0 dark:border-neutral-800"
                                >
                                    <div className="border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
                                        <h2 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                                            Cabinets and drawers
                                        </h2>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto lg:max-h-[calc(100vh-20rem)]">
                                        {groups.length > 0 ? (
                                            <BookNavigation
                                                groups={groups}
                                                selectedId={
                                                    selected?.id ?? null
                                                }
                                                openCabinetId={openCabinetId}
                                                filtering={isFiltering}
                                                processing={form.processing}
                                                onCabinetChange={
                                                    setOpenCabinetId
                                                }
                                                onSelect={selectBook}
                                            />
                                        ) : (
                                            <div className="px-4 py-6">
                                                <p className="text-sm font-medium text-slate-900 dark:text-neutral-100">
                                                    No books match your search.
                                                </p>
                                                <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-neutral-400">
                                                    Try a cabinet, drawer, or
                                                    spine name.
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setSearchQuery('')
                                                    }
                                                    className="mt-4 rounded-none"
                                                >
                                                    Clear search
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </nav>

                                {selected && (
                                    <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_19rem]">
                                        <div className="min-w-0">
                                            <div className="border-b border-slate-200 px-5 py-5 sm:px-6 dark:border-neutral-800">
                                                <h2 className="text-xl font-semibold break-words text-slate-950 dark:text-neutral-50">
                                                    {selected.label}
                                                </h2>
                                                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-slate-600 dark:text-neutral-400">
                                                    <span>
                                                        {selected.cabinetName}
                                                    </span>
                                                    <ChevronRight
                                                        aria-hidden="true"
                                                        className="size-3"
                                                    />
                                                    <span>
                                                        {selected.drawerLabel}
                                                    </span>
                                                    <span className="text-slate-400 dark:text-neutral-500">
                                                        ·
                                                    </span>
                                                    <span>
                                                        Position{' '}
                                                        {selected.position}
                                                    </span>
                                                </p>
                                            </div>
                                            <form
                                                onSubmit={submit}
                                                className="px-5 sm:px-6"
                                                aria-label="Book settings"
                                            >
                                                <div className="py-6">
                                                    <Label htmlFor="book-name">
                                                        Spine name
                                                    </Label>
                                                    <p
                                                        id="book-name-help"
                                                        className="mt-2 text-xs leading-5 text-slate-600 dark:text-neutral-400"
                                                    >
                                                        The name on this
                                                        book&apos;s spine and in
                                                        its drawer.
                                                    </p>
                                                    <Input
                                                        id="book-name"
                                                        value={form.data.label}
                                                        onChange={(event) =>
                                                            form.setData(
                                                                'label',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        required
                                                        maxLength={100}
                                                        disabled={
                                                            form.processing
                                                        }
                                                        aria-describedby={
                                                            form.errors.label
                                                                ? 'book-name-help book-name-error'
                                                                : 'book-name-help'
                                                        }
                                                        aria-invalid={
                                                            !!form.errors.label
                                                        }
                                                        className="mt-3 rounded-none"
                                                    />
                                                    <InputError
                                                        id="book-name-error"
                                                        message={
                                                            form.errors.label
                                                        }
                                                        className="mt-2"
                                                    />
                                                </div>
                                                <div className="border-t border-slate-200 py-6 dark:border-neutral-800">
                                                    <Label
                                                        htmlFor="book-cover-title"
                                                        className="font-semibold"
                                                    >
                                                        Shared cover text
                                                    </Label>
                                                    <p
                                                        id="book-cover-help"
                                                        className="mt-2 text-xs leading-5 text-slate-600 dark:text-neutral-400"
                                                    >
                                                        Changes apply to every
                                                        book in the archive.
                                                    </p>
                                                    <Input
                                                        id="book-cover-title"
                                                        value={
                                                            form.data
                                                                .cover_title
                                                        }
                                                        onChange={(event) =>
                                                            form.setData(
                                                                'cover_title',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        required
                                                        maxLength={80}
                                                        disabled={
                                                            form.processing
                                                        }
                                                        aria-describedby={
                                                            form.errors
                                                                .cover_title
                                                                ? 'book-cover-help book-cover-error'
                                                                : 'book-cover-help'
                                                        }
                                                        aria-invalid={
                                                            !!form.errors
                                                                .cover_title
                                                        }
                                                        className="mt-3 rounded-none"
                                                    />
                                                    <InputError
                                                        id="book-cover-error"
                                                        message={
                                                            form.errors
                                                                .cover_title
                                                        }
                                                        className="mt-2"
                                                    />
                                                </div>
                                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-4 dark:border-neutral-800">
                                                    <p
                                                        role="status"
                                                        className="text-xs text-slate-600 dark:text-neutral-400"
                                                    >
                                                        {dirty
                                                            ? 'Unsaved changes'
                                                            : 'No unsaved changes'}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            disabled={
                                                                !dirty ||
                                                                form.processing
                                                            }
                                                            onClick={
                                                                discardChanges
                                                            }
                                                            className="rounded-none"
                                                        >
                                                            Discard changes
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            disabled={
                                                                form.processing ||
                                                                !dirty
                                                            }
                                                            className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700"
                                                        >
                                                            {form.processing
                                                                ? 'Saving…'
                                                                : 'Save changes'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                        <section
                                            aria-labelledby="book-preview-heading"
                                            className="min-w-0 border-t border-slate-200 bg-slate-50/70 px-4 py-5 xl:border-t-0 xl:border-l dark:border-neutral-800 dark:bg-neutral-950"
                                        >
                                            <h3
                                                id="book-preview-heading"
                                                className="text-sm font-semibold text-slate-900 dark:text-neutral-100"
                                            >
                                                Book preview
                                            </h3>
                                            <div className="mt-3 flex justify-center">
                                                <RotatableClosedBook
                                                    label={
                                                        form.data.label ||
                                                        selected.label
                                                    }
                                                    coverTitle={
                                                        form.data.cover_title ||
                                                        DEFAULT_COVER_TITLE
                                                    }
                                                />
                                            </div>
                                        </section>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </>
    );
}

Books.layout = {
    breadcrumbs: [
        { title: 'Manage', href: '/manage/books' },
        { title: 'Books', href: '/manage/books' },
    ],
};
