# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm ci

# Install Playwright browsers
npx playwright install --with-deps

# Run all tests (mocked + real suites)
npm run test:all

# Run smoke tests only
npm run test:smoke

# Run the full auth mocked suite
npm run test:auth-mocked

# Run the full auth real suite (requires AUTH_REAL_IDENTIFIER + AUTH_REAL_PASSWORD in .env)
npm run test:auth-real

# Run with Playwright UI (interactive mode)
npm run test:auth-mocked:ui

# Run a single spec file
npx playwright test tests/domains/auth/specs/login.mocked.spec.ts --project=chromium-mocked

# Run with headed browser or debug
npm run test:auth-real:headed
npm run test:auth-real:debug
```

## Environment Variables

Create a `.env` file at the root. The app under test defaults to `http://localhost:4200`.

| Variable | Purpose |
|---|---|
| `PLAYWRIGHT_BASE_URL` | Override the default base URL |
| `AUTH_REAL_IDENTIFIER` | Username/email for real backend tests |
| `AUTH_REAL_PASSWORD` | Password for real backend tests |

Real auth tests (`@real` / `@auth-real`) self-skip when credentials are not set.

## Project Structure

```
tests/
  domains/auth/
    specs/          # Test files (.spec.ts)
    pages/          # Page Object classes (locators + low-level UI actions)
    flows/          # Reusable multi-step actions (compose page objects)
    mocks/          # Network stubs via page.route()
    data/           # Static test data (credentials, IDs)
    fixtures/       # Domain-specific Playwright fixture extensions
  e2e/              # Cross-module business journeys
  api/              # API-only tests (no UI)
  contract/         # Provider-consumer payload compatibility tests
  shared/
    fixtures/       # Base Playwright test fixture (always import test/expect from here)
    factories/      # Response builders consumed by mocks
    utils/          # Shared assertion helpers and page utilities
```

## Playwright Projects and Tags

| Project | Tag filter | Use case |
|---|---|---|
| `chromium-mocked` | `@mocked` / `@auth-mocked` | Deterministic UI tests with network stubs |
| `chromium-real` | `@real` / `@auth-real` | Integration tests against a live backend |
| `chromium-smoke` | `@smoke` | Fast critical checks for CI pipelines |

Every spec must be tagged so it is picked up by exactly one project. Un-tagged tests will not run.

## Architecture Patterns

**Page Objects** (`pages/`) encapsulate locators and low-level UI interactions. They do not contain assertions.

**Flows** (`flows/`) compose page object calls into reusable business actions. Specs call flows; only reach into the page object directly when asserting on intermediate UI state.

**Mocks** (`mocks/`) use `page.route()` to stub network calls. Factories (`shared/factories/`) build the response bodies; mocks call factories. Never hardcode payloads inside mocks.

**Fixtures** (`shared/fixtures/base.fixture.ts`) is the base — always import `test` and `expect` from there, never directly from `@playwright/test`. Domain fixtures (`domains/auth/fixtures/auth.fixture.ts`) extend the base to add pre-conditions like `loggedInPage`.

**Shared utils** (`shared/utils/`) hold assertions and page utilities reused across domains: `expectPublicArea` (verifies the user is on a public/login page) and `clickFirstVisible` (resilient selector cascade).

**Data** (`data/`) holds static seed values. Real credentials always come from env vars.

## Auth Domain — Available Mocks

All mock helpers live in `tests/domains/auth/mocks/auth.mocks.ts`:

| Function | Description |
|---|---|
| `mockLoginSuccess(page, override?)` | Returns a 200 with a fake JWT and user payload |
| `mockLoginStatus(page, status, message)` | Returns any HTTP status with a message body |
| `mockLoginCapturePayload(page)` | Returns 200 and exposes the request payload via a getter |
| `mockLoginWithRateLimit(page, { failBefore? })` | Returns 401 for the first N attempts, then 429 |
| `mockNetworkError(page)` | Aborts the request to simulate a network failure |
