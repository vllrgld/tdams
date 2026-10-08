# badge

2026-10-07, transformation engine. Polymorphic badge uses `useRender` instead of Radix Slot. Leftover scan clean.

## Changed

- `resources/js/components/ui/badge.tsx`

## Left alone

- No app call sites used `asChild` on Badge.

## Behavior changes

## Verify by hand

- Any badge still renders as a span with the same variants.
