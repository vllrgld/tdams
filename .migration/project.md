# project

2026-10-07, transformation engine on the legacy `new-york` style (no `base-new-york` counterpart, so classes were kept). Whole-project switch from Radix to `@base-ui/react` typechecks. Three pre-existing errors remain in `resources/js/actions/Illuminate/Routing/RedirectController.ts` (`methods` / `"query"`), unrelated to this migration.

## Changed

- Installed `@base-ui/react` and removed every `@radix-ui/react-*` dependency.
- Rewired the Radix wrappers under `resources/js/components/ui` and updated call sites from `asChild` to `render`.
- Set `components.json` `base` to `base`. Style stays `new-york` so the look is not replaced by a Base UI preset.

## Left alone

- `sonner`, `input-otp`, and the non-primitive wrappers (`alert`, `card`, `input`, `skeleton`, `spinner`) have no Radix dependency.

## Behavior changes

- Open and close motion uses `data-starting-style` / `data-ending-style` instead of `animate-in` / `animate-out`.
- Menu checkbox and radio items do not close the menu on click unless `closeOnClick` is set. This app does not use those items.
- Navigation menu hover delay follows Base UI's 50ms default. The header only uses links, not the popup viewport.
- Navigation menu indicator is Base UI's `Icon`. Nothing in the app renders `NavigationMenuIndicator`.

## Verify by hand

- Open the sidebar, the user menu, the mobile sheet, a settings link, and the delete-account dialog. Keyboard: tab to a menu item and press Enter; tab through a dialog and press Escape.
