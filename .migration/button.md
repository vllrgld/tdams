# button

2026-10-07, transformation engine. `Slot`/`asChild` replaced by `@base-ui/react/button`, which accepts `render`. Leftover scan clean.

## Changed

- `resources/js/components/ui/button.tsx`: real Button primitive, same `buttonVariants` classes.
- Call sites: `resources/js/layouts/settings/layout.tsx`, `resources/js/components/delete-user.tsx`. `asChild` became `render`.

## Left alone

- Variant and size classes.

## Behavior changes

## Verify by hand

- Settings nav links still look like ghost buttons and navigate.
- Delete-account submit still posts the form.
