# breadcrumb

2026-10-07, transformation engine. `BreadcrumbLink` uses `useRender`. Leftover scan clean.

## Changed

- `resources/js/components/ui/breadcrumb.tsx`
- `resources/js/components/breadcrumbs.tsx`: `asChild` became `render={<Link />}`.

## Left alone

- List, page, separator, and ellipsis markup.

## Behavior changes

## Verify by hand

- Click a non-current breadcrumb. It should navigate. The current crumb should not be a link.
