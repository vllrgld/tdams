import type { ArchivedDocument } from '../../types';

export function getPropertyLocation(document: ArchivedDocument): string {
    return [
        document.propertyLocationStreet,
        document.propertyLocationBarangay ?? document.barangay,
        document.propertyLocationDistrict,
        document.propertyLocationMunicipality ?? document.municipality,
    ]
        .filter(Boolean)
        .join(', ');
}

export function DocumentFileName({
    document,
    onViewDocument,
}: {
    document: ArchivedDocument;
    onViewDocument: (document: ArchivedDocument) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onViewDocument(document)}
            title={`View ${document.originalFilename}`}
            className="truncate text-left font-medium text-blue-900 underline decoration-blue-900/30 underline-offset-4 hover:decoration-blue-900 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none dark:text-blue-200 dark:decoration-blue-200/30 dark:hover:decoration-blue-200"
        >
            {document.originalFilename}
        </button>
    );
}

export function DocumentCardField({
    label,
    value,
    tone = 'default',
}: {
    label: string;
    value: string | null;
    tone?: 'default' | 'on-image';
}) {
    const onImage = tone === 'on-image';

    return (
        <div>
            <dt
                className={
                    onImage
                        ? 'text-[10px] font-medium tracking-wide text-blue-100/80 uppercase'
                        : 'text-xs font-medium text-slate-500 dark:text-slate-400'
                }
            >
                {label}
            </dt>
            <dd
                className={
                    onImage
                        ? 'mt-0.5 truncate font-semibold text-white'
                        : 'mt-0.5 break-words text-slate-900 dark:text-slate-100'
                }
            >
                {value ?? '—'}
            </dd>
        </div>
    );
}
