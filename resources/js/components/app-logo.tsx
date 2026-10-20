export default function AppLogo() {
    return (
        <span className="flex min-w-0 items-center gap-2">
            <img
                src="/logo.png"
                alt=""
                className="size-8 shrink-0 object-contain"
            />
            <span className="text-sm font-semibold tracking-wide text-blue-900 group-data-[collapsible=icon]:hidden dark:text-blue-200">
                TDAMS
            </span>
        </span>
    );
}
