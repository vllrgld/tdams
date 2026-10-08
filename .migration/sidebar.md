# sidebar

2026-10-07, transformation engine. Slot-based pieces use `useRender`. Menu buttons compose with the tooltip and dropdown trigger through `render`. Leftover scan clean.

## Changed

- `resources/js/components/ui/sidebar.tsx`
- `resources/js/components/app-sidebar.tsx`, `nav-main.tsx`, `nav-footer.tsx`, and `nav-user.tsx`: `asChild` became `render`.
- `data-[state=open]` on menu buttons became `data-popup-open`.

## Left alone

- Sidebar layout, rail, and mobile sheet structure.

## Behavior changes

- Collapsed tooltips go through Base UI tooltip positioning.

## Verify by hand

- Click Dashboard, a footer link, and the user menu. Collapse the sidebar and confirm the tooltip and icon-only layout.
