# sheet

2026-10-07, transformation engine. Same dialog primitive as the modal, with edge slide classes on `data-starting-style` / `data-ending-style`. Leftover scan clean.

## Changed

- `resources/js/components/ui/sheet.tsx`
- `resources/js/components/app-header.tsx`: mobile menu trigger uses `render`.
- Sidebar still opens `Sheet` on small screens.

## Left alone

- Sheet header and footer divs.

## Behavior changes

- Slide-in keyframes were restated as translate transitions per side.

## Verify by hand

- Narrow the window, open the menu button, and close the sheet with the control and with Escape.
