# checkbox

2026-10-07, transformation engine. Direct `@base-ui/react/checkbox` mapping. `data-[state=checked]` became `data-checked`. Leftover scan clean.

## Changed

- `resources/js/components/ui/checkbox.tsx`

## Left alone

- No call sites used `checked="indeterminate"`.

## Behavior changes

## Verify by hand

- Check and uncheck a checkbox with mouse and Space. The check icon should show only when checked.
