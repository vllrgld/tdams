import { FileSearch, LayoutGrid, List, Search } from 'lucide-react';
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
import type { ArchivedDocument, DocumentsPageProps } from '../types';

type DocumentArchiveProps = {
    documents: DocumentsPageProps['documents'];
    viewMode: 'list' | 'cards';
    onViewModeChange: (viewMode: 'list' | 'cards') => void;
    onViewDocument: (document: ArchivedDocument) => void;
};

export default function DocumentInfo({
    documents,
    viewMode,
    onViewModeChange,
    onViewDocument,
}: DocumentArchiveProps) {
    return (
        <Card className="min-w-0 gap-0 overflow-hidden rounded-none border-slate-200 bg-white py-0 shadow-none dark:border-slate-800 dark:bg-slate-950">
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
                    <div className="relative min-w-0 flex-1">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                        />
                        <Input
                            aria-label="Search documents"
                            placeholder="Search by tax declaration, owner, lot number, or content…"
                            disabled
                            className="h-10 rounded-none border-slate-300 bg-white pl-9 dark:border-slate-700 dark:bg-slate-950"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        disabled
                        className="h-10 rounded-none border-slate-300 dark:border-slate-700"
                    >
                        Search
                    </Button>
                    <div
                        role="group"
                        aria-label="Document view"
                        className="flex shrink-0"
                    >
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
                            className="size-10 rounded-none border border-slate-300 dark:border-slate-700"
                        >
                            <List aria-hidden="true" />
                        </Button>
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
                            className="-ml-px size-10 rounded-none border border-slate-300 dark:border-slate-700"
                        >
                            <LayoutGrid aria-hidden="true" />
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
                        <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                            No documents in the archive yet
                        </h2>
                        <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
                            Use the upload button to add a scanned PDF or image
                            with its property details.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
