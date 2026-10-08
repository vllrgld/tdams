# dialog

2026-10-07, transformation engine. Overlay became Backdrop and Content became Popup. No Positioner, because the dialog stays centered. Leftover scan clean.

## Changed

- `resources/js/components/ui/dialog.tsx`
- `resources/js/components/delete-user.tsx` and `resources/js/components/passkey-item.tsx`: triggers and closes use `render`.

## Left alone

- Header and footer layout divs.

## Behavior changes

- Enter and exit use opacity and scale transitions instead of `animate-in` / `animate-out`.

## Verify by hand

- Open delete account, press Escape, and confirm focus returns. Cancel and the submit button should still work.
