import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { BookMarked, ChevronDown } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import DrawerIcon from '@/components/drawer-icon';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
    drawers: {
        id: string;
        label: string;
        books: ManageBook[];
    }[];
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
            drawer = {
                id: book.drawerId,
                label: book.drawerLabel,
                books: [],
            };
            cabinet.drawers.push(drawer);
        }

        drawer.books.push(book);
    }

    return cabinets;
}

function drawerIdFromUrl(url: string): string | null {
    const queryIndex = url.indexOf('?');

    if (queryIndex === -1) {
        return null;
    }

    return new URLSearchParams(url.slice(queryIndex + 1)).get('drawer');
}

function bookFromDrawer(
    books: ManageBook[],
    drawerId: string | null,
): ManageBook | null {
    if (drawerId) {
        const match = books.find((book) => book.drawerId === drawerId);

        if (match) {
            return match;
        }
    }

    return books[0] ?? null;
}

function cabinetBookCount(cabinet: CabinetGroup): number {
    return cabinet.drawers.reduce(
        (total, drawer) => total + drawer.books.length,
        0,
    );
}

function includesQuery(value: string, query: string): boolean {
    return value.toLowerCase().includes(query);
}

function bookMatchesSearch(
    book: ManageBook,
    query: string,
    field: CabinetSearchField,
): boolean {
    const needle = query.trim().toLowerCase();

    if (needle === '') {
        return true;
    }

    const name = includesQuery(book.cabinetName, needle);
    const drawer = includesQuery(book.drawerLabel, needle);
    const label = includesQuery(book.label, needle);

    switch (field) {
        case 'name':
            return name;
        case 'drawer':
            return drawer;
        case 'book':
            return label;
        default:
            return name || drawer || label;
    }
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

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selected || form.processing) {
            return;
        }

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
                    <Card className="min-w-0 gap-0 overflow-visible rounded-none border-slate-200 bg-card py-0 shadow-none dark:border-neutral-800 dark:bg-black">
                        <CardHeader className="flex-row items-start justify-between border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-neutral-800">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base text-slate-950 dark:text-white">
                                    <BookMarked
                                        aria-hidden="true"
                                        className="size-4 text-blue-900 dark:text-blue-200"
                                    />
                                    Books
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Choose a book to rotate, set its spine name,
                                    and the cover text for every volume.
                                </CardDescription>
                            </div>
                            <Badge
                                variant="outline"
                                className="w-fit rounded-none border-slate-300 text-slate-700 dark:border-neutral-700 dark:text-neutral-300"
                            >
                                {isFiltering
                                    ? `${visibleBooks.length} of ${books.length} ${books.length === 1 ? 'book' : 'books'}`
                                    : `${books.length} ${books.length === 1 ? 'book' : 'books'}`}
                            </Badge>
                        </CardHeader>
                        <CardContent className="px-0 py-0">
                            {books.length === 0 ? (
                                <p className="px-4 py-8 text-sm text-slate-600 sm:px-5 dark:text-neutral-400">
                                    No books yet.{' '}
                                    <Link
                                        href="/manage/cabinets"
                                        className="text-blue-900 underline-offset-2 hover:underline dark:text-blue-200"
                                    >
                                        Add a book from Manage Cabinets
                                    </Link>
                                    .
                                </p>
                            ) : (
                                <>
                                    <div className="border-b border-slate-200 p-3 sm:p-4 dark:border-neutral-800">
                                        <CabinetSearch
                                            query={searchQuery}
                                            field={searchField}
                                            onQueryChange={setSearchQuery}
                                            onFieldChange={setSearchField}
                                            placeholderAll="Search books…"
                                            ariaLabel="Search books"
                                        />
                                    </div>
                                    <div className="grid gap-0 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
                                        {groups.length === 0 ? (
                                            <p className="border-b border-slate-200 px-4 py-8 text-sm text-slate-600 sm:px-5 lg:border-r lg:border-b-0 dark:border-neutral-800 dark:text-neutral-400">
                                                No books match that search. Try
                                                a cabinet, drawer, or spine
                                                name.
                                            </p>
                                        ) : (
                                            <ul className="max-h-[70vh] overflow-y-auto border-b border-slate-200 lg:border-r lg:border-b-0 dark:border-neutral-800">
                                                {groups.map((cabinet) => {
                                                    const count =
                                                        cabinetBookCount(
                                                            cabinet,
                                                        );
                                                    const cabinetOpen =
                                                        isFiltering ||
                                                        openCabinetId ===
                                                            cabinet.id;

                                                    return (
                                                        <li key={cabinet.id}>
                                                            <Collapsible
                                                                open={
                                                                    cabinetOpen
                                                                }
                                                                onOpenChange={(
                                                                    nextOpen,
                                                                ) => {
                                                                    if (
                                                                        isFiltering
                                                                    ) {
                                                                        return;
                                                                    }

                                                                    setOpenCabinetId(
                                                                        nextOpen
                                                                            ? cabinet.id
                                                                            : null,
                                                                    );
                                                                }}
                                                                className="group/cabinet"
                                                            >
                                                                <CollapsibleTrigger
                                                                    aria-label={`Books in ${cabinet.name}`}
                                                                    className="sticky top-0 z-10 flex w-full items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-neutral-800 dark:bg-neutral-950"
                                                                >
                                                                    <span className="min-w-0 flex-1 truncate text-[10px] font-medium tracking-wide text-slate-500 uppercase dark:text-neutral-500">
                                                                        {
                                                                            cabinet.name
                                                                        }
                                                                    </span>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="shrink-0 rounded-none border-slate-300 text-[10px] text-slate-600 dark:border-neutral-700 dark:text-neutral-400"
                                                                    >
                                                                        {count}{' '}
                                                                        {count ===
                                                                        1
                                                                            ? 'book'
                                                                            : 'books'}
                                                                    </Badge>
                                                                    <ChevronDown
                                                                        aria-hidden="true"
                                                                        className="size-3.5 shrink-0 text-slate-400 transition-transform group-data-[open]/cabinet:rotate-180"
                                                                    />
                                                                </CollapsibleTrigger>
                                                                <CollapsibleContent>
                                                                    {cabinet.drawers.map(
                                                                        (
                                                                            drawer,
                                                                            drawerIndex,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    drawer.id
                                                                                }
                                                                                className={cn(
                                                                                    drawerIndex >
                                                                                        0 &&
                                                                                        'border-t border-slate-200 dark:border-neutral-800',
                                                                                )}
                                                                            >
                                                                                <p className="flex items-center gap-2 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-neutral-950/80 dark:text-neutral-400">
                                                                                    <DrawerIcon
                                                                                        aria-hidden="true"
                                                                                        className="size-3.5 shrink-0 text-slate-400 dark:text-neutral-500"
                                                                                    />
                                                                                    <span className="min-w-0 flex-1 truncate">
                                                                                        {
                                                                                            drawer.label
                                                                                        }
                                                                                    </span>
                                                                                    <span className="shrink-0 text-[10px] font-normal text-slate-400 dark:text-neutral-500">
                                                                                        {
                                                                                            drawer
                                                                                                .books
                                                                                                .length
                                                                                        }{' '}
                                                                                        {drawer
                                                                                            .books
                                                                                            .length ===
                                                                                        1
                                                                                            ? 'book'
                                                                                            : 'books'}
                                                                                    </span>
                                                                                </p>
                                                                                <ul className="pb-1">
                                                                                    {drawer.books.map(
                                                                                        (
                                                                                            book,
                                                                                        ) => {
                                                                                            const active =
                                                                                                book.id ===
                                                                                                selected?.id;

                                                                                            return (
                                                                                                <li
                                                                                                    key={
                                                                                                        book.id
                                                                                                    }
                                                                                                >
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() =>
                                                                                                            selectBook(
                                                                                                                book,
                                                                                                            )
                                                                                                        }
                                                                                                        className={cn(
                                                                                                            'flex w-full items-center gap-2 py-2 pr-3 pl-7 text-left text-sm',
                                                                                                            active
                                                                                                                ? 'bg-blue-900 text-white'
                                                                                                                : 'text-slate-800 hover:bg-slate-100 dark:text-neutral-200 dark:hover:bg-neutral-900',
                                                                                                        )}
                                                                                                    >
                                                                                                        <BookMarked
                                                                                                            aria-hidden="true"
                                                                                                            className={cn(
                                                                                                                'size-3.5 shrink-0',
                                                                                                                active
                                                                                                                    ? 'text-white'
                                                                                                                    : 'text-blue-900 dark:text-blue-200',
                                                                                                            )}
                                                                                                        />
                                                                                                        <span className="min-w-0 truncate">
                                                                                                            {
                                                                                                                book.label
                                                                                                            }
                                                                                                        </span>
                                                                                                    </button>
                                                                                                </li>
                                                                                            );
                                                                                        },
                                                                                    )}
                                                                                </ul>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </CollapsibleContent>
                                                            </Collapsible>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                        {selected && (
                                            <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-6 p-4 sm:p-6">
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
                                                <form
                                                    onSubmit={submit}
                                                    className="grid w-full max-w-sm gap-4"
                                                >
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="book-name">
                                                            Name
                                                        </Label>
                                                        <Input
                                                            id="book-name"
                                                            value={
                                                                form.data.label
                                                            }
                                                            onChange={(event) =>
                                                                form.setData(
                                                                    'label',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            required
                                                            maxLength={100}
                                                            className="rounded-none"
                                                        />
                                                        <InputError
                                                            message={
                                                                form.errors
                                                                    .label
                                                            }
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <div className="grid gap-1">
                                                            <Label htmlFor="book-cover-title">
                                                                Cover text
                                                            </Label>
                                                            <p className="text-xs text-slate-500 dark:text-neutral-500">
                                                                Shown on every
                                                                book
                                                            </p>
                                                        </div>
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
                                                            className="rounded-none"
                                                        />
                                                        <InputError
                                                            message={
                                                                form.errors
                                                                    .cover_title
                                                            }
                                                        />
                                                    </div>
                                                    <Button
                                                        type="submit"
                                                        disabled={
                                                            form.processing ||
                                                            !dirty
                                                        }
                                                        className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                                                    >
                                                        {form.processing
                                                            ? 'Saving…'
                                                            : 'Save'}
                                                    </Button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}

Books.layout = {
    breadcrumbs: [
        {
            title: 'Manage',
            href: '/manage/books',
        },
        {
            title: 'Books',
            href: '/manage/books',
        },
    ],
};
