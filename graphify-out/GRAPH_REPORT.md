# Graph Report - dtms  (2026-10-26)

## Corpus Check
- 351 files · ~372,126 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 74 file(s) not represented in the graph (top: .csv 53, (none) 16, .example 1)

## Summary
- 3112 nodes · 6650 edges · 183 communities (134 shown, 49 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 332 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e8ff9cb9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ShadcnInstaller
- scripts/core.py
- navigation-menu.tsx
- document-upload-dialog.tsx
- filing-cabinet.tsx
- gray
- TestBm25CoreBehavior
- DocumentSearchTest
- card
- slide_search_core.py
- cabinets/index.tsx
- component-tokens.md
- Database Migrations
- re
- app-header.tsx
- use-appearance.tsx
- dropdown-menu.tsx
- react
- Brand Context Sync
- Spacing Scale Tokens
- pdf-thumbnail.tsx
- lucide-react
- components.json
- Semantic Color Tokens
- HTML Token Validator
- generate-slide.py
- Illuminate\Http\RedirectResponse
- sidebar.tsx
- Book
- Brand Color Extraction Scripts
- TestCase
- open-book.tsx
- design/references/banner-sizes-and-styles.md
- design_system.py
- SKILL.md (design)
- package.json Metadata
- npm Dependencies
- CabinetsTest
- radius
- sidebar.tsx
- Banner Design Skill
- SKILL.md (design-system)
- cip/generate.py
- json
- shadcn Component & A11y Docs
- Tailwind Config Gen Tests
- ui-styling/SKILL.md
- Laravel Service Providers
- PasswordValidationRules
- Inertia Middleware & Fortify
- Brand Accessibility Checklists
- validate_data.py
- TestSearchDomains
- render-html.py
- Brand Typography & Voice
- Token Architecture Layers
- Brand Asset Organization
- Font Size Tokens
- react
- UI/UX Pro Max Skill
- TypeScript Config
- test_core_data_quality.py
- UserFactory.php
- _palette_is_dark
- Catalog Refresh Tests
- Inertia\Testing\AssertableInertia
- index.ts
- toggle-group.tsx
- User
- Brand Asset Validator
- cip/core.py
- logo-design.md
- Web Stack Freshness Tests
- Composer Scripts
- Design Tokens Starter Structure
- Generated Config JS Tests
- button
- TestDomainDetection
- read_rows
- lucide-react
- Email Verification Tests
- BM25
- TDAMS Branding Assets
- tailwind-customization.md
- Routing by Task Type
- Cabinet
- Composer Package Metadata
- Token Usage Validator
- SKILL.md (slides)
- BM25
- tailwind-utilities.md
- Canvas Design Philosophy
- ilocos-norte-map.tsx
- Composer Dev Dependencies
- DesignSystemGenerator
- Motion Duration Tokens
- shadcn Theming Docs
- Tailwind Responsive Docs
- TestNativeDesktopStackFreshness
- input
- slides-copywriting-formulas.md
- Composer Requirements
- Config Validation Tests
- xl
- test_data_contracts.py
- Optional Native Binaries
- DocumentController.php
- Composer Config
- ring
- auth.ts
- none
- CI Workflow
- npm Scripts
- Password Reset Tests
- Document Upload Tests
- ArchiveTest
- pathlib
- AppLogoIcon
- OpenBook
- npm Dev Dependencies
- Bagong Pilipinas Emblems
- Ilocos Norte Seal
- test_design_system_mode.py
- PSR-4 Autoload
- Laravel Extra Config
- _select_palette_for_mode
- TestStyleTaxonomy
- apple-touch-icon.png
- $type
- cabinet-drawer.tsx
- logo/search.py
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
- icon.tsx
- cabinets.ts
- padding-y
- test_native_desktop_stack_freshness.py
- placeholder-pattern.tsx
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
- test_relevance_evaluator.py
- AuthenticationTest
- book-world-pose.ts
- TestTokenizer
- split_values
- DrawerRenameRow
- Transformation Engine

## God Nodes (most connected - your core abstractions)
1. `cn()` - 152 edges
2. `react` - 78 edges
3. `Button()` - 75 edges
4. `TailwindConfigGenerator` - 58 edges
5. `lucide-react` - 50 edges
6. `@inertiajs/react` - 48 edges
7. `Input()` - 42 edges
8. `InputError()` - 40 edges
9. `TestCase` - 39 edges
10. `TestTailwindConfigGenerator` - 35 edges

## Surprising Connections (you probably didn't know these)
- `ui-ux-pro-max Skill` --semantically_similar_to--> `UI Styling Skill`  [INFERRED] [semantically similar]
  .github/skills/ui-ux-pro-max/SKILL.md → .github/prompts/ui-styling/SKILL.md
- `Button Component Classes (@apply)` --semantically_similar_to--> `Button Tokens`  [INFERRED] [semantically similar]
  .github/prompts/design-system/references/tailwind-integration.md → .github/prompts/design-system/references/component-tokens.md
- `Banner Output Path Convention` --semantically_similar_to--> `Asset Naming Convention`  [INFERRED] [semantically similar]
  .github/prompts/banner-design/SKILL.md → .github/prompts/brand/references/asset-organization.md
- `Token Compliance Rule` --semantically_similar_to--> `Brand Color Compliance Validation`  [INFERRED] [semantically similar]
  .github/prompts/design-system/SKILL.md → .github/prompts/brand/references/color-palette-management.md
- `MIT License (frontmatter)` --conceptually_related_to--> `Apache License 2.0`  [AMBIGUOUS]
  .github/prompts/ui-styling/SKILL.md → .github/prompts/ui-styling/LICENSE.txt

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

## Communities (183 total, 49 thin omitted)

### Community 0 - "ShadcnInstaller"
Cohesion: 0.05
Nodes (3): main(), ShadcnInstaller, TestShadcnInstaller

### Community 1 - "scripts/core.py"
Cohesion: 0.06
Nodes (31): BM25, _contains_phrase(), detect_domain(), _domain_keywords(), _exact_match_diagnostic(), _exact_row_identity(), _exact_stack_identifier(), _file_signature() (+23 more)

### Community 2 - "navigation-menu.tsx"
Cohesion: 0.16
Nodes (16): Base UI NavigationMenu, data-popup-open attribute, 50ms hover open delay, NavigationMenuIndicator, --positioner-height / --positioner-width, viewport boolean wrapper prop, data-popup-open on menu buttons, NavigationMenu() (+8 more)

### Community 3 - "document-upload-dialog.tsx"
Cohesion: 0.16
Nodes (24): Dialog Backdrop and Popup, Opacity and scale transitions, DeleteUser(), Heading(), EmptyState(), ManagePasskeys(), Props, PasskeyItem() (+16 more)

### Community 4 - "filing-cabinet.tsx"
Cohesion: 0.14
Nodes (14): CLOSEUP, CLOSEUP_FROM, CLOSEUP_TO, closeupPose(), DRAWER_TRAVEL, Face(), FADE, FilingCabinet() (+6 more)

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
Nodes (36): DrawerIcon, Props, TwoFactorRecoveryCodes(), Badge(), badgeVariants, Card(), CardContent(), CardDescription() (+28 more)

### Community 11 - "component-tokens.md"
Cohesion: 0.07
Nodes (32): Alert Spec, Badge Spec, Button Spec, Card Spec, Dialog Spec, Input Spec, Table Spec, Alert Tokens (+24 more)

### Community 12 - "Database Migrations"
Cohesion: 0.05
Nodes (23): {closure#1}(), {closure#2}(), {closure#3}(), {closure#1}(), {closure#2}(), {closure#1}(), {closure#2}(), {closure#3}() (+15 more)

### Community 13 - "re"
Cohesion: 0.09
Nodes (17): gemini-3.1-pro-preview, 12 Icon Categories, 15 Icon Styles, apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon() (+9 more)

### Community 14 - "app-header.tsx"
Cohesion: 0.14
Nodes (18): @base-ui/react/avatar, mainNavItems, Props, rightNavItems, AppLogo(), Avatar(), AvatarFallback(), AvatarImage() (+10 more)

### Community 15 - "use-appearance.tsx"
Cohesion: 0.13
Nodes (24): Base UI Tooltip, delay prop (formerly delayDuration), withApp(), Toaster(), TooltipContent(), TooltipProvider(), TooltipTrigger(), Appearance (+16 more)

### Community 16 - "dropdown-menu.tsx"
Cohesion: 0.11
Nodes (27): AppSidebarHeader(), NavUser(), DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuGroup(), DropdownMenuItem(), DropdownMenuLabel() (+19 more)

### Community 17 - "react"
Cohesion: 0.08
Nodes (49): ClientOnly(), PdfPreviewProps, resolvedComponents, useClientComponent(), DeclarationNumberSearch(), DeclarationNumberSearchProps, chainArrowDots(), chainArrowHead() (+41 more)

### Community 18 - "Brand Context Sync"
Cohesion: 0.10
Nodes (27): Brand Guidelines Document Structure, Extractable Brand Fields, Brand Color Presets, /brand:update Command, Core Visual Elements, Visual Guidelines Template, extractColorsFromTable(), extractCoreAttributes() (+19 more)

### Community 19 - "Spacing Scale Tokens"
Cohesion: 0.09
Nodes (22): $type, $value, $type, $value, $type, $value, $type, $value (+14 more)

### Community 20 - "pdf-thumbnail.tsx"
Cohesion: 0.26
Nodes (13): react-pdf, acquireThumbnailSlot(), cacheRenderedThumbnail(), getCachedThumbnail(), JPEG_QUALITY, releaseThumbnailSlot(), thumbnailCacheKey(), thumbnailObjectUrls (+5 more)

### Community 21 - "lucide-react"
Cohesion: 0.12
Nodes (29): Select(), SelectContent(), SelectItem(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger(), SelectValue() (+21 more)

### Community 22 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, base, iconLibrary (+10 more)

### Community 23 - "Semantic Color Tokens"
Cohesion: 0.11
Nodes (19): $type, $value, background, foreground, muted-foreground, primary, primary-hover, secondary (+11 more)

### Community 24 - "HTML Token Validator"
Cohesion: 0.13
Nodes (12): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+4 more)

### Community 25 - "generate-slide.py"
Cohesion: 0.13
Nodes (11): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+3 more)

### Community 26 - "Illuminate\Http\RedirectResponse"
Cohesion: 0.09
Nodes (6): BookController, CabinetController, Controller, DrawerController, ProfileController, SecurityController

### Community 27 - "sidebar.tsx"
Cohesion: 0.11
Nodes (24): Collapsible Panel (formerly Content), accountNavItems, AppSidebar(), mainNavItems, NavFooter(), CollapsibleNavItem(), NavMain(), Collapsible() (+16 more)

### Community 28 - "Book"
Cohesion: 0.12
Nodes (12): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#3}(), {closure#5}(), {closure#7}(), {closure#8}() (+4 more)

### Community 29 - "Brand Color Extraction Scripts"
Cohesion: 0.10
Nodes (19): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+11 more)

### Community 30 - "TestCase"
Cohesion: 0.09
Nodes (10): {closure#1}(), PasswordConfirmationTest, RegistrationTest, BookmarksTest, {closure#1}(), DashboardTest, ExampleTest, ProfileUpdateTest (+2 more)

### Community 31 - "open-book.tsx"
Cohesion: 0.11
Nodes (18): BACKDROP, BookPhase, COVER_CLOSE, DetailRow(), DocumentDetails(), FADE, FLIP, FlyerOuterAnimate (+10 more)

### Community 32 - "design/references/banner-sizes-and-styles.md"
Cohesion: 0.12
Nodes (14): 22 Art Direction Styles, Google Display Network Ad Sizes, Pinterest Research Queries, Print Specs, Social Art Direction Styles (Reuse from Banner), Social Platform Sizes, Screenshot Export (Chrome Headless / Playwright / Puppeteer), Social Photos 8-Step Workflow (+6 more)

### Community 33 - "design_system.py"
Cohesion: 0.06
Nodes (16): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides() (+8 more)

### Community 34 - "SKILL.md (design)"
Cohesion: 0.11
Nodes (19): Core Identity Deliverables, Digital Assets, Office Environment Signage, Stationery Set, Vehicle Branding, CIP Deliverable Categories, Gemini Flash/Pro Image Models, CIP Mockup Base Prompt Structure (+11 more)

### Community 35 - "package.json Metadata"
Cohesion: 0.08
Nodes (28): private, $schema, type, babel-plugin-react-compiler, clsx, concurrently, @inertiajs/vite, @laravel/multiplex (+20 more)

### Community 36 - "npm Dependencies"
Cohesion: 0.08
Nodes (26): dependencies, @base-ui/react, class-variance-authority, clsx, concurrently, @inertiajs/react, @inertiajs/vite, input-otp (+18 more)

### Community 38 - "radius"
Cohesion: 0.19
Nodes (14): $type, $value, $type, $value, $type, $value, primitive, radius (+6 more)

### Community 39 - "sidebar.tsx"
Cohesion: 0.12
Nodes (22): @base-ui/react/separator, decorative prop dropped, Per-side translate transitions, @base-ui/react, AppHeader(), Sheet(), SheetContent(), SheetDescription() (+14 more)

### Community 40 - "Banner Design Skill"
Cohesion: 0.15
Nodes (15): 22 Art Direction Styles, Pinterest Research Queries, Platform Banner Sizes, Print Specs, SKILL.md (banner-design), ai-artist Skill, ai-multimodal Skill, AI Visual Generation (Gemini Flash / Pro) (+7 more)

### Community 41 - "SKILL.md (design-system)"
Cohesion: 0.16
Nodes (16): assets/design-tokens.css, flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path (+8 more)

### Community 42 - "cip/generate.py"
Cohesion: 0.15
Nodes (7): CIP Workflow, build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana(), load_env(), load_logo_image()

### Community 43 - "json"
Cohesion: 0.16
Nodes (9): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+1 more)

### Community 45 - "shadcn Component & A11y Docs"
Cohesion: 0.12
Nodes (18): @axe-core/react Automated Testing, Focus Management (focus trap, focus-visible rings), Form Accessibility (labels, aria-invalid, error association), Keyboard Navigation Patterns, ARIA Live Regions, prefers-reduced-motion Support, Screen Reader Support (ARIA labels, sr-only), WCAG Color Contrast (AA 4.5:1 / AAA 7:1) (+10 more)

### Community 47 - "ui-styling/SKILL.md"
Cohesion: 0.23
Nodes (8): WAI-ARIA Design Patterns, Canvas Visual Design Layer, MIT License (frontmatter), Radix UI, shadcn CLI (npx shadcn@latest init/add), shadcn/ui, Tailwind CSS, UI Styling Skill

### Community 48 - "Laravel Service Providers"
Cohesion: 0.15
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
Nodes (34): TestGeneratedCatalogContract, _catalog_date(), _check_app_interface_contract(), _check_catalog_contract(), _check_catalog_summary(), _check_chart_contract(), _check_color_contract(), _check_core_data_contract() (+26 more)

### Community 54 - "render-html.py"
Cohesion: 0.23
Nodes (5): CIP HTML Presentation, generate_html(), get_deliverable_info(), get_image_base64(), main()

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

### Community 60 - "react"
Cohesion: 0.07
Nodes (46): @inertiajs/react, @laravel/passkeys, lucide-react, react, sonner, DrawerIconProps, InputError(), PasskeyRegistration() (+38 more)

### Community 61 - "UI/UX Pro Max Skill"
Cohesion: 0.22
Nodes (12): Available Stacks (react, shadcn, html-tailwind, laravel, ...), Design Dials (--variance, --motion, --density), Design System Generation (--design-system), GSAP Animation Presets (gsap domain), Light/Dark Mode Contrast & Token-Driven Theming, Phosphor Icons Default (Heroicons fallback), Pre-Delivery Checklist (App UI), Search Domains (product, style, color, typography, ux, chart, ...) (+4 more)

### Community 62 - "TypeScript Config"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, module, moduleResolution (+7 more)

### Community 63 - "test_core_data_quality.py"
Cohesion: 0.15
Nodes (10): read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _check_typography_contract(), _configured_font_names(), _declared_weights() (+2 more)

### Community 65 - "_palette_is_dark"
Cohesion: 0.18
Nodes (4): _palette_is_dark(), _relative_luminance(), TestEndToEndCoherence, TestLuminance

### Community 67 - "Inertia\Testing\AssertableInertia"
Cohesion: 0.13
Nodes (21): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#1}(), {closure#10}(), {closure#2}(), {closure#3}() (+13 more)

### Community 68 - "index.ts"
Cohesion: 0.22
Nodes (12): AppContent(), Props, AppShell(), Props, SidebarInset(), SidebarProvider(), AppHeaderLayout(), AppSidebarLayout() (+4 more)

### Community 69 - "toggle-group.tsx"
Cohesion: 0.24
Nodes (11): @base-ui/react/toggle, data-pressed attribute, @base-ui/react/toggle-group, multiple boolean (replaces type), toggleVariants, class-variance-authority, ToggleGroup(), ToggleGroupContext (+3 more)

### Community 71 - "Brand Asset Validator"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 72 - "cip/core.py"
Cohesion: 0.10
Nodes (11): detect_domain(), get_cip_brief(), _load_csv(), search(), search_all(), _search_csv(), detect_domain(), _load_csv() (+3 more)

### Community 73 - "logo-design.md"
Cohesion: 0.17
Nodes (11): CIP Color Psychology, Color Harmony Types, Color Combinations by Industry, Primary Color Meanings, Logo Industry Defaults, Logo Style Categories (55+), Logo Workflow, Core Logo Types (Wordmark, Lettermark, Pictorial, Abstract, Mascot, Emblem, Combination) (+3 more)

### Community 75 - "Composer Scripts"
Cohesion: 0.15
Nodes (13): scripts, ci:check, dev, lint, lint:check, post-autoload-dump, post-create-project-cmd, post-root-package-install (+5 more)

### Community 77 - "Design Tokens Starter Structure"
Cohesion: 0.15
Nodes (12): component, $type, $value, dark, semantic, $schema, $type, $value (+4 more)

### Community 79 - "button"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 81 - "read_rows"
Cohesion: 0.19
Nodes (3): read_rows(), TestLandingAndStackContract, TestReasoningContract

### Community 82 - "lucide-react"
Cohesion: 0.10
Nodes (18): input-otp, ManageTwoFactor(), Props, GridScanIcon(), Props, TwoFactorVerificationStep(), InputOTP, InputOTPGroup (+10 more)

### Community 85 - "TDAMS Branding Assets"
Cohesion: 0.17
Nodes (10): Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System), Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System) (+2 more)

### Community 86 - "tailwind-customization.md"
Cohesion: 0.25
Nodes (8): @apply Directive, Custom Utilities (@utility), Custom Variants (@custom-variant), Dark Mode Configuration (darkMode class/media), Layer Organization (@layer base/components/utilities), Tailwind Plugins (typography, forms, container-queries, custom), Content Configuration & Safelist, Complete tailwind.config.ts

### Community 87 - "Routing by Task Type"
Cohesion: 0.29
Nodes (6): Multi-Skill Workflows, brand (external sub-skill), Complete Brand Package Workflow, design-system (external sub-skill), New Design System Workflow, ui-styling (external sub-skill)

### Community 88 - "Cabinet"
Cohesion: 0.09
Nodes (14): {closure#2}(), {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#6}(), Cabinet, {closure#1}() (+6 more)

### Community 89 - "Composer Package Metadata"
Cohesion: 0.17
Nodes (11): autoload-dev, psr-4, description, keywords, license, minimum-stability, name, prefer-stable (+3 more)

### Community 90 - "Token Usage Validator"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 91 - "SKILL.md (slides)"
Cohesion: 0.16
Nodes (13): search-slides.py (design-system), Slide Animation Classes, 16:9 Slide Deck Base HTML Structure, Chart.js Integration, Slide CSS Variables (Design Tokens), Slide Navigation (showSlide/nextSlide/prevSlide), Slides Key Features, Slide Card & Metric Variants (+5 more)

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

### Community 99 - "DesignSystemGenerator"
Cohesion: 0.11
Nodes (3): DesignSystemGenerator, _resolve_dial(), TestReasoningMatch

### Community 100 - "Motion Duration Tokens"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 101 - "shadcn Theming Docs"
Cohesion: 0.29
Nodes (7): Base Color Presets (Slate, Gray, Zinc, Neutral, Stone), shadcn CSS Variable System (globals.css :root/.dark), Multiple Themes via data-theme Attributes, Dark Mode via next-themes ThemeProvider, Global --radius Variable, Style Variants (Default / New York, components.json), ThemeToggle Component

### Community 102 - "Tailwind Responsive Docs"
Cohesion: 0.25
Nodes (8): Intentional OKLCH Color Palette (2-5 colors), @theme Directive (CSS-based design tokens), Breakpoint System (sm 640 – 2xl 1536), Container Queries (@container), Custom Breakpoints (--breakpoint-3xl, --breakpoint-tablet), Max-Width & Range Queries (max-*:), Mobile-First Breakpoint Approach, Responsive Testing Checklist (320-1280px, 44x44 touch targets)

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

### Community 111 - "test_data_contracts.py"
Cohesion: 0.20
Nodes (4): apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), _validate_action()

### Community 112 - "Optional Native Binaries"
Cohesion: 0.25
Nodes (8): optionalDependencies, @laravel/multiplex, lightningcss-linux-x64-gnu, lightningcss-win32-x64-msvc, @rollup/rollup-linux-x64-gnu, @rollup/rollup-win32-x64-msvc, @tailwindcss/oxide-linux-x64-gnu, @tailwindcss/oxide-win32-x64-msvc

### Community 113 - "DocumentController.php"
Cohesion: 0.13
Nodes (5): ArchiveController, {closure#3}(), {closure#2}(), DocumentController, Document

### Community 114 - "Composer Config"
Cohesion: 0.29
Nodes (7): pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, preferred-install, sort-packages

### Community 115 - "ring"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 116 - "auth.ts"
Cohesion: 0.24
Nodes (8): Auth, TwoFactorSecretKey, TwoFactorSetupData, User, InertiaConfig, @inertiajs/core, InputHTMLAttributes, react

### Community 118 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 119 - "CI Workflow"
Cohesion: 0.33
Nodes (5): CI Job (ubuntu-latest, push main / pull_request), composer ci:check, composer setup, Node 22 (setup-node), PHP 8.3 + Composer v2 (setup-php)

### Community 120 - "npm Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, build:ssr, check, check:fix, dev, types:check

### Community 121 - "Password Reset Tests"
Cohesion: 0.08
Nodes (4): PasswordResetTest, {closure#1}(), TwoFactorChallengeTest, VerificationNotificationTest

### Community 124 - "pathlib"
Cohesion: 0.08
Nodes (14): test_sync_parses_bundled_starter_template(), main(), format_brief(), format_results(), main(), main(), _run(), test_flags_hardcoded_hex_sharing_line_with_token() (+6 more)

### Community 125 - "AppLogoIcon"
Cohesion: 0.39
Nodes (5): AppLogoIcon(), AuthSimpleLayout(), AuthSplitLayout(), AuthLayout(), AuthLayoutProps

### Community 126 - "OpenBook"
Cohesion: 0.17
Nodes (15): BookFlyer, BookPage(), EmptyDocuments(), flyerOuterMotion(), insertLift(), isReturnOuterAnimate(), liftPose(), OpenBook() (+7 more)

### Community 127 - "npm Dev Dependencies"
Cohesion: 0.33
Nodes (6): devDependencies, babel-plugin-react-compiler, @laravel/vite-plugin-wayfinder, @rolldown/plugin-babel, @types/node, vite-plus

### Community 128 - "Bagong Pilipinas Emblems"
Cohesion: 0.33
Nodes (4): Bagong Pilipinas (Philippine Government Brand), Bagong Pilipinas (Philippine Government Brand), Philippine Flag Sun and Three Stars, Philippine Flag Sun and Three Stars

### Community 129 - "Ilocos Norte Seal"
Cohesion: 0.33
Nodes (5): Rice and Garlic Agricultural Symbols, Baroque Church Facade (likely Paoay Church), Founding Year 1818, Province of Ilocos Norte, Wind Turbines (Bangui Windmills)

### Community 130 - "test_design_system_mode.py"
Cohesion: 0.14
Nodes (6): _filter_anti_patterns_for_mode(), _query_wants_dark(), _resolve_color_mode(), _style_is_dark_primary(), TestAntiPatternGating, TestModeResolution

### Community 131 - "PSR-4 Autoload"
Cohesion: 0.40
Nodes (5): autoload, psr-4, App\\, Database\\Factories\\, Database\\Seeders\\

### Community 132 - "Laravel Extra Config"
Cohesion: 0.40
Nodes (5): extra, laravel, post-create-project, dont-discover, installer

### Community 134 - "_select_palette_for_mode"
Cohesion: 0.22
Nodes (4): _contrast_ratio(), _derive_dark_palette(), _select_palette_for_mode(), TestPaletteSelection

### Community 137 - "$type"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 138 - "cabinet-drawer.tsx"
Cohesion: 0.17
Nodes (14): motion, react-dom, BookPortalContext, BookPortalValue, useBookPortal(), measureHoverAndRestPose(), BOOK_POP, CabinetDrawer() (+6 more)

### Community 139 - "logo/search.py"
Cohesion: 0.22
Nodes (4): CIP BM25 Search Engine (core.py), Logo BM25 Search Engine (core.py), format_output(), generate_design_brief()

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

### Community 161 - "cabinets.ts"
Cohesion: 0.11
Nodes (24): Non-primitive wrappers (alert, card, input, skeleton, spinner), AlertError(), AppearanceToggleTab(), Alert(), AlertDescription(), AlertTitle(), alertVariants, CardFooter() (+16 more)

### Community 162 - "padding-y"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 163 - "test_native_desktop_stack_freshness.py"
Cohesion: 0.11
Nodes (3): read_rows(), TestTextLayoutDataContracts, TestTextLayoutRetrieval

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

### Community 175 - "test_relevance_evaluator.py"
Cohesion: 0.12
Nodes (3): TestFixtureValidation, TestMetricMath, TestThresholdGate

### Community 177 - "book-world-pose.ts"
Cohesion: 0.19
Nodes (16): BoxQuadElement, cumulativeFromOffsetParents(), cumulativeTransform(), decompose(), findPerspectiveRoot(), FlyerPose, matrixFromBoxQuads(), measureLiftedSlotPose() (+8 more)

### Community 179 - "split_values"
Cohesion: 0.47
Nodes (3): split_values(), style_identities(), TestStyleIdentityContract

### Community 180 - "DrawerRenameRow"
Cohesion: 0.67
Nodes (3): DrawerRenameRow(), save(), stopEditing()

### Community 181 - "Transformation Engine"
Cohesion: 0.11
Nodes (17): Radix Slot, @base-ui/react/button, buttonVariants, @base-ui/react/checkbox, data-checked attribute, --anchor-width CSS variable, @base-ui/react/menu, closeOnClick defaults to false (+9 more)

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1111 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SKILL.md (design-system)` connect `SKILL.md (design-system)` to `Token Architecture Layers`, `Brand Context Sync`, `component-tokens.md`, `Token Usage Validator`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/react`, `@types/react-dom`, `concurrently` to the rest of the system?**
  _103 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ShadcnInstaller` be split into smaller, more focused modules?**
  _Cohesion score 0.053555750658472345 - nodes in this community are weakly interconnected._
- **Why does `SKILL.md (brand)` connect `Brand Context Sync` to `Brand Asset Validator`, `SKILL.md (design-system)`, `Brand Accessibility Checklists`, `Brand Typography & Voice`, `Token Architecture Layers`, `Brand Asset Organization`, `Brand Color Extraction Scripts`, `messaging-framework.md`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `MIT License (frontmatter)` and `Apache License 2.0`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `shadcn CLI (npx shadcn@latest init/add)` and `requirements.txt`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._