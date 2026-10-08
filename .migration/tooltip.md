# tooltip

2026-10-07, transformation engine. Portal, then Positioner, then Popup. `delayDuration` became `delay`. Leftover scan clean.

## Changed

- `resources/js/components/ui/tooltip.tsx`
- `resources/js/app.tsx`: `delayDuration={0}` became `delay={0}`.
- `resources/js/components/ui/sidebar.tsx`: tooltip trigger uses `render`.

## Left alone

- `sonner` toasts.

## Behavior changes

- `skipDelayDuration` and `disableHoverableContent` have no equivalent. The app did not pass them. Provider delay stays 0.

## Verify by hand

- Hover a collapsed sidebar item. The tooltip should appear on the right and hide when the sidebar is expanded.
