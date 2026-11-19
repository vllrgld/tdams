import { Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ArchivedDocument } from '@/types/documents';

const ACTION_CLASS_NAME =
    'absolute top-2 z-20 size-8 cursor-pointer rounded-none bg-transparent text-blue-900 shadow-none [filter:drop-shadow(0_0_2px_rgb(255_255_255))_drop-shadow(0_1px_2px_rgb(255_255_255_/_0.9))] transition-transform duration-200 ease-out hover:scale-150 hover:bg-transparent hover:text-blue-950 focus-visible:ring-blue-700 motion-reduce:transition-none motion-reduce:hover:scale-100';

export type DocumentThumbnailActionHandlers = {
    onShowChain: (document: ArchivedDocument) => void;
};

export default function DocumentThumbnailActions({
    document,
    onShowChain,
}: DocumentThumbnailActionHandlers & { document: ArchivedDocument }) {
    if (!document.usesTaxFields) return null;

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onShowChain(document)}
            aria-label={`Show document chain for ${document.originalFilename}`}
            title="Show document chain"
            className={cn(ACTION_CLASS_NAME, 'right-2')}
        >
            <Network aria-hidden="true" className="size-4" />
        </Button>
    );
}
