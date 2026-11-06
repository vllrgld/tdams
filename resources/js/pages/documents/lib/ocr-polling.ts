export type OcrStatus = {
    status: string;
    error: string | null;
    pdfUrl: string | null;
    mimeType: string;
};

export function pollOcrStatus(
    request: (signal: AbortSignal) => Promise<OcrStatus>,
    onStatus: (result: OcrStatus) => void,
    onError: (error: unknown) => boolean,
) {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let failures = 0;

    async function poll() {
        try {
            const result = await request(controller.signal);
            if (controller.signal.aborted) return;
            failures = 0;
            onStatus(result);
            if (result.status !== 'completed' && result.status !== 'failed') {
                timer = setTimeout(() => void poll(), 2000);
            }
        } catch (error) {
            if (controller.signal.aborted) return;
            if (onError(error)) {
                const delay = Math.min(2000 * 2 ** failures++, 30000);
                timer = setTimeout(() => void poll(), delay);
            }
        }
    }

    void poll();

    return () => {
        controller.abort();
        clearTimeout(timer);
    };
}
