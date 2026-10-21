export type ThumbnailQuality = 'card' | 'book';

const MAX_CONCURRENT_THUMBNAILS = 3;
const JPEG_QUALITY: Record<ThumbnailQuality, number> = {
    card: 0.72,
    book: 0.88,
};

const thumbnailObjectUrls = new Map<string, string>();
let activeThumbnails = 0;
const thumbnailQueue: Array<() => void> = [];

export function thumbnailCacheKey(
    url: string,
    pageNumber: number,
    quality: ThumbnailQuality,
    width: number,
): string {
    return `${url}#${pageNumber}#${quality}#${width}`;
}

export function getCachedThumbnail(key: string): string | null {
    return thumbnailObjectUrls.get(key) ?? null;
}

export function acquireThumbnailSlot(): Promise<void> {
    return new Promise((resolve) => {
        const start = () => {
            activeThumbnails += 1;
            resolve();
        };

        if (activeThumbnails < MAX_CONCURRENT_THUMBNAILS) {
            start();
            return;
        }

        thumbnailQueue.push(start);
    });
}

export function releaseThumbnailSlot() {
    activeThumbnails = Math.max(0, activeThumbnails - 1);
    thumbnailQueue.shift()?.();
}

export function cacheRenderedThumbnail(
    url: string,
    pageNumber: number,
    quality: ThumbnailQuality,
    width: number,
    canvas: HTMLCanvasElement,
) {
    const key = thumbnailCacheKey(url, pageNumber, quality, width);

    if (thumbnailObjectUrls.has(key)) {
        return;
    }

    canvas.toBlob(
        (blob) => {
            if (!blob || thumbnailObjectUrls.has(key)) {
                return;
            }

            thumbnailObjectUrls.set(key, URL.createObjectURL(blob));
        },
        'image/jpeg',
        JPEG_QUALITY[quality],
    );
}
