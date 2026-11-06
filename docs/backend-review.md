# PHP backend review with Laravel Boost

Laravel Boost is a development dependency. It supplies framework context, installed-package documentation, and application inspection tools to the coding agent; the agent performs the code review.

## Project setup

`boost.json` selects Codex and Cursor for the project. Run this from the repository root to regenerate their guidelines, skills, and MCP configuration:

```powershell
php artisan boost:install --guidelines --skills --mcp --no-interaction
```

The shared review conventions live in `.ai/guidelines/php-backend-review.md`. Boost includes them in its generated `AGENTS.md`. Edit the source guideline, then run `php artisan boost:update` to refresh generated guidance.

The installed `laravel-best-practices` and `testing-best-practices` skills provide focused backend and test review guidance. Boost also installs matching skills for the project's authentication, search, routing, and frontend packages.

Codex reads `.codex/config.toml`; Cursor reads `.cursor/mcp.json`. Reload the coding agent after changing MCP configuration. The server runs locally through `php artisan boost:mcp` and does not require the Python OCR server to be running.

Generated agent files and machine-specific MCP configuration are ignored by Git, matching this repository's existing setup. Keep `.ai/guidelines/php-backend-review.md` as the maintained source of the backend conventions.

## Request a review

For example:

> Review the PHP backend changes using Laravel Boost and our PHP backend conventions. Check file placement, controller responsibilities, Form Requests, authorization, Eloquent queries, transactions, queued OCR, storage consistency, and tests. Report findings with file and line references. Separate bugs from optional refactoring suggestions. Do not modify files yet.

Narrow the scope to a feature or controller when possible. Ask for fixes after reviewing the findings, or explicitly include fixes in the original request.

## Existing organization

The project already separates controllers, settings Form Requests, Eloquent models, Fortify actions, OCR jobs, document services, OCR clients, and Ollama integration into appropriate Laravel namespaces. Follow those boundaries when adding code.

One useful future review target is the substantial inline validation and workflow coordination in `DocumentController` and `BookController`. Form Requests and focused services/actions can simplify these incrementally. Their current placement alone is not a defect, and no automatic relocation is needed to enable Boost.

## Checks

```powershell
composer lint:check
composer types:check
php artisan test --compact tests/Feature/Documents
```

Choose tests for the changed feature. `composer test` is the repository's full PHP verification command. A passing check supports a review; it does not replace checking application behavior and data integrity.
