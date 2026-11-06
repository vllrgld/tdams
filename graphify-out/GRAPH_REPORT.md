# Graph Report - dtms  (2026-11-06)

## Corpus Check
- 414 files · ~690,622 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 52 file(s) not represented in the graph (top: (none) 16, .csv 16, .css 5)

## Summary
- 3413 nodes · 7707 edges · 203 communities (150 shown, 53 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 351 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b2a3d382`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dialog.tsx
- Book
- closed-folder-mesh.tsx
- generate-slide.py
- @inertiajs/react
- gray
- Button
- DocumentSearchTest
- card
- slide_search_core.py
- Controller
- component-tokens.md
- global-search.tsx
- re
- document-browser.tsx
- OcrDocument
- react
- archive/index.tsx
- Brand Context Sync
- Spacing Scale Tokens
- open-folder.tsx
- use-document-upload.ts
- dropdown-menu.md
- Semantic Color Tokens
- HTML Token Validator
- DeclarationRecorder
- Transformation Engine
- UploadDocument.php
- security.tsx
- Brand Color Extraction Scripts
- TestCase
- AppServiceProvider
- design/references/banner-sizes-and-styles.md
- Illuminate\Database\Eloquent\Factories\Factory
- User
- package.json Metadata
- npm Dependencies
- CabinetsTest
- radius
- ui-styling/SKILL.md
- Banner Design Skill
- generate-tokens.cjs
- app-sidebar-header.tsx
- filing-item-management.tsx
- shadcn-accessibility.md
- TestTailwindConfigGenerator
- open-book.tsx
- Illuminate\Http\JsonResponse
- Illuminate\Foundation\Http\FormRequest
- Illuminate\Http\Request
- Brand Accessibility Checklists
- cn
- @base-ui/react
- test_regions.py
- Brand Typography & Voice
- Token Architecture Layers
- Brand Asset Organization
- Font Size Tokens
- Cabinet
- Routing by Task Type
- index.ts
- TypeScript Config
- pathlib
- RuntimeException
- filing-item-pose.ts
- canvas-design-system.md
- Inertia\Testing\AssertableInertia
- regions.py
- cn
- filing-cabinet.tsx
- Brand Asset Validator
- cip/core.py
- navigation-menu.md
- slides-layout-patterns.md
- Composer Scripts
- DocumentFieldMappingTest.php
- Design Tokens Starter Structure
- .generate_config_string
- document-field-review.tsx
- main.py
- AuthenticationTest
- AccessibilitySettingsTest
- DocumentUploadTest.php
- logo/core.py
- TDAMS Branding Assets
- tailwind-utilities.md
- ilocos-norte-map.tsx
- Composer Package Metadata
- Token Usage Validator
- SKILL.md (design)
- render-html.py
- fetch-background.py
- tailwind-customization.md
- tailwind-responsive.md
- slides-copywriting-formulas.md
- Composer Dev Dependencies
- slides-html-template.md
- Motion Duration Tokens
- shadcn-theming.md
- .mapFields
- test_regions.py
- button
- TDAMS PHP backend conventions and reviews
- Composer Requirements
- OcrSettingsTest
- Illuminate\Database\Eloquent\Relations\BelongsTo
- OcrExtractor
- lg
- Optional Native Binaries
- Document
- Composer Config
- auth.ts
- sm
- Product
- CI Workflow
- npm Scripts
- Laravel\Fortify\Features
- Document Upload Tests
- ArchiveTest
- .index
- use-appearance.tsx
- xl
- npm Dev Dependencies
- Bagong Pilipinas Emblems
- Ilocos Norte Seal
- messaging-framework.md
- PSR-4 Autoload
- Laravel Extra Config
- 1 GB Lightsail: FastAPI + Paddle OCR + compression
- 0001_01_01_000000_create_application_schema.php
- apple-touch-icon.png
- SecurityTest.php
- none
- input
- Login Cover Art
- setup-ocr.sh
- Dependabot Config
- ring
- pnpm Workspace
- Apache License 2.0
- robots.txt
- DocumentLinkingTest
- 16
- SKILL.md (slides)
- 1
- ShadcnInstaller
- $type
- radius
- 3
- .test_full_configuration_typescript
- TailwindConfigGenerator
- OcrDocumentTest
- PdfRegionTests
- run.sh
- BM25
- HeaderDocumentSearchTest
- padding-y
- 8
- Illuminate\Database\Eloquent\Model
- slides-strategies.md
- aliases
- destructive
- destructive-foreground
- muted
- primary-foreground
- secondary-foreground
- setup.sh
- upload
- OcrDocumentTest.php
- tailwind
- project.md
- pdf-thumbnail.tsx
- FoldersTest
- two-factor-challenge.tsx
- BM25
- BM25
- alert.tsx
- useRender hook
- OcrSetting
- dialog.md
- PaddleOcrClient

## God Nodes (most connected - your core abstractions)
1. `cn()` - 162 edges
2. `react` - 96 edges
3. `Button()` - 89 edges
4. `Document` - 85 edges
5. `TailwindConfigGenerator` - 58 edges
6. `TestCase` - 53 edges
7. `@inertiajs/react` - 52 edges
8. `lucide-react` - 49 edges
9. `InputError()` - 48 edges
10. `User` - 46 edges

## Surprising Connections (you probably didn't know these)
- `Existing organization` --references--> `BookController`  [INFERRED]
  docs/backend-review.md → app/Http/Controllers/BookController.php
- `Where PHP code belongs` --references--> `DeclarationRecorder`  [INFERRED]
  .ai/guidelines/php-backend-review.md → app/Services/Documents/DeclarationRecorder.php
- `Where PHP code belongs` --references--> `DocumentSearcher`  [INFERRED]
  .ai/guidelines/php-backend-review.md → app/Services/Documents/DocumentSearcher.php
- `Existing organization` --references--> `DocumentController`  [INFERRED]
  docs/backend-review.md → app/Http/Controllers/DocumentController.php
- `{closure#2}()` --references--> `OcrDocument`  [EXTRACTED]
  tests/Feature/Documents/DocumentUploadTest.php → app/Jobs/OcrDocument.php

## Import Cycles
- None detected.

## Hyperedges (group relationships)
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

## Communities (203 total, 53 thin omitted)

### Community 0 - "dialog.tsx"
Cohesion: 0.11
Nodes (33): PasskeyItem(), Props, GridScanIcon(), Props, TwoFactorSetupModal(), TwoFactorSetupStep(), TwoFactorVerificationStep(), documentHint() (+25 more)

### Community 1 - "Book"
Cohesion: 0.15
Nodes (11): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#5}(), {closure#6}(), {closure#2}(), {closure#4}() (+3 more)

### Community 2 - "closed-folder-mesh.tsx"
Cohesion: 0.11
Nodes (26): BookCoverFace(), COVER_LOGO_SIZE, coverTitleLines(), ClosedBookMesh(), BOOK_POP, CabinetDrawer(), CabinetDrawerProps, drawerRimOffset() (+18 more)

### Community 3 - "generate-slide.py"
Cohesion: 0.13
Nodes (10): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+2 more)

### Community 4 - "@inertiajs/react"
Cohesion: 0.08
Nodes (27): Non-primitive wrappers (alert, card, input, skeleton, spinner), class-variance-authority, @inertiajs/react, AppLogoIcon(), Props, TwoFactorRecoveryCodes(), Props, TextLink() (+19 more)

### Community 5 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 6 - "Button"
Cohesion: 0.10
Nodes (27): PasskeyRegistration(), Props, PasskeyVerify(), PasswordInput(), PreviousDeclarationEditor(), InputError(), Button(), Input() (+19 more)

### Community 8 - "card"
Cohesion: 0.20
Nodes (12): $type, $value, bg, bg, padding, shadow, card, bg (+4 more)

### Community 9 - "slide_search_core.py"
Cohesion: 0.12
Nodes (14): format_context(), format_result(), main(), calculate_pattern_break(), detect_domain(), get_background_config(), get_color_for_emotion(), get_layout_for_goal() (+6 more)

### Community 10 - "Controller"
Cohesion: 0.08
Nodes (10): BookController, CabinetController, {closure#2}(), Controller, DrawerController, AccessibilitySettingsController, OcrSettingsController, ProfileController (+2 more)

### Community 11 - "component-tokens.md"
Cohesion: 0.07
Nodes (32): Alert Spec, Badge Spec, Button Spec, Card Spec, Dialog Spec, Input Spec, Table Spec, Alert Tokens (+24 more)

### Community 12 - "global-search.tsx"
Cohesion: 0.07
Nodes (14): Props, DocumentMatch, DocumentResult, groupOrder, PageEntry, pages, PlaceResult, RecordMatch (+6 more)

### Community 13 - "re"
Cohesion: 0.09
Nodes (17): gemini-3.1-pro-preview, 12 Icon Categories, 15 Icon Styles, apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon() (+9 more)

### Community 14 - "document-browser.tsx"
Cohesion: 0.09
Nodes (36): DeclarationNumberSearchProps, chainArrowDots(), chainArrowHead(), ChainCard, clampScrollLeft(), cubicBezierPoint(), DocumentChain(), DocumentChainProps (+28 more)

### Community 15 - "OcrDocument"
Cohesion: 0.17
Nodes (4): OcrDocument, LocalThumbnailClient, OcrManager, {closure#1}()

### Community 16 - "react"
Cohesion: 0.08
Nodes (43): ClientOnly(), ClientPdfPreview(), DocumentHistory(), DocumentHistoryProps, loadPdfPreview(), pdfViewerFallback(), DocumentOcrPanel(), OcrIcon() (+35 more)

### Community 17 - "archive/index.tsx"
Cohesion: 0.11
Nodes (20): CABINET_SEARCH_FIELDS, CabinetSearchField, FilingItemPortalContext, FilingItemPortalProvider(), FilingItemPortalValue, useFilingItemPortal(), FilingItemViewerProps, OpenedFilingItem (+12 more)

### Community 18 - "Brand Context Sync"
Cohesion: 0.10
Nodes (27): Brand Guidelines Document Structure, Extractable Brand Fields, Brand Color Presets, /brand:update Command, Core Visual Elements, Visual Guidelines Template, extractColorsFromTable(), extractCoreAttributes() (+19 more)

### Community 19 - "Spacing Scale Tokens"
Cohesion: 0.09
Nodes (22): $type, $value, $type, $value, $type, $value, $type, $value (+14 more)

### Community 20 - "open-folder.tsx"
Cohesion: 0.13
Nodes (23): standingPose(), alignForReturn(), COVER_CLOSE, COVER_OPEN, EASE, INSTANT, lift(), OpenFolder() (+15 more)

### Community 21 - "use-document-upload.ts"
Cohesion: 0.10
Nodes (28): ArchiveLocationPreview(), DocumentUploadDialog(), DocumentRequestError, messageFrom(), requestJson(), UploadStage, useDocumentUpload(), checkAll() (+20 more)

### Community 22 - "dropdown-menu.md"
Cohesion: 0.60
Nodes (3): --anchor-width CSS variable, @base-ui/react/menu, closeOnClick defaults to false

### Community 23 - "Semantic Color Tokens"
Cohesion: 0.11
Nodes (19): $type, $value, background, foreground, muted-foreground, primary, primary-hover, secondary (+11 more)

### Community 24 - "HTML Token Validator"
Cohesion: 0.13
Nodes (12): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+4 more)

### Community 25 - "DeclarationRecorder"
Cohesion: 0.22
Nodes (3): Property, TaxDeclaration, DeclarationRecorder

### Community 26 - "Transformation Engine"
Cohesion: 0.15
Nodes (9): @base-ui/react/avatar, @base-ui/react/button, buttonVariants, @base-ui/react/checkbox, data-checked attribute, Collapsible Panel (formerly Content), @base-ui/react, @base-ui/react/separator (+1 more)

### Community 27 - "UploadDocument.php"
Cohesion: 0.21
Nodes (4): {closure#1}(), {closure#2}(), DocumentOcrDispatcher, UploadDocument

### Community 28 - "security.tsx"
Cohesion: 0.13
Nodes (13): EmptyState(), ManagePasskeys(), Props, ManageTwoFactor(), Props, OTP_MAX_LENGTH, useTwoFactorAuth(), UseTwoFactorAuthReturn (+5 more)

### Community 29 - "Brand Color Extraction Scripts"
Cohesion: 0.10
Nodes (19): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+11 more)

### Community 30 - "TestCase"
Cohesion: 0.06
Nodes (13): {closure#1}(), PasswordConfirmationTest, RegistrationTest, {closure#1}(), TwoFactorChallengeTest, BookmarksTest, {closure#1}(), DashboardTest (+5 more)

### Community 31 - "AppServiceProvider"
Cohesion: 0.15
Nodes (3): AppServiceProvider, {closure#1}(), FortifyServiceProvider

### Community 32 - "design/references/banner-sizes-and-styles.md"
Cohesion: 0.13
Nodes (14): 22 Art Direction Styles, Google Display Network Ad Sizes, Pinterest Research Queries, Print Specs, Social Art Direction Styles (Reuse from Banner), Social Platform Sizes, Screenshot Export (Chrome Headless / Playwright / Puppeteer), Social Photos 8-Step Workflow (+6 more)

### Community 34 - "User"
Cohesion: 0.17
Nodes (3): User, DatabaseSeeder, {closure#1}()

### Community 35 - "package.json Metadata"
Cohesion: 0.07
Nodes (30): private, $schema, type, babel-plugin-react-compiler, clsx, concurrently, @inertiajs/vite, @laravel/multiplex (+22 more)

### Community 36 - "npm Dependencies"
Cohesion: 0.08
Nodes (26): dependencies, @base-ui/react, class-variance-authority, clsx, concurrently, @inertiajs/react, @inertiajs/vite, input-otp (+18 more)

### Community 38 - "radius"
Cohesion: 0.19
Nodes (14): $type, $value, $type, $value, $type, $value, primitive, radius (+6 more)

### Community 39 - "ui-styling/SKILL.md"
Cohesion: 0.26
Nodes (8): WAI-ARIA Design Patterns, Canvas Visual Design Layer, MIT License (frontmatter), Radix UI, shadcn CLI (npx shadcn@latest init/add), shadcn/ui, Tailwind CSS, UI Styling Skill

### Community 40 - "Banner Design Skill"
Cohesion: 0.15
Nodes (15): 22 Art Direction Styles, Pinterest Research Queries, Platform Banner Sizes, Print Specs, SKILL.md (banner-design), ai-artist Skill, ai-multimodal Skill, AI Visual Generation (Gemini Flash / Pro) (+7 more)

### Community 41 - "generate-tokens.cjs"
Cohesion: 0.17
Nodes (16): assets/design-tokens.css, flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path (+8 more)

### Community 42 - "app-sidebar-header.tsx"
Cohesion: 0.24
Nodes (18): AppSidebarHeader(), ArchiveHeaderItem, ArchiveHeaderProvider(), SetTrailContext, TrailContext, useArchiveHeaderTrail(), useSetArchiveHeaderTrail(), Breadcrumbs() (+10 more)

### Community 43 - "filing-item-management.tsx"
Cohesion: 0.08
Nodes (20): lucide-react, sonner, DrawerIcon, DrawerIconProps, Collapsible(), CollapsibleContent(), CollapsibleTrigger(), IconProps (+12 more)

### Community 45 - "shadcn-accessibility.md"
Cohesion: 0.13
Nodes (17): @axe-core/react Automated Testing, Focus Management (focus trap, focus-visible rings), Form Accessibility (labels, aria-invalid, error association), Keyboard Navigation Patterns, ARIA Live Regions, prefers-reduced-motion Support, Screen Reader Support (ARIA labels, sr-only), WCAG Color Contrast (AA 4.5:1 / AAA 7:1) (+9 more)

### Community 47 - "open-book.tsx"
Cohesion: 0.08
Nodes (34): motion, BACKDROP, BookFlyer, BookPhase, COVER_CLOSE, FADE, FLIP, FlyerOuterAnimate (+26 more)

### Community 48 - "Illuminate\Http\JsonResponse"
Cohesion: 0.09
Nodes (9): ArchiveController, {closure#3}(), {closure#3}(), DocumentLinkController, DocumentOcrController, DocumentSearchController, GlobalSearchController, DocumentResource (+1 more)

### Community 49 - "Illuminate\Foundation\Http\FormRequest"
Cohesion: 0.07
Nodes (13): CreateNewUser, ResetUserPassword, PasswordValidationRules, ProfileValidationRules, LinkDocumentRequest, {closure#1}(), SaveDocumentFieldsRequest, StoreDocumentRequest (+5 more)

### Community 50 - "Illuminate\Http\Request"
Cohesion: 0.09
Nodes (12): HandleAppearance, HandleInertiaRequests, {closure#1}(), {closure#10}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#8}() (+4 more)

### Community 51 - "Brand Accessibility Checklists"
Cohesion: 0.12
Nodes (14): Accessibility Review (WCAG AA), Post-Approval Archival, Asset Approval Checklist, Legal & Compliance Review, Reviewer Sign-off, Industry Color Palette Examples, Color System Hierarchy, Relative Luminance & Contrast Ratio Formula (+6 more)

### Community 52 - "cn"
Cohesion: 0.09
Nodes (47): data-popup-open attribute, data-popup-open on menu buttons, Slot-based sidebar pieces via useRender, Base UI Tooltip, @base-ui/react, accountNavItems, AppSidebar(), mainNavItems (+39 more)

### Community 53 - "@base-ui/react"
Cohesion: 0.25
Nodes (10): @base-ui/react/toggle, data-pressed attribute, @base-ui/react/toggle-group, multiple boolean (replaces type), toggleVariants, ToggleGroup(), ToggleGroupContext, ToggleGroupItem() (+2 more)

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

### Community 59 - "Cabinet"
Cohesion: 0.13
Nodes (6): {closure#2}(), Cabinet, BookFactory, CabinetFactory, {closure#1}(), DrawerFactory

### Community 60 - "Routing by Task Type"
Cohesion: 0.33
Nodes (5): Multi-Skill Workflows, brand (external sub-skill), design-system (external sub-skill), New Design System Workflow, ui-styling (external sub-skill)

### Community 61 - "index.ts"
Cohesion: 0.18
Nodes (12): react, AppContent(), Props, AppShell(), Props, PlaceholderPatternProps, SidebarInset(), SidebarProvider() (+4 more)

### Community 62 - "TypeScript Config"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, module, moduleResolution (+7 more)

### Community 63 - "pathlib"
Cohesion: 0.06
Nodes (21): test_sync_parses_bundled_starter_template(), CIP Workflow, build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana(), load_env(), load_logo_image() (+13 more)

### Community 65 - "filing-item-pose.ts"
Cohesion: 0.21
Nodes (15): react-dom, FolderActor(), folderMotionTransform(), BoxQuadElement, cumulativeFromOffsetParents(), cumulativeTransform(), findPerspectiveRoot(), matrixFromBoxQuads() (+7 more)

### Community 66 - "canvas-design-system.md"
Cohesion: 0.20
Nodes (6): Analog Meditation (design movement), Chromatic Language (design movement), Concrete Poetry (design movement), Geometric Silence (design movement), Multi-Page Design Systems, Organic Systems (design movement)

### Community 67 - "Inertia\Testing\AssertableInertia"
Cohesion: 0.08
Nodes (37): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#1}(), {closure#10}(), {closure#11}(), {closure#12}() (+29 more)

### Community 68 - "regions.py"
Cohesion: 0.12
Nodes (5): hocr_text_regions(), OcrRegion, pdf_text_regions(), RegionPageAggregator, text_lines()

### Community 69 - "cn"
Cohesion: 0.07
Nodes (52): AppLogo(), AppHeader(), mainNavItems, Props, rightNavItems, UserInfo(), Props, UserMenuContent() (+44 more)

### Community 70 - "filing-cabinet.tsx"
Cohesion: 0.12
Nodes (16): CLOSEUP, CLOSEUP_FROM, CLOSEUP_TO, closeupPose(), DRAWER_TRAVEL, Face(), FADE, FilingCabinet() (+8 more)

### Community 71 - "Brand Asset Validator"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 72 - "cip/core.py"
Cohesion: 0.17
Nodes (6): detect_domain(), get_cip_brief(), _load_csv(), search(), search_all(), _search_csv()

### Community 73 - "navigation-menu.md"
Cohesion: 0.40
Nodes (5): Base UI NavigationMenu, 50ms hover open delay, NavigationMenuIndicator, --positioner-height / --positioner-width, viewport boolean wrapper prop

### Community 74 - "slides-layout-patterns.md"
Cohesion: 0.25
Nodes (5): Before-After-Bridge, search-slides.py (design-system), Slide Animation Classes, Slide Card & Metric Variants, Layout Selection by Use Case

### Community 75 - "Composer Scripts"
Cohesion: 0.15
Nodes (13): scripts, ci:check, dev, lint, lint:check, post-autoload-dump, post-create-project-cmd, post-root-package-install (+5 more)

### Community 77 - "Design Tokens Starter Structure"
Cohesion: 0.15
Nodes (12): component, $type, $value, dark, semantic, $schema, $type, $value (+4 more)

### Community 79 - "document-field-review.tsx"
Cohesion: 0.10
Nodes (35): alignItemWithTrigger={false}, --available-height / --transform-origin / --anchor-width / --anchor-height, Base UI Select, collisionAvoidance, onValueChange can receive null, DeclarationNumberSearch(), CabinetSearch(), Select() (+27 more)

### Community 80 - "main.py"
Cohesion: 0.21
Nodes (11): embedded_page_texts(), health(), merge_skipped_pages(), ocr_response(), page_has_text(), pages_from_sidecar(), pdf_response(), render_thumbnail() (+3 more)

### Community 82 - "AccessibilitySettingsTest"
Cohesion: 0.27
Nodes (4): AccessibilitySettingsTest, {closure#1}(), {closure#2}(), {closure#3}()

### Community 83 - "DocumentUploadTest.php"
Cohesion: 0.07
Nodes (6): EmailVerificationTest, {closure#4}(), {closure#5}(), {closure#2}(), {closure#3}(), {closure#4}()

### Community 84 - "logo/core.py"
Cohesion: 0.21
Nodes (5): detect_domain(), _load_csv(), search(), search_all(), _search_csv()

### Community 85 - "TDAMS Branding Assets"
Cohesion: 0.17
Nodes (10): Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System), Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System) (+2 more)

### Community 86 - "tailwind-utilities.md"
Cohesion: 0.22
Nodes (8): Intentional OKLCH Color Palette (2-5 colors), @theme Directive (CSS-based design tokens), Arbitrary Values ([...] syntax), Borders, Radius & Shadows, Color Scale (50-950) & Opacity Modifiers, Layout Utilities (Flexbox, Grid, Positioning, Z-Index), Spacing Scale (padding, margin, space-between), Typography Utilities

### Community 88 - "ilocos-norte-map.tsx"
Cohesion: 0.12
Nodes (17): @visx/geo, bucketFor(), DetailCell(), IlocosNorteMap(), IlocosNorteMapProps, LguRow, lguRows, LOT_BUCKETS (+9 more)

### Community 89 - "Composer Package Metadata"
Cohesion: 0.17
Nodes (11): autoload-dev, psr-4, description, keywords, license, minimum-stability, name, prefer-stable (+3 more)

### Community 90 - "Token Usage Validator"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 91 - "SKILL.md (design)"
Cohesion: 0.06
Nodes (35): Core Identity Deliverables, Digital Assets, Office Environment Signage, Stationery Set, Vehicle Branding, CIP BM25 Search Engine (core.py), CIP Deliverable Categories, Gemini Flash/Pro Image Models (+27 more)

### Community 92 - "render-html.py"
Cohesion: 0.21
Nodes (5): CIP HTML Presentation, generate_html(), get_deliverable_info(), get_image_base64(), main()

### Community 93 - "fetch-background.py"
Cohesion: 0.16
Nodes (9): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+1 more)

### Community 94 - "tailwind-customization.md"
Cohesion: 0.29
Nodes (7): @apply Directive, Custom Utilities (@utility), Custom Variants (@custom-variant), Dark Mode Configuration (darkMode class/media), Layer Organization (@layer base/components/utilities), Tailwind Plugins (typography, forms, container-queries, custom), Content Configuration & Safelist

### Community 95 - "tailwind-responsive.md"
Cohesion: 0.29
Nodes (6): Breakpoint System (sm 640 – 2xl 1536), Container Queries (@container), Custom Breakpoints (--breakpoint-3xl, --breakpoint-tablet), Max-Width & Range Queries (max-*:), Mobile-First Breakpoint Approach, Responsive Testing Checklist (320-1280px, 44x44 touch targets)

### Community 96 - "slides-copywriting-formulas.md"
Cohesion: 0.43
Nodes (6): AIDA (Attention-Interest-Desire-Action), Cost of Inaction, FAB (Features-Advantages-Benefits), Formula-to-Slide Mapping, Headline Patterns, PAS (Problem-Agitate-Solution)

### Community 98 - "Composer Dev Dependencies"
Cohesion: 0.18
Nodes (11): require-dev, fakerphp/faker, larastan/larastan, laravel/boost, laravel/pail, laravel/pao, laravel/pint, laravel/sail (+3 more)

### Community 99 - "slides-html-template.md"
Cohesion: 0.43
Nodes (3): 16:9 Slide Deck Base HTML Structure, Slide CSS Variables (Design Tokens), Slide Navigation (showSlide/nextSlide/prevSlide)

### Community 100 - "Motion Duration Tokens"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 101 - "shadcn-theming.md"
Cohesion: 0.23
Nodes (9): Base Color Presets (Slate, Gray, Zinc, Neutral, Stone), shadcn CSS Variable System (globals.css :root/.dark), Component Variant Customization (cva buttonVariants), Multiple Themes via data-theme Attributes, Dark Mode via next-themes ThemeProvider, Global --radius Variable, Style Variants (Default / New York, components.json), ThemeToggle Component (+1 more)

### Community 102 - ".mapFields"
Cohesion: 0.22
Nodes (3): DocumentFieldsController, OllamaClient, OllamaFieldSchema

### Community 103 - "test_regions.py"
Cohesion: 0.21
Nodes (5): ocr(), optimize_pdf(), process_upload(), require_token(), thumbnail()

### Community 105 - "button"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 106 - "TDAMS PHP backend conventions and reviews"
Cohesion: 0.33
Nodes (5): Review priorities for this application, Review workflow, TDAMS PHP backend conventions and reviews, Verification, Where PHP code belongs

### Community 107 - "Composer Requirements"
Cohesion: 0.22
Nodes (9): require, inertiajs/inertia-laravel, laravel/chisel, laravel/fortify, laravel/framework, laravel/scout, laravel/tinker, laravel/wayfinder (+1 more)

### Community 111 - "lg"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 112 - "Optional Native Binaries"
Cohesion: 0.25
Nodes (8): optionalDependencies, @laravel/multiplex, lightningcss-linux-x64-gnu, lightningcss-win32-x64-msvc, @rollup/rollup-linux-x64-gnu, @rollup/rollup-win32-x64-msvc, @tailwindcss/oxide-linux-x64-gnu, @tailwindcss/oxide-win32-x64-msvc

### Community 113 - "Document"
Cohesion: 0.10
Nodes (10): DocumentFileController, {closure#1}(), Document, {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#5}() (+2 more)

### Community 114 - "Composer Config"
Cohesion: 0.29
Nodes (7): pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, preferred-install, sort-packages

### Community 116 - "auth.ts"
Cohesion: 0.14
Nodes (15): useArchiveAnimations(), ArchiveAnimation, ArchiveAnimationKey, ArchiveAnimations, DEFAULTS, normalizeArchiveAnimations(), groups, Auth (+7 more)

### Community 117 - "sm"
Cohesion: 0.60
Nodes (5): sm, sm, sm, $type, $value

### Community 118 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 119 - "CI Workflow"
Cohesion: 0.33
Nodes (5): CI Job (ubuntu-latest, push main / pull_request), composer ci:check, composer setup, Node 22 (setup-node), PHP 8.3 + Composer v2 (setup-php)

### Community 120 - "npm Scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:ssr, check, check:fix, dev, test:frontend, types:check

### Community 124 - ".index"
Cohesion: 0.18
Nodes (8): DocumentController, {closure#1}(), DocumentSearcher, Checks, Existing organization, PHP backend review with Laravel Boost, Project setup, Request a review

### Community 125 - "use-appearance.tsx"
Cohesion: 0.13
Nodes (22): delay prop (formerly delayDuration), withApp(), Toaster(), TooltipProvider(), Appearance, applyTheme(), getStoredAppearance(), handleSystemThemeChange() (+14 more)

### Community 126 - "xl"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 127 - "npm Dev Dependencies"
Cohesion: 0.33
Nodes (6): devDependencies, babel-plugin-react-compiler, @laravel/vite-plugin-wayfinder, @rolldown/plugin-babel, @types/node, vite-plus

### Community 128 - "Bagong Pilipinas Emblems"
Cohesion: 0.33
Nodes (4): Bagong Pilipinas (Philippine Government Brand), Bagong Pilipinas (Philippine Government Brand), Philippine Flag Sun and Three Stars, Philippine Flag Sun and Three Stars

### Community 129 - "Ilocos Norte Seal"
Cohesion: 0.33
Nodes (5): Rice and Garlic Agricultural Symbols, Baroque Church Facade (likely Paoay Church), Founding Year 1818, Province of Ilocos Norte, Wind Turbines (Bangui Windmills)

### Community 130 - "messaging-framework.md"
Cohesion: 0.33
Nodes (5): Elevator Pitches (10/30/60s), Message Testing, Messaging Framework Hierarchy, Positioning Statement, Value Proposition Template

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
Cohesion: 0.08
Nodes (28): {closure#1}(), {closure#10}(), {closure#11}(), {closure#12}(), {closure#13}(), {closure#14}(), {closure#15}(), {closure#16}() (+20 more)

### Community 137 - "SecurityTest.php"
Cohesion: 0.22
Nodes (3): {closure#1}(), {closure#2}(), SecurityTest

### Community 138 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 139 - "input"
Cohesion: 0.29
Nodes (8): padding-x, input, $type, $value, focus-ring, padding-x, $type, $value

### Community 140 - "Login Cover Art"
Cohesion: 0.50
Nodes (3): Dark Neutral Palette (#171717 / #fafafa), Diagonal Line Pattern, Login Page

### Community 144 - "ring"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 158 - "16"
Cohesion: 0.67
Nodes (3): $type, $value, 16

### Community 159 - "SKILL.md (slides)"
Cohesion: 0.31
Nodes (6): Chart.js Integration, Slides Key Features, Slides Workflow, Slides (Built-in), SKILL.md (slides), Slides Skill

### Community 161 - "1"
Cohesion: 0.67
Nodes (3): $type, $value, 1

### Community 162 - "ShadcnInstaller"
Cohesion: 0.06
Nodes (3): main(), ShadcnInstaller, TestShadcnInstaller

### Community 163 - "$type"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 165 - "radius"
Cohesion: 0.60
Nodes (5): radius, radius, radius, $type, $value

### Community 166 - "3"
Cohesion: 0.67
Nodes (3): $type, $value, 3

### Community 170 - "PdfRegionTests"
Cohesion: 0.22
Nodes (3): pdf_fixture(), PdfRegionTests, fake_ocr()

### Community 171 - "run.sh"
Cohesion: 0.50
Nodes (3): OCR_API_TOKEN, run.sh script, WATCHFILES_FORCE_POLLING

### Community 173 - "BM25"
Cohesion: 0.18
Nodes (3): BM25, _load_csv(), _search_csv()

### Community 175 - "padding-y"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 176 - "8"
Cohesion: 0.67
Nodes (3): $type, $value, 8

### Community 177 - "Illuminate\Database\Eloquent\Model"
Cohesion: 0.25
Nodes (3): DeclarationOwner, Owner, {closure#1}()

### Community 178 - "slides-strategies.md"
Cohesion: 0.53
Nodes (3): Sales Pitch Deck, 15 Deck Strategies, YC Seed Deck

### Community 179 - "aliases"
Cohesion: 0.33
Nodes (6): aliases, components, hooks, lib, ui, utils

### Community 180 - "destructive"
Cohesion: 0.67
Nodes (3): destructive, $type, $value

### Community 181 - "destructive-foreground"
Cohesion: 0.67
Nodes (3): destructive-foreground, $type, $value

### Community 182 - "muted"
Cohesion: 0.67
Nodes (3): muted, $type, $value

### Community 183 - "primary-foreground"
Cohesion: 0.67
Nodes (3): primary-foreground, $type, $value

### Community 184 - "secondary-foreground"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

### Community 185 - "setup.sh"
Cohesion: 0.50
Nodes (3): COMPOSER_MEMORY_LIMIT, DEBIAN_FRONTEND, setup.sh script

### Community 186 - "upload"
Cohesion: 0.25
Nodes (4): read_upload(), upload(), UploadMemoryTests, process()

### Community 187 - "OcrDocumentTest.php"
Cohesion: 0.22
Nodes (19): {closure#10}(), {closure#11}(), {closure#12}(), {closure#13}(), {closure#14}(), {closure#15}(), {closure#16}(), {closure#17}() (+11 more)

### Community 188 - "tailwind"
Cohesion: 0.33
Nodes (6): tailwind, baseColor, config, css, cssVariables, prefix

### Community 189 - "project.md"
Cohesion: 0.23
Nodes (8): base, iconLibrary, rsc, $schema, style, tsx, new-york style (legacy), @radix-ui/react-* packages

### Community 190 - "pdf-thumbnail.tsx"
Cohesion: 0.10
Nodes (25): ClientPdfThumbnail(), DocumentThumbnail(), DocumentThumbnailProps, loadPdfThumbnail(), pdfFallback(), ThumbnailImage(), acquireCachedThumbnail(), acquireThumbnailSlot() (+17 more)

### Community 192 - "two-factor-challenge.tsx"
Cohesion: 0.36
Nodes (6): input-otp, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, TwoFactorChallenge()

### Community 195 - "alert.tsx"
Cohesion: 0.62
Nodes (5): AlertError(), Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 196 - "useRender hook"
Cohesion: 0.40
Nodes (3): Radix Slot, BreadcrumbLink, render={<Link />}

### Community 199 - "dialog.md"
Cohesion: 0.33
Nodes (3): Dialog Backdrop and Popup, Opacity and scale transitions, Per-side translate transitions

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1113 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SKILL.md (design-system)` connect `generate-tokens.cjs` to `component-tokens.md`, `Brand Context Sync`, `Token Architecture Layers`, `Token Usage Validator`, `pathlib`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `DEBIAN_FRONTEND`, `DEBIAN_FRONTEND`, `COMPOSER_MEMORY_LIMIT` to the rest of the system?**
  _110 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dialog.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10530612244897959 - nodes in this community are weakly interconnected._
- **Why does `Document` connect `Document` to `Inertia\Testing\AssertableInertia`, `.mapFields`, `DocumentSearchTest`, `OcrDocumentTest`, `Controller`, `DocumentFieldMappingTest.php`, `Illuminate\Database\Eloquent\Relations\BelongsTo`, `HeaderDocumentSearchTest`, `OcrDocument`, `Illuminate\Http\JsonResponse`, `Illuminate\Database\Eloquent\Model`, `OcrDocumentTest.php`, `DocumentUploadTest.php`, `DeclarationRecorder`, `UploadDocument.php`, `.index`, `DocumentLinkingTest`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `closed-folder-mesh.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11261261261261261 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `MIT License (frontmatter)` and `Apache License 2.0`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `shadcn CLI (npx shadcn@latest init/add)` and `requirements.txt`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._