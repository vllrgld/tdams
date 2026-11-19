export default function AppLogo() {
    return (
        <span className="flex min-w-0 items-center gap-2">
            <img
                src="/logo.png"
                alt=""
                className="size-8 shrink-0 object-contain"
            />
            <span className="max-w-56 text-sm leading-tight font-semibold text-blue-900 group-data-[collapsible=icon]:hidden dark:text-white">
                Document Archiving and Management System
            </span>
        </span>
    );
}
