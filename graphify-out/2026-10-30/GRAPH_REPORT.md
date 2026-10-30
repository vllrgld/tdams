# Graph Report - dtms  (2026-10-30)

## Corpus Check
- 356 files · ~254,769 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 48 file(s) not represented in the graph (top: (none) 16, .csv 16, .toml 4)

## Summary
- 3082 nodes · 6811 edges · 176 communities (125 shown, 51 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 326 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3c164848`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ShadcnInstaller
- app-sidebar.tsx
- app-header.tsx
- generate-slide.py
- PaddleOcrClient
- gray
- Button
- DocumentSearchTest
- card
- slide_search_core.py
- Illuminate\Http\RedirectResponse
- component-tokens.md
- Cabinet
- re
- SKILL.md (design)
- OcrDocument
- document-chain.tsx
- dropdown-menu.tsx
- Brand Context Sync
- Spacing Scale Tokens
- Transformation Engine
- document-viewer-dialog.tsx
- filing-cabinet.tsx
- Semantic Color Tokens
- HTML Token Validator
- cabinets.ts
- TaxDeclaration
- cip/generate.py
- @base-ui/react
- Brand Color Extraction Scripts
- TestCase
- open-book.tsx
- design/references/banner-sizes-and-styles.md
- @inertiajs/react
- User
- package.json Metadata
- npm Dependencies
- CabinetsTest
- radius
- logo-design.md
- Banner Design Skill
- SKILL.md (design-system)
- User
- csv
- shadcn-accessibility.md
- TestTailwindConfigGenerator
- archive/index.tsx
- Book
- PasswordValidationRules
- Inertia Middleware & Fortify
- Brand Accessibility Checklists
- sidebar.tsx
- login.tsx
- AppLogoIcon
- Brand Typography & Voice
- Token Architecture Layers
- Brand Asset Organization
- Font Size Tokens
- Drawer
- ilocos-norte-map.tsx
- app-sidebar-header.tsx
- TypeScript Config
- pathlib
- OcrSettingsTest
- document-upload-dialog.tsx
- slides-copywriting-formulas.md
- Inertia\Testing\AssertableInertia
- main.py
- Routing by Task Type
- button
- Brand Asset Validator
- cip/core.py
- DocumentUploadTest.php
- BM25
- Composer Scripts
- DocumentFieldMappingTest.php
- Design Tokens Starter Structure
- .generate_config_string
- pdf-thumbnail.tsx
- slides-html-template.md
- Email Verification Tests
- TDAMS Branding Assets
- ui-styling/SKILL.md
- TailwindConfigGenerator
- Composer Package Metadata
- Token Usage Validator
- messaging-framework.md
- canvas-design-system.md
- tailwind-utilities.md
- tailwind-customization.md
- Composer Dev Dependencies
- Motion Duration Tokens
- shadcn-theming.md
- tailwind-responsive.md
- book-world-pose.ts
- DocumentFields
- input
- Composer Requirements
- BM25
- $type
- xl
- radius
- Optional Native Binaries
- DocumentController.php
- Composer Config
- lg
- auth.ts
- padding-y
- Product
- CI Workflow
- npm Scripts
- PasswordResetTest
- Document Upload Tests
- ArchiveTest
- 16
- use-appearance.tsx
- 1
- npm Dev Dependencies
- Bagong Pilipinas Emblems
- Ilocos Norte Seal
- 3
- PSR-4 Autoload
- Laravel Extra Config
- 1 GB Lightsail: FastAPI + Paddle OCR + compression
- 0001_01_01_000000_create_application_schema.php
- apple-touch-icon.png
- 8
- destructive
- muted
- Login Cover Art
- setup-ocr.sh
- Dependabot Config
- ring
- BM25
- pnpm Workspace
- Apache License
- robots.txt
- DocumentLinkingTest
- logo/search.py
- cip-deliverable-guide.md
- react
- OcrDocumentTest
- PdfRegionTests
- run.sh
- HeaderDocumentSearchTest
- SecurityTest
- sm
- setup.sh
- OcrDocumentTest.php
- destructive-foreground
- primary-foreground
- secondary-foreground
- OcrSetting
- none
- PaddleOcrClient

## God Nodes (most connected - your core abstractions)
1. `cn()` - 161 edges
2. `react` - 86 edges
3. `Button()` - 83 edges
4. `Document` - 65 edges
5. `TailwindConfigGenerator` - 58 edges
6. `@inertiajs/react` - 50 edges
7. `lucide-react` - 50 edges
8. `TestCase` - 49 edges
9. `InputError()` - 44 edges
10. `Input()` - 43 edges

## Surprising Connections (you probably didn't know these)
- `Button Component Classes (@apply)` --semantically_similar_to--> `Button Tokens`  [INFERRED] [semantically similar]
  .github/prompts/design-system/references/tailwind-integration.md → .github/prompts/design-system/references/component-tokens.md
- `{closure#1}()` --references--> `OcrDocument`  [EXTRACTED]
  tests/Feature/Documents/DocumentUploadTest.php → app/Jobs/OcrDocument.php
- `Banner Output Path Convention` --semantically_similar_to--> `Asset Naming Convention`  [INFERRED] [semantically similar]
  .github/prompts/banner-design/SKILL.md → .github/prompts/brand/references/asset-organization.md
- `Token Compliance Rule` --semantically_similar_to--> `Brand Color Compliance Validation`  [INFERRED] [semantically similar]
  .github/prompts/design-system/SKILL.md → .github/prompts/brand/references/color-palette-management.md
- `Multi-Skill Workflows` --semantically_similar_to--> `Complete Brand Package Workflow`  [INFERRED] [semantically similar]
  .github/prompts/design/references/design-routing.md → .github/prompts/design/SKILL.md

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
- **CSS-variable theming pipeline (globals.css vars → Tailwind config → dark mode toggle)** — github_prompts_ui_styling_references_shadcn_theming_css_variable_system, github_prompts_ui_styling_references_shadcn_theming_radius_variable, github_prompts_ui_styling_references_tailwind_customization_tailwind_config_ts, github_prompts_ui_styling_references_tailwind_customization_dark_mode_configuration, github_prompts_ui_styling_references_shadcn_theming_next_themes_dark_mode [INFERRED 0.85]
- **Dark Mode Theming via Semantic Overrides** — github_prompts_design_system_references_semantic_tokens_dark_mode_overrides, github_prompts_design_system_references_token_architecture_dark_mode_semantic_override, github_prompts_design_system_references_tailwind_integration_dark_mode_toggle, github_prompts_design_system_references_tailwind_integration_hsl_css_variables [INFERRED 0.85]
- **Radix data-state to Base UI data attributes** — migration_checkbox_data_checked, migration_toggle_data_pressed, migration_navigation_menu_data_popup_open, migration_sidebar_data_popup_open [INFERRED 0.85]
- **Primitive -> Semantic -> Component Token Cascade** — github_prompts_design_system_references_token_architecture_primitive_layer, github_prompts_design_system_references_token_architecture_semantic_layer, github_prompts_design_system_references_token_architecture_component_layer, github_prompts_design_system_references_primitive_tokens_color_scales, github_prompts_design_system_references_semantic_tokens_color_semantics, github_prompts_design_system_references_component_tokens_button_tokens [INFERRED 0.85]

## Communities (176 total, 51 thin omitted)

### Community 0 - "ShadcnInstaller"
Cohesion: 0.05
Nodes (3): main(), ShadcnInstaller, TestShadcnInstaller

### Community 1 - "app-sidebar.tsx"
Cohesion: 0.07
Nodes (29): accountNavItems, AppSidebar(), mainNavItems, documentHint(), DocumentMatch, DocumentResult, GlobalSearch(), groupOrder (+21 more)

### Community 2 - "app-header.tsx"
Cohesion: 0.11
Nodes (38): NavigationMenuIndicator, --positioner-height / --positioner-width, viewport boolean wrapper prop, Per-side translate transitions, AppHeader(), mainNavItems, Props, rightNavItems (+30 more)

### Community 3 - "generate-slide.py"
Cohesion: 0.13
Nodes (10): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+2 more)

### Community 5 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 6 - "Button"
Cohesion: 0.08
Nodes (32): @laravel/passkeys, InputError(), PasskeyRegistration(), Props, PasskeyVerify(), Props, PasswordInput(), Props (+24 more)

### Community 8 - "card"
Cohesion: 0.20
Nodes (12): $type, $value, bg, bg, padding, shadow, card, bg (+4 more)

### Community 9 - "slide_search_core.py"
Cohesion: 0.11
Nodes (16): format_context(), format_result(), main(), calculate_pattern_break(), detect_domain(), get_background_config(), get_color_for_emotion(), get_layout_for_goal() (+8 more)

### Community 10 - "Illuminate\Http\RedirectResponse"
Cohesion: 0.12
Nodes (5): CabinetController, Controller, OcrSettingsController, ProfileController, SecurityController

### Community 11 - "component-tokens.md"
Cohesion: 0.07
Nodes (32): Alert Spec, Badge Spec, Button Spec, Card Spec, Dialog Spec, Input Spec, Table Spec, Alert Tokens (+24 more)

### Community 12 - "Cabinet"
Cohesion: 0.10
Nodes (11): {closure#2}(), {closure#1}(), {closure#2}(), {closure#3}(), {closure#5}(), {closure#5}(), Cabinet, BookFactory (+3 more)

### Community 13 - "re"
Cohesion: 0.09
Nodes (17): gemini-3.1-pro-preview, 12 Icon Categories, 15 Icon Styles, apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon() (+9 more)

### Community 14 - "SKILL.md (design)"
Cohesion: 0.14
Nodes (13): CIP Mockup Base Prompt Structure, Lighting & Context Modifiers, CIP Negative Prompts, CIP Style Modifiers, CIP Design Styles (Corporate Minimal, Modern Tech, Luxury Premium, ...), CIP Color Psychology, Primary Color Meanings, Logo Core Prompt Structure (+5 more)

### Community 15 - "OcrDocument"
Cohesion: 0.16
Nodes (5): OcrDocument, LocalThumbnailClient, OcrManager, OcrPdfOptimizer, {closure#1}()

### Community 16 - "document-chain.tsx"
Cohesion: 0.11
Nodes (32): chainArrowDots(), chainArrowHead(), ChainCard, clampScrollLeft(), cubicBezierPoint(), DocumentChain(), DocumentChainProps, roundCoord() (+24 more)

### Community 17 - "dropdown-menu.tsx"
Cohesion: 0.13
Nodes (16): --anchor-width CSS variable, @base-ui/react/menu, closeOnClick defaults to false, DropdownMenuCheckboxItem(), DropdownMenuGroup(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem() (+8 more)

### Community 18 - "Brand Context Sync"
Cohesion: 0.10
Nodes (27): Brand Guidelines Document Structure, Extractable Brand Fields, Brand Color Presets, /brand:update Command, Core Visual Elements, Visual Guidelines Template, extractColorsFromTable(), extractCoreAttributes() (+19 more)

### Community 19 - "Spacing Scale Tokens"
Cohesion: 0.09
Nodes (22): $type, $value, $type, $value, $type, $value, $type, $value (+14 more)

### Community 20 - "Transformation Engine"
Cohesion: 0.06
Nodes (31): aliases, components, hooks, lib, ui, utils, base, iconLibrary (+23 more)

### Community 21 - "document-viewer-dialog.tsx"
Cohesion: 0.21
Nodes (22): Dialog Backdrop and Popup, Opacity and scale transitions, DeleteUser(), PasskeyItem(), Props, Dialog(), DialogClose(), DialogContent() (+14 more)

### Community 22 - "filing-cabinet.tsx"
Cohesion: 0.14
Nodes (14): CLOSEUP, CLOSEUP_FROM, CLOSEUP_TO, closeupPose(), DRAWER_TRAVEL, Face(), FADE, FilingCabinet() (+6 more)

### Community 23 - "Semantic Color Tokens"
Cohesion: 0.11
Nodes (19): $type, $value, background, foreground, muted-foreground, primary, primary-hover, secondary (+11 more)

### Community 24 - "HTML Token Validator"
Cohesion: 0.13
Nodes (12): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+4 more)

### Community 25 - "cabinets.ts"
Cohesion: 0.13
Nodes (20): motion, BOOK_POP, CabinetDrawer(), CabinetDrawerProps, drawerRimOffset(), translateZ(), ClosedBookMesh(), BOOK_COVER (+12 more)

### Community 26 - "TaxDeclaration"
Cohesion: 0.21
Nodes (4): Owner, TaxDeclaration, {closure#1}(), DeclarationRecorder

### Community 27 - "cip/generate.py"
Cohesion: 0.09
Nodes (15): CIP Workflow, Gemini Flash/Pro Image Models, CIP HTML Presentation, build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana(), load_env() (+7 more)

### Community 28 - "@base-ui/react"
Cohesion: 0.13
Nodes (19): @base-ui/react/separator, decorative prop dropped, @base-ui/react/toggle, data-pressed attribute, @base-ui/react/toggle-group, multiple boolean (replaces type), toggleVariants, @base-ui/react (+11 more)

### Community 29 - "Brand Color Extraction Scripts"
Cohesion: 0.10
Nodes (19): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+11 more)

### Community 30 - "TestCase"
Cohesion: 0.06
Nodes (14): {closure#1}(), PasswordConfirmationTest, RegistrationTest, {closure#1}(), TwoFactorChallengeTest, VerificationNotificationTest, BookmarksTest, {closure#1}() (+6 more)

### Community 31 - "open-book.tsx"
Cohesion: 0.09
Nodes (32): BACKDROP, BookFlyer, BookPage(), BookPhase, COVER_CLOSE, DetailRow(), DocumentDetails(), EmptyDocuments() (+24 more)

### Community 32 - "design/references/banner-sizes-and-styles.md"
Cohesion: 0.11
Nodes (16): 22 Art Direction Styles, Google Display Network Ad Sizes, Pinterest Research Queries, Print Specs, Logo Workflow, Social Art Direction Styles (Reuse from Banner), Social Platform Sizes, Screenshot Export (Chrome Headless / Playwright / Puppeteer) (+8 more)

### Community 33 - "@inertiajs/react"
Cohesion: 0.06
Nodes (32): Non-primitive wrappers (alert, card, input, skeleton, spinner), @inertiajs/react, input-otp, Heading(), EmptyState(), ManagePasskeys(), Props, ManageTwoFactor() (+24 more)

### Community 35 - "package.json Metadata"
Cohesion: 0.08
Nodes (28): private, $schema, type, babel-plugin-react-compiler, clsx, concurrently, @inertiajs/vite, @laravel/multiplex (+20 more)

### Community 36 - "npm Dependencies"
Cohesion: 0.08
Nodes (26): dependencies, @base-ui/react, class-variance-authority, clsx, concurrently, @inertiajs/react, @inertiajs/vite, input-otp (+18 more)

### Community 38 - "radius"
Cohesion: 0.19
Nodes (14): $type, $value, $type, $value, $type, $value, primitive, radius (+6 more)

### Community 39 - "logo-design.md"
Cohesion: 0.27
Nodes (6): Color Harmony Types, Color Combinations by Industry, Logo Industry Defaults, Logo Style Categories (55+), Core Logo Types (Wordmark, Lettermark, Pictorial, Abstract, Mascot, Emblem, Combination), Logo Style Selection Matrix

### Community 40 - "Banner Design Skill"
Cohesion: 0.15
Nodes (15): 22 Art Direction Styles, Pinterest Research Queries, Platform Banner Sizes, Print Specs, SKILL.md (banner-design), ai-artist Skill, ai-multimodal Skill, AI Visual Generation (Gemini Flash / Pro) (+7 more)

### Community 41 - "SKILL.md (design-system)"
Cohesion: 0.17
Nodes (16): assets/design-tokens.css, flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path (+8 more)

### Community 43 - "csv"
Cohesion: 0.15
Nodes (9): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+1 more)

### Community 45 - "shadcn-accessibility.md"
Cohesion: 0.13
Nodes (17): @axe-core/react Automated Testing, Focus Management (focus trap, focus-visible rings), Form Accessibility (labels, aria-invalid, error association), Keyboard Navigation Patterns, ARIA Live Regions, prefers-reduced-motion Support, Screen Reader Support (ARIA labels, sr-only), WCAG Color Contrast (AA 4.5:1 / AAA 7:1) (+9 more)

### Community 47 - "archive/index.tsx"
Cohesion: 0.13
Nodes (18): react-dom, useSetArchiveHeaderTrail(), buttonVariants, BookPortalContext, BookPortalProvider(), BookPortalValue, useBookPortal(), CABINET_SEARCH_FIELDS (+10 more)

### Community 48 - "Book"
Cohesion: 0.09
Nodes (13): ArchiveController, BookController, {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#1}(), {closure#2}() (+5 more)

### Community 49 - "PasswordValidationRules"
Cohesion: 0.06
Nodes (11): CreateNewUser, ResetUserPassword, PasswordValidationRules, ProfileValidationRules, PasswordUpdateRequest, ProfileDeleteRequest, ProfileUpdateRequest, TwoFactorAuthenticationRequest (+3 more)

### Community 50 - "Inertia Middleware & Fortify"
Cohesion: 0.09
Nodes (12): HandleAppearance, HandleInertiaRequests, {closure#1}(), {closure#10}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#8}() (+4 more)

### Community 51 - "Brand Accessibility Checklists"
Cohesion: 0.12
Nodes (14): Accessibility Review (WCAG AA), Post-Approval Archival, Asset Approval Checklist, Legal & Compliance Review, Reviewer Sign-off, Industry Color Palette Examples, Color System Hierarchy, Relative Luminance & Contrast Ratio Formula (+6 more)

### Community 52 - "sidebar.tsx"
Cohesion: 0.12
Nodes (31): data-popup-open attribute, data-popup-open on menu buttons, Base UI Tooltip, delay prop (formerly delayDuration), NavFooter(), CollapsibleNavItem(), NavMain(), Collapsible() (+23 more)

### Community 53 - "login.tsx"
Cohesion: 0.07
Nodes (41): lucide-react, sonner, DrawerIcon, DrawerIconProps, Props, TwoFactorRecoveryCodes(), Badge(), badgeVariants (+33 more)

### Community 54 - "AppLogoIcon"
Cohesion: 0.46
Nodes (4): AppLogoIcon(), AuthSimpleLayout(), AuthSplitLayout(), AuthLayoutProps

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

### Community 59 - "Drawer"
Cohesion: 0.09
Nodes (8): DrawerController, {closure#1}(), {closure#2}(), DeclarationOwner, {closure#2}(), {closure#3}(), Drawer, Property

### Community 60 - "ilocos-norte-map.tsx"
Cohesion: 0.13
Nodes (15): @visx/geo, DetailCell(), IlocosNorteMapProps, LguRow, lguRows, LOT_BUCKETS, provinceOutline, provinceTotals (+7 more)

### Community 61 - "app-sidebar-header.tsx"
Cohesion: 0.10
Nodes (38): BreadcrumbLink, render={<Link />}, AppContent(), Props, AppShell(), Props, AppSidebarHeader(), ArchiveHeaderItem (+30 more)

### Community 62 - "TypeScript Config"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, module, moduleResolution (+7 more)

### Community 63 - "pathlib"
Cohesion: 0.08
Nodes (15): test_sync_parses_bundled_starter_template(), main(), format_brief(), format_results(), main(), main(), main(), _run() (+7 more)

### Community 65 - "document-upload-dialog.tsx"
Cohesion: 0.09
Nodes (45): alignItemWithTrigger={false}, --available-height / --transform-origin / --anchor-width / --anchor-height, Base UI Select, collisionAvoidance, onValueChange can receive null, Select(), SelectContent(), SelectItem() (+37 more)

### Community 66 - "slides-copywriting-formulas.md"
Cohesion: 0.18
Nodes (11): AIDA (Attention-Interest-Desire-Action), Before-After-Bridge, Cost of Inaction, FAB (Features-Advantages-Benefits), Formula-to-Slide Mapping, Headline Patterns, PAS (Problem-Agitate-Solution), search-slides.py (design-system) (+3 more)

### Community 67 - "Inertia\Testing\AssertableInertia"
Cohesion: 0.11
Nodes (26): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#1}(), {closure#10}(), {closure#11}(), {closure#12}() (+18 more)

### Community 68 - "main.py"
Cohesion: 0.08
Nodes (18): embedded_page_texts(), health(), merge_skipped_pages(), ocr(), optimize_pdf(), page_has_text(), pages_from_sidecar(), read_upload() (+10 more)

### Community 69 - "Routing by Task Type"
Cohesion: 0.29
Nodes (6): Multi-Skill Workflows, brand (external sub-skill), Complete Brand Package Workflow, design-system (external sub-skill), New Design System Workflow, ui-styling (external sub-skill)

### Community 70 - "button"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 71 - "Brand Asset Validator"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 72 - "cip/core.py"
Cohesion: 0.10
Nodes (11): detect_domain(), get_cip_brief(), _load_csv(), search(), search_all(), _search_csv(), detect_domain(), _load_csv() (+3 more)

### Community 75 - "Composer Scripts"
Cohesion: 0.15
Nodes (13): scripts, ci:check, dev, lint, lint:check, post-autoload-dump, post-create-project-cmd, post-root-package-install (+5 more)

### Community 77 - "Design Tokens Starter Structure"
Cohesion: 0.15
Nodes (12): component, $type, $value, dark, semantic, $schema, $type, $value (+4 more)

### Community 79 - "pdf-thumbnail.tsx"
Cohesion: 0.29
Nodes (12): acquireThumbnailSlot(), cacheRenderedThumbnail(), getCachedThumbnail(), JPEG_QUALITY, releaseThumbnailSlot(), thumbnailCacheKey(), thumbnailObjectUrls, ThumbnailQuality (+4 more)

### Community 82 - "slides-html-template.md"
Cohesion: 0.17
Nodes (12): Slide Animation Classes, 16:9 Slide Deck Base HTML Structure, Chart.js Integration, Slide CSS Variables (Design Tokens), Slide Navigation (showSlide/nextSlide/prevSlide), Slides Key Features, Slide Card & Metric Variants, Layout Selection by Use Case (+4 more)

### Community 85 - "TDAMS Branding Assets"
Cohesion: 0.17
Nodes (10): Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System), Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System) (+2 more)

### Community 86 - "ui-styling/SKILL.md"
Cohesion: 0.26
Nodes (8): WAI-ARIA Design Patterns, Canvas Visual Design Layer, MIT License (frontmatter), Radix UI, shadcn CLI (npx shadcn@latest init/add), shadcn/ui, Tailwind CSS, UI Styling Skill

### Community 89 - "Composer Package Metadata"
Cohesion: 0.17
Nodes (11): autoload-dev, psr-4, description, keywords, license, minimum-stability, name, prefer-stable (+3 more)

### Community 90 - "Token Usage Validator"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 91 - "messaging-framework.md"
Cohesion: 0.33
Nodes (5): Elevator Pitches (10/30/60s), Message Testing, Messaging Framework Hierarchy, Positioning Statement, Value Proposition Template

### Community 93 - "canvas-design-system.md"
Cohesion: 0.20
Nodes (6): Analog Meditation (design movement), Chromatic Language (design movement), Concrete Poetry (design movement), Geometric Silence (design movement), Multi-Page Design Systems, Organic Systems (design movement)

### Community 94 - "tailwind-utilities.md"
Cohesion: 0.22
Nodes (8): Intentional OKLCH Color Palette (2-5 colors), @theme Directive (CSS-based design tokens), Arbitrary Values ([...] syntax), Borders, Radius & Shadows, Color Scale (50-950) & Opacity Modifiers, Layout Utilities (Flexbox, Grid, Positioning, Z-Index), Spacing Scale (padding, margin, space-between), Typography Utilities

### Community 95 - "tailwind-customization.md"
Cohesion: 0.29
Nodes (7): @apply Directive, Custom Utilities (@utility), Custom Variants (@custom-variant), Dark Mode Configuration (darkMode class/media), Layer Organization (@layer base/components/utilities), Tailwind Plugins (typography, forms, container-queries, custom), Content Configuration & Safelist

### Community 98 - "Composer Dev Dependencies"
Cohesion: 0.20
Nodes (10): require-dev, fakerphp/faker, larastan/larastan, laravel/pail, laravel/pao, laravel/pint, laravel/sail, mockery/mockery (+2 more)

### Community 100 - "Motion Duration Tokens"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 101 - "shadcn-theming.md"
Cohesion: 0.23
Nodes (9): Base Color Presets (Slate, Gray, Zinc, Neutral, Stone), shadcn CSS Variable System (globals.css :root/.dark), Component Variant Customization (cva buttonVariants), Multiple Themes via data-theme Attributes, Dark Mode via next-themes ThemeProvider, Global --radius Variable, Style Variants (Default / New York, components.json), ThemeToggle Component (+1 more)

### Community 102 - "tailwind-responsive.md"
Cohesion: 0.29
Nodes (6): Breakpoint System (sm 640 – 2xl 1536), Container Queries (@container), Custom Breakpoints (--breakpoint-3xl, --breakpoint-tablet), Max-Width & Range Queries (max-*:), Mobile-First Breakpoint Approach, Responsive Testing Checklist (320-1280px, 44x44 touch targets)

### Community 103 - "book-world-pose.ts"
Cohesion: 0.18
Nodes (17): BoxQuadElement, cumulativeFromOffsetParents(), cumulativeTransform(), decompose(), findPerspectiveRoot(), FlyerPose, matrixFromBoxQuads(), measureHoverAndRestPose() (+9 more)

### Community 105 - "DocumentFields"
Cohesion: 0.15
Nodes (5): {closure#4}(), {closure#6}(), {closure#7}(), DocumentFields, OllamaClient

### Community 106 - "input"
Cohesion: 0.29
Nodes (8): padding-x, input, $type, $value, focus-ring, padding-x, $type, $value

### Community 107 - "Composer Requirements"
Cohesion: 0.22
Nodes (9): require, inertiajs/inertia-laravel, laravel/chisel, laravel/fortify, laravel/framework, laravel/scout, laravel/tinker, laravel/wayfinder (+1 more)

### Community 109 - "$type"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 110 - "xl"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 111 - "radius"
Cohesion: 0.60
Nodes (5): radius, radius, radius, $type, $value

### Community 112 - "Optional Native Binaries"
Cohesion: 0.25
Nodes (8): optionalDependencies, @laravel/multiplex, lightningcss-linux-x64-gnu, lightningcss-win32-x64-msvc, @rollup/rollup-linux-x64-gnu, @rollup/rollup-win32-x64-msvc, @tailwindcss/oxide-linux-x64-gnu, @tailwindcss/oxide-win32-x64-msvc

### Community 113 - "DocumentController.php"
Cohesion: 0.09
Nodes (7): {closure#3}(), DocumentController, {closure#1}(), DocumentSearchController, {closure#1}(), Document, DocumentSearcher

### Community 114 - "Composer Config"
Cohesion: 0.29
Nodes (7): pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, preferred-install, sort-packages

### Community 115 - "lg"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 116 - "auth.ts"
Cohesion: 0.22
Nodes (9): Auth, Passkey, TwoFactorSecretKey, TwoFactorSetupData, User, InertiaConfig, @inertiajs/core, InputHTMLAttributes (+1 more)

### Community 117 - "padding-y"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 118 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 119 - "CI Workflow"
Cohesion: 0.33
Nodes (5): CI Job (ubuntu-latest, push main / pull_request), composer ci:check, composer setup, Node 22 (setup-node), PHP 8.3 + Composer v2 (setup-php)

### Community 120 - "npm Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, build:ssr, check, check:fix, dev, types:check

### Community 124 - "16"
Cohesion: 0.67
Nodes (3): $type, $value, 16

### Community 125 - "use-appearance.tsx"
Cohesion: 0.15
Nodes (21): withApp(), AppearanceToggleTab(), Toaster(), TooltipProvider(), Appearance, applyTheme(), getStoredAppearance(), handleSystemThemeChange() (+13 more)

### Community 126 - "1"
Cohesion: 0.67
Nodes (3): $type, $value, 1

### Community 127 - "npm Dev Dependencies"
Cohesion: 0.33
Nodes (6): devDependencies, babel-plugin-react-compiler, @laravel/vite-plugin-wayfinder, @rolldown/plugin-babel, @types/node, vite-plus

### Community 128 - "Bagong Pilipinas Emblems"
Cohesion: 0.33
Nodes (4): Bagong Pilipinas (Philippine Government Brand), Bagong Pilipinas (Philippine Government Brand), Philippine Flag Sun and Three Stars, Philippine Flag Sun and Three Stars

### Community 129 - "Ilocos Norte Seal"
Cohesion: 0.33
Nodes (5): Rice and Garlic Agricultural Symbols, Baroque Church Facade (likely Paoay Church), Founding Year 1818, Province of Ilocos Norte, Wind Turbines (Bangui Windmills)

### Community 130 - "3"
Cohesion: 0.67
Nodes (3): $type, $value, 3

### Community 131 - "PSR-4 Autoload"
Cohesion: 0.40
Nodes (5): autoload, psr-4, App\\, Database\\Factories\\, Database\\Seeders\\

### Community 132 - "Laravel Extra Config"
Cohesion: 0.40
Nodes (5): extra, laravel, post-create-project, dont-discover, installer

### Community 134 - "1 GB Lightsail: FastAPI + Paddle OCR + compression"
Cohesion: 0.40
Nodes (4): 1 GB Lightsail: FastAPI + Paddle OCR + compression, Checks, Install, Limits on 1 GB / 2 vCPU / 40 GB

### Community 135 - "0001_01_01_000000_create_application_schema.php"
Cohesion: 0.10
Nodes (24): {closure#1}(), {closure#10}(), {closure#11}(), {closure#12}(), {closure#13}(), {closure#14}(), {closure#15}(), {closure#16}() (+16 more)

### Community 137 - "8"
Cohesion: 0.67
Nodes (3): $type, $value, 8

### Community 138 - "destructive"
Cohesion: 0.67
Nodes (3): destructive, $type, $value

### Community 139 - "muted"
Cohesion: 0.67
Nodes (3): muted, $type, $value

### Community 140 - "Login Cover Art"
Cohesion: 0.50
Nodes (3): Dark Neutral Palette (#171717 / #fafafa), Diagonal Line Pattern, Login Page

### Community 144 - "ring"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 163 - "logo/search.py"
Cohesion: 0.22
Nodes (4): CIP BM25 Search Engine (core.py), Logo BM25 Search Engine (core.py), format_output(), generate_design_brief()

### Community 165 - "cip-deliverable-guide.md"
Cohesion: 0.33
Nodes (6): Core Identity Deliverables, Digital Assets, Office Environment Signage, Stationery Set, Vehicle Branding, CIP Deliverable Categories

### Community 166 - "react"
Cohesion: 0.09
Nodes (44): react, react-pdf, ClientOnly(), PdfHighlight, PdfPreview(), PdfPreviewProps, PdfViewport, PdfViewerControls() (+36 more)

### Community 170 - "PdfRegionTests"
Cohesion: 0.11
Nodes (5): get_ocr_engine(), RegionTesseractEngine, pdf_fixture(), PdfRegionTests, fake_ocr()

### Community 171 - "run.sh"
Cohesion: 0.50
Nodes (3): OCR_API_TOKEN, run.sh script, WATCHFILES_FORCE_POLLING

### Community 184 - "sm"
Cohesion: 0.60
Nodes (5): sm, sm, sm, $type, $value

### Community 185 - "setup.sh"
Cohesion: 0.50
Nodes (3): COMPOSER_MEMORY_LIMIT, DEBIAN_FRONTEND, setup.sh script

### Community 187 - "OcrDocumentTest.php"
Cohesion: 0.22
Nodes (19): {closure#1}(), {closure#10}(), {closure#11}(), {closure#12}(), {closure#13}(), {closure#14}(), {closure#15}(), {closure#16}() (+11 more)

### Community 193 - "destructive-foreground"
Cohesion: 0.67
Nodes (3): destructive-foreground, $type, $value

### Community 195 - "primary-foreground"
Cohesion: 0.67
Nodes (3): primary-foreground, $type, $value

### Community 196 - "secondary-foreground"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

### Community 199 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

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
- **110 isolated node(s):** `DEBIAN_FRONTEND`, `DEBIAN_FRONTEND`, `COMPOSER_MEMORY_LIMIT`, `@types/react`, `@types/react-dom` (+105 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1034 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **51 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SKILL.md (design-system)` connect `SKILL.md (design-system)` to `component-tokens.md`, `Brand Context Sync`, `Token Architecture Layers`, `Token Usage Validator`, `pathlib`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DEBIAN_FRONTEND`, `DEBIAN_FRONTEND`, `COMPOSER_MEMORY_LIMIT` to the rest of the system?**
  _110 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ShadcnInstaller` be split into smaller, more focused modules?**
  _Cohesion score 0.053555750658472345 - nodes in this community are weakly interconnected._
- **Why does `SKILL.md (brand)` connect `Brand Context Sync` to `Brand Asset Validator`, `SKILL.md (design-system)`, `Brand Accessibility Checklists`, `Brand Typography & Voice`, `Token Architecture Layers`, `Brand Asset Organization`, `messaging-framework.md`, `Brand Color Extraction Scripts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `MIT License (frontmatter)` and `Apache License 2.0`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `shadcn CLI (npx shadcn@latest init/add)` and `requirements.txt`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._