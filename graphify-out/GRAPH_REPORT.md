# Graph Report - dtms  (2026-11-11)

## Corpus Check
- 462 files · ~2,597,288 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 52 file(s) not represented in the graph (top: (none) 16, .csv 16, .css 5)

## Summary
- 3804 nodes · 8874 edges · 205 communities (151 shown, 54 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 360 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a19e9f50`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SecurityTest.php
- app-sidebar-header.tsx
- app-header.tsx
- ocr-page-layout.tsx
- document-upload-dialog.tsx
- gray
- lucide-react
- DocumentSearchTest
- card
- slide_search_core.py
- logo/core.py
- component-tokens.md
- sidebar.tsx
- re
- Illuminate\Http\JsonResponse
- OcrDocument
- react
- closed-folder-mesh.tsx
- Brand Context Sync
- Spacing Scale Tokens
- open-folder.tsx
- upload
- Illuminate\Http\Request
- Semantic Color Tokens
- HTML Token Validator
- Laravel\Fortify\Features
- filing-item-pose.ts
- filing-item-management.tsx
- TaxDeclaration
- Brand Color Extraction Scripts
- TestCase
- GroqFieldMappingTest
- design/references/banner-sizes-and-styles.md
- archive/index.tsx
- dashboard/index.tsx
- package.json Metadata
- npm Dependencies
- CabinetsTest
- radius
- global-search.tsx
- Banner Design Skill
- generate-tokens.cjs
- OcrCorrectionTest
- document-thumbnail.tsx
- shadcn-accessibility.md
- TestTailwindConfigGenerator
- open-book.tsx
- components.json
- Illuminate\Foundation\Http\FormRequest
- Illuminate\Http\RedirectResponse
- Brand Accessibility Checklists
- editable-info-section.tsx
- slides-html-template.md
- test_regions.py
- Brand Typography & Voice
- Token Architecture Layers
- Brand Asset Organization
- Font Size Tokens
- OcrReviewTest
- logo-design.md
- DocumentResource
- TypeScript Config
- pathlib
- Transformation Engine
- document-chain.tsx
- document-browser.tsx
- Inertia\Testing\AssertableInertia
- main.py
- dropdown-menu.tsx
- BM25
- Brand Asset Validator
- cip/core.py
- use-document-upload.ts
- @base-ui/react
- Composer Scripts
- FoldersTest
- Design Tokens Starter Structure
- OcrDocumentTest.php
- document-browser.tsx
- DocumentUploadTest.php
- two-factor-setup-modal.tsx
- AccessibilitySettingsTest
- ui-styling/SKILL.md
- update.sh
- TDAMS Branding Assets
- SKILL.md (design)
- OcrContentParser
- OcrRecoveryTest.php
- Composer Package Metadata
- Token Usage Validator
- BedrockFieldMappingTest
- Button
- json
- button
- OcrReviewTest.php
- TailwindConfigGenerator
- Composer Dev Dependencies
- generate-slide.py
- Motion Duration Tokens
- DataSettingsTest
- OcrSetting
- messaging-framework.md
- Document.php
- OcrReviewFilterTest
- Composer Requirements
- cip/generate.py
- Book
- shadcn-theming.md
- DocumentBrowser
- Optional Native Binaries
- Document
- Composer Config
- .test_node_check_parses_generated_config
- documents.ts
- cip/search.py
- Product
- CI Workflow
- npm Scripts
- main
- Document Upload Tests
- ArchiveTest
- DocumentController.php
- use-appearance.tsx
- xl
- npm Dev Dependencies
- Bagong Pilipinas Emblems
- Ilocos Norte Seal
- render-html.py
- PSR-4 Autoload
- Laravel Extra Config
- Updating the Lightsail installation
- 0001_01_01_000000_create_application_schema.php
- apple-touch-icon.png
- index.ts
- DocumentFieldDefinitions
- vite.config.ts
- Login Cover Art
- setup-ocr.sh
- Dependabot Config
- input
- regions.py
- pnpm Workspace
- slides-copywriting-formulas.md
- robots.txt
- DocumentLinkingTest
- Routing by Task Type
- LocalOcrClient
- ShadcnInstaller
- canvas-design-system.md
- none
- RuntimeException
- tailwind-utilities.md
- OcrDocumentTest
- PdfRegionTests
- run.sh
- $type
- Cabinet
- radius
- lg
- sm
- tailwind-customization.md
- padding-y
- 16
- 1
- 3
- ring
- 8
- setup.sh
- OcrContentTest
- destructive
- BM25
- destructive-foreground
- muted
- primary-foreground
- secondary-foreground
- use-archive-animations.ts
- BM25
- folder-motion-enhanced-review.mjs
- cip-deliverable-guide.md
- tailwind-responsive.md
- PaddleOcrClient
- SecurityTest.php
- Apache License 2.0

## God Nodes (most connected - your core abstractions)
1. `cn()` - 181 edges
2. `Button()` - 110 edges
3. `Document` - 109 edges
4. `react` - 104 edges
5. `TestCase` - 71 edges
6. `lucide-react` - 60 edges
7. `TailwindConfigGenerator` - 58 edges
8. `User` - 58 edges
9. `@inertiajs/react` - 53 edges
10. `InputError()` - 52 edges

## Surprising Connections (you probably didn't know these)
- `Existing organization` --references--> `BookController`  [INFERRED]
  docs/backend-review.md → app/Http/Controllers/BookController.php
- `Where PHP code belongs` --references--> `DeclarationRecorder`  [INFERRED]
  .ai/guidelines/php-backend-review.md → app/Services/Documents/DeclarationRecorder.php
- `Existing organization` --references--> `DocumentController`  [INFERRED]
  docs/backend-review.md → app/Http/Controllers/DocumentController.php
- `Where PHP code belongs` --references--> `DocumentSearcher`  [INFERRED]
  .ai/guidelines/php-backend-review.md → app/Services/Documents/DocumentSearcher.php
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

## Communities (205 total, 54 thin omitted)

### Community 0 - "SecurityTest.php"
Cohesion: 0.16
Nodes (3): User, DatabaseSeeder, {closure#1}()

### Community 1 - "app-sidebar-header.tsx"
Cohesion: 0.36
Nodes (14): AppSidebarHeader(), useArchiveHeaderTrail(), Breadcrumbs(), Breadcrumb(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList() (+6 more)

### Community 2 - "app-header.tsx"
Cohesion: 0.13
Nodes (35): AppLogo(), AppHeader(), mainNavItems, Props, rightNavItems, UserInfo(), Avatar(), AvatarFallback() (+27 more)

### Community 3 - "ocr-page-layout.tsx"
Cohesion: 0.15
Nodes (21): contentText(), displayOcrText(), hasPosition(), hasUncoveredText(), OcrContentBlock, OcrRegion, wordPositions(), OcrContent() (+13 more)

### Community 4 - "document-upload-dialog.tsx"
Cohesion: 0.10
Nodes (42): PasskeyItem(), Props, DocumentOcrPanel(), OcrPayload, statusMessage(), OcrCorrectionDialog(), OcrIcon(), ClientPdfPreview() (+34 more)

### Community 5 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 6 - "lucide-react"
Cohesion: 0.11
Nodes (16): lucide-react, EmptyState(), ManagePasskeys(), Props, ManageTwoFactor(), Props, useTwoFactorAuth(), Heading() (+8 more)

### Community 8 - "card"
Cohesion: 0.20
Nodes (12): $type, $value, bg, bg, padding, shadow, card, bg (+4 more)

### Community 9 - "slide_search_core.py"
Cohesion: 0.12
Nodes (14): format_context(), format_result(), main(), calculate_pattern_break(), detect_domain(), get_background_config(), get_color_for_emotion(), get_layout_for_goal() (+6 more)

### Community 10 - "logo/core.py"
Cohesion: 0.21
Nodes (5): detect_domain(), _load_csv(), search(), search_all(), _search_csv()

### Community 11 - "component-tokens.md"
Cohesion: 0.07
Nodes (32): Alert Spec, Badge Spec, Button Spec, Card Spec, Dialog Spec, Input Spec, Table Spec, Alert Tokens (+24 more)

### Community 12 - "sidebar.tsx"
Cohesion: 0.15
Nodes (28): AppSidebar(), NavFooter(), CollapsibleNavItem(), NavMain(), Collapsible(), CollapsibleContent(), CollapsibleTrigger(), SidebarContent() (+20 more)

### Community 13 - "re"
Cohesion: 0.09
Nodes (17): gemini-3.1-pro-preview, 12 Icon Categories, 15 Icon Styles, apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon() (+9 more)

### Community 14 - "Illuminate\Http\JsonResponse"
Cohesion: 0.20
Nodes (5): DocumentOcrController, {closure#2}(), DocumentOcrDispatcher, DocumentOcrEditor, UploadDocument

### Community 15 - "OcrDocument"
Cohesion: 0.15
Nodes (6): OcrDocument, {closure#1}(), LocalThumbnailClient, OcrManager, OcrPdfOptimizer, {closure#1}()

### Community 16 - "react"
Cohesion: 0.14
Nodes (18): react, ClientOnly(), ClientPdfPreview(), DocumentHistory(), DocumentHistoryProps, loadPdfPreview(), pdfViewerFallback(), PannableViewport() (+10 more)

### Community 17 - "closed-folder-mesh.tsx"
Cohesion: 0.07
Nodes (44): BookCoverFace(), COVER_LOGO_SIZE, coverTitleLines(), ClosedBookMesh(), BOOK_POP, CabinetDrawer(), CabinetDrawerProps, drawerRimOffset() (+36 more)

### Community 18 - "Brand Context Sync"
Cohesion: 0.10
Nodes (27): Brand Guidelines Document Structure, Extractable Brand Fields, Brand Color Presets, /brand:update Command, Core Visual Elements, Visual Guidelines Template, extractColorsFromTable(), extractCoreAttributes() (+19 more)

### Community 19 - "Spacing Scale Tokens"
Cohesion: 0.09
Nodes (22): $type, $value, $type, $value, $type, $value, $type, $value (+14 more)

### Community 20 - "open-folder.tsx"
Cohesion: 0.11
Nodes (24): motion, standingPose(), alignForReturn(), COVER_CLOSE, COVER_OPEN, EASE, INSTANT, lift() (+16 more)

### Community 21 - "upload"
Cohesion: 0.17
Nodes (9): ocr(), optimize_pdf(), process_upload(), read_upload(), require_token(), thumbnail(), upload(), UploadMemoryTests (+1 more)

### Community 22 - "Illuminate\Http\Request"
Cohesion: 0.09
Nodes (12): HandleAppearance, HandleInertiaRequests, {closure#1}(), {closure#10}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#8}() (+4 more)

### Community 23 - "Semantic Color Tokens"
Cohesion: 0.11
Nodes (19): $type, $value, background, foreground, muted-foreground, primary, primary-hover, secondary (+11 more)

### Community 24 - "HTML Token Validator"
Cohesion: 0.13
Nodes (12): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+4 more)

### Community 25 - "Laravel\Fortify\Features"
Cohesion: 0.07
Nodes (3): AuthenticationTest, PasswordResetTest, VerificationNotificationTest

### Community 26 - "filing-item-pose.ts"
Cohesion: 0.22
Nodes (14): react-dom, FolderActor(), folderMotionTransform(), BoxQuadElement, cumulativeFromOffsetParents(), cumulativeTransform(), findPerspectiveRoot(), matrixFromBoxQuads() (+6 more)

### Community 27 - "filing-item-management.tsx"
Cohesion: 0.05
Nodes (31): sonner, CABINET_SEARCH_FIELDS, CabinetSearchField, DrawerIcon, DrawerIconProps, REST, RotatableFilingItem(), ArchivePlacementCabinet (+23 more)

### Community 28 - "TaxDeclaration"
Cohesion: 0.09
Nodes (6): DeclarationOwner, Owner, Property, TaxDeclaration, {closure#1}(), DeclarationRecorder

### Community 29 - "Brand Color Extraction Scripts"
Cohesion: 0.10
Nodes (19): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+11 more)

### Community 30 - "TestCase"
Cohesion: 0.06
Nodes (14): {closure#1}(), PasswordConfirmationTest, RegistrationTest, {closure#1}(), TwoFactorChallengeTest, BookmarksTest, {closure#1}(), DashboardTest (+6 more)

### Community 32 - "design/references/banner-sizes-and-styles.md"
Cohesion: 0.11
Nodes (16): 22 Art Direction Styles, Google Display Network Ad Sizes, Pinterest Research Queries, Print Specs, Logo Workflow, Social Art Direction Styles (Reuse from Banner), Social Platform Sizes, Screenshot Export (Chrome Headless / Playwright / Puppeteer) (+8 more)

### Community 33 - "archive/index.tsx"
Cohesion: 0.11
Nodes (15): ArchiveHeaderItem, ArchiveHeaderProvider(), SetTrailContext, TrailContext, useSetArchiveHeaderTrail(), buttonVariants, Archive(), openPreviousDeclaration() (+7 more)

### Community 34 - "dashboard/index.tsx"
Cohesion: 0.07
Nodes (42): @visx/geo, AlertError(), AppLogoIcon(), Props, TwoFactorRecoveryCodes(), Alert(), AlertDescription(), AlertTitle() (+34 more)

### Community 35 - "package.json Metadata"
Cohesion: 0.09
Nodes (22): private, $schema, type, babel-plugin-react-compiler, clsx, concurrently, @laravel/multiplex, lightningcss-linux-x64-gnu (+14 more)

### Community 36 - "npm Dependencies"
Cohesion: 0.08
Nodes (26): dependencies, @base-ui/react, class-variance-authority, clsx, concurrently, @inertiajs/react, @inertiajs/vite, input-otp (+18 more)

### Community 38 - "radius"
Cohesion: 0.19
Nodes (14): $type, $value, $type, $value, $type, $value, primitive, radius (+6 more)

### Community 39 - "global-search.tsx"
Cohesion: 0.06
Nodes (26): accountNavItems, mainNavItems, documentHint(), DocumentMatch, DocumentResult, fetchSearchResults(), GlobalSearch(), PageEntry (+18 more)

### Community 40 - "Banner Design Skill"
Cohesion: 0.15
Nodes (15): 22 Art Direction Styles, Pinterest Research Queries, Platform Banner Sizes, Print Specs, SKILL.md (banner-design), ai-artist Skill, ai-multimodal Skill, AI Visual Generation (Gemini Flash / Pro) (+7 more)

### Community 41 - "generate-tokens.cjs"
Cohesion: 0.16
Nodes (16): assets/design-tokens.css, flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path (+8 more)

### Community 43 - "document-thumbnail.tsx"
Cohesion: 0.14
Nodes (24): ClientPdfThumbnail(), DocumentThumbnailProps, loadPdfThumbnail(), pdfFallback(), ThumbnailImage(), acquireCachedThumbnail(), acquireThumbnailSlot(), CachedThumbnail (+16 more)

### Community 45 - "shadcn-accessibility.md"
Cohesion: 0.13
Nodes (17): @axe-core/react Automated Testing, Focus Management (focus trap, focus-visible rings), Form Accessibility (labels, aria-invalid, error association), Keyboard Navigation Patterns, ARIA Live Regions, prefers-reduced-motion Support, Screen Reader Support (ARIA labels, sr-only), WCAG Color Contrast (AA 4.5:1 / AAA 7:1) (+9 more)

### Community 47 - "open-book.tsx"
Cohesion: 0.08
Nodes (36): BACKDROP, BookFlyer, BookPhase, COVER_CLOSE, FADE, FLIP, FlyerOuterAnimate, flyerOuterMotion() (+28 more)

### Community 48 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, base, iconLibrary (+10 more)

### Community 49 - "Illuminate\Foundation\Http\FormRequest"
Cohesion: 0.05
Nodes (14): CreateNewUser, ResetUserPassword, PasswordValidationRules, ProfileValidationRules, LinkDocumentRequest, {closure#1}(), SaveDocumentFieldsRequest, StoreDocumentRequest (+6 more)

### Community 50 - "Illuminate\Http\RedirectResponse"
Cohesion: 0.07
Nodes (13): ArchiveController, BookController, CabinetController, Controller, DrawerController, GlobalSearchController, AccessibilitySettingsController, DataSettingsController (+5 more)

### Community 51 - "Brand Accessibility Checklists"
Cohesion: 0.12
Nodes (14): Accessibility Review (WCAG AA), Post-Approval Archival, Asset Approval Checklist, Legal & Compliance Review, Reviewer Sign-off, Industry Color Palette Examples, Color System Hierarchy, Relative Luminance & Contrast Ratio Formula (+6 more)

### Community 52 - "editable-info-section.tsx"
Cohesion: 0.17
Nodes (11): DeclarationNumberSearch(), DeclarationNumberSearchProps, BoundaryCell(), BoundaryCompass(), EditableInfoSection(), finishEditing(), save(), changedDocumentFields() (+3 more)

### Community 53 - "slides-html-template.md"
Cohesion: 0.16
Nodes (13): search-slides.py (design-system), Slide Animation Classes, 16:9 Slide Deck Base HTML Structure, Chart.js Integration, Slide CSS Variables (Design Tokens), Slide Navigation (showSlide/nextSlide/prevSlide), Slides Key Features, Slide Card & Metric Variants (+5 more)

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

### Community 60 - "logo-design.md"
Cohesion: 0.13
Nodes (10): CIP BM25 Search Engine (core.py), Color Harmony Types, Color Combinations by Industry, Logo Industry Defaults, Logo BM25 Search Engine (core.py), Logo Style Categories (55+), Core Logo Types (Wordmark, Lettermark, Pictorial, Abstract, Mascot, Emblem, Combination), Logo Style Selection Matrix (+2 more)

### Community 61 - "DocumentResource"
Cohesion: 0.18
Nodes (4): {closure#3}(), DocumentLinkController, DocumentResource, DeclarationChain

### Community 62 - "TypeScript Config"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, module, moduleResolution (+7 more)

### Community 63 - "pathlib"
Cohesion: 0.11
Nodes (9): test_sync_parses_bundled_starter_template(), main(), _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation(), Node.js 18+ Requirement, pytest Dev Dependencies (pytest>=8.0.0, pytest-cov, pytest-mock), requirements.txt (tests) (+1 more)

### Community 64 - "Transformation Engine"
Cohesion: 0.07
Nodes (27): @base-ui/react/avatar, Radix Slot, BreadcrumbLink, render={<Link />}, @base-ui/react/button, buttonVariants, @base-ui/react/checkbox, data-checked attribute (+19 more)

### Community 65 - "document-chain.tsx"
Cohesion: 0.21
Nodes (14): chainArrowDots(), chainArrowHead(), ChainCard, clampScrollLeft(), cubicBezierPoint(), DocumentChain(), DocumentChainProps, roundCoord() (+6 more)

### Community 66 - "document-browser.tsx"
Cohesion: 0.15
Nodes (16): DOCUMENT_VIEWS, DocumentBrowserProps, Documents(), ArchivePlacementDrawer, ArchivePlacementItem, DocumentFieldValues, DocumentOcrReviewFilter, DocumentSortDirection (+8 more)

### Community 67 - "Inertia\Testing\AssertableInertia"
Cohesion: 0.05
Nodes (51): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#1}(), {closure#10}(), {closure#11}(), {closure#12}() (+43 more)

### Community 68 - "main.py"
Cohesion: 0.21
Nodes (11): embedded_page_texts(), health(), merge_skipped_pages(), ocr_response(), page_has_text(), pages_from_sidecar(), pdf_response(), render_thumbnail() (+3 more)

### Community 69 - "dropdown-menu.tsx"
Cohesion: 0.13
Nodes (27): ViewerActions(), NavUser(), Props, UserMenuContent(), DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuGroup() (+19 more)

### Community 70 - "BM25"
Cohesion: 0.18
Nodes (3): BM25, _load_csv(), _search_csv()

### Community 71 - "Brand Asset Validator"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 72 - "cip/core.py"
Cohesion: 0.19
Nodes (6): detect_domain(), get_cip_brief(), _load_csv(), search(), search_all(), _search_csv()

### Community 73 - "use-document-upload.ts"
Cohesion: 0.09
Nodes (34): BoundaryEditor(), FieldRow(), DocumentRequestError, messageFrom(), requestJson(), UploadStage, useDocumentUpload(), checkAll() (+26 more)

### Community 74 - "@base-ui/react"
Cohesion: 0.14
Nodes (15): @base-ui/react/separator, decorative prop dropped, @base-ui/react/toggle, data-pressed attribute, @base-ui/react/toggle-group, multiple boolean (replaces type), toggleVariants, @base-ui/react (+7 more)

### Community 75 - "Composer Scripts"
Cohesion: 0.15
Nodes (13): scripts, ci:check, dev, lint, lint:check, post-autoload-dump, post-create-project-cmd, post-root-package-install (+5 more)

### Community 77 - "Design Tokens Starter Structure"
Cohesion: 0.15
Nodes (12): component, $type, $value, dark, semantic, $schema, $type, $value (+4 more)

### Community 78 - "OcrDocumentTest.php"
Cohesion: 0.16
Nodes (24): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#1}(), {closure#10}(), {closure#11}(), {closure#12}() (+16 more)

### Community 79 - "document-browser.tsx"
Cohesion: 0.14
Nodes (24): alignItemWithTrigger={false}, --available-height / --transform-origin / --anchor-width / --anchor-height, Base UI Select, collisionAvoidance, onValueChange can receive null, CabinetSearch(), Select(), SelectContent() (+16 more)

### Community 80 - "DocumentUploadTest.php"
Cohesion: 0.07
Nodes (8): EmailVerificationTest, {closure#4}(), {closure#5}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#1}(), {closure#2}()

### Community 81 - "two-factor-setup-modal.tsx"
Cohesion: 0.12
Nodes (18): Non-primitive wrappers (alert, card, input, skeleton, spinner), input-otp, GridScanIcon(), Props, TwoFactorSetupModal(), TwoFactorSetupStep(), TwoFactorVerificationStep(), OTP_MAX_LENGTH (+10 more)

### Community 82 - "AccessibilitySettingsTest"
Cohesion: 0.27
Nodes (4): AccessibilitySettingsTest, {closure#1}(), {closure#2}(), {closure#3}()

### Community 83 - "ui-styling/SKILL.md"
Cohesion: 0.26
Nodes (8): WAI-ARIA Design Patterns, Canvas Visual Design Layer, MIT License (frontmatter), Radix UI, shadcn CLI (npx shadcn@latest init/add), shadcn/ui, Tailwind CSS, UI Styling Skill

### Community 84 - "update.sh"
Cohesion: 0.40
Nodes (4): COMPOSER_ALLOW_SUPERUSER, COMPOSER_MEMORY_LIMIT, set_runtime_permissions(), update.sh script

### Community 85 - "TDAMS Branding Assets"
Cohesion: 0.17
Nodes (10): Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System), Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System) (+2 more)

### Community 86 - "SKILL.md (design)"
Cohesion: 0.14
Nodes (15): CIP Mockup Base Prompt Structure, Lighting & Context Modifiers, CIP Negative Prompts, CIP Style Modifiers, CIP Design Styles (Corporate Minimal, Modern Tech, Luxury Premium, ...), CIP Color Psychology, Primary Color Meanings, Logo Core Prompt Structure (+7 more)

### Community 89 - "Composer Package Metadata"
Cohesion: 0.17
Nodes (11): autoload-dev, psr-4, description, keywords, license, minimum-stability, name, prefer-stable (+3 more)

### Community 90 - "Token Usage Validator"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 92 - "Button"
Cohesion: 0.08
Nodes (29): @inertiajs/react, @laravel/passkeys, PasskeyRegistration(), Props, PasskeyVerify(), Props, PasswordInput(), InputError() (+21 more)

### Community 93 - "json"
Cohesion: 0.16
Nodes (9): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+1 more)

### Community 94 - "button"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 95 - "OcrReviewTest.php"
Cohesion: 0.20
Nodes (6): {closure#1}(), {closure#2}(), {closure#3}(), {closure#1}(), {closure#2}(), {closure#3}()

### Community 98 - "Composer Dev Dependencies"
Cohesion: 0.18
Nodes (11): require-dev, fakerphp/faker, larastan/larastan, laravel/boost, laravel/pail, laravel/pao, laravel/pint, laravel/sail (+3 more)

### Community 99 - "generate-slide.py"
Cohesion: 0.13
Nodes (11): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+3 more)

### Community 100 - "Motion Duration Tokens"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 103 - "messaging-framework.md"
Cohesion: 0.33
Nodes (5): Elevator Pitches (10/30/60s), Message Testing, Messaging Framework Hierarchy, Positioning Statement, Value Proposition Template

### Community 105 - "Document.php"
Cohesion: 0.29
Nodes (5): {closure#1}(), {closure#2}(), {closure#1}(), {closure#2}(), {closure#3}()

### Community 107 - "Composer Requirements"
Cohesion: 0.22
Nodes (9): require, inertiajs/inertia-laravel, laravel/chisel, laravel/fortify, laravel/framework, laravel/scout, laravel/tinker, laravel/wayfinder (+1 more)

### Community 108 - "cip/generate.py"
Cohesion: 0.16
Nodes (9): CIP Workflow, Gemini Flash/Pro Image Models, build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana(), load_env(), load_logo_image() (+1 more)

### Community 109 - "Book"
Cohesion: 0.06
Nodes (20): {closure#2}(), {closure#3}(), {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#5}(), {closure#6}() (+12 more)

### Community 110 - "shadcn-theming.md"
Cohesion: 0.23
Nodes (9): Base Color Presets (Slate, Gray, Zinc, Neutral, Stone), shadcn CSS Variable System (globals.css :root/.dark), Component Variant Customization (cva buttonVariants), Multiple Themes via data-theme Attributes, Dark Mode via next-themes ThemeProvider, Global --radius Variable, Style Variants (Default / New York, components.json), ThemeToggle Component (+1 more)

### Community 111 - "DocumentBrowser"
Cohesion: 0.37
Nodes (12): DocumentBrowser(), applyDateFilters(), changeOcrReview(), changePage(), changeQuery(), changeSearchField(), changeSort(), clearDebounce() (+4 more)

### Community 112 - "Optional Native Binaries"
Cohesion: 0.25
Nodes (8): optionalDependencies, @laravel/multiplex, lightningcss-linux-x64-gnu, lightningcss-win32-x64-msvc, @rollup/rollup-linux-x64-gnu, @rollup/rollup-win32-x64-msvc, @tailwindcss/oxide-linux-x64-gnu, @tailwindcss/oxide-win32-x64-msvc

### Community 113 - "Document"
Cohesion: 0.07
Nodes (14): DocumentFieldsController, DocumentFileController, {closure#1}(), DocumentSearchController, Document, {closure#1}(), {closure#2}(), {closure#1}() (+6 more)

### Community 114 - "Composer Config"
Cohesion: 0.29
Nodes (7): pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, preferred-install, sort-packages

### Community 116 - "documents.ts"
Cohesion: 0.23
Nodes (16): DocumentThumbnail(), OcrReviewBadge(), formatDate(), formatFileSize(), DocumentCardView(), DocumentCardViewProps, DocumentListView(), DocumentListViewProps (+8 more)

### Community 117 - "cip/search.py"
Cohesion: 0.32
Nodes (3): format_brief(), format_results(), main()

### Community 118 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 119 - "CI Workflow"
Cohesion: 0.33
Nodes (5): CI Job (ubuntu-latest, push main / pull_request), composer ci:check, composer setup, Node 22 (setup-node), PHP 8.3 + Composer v2 (setup-php)

### Community 120 - "npm Scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:ssr, check, check:fix, dev, test:frontend, types:check

### Community 124 - "DocumentController.php"
Cohesion: 0.11
Nodes (15): Review priorities for this application, Review workflow, TDAMS PHP backend conventions and reviews, Verification, Where PHP code belongs, {closure#1}(), DocumentController, DocumentFieldMapper (+7 more)

### Community 125 - "use-appearance.tsx"
Cohesion: 0.16
Nodes (21): Base UI Tooltip, delay prop (formerly delayDuration), withApp(), Toaster(), TooltipProvider(), Appearance, applyTheme(), getStoredAppearance() (+13 more)

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

### Community 130 - "render-html.py"
Cohesion: 0.21
Nodes (5): CIP HTML Presentation, generate_html(), get_deliverable_info(), get_image_base64(), main()

### Community 131 - "PSR-4 Autoload"
Cohesion: 0.40
Nodes (5): autoload, psr-4, App\\, Database\\Factories\\, Database\\Seeders\\

### Community 132 - "Laravel Extra Config"
Cohesion: 0.40
Nodes (5): extra, laravel, post-create-project, dont-discover, installer

### Community 134 - "Updating the Lightsail installation"
Cohesion: 0.15
Nodes (11): 1 GB Lightsail: FastAPI + Paddle OCR + compression, Checks, Install, Limits on 1 GB / 2 vCPU / 40 GB, 1. Build the React app on your PC, 2. Pause the app before replacing code, 3. Copy the latest source and build, 4. Finish the update (+3 more)

### Community 135 - "0001_01_01_000000_create_application_schema.php"
Cohesion: 0.07
Nodes (30): {closure#1}(), {closure#10}(), {closure#11}(), {closure#12}(), {closure#13}(), {closure#14}(), {closure#15}(), {closure#16}() (+22 more)

### Community 137 - "index.ts"
Cohesion: 0.18
Nodes (12): AppContent(), Props, AppShell(), Props, SidebarInset(), SidebarProvider(), AppHeaderLayout(), AppLayout() (+4 more)

### Community 138 - "DocumentFieldDefinitions"
Cohesion: 0.27
Nodes (3): DocumentFieldDefinitions, {closure#1}(), {closure#2}()

### Community 139 - "vite.config.ts"
Cohesion: 0.22
Nodes (7): @inertiajs/vite, laravel-vite-plugin, @laravel/vite-plugin-wayfinder, @rolldown/plugin-babel, @tailwindcss/vite, vite-plus, @vitejs/plugin-react

### Community 140 - "Login Cover Art"
Cohesion: 0.50
Nodes (3): Dark Neutral Palette (#171717 / #fafafa), Diagonal Line Pattern, Login Page

### Community 144 - "input"
Cohesion: 0.29
Nodes (8): padding-x, input, $type, $value, focus-ring, padding-x, $type, $value

### Community 145 - "regions.py"
Cohesion: 0.09
Nodes (6): hocr_text_regions(), OcrRegion, OcrWord, pdf_text_regions(), RegionPageAggregator, text_lines()

### Community 147 - "slides-copywriting-formulas.md"
Cohesion: 0.19
Nodes (10): AIDA (Attention-Interest-Desire-Action), Before-After-Bridge, Cost of Inaction, FAB (Features-Advantages-Benefits), Formula-to-Slide Mapping, Headline Patterns, PAS (Problem-Agitate-Solution), Sales Pitch Deck (+2 more)

### Community 158 - "Routing by Task Type"
Cohesion: 0.29
Nodes (6): Multi-Skill Workflows, brand (external sub-skill), Complete Brand Package Workflow, design-system (external sub-skill), New Design System Workflow, ui-styling (external sub-skill)

### Community 162 - "ShadcnInstaller"
Cohesion: 0.06
Nodes (3): main(), ShadcnInstaller, TestShadcnInstaller

### Community 164 - "canvas-design-system.md"
Cohesion: 0.20
Nodes (6): Analog Meditation (design movement), Chromatic Language (design movement), Concrete Poetry (design movement), Geometric Silence (design movement), Multi-Page Design Systems, Organic Systems (design movement)

### Community 166 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 167 - "RuntimeException"
Cohesion: 0.12
Nodes (4): BedrockClient, DocumentFieldSchema, GroqClient, OllamaClient

### Community 168 - "tailwind-utilities.md"
Cohesion: 0.22
Nodes (8): Intentional OKLCH Color Palette (2-5 colors), @theme Directive (CSS-based design tokens), Arbitrary Values ([...] syntax), Borders, Radius & Shadows, Color Scale (50-950) & Opacity Modifiers, Layout Utilities (Flexbox, Grid, Positioning, Z-Index), Spacing Scale (padding, margin, space-between), Typography Utilities

### Community 170 - "PdfRegionTests"
Cohesion: 0.20
Nodes (3): pdf_fixture(), PdfRegionTests, fake_ocr()

### Community 171 - "run.sh"
Cohesion: 0.50
Nodes (3): OCR_API_TOKEN, run.sh script, WATCHFILES_FORCE_POLLING

### Community 173 - "$type"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 174 - "Cabinet"
Cohesion: 0.25
Nodes (3): {closure#1}(), {closure#2}(), HeaderDocumentSearchTest

### Community 175 - "radius"
Cohesion: 0.60
Nodes (5): radius, radius, radius, $type, $value

### Community 176 - "lg"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 177 - "sm"
Cohesion: 0.60
Nodes (5): sm, sm, sm, $type, $value

### Community 178 - "tailwind-customization.md"
Cohesion: 0.29
Nodes (7): @apply Directive, Custom Utilities (@utility), Custom Variants (@custom-variant), Dark Mode Configuration (darkMode class/media), Layer Organization (@layer base/components/utilities), Tailwind Plugins (typography, forms, container-queries, custom), Content Configuration & Safelist

### Community 179 - "padding-y"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 180 - "16"
Cohesion: 0.67
Nodes (3): $type, $value, 16

### Community 181 - "1"
Cohesion: 0.67
Nodes (3): $type, $value, 1

### Community 182 - "3"
Cohesion: 0.67
Nodes (3): $type, $value, 3

### Community 183 - "ring"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 184 - "8"
Cohesion: 0.67
Nodes (3): $type, $value, 8

### Community 185 - "setup.sh"
Cohesion: 0.50
Nodes (3): COMPOSER_MEMORY_LIMIT, DEBIAN_FRONTEND, setup.sh script

### Community 187 - "destructive"
Cohesion: 0.67
Nodes (3): destructive, $type, $value

### Community 189 - "destructive-foreground"
Cohesion: 0.67
Nodes (3): destructive-foreground, $type, $value

### Community 190 - "muted"
Cohesion: 0.67
Nodes (3): muted, $type, $value

### Community 191 - "primary-foreground"
Cohesion: 0.67
Nodes (3): primary-foreground, $type, $value

### Community 192 - "secondary-foreground"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

### Community 193 - "use-archive-animations.ts"
Cohesion: 0.16
Nodes (14): ArchiveAnimation, ArchiveAnimationKey, ArchiveAnimations, DEFAULTS, normalizeArchiveAnimations(), Auth, Passkey, TwoFactorSecretKey (+6 more)

### Community 195 - "folder-motion-enhanced-review.mjs"
Cohesion: 0.10
Nodes (11): createPanScrollController(), ScrollTarget, DocumentDatePreset, getDocumentDatePresets(), subtractCalendarMonths(), mappingModelLabel(), resolveMappingModel(), doc (+3 more)

### Community 196 - "cip-deliverable-guide.md"
Cohesion: 0.33
Nodes (6): Core Identity Deliverables, Digital Assets, Office Environment Signage, Stationery Set, Vehicle Branding, CIP Deliverable Categories

### Community 199 - "tailwind-responsive.md"
Cohesion: 0.29
Nodes (6): Breakpoint System (sm 640 – 2xl 1536), Container Queries (@container), Custom Breakpoints (--breakpoint-3xl, --breakpoint-tablet), Max-Width & Range Queries (max-*:), Mobile-First Breakpoint Approach, Responsive Testing Checklist (320-1280px, 44x44 touch targets)

### Community 201 - "SecurityTest.php"
Cohesion: 0.09
Nodes (4): UserFactory, {closure#1}(), {closure#2}(), SecurityTest

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
- **112 isolated node(s):** `DEBIAN_FRONTEND`, `DEBIAN_FRONTEND`, `COMPOSER_MEMORY_LIMIT`, `COMPOSER_ALLOW_SUPERUSER`, `COMPOSER_MEMORY_LIMIT` (+107 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1211 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **54 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Document` connect `Document` to `DocumentSearchTest`, `Illuminate\Http\JsonResponse`, `OcrDocument`, `TaxDeclaration`, `DocumentLinkingTest`, `GroqFieldMappingTest`, `OcrDocumentTest`, `OcrCorrectionTest`, `Cabinet`, `Illuminate\Http\RedirectResponse`, `OcrReviewTest`, `DocumentResource`, `Inertia\Testing\AssertableInertia`, `OcrDocumentTest.php`, `DocumentUploadTest.php`, `BedrockFieldMappingTest`, `OcrReviewTest.php`, `DataSettingsTest`, `Document.php`, `OcrReviewFilterTest`, `Book`, `DocumentController.php`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `DEBIAN_FRONTEND`, `DEBIAN_FRONTEND`, `COMPOSER_MEMORY_LIMIT` to the rest of the system?**
  _112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app-header.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12624584717607973 - nodes in this community are weakly interconnected._
- **Why does `SKILL.md (design-system)` connect `generate-tokens.cjs` to `Token Architecture Layers`, `Brand Context Sync`, `component-tokens.md`, `Token Usage Validator`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `document-upload-dialog.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10138248847926268 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `MIT License (frontmatter)` and `Apache License 2.0`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `shadcn CLI (npx shadcn@latest init/add)` and `requirements.txt`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._