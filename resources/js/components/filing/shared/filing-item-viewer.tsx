import OpenBook from '../books/open-book';
import OpenFolder from '../folders/open-folder';
import type { FilingItemViewerProps } from './filing-item-types';

export default function FilingItemViewer(props: FilingItemViewerProps) {
    return props.opened.item.kind === 'folder' ? (
        <OpenFolder {...props} />
    ) : (
        <OpenBook {...props} />
    );
}
