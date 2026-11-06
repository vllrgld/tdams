export function createUploadSession() {
    let generation = 0;
    let active = false;
    const requests = new Set<AbortController>();

    function close() {
        generation += 1;
        active = false;
        for (const request of requests) request.abort();
        requests.clear();
    }

    return {
        open() {
            close();
            active = true;
        },
        close,
        async run<T>(
            request: (signal: AbortSignal) => Promise<T>,
            onSuccess: (result: T) => void,
            onError: (error: unknown) => void,
            onFinish?: () => void,
        ): Promise<void> {
            if (!active) return;
            const currentGeneration = generation;
            const controller = new AbortController();
            requests.add(controller);
            const isCurrent = () =>
                active &&
                currentGeneration === generation &&
                !controller.signal.aborted;
            try {
                const result = await request(controller.signal);
                if (isCurrent()) onSuccess(result);
            } catch (error) {
                if (isCurrent()) onError(error);
            } finally {
                requests.delete(controller);
                if (isCurrent()) onFinish?.();
            }
        },
    };
}
