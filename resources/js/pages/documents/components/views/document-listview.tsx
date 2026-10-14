import { FileText } from 'lucide-react';
import { formatDate, formatFileSize } from '../../lib/formatters';
import type { ArchivedDocument } from '../../types';
import { DocumentFileName, getPropertyLocation } from './document-view-helpers';

type DocumentListViewProps = {
    documents: ArchivedDocument[];
    onViewDocument: (document: ArchivedDocument) => void;
};

export default function DocumentListView({
    documents,
    onViewDocument,
}: DocumentListViewProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs tracking-wide text-slate-600 uppercase dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                        {[
                            'File',
                            'Tax declaration no.',
                            'Registered owner',
                            'Lot no.',
                            'Municipality / barangay',
                            'Date added',
                        ].map((title, index) => (
                            <th
                                key={title}
                                scope="col"
                                className={`${index === 0 ? 'px-4 sm:px-5' : 'px-3'} py-3 font-semibold`}
                            >
                                {title}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {documents.map((document) => (
                        <tr
                            key={document.id}
                            className="text-slate-700 dark:text-slate-300"
                        >
                            <th scope="row" className="px-4 py-3.5 sm:px-5">
                                <span className="flex max-w-72 items-center gap-2">
                                    <FileText
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-blue-900 dark:text-blue-200"
                                    />
                                    <DocumentFileName
                                        document={document}
                                        onViewDocument={onViewDocument}
                                    />
                                </span>
                                <span className="mt-1 block pl-6 text-xs font-normal text-slate-500 dark:text-slate-400">
                                    {formatFileSize(document.fileSize)}
                                </span>
                            </th>
                            <td className="px-3 py-3.5">
                                {document.taxDeclarationNumber ?? '—'}
                            </td>
                            <td className="px-3 py-3.5">
                                {document.registeredOwner ?? '—'}
                            </td>
                            <td className="px-3 py-3.5">
                                {document.lotNumber ?? '—'}
                            </td>
                            <td className="px-3 py-3.5">
                                {getPropertyLocation(document) || '—'}
                            </td>
                            <td className="px-3 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                {formatDate(document.createdAt)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
