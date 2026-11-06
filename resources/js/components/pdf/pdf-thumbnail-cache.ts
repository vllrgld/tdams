export type ThumbnailQuality = 'card' | 'book';

const MAX_CONCURRENT_THUMBNAILS = 3;
const MAX_CACHED_THUMBNAILS = 64;
const MAX_CACHED_BYTES = 16 * 1024 * 1024;
const JPEG_QUALITY: Record<ThumbnailQuality, number> = {
    card: 0.72,
    book: 0.88,
};

type CachedThumbnail = {
    url: string;
    bytes: number;
    consumers: number;
    expired: boolean;
};

const thumbnailObjectUrls = new Map<string, CachedThumbnail>();
let cachedBytes = 0;
let cacheGeneration = 0;
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

function removeCachedThumbnail(key: string, thumbnail: CachedThumbnail) {
    thumbnailObjectUrls.delete(key);
    cachedBytes -= thumbnail.bytes;
    URL.revokeObjectURL(thumbnail.url);
}

export function acquireCachedThumbnail(key: string) {
    const thumbnail = thumbnailObjectUrls.get(key);

    if (!thumbnail || thumbnail.expired) {
        return null;
    }

    thumbnail.consumers += 1;
    thumbnailObjectUrls.delete(key);
    thumbnailObjectUrls.set(key, thumbnail);
    let released = false;

    return {
        url: thumbnail.url,
        release() {
            if (released) return;
            released = true;
            thumbnail.consumers -= 1;

            if (thumbnail.expired && thumbnail.consumers === 0) {
                removeCachedThumbnail(key, thumbnail);
            }
        },
    };
}

export function clearThumbnailCache() {
    cacheGeneration += 1;

    for (const [key, thumbnail] of thumbnailObjectUrls) {
        if (thumbnail.consumers === 0) {
            removeCachedThumbnail(key, thumbnail);
        } else {
            thumbnail.expired = true;
        }
    }
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
    const generation = cacheGeneration;

    if (thumbnailObjectUrls.has(key)) {
        return;
    }

    canvas.toBlob(
        (blob) => {
            if (
                !blob ||
                generation !== cacheGeneration ||
                thumbnailObjectUrls.has(key) ||
                blob.size > MAX_CACHED_BYTES
            ) {
                return;
            }

            for (const [oldKey, thumbnail] of thumbnailObjectUrls) {
                if (
                    thumbnailObjectUrls.size < MAX_CACHED_THUMBNAILS &&
                    cachedBytes + blob.size <= MAX_CACHED_BYTES
                )
                    break;
                if (thumbnail.consumers === 0) {
                    removeCachedThumbnail(oldKey, thumbnail);
                }
            }

            if (
                thumbnailObjectUrls.size >= MAX_CACHED_THUMBNAILS ||
                cachedBytes + blob.size > MAX_CACHED_BYTES
            )
                return;

            thumbnailObjectUrls.set(key, {
                url: URL.createObjectURL(blob),
                bytes: blob.size,
                consumers: 0,
                expired: false,
            });
            cachedBytes += blob.size;
        },
        'image/jpeg',
        JPEG_QUALITY[quality],
    );
}
