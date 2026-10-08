# select

2026-10-07, transformation engine. Viewport became List, scroll buttons became arrows, and positioning moved to Positioner. Leftover scan clean.

## Changed

- `resources/js/components/ui/select.tsx`
- Former `position="popper"` is `alignItemWithTrigger={false}`.
- CSS variables are `--available-height`, `--transform-origin`, `--anchor-width`, and `--anchor-height`.
- `avoidCollisions={false}` is `collisionAvoidance` with side, align, and fallback set to `none`.

## Left alone

- No page currently renders a Select.

## Behavior changes

- `onValueChange` can receive `null`. No call site passes a string setter.

## Verify by hand

- Open a select, type to highlight, and choose an item with Enter and with a click. The popup should match the trigger width.
