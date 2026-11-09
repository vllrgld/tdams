# Graph Report - dtms  (2026-11-09)

## Corpus Check
- 426 files · ~763,462 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 52 file(s) not represented in the graph (top: (none) 16, .csv 16, .css 5)

## Summary
- 3509 nodes · 7959 edges · 184 communities (135 shown, 49 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 353 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `93233766`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- cn
- closed-folder-mesh.tsx
- document-thumbnail.tsx
- document-upload-dialog.tsx
- gray
- login.tsx
- DocumentSearchTest
- card
- slide_search_core.py
- Illuminate\Http\Request
- component-tokens.md
- global-search.tsx
- re
- lucide-react
- OcrDocument
- react
- Cabinet
- Brand Context Sync
- Spacing Scale Tokens
- open-folder.tsx
- Book
- bootstrap/app.php
- Semantic Color Tokens
- HTML Token Validator
- Laravel\Fortify\Features
- TaxDeclaration
- filing-item-management.tsx
- render-html.py
- Brand Color Extraction Scripts
- TestCase
- AppServiceProvider
- design/references/banner-sizes-and-styles.md
- archive/index.tsx
- User
- package.json Metadata
- npm Dependencies
- CabinetsTest
- radius
- ui-styling/SKILL.md
- Banner Design Skill
- generate-tokens.cjs
- button
- user-info.tsx
- shadcn-accessibility.md
- TestTailwindConfigGenerator
- open-book.tsx
- SecurityTest.php
- Illuminate\Foundation\Http\FormRequest
- Transformation Engine
- Brand Accessibility Checklists
- sidebar.tsx
- toggle-group.tsx
- test_regions.py
- Brand Typography & Voice
- Token Architecture Layers
- Brand Asset Organization
- Font Size Tokens
- upload
- vite.config.ts
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
- input
- Composer Scripts
- DocumentFieldMappingTest.php
- Design Tokens Starter Structure
- .generate_config_string
- DocumentBrowser
- main.py
- two-factor-setup-modal.tsx
- AccessibilitySettingsTest
- app-sidebar-header.tsx
- update.sh
- TDAMS Branding Assets
- $type
- radius
- Composer Package Metadata
- Token Usage Validator
- SKILL.md (design)
- lg
- json
- BM25
- DocumentFieldMappingTest.php
- sm
- Composer Dev Dependencies
- padding-y
- Motion Duration Tokens
- tailwind
- .mapFields
- messaging-framework.md
- OcrExtractor
- 16
- Composer Requirements
- OcrSettingsTest
- Cabinet
- shadcn-theming.md
- 1
- Optional Native Binaries
- Document
- Composer Config
- 3
- 8
- Product
- CI Workflow
- npm Scripts
- destructive
- Document Upload Tests
- ArchiveTest
- DocumentController.php
- use-appearance.tsx
- xl
- npm Dev Dependencies
- Bagong Pilipinas Emblems
- Ilocos Norte Seal
- app-shell.tsx
- PSR-4 Autoload
- Laravel Extra Config
- Updating the Lightsail installation
- 0001_01_01_000000_create_application_schema.php
- apple-touch-icon.png
- index.ts
- none
- AuthenticationTest
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
- destructive-foreground
- ShadcnInstaller
- muted
- primary-foreground
- secondary-foreground
- .test_full_configuration_typescript
- TailwindConfigGenerator
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

## Communities (184 total, 49 thin omitted)

### Community 0 - "Button"
Cohesion: 0.07
Nodes (43): Non-primitive wrappers (alert, card, input, skeleton, spinner), @inertiajs/react, @laravel/passkeys, EmptyState(), ManagePasskeys(), Props, PasskeyRegistration(), Props (+35 more)

### Community 1 - "cn"
Cohesion: 0.10
Nodes (44): data-popup-open attribute, NavigationMenuIndicator, --positioner-height / --positioner-width, viewport boolean wrapper prop, data-popup-open on menu buttons, AppLogo(), AppHeader(), mainNavItems (+36 more)

### Community 2 - "closed-folder-mesh.tsx"
Cohesion: 0.17
Nodes (14): BookCoverFace(), COVER_LOGO_SIZE, coverTitleLines(), ClosedFolderMesh, FOLDER_ASPECT_RATIO, FolderCover(), FolderCoverSurface(), FolderDetail (+6 more)

### Community 3 - "document-thumbnail.tsx"
Cohesion: 0.16
Nodes (23): ClientPdfThumbnail(), DocumentThumbnail(), DocumentThumbnailProps, loadPdfThumbnail(), pdfFallback(), ThumbnailImage(), acquireCachedThumbnail(), acquireThumbnailSlot() (+15 more)

### Community 4 - "document-upload-dialog.tsx"
Cohesion: 0.14
Nodes (31): PasskeyItem(), Props, TwoFactorSetupModal(), Dialog(), DialogClose(), DialogContent(), DialogDescription(), DialogFooter() (+23 more)

### Community 5 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 6 - "login.tsx"
Cohesion: 0.08
Nodes (37): class-variance-authority, AlertError(), Props, TwoFactorRecoveryCodes(), Alert(), AlertDescription(), AlertTitle(), alertVariants (+29 more)

### Community 8 - "card"
Cohesion: 0.20
Nodes (12): $type, $value, bg, bg, padding, shadow, card, bg (+4 more)

### Community 9 - "slide_search_core.py"
Cohesion: 0.04
Nodes (36): build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana(), load_env(), load_logo_image(), main(), format_output() (+28 more)

### Community 10 - "Illuminate\Http\Request"
Cohesion: 0.06
Nodes (20): ArchiveController, BookController, {closure#6}(), CabinetController, Controller, DocumentFieldsController, DocumentSearchController, DrawerController (+12 more)

### Community 11 - "component-tokens.md"
Cohesion: 0.07
Nodes (32): Alert Spec, Badge Spec, Button Spec, Card Spec, Dialog Spec, Input Spec, Table Spec, Alert Tokens (+24 more)

### Community 12 - "global-search.tsx"
Cohesion: 0.09
Nodes (18): DrawerIcon, DrawerIconProps, documentHint(), DocumentMatch, DocumentResult, fetchSearchResults(), GlobalSearch(), PageEntry (+10 more)

### Community 13 - "re"
Cohesion: 0.09
Nodes (17): gemini-3.1-pro-preview, 12 Icon Categories, 15 Icon Styles, apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon() (+9 more)

### Community 14 - "lucide-react"
Cohesion: 0.07
Nodes (48): lucide-react, DeclarationNumberSearchProps, chainArrowDots(), chainArrowHead(), ChainCard, clampScrollLeft(), cubicBezierPoint(), DocumentChain() (+40 more)

### Community 15 - "OcrDocument"
Cohesion: 0.13
Nodes (5): OcrDocument, LocalThumbnailClient, OcrManager, {closure#2}(), {closure#1}()

### Community 16 - "react"
Cohesion: 0.07
Nodes (45): react, react-pdf, ClientOnly(), ClientPdfPreview(), DocumentHistory(), DocumentHistoryProps, loadPdfPreview(), pdfViewerFallback() (+37 more)

### Community 17 - "Cabinet"
Cohesion: 0.10
Nodes (8): {closure#2}(), {closure#2}(), Cabinet, BookFactory, CabinetFactory, {closure#1}(), DrawerFactory, UserFactory

### Community 18 - "Brand Context Sync"
Cohesion: 0.10
Nodes (27): Brand Guidelines Document Structure, Extractable Brand Fields, Brand Color Presets, /brand:update Command, Core Visual Elements, Visual Guidelines Template, extractColorsFromTable(), extractCoreAttributes() (+19 more)

### Community 19 - "Spacing Scale Tokens"
Cohesion: 0.09
Nodes (22): $type, $value, $type, $value, $type, $value, $type, $value (+14 more)

### Community 20 - "open-folder.tsx"
Cohesion: 0.11
Nodes (25): standingPose(), alignForReturn(), COVER_CLOSE, COVER_OPEN, EASE, INSTANT, lift(), OpenFolder() (+17 more)

### Community 21 - "Book"
Cohesion: 0.12
Nodes (10): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#5}(), {closure#2}(), {closure#6}(), {closure#7}() (+2 more)

### Community 22 - "bootstrap/app.php"
Cohesion: 0.13
Nodes (5): HandleAppearance, HandleInertiaRequests, {closure#1}(), {closure#2}(), {closure#3}()

### Community 23 - "Semantic Color Tokens"
Cohesion: 0.11
Nodes (19): $type, $value, background, foreground, muted-foreground, primary, primary-hover, secondary (+11 more)

### Community 24 - "HTML Token Validator"
Cohesion: 0.13
Nodes (12): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+4 more)

### Community 27 - "filing-item-management.tsx"
Cohesion: 0.07
Nodes (23): sonner, Books(), FilingItemForm, CabinetRenameTitle(), save(), stopEditing(), DrawerRenameRow(), save() (+15 more)

### Community 28 - "render-html.py"
Cohesion: 0.27
Nodes (4): generate_html(), get_deliverable_info(), get_image_base64(), main()

### Community 29 - "Brand Color Extraction Scripts"
Cohesion: 0.10
Nodes (19): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+11 more)

### Community 30 - "TestCase"
Cohesion: 0.06
Nodes (14): {closure#1}(), PasswordConfirmationTest, RegistrationTest, {closure#1}(), TwoFactorChallengeTest, BookmarksTest, {closure#1}(), DashboardTest (+6 more)

### Community 31 - "AppServiceProvider"
Cohesion: 0.15
Nodes (3): AppServiceProvider, {closure#1}(), FortifyServiceProvider

### Community 32 - "design/references/banner-sizes-and-styles.md"
Cohesion: 0.08
Nodes (22): 22 Art Direction Styles, Google Display Network Ad Sizes, Pinterest Research Queries, Print Specs, Multi-Skill Workflows, Logo Workflow, Social Art Direction Styles (Reuse from Banner), Social Platform Sizes (+14 more)

### Community 33 - "archive/index.tsx"
Cohesion: 0.12
Nodes (15): CABINET_SEARCH_FIELDS, CabinetSearchField, ArchiveHeaderItem, ArchiveHeaderProvider(), SetTrailContext, TrailContext, useSetArchiveHeaderTrail(), buttonVariants (+7 more)

### Community 34 - "User"
Cohesion: 0.10
Nodes (5): User, DatabaseSeeder, {closure#3}(), {closure#4}(), {closure#1}()

### Community 35 - "package.json Metadata"
Cohesion: 0.09
Nodes (22): private, $schema, type, babel-plugin-react-compiler, clsx, concurrently, @laravel/multiplex, lightningcss-linux-x64-gnu (+14 more)

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

### Community 42 - "button"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 43 - "user-info.tsx"
Cohesion: 0.32
Nodes (8): @base-ui/react/avatar, UserInfo(), Avatar(), AvatarFallback(), AvatarImage(), getInitial(), GetInitialsFn, useInitials()

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
Cohesion: 0.08
Nodes (10): CreateNewUser, ResetUserPassword, PasswordValidationRules, ProfileValidationRules, LinkDocumentRequest, StoreDocumentRequest, PasswordUpdateRequest, ProfileDeleteRequest (+2 more)

### Community 50 - "Transformation Engine"
Cohesion: 0.05
Nodes (38): aliases, components, hooks, lib, ui, utils, base, iconLibrary (+30 more)

### Community 51 - "Brand Accessibility Checklists"
Cohesion: 0.12
Nodes (14): Accessibility Review (WCAG AA), Post-Approval Archival, Asset Approval Checklist, Legal & Compliance Review, Reviewer Sign-off, Industry Color Palette Examples, Color System Hierarchy, Relative Luminance & Contrast Ratio Formula (+6 more)

### Community 52 - "sidebar.tsx"
Cohesion: 0.10
Nodes (35): accountNavItems, AppSidebar(), mainNavItems, NavFooter(), CollapsibleNavItem(), NavMain(), NavUser(), Collapsible() (+27 more)

### Community 53 - "toggle-group.tsx"
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

### Community 59 - "upload"
Cohesion: 0.25
Nodes (4): read_upload(), upload(), UploadMemoryTests, process()

### Community 60 - "vite.config.ts"
Cohesion: 0.22
Nodes (7): @inertiajs/vite, laravel-vite-plugin, @laravel/vite-plugin-wayfinder, @rolldown/plugin-babel, @tailwindcss/vite, vite-plus, @vitejs/plugin-react

### Community 62 - "TypeScript Config"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, module, moduleResolution (+7 more)

### Community 63 - "pathlib"
Cohesion: 0.10
Nodes (9): test_sync_parses_bundled_starter_template(), main(), _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation(), Node.js 18+ Requirement, pytest Dev Dependencies (pytest>=8.0.0, pytest-cov, pytest-mock), requirements.txt (tests) (+1 more)

### Community 65 - "filing-item-pose.ts"
Cohesion: 0.21
Nodes (15): motion, FolderActor(), folderMotionTransform(), BoxQuadElement, cumulativeFromOffsetParents(), cumulativeTransform(), findPerspectiveRoot(), matrixFromBoxQuads() (+7 more)

### Community 66 - "use-document-upload.ts"
Cohesion: 0.06
Nodes (38): DocumentRequestError, messageFrom(), requestJson(), UploadStage, useDocumentUpload(), checkAll(), close(), mapFields() (+30 more)

### Community 67 - "Inertia\Testing\AssertableInertia"
Cohesion: 0.07
Nodes (43): {closure#1}(), {closure#2}(), {closure#3}(), {closure#4}(), {closure#1}(), {closure#10}(), {closure#11}(), {closure#12}() (+35 more)

### Community 68 - "regions.py"
Cohesion: 0.12
Nodes (5): hocr_text_regions(), OcrRegion, pdf_text_regions(), RegionPageAggregator, text_lines()

### Community 69 - "dropdown-menu.tsx"
Cohesion: 0.14
Nodes (19): Props, UserMenuContent(), DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuGroup(), DropdownMenuItem(), DropdownMenuLabel() (+11 more)

### Community 70 - "filing-cabinet.tsx"
Cohesion: 0.08
Nodes (32): react-dom, ClosedBookMesh(), BOOK_POP, CabinetDrawer(), CabinetDrawerProps, drawerRimOffset(), translateZ(), CLOSEUP (+24 more)

### Community 71 - "Brand Asset Validator"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 72 - "cip/core.py"
Cohesion: 0.12
Nodes (6): BM25, detect_domain(), _load_csv(), search(), search_all(), _search_csv()

### Community 73 - "slides-copywriting-formulas.md"
Cohesion: 0.09
Nodes (23): AIDA (Attention-Interest-Desire-Action), Before-After-Bridge, Cost of Inaction, FAB (Features-Advantages-Benefits), Formula-to-Slide Mapping, Headline Patterns, PAS (Problem-Agitate-Solution), search-slides.py (design-system) (+15 more)

### Community 74 - "input"
Cohesion: 0.29
Nodes (8): padding-x, input, $type, $value, focus-ring, padding-x, $type, $value

### Community 75 - "Composer Scripts"
Cohesion: 0.15
Nodes (13): scripts, ci:check, dev, lint, lint:check, post-autoload-dump, post-create-project-cmd, post-root-package-install (+5 more)

### Community 77 - "Design Tokens Starter Structure"
Cohesion: 0.15
Nodes (12): component, $type, $value, dark, semantic, $schema, $type, $value (+4 more)

### Community 79 - "DocumentBrowser"
Cohesion: 0.12
Nodes (33): @base-ui/react, DeclarationNumberSearch(), CabinetSearch(), Select(), SelectContent(), SelectItem(), SelectScrollDownButton(), SelectScrollUpButton() (+25 more)

### Community 80 - "main.py"
Cohesion: 0.21
Nodes (11): embedded_page_texts(), health(), merge_skipped_pages(), ocr_response(), page_has_text(), pages_from_sidecar(), pdf_response(), render_thumbnail() (+3 more)

### Community 81 - "two-factor-setup-modal.tsx"
Cohesion: 0.12
Nodes (16): input-otp, GridScanIcon(), Props, TwoFactorSetupStep(), TwoFactorVerificationStep(), OTP_MAX_LENGTH, UseTwoFactorAuthReturn, InputOTP (+8 more)

### Community 82 - "AccessibilitySettingsTest"
Cohesion: 0.27
Nodes (4): AccessibilitySettingsTest, {closure#1}(), {closure#2}(), {closure#3}()

### Community 83 - "app-sidebar-header.tsx"
Cohesion: 0.33
Nodes (13): @base-ui/react/separator, decorative prop dropped, AppSidebarHeader(), useArchiveHeaderTrail(), Breadcrumbs(), Breadcrumb(), BreadcrumbItem(), BreadcrumbLink() (+5 more)

### Community 84 - "update.sh"
Cohesion: 0.40
Nodes (3): COMPOSER_ALLOW_SUPERUSER, COMPOSER_MEMORY_LIMIT, update.sh script

### Community 85 - "TDAMS Branding Assets"
Cohesion: 0.17
Nodes (10): Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Bagong Pilipinas Emblem, Ilocos Norte Provincial Seal, Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System), Provincial Assessor's Office, TDAMS (Tax Declaration Archive Management System) (+2 more)

### Community 86 - "$type"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 88 - "radius"
Cohesion: 0.60
Nodes (5): radius, radius, radius, $type, $value

### Community 89 - "Composer Package Metadata"
Cohesion: 0.17
Nodes (11): autoload-dev, psr-4, description, keywords, license, minimum-stability, name, prefer-stable (+3 more)

### Community 90 - "Token Usage Validator"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 91 - "SKILL.md (design)"
Cohesion: 0.06
Nodes (35): Core Identity Deliverables, Digital Assets, Office Environment Signage, Stationery Set, Vehicle Branding, CIP BM25 Search Engine (core.py), CIP Workflow, CIP Deliverable Categories (+27 more)

### Community 92 - "lg"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 93 - "json"
Cohesion: 0.15
Nodes (9): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+1 more)

### Community 95 - "DocumentFieldMappingTest.php"
Cohesion: 0.10
Nodes (3): EmailVerificationTest, {closure#4}(), {closure#5}()

### Community 96 - "sm"
Cohesion: 0.60
Nodes (5): sm, sm, sm, $type, $value

### Community 98 - "Composer Dev Dependencies"
Cohesion: 0.18
Nodes (11): require-dev, fakerphp/faker, larastan/larastan, laravel/boost, laravel/pail, laravel/pao, laravel/pint, laravel/sail (+3 more)

### Community 99 - "padding-y"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 100 - "Motion Duration Tokens"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 101 - "tailwind"
Cohesion: 0.33
Nodes (6): tailwind, baseColor, config, css, cssVariables, prefix

### Community 103 - "messaging-framework.md"
Cohesion: 0.33
Nodes (5): Elevator Pitches (10/30/60s), Message Testing, Messaging Framework Hierarchy, Positioning Statement, Value Proposition Template

### Community 106 - "16"
Cohesion: 0.67
Nodes (3): $type, $value, 16

### Community 107 - "Composer Requirements"
Cohesion: 0.22
Nodes (9): require, inertiajs/inertia-laravel, laravel/chisel, laravel/fortify, laravel/framework, laravel/scout, laravel/tinker, laravel/wayfinder (+1 more)

### Community 109 - "Cabinet"
Cohesion: 0.09
Nodes (9): {closure#4}(), DeclarationOwner, {closure#1}(), {closure#2}(), Drawer, Owner, Property, {closure#1}() (+1 more)

### Community 110 - "shadcn-theming.md"
Cohesion: 0.23
Nodes (9): Base Color Presets (Slate, Gray, Zinc, Neutral, Stone), shadcn CSS Variable System (globals.css :root/.dark), Component Variant Customization (cva buttonVariants), Multiple Themes via data-theme Attributes, Dark Mode via next-themes ThemeProvider, Global --radius Variable, Style Variants (Default / New York, components.json), ThemeToggle Component (+1 more)

### Community 111 - "1"
Cohesion: 0.67
Nodes (3): $type, $value, 1

### Community 112 - "Optional Native Binaries"
Cohesion: 0.25
Nodes (8): optionalDependencies, @laravel/multiplex, lightningcss-linux-x64-gnu, lightningcss-win32-x64-msvc, @rollup/rollup-linux-x64-gnu, @rollup/rollup-win32-x64-msvc, @tailwindcss/oxide-linux-x64-gnu, @tailwindcss/oxide-win32-x64-msvc

### Community 113 - "Document"
Cohesion: 0.06
Nodes (21): {closure#3}(), DocumentFileController, {closure#3}(), DocumentLinkController, DocumentOcrController, {closure#1}(), DocumentResource, Document (+13 more)

### Community 114 - "Composer Config"
Cohesion: 0.29
Nodes (7): pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, preferred-install, sort-packages

### Community 116 - "3"
Cohesion: 0.67
Nodes (3): $type, $value, 3

### Community 117 - "8"
Cohesion: 0.67
Nodes (3): $type, $value, 8

### Community 118 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 119 - "CI Workflow"
Cohesion: 0.33
Nodes (5): CI Job (ubuntu-latest, push main / pull_request), composer ci:check, composer setup, Node 22 (setup-node), PHP 8.3 + Composer v2 (setup-php)

### Community 120 - "npm Scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:ssr, check, check:fix, dev, test:frontend, types:check

### Community 121 - "destructive"
Cohesion: 0.67
Nodes (3): destructive, $type, $value

### Community 124 - "DocumentController.php"
Cohesion: 0.08
Nodes (17): Review priorities for this application, Review workflow, TDAMS PHP backend conventions and reviews, Verification, Where PHP code belongs, {closure#1}(), DocumentController, {closure#1}() (+9 more)

### Community 125 - "use-appearance.tsx"
Cohesion: 0.16
Nodes (17): Appearance, applyTheme(), getStoredAppearance(), handleSystemThemeChange(), initializeTheme(), isDarkMode(), listeners, mediaQuery() (+9 more)

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

### Community 130 - "app-shell.tsx"
Cohesion: 0.21
Nodes (12): AppContent(), Props, AppShell(), Props, SidebarInset(), SidebarProvider(), getServerSnapshot(), isSmallerThanBreakpoint() (+4 more)

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
Cohesion: 0.08
Nodes (28): {closure#1}(), {closure#10}(), {closure#11}(), {closure#12}(), {closure#13}(), {closure#14}(), {closure#15}(), {closure#16}() (+20 more)

### Community 137 - "index.ts"
Cohesion: 0.15
Nodes (13): delay prop (formerly delayDuration), withApp(), AppLogoIcon(), Toaster(), TooltipProvider(), useFlashToast(), AppLayout(), AuthSimpleLayout() (+5 more)

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

### Community 161 - "destructive-foreground"
Cohesion: 0.67
Nodes (3): destructive-foreground, $type, $value

### Community 162 - "ShadcnInstaller"
Cohesion: 0.05
Nodes (3): main(), ShadcnInstaller, TestShadcnInstaller

### Community 163 - "muted"
Cohesion: 0.67
Nodes (3): muted, $type, $value

### Community 165 - "primary-foreground"
Cohesion: 0.67
Nodes (3): primary-foreground, $type, $value

### Community 166 - "secondary-foreground"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

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
Cohesion: 0.11
Nodes (7): BM25, detect_domain(), get_cip_brief(), _load_csv(), search(), search_all(), _search_csv()

### Community 201 - "auth.ts"
Cohesion: 0.13
Nodes (17): FADE_PICKUP_HOLD_MS, useFilingItemTransition(), useArchiveAnimations(), ArchiveAnimation, ArchiveAnimationKey, ArchiveAnimations, DEFAULTS, normalizeArchiveAnimations() (+9 more)

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1148 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SKILL.md (design-system)` connect `generate-tokens.cjs` to `component-tokens.md`, `Brand Context Sync`, `Token Architecture Layers`, `Token Usage Validator`, `pathlib`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `DEBIAN_FRONTEND`, `DEBIAN_FRONTEND`, `COMPOSER_MEMORY_LIMIT` to the rest of the system?**
  _112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.06514120799835085 - nodes in this community are weakly interconnected._
- **Why does `Document` connect `Document` to `User`, `Inertia\Testing\AssertableInertia`, `.mapFields`, `DocumentSearchTest`, `OcrDocumentTest`, `DocumentFieldMappingTest.php`, `Cabinet`, `HeaderDocumentSearchTest`, `OcrDocument`, `DocumentLinkingTest`, `TaxDeclaration`, `OcrDocumentTest.php`, `DocumentController.php`, `DocumentResource.php`, `DocumentFieldMappingTest.php`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.09579100145137881 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `MIT License (frontmatter)` and `Apache License 2.0`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `shadcn CLI (npx shadcn@latest init/add)` and `requirements.txt`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._