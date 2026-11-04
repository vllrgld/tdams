# Graph Report - dtms  (2026-11-04)

## Corpus Check
- 367 files · ~435,142 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 52 file(s) not represented in the graph (top: (none) 16, .csv 16, .css 5)

## Summary
- 3161 nodes · 7001 edges · 185 communities (134 shown, 51 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 326 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ccbc44f6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ShadcnInstaller
- Book
- cn
- generate-slide.py
- PaddleOcrClient
- gray
- Button
- DocumentSearchTest
- card
- slide_search_core.py
- Illuminate\Http\RedirectResponse
- component-tokens.md
- document-chain.tsx
- re
- document-info.tsx
- OcrDocument
- react
- @inertiajs/react
- Brand Context Sync
- Spacing Scale Tokens
- login.tsx
- document-viewer-dialog.tsx
- button
- Semantic Color Tokens
- HTML Token Validator
- test_regions.py
- resources_js_routes_index
- ocr
- cabinets.ts
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
- app-sidebar-header.tsx
- Banner Design Skill
- SKILL.md (design-system)
- SKILL.md (design)
- csv
- shadcn-accessibility.md
- TestTailwindConfigGenerator
- slides-copywriting-formulas.md
- PasswordValidationRules
- Inertia Middleware & Fortify
- Brand Accessibility Checklists
- sidebar.tsx
- cip/generate.py
- slides-html-template.md
- Brand Typography & Voice
- Token Architecture Layers
- Brand Asset Organization
- Font Size Tokens
- TaxDeclaration
- AppServiceProvider
- index.ts
- TypeScript Config
- pathlib
- OcrSettingsTest
- book-world-pose.ts
- alert.tsx
- Inertia\Testing\AssertableInertia
- regions.py
- dashboard/index.tsx
- dropdown-menu.tsx
- Brand Asset Validator
- cip/core.py
- folder-motion-enhanced-review.mjs
- Transformation Engine
- Composer Scripts
- DocumentFieldMappingTest.php
- Design Tokens Starter Structure
- .generate_config_string
- messaging-framework.md
- slides-strategies.md
- document-upload-dialog.tsx
- SKILL.md (slides)
- EmailVerificationTest
- main.py
- TDAMS Branding Assets
- ui-styling/SKILL.md
- Routing by Task Type
- Composer Package Metadata
- Token Usage Validator
- render-html.py
- clearDebounce
- canvas-design-system.md
- tailwind-utilities.md
- tailwind-customization.md
- Composer Dev Dependencies
- FoldersTest
- Motion Duration Tokens
- shadcn-theming.md
- tailwind-responsive.md
- open-folder.tsx
- DocumentFields
- global-search.tsx
- Composer Requirements
- input
- xl
- archive/index.tsx
- Optional Native Binaries
- DocumentController.php
- Composer Config
- books/index.tsx
- auth.ts
- $type
- Product
- CI Workflow
- npm Scripts
- Laravel\Fortify\Features
- Document Upload Tests
- ArchiveTest
- radius
- use-appearance.tsx
- lg
- npm Dev Dependencies
- Bagong Pilipinas Emblems
- Ilocos Norte Seal
- sm
- PSR-4 Autoload
- Laravel Extra Config
- 1 GB Lightsail: FastAPI + Paddle OCR + compression
- 0001_01_01_000000_create_application_schema.php
- apple-touch-icon.png
- AuthenticationTest
- logo/core.py
- padding-y
- Login Cover Art
- setup-ocr.sh
- Dependabot Config
- ring
- 16
- pnpm Workspace
- Apache License
- robots.txt
- DocumentLinkingTest
- Illuminate\Database\Eloquent\Model
- slides-layout-patterns.md
- SecurityTest.php
- 1
- pdf-thumbnail.tsx
- .test_full_configuration_typescript
- TailwindConfigGenerator
- OcrDocumentTest
- PdfRegionTests
- run.sh
- 3
- HeaderDocumentSearchTest
- 8
- destructive
- destructive-foreground
- muted
- primary-foreground
- secondary-foreground
- DocumentUploadTest.php
- setup.sh
- OcrDocumentTest.php
- OcrSetting
- none
- PaddleOcrClient

## God Nodes (most connected - your core abstractions)
1. `cn()` - 161 edges
2. `react` - 89 edges
3. `Button()` - 85 edges
4. `Document` - 66 edges
5. `TailwindConfigGenerator` - 58 edges
6. `TestCase` - 51 edges
7. `@inertiajs/react` - 50 edges
8. `lucide-react` - 49 edges
9. `InputError()` - 44 edges
10. `User` - 43 edges

## Surprising Connections (you probably didn't know these)
- `{closure#1}()` --references--> `OcrDocument`  [EXTRACTED]
  tests/Feature/Documents/DocumentUploadTest.php → app/Jobs/OcrDocument.php
- `Multi-Skill Workflows` --semantically_similar_to--> `Complete Brand Package Workflow`  [INFERRED] [semantically similar]
  .github/prompts/design/references/design-routing.md → .github/prompts/design/SKILL.md
- `Button Component Classes (@apply)` --semantically_similar_to--> `Button Tokens`  [INFERRED] [semantically similar]
  .github/prompts/design-system/references/tailwind-integration.md → .github/prompts/design-system/references/component-tokens.md
- `Banner Output Path Convention` --semantically_similar_to--> `Asset Naming Convention`  [INFERRED] [semantically similar]
  .github/prompts/banner-design/SKILL.md → .github/prompts/brand/references/asset-organization.md
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
- **CSS-variable theming pipeline (globals.css vars → Tailwind config → dark mode toggle)** — github_prompts_ui_styling_references_shadcn_theming_css_variable_system, github_prompts_ui_styling_references_shadcn_theming_radius_variable, github_prompts_ui_styling_references_tailwind_customization_tailwind_config_ts, github_prompts_ui_styling_references_tailwind_customization_dark_mode_configuration, github_prompts_ui_styling_references_shadcn_theming_next_themes_dark_mode [INFERRED 0.85]
- **Dark Mode Theming via Semantic Overrides** — github_prompts_design_system_references_semantic_tokens_dark_mode_overrides, github_prompts_design_system_references_token_architecture_dark_mode_semantic_override, github_prompts_design_system_references_tailwind_integration_dark_mode_toggle, github_prompts_design_system_references_tailwind_integration_hsl_css_variables [INFERRED 0.85]
- **Radix data-state to Base UI data attributes** — migration_checkbox_data_checked, migration_toggle_data_pressed, migration_navigation_menu_data_popup_open, migration_sidebar_data_popup_open [INFERRED 0.85]
- **Primitive -> Semantic -> Component Token Cascade** — github_prompts_design_system_references_token_architecture_primitive_layer, github_prompts_design_system_references_token_architecture_semantic_layer, github_prompts_design_system_references_token_architecture_component_layer, github_prompts_design_system_references_primitive_tokens_color_scales, github_prompts_design_system_references_semantic_tokens_color_semantics, github_prompts_design_system_references_component_tokens_button_tokens [INFERRED 0.85]

## Communities (185 total, 51 thin omitted)

### Community 0 - "ShadcnInstaller"
Cohesion: 0.05
Nodes (3): main(), ShadcnInstaller, TestShadcnInstaller

### Community 1 - "Book"
Cohesion: 0.07
Nodes (23): {closure#2}(), {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#5}(), {closure#6}(), {closure#1}() (+15 more)

### Community 2 - "cn"
Cohesion: 0.09
Nodes (42): @base-ui/react/avatar, Base UI NavigationMenu, 50ms hover open delay, NavigationMenuIndicator, --positioner-height / --positioner-width, viewport boolean wrapper prop, Per-side translate transitions, AppHeader() (+34 more)

### Community 3 - "generate-slide.py"
Cohesion: 0.13
Nodes (11): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+3 more)

### Community 5 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 6 - "Button"
Cohesion: 0.08
Nodes (34): @laravel/passkeys, Heading(), InputError(), EmptyState(), ManagePasskeys(), Props, ManageTwoFactor(), PasskeyRegistration() (+26 more)

### Community 8 - "card"
Cohesion: 0.20
Nodes (12): $type, $value, bg, bg, padding, shadow, card, bg (+4 more)

### Community 9 - "slide_search_core.py"
Cohesion: 0.08
Nodes (17): format_context(), format_result(), main(), BM25, calculate_pattern_break(), detect_domain(), get_background_config(), get_color_for_emotion() (+9 more)

### Community 10 - "Illuminate\Http\RedirectResponse"
Cohesion: 0.09
Nodes (9): ArchiveController, BookController, CabinetController, Controller, DrawerController, GlobalSearchController, OcrSettingsController, ProfileController (+1 more)

### Community 11 - "component-tokens.md"
Cohesion: 0.07
Nodes (32): Alert Spec, Badge Spec, Button Spec, Card Spec, Dialog Spec, Input Spec, Table Spec, Alert Tokens (+24 more)

### Community 12 - "document-chain.tsx"
Cohesion: 0.14
Nodes (27): chainArrowDots(), chainArrowHead(), ChainCard, clampScrollLeft(), cubicBezierPoint(), DocumentChain(), DocumentChainProps, roundCoord() (+19 more)

### Community 13 - "re"
Cohesion: 0.09
Nodes (17): gemini-3.1-pro-preview, 12 Icon Categories, 15 Icon Styles, apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon() (+9 more)

### Community 14 - "document-info.tsx"
Cohesion: 0.16
Nodes (20): alignItemWithTrigger={false}, --available-height / --transform-origin / --anchor-width / --anchor-height, Base UI Select, collisionAvoidance, onValueChange can receive null, Badge(), badgeVariants, Select() (+12 more)

### Community 15 - "OcrDocument"
Cohesion: 0.17
Nodes (4): OcrDocument, LocalThumbnailClient, OcrManager, OcrPdfOptimizer

### Community 16 - "react"
Cohesion: 0.09
Nodes (41): react, ClientOnly(), PdfHighlight, PdfPreview(), PdfPreviewProps, PdfViewport, PdfViewerControls(), PlaceholderPatternProps (+33 more)

### Community 17 - "@inertiajs/react"
Cohesion: 0.11
Nodes (15): @inertiajs/react, lucide-react, sonner, buttonVariants, IconProps, CabinetListDrawer, CabinetListItem, BookForm (+7 more)

### Community 18 - "Brand Context Sync"
Cohesion: 0.10
Nodes (27): Brand Guidelines Document Structure, Extractable Brand Fields, Brand Color Presets, /brand:update Command, Core Visual Elements, Visual Guidelines Template, extractColorsFromTable(), extractCoreAttributes() (+19 more)

### Community 19 - "Spacing Scale Tokens"
Cohesion: 0.09
Nodes (22): $type, $value, $type, $value, $type, $value, $type, $value (+14 more)

### Community 20 - "login.tsx"
Cohesion: 0.24
Nodes (13): Props, TwoFactorRecoveryCodes(), Card(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle() (+5 more)

### Community 21 - "document-viewer-dialog.tsx"
Cohesion: 0.20
Nodes (23): Dialog Backdrop and Popup, Opacity and scale transitions, DeleteUser(), PasskeyItem(), Props, TwoFactorSetupModal(), Dialog(), DialogClose() (+15 more)

### Community 22 - "button"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 23 - "Semantic Color Tokens"
Cohesion: 0.11
Nodes (19): $type, $value, background, foreground, muted-foreground, primary, primary-hover, secondary (+11 more)

### Community 24 - "HTML Token Validator"
Cohesion: 0.13
Nodes (12): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+4 more)

### Community 26 - "resources_js_routes_index"
Cohesion: 0.33
Nodes (5): AppLogoIcon(), AuthSimpleLayout(), AuthSplitLayout(), AuthLayout(), AuthLayoutProps

### Community 27 - "ocr"
Cohesion: 0.42
Nodes (5): ocr(), optimize_pdf(), read_upload(), require_token(), thumbnail()

### Community 28 - "cabinets.ts"
Cohesion: 0.12
Nodes (28): useBookPortal(), BOOK_POP, CabinetDrawer(), CabinetDrawerProps, drawerRimOffset(), translateZ(), ClosedBookMesh(), ClosedFolderMesh (+20 more)

### Community 29 - "Brand Color Extraction Scripts"
Cohesion: 0.10
Nodes (19): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+11 more)

### Community 30 - "TestCase"
Cohesion: 0.06
Nodes (13): {closure#1}(), PasswordConfirmationTest, RegistrationTest, {closure#1}(), TwoFactorChallengeTest, BookmarksTest, {closure#1}(), DashboardTest (+5 more)

### Community 31 - "open-book.tsx"
Cohesion: 0.09
Nodes (29): BACKDROP, BookFlyer, BookPhase, BookReader(), finishFlip(), goNext(), goPrev(), handleKeyDown() (+21 more)

### Community 32 - "design/references/banner-sizes-and-styles.md"
Cohesion: 0.13
Nodes (14): 22 Art Direction Styles, Google Display Network Ad Sizes, Pinterest Research Queries, Print Specs, Social Art Direction Styles (Reuse from Banner), Social Platform Sizes, Screenshot Export (Chrome Headless / Playwright / Puppeteer), Social Photos 8-Step Workflow (+6 more)

### Community 33 - "@inertiajs/react"
Cohesion: 0.10
Nodes (18): input-otp, Props, GridScanIcon(), Props, TwoFactorSetupStep(), TwoFactorVerificationStep(), InputOTP, InputOTPGroup (+10 more)

### Community 35 - "package.json Metadata"
Cohesion: 0.08
Nodes (28): private, $schema, type, babel-plugin-react-compiler, clsx, concurrently, @inertiajs/vite, @laravel/multiplex (+20 more)

### Community 36 - "npm Dependencies"
Cohesion: 0.08
Nodes (26): dependencies, @base-ui/react, class-variance-authority, clsx, concurrently, @inertiajs/react, @inertiajs/vite, input-otp (+18 more)

### Community 38 - "radius"
Cohesion: 0.19
Nodes (14): $type, $value, $type, $value, $type, $value, primitive, radius (+6 more)

### Community 39 - "app-sidebar-header.tsx"
Cohesion: 0.25
Nodes (16): BreadcrumbLink, render={<Link />}, @base-ui/react/separator, decorative prop dropped, AppSidebarHeader(), useArchiveHeaderTrail(), Breadcrumbs(), Breadcrumb() (+8 more)

### Community 40 - "Banner Design Skill"
Cohesion: 0.15
Nodes (15): 22 Art Direction Styles, Pinterest Research Queries, Platform Banner Sizes, Print Specs, SKILL.md (banner-design), ai-artist Skill, ai-multimodal Skill, AI Visual Generation (Gemini Flash / Pro) (+7 more)

### Community 41 - "SKILL.md (design-system)"
Cohesion: 0.17
Nodes (16): assets/design-tokens.css, flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path (+8 more)

### Community 42 - "SKILL.md (design)"
Cohesion: 0.07
Nodes (29): CIP BM25 Search Engine (core.py), Gemini Flash/Pro Image Models, CIP Mockup Base Prompt Structure, Lighting & Context Modifiers, CIP Negative Prompts, CIP Style Modifiers, CIP Design Styles (Corporate Minimal, Modern Tech, Luxury Premium, ...), CIP Color Psychology (+21 more)

### Community 43 - "csv"
Cohesion: 0.15
Nodes (9): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+1 more)

### Community 45 - "shadcn-accessibility.md"
Cohesion: 0.13
Nodes (17): @axe-core/react Automated Testing, Focus Management (focus trap, focus-visible rings), Form Accessibility (labels, aria-invalid, error association), Keyboard Navigation Patterns, ARIA Live Regions, prefers-reduced-motion Support, Screen Reader Support (ARIA labels, sr-only), WCAG Color Contrast (AA 4.5:1 / AAA 7:1) (+9 more)

### Community 47 - "slides-copywriting-formulas.md"
Cohesion: 0.43
Nodes (6): AIDA (Attention-Interest-Desire-Action), Cost of Inaction, FAB (Features-Advantages-Benefits), Formula-to-Slide Mapping, Headline Patterns, PAS (Problem-Agitate-Solution)

### Community 49 - "PasswordValidationRules"
Cohesion: 0.08
Nodes (9): CreateNewUser, ResetUserPassword, PasswordValidationRules, ProfileValidationRules, PasswordUpdateRequest, ProfileDeleteRequest, ProfileUpdateRequest, TwoFactorAuthenticationRequest (+1 more)

### Community 50 - "Inertia Middleware & Fortify"
Cohesion: 0.09
Nodes (12): HandleAppearance, HandleInertiaRequests, {closure#1}(), {closure#10}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#8}() (+4 more)

### Community 51 - "Brand Accessibility Checklists"
Cohesion: 0.12
Nodes (14): Accessibility Review (WCAG AA), Post-Approval Archival, Asset Approval Checklist, Legal & Compliance Review, Reviewer Sign-off, Industry Color Palette Examples, Color System Hierarchy, Relative Luminance & Contrast Ratio Formula (+6 more)

### Community 52 - "sidebar.tsx"
Cohesion: 0.14
Nodes (31): data-popup-open attribute, data-popup-open on menu buttons, Slot-based sidebar pieces via useRender, accountNavItems, AppSidebar(), mainNavItems, NavFooter(), CollapsibleNavItem() (+23 more)

### Community 53 - "cip/generate.py"
Cohesion: 0.19
Nodes (7): build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana(), load_env(), load_logo_image(), main()

### Community 54 - "slides-html-template.md"
Cohesion: 0.43
Nodes (3): 16:9 Slide Deck Base HTML Structure, Slide CSS Variables (Design Tokens), Slide Navigation (showSlide/nextSlide/prevSlide)

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

### Community 59 - "TaxDeclaration"
Cohesion: 0.14
Nodes (5): Owner, Property, TaxDeclaration, {closure#1}(), DeclarationRecorder

### Community 61 - "index.ts"
Cohesion: 0.22
Nodes (12): AppContent(), Props, AppShell(), Props, SidebarInset(), SidebarProvider(), AppHeaderLayout(), AppSidebarLayout() (+4 more)

### Community 62 - "TypeScript Config"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, module, moduleResolution (+7 more)

### Community 63 - "pathlib"
Cohesion: 0.11
Nodes (9): test_sync_parses_bundled_starter_template(), main(), _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation(), Node.js 18+ Requirement, pytest Dev Dependencies (pytest>=8.0.0, pytest-cov, pytest-mock), requirements.txt (tests) (+1 more)

### Community 65 - "book-world-pose.ts"
Cohesion: 0.29
Nodes (11): BoxQuadElement, cumulativeFromOffsetParents(), cumulativeTransform(), findPerspectiveRoot(), matrixFromBoxQuads(), measureHoverAndRestPose(), measureLiftedSlotPose(), measureSlotPose() (+3 more)

### Community 66 - "alert.tsx"
Cohesion: 0.62
Nodes (5): AlertError(), Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 67 - "Inertia\Testing\AssertableInertia"
Cohesion: 0.08
Nodes (34): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#1}(), {closure#10}(), {closure#11}(), {closure#12}() (+26 more)

### Community 68 - "regions.py"
Cohesion: 0.12
Nodes (5): hocr_text_regions(), OcrRegion, pdf_text_regions(), RegionPageAggregator, text_lines()

### Community 69 - "dashboard/index.tsx"
Cohesion: 0.11
Nodes (20): @visx/geo, bucketFor(), DetailCell(), IlocosNorteMap(), IlocosNorteMapProps, LguRow, lguRows, LOT_BUCKETS (+12 more)

### Community 70 - "dropdown-menu.tsx"
Cohesion: 0.10
Nodes (23): --anchor-width CSS variable, @base-ui/react/menu, closeOnClick defaults to false, NavUser(), DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuGroup() (+15 more)

### Community 71 - "Brand Asset Validator"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 72 - "cip/core.py"
Cohesion: 0.11
Nodes (7): BM25, detect_domain(), get_cip_brief(), _load_csv(), search(), search_all(), _search_csv()

### Community 74 - "Transformation Engine"
Cohesion: 0.05
Nodes (42): aliases, components, hooks, lib, ui, utils, base, iconLibrary (+34 more)

### Community 75 - "Composer Scripts"
Cohesion: 0.15
Nodes (13): scripts, ci:check, dev, lint, lint:check, post-autoload-dump, post-create-project-cmd, post-root-package-install (+5 more)

### Community 77 - "Design Tokens Starter Structure"
Cohesion: 0.15
Nodes (12): component, $type, $value, dark, semantic, $schema, $type, $value (+4 more)

### Community 79 - "messaging-framework.md"
Cohesion: 0.33
Nodes (5): Elevator Pitches (10/30/60s), Message Testing, Messaging Framework Hierarchy, Positioning Statement, Value Proposition Template

### Community 80 - "slides-strategies.md"
Cohesion: 0.53
Nodes (3): Sales Pitch Deck, 15 Deck Strategies, YC Seed Deck

### Community 81 - "document-upload-dialog.tsx"
Cohesion: 0.09
Nodes (38): DeclarationNumberSearch(), DeclarationNumberSearchProps, blankFields(), BOUNDARY_FIELDS, BoundaryEditor(), boundaryHasText(), checklistKeys(), csrfToken() (+30 more)

### Community 82 - "SKILL.md (slides)"
Cohesion: 0.31
Nodes (6): Chart.js Integration, Slides Key Features, Slides Workflow, Slides (Built-in), SKILL.md (slides), Slides Skill

### Community 84 - "main.py"
Cohesion: 0.24
Nodes (8): embedded_page_texts(), health(), merge_skipped_pages(), page_has_text(), pages_from_sidecar(), render_thumbnail(), run_ocr(), run_optimize()

### Community 85 - "TDAMS Branding Assets"
Cohesion: 0.17
Nodes (10): Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System), Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System) (+2 more)

### Community 86 - "ui-styling/SKILL.md"
Cohesion: 0.26
Nodes (8): WAI-ARIA Design Patterns, Canvas Visual Design Layer, MIT License (frontmatter), Radix UI, shadcn CLI (npx shadcn@latest init/add), shadcn/ui, Tailwind CSS, UI Styling Skill

### Community 88 - "Routing by Task Type"
Cohesion: 0.33
Nodes (5): Multi-Skill Workflows, brand (external sub-skill), design-system (external sub-skill), New Design System Workflow, ui-styling (external sub-skill)

### Community 89 - "Composer Package Metadata"
Cohesion: 0.17
Nodes (11): autoload-dev, psr-4, description, keywords, license, minimum-stability, name, prefer-stable (+3 more)

### Community 90 - "Token Usage Validator"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 91 - "render-html.py"
Cohesion: 0.10
Nodes (15): Core Identity Deliverables, Digital Assets, Office Environment Signage, Stationery Set, Vehicle Branding, CIP Workflow, CIP Deliverable Categories, CIP HTML Presentation (+7 more)

### Community 92 - "clearDebounce"
Cohesion: 0.47
Nodes (6): changeQuery(), changeSearchField(), clearDebounce(), scheduleSearch(), submitSearch(), visitSearch()

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

### Community 103 - "open-folder.tsx"
Cohesion: 0.14
Nodes (23): decompose(), FlyerPose, poseFromMatrix(), translatePose(), BookPage(), DetailRow(), DocumentDetails(), EmptyDocuments() (+15 more)

### Community 106 - "global-search.tsx"
Cohesion: 0.08
Nodes (20): documentHint(), DocumentMatch, DocumentResult, GlobalSearch(), groupOrder, PageEntry, pageMatches(), pages (+12 more)

### Community 107 - "Composer Requirements"
Cohesion: 0.22
Nodes (9): require, inertiajs/inertia-laravel, laravel/chisel, laravel/fortify, laravel/framework, laravel/scout, laravel/tinker, laravel/wayfinder (+1 more)

### Community 109 - "input"
Cohesion: 0.29
Nodes (8): padding-x, input, $type, $value, focus-ring, padding-x, $type, $value

### Community 110 - "xl"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 111 - "archive/index.tsx"
Cohesion: 0.07
Nodes (36): motion, react-dom, ArchiveHeaderItem, ArchiveHeaderProvider(), SetTrailContext, TrailContext, useSetArchiveHeaderTrail(), BookPortalContext (+28 more)

### Community 112 - "Optional Native Binaries"
Cohesion: 0.25
Nodes (8): optionalDependencies, @laravel/multiplex, lightningcss-linux-x64-gnu, lightningcss-win32-x64-msvc, @rollup/rollup-linux-x64-gnu, @rollup/rollup-win32-x64-msvc, @tailwindcss/oxide-linux-x64-gnu, @tailwindcss/oxide-win32-x64-msvc

### Community 113 - "DocumentController.php"
Cohesion: 0.08
Nodes (7): {closure#3}(), DocumentController, {closure#1}(), DocumentSearchController, {closure#1}(), Document, DocumentSearcher

### Community 114 - "Composer Config"
Cohesion: 0.29
Nodes (7): pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, preferred-install, sort-packages

### Community 115 - "books/index.tsx"
Cohesion: 0.12
Nodes (15): DrawerIcon, DrawerIconProps, Collapsible(), CollapsibleContent(), CollapsibleTrigger(), ManageBook, bookFromDrawer(), BookManagementProps (+7 more)

### Community 116 - "auth.ts"
Cohesion: 0.24
Nodes (8): Auth, TwoFactorSecretKey, TwoFactorSetupData, User, InertiaConfig, @inertiajs/core, InputHTMLAttributes, react

### Community 117 - "$type"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 118 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 119 - "CI Workflow"
Cohesion: 0.33
Nodes (5): CI Job (ubuntu-latest, push main / pull_request), composer ci:check, composer setup, Node 22 (setup-node), PHP 8.3 + Composer v2 (setup-php)

### Community 120 - "npm Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, build:ssr, check, check:fix, dev, types:check

### Community 124 - "radius"
Cohesion: 0.60
Nodes (5): radius, radius, radius, $type, $value

### Community 125 - "use-appearance.tsx"
Cohesion: 0.12
Nodes (24): Base UI Tooltip, delay prop (formerly delayDuration), withApp(), AppearanceToggleTab(), Toaster(), TooltipProvider(), Appearance, applyTheme() (+16 more)

### Community 126 - "lg"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 127 - "npm Dev Dependencies"
Cohesion: 0.33
Nodes (6): devDependencies, babel-plugin-react-compiler, @laravel/vite-plugin-wayfinder, @rolldown/plugin-babel, @types/node, vite-plus

### Community 128 - "Bagong Pilipinas Emblems"
Cohesion: 0.33
Nodes (4): Bagong Pilipinas (Philippine Government Brand), Bagong Pilipinas (Philippine Government Brand), Philippine Flag Sun and Three Stars, Philippine Flag Sun and Three Stars

### Community 129 - "Ilocos Norte Seal"
Cohesion: 0.33
Nodes (5): Rice and Garlic Agricultural Symbols, Baroque Church Facade (likely Paoay Church), Founding Year 1818, Province of Ilocos Norte, Wind Turbines (Bangui Windmills)

### Community 130 - "sm"
Cohesion: 0.60
Nodes (5): sm, sm, sm, $type, $value

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
Cohesion: 0.09
Nodes (26): {closure#1}(), {closure#10}(), {closure#11}(), {closure#12}(), {closure#13}(), {closure#14}(), {closure#15}(), {closure#16}() (+18 more)

### Community 138 - "logo/core.py"
Cohesion: 0.12
Nodes (6): BM25, detect_domain(), _load_csv(), search(), search_all(), _search_csv()

### Community 139 - "padding-y"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 140 - "Login Cover Art"
Cohesion: 0.50
Nodes (3): Dark Neutral Palette (#171717 / #fafafa), Diagonal Line Pattern, Login Page

### Community 144 - "ring"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 145 - "16"
Cohesion: 0.67
Nodes (3): $type, $value, 16

### Community 158 - "Illuminate\Database\Eloquent\Model"
Cohesion: 0.11
Nodes (9): {closure#6}(), {closure#1}(), DeclarationOwner, {closure#2}(), {closure#3}(), Drawer, BookFactory, CabinetFactory (+1 more)

### Community 159 - "slides-layout-patterns.md"
Cohesion: 0.25
Nodes (5): Before-After-Bridge, search-slides.py (design-system), Slide Animation Classes, Slide Card & Metric Variants, Layout Selection by Use Case

### Community 161 - "SecurityTest.php"
Cohesion: 0.09
Nodes (4): UserFactory, {closure#1}(), {closure#2}(), SecurityTest

### Community 165 - "1"
Cohesion: 0.67
Nodes (3): $type, $value, 1

### Community 166 - "pdf-thumbnail.tsx"
Cohesion: 0.26
Nodes (13): react-pdf, acquireThumbnailSlot(), cacheRenderedThumbnail(), getCachedThumbnail(), JPEG_QUALITY, releaseThumbnailSlot(), thumbnailCacheKey(), thumbnailObjectUrls (+5 more)

### Community 170 - "PdfRegionTests"
Cohesion: 0.22
Nodes (3): pdf_fixture(), PdfRegionTests, fake_ocr()

### Community 171 - "run.sh"
Cohesion: 0.50
Nodes (3): OCR_API_TOKEN, run.sh script, WATCHFILES_FORCE_POLLING

### Community 173 - "3"
Cohesion: 0.67
Nodes (3): $type, $value, 3

### Community 175 - "8"
Cohesion: 0.67
Nodes (3): $type, $value, 8

### Community 176 - "destructive"
Cohesion: 0.67
Nodes (3): destructive, $type, $value

### Community 177 - "destructive-foreground"
Cohesion: 0.67
Nodes (3): destructive-foreground, $type, $value

### Community 178 - "muted"
Cohesion: 0.67
Nodes (3): muted, $type, $value

### Community 180 - "primary-foreground"
Cohesion: 0.67
Nodes (3): primary-foreground, $type, $value

### Community 181 - "secondary-foreground"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

### Community 182 - "DocumentUploadTest.php"
Cohesion: 0.32
Nodes (3): {closure#1}(), {closure#2}(), {closure#3}()

### Community 185 - "setup.sh"
Cohesion: 0.50
Nodes (3): COMPOSER_MEMORY_LIMIT, DEBIAN_FRONTEND, setup.sh script

### Community 187 - "OcrDocumentTest.php"
Cohesion: 0.22
Nodes (19): {closure#1}(), {closure#10}(), {closure#11}(), {closure#12}(), {closure#13}(), {closure#14}(), {closure#15}(), {closure#16}() (+11 more)

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1059 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **51 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SKILL.md (design-system)` connect `SKILL.md (design-system)` to `component-tokens.md`, `Brand Context Sync`, `Token Architecture Layers`, `Token Usage Validator`, `pathlib`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DEBIAN_FRONTEND`, `DEBIAN_FRONTEND`, `COMPOSER_MEMORY_LIMIT` to the rest of the system?**
  _110 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ShadcnInstaller` be split into smaller, more focused modules?**
  _Cohesion score 0.053555750658472345 - nodes in this community are weakly interconnected._
- **Why does `Document` connect `DocumentController.php` to `Book`, `Inertia\Testing\AssertableInertia`, `DocumentSearchTest`, `DocumentFields`, `OcrDocumentTest`, `DocumentFieldMappingTest.php`, `OcrDocumentTest.php`, `HeaderDocumentSearchTest`, `OcrDocument`, `DocumentUploadTest.php`, `TaxDeclaration`, `DocumentLinkingTest`, `Illuminate\Database\Eloquent\Model`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `MIT License (frontmatter)` and `Apache License 2.0`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `shadcn CLI (npx shadcn@latest init/add)` and `requirements.txt`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._