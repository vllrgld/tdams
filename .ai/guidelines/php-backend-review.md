# TDAMS PHP backend conventions and reviews

These instructions apply to PHP in `app/`, `bootstrap/`, `config/`, `database/`, `routes/`, and `tests/`. The React UI and the Python OCR service are separate concerns.

## Review workflow

- Start with the requested diff or feature, then inspect its routes, callers, data contracts, and tests. Do not infer correctness from file names alone.
- Use Laravel Boost application information and version-matched documentation before recommending framework APIs. Inspect schema or routes when they affect a finding.
- Follow the project's Graphify rule: query the graph before code exploration and refresh it after code edits.
- Review requests are read-only unless the user also asks for fixes. Report reproducible problems first, with severity, file and line, triggering conditions, and a concrete recommendation. Separate optional architectural improvements from bugs.
- Keep changes proportional. Do not introduce repositories, interfaces for every service, new architectural layers, or mass file moves merely to satisfy a pattern.

## Where PHP code belongs

- `routes/`: route declarations, middleware, and binding. Business workflows belong in application classes.
- `app/Http/Controllers/`: coordinate requests and responses. Delegate substantial persistence workflows and external integrations.
- `app/Http/Requests/<Feature>/`: reusable or substantial validation and request authorization. Inspect existing inline rules before extracting them so behavior remains equivalent.
- `app/Http/Resources/`: HTTP response transformations when a dedicated resource improves a public or shared API contract; preserve existing Inertia props and document payloads.
- `app/Models/`: Eloquent relationships, casts, scopes, and cohesive record behavior. Avoid external HTTP calls and request/session coupling.
- `app/Services/Documents/`: declaration persistence and document search, following `DeclarationRecorder` and `DocumentSearcher`.
- `app/Services/Ocr/` and `app/Services/Ollama/`: OCR clients, compression/thumbnail integration, and model mapping. Keep provider-specific payloads out of controllers and models.
- `app/Actions/<Feature>/`: a focused use case when it simplifies a controller; existing Fortify actions stay under `Actions/Fortify`. Reuse an existing cohesive service instead of duplicating it with an action.
- `app/Jobs/`: queued OCR and other long-running processing, with appropriate retry, timeout, and idempotency behavior.
- `app/Policies/`, `app/Http/Middleware/`, and `app/Providers/`: model authorization, request cross-cutting concerns, and container/framework setup respectively, when needed.
- `database/migrations/`, `factories/`, and `seeders/`: schema changes, test fixtures, and deliberate seed data. Do not edit an applied migration to change an existing database.
- `tests/Feature/`: route, authorization, validation, persistence, queue, and storage behavior. Use `tests/Unit/` for isolated logic.

## Review priorities for this application

- Preserve cabinet -> drawer -> book/folder placement and the one-kind-per-drawer rule, including concurrency protection and the 16-item limit.
- Preserve the distinction between a stored document, a tax declaration, its property, owners, and declaration links. Do not merge records solely because owner names match.
- Persist only document fields actually supplied or verified. OCR/LLM output must not silently invent missing values or override staff corrections.
- Check authorization, validated input, mass assignment, private document access, file validation, and server-side handling of provider credentials.
- Check transactions and locks for multi-record writes, relationship loading and N+1 queries, pagination, indexes, and stable ordering.
- Keep original files, compressed OCR PDFs, thumbnails, OCR text, and page/region data consistent across success, retries, failures, replacement, and deletion.
- Use framework APIs supported by the installed Laravel/PHP versions and the repository's formatting and type conventions. Inline validation is a refactoring candidate when substantial, not inherently a functional bug.

## Verification

- `composer lint:check` checks PHP formatting; use Pint on changed files while iterating.
- `composer types:check` runs the existing Larastan/PHPStan configuration at level 7.
- `php artisan test --compact <relevant test path>` verifies affected behavior; `composer test` runs the existing comprehensive PHP checks.
- Use the existing PHPUnit testing environment and isolated fixtures. Never reset the user's development database or document storage as part of a review.
- Report checks actually run and any remaining limitations; do not call code compliant merely because style or static analysis passed.
