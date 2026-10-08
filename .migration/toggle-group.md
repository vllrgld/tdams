# toggle-group

2026-10-07, transformation engine. Group root is `@base-ui/react/toggle-group`; items are `@base-ui/react/toggle`. Leftover scan clean.

## Changed

- `resources/js/components/ui/toggle-group.tsx`

## Left alone

- Shared `toggleVariants` and the outline border classes.

## Behavior changes

- `type="single"|"multiple"` is gone. Multiple selection is the `multiple` boolean, and `value` is always an array. No call site passed `type`.

## Verify by hand

- In a group, arrow keys should move focus. Only one item stays pressed unless `multiple` is set.
