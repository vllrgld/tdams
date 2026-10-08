# dropdown-menu

2026-10-07, transformation engine. Radix dropdown menu became `@base-ui/react/menu` with Portal, Positioner, and Popup. Leftover scan clean.

## Changed

- `resources/js/components/ui/dropdown-menu.tsx`
- `resources/js/components/app-header.tsx`, `nav-user.tsx`, and `user-menu-content.tsx`: `asChild` became `render`.
- Menu width uses `--anchor-width` instead of `--radix-dropdown-menu-trigger-width`.

## Left alone

- `DropdownMenuShortcut` is still a span.

## Behavior changes

- Checkbox and radio items do not close the menu on click (`closeOnClick` defaults to false). Regular items still close. This app only uses regular items and links.

## Verify by hand

- Open the avatar menu with mouse and keyboard. Settings and Log out should navigate and the menu should close.
