# Test Architecture

This folder is organized by layers and domains.

## Layers
- domains: module-focused tests (auth, users, products, etc.)
- e2e: cross-module business journeys
- api: endpoint behavior without UI
- contract: provider-consumer payload compatibility
- shared: reusable fixtures, factories, utils

## Domain Structure
For each domain use:
- specs: test files
- pages: page objects
- flows: reusable business actions
- mocks: network stubs
- data: seeded test data

## Tags
- @auth-mocked and @mocked: deterministic mocked suite
- @auth-real and @real: backend integration suite
- @smoke: critical fast checks for pipelines

## Migration Rule
Legacy specs under tests/auth are supported.
New tests should be created under tests/domains.
Migrate legacy files gradually to avoid breaking CI.
