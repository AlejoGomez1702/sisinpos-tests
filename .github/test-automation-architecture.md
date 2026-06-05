# Test Automation Architecture

## Goals
- Fast feedback for development with mocked tests.
- Reliable backend validation with real integration tests.
- Progressive scaling by domains and layers.

## Execution Model
- Project chromium-mocked: runs tests tagged with @auth-mocked or @mocked.
- Project chromium-real: runs tests tagged with @auth-real or @real.
- Project chromium-smoke: runs tests tagged with @smoke.

## Commands
- npm run test:all
- npm run test:smoke
- npm run test:auth-mocked
- npm run test:auth-real

## Design Principles
- Keep test intent in specs and reusable actions in flows/pages.
- Keep network stubs in domain mocks.
- Keep reusable data in factories and domain data files.
- Keep critical checks tagged with @smoke.

## Migration Strategy
- Maintain existing tests in tests/auth while stable.
- Create all new modules in tests/domains.
- Move legacy tests incrementally by feature, validating each move in CI.
