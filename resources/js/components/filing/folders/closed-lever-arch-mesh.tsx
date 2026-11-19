/** Lightweight CSS companion for the original cabinet view; the model view uses Three.js. */
export default function ClosedLeverArchMesh({
    label,
    depth,
}: {
    label: string;
    depth: number;
}) {
    return (
        <div
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d' }}
        >
            <div
                className="absolute inset-0 border border-blue-950 bg-blue-900"
                style={{ backfaceVisibility: 'hidden' }}
            ></div>
            {[0, 1].map((side) => (
                <div
                    key={side}
                    className="absolute top-0 h-full border border-blue-950 bg-blue-900"
                    style={{
                        width: depth,
                        left: side ? '100%' : undefined,
                        right: side ? undefined : '100%',
                        transformOrigin: side ? 'left center' : 'right center',
                        transform: `rotateY(${side ? 90 : -90}deg)`,
                    }}
                />
            ))}
            <div
                className="absolute bottom-full left-0 flex w-full flex-col items-center justify-center gap-3 border-2 border-blue-950 bg-blue-900 py-[6%]"
                style={{
                    height: depth,
                    transformOrigin: 'bottom center',
                    transform: 'rotateX(90deg)',
                }}
            >
                <div className="flex h-[60%] w-[72%] min-w-0 items-center justify-center overflow-hidden border border-slate-300 bg-stone-100 py-[5%] text-[10px] leading-tight font-semibold text-slate-800">
                    <span className="rotate-180 truncate [writing-mode:vertical-rl]">
                        {label}
                    </span>
                </div>
                <div className="aspect-square w-[45%] shrink-0 rounded-full border-2 border-slate-300 bg-slate-950" />
            </div>
            <div
                className="absolute inset-0 border border-blue-950 bg-blue-900"
                style={{
                    transform: `translateZ(${-depth}px) rotateY(180deg)`,
                    backfaceVisibility: 'hidden',
                }}
            />
        </div>
    );
}
