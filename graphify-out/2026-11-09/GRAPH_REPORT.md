# Graph Report - dtms  (2026-11-09)

## Corpus Check
- 422 files · ~753,568 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 52 file(s) not represented in the graph (top: (none) 16, .csv 16, .css 5)

## Summary
- 3488 nodes · 7923 edges · 169 communities (121 shown, 48 thin omitted)
- Extraction: 95% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 353 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d553563c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- security.tsx
- closed-folder-mesh.tsx
- generate-slide.py
- document-upload-dialog.tsx
- gray
- @inertiajs/react
- DocumentSearchTest
- button
- slide_search_core.py
- Illuminate\Http\Request
- component-tokens.md
- global-search.tsx
- re
- lucide-react
- OcrDocument
- react
- cip/generate.py
- Brand Context Sync
- Spacing Scale Tokens
- open-folder.tsx
- Book
- auth.ts
- Semantic Color Tokens
- HTML Token Validator
- BM25
- app-header.tsx
- filing-item-management.tsx
- render-html.py
- Brand Color Extraction Scripts
- TestCase
- AppServiceProvider
- design/references/banner-sizes-and-styles.md
- ilocos-norte-map.tsx
- User
- package.json Metadata
- npm Dependencies
- CabinetsTest
- radius
- ui-styling/SKILL.md
- Banner Design Skill
- generate-tokens.cjs
- DeclarationRecorder
- BM25
- shadcn-accessibility.md
- TestTailwindConfigGenerator
- open-book.tsx
- SecurityTest.php
- Illuminate\Foundation\Http\FormRequest
- Brand Accessibility Checklists
- sidebar.tsx
- toggle-group.tsx
- test_regions.py
- Brand Typography & Voice
- Token Architecture Layers
- Brand Asset Organization
- Font Size Tokens
- upload
- index.ts
- TypeScript Config
- pathlib
- RuntimeException
- filing-item-pose.ts
- use-document-upload.ts
- Inertia\Testing\AssertableInertia
- regions.py
- dropdown-menu.tsx
- filing-cabinet.tsx
- Brand Asset Validator
- cip/core.py
- slides-copywriting-formulas.md
- Transformation Engine
- Composer Scripts
- DocumentFieldMappingTest.php
- Design Tokens Starter Structure
- .generate_config_string
- select.tsx
- main.py
- two-factor-setup-modal.tsx
- AccessibilitySettingsTest
- app-sidebar-header.tsx
- archive/index.tsx
- TDAMS Branding Assets
- TailwindConfigGenerator
- Composer Package Metadata
- Token Usage Validator
- SKILL.md (design)
- pdf-thumbnail.tsx
- json
- BM25
- DocumentFieldMappingTest.php
- Composer Dev Dependencies
- FoldersTest
- Motion Duration Tokens
- tailwind
- .mapFields
- messaging-framework.md
- OcrExtractor
- Composer Requirements
- OcrSettingsTest
- Cabinet
- shadcn-theming.md
- Optional Native Binaries
- Document
- Composer Config
- primary-hover
- Product
- CI Workflow
- npm Scripts
- Laravel\Fortify\Features
- Document Upload Tests
- ArchiveTest
- DocumentController.php
- use-appearance.tsx
- xl
- npm Dev Dependencies
- Bagong Pilipinas Emblems
- Ilocos Norte Seal
- PSR-4 Autoload
- Laravel Extra Config
- 1 GB Lightsail: FastAPI + Paddle OCR + compression
- 0001_01_01_000000_create_application_schema.php
- apple-touch-icon.png
- none
- Login Cover Art
- setup-ocr.sh
- Dependabot Config
- ring
- pnpm Workspace
- canvas-design-system.md
- robots.txt
- DocumentLinkingTest
- tailwind-customization.md
- tailwind-responsive.md
- ShadcnInstaller
- OcrDocumentTest
- PdfRegionTests
- run.sh
- HeaderDocumentSearchTest
- tailwind-utilities.md
- setup.sh
- test_regions.py
- OcrDocumentTest.php
- cip/core.py
- OcrSetting
- PaddleOcrClient
- auth.ts
- Apache License 2.0

## God Nodes (most connected - your core abstractions)
1. `cn()` - 168 edges
2. `react` - 97 edges
3. `Button()` - 97 edges
4. `Document` - 85 edges
5. `TailwindConfigGenerator` - 58 edges
6. `TestCase` - 55 edges
7. `@inertiajs/react` - 53 edges
8. `lucide-react` - 52 edges
9. `InputError()` - 48 edges
10. `User` - 47 edges

## Surprising Connections (you probably didn't know these)
- `Existing organization` --references--> `BookController`  [INFERRED]
  docs/backend-review.md → app/Http/Controllers/BookController.php
- `Where PHP code belongs` --references--> `DeclarationRecorder`  [INFERRED]
  .ai/guidelines/php-backend-review.md → app/Services/Documents/DeclarationRecorder.php
- `Existing organization` --references--> `DocumentController`  [INFERRED]
  docs/backend-review.md → app/Http/Controllers/DocumentController.php
- `Where PHP code belongs` --references--> `DocumentSearcher`  [INFERRED]
  .ai/guidelines/php-backend-review.md → app/Services/Documents/DocumentSearcher.php
- `Button Component Classes (@apply)` --semantically_similar_to--> `Button Tokens`  [INFERRED] [semantically similar]
  .github/prompts/design-system/references/tailwind-integration.md → .github/prompts/design-system/references/component-tokens.md

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

## Communities (169 total, 48 thin omitted)

### Community 0 - "Button"
Cohesion: 0.07
Nodes (28): @laravel/passkeys, sonner, Props, PasskeyVerify(), Props, PasswordInput(), InputError(), TextLink() (+20 more)

### Community 1 - "security.tsx"
Cohesion: 0.10
Nodes (17): EmptyState(), ManagePasskeys(), Props, PasskeyRegistration(), ManageTwoFactor(), Props, useTwoFactorAuth(), UseTwoFactorAuthReturn (+9 more)

### Community 2 - "closed-folder-mesh.tsx"
Cohesion: 0.14
Nodes (25): BookCoverFace(), COVER_LOGO_SIZE, coverTitleLines(), ClosedBookMesh(), BOOK_POP, CabinetDrawer(), CabinetDrawerProps, drawerRimOffset() (+17 more)

### Community 3 - "generate-slide.py"
Cohesion: 0.12
Nodes (11): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+3 more)

### Community 4 - "document-upload-dialog.tsx"
Cohesion: 0.15
Nodes (30): PasskeyItem(), Props, TwoFactorSetupModal(), TwoFactorSetupStep(), Button(), Dialog(), DialogClose(), DialogContent() (+22 more)

### Community 5 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 6 - "@inertiajs/react"
Cohesion: 0.10
Nodes (27): class-variance-authority, @inertiajs/react, AppLogoIcon(), Props, TwoFactorRecoveryCodes(), Props, Badge(), badgeVariants (+19 more)

### Community 8 - "button"
Cohesion: 0.06
Nodes (45): $type, $value, $type, $value, bg, fg, font-size, hover-bg (+37 more)

### Community 9 - "slide_search_core.py"
Cohesion: 0.12
Nodes (14): format_context(), format_result(), main(), calculate_pattern_break(), detect_domain(), get_background_config(), get_color_for_emotion(), get_layout_for_goal() (+6 more)

### Community 10 - "Illuminate\Http\Request"
Cohesion: 0.05
Nodes (19): BookController, {closure#6}(), CabinetController, DrawerController, AccessibilitySettingsController, OcrSettingsController, ProfileController, HandleAppearance (+11 more)

### Community 11 - "component-tokens.md"
Cohesion: 0.07
Nodes (32): Alert Spec, Badge Spec, Button Spec, Card Spec, Dialog Spec, Input Spec, Table Spec, Alert Tokens (+24 more)

### Community 12 - "global-search.tsx"
Cohesion: 0.06
Nodes (22): accountNavItems, mainNavItems, documentHint(), DocumentMatch, DocumentResult, GlobalSearch(), groupOrder, PageEntry (+14 more)

### Community 13 - "re"
Cohesion: 0.09
Nodes (17): gemini-3.1-pro-preview, 12 Icon Categories, 15 Icon Styles, apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon() (+9 more)

### Community 14 - "lucide-react"
Cohesion: 0.07
Nodes (48): lucide-react, react-dom, DeclarationNumberSearchProps, chainArrowDots(), chainArrowHead(), ChainCard, clampScrollLeft(), cubicBezierPoint() (+40 more)

### Community 15 - "OcrDocument"
Cohesion: 0.13
Nodes (5): OcrDocument, LocalThumbnailClient, OcrManager, {closure#2}(), {closure#1}()

### Community 16 - "react"
Cohesion: 0.07
Nodes (45): react, ClientOnly(), ClientPdfPreview(), DocumentHistory(), DocumentHistoryProps, loadPdfPreview(), pdfViewerFallback(), DocumentOcrPanel() (+37 more)

### Community 17 - "cip/generate.py"
Cohesion: 0.19
Nodes (7): build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana(), load_env(), load_logo_image(), main()

### Community 18 - "Brand Context Sync"
Cohesion: 0.10
Nodes (27): Brand Guidelines Document Structure, Extractable Brand Fields, Brand Color Presets, /brand:update Command, Core Visual Elements, Visual Guidelines Template, extractColorsFromTable(), extractCoreAttributes() (+19 more)

### Community 19 - "Spacing Scale Tokens"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 20 - "open-folder.tsx"
Cohesion: 0.11
Nodes (25): standingPose(), alignForReturn(), COVER_CLOSE, COVER_OPEN, EASE, INSTANT, lift(), OpenFolder() (+17 more)

### Community 21 - "Book"
Cohesion: 0.10
Nodes (13): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#5}(), {closure#4}(), {closure#6}(), {closure#7}() (+5 more)

### Community 22 - "auth.ts"
Cohesion: 0.22
Nodes (9): Auth, Passkey, TwoFactorSecretKey, TwoFactorSetupData, User, InertiaConfig, @inertiajs/core, InputHTMLAttributes (+1 more)

### Community 23 - "Semantic Color Tokens"
Cohesion: 0.06
Nodes (31): $type, $value, background, destructive, destructive-foreground, foreground, muted, muted-foreground (+23 more)

### Community 24 - "HTML Token Validator"
Cohesion: 0.13
Nodes (12): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+4 more)

### Community 26 - "app-header.tsx"
Cohesion: 0.11
Nodes (32): Base UI NavigationMenu, data-popup-open attribute, 50ms hover open delay, NavigationMenuIndicator, --positioner-height / --positioner-width, viewport boolean wrapper prop, data-popup-open on menu buttons, AppLogo() (+24 more)

### Community 27 - "filing-item-management.tsx"
Cohesion: 0.11
Nodes (16): DrawerIcon, DrawerIconProps, RotatableFilingItem(), Collapsible(), CollapsibleContent(), CollapsibleTrigger(), Books(), bookFromDrawer() (+8 more)

### Community 28 - "render-html.py"
Cohesion: 0.07
Nodes (19): Core Identity Deliverables, Digital Assets, Office Environment Signage, Stationery Set, Vehicle Branding, CIP BM25 Search Engine (core.py), CIP Workflow, CIP Deliverable Categories (+11 more)

### Community 29 - "Brand Color Extraction Scripts"
Cohesion: 0.10
Nodes (19): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+11 more)

### Community 30 - "TestCase"
Cohesion: 0.05
Nodes (14): AuthenticationTest, {closure#1}(), PasswordConfirmationTest, RegistrationTest, BookmarksTest, {closure#1}(), DashboardTest, DocumentUploadOptionsTest (+6 more)

### Community 32 - "design/references/banner-sizes-and-styles.md"
Cohesion: 0.11
Nodes (16): 22 Art Direction Styles, Google Display Network Ad Sizes, Pinterest Research Queries, Print Specs, Logo Workflow, Social Art Direction Styles (Reuse from Banner), Social Platform Sizes, Screenshot Export (Chrome Headless / Playwright / Puppeteer) (+8 more)

### Community 33 - "ilocos-norte-map.tsx"
Cohesion: 0.13
Nodes (15): @visx/geo, DetailCell(), IlocosNorteMapProps, LguRow, lguRows, LOT_BUCKETS, provinceOutline, provinceTotals (+7 more)

### Community 34 - "User"
Cohesion: 0.12
Nodes (3): User, UserFactory, DatabaseSeeder

### Community 35 - "package.json Metadata"
Cohesion: 0.08
Nodes (28): private, $schema, type, babel-plugin-react-compiler, clsx, concurrently, @inertiajs/vite, @laravel/multiplex (+20 more)

### Community 36 - "npm Dependencies"
Cohesion: 0.08
Nodes (26): dependencies, @base-ui/react, class-variance-authority, clsx, concurrently, @inertiajs/react, @inertiajs/vite, input-otp (+18 more)

### Community 38 - "radius"
Cohesion: 0.12
Nodes (23): $type, $value, lg, sm, $type, $value, $type, $value (+15 more)

### Community 39 - "ui-styling/SKILL.md"
Cohesion: 0.26
Nodes (8): WAI-ARIA Design Patterns, Canvas Visual Design Layer, MIT License (frontmatter), Radix UI, shadcn CLI (npx shadcn@latest init/add), shadcn/ui, Tailwind CSS, UI Styling Skill

### Community 40 - "Banner Design Skill"
Cohesion: 0.15
Nodes (15): 22 Art Direction Styles, Pinterest Research Queries, Platform Banner Sizes, Print Specs, SKILL.md (banner-design), ai-artist Skill, ai-multimodal Skill, AI Visual Generation (Gemini Flash / Pro) (+7 more)

### Community 41 - "generate-tokens.cjs"
Cohesion: 0.17
Nodes (16): assets/design-tokens.css, flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path (+8 more)

### Community 42 - "DeclarationRecorder"
Cohesion: 0.14
Nodes (5): Owner, Property, TaxDeclaration, {closure#1}(), DeclarationRecorder

### Community 45 - "shadcn-accessibility.md"
Cohesion: 0.13
Nodes (17): @axe-core/react Automated Testing, Focus Management (focus trap, focus-visible rings), Form Accessibility (labels, aria-invalid, error association), Keyboard Navigation Patterns, ARIA Live Regions, prefers-reduced-motion Support, Screen Reader Support (ARIA labels, sr-only), WCAG Color Contrast (AA 4.5:1 / AAA 7:1) (+9 more)

### Community 47 - "open-book.tsx"
Cohesion: 0.09
Nodes (31): BACKDROP, BookFlyer, BookPhase, COVER_CLOSE, FADE, FLIP, FlyerOuterAnimate, flyerOuterMotion() (+23 more)

### Community 48 - "SecurityTest.php"
Cohesion: 0.22
Nodes (3): {closure#1}(), {closure#2}(), SecurityTest

### Community 49 - "Illuminate\Foundation\Http\FormRequest"
Cohesion: 0.07
Nodes (11): CreateNewUser, ResetUserPassword, PasswordValidationRules, ProfileValidationRules, SecurityController, LinkDocumentRequest, PasswordUpdateRequest, ProfileDeleteRequest (+3 more)

### Community 51 - "Brand Accessibility Checklists"
Cohesion: 0.12
Nodes (14): Accessibility Review (WCAG AA), Post-Approval Archival, Asset Approval Checklist, Legal & Compliance Review, Reviewer Sign-off, Industry Color Palette Examples, Color System Hierarchy, Relative Luminance & Contrast Ratio Formula (+6 more)

### Community 52 - "sidebar.tsx"
Cohesion: 0.12
Nodes (44): AppSidebar(), NavFooter(), CollapsibleNavItem(), NavMain(), NavUser(), CardFooter(), Separator(), Sheet() (+36 more)

### Community 53 - "toggle-group.tsx"
Cohesion: 0.18
Nodes (13): @base-ui/react/separator, decorative prop dropped, @base-ui/react/toggle, data-pressed attribute, @base-ui/react/toggle-group, multiple boolean (replaces type), toggleVariants, @base-ui/react (+5 more)

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

### Community 59 - "upload"
Cohesion: 0.25
Nodes (4): read_upload(), upload(), UploadMemoryTests, process()

### Community 61 - "index.ts"
Cohesion: 0.19
Nodes (12): AppContent(), Props, AppShell(), Props, SidebarInset(), SidebarProvider(), AppHeaderLayout(), AppLayout() (+4 more)

### Community 62 - "TypeScript Config"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, module, moduleResolution (+7 more)

### Community 63 - "pathlib"
Cohesion: 0.10
Nodes (10): test_sync_parses_bundled_starter_template(), main(), _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation(), Node.js 18+ Requirement, pytest Dev Dependencies (pytest>=8.0.0, pytest-cov, pytest-mock), main() (+2 more)

### Community 65 - "filing-item-pose.ts"
Cohesion: 0.24
Nodes (13): FolderActor(), folderMotionTransform(), BoxQuadElement, cumulativeFromOffsetParents(), cumulativeTransform(), findPerspectiveRoot(), matrixFromBoxQuads(), measureLiftedSlotPose() (+5 more)

### Community 66 - "use-document-upload.ts"
Cohesion: 0.10
Nodes (32): DocumentUploadDialog(), DocumentRequestError, messageFrom(), requestJson(), UploadStage, useDocumentUpload(), checkAll(), close() (+24 more)

### Community 67 - "Inertia\Testing\AssertableInertia"
Cohesion: 0.07
Nodes (43): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#1}(), {closure#10}(), {closure#11}(), {closure#12}() (+35 more)

### Community 68 - "regions.py"
Cohesion: 0.12
Nodes (5): hocr_text_regions(), OcrRegion, pdf_text_regions(), RegionPageAggregator, text_lines()

### Community 69 - "dropdown-menu.tsx"
Cohesion: 0.14
Nodes (20): Props, UserMenuContent(), DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuGroup(), DropdownMenuItem(), DropdownMenuLabel() (+12 more)

### Community 70 - "filing-cabinet.tsx"
Cohesion: 0.10
Nodes (21): CLOSEUP, CLOSEUP_FROM, CLOSEUP_TO, closeupPose(), DRAWER_TRAVEL, Face(), FADE, FilingCabinet() (+13 more)

### Community 71 - "Brand Asset Validator"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 72 - "cip/core.py"
Cohesion: 0.21
Nodes (5): detect_domain(), _load_csv(), search(), search_all(), _search_csv()

### Community 73 - "slides-copywriting-formulas.md"
Cohesion: 0.09
Nodes (23): AIDA (Attention-Interest-Desire-Action), Before-After-Bridge, Cost of Inaction, FAB (Features-Advantages-Benefits), Formula-to-Slide Mapping, Headline Patterns, PAS (Problem-Agitate-Solution), search-slides.py (design-system) (+15 more)

### Community 74 - "Transformation Engine"
Cohesion: 0.06
Nodes (31): aliases, components, hooks, lib, ui, utils, base, iconLibrary (+23 more)

### Community 75 - "Composer Scripts"
Cohesion: 0.15
Nodes (13): scripts, ci:check, dev, lint, lint:check, post-autoload-dump, post-create-project-cmd, post-root-package-install (+5 more)

### Community 77 - "Design Tokens Starter Structure"
Cohesion: 0.15
Nodes (12): $type, $value, dark, semantic, primitive, $schema, $type, $value (+4 more)

### Community 79 - "select.tsx"
Cohesion: 0.08
Nodes (42): alignItemWithTrigger={false}, --available-height / --transform-origin / --anchor-width / --anchor-height, Base UI Select, collisionAvoidance, onValueChange can receive null, DeclarationNumberSearch(), CabinetSearch(), Label() (+34 more)

### Community 80 - "main.py"
Cohesion: 0.21
Nodes (11): embedded_page_texts(), health(), merge_skipped_pages(), ocr_response(), page_has_text(), pages_from_sidecar(), pdf_response(), render_thumbnail() (+3 more)

### Community 81 - "two-factor-setup-modal.tsx"
Cohesion: 0.13
Nodes (20): Non-primitive wrappers (alert, card, input, skeleton, spinner), input-otp, AlertError(), GridScanIcon(), Props, TwoFactorVerificationStep(), OTP_MAX_LENGTH, Alert() (+12 more)

### Community 82 - "AccessibilitySettingsTest"
Cohesion: 0.27
Nodes (4): AccessibilitySettingsTest, {closure#1}(), {closure#2}(), {closure#3}()

### Community 83 - "app-sidebar-header.tsx"
Cohesion: 0.46
Nodes (11): AppSidebarHeader(), useArchiveHeaderTrail(), Breadcrumbs(), Breadcrumb(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList() (+3 more)

### Community 84 - "archive/index.tsx"
Cohesion: 0.11
Nodes (17): CABINET_SEARCH_FIELDS, CabinetSearchField, FilingItemPortalContext, FilingItemPortalProvider(), FilingItemPortalValue, ArchiveHeaderItem, ArchiveHeaderProvider(), SetTrailContext (+9 more)

### Community 85 - "TDAMS Branding Assets"
Cohesion: 0.17
Nodes (10): Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System), Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System) (+2 more)

### Community 89 - "Composer Package Metadata"
Cohesion: 0.17
Nodes (11): autoload-dev, psr-4, description, keywords, license, minimum-stability, name, prefer-stable (+3 more)

### Community 90 - "Token Usage Validator"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 91 - "SKILL.md (design)"
Cohesion: 0.07
Nodes (28): Gemini Flash/Pro Image Models, CIP Mockup Base Prompt Structure, Lighting & Context Modifiers, CIP Negative Prompts, CIP Style Modifiers, CIP Design Styles (Corporate Minimal, Modern Tech, Luxury Premium, ...), CIP Color Psychology, Multi-Skill Workflows (+20 more)

### Community 92 - "pdf-thumbnail.tsx"
Cohesion: 0.08
Nodes (30): react-pdf, ClientPdfThumbnail(), DocumentThumbnail(), DocumentThumbnailProps, loadPdfThumbnail(), pdfFallback(), ThumbnailImage(), acquireCachedThumbnail() (+22 more)

### Community 93 - "json"
Cohesion: 0.15
Nodes (9): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+1 more)

### Community 94 - "BM25"
Cohesion: 0.18
Nodes (3): BM25, _load_csv(), _search_csv()

### Community 95 - "DocumentFieldMappingTest.php"
Cohesion: 0.08
Nodes (5): EmailVerificationTest, {closure#4}(), {closure#5}(), {closure#3}(), {closure#4}()

### Community 98 - "Composer Dev Dependencies"
Cohesion: 0.18
Nodes (11): require-dev, fakerphp/faker, larastan/larastan, laravel/boost, laravel/pail, laravel/pao, laravel/pint, laravel/sail (+3 more)

### Community 100 - "Motion Duration Tokens"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 101 - "tailwind"
Cohesion: 0.33
Nodes (6): tailwind, baseColor, config, css, cssVariables, prefix

### Community 103 - "messaging-framework.md"
Cohesion: 0.33
Nodes (5): Elevator Pitches (10/30/60s), Message Testing, Messaging Framework Hierarchy, Positioning Statement, Value Proposition Template

### Community 107 - "Composer Requirements"
Cohesion: 0.22
Nodes (9): require, inertiajs/inertia-laravel, laravel/chisel, laravel/fortify, laravel/framework, laravel/scout, laravel/tinker, laravel/wayfinder (+1 more)

### Community 109 - "Cabinet"
Cohesion: 0.07
Nodes (13): {closure#2}(), {closure#2}(), {closure#2}(), Cabinet, DeclarationOwner, {closure#1}(), {closure#2}(), Drawer (+5 more)

### Community 110 - "shadcn-theming.md"
Cohesion: 0.23
Nodes (9): Base Color Presets (Slate, Gray, Zinc, Neutral, Stone), shadcn CSS Variable System (globals.css :root/.dark), Component Variant Customization (cva buttonVariants), Multiple Themes via data-theme Attributes, Dark Mode via next-themes ThemeProvider, Global --radius Variable, Style Variants (Default / New York, components.json), ThemeToggle Component (+1 more)

### Community 112 - "Optional Native Binaries"
Cohesion: 0.25
Nodes (8): optionalDependencies, @laravel/multiplex, lightningcss-linux-x64-gnu, lightningcss-win32-x64-msvc, @rollup/rollup-linux-x64-gnu, @rollup/rollup-win32-x64-msvc, @tailwindcss/oxide-linux-x64-gnu, @tailwindcss/oxide-win32-x64-msvc

### Community 113 - "Document"
Cohesion: 0.06
Nodes (22): ArchiveController, {closure#3}(), Controller, DocumentFieldsController, DocumentFileController, {closure#3}(), DocumentLinkController, DocumentOcrController (+14 more)

### Community 114 - "Composer Config"
Cohesion: 0.29
Nodes (7): pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, preferred-install, sort-packages

### Community 116 - "primary-hover"
Cohesion: 0.67
Nodes (3): primary-hover, $type, $value

### Community 118 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 119 - "CI Workflow"
Cohesion: 0.33
Nodes (5): CI Job (ubuntu-latest, push main / pull_request), composer ci:check, composer setup, Node 22 (setup-node), PHP 8.3 + Composer v2 (setup-php)

### Community 120 - "npm Scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:ssr, check, check:fix, dev, test:frontend, types:check

### Community 121 - "Laravel\Fortify\Features"
Cohesion: 0.08
Nodes (4): PasswordResetTest, {closure#1}(), TwoFactorChallengeTest, VerificationNotificationTest

### Community 124 - "DocumentController.php"
Cohesion: 0.05
Nodes (18): Review priorities for this application, Review workflow, TDAMS PHP backend conventions and reviews, Verification, Where PHP code belongs, {closure#1}(), DocumentController, {closure#1}() (+10 more)

### Community 125 - "use-appearance.tsx"
Cohesion: 0.14
Nodes (23): Base UI Tooltip, delay prop (formerly delayDuration), withApp(), Toaster(), TooltipProvider(), Appearance, applyTheme(), getStoredAppearance() (+15 more)

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

### Community 138 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 140 - "Login Cover Art"
Cohesion: 0.50
Nodes (3): Dark Neutral Palette (#171717 / #fafafa), Diagonal Line Pattern, Login Page

### Community 144 - "ring"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 147 - "canvas-design-system.md"
Cohesion: 0.20
Nodes (6): Analog Meditation (design movement), Chromatic Language (design movement), Concrete Poetry (design movement), Geometric Silence (design movement), Multi-Page Design Systems, Organic Systems (design movement)

### Community 158 - "tailwind-customization.md"
Cohesion: 0.29
Nodes (7): @apply Directive, Custom Utilities (@utility), Custom Variants (@custom-variant), Dark Mode Configuration (darkMode class/media), Layer Organization (@layer base/components/utilities), Tailwind Plugins (typography, forms, container-queries, custom), Content Configuration & Safelist

### Community 159 - "tailwind-responsive.md"
Cohesion: 0.29
Nodes (6): Breakpoint System (sm 640 – 2xl 1536), Container Queries (@container), Custom Breakpoints (--breakpoint-3xl, --breakpoint-tablet), Max-Width & Range Queries (max-*:), Mobile-First Breakpoint Approach, Responsive Testing Checklist (320-1280px, 44x44 touch targets)

### Community 162 - "ShadcnInstaller"
Cohesion: 0.05
Nodes (3): main(), ShadcnInstaller, TestShadcnInstaller

### Community 170 - "PdfRegionTests"
Cohesion: 0.22
Nodes (3): pdf_fixture(), PdfRegionTests, fake_ocr()

### Community 171 - "run.sh"
Cohesion: 0.50
Nodes (3): OCR_API_TOKEN, run.sh script, WATCHFILES_FORCE_POLLING

### Community 174 - "HeaderDocumentSearchTest"
Cohesion: 0.25
Nodes (3): {closure#1}(), {closure#2}(), HeaderDocumentSearchTest

### Community 178 - "tailwind-utilities.md"
Cohesion: 0.22
Nodes (8): Intentional OKLCH Color Palette (2-5 colors), @theme Directive (CSS-based design tokens), Arbitrary Values ([...] syntax), Borders, Radius & Shadows, Color Scale (50-950) & Opacity Modifiers, Layout Utilities (Flexbox, Grid, Positioning, Z-Index), Spacing Scale (padding, margin, space-between), Typography Utilities

### Community 185 - "setup.sh"
Cohesion: 0.50
Nodes (3): COMPOSER_MEMORY_LIMIT, DEBIAN_FRONTEND, setup.sh script

### Community 186 - "test_regions.py"
Cohesion: 0.21
Nodes (5): ocr(), optimize_pdf(), process_upload(), require_token(), thumbnail()

### Community 187 - "OcrDocumentTest.php"
Cohesion: 0.21
Nodes (19): {closure#10}(), {closure#11}(), {closure#12}(), {closure#13}(), {closure#14}(), {closure#15}(), {closure#16}(), {closure#17}() (+11 more)

### Community 193 - "cip/core.py"
Cohesion: 0.18
Nodes (6): detect_domain(), get_cip_brief(), _load_csv(), search(), search_all(), _search_csv()

### Community 201 - "auth.ts"
Cohesion: 0.27
Nodes (9): motion, FADE_PICKUP_HOLD_MS, useFilingItemTransition(), useArchiveAnimations(), ArchiveAnimation, ArchiveAnimationKey, ArchiveAnimations, DEFAULTS (+1 more)

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1138 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **48 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SKILL.md (design-system)` connect `generate-tokens.cjs` to `component-tokens.md`, `Brand Context Sync`, `Token Architecture Layers`, `Token Usage Validator`, `pathlib`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `DEBIAN_FRONTEND`, `DEBIAN_FRONTEND`, `COMPOSER_MEMORY_LIMIT` to the rest of the system?**
  _110 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.06777493606138107 - nodes in this community are weakly interconnected._
- **Why does `Document` connect `Document` to `Inertia\Testing\AssertableInertia`, `DocumentSearchTest`, `OcrDocumentTest`, `DeclarationRecorder`, `DocumentFieldMappingTest.php`, `Cabinet`, `HeaderDocumentSearchTest`, `OcrDocument`, `Book`, `OcrDocumentTest.php`, `DocumentController.php`, `DocumentLinkingTest`, `DocumentFieldMappingTest.php`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `security.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0957983193277311 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `MIT License (frontmatter)` and `Apache License 2.0`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `shadcn CLI (npx shadcn@latest init/add)` and `requirements.txt`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._