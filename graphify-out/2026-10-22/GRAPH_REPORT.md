# Graph Report - dtms  (2026-10-22)

## Corpus Check
- 348 files · ~369,567 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 74 file(s) not represented in the graph (top: .csv 53, (none) 16, .example 1)

## Summary
- 3065 nodes · 6544 edges · 178 communities (128 shown, 50 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 331 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b22f10af`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ShadcnInstaller
- scripts/core.py
- json
- document-upload-dialog.tsx
- filing-cabinet.tsx
- gray
- TestTokenizer
- DocumentSearchTest
- card
- slide_search_core.py
- cabinets/index.tsx
- component-tokens.md
- Database Migrations
- re
- test_tailwind_config_gen.py
- use-appearance.tsx
- dropdown-menu.tsx
- react
- Brand Context Sync
- Spacing Scale Tokens
- auth.ts
- lucide-react
- Transformation Engine
- Semantic Color Tokens
- HTML Token Validator
- app-header.tsx
- Illuminate\Http\RedirectResponse
- sidebar.tsx
- Book
- Brand Color Extraction Scripts
- TestCase
- test_style_taxonomy.py
- design/references/banner-sizes-and-styles.md
- design_system.py
- SKILL.md (design)
- package.json Metadata
- npm Dependencies
- CabinetsTest
- radius
- csv
- Banner Design Skill
- SKILL.md (design-system)
- argparse
- fetch-background.py
- TailwindConfigGenerator
- shadcn Component & A11y Docs
- Tailwind Config Gen Tests
- ui-styling/SKILL.md
- Laravel Service Providers
- PasswordValidationRules
- Inertia Middleware & Fortify
- Brand Accessibility Checklists
- validate_data.py
- TestSearchDomains
- layout.tsx
- Brand Typography & Voice
- Token Architecture Layers
- Brand Asset Organization
- Font Size Tokens
- Button
- UI/UX Pro Max Skill
- TypeScript Config
- @inertiajs/react
- UserFactory.php
- test_data_contracts.py
- Catalog Refresh Tests
- Inertia\Testing\AssertableInertia
- index.ts
- @base-ui/react
- app.tsx
- Brand Asset Validator
- csv
- logo-design.md
- Web Stack Freshness Tests
- Composer Scripts
- Design Tokens Starter Structure
- Generated Config JS Tests
- button
- TestDomainDetection
- test_design_system_mode.py
- sonner
- Email Verification Tests
- pdf-thumbnail.tsx
- TDAMS Branding Assets
- tailwind-customization.md
- Routing by Task Type
- Cabinet
- Composer Package Metadata
- Token Usage Validator
- slides-html-template.md
- alert.tsx
- tailwind-utilities.md
- Canvas Design Philosophy
- Tailwind Fonts & Spacing Config
- ilocos-norte-map.tsx
- Composer Dev Dependencies
- _palette_is_dark
- Motion Duration Tokens
- shadcn Theming Docs
- Tailwind Responsive Docs
- read_rows
- input
- slides-copywriting-formulas.md
- Composer Requirements
- xl
- BookmarksTest.php
- Optional Native Binaries
- DocumentController.php
- Composer Config
- ring
- none
- CI Workflow
- npm Scripts
- Password Reset Tests
- Document Upload Tests
- ArchiveTest
- Cabinet
- npm Dev Dependencies
- Bagong Pilipinas Emblems
- Ilocos Norte Seal
- cip-deliverable-guide.md
- PSR-4 Autoload
- Laravel Extra Config
- DesignSystemGenerator
- _select_palette_for_mode
- apple-touch-icon.png
- $type
- read_rows
- Login Cover Art
- SecurityTest
- Dependabot Config
- radius
- lg
- pnpm Workspace
- Apache License
- robots.txt
- DocumentLinkingTest
- messaging-framework.md
- sm
- BM25
- padding-y
- DatabaseSeeder.php
- .generate
- breadcrumbs.tsx
- 16
- 1
- 3
- 8
- destructive
- destructive-foreground
- muted
- primary-foreground
- secondary-foreground
- BM25
- TestThresholdGate
- components.json
- AppLogoIcon
- slides-layout-patterns.md
- split_values
- TestBm25CoreBehavior

## God Nodes (most connected - your core abstractions)
1. `cn()` - 150 edges
2. `react` - 76 edges
3. `Button()` - 75 edges
4. `TailwindConfigGenerator` - 58 edges
5. `lucide-react` - 50 edges
6. `@inertiajs/react` - 48 edges
7. `Input()` - 42 edges
8. `InputError()` - 40 edges
9. `TestCase` - 39 edges
10. `TestTailwindConfigGenerator` - 35 edges

## Surprising Connections (you probably didn't know these)
- `Multi-Skill Workflows` --semantically_similar_to--> `Complete Brand Package Workflow`  [INFERRED] [semantically similar]
  .github/prompts/design/references/design-routing.md → .github/prompts/design/SKILL.md
- `ui-ux-pro-max Skill` --semantically_similar_to--> `UI Styling Skill`  [INFERRED] [semantically similar]
  .github/skills/ui-ux-pro-max/SKILL.md → .github/prompts/ui-styling/SKILL.md
- `Button Component Classes (@apply)` --semantically_similar_to--> `Button Tokens`  [INFERRED] [semantically similar]
  .github/prompts/design-system/references/tailwind-integration.md → .github/prompts/design-system/references/component-tokens.md
- `Banner Output Path Convention` --semantically_similar_to--> `Asset Naming Convention`  [INFERRED] [semantically similar]
  .github/prompts/banner-design/SKILL.md → .github/prompts/brand/references/asset-organization.md
- `Token Compliance Rule` --semantically_similar_to--> `Brand Color Compliance Validation`  [INFERRED] [semantically similar]
  .github/prompts/design-system/SKILL.md → .github/prompts/brand/references/color-palette-management.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **asChild to render call-site migration** — migration_project_aschild_to_render, migration_breadcrumb_render_link, migration_button_base_ui_button, migration_sidebar_menu_button_composition, resources_js_components_breadcrumbs, resources_js_components_delete_user, resources_js_components_app_header [EXTRACTED 1.00]
- **Base UI Portal/Positioner/Popup pattern** — migration_dropdown_menu_portal_positioner_popup, migration_dropdown_menu_base_ui_menu, migration_select_base_ui_select, migration_tooltip_base_ui_tooltip, migration_navigation_menu_base_ui_navigation_menu [EXTRACTED 1.00]
- **Brand-to-Design-Token Sync Pipeline** — github_prompts_brand_skill_brand_guidelines_source_of_truth, github_prompts_brand_scripts_sync_brand_to_tokens, github_prompts_brand_skill_design_tokens_json, github_prompts_brand_skill_design_tokens_css, github_prompts_brand_scripts_inject_brand_context, github_prompts_brand_references_update_brand_update_command [EXTRACTED 1.00]
- **Brand → Design-System → UI-Styling Dependency Chain** — github_prompts_design_skill_brand_skill, github_prompts_design_skill_design_system_skill, github_prompts_design_skill_ui_styling_skill [EXTRACTED 1.00]
- **Complete Brand Package Pipeline (Logo → CIP → Presentation)** — github_prompts_design_scripts_logo_generate, github_prompts_design_scripts_cip_generate, github_prompts_design_scripts_cip_render_html, github_prompts_design_references_slides_create [EXTRACTED 1.00]
- **Slides Knowledge Base (Layouts, Template, Copywriting, Strategies)** — github_prompts_design_references_slides_layout_patterns, github_prompts_design_references_slides_html_template, github_prompts_design_references_slides_copywriting_formulas, github_prompts_design_references_slides_strategies [EXTRACTED 1.00]
- **UI Styling skill reference library (shadcn + Tailwind + Canvas)** — github_prompts_ui_styling_skill, github_prompts_ui_styling_references_shadcn_components, github_prompts_ui_styling_references_shadcn_theming, github_prompts_ui_styling_references_shadcn_accessibility, github_prompts_ui_styling_references_tailwind_utilities, github_prompts_ui_styling_references_tailwind_responsive, github_prompts_ui_styling_references_tailwind_customization, github_prompts_ui_styling_references_canvas_design_system [EXTRACTED 1.00]
- **ui-ux-pro-max design system generation workflow** — github_skills_ui_ux_pro_max_skill_search_py, github_skills_ui_ux_pro_max_skill_design_system_generation, github_skills_ui_ux_pro_max_skill_ui_reasoning_csv, github_skills_ui_ux_pro_max_skill_design_dials, github_skills_ui_ux_pro_max_skill_master_overrides_pattern [EXTRACTED 1.00]
- **CSS-variable theming pipeline (globals.css vars → Tailwind config → dark mode toggle)** — github_prompts_ui_styling_references_shadcn_theming_css_variable_system, github_prompts_ui_styling_references_shadcn_theming_radius_variable, github_prompts_ui_styling_references_tailwind_customization_tailwind_config_ts, github_prompts_ui_styling_references_tailwind_customization_dark_mode_configuration, github_prompts_ui_styling_references_shadcn_theming_next_themes_dark_mode [INFERRED 0.85]
- **Dark Mode Theming via Semantic Overrides** — github_prompts_design_system_references_semantic_tokens_dark_mode_overrides, github_prompts_design_system_references_token_architecture_dark_mode_semantic_override, github_prompts_design_system_references_tailwind_integration_dark_mode_toggle, github_prompts_design_system_references_tailwind_integration_hsl_css_variables [INFERRED 0.85]
- **Radix data-state to Base UI data attributes** — migration_checkbox_data_checked, migration_toggle_data_pressed, migration_navigation_menu_data_popup_open, migration_sidebar_data_popup_open [INFERRED 0.85]
- **Primitive -> Semantic -> Component Token Cascade** — github_prompts_design_system_references_token_architecture_primitive_layer, github_prompts_design_system_references_token_architecture_semantic_layer, github_prompts_design_system_references_token_architecture_component_layer, github_prompts_design_system_references_primitive_tokens_color_scales, github_prompts_design_system_references_semantic_tokens_color_semantics, github_prompts_design_system_references_component_tokens_button_tokens [INFERRED 0.85]

## Communities (178 total, 50 thin omitted)

### Community 0 - "ShadcnInstaller"
Cohesion: 0.05
Nodes (3): main(), ShadcnInstaller, TestShadcnInstaller

### Community 1 - "scripts/core.py"
Cohesion: 0.06
Nodes (31): BM25, _contains_phrase(), detect_domain(), _domain_keywords(), _exact_match_diagnostic(), _exact_row_identity(), _exact_stack_identifier(), _file_signature() (+23 more)

### Community 2 - "json"
Cohesion: 0.08
Nodes (19): CIP BM25 Search Engine (core.py), CIP Workflow, Gemini Flash/Pro Image Models, CIP HTML Presentation, build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana() (+11 more)

### Community 3 - "document-upload-dialog.tsx"
Cohesion: 0.11
Nodes (37): Dialog Backdrop and Popup, Opacity and scale transitions, input-otp, DeleteUser(), PasskeyItem(), Props, GridScanIcon(), Props (+29 more)

### Community 4 - "filing-cabinet.tsx"
Cohesion: 0.05
Nodes (53): motion, react-dom, BOOK_POP, CabinetDrawer(), CabinetDrawerProps, drawerRimOffset(), translateZ(), CLOSEUP (+45 more)

### Community 5 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 8 - "card"
Cohesion: 0.20
Nodes (12): $type, $value, bg, bg, padding, shadow, card, bg (+4 more)

### Community 9 - "slide_search_core.py"
Cohesion: 0.08
Nodes (17): format_context(), format_result(), main(), BM25, calculate_pattern_break(), detect_domain(), get_background_config(), get_color_for_emotion() (+9 more)

### Community 10 - "cabinets/index.tsx"
Cohesion: 0.10
Nodes (35): DrawerIcon, DrawerIconProps, Props, TwoFactorRecoveryCodes(), Badge(), badgeVariants, Card(), CardContent() (+27 more)

### Community 11 - "component-tokens.md"
Cohesion: 0.07
Nodes (32): Alert Spec, Badge Spec, Button Spec, Card Spec, Dialog Spec, Input Spec, Table Spec, Alert Tokens (+24 more)

### Community 12 - "Database Migrations"
Cohesion: 0.05
Nodes (23): {closure#1}(), {closure#2}(), {closure#3}(), {closure#1}(), {closure#2}(), {closure#1}(), {closure#2}(), {closure#3}() (+15 more)

### Community 13 - "re"
Cohesion: 0.08
Nodes (18): gemini-3.1-pro-preview, 12 Icon Categories, 15 Icon Styles, apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon() (+10 more)

### Community 14 - "test_tailwind_config_gen.py"
Cohesion: 0.09
Nodes (9): test_sync_parses_bundled_starter_template(), _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation(), Node.js 18+ Requirement, pytest Dev Dependencies (pytest>=8.0.0, pytest-cov, pytest-mock), requirements.txt (tests), pytest Test Dependencies (pytest>=7.4.0, pytest-cov, pytest-mock) (+1 more)

### Community 15 - "use-appearance.tsx"
Cohesion: 0.22
Nodes (16): AppearanceToggleTab(), Appearance, applyTheme(), getStoredAppearance(), handleSystemThemeChange(), initializeTheme(), isDarkMode(), listeners (+8 more)

### Community 16 - "dropdown-menu.tsx"
Cohesion: 0.12
Nodes (18): DropdownMenuCheckboxItem(), DropdownMenuGroup(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+10 more)

### Community 17 - "react"
Cohesion: 0.07
Nodes (51): react, ClientOnly(), PdfPreviewProps, PlaceholderPatternProps, resolvedComponents, useClientComponent(), DeclarationNumberSearch(), DeclarationNumberSearchProps (+43 more)

### Community 18 - "Brand Context Sync"
Cohesion: 0.10
Nodes (27): Brand Guidelines Document Structure, Extractable Brand Fields, Brand Color Presets, /brand:update Command, Core Visual Elements, Visual Guidelines Template, extractColorsFromTable(), extractCoreAttributes() (+19 more)

### Community 19 - "Spacing Scale Tokens"
Cohesion: 0.09
Nodes (22): $type, $value, $type, $value, $type, $value, $type, $value (+14 more)

### Community 20 - "auth.ts"
Cohesion: 0.24
Nodes (8): Auth, Passkey, TwoFactorSecretKey, TwoFactorSetupData, InertiaConfig, @inertiajs/core, InputHTMLAttributes, react

### Community 21 - "lucide-react"
Cohesion: 0.10
Nodes (33): lucide-react, IconProps, Select(), SelectContent(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton() (+25 more)

### Community 22 - "Transformation Engine"
Cohesion: 0.10
Nodes (20): @base-ui/react/avatar, Radix Slot, @base-ui/react/button, buttonVariants, Collapsible Panel (formerly Content), --anchor-width CSS variable, @base-ui/react/menu, closeOnClick defaults to false (+12 more)

### Community 23 - "Semantic Color Tokens"
Cohesion: 0.11
Nodes (19): $type, $value, background, foreground, muted-foreground, primary, primary-hover, secondary (+11 more)

### Community 24 - "HTML Token Validator"
Cohesion: 0.13
Nodes (12): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+4 more)

### Community 25 - "app-header.tsx"
Cohesion: 0.11
Nodes (37): NavigationMenuIndicator, --positioner-height / --positioner-width, viewport boolean wrapper prop, Per-side translate transitions, AppHeader(), mainNavItems, Props, rightNavItems (+29 more)

### Community 26 - "Illuminate\Http\RedirectResponse"
Cohesion: 0.10
Nodes (4): CabinetController, Controller, ProfileController, SecurityController

### Community 27 - "sidebar.tsx"
Cohesion: 0.12
Nodes (37): data-popup-open attribute, data-popup-open on menu buttons, accountNavItems, AppSidebar(), mainNavItems, NavFooter(), CollapsibleNavItem(), NavMain() (+29 more)

### Community 28 - "Book"
Cohesion: 0.20
Nodes (8): BookController, {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#3}(), Book, {closure#2}()

### Community 29 - "Brand Color Extraction Scripts"
Cohesion: 0.10
Nodes (19): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+11 more)

### Community 30 - "TestCase"
Cohesion: 0.06
Nodes (11): AuthenticationTest, {closure#1}(), PasswordConfirmationTest, RegistrationTest, {closure#1}(), TwoFactorChallengeTest, DashboardTest, ExampleTest (+3 more)

### Community 32 - "design/references/banner-sizes-and-styles.md"
Cohesion: 0.12
Nodes (15): 22 Art Direction Styles, Google Display Network Ad Sizes, Pinterest Research Queries, Print Specs, Social Art Direction Styles (Reuse from Banner), Social Platform Sizes, Screenshot Export (Chrome Headless / Playwright / Puppeteer), Social Photos 8-Step Workflow (+7 more)

### Community 33 - "design_system.py"
Cohesion: 0.07
Nodes (15): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides() (+7 more)

### Community 34 - "SKILL.md (design)"
Cohesion: 0.16
Nodes (13): CIP Mockup Base Prompt Structure, Lighting & Context Modifiers, CIP Negative Prompts, CIP Style Modifiers, CIP Design Styles (Corporate Minimal, Modern Tech, Luxury Premium, ...), Logo Core Prompt Structure, Industry-Specific Logo Prompts, Logo Negative Prompts (+5 more)

### Community 35 - "package.json Metadata"
Cohesion: 0.08
Nodes (28): private, $schema, type, babel-plugin-react-compiler, clsx, concurrently, @inertiajs/vite, @laravel/multiplex (+20 more)

### Community 36 - "npm Dependencies"
Cohesion: 0.08
Nodes (26): dependencies, @base-ui/react, class-variance-authority, clsx, concurrently, @inertiajs/react, @inertiajs/vite, input-otp (+18 more)

### Community 38 - "radius"
Cohesion: 0.19
Nodes (14): $type, $value, $type, $value, $type, $value, primitive, radius (+6 more)

### Community 39 - "csv"
Cohesion: 0.05
Nodes (8): _rows(), TestNativeDesktopStackFreshness, TestFixtureValidation, TestMetricMath, read_rows(), read_rows(), TestTextLayoutDataContracts, TestTextLayoutRetrieval

### Community 40 - "Banner Design Skill"
Cohesion: 0.15
Nodes (15): 22 Art Direction Styles, Pinterest Research Queries, Platform Banner Sizes, Print Specs, SKILL.md (banner-design), ai-artist Skill, ai-multimodal Skill, AI Visual Generation (Gemini Flash / Pro) (+7 more)

### Community 41 - "SKILL.md (design-system)"
Cohesion: 0.16
Nodes (16): assets/design-tokens.css, flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path (+8 more)

### Community 42 - "argparse"
Cohesion: 0.12
Nodes (11): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+3 more)

### Community 43 - "fetch-background.py"
Cohesion: 0.16
Nodes (9): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+1 more)

### Community 45 - "shadcn Component & A11y Docs"
Cohesion: 0.12
Nodes (18): @axe-core/react Automated Testing, Focus Management (focus trap, focus-visible rings), Form Accessibility (labels, aria-invalid, error association), Keyboard Navigation Patterns, ARIA Live Regions, prefers-reduced-motion Support, Screen Reader Support (ARIA labels, sr-only), WCAG Color Contrast (AA 4.5:1 / AAA 7:1) (+10 more)

### Community 47 - "ui-styling/SKILL.md"
Cohesion: 0.23
Nodes (8): WAI-ARIA Design Patterns, Canvas Visual Design Layer, MIT License (frontmatter), Radix UI, shadcn CLI (npx shadcn@latest init/add), shadcn/ui, Tailwind CSS, UI Styling Skill

### Community 48 - "Laravel Service Providers"
Cohesion: 0.14
Nodes (3): AppServiceProvider, {closure#1}(), FortifyServiceProvider

### Community 49 - "PasswordValidationRules"
Cohesion: 0.10
Nodes (8): CreateNewUser, ResetUserPassword, PasswordValidationRules, ProfileValidationRules, PasswordUpdateRequest, ProfileDeleteRequest, ProfileUpdateRequest, TwoFactorAuthenticationRequest

### Community 50 - "Inertia Middleware & Fortify"
Cohesion: 0.09
Nodes (12): HandleAppearance, HandleInertiaRequests, {closure#1}(), {closure#10}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#8}() (+4 more)

### Community 51 - "Brand Accessibility Checklists"
Cohesion: 0.12
Nodes (14): Accessibility Review (WCAG AA), Post-Approval Archival, Asset Approval Checklist, Legal & Compliance Review, Reviewer Sign-off, Industry Color Palette Examples, Color System Hierarchy, Relative Luminance & Contrast Ratio Formula (+6 more)

### Community 52 - "validate_data.py"
Cohesion: 0.09
Nodes (33): TestGeneratedCatalogContract, _catalog_date(), _check_app_interface_contract(), _check_catalog_contract(), _check_catalog_summary(), _check_chart_contract(), _check_color_contract(), _check_core_data_contract() (+25 more)

### Community 54 - "layout.tsx"
Cohesion: 0.12
Nodes (13): @base-ui/react/separator, decorative prop dropped, Separator(), IsCurrentOrParentUrlFn, IsCurrentUrlFn, useCurrentUrl(), UseCurrentUrlReturn, WhenCurrentUrlFn (+5 more)

### Community 55 - "Brand Typography & Voice"
Cohesion: 0.12
Nodes (13): Common Font Pairings, Font Stack (Inter / JetBrains Mono), Line Height Guidelines, Major Third Type Scale (1.25), Typography Accessibility, Voice Chart, Voice Dimension Spectrums, Voice Testing (+5 more)

### Community 56 - "Token Architecture Layers"
Cohesion: 0.20
Nodes (13): assets/design-tokens.json, Button Component Classes (@apply), Dark Mode Toggle, HSL CSS Variables Base Layer, shadcn/ui Alignment, tailwind.config.ts Token Mapping, Component Token Layer, Dark Mode via Semantic Override (+5 more)

### Community 57 - "Brand Asset Organization"
Cohesion: 0.15
Nodes (12): Asset Cleanup Workflow, Asset Directory Structure, Asset Naming Convention, Asset Tagging System, Asset Version History, manifest.json Asset Registry, Co-branding Guidelines, Logo Approval Process (+4 more)

### Community 58 - "Font Size Tokens"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 60 - "Button"
Cohesion: 0.09
Nodes (31): @inertiajs/react, @laravel/passkeys, InputError(), PasskeyRegistration(), Props, PasskeyVerify(), Props, PasswordInput() (+23 more)

### Community 61 - "UI/UX Pro Max Skill"
Cohesion: 0.22
Nodes (12): Available Stacks (react, shadcn, html-tailwind, laravel, ...), Design Dials (--variance, --motion, --density), Design System Generation (--design-system), GSAP Animation Presets (gsap domain), Light/Dark Mode Contrast & Token-Driven Theming, Phosphor Icons Default (Heroicons fallback), Pre-Delivery Checklist (App UI), Search Domains (product, style, color, typography, ux, chart, ...) (+4 more)

### Community 62 - "TypeScript Config"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, module, moduleResolution (+7 more)

### Community 63 - "@inertiajs/react"
Cohesion: 0.15
Nodes (10): Heading(), EmptyState(), ManagePasskeys(), Props, ManageTwoFactor(), Props, useTwoFactorAuth(), UseTwoFactorAuthReturn (+2 more)

### Community 65 - "test_data_contracts.py"
Cohesion: 0.22
Nodes (4): apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), _validate_action()

### Community 67 - "Inertia\Testing\AssertableInertia"
Cohesion: 0.13
Nodes (21): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#1}(), {closure#10}(), {closure#2}(), {closure#3}() (+13 more)

### Community 68 - "index.ts"
Cohesion: 0.16
Nodes (18): AppContent(), Props, AppShell(), Props, AppSidebarHeader(), DropdownMenu(), DropdownMenuContent(), DropdownMenuTrigger() (+10 more)

### Community 69 - "@base-ui/react"
Cohesion: 0.18
Nodes (13): @base-ui/react/checkbox, data-checked attribute, @base-ui/react/toggle, data-pressed attribute, @base-ui/react/toggle-group, multiple boolean (replaces type), toggleVariants, @base-ui/react (+5 more)

### Community 70 - "app.tsx"
Cohesion: 0.42
Nodes (5): delay prop (formerly delayDuration), withApp(), Toaster(), TooltipProvider(), AuthLayout()

### Community 71 - "Brand Asset Validator"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 72 - "csv"
Cohesion: 0.10
Nodes (11): detect_domain(), get_cip_brief(), _load_csv(), search(), search_all(), _search_csv(), detect_domain(), _load_csv() (+3 more)

### Community 73 - "logo-design.md"
Cohesion: 0.12
Nodes (12): CIP Color Psychology, Color Harmony Types, Color Combinations by Industry, Primary Color Meanings, Logo Industry Defaults, Logo BM25 Search Engine (core.py), Logo Style Categories (55+), Logo Workflow (+4 more)

### Community 75 - "Composer Scripts"
Cohesion: 0.15
Nodes (13): scripts, ci:check, dev, lint, lint:check, post-autoload-dump, post-create-project-cmd, post-root-package-install (+5 more)

### Community 77 - "Design Tokens Starter Structure"
Cohesion: 0.15
Nodes (12): component, $type, $value, dark, semantic, $schema, $type, $value (+4 more)

### Community 79 - "button"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 81 - "test_design_system_mode.py"
Cohesion: 0.14
Nodes (6): _filter_anti_patterns_for_mode(), _query_wants_dark(), _resolve_color_mode(), _style_is_dark_primary(), TestAntiPatternGating, TestModeResolution

### Community 82 - "sonner"
Cohesion: 0.60
Nodes (3): Non-primitive wrappers (alert, card, input, skeleton, spinner), sonner, useFlashToast()

### Community 84 - "pdf-thumbnail.tsx"
Cohesion: 0.26
Nodes (13): react-pdf, acquireThumbnailSlot(), cacheRenderedThumbnail(), getCachedThumbnail(), JPEG_QUALITY, releaseThumbnailSlot(), thumbnailCacheKey(), thumbnailObjectUrls (+5 more)

### Community 85 - "TDAMS Branding Assets"
Cohesion: 0.17
Nodes (10): Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System), Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System) (+2 more)

### Community 86 - "tailwind-customization.md"
Cohesion: 0.25
Nodes (8): @apply Directive, Custom Utilities (@utility), Custom Variants (@custom-variant), Dark Mode Configuration (darkMode class/media), Layer Organization (@layer base/components/utilities), Tailwind Plugins (typography, forms, container-queries, custom), Content Configuration & Safelist, Complete tailwind.config.ts

### Community 87 - "Routing by Task Type"
Cohesion: 0.33
Nodes (5): Multi-Skill Workflows, brand (external sub-skill), design-system (external sub-skill), New Design System Workflow, ui-styling (external sub-skill)

### Community 88 - "Cabinet"
Cohesion: 0.11
Nodes (8): {closure#7}(), DrawerController, {closure#1}(), {closure#1}(), Drawer, BookFactory, CabinetFactory, DrawerFactory

### Community 89 - "Composer Package Metadata"
Cohesion: 0.17
Nodes (11): autoload-dev, psr-4, description, keywords, license, minimum-stability, name, prefer-stable (+3 more)

### Community 90 - "Token Usage Validator"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 91 - "slides-html-template.md"
Cohesion: 0.23
Nodes (9): 16:9 Slide Deck Base HTML Structure, Chart.js Integration, Slide CSS Variables (Design Tokens), Slide Navigation (showSlide/nextSlide/prevSlide), Slides Key Features, Slides Workflow, Slides (Built-in), SKILL.md (slides) (+1 more)

### Community 92 - "alert.tsx"
Cohesion: 0.50
Nodes (6): class-variance-authority, AlertError(), Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 93 - "tailwind-utilities.md"
Cohesion: 0.29
Nodes (6): Arbitrary Values ([...] syntax), Borders, Radius & Shadows, Color Scale (50-950) & Opacity Modifiers, Layout Utilities (Flexbox, Grid, Positioning, Z-Index), Spacing Scale (padding, margin, space-between), Typography Utilities

### Community 94 - "Canvas Design Philosophy"
Cohesion: 0.20
Nodes (6): Analog Meditation (design movement), Chromatic Language (design movement), Concrete Poetry (design movement), Geometric Silence (design movement), Multi-Page Design Systems, Organic Systems (design movement)

### Community 96 - "ilocos-norte-map.tsx"
Cohesion: 0.13
Nodes (15): @visx/geo, DetailCell(), IlocosNorteMapProps, LguRow, lguRows, LOT_BUCKETS, provinceOutline, provinceTotals (+7 more)

### Community 98 - "Composer Dev Dependencies"
Cohesion: 0.20
Nodes (10): require-dev, fakerphp/faker, larastan/larastan, laravel/pail, laravel/pao, laravel/pint, laravel/sail, mockery/mockery (+2 more)

### Community 99 - "_palette_is_dark"
Cohesion: 0.18
Nodes (4): _palette_is_dark(), _relative_luminance(), TestEndToEndCoherence, TestLuminance

### Community 100 - "Motion Duration Tokens"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 101 - "shadcn Theming Docs"
Cohesion: 0.29
Nodes (7): Base Color Presets (Slate, Gray, Zinc, Neutral, Stone), shadcn CSS Variable System (globals.css :root/.dark), Multiple Themes via data-theme Attributes, Dark Mode via next-themes ThemeProvider, Global --radius Variable, Style Variants (Default / New York, components.json), ThemeToggle Component

### Community 102 - "Tailwind Responsive Docs"
Cohesion: 0.25
Nodes (8): Intentional OKLCH Color Palette (2-5 colors), @theme Directive (CSS-based design tokens), Breakpoint System (sm 640 – 2xl 1536), Container Queries (@container), Custom Breakpoints (--breakpoint-3xl, --breakpoint-tablet), Max-Width & Range Queries (max-*:), Mobile-First Breakpoint Approach, Responsive Testing Checklist (320-1280px, 44x44 touch targets)

### Community 103 - "read_rows"
Cohesion: 0.19
Nodes (3): read_rows(), TestLandingAndStackContract, TestReasoningContract

### Community 105 - "input"
Cohesion: 0.29
Nodes (8): padding-x, input, $type, $value, focus-ring, padding-x, $type, $value

### Community 106 - "slides-copywriting-formulas.md"
Cohesion: 0.19
Nodes (10): AIDA (Attention-Interest-Desire-Action), Before-After-Bridge, Cost of Inaction, FAB (Features-Advantages-Benefits), Formula-to-Slide Mapping, Headline Patterns, PAS (Problem-Agitate-Solution), Sales Pitch Deck (+2 more)

### Community 107 - "Composer Requirements"
Cohesion: 0.25
Nodes (8): require, inertiajs/inertia-laravel, laravel/chisel, laravel/fortify, laravel/framework, laravel/tinker, laravel/wayfinder, php

### Community 110 - "xl"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 112 - "Optional Native Binaries"
Cohesion: 0.25
Nodes (8): optionalDependencies, @laravel/multiplex, lightningcss-linux-x64-gnu, lightningcss-win32-x64-msvc, @rollup/rollup-linux-x64-gnu, @rollup/rollup-win32-x64-msvc, @tailwindcss/oxide-linux-x64-gnu, @tailwindcss/oxide-win32-x64-msvc

### Community 113 - "DocumentController.php"
Cohesion: 0.10
Nodes (7): ArchiveController, {closure#3}(), {closure#2}(), {closure#5}(), {closure#8}(), DocumentController, Document

### Community 114 - "Composer Config"
Cohesion: 0.29
Nodes (7): pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, preferred-install, sort-packages

### Community 115 - "ring"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 118 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 119 - "CI Workflow"
Cohesion: 0.33
Nodes (5): CI Job (ubuntu-latest, push main / pull_request), composer ci:check, composer setup, Node 22 (setup-node), PHP 8.3 + Composer v2 (setup-php)

### Community 120 - "npm Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, build:ssr, check, check:fix, dev, types:check

### Community 124 - "Cabinet"
Cohesion: 0.14
Nodes (10): {closure#2}(), {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#6}(), Cabinet, {closure#1}() (+2 more)

### Community 127 - "npm Dev Dependencies"
Cohesion: 0.33
Nodes (6): devDependencies, babel-plugin-react-compiler, @laravel/vite-plugin-wayfinder, @rolldown/plugin-babel, @types/node, vite-plus

### Community 128 - "Bagong Pilipinas Emblems"
Cohesion: 0.33
Nodes (4): Bagong Pilipinas (Philippine Government Brand), Bagong Pilipinas (Philippine Government Brand), Philippine Flag Sun and Three Stars, Philippine Flag Sun and Three Stars

### Community 129 - "Ilocos Norte Seal"
Cohesion: 0.33
Nodes (5): Rice and Garlic Agricultural Symbols, Baroque Church Facade (likely Paoay Church), Founding Year 1818, Province of Ilocos Norte, Wind Turbines (Bangui Windmills)

### Community 130 - "cip-deliverable-guide.md"
Cohesion: 0.33
Nodes (6): Core Identity Deliverables, Digital Assets, Office Environment Signage, Stationery Set, Vehicle Branding, CIP Deliverable Categories

### Community 131 - "PSR-4 Autoload"
Cohesion: 0.40
Nodes (5): autoload, psr-4, App\\, Database\\Factories\\, Database\\Seeders\\

### Community 132 - "Laravel Extra Config"
Cohesion: 0.40
Nodes (5): extra, laravel, post-create-project, dont-discover, installer

### Community 135 - "_select_palette_for_mode"
Cohesion: 0.22
Nodes (4): _contrast_ratio(), _derive_dark_palette(), _select_palette_for_mode(), TestPaletteSelection

### Community 137 - "$type"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 138 - "read_rows"
Cohesion: 0.13
Nodes (11): read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _check_typography_contract(), _configured_font_names(), contrast_ratio() (+3 more)

### Community 140 - "Login Cover Art"
Cohesion: 0.50
Nodes (3): Dark Neutral Palette (#171717 / #fafafa), Diagonal Line Pattern, Login Page

### Community 144 - "radius"
Cohesion: 0.60
Nodes (5): radius, radius, radius, $type, $value

### Community 145 - "lg"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 158 - "messaging-framework.md"
Cohesion: 0.33
Nodes (5): Elevator Pitches (10/30/60s), Message Testing, Messaging Framework Hierarchy, Positioning Statement, Value Proposition Template

### Community 159 - "sm"
Cohesion: 0.60
Nodes (5): sm, sm, sm, $type, $value

### Community 162 - "padding-y"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 165 - "breadcrumbs.tsx"
Cohesion: 0.35
Nodes (10): BreadcrumbLink, render={<Link />}, Breadcrumbs(), Breadcrumb(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList() (+2 more)

### Community 166 - "16"
Cohesion: 0.67
Nodes (3): $type, $value, 16

### Community 167 - "1"
Cohesion: 0.67
Nodes (3): $type, $value, 1

### Community 168 - "3"
Cohesion: 0.67
Nodes (3): $type, $value, 3

### Community 169 - "8"
Cohesion: 0.67
Nodes (3): $type, $value, 8

### Community 170 - "destructive"
Cohesion: 0.67
Nodes (3): destructive, $type, $value

### Community 171 - "destructive-foreground"
Cohesion: 0.67
Nodes (3): destructive-foreground, $type, $value

### Community 172 - "muted"
Cohesion: 0.67
Nodes (3): muted, $type, $value

### Community 173 - "primary-foreground"
Cohesion: 0.67
Nodes (3): primary-foreground, $type, $value

### Community 174 - "secondary-foreground"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

### Community 178 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, base, iconLibrary (+10 more)

### Community 179 - "AppLogoIcon"
Cohesion: 0.42
Nodes (4): AppLogoIcon(), AuthSimpleLayout(), AuthSplitLayout(), AuthLayoutProps

### Community 180 - "slides-layout-patterns.md"
Cohesion: 0.40
Nodes (4): search-slides.py (design-system), Slide Animation Classes, Slide Card & Metric Variants, Layout Selection by Use Case

### Community 181 - "split_values"
Cohesion: 0.47
Nodes (3): split_values(), style_identities(), TestStyleIdentityContract

## Ambiguous Edges - Review These
- `MIT License (frontmatter)` → `Apache License 2.0`  [AMBIGUOUS]
  .github/prompts/ui-styling/SKILL.md · relation: conceptually_related_to
- `shadcn CLI (npx shadcn@latest init/add)` → `requirements.txt`  [AMBIGUOUS]
  .github/prompts/ui-styling/scripts/requirements.txt · relation: references
- `Node 22 (setup-node)` → `Node.js 18+ Requirement`  [AMBIGUOUS]
  .github/workflows/tests.yml · relation: conceptually_related_to
- `logo.png` → `Baroque Church Facade (likely Paoay Church)`  [AMBIGUOUS]
  public/logo.png · relation: references

## Knowledge Gaps
- **103 isolated node(s):** `@types/react`, `@types/react-dom`, `concurrently`, `tailwindcss`, `tw-animate-css` (+98 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1095 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SKILL.md (design-system)` connect `SKILL.md (design-system)` to `Token Architecture Layers`, `Brand Context Sync`, `component-tokens.md`, `Token Usage Validator`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/react`, `@types/react-dom`, `concurrently` to the rest of the system?**
  _103 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ShadcnInstaller` be split into smaller, more focused modules?**
  _Cohesion score 0.053555750658472345 - nodes in this community are weakly interconnected._
- **Why does `SKILL.md (brand)` connect `Brand Context Sync` to `Brand Asset Validator`, `SKILL.md (design-system)`, `Brand Accessibility Checklists`, `Brand Typography & Voice`, `Token Architecture Layers`, `Brand Asset Organization`, `Brand Color Extraction Scripts`, `messaging-framework.md`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `MIT License (frontmatter)` and `Apache License 2.0`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `shadcn CLI (npx shadcn@latest init/add)` and `requirements.txt`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._