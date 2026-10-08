# navigation-menu

2026-10-07, transformation engine. Root, list, item, trigger, content, and link map directly. Viewport is Portal, Positioner, Popup, then Viewport. Indicator is `Icon`. Leftover scan clean.

## Changed

- `resources/js/components/ui/navigation-menu.tsx`
- Open styles use `data-popup-open`. Viewport size uses `--positioner-height` and `--positioner-width`.

## Left alone

- `resources/js/components/app-header.tsx` only renders list items and links, not the popup viewport.

## Behavior changes

- The `viewport` boolean is no longer a primitive prop. The wrapper still accepts it and skips the viewport when it is false.
- Hover open delay follows Base UI's 50ms default. The previous Radix default was 200ms. Nothing in the app opens a nav popup.
- `NavigationMenuIndicator` no longer animates a Radix indicator. It renders Base UI's icon part.

## Verify by hand

- Header links should still highlight the current page. If a popup nav is added later, hover, arrow keys, and Escape need a pass.
