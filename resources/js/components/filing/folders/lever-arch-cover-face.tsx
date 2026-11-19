export default function LeverArchCoverFace() {
    return (
        <div className="absolute inset-0 bg-blue-900" aria-hidden="true">
            {[30, 57].map((top) => (
                <div
                    key={top}
                    className="absolute left-[12%] h-[2.5%] w-[15%] rounded-full border-2 border-slate-300 bg-slate-950 shadow-inner"
                    style={{ top: `${top}%` }}
                />
            ))}
        </div>
    );
}
