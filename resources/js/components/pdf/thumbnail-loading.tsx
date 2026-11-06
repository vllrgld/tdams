export default function ThumbnailLoading() {
    return (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <svg
                role="status"
                aria-label="Loading document preview"
                viewBox="0 0 40 40"
                fill="none"
                className="size-8 text-blue-900 dark:text-blue-600"
            >
                <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="opacity-10 dark:opacity-20"
                />
                <circle
                    cx="20"
                    cy="20"
                    r="16"
                    pathLength="100"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="28 72"
                    className="origin-center animate-spin [animation-duration:1.2s] motion-reduce:animate-none"
                />
            </svg>
        </div>
    );
}
