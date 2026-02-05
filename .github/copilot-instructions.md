# Actual Budget - AI Agent Coding Instructions

## Project Overview
**Actual** is a local-first personal finance application built with Node.js, React, and TypeScript. It features local data storage with optional synchronization across devices via a sync server.

**Key Architecture:**
- Monorepo using Yarn workspaces (`packages/*`)
- Cross-platform: Desktop (Electron), Web, and Server deployments
- Dual-database approach: SQLite for local storage (better-sqlite3) + AbsurdSQL for browser fallback
- Event-driven architecture with handlers/mutators for server-client communication

## Workspace Structure & Key Packages

| Package | Purpose | Tech Stack |
|---------|---------|-----------|
| **loot-core** | Core engine (shared business logic, database, queries) | Node.js, SQLite, Redux |
| **desktop-client** (@actual-app/web) | React UI for all platforms | React 19, Vite, @emotion/css, React-aria |
| **desktop-electron** | Electron wrapper for desktop app | Electron 24+, IPC bridge |
| **sync-server** | Backend server for multi-device sync | Express, TypeScript, PostgreSQL migrations |
| **component-library** (@actual-app/components) | Shared UI components | React, TypeScript |
| **api** (@actual-app/api) | Public API for external integration | Node.js, injected handlers |
| **crdt** (@actual-app/crdt) | Conflict-free replicated data type for sync | Local-first sync primitives |

## Critical Data Flows

### 1. Handler/Mutator Pattern (Server-Client Communication)
- **Location:** [loot-core/src/server/main.ts](loot-core/src/server/main.ts)
- **Pattern:** Handlers expose server methods to client; mutators mark operations as state-changing
- **Example:** `handlers['query']`, `handlers['undo']` defined in main.ts
- Handlers are collected from domain-specific app modules (`app as accountsApp`, `app as budgetApp`, etc.)
- Each app module calls `app.combine()` to merge handler groups
- **Critical:** All data mutations must flow through mutators to maintain sync integrity

### 2. Query System (AQL - Actual Query Language)
- **Location:** [loot-core/src/server/aql/compiler.ts](loot-core/src/server/aql/compiler.ts)
- Compiles abstract query objects to SQL with type safety
- Used by reports, filters, and data fetching
- Supports schema-based validation, joins, and custom views
- **Key function:** `compileQuery()`, `aqlQuery()` 

### 3. Platform Abstraction Layer
- **Location:** [loot-core/src/platform/](loot-core/src/platform/)
- Abstracts filesystem, database, and storage across Node.js, Electron, and Web
- `fs/index.ts` (Node) vs `fs/index.web.ts` (Browser with IndexedDB + AbsurdSQL)
- `sqlite/` handles both native (Node) and WASM (Web) SQLite
- This allows **shared code** to run on desktop and web with minimal differences

### 4. Client-Server Sync
- **Location:** [loot-core/src/server/sync/](loot-core/src/server/sync/)
- Uses CRDT library (@actual-app/crdt) for conflict-free merging
- Sync server ([sync-server/src/](sync-server/src/)) coordinates multi-device state
- Transactions have tombstoning: deleted records are soft-deleted (preserved in sync)

## Build & Development Workflows

### Key Commands
```bash
# Development
yarn start              # Start web app (with loot-core backend)
yarn start:desktop     # Start Electron desktop app
yarn start:server-dev  # Start sync server + web frontend
yarn start:browser     # Start web client + backend

# Building
yarn build:browser     # Package web app
yarn build:desktop     # Package Electron app
yarn build:server      # Package sync server

# Testing & Quality
yarn test              # Run all package tests (parallel)
yarn test:debug        # Run tests verbose (single-threaded)
yarn e2e               # Run E2E tests (Playwright)
yarn lint              # Prettier + ESLint with strict settings
yarn lint:fix          # Auto-fix formatting and linting
```

### Test Patterns
- **Framework:** Vitest (config per package: `vitest.config.ts`, `vitest.web.config.ts`)
- **Node tests:** Exclude `*.web.test.*` files; use real SQLite
- **Web tests:** Environment flag `ENV=web`; use fake-indexeddb + absurd-sql
- **Setup files:** [loot-core/src/mocks/setup.ts](loot-core/src/mocks/setup.ts) initializes test database
- **Example:** [loot-core/src/shared/transfer.test.ts](loot-core/src/shared/transfer.test.ts)

## Project-Specific Conventions

### File Extensions & Platform Variants
Code splits by platform using file extensions:
- `.electron.ts` - Electron only
- `.web.ts` - Web (browser) only
- `.test.ts` - Unit tests
- `.web.test.ts` - Web-only tests
- No suffix = isomorphic (runs everywhere)

**Example:** `fs/index.ts` (Node), `fs/index.web.ts` (Browser)

### Naming Conventions
- **Handler names:** kebab-case (e.g., `'make-filters-from-conditions'`)
- **Database types:** `Db*` prefix (e.g., `DbTransaction`, `DbAccount`)
- **API types:** `*Entity` suffix (e.g., `RuleConditionEntity`)
- **App modules:** Named exports as lowercase app (e.g., `export { app as transactionsApp }`)

### TypeScript Configuration
- **Base config:** [tsconfig.json](tsconfig.json) with ES2022 target
- **Composite projects:** Disabled but planned (TODO comments)
- **Type checking:** Not strict globally; use `checkJs: false` (checked only for explicit files)
- **Type Annotations:** Added selectively with refactoring tool; use Pylance suggestion `source.addTypeAnnotation`
- **Type Aliases:** Common path aliases in tsconfig:
  - `loot-core/*` → `./packages/loot-core/src/*`
  - `@desktop-client/*` → `./packages/desktop-client/src/*`

### CSS & Styling
- **Framework:** @emotion/css (not Tailwind)
- **Theme:** Centralized in `@actual-app/components/theme`
- **Responsive:** Custom `useResponsive()` hook; layout loads appropriate component set:
  - Narrow (mobile): [desktop-client/src/components/responsive/narrow.ts](desktop-client/src/components/responsive/narrow.ts)
  - Wide (desktop): [desktop-client/src/components/responsive/wide.ts](desktop-client/src/components/responsive/wide.ts)

### State Management
- **Desktop:** Redux with @reduxjs/toolkit (slices for app state, modal stack, notifications)
- **Queries:** Custom query system using AQL compiler
- **Local Storage:** `@actual-app/web` package manages preferences
- **Hooks:** Domain-specific hooks (e.g., `useAccounts()`, `useCategories()`) normalize Redux selectors

### Database & ORM Pattern
- **No traditional ORM.** Direct SQL builder in [loot-core/src/server/db/](loot-core/src/server/db/)
- **Schemas:** Defined inline as objects with type information
- **Migrations:** [sync-server/migrations/](sync-server/migrations/) for schema changes (uses `migrate` package)
- **Transactions:** SQL transactions wrap multi-statement mutations for consistency
- **Dates:** Stored as ISO strings (YYYY-MM-DD); use date-fns for manipulation

### Widget & Report System
- **Widgets:** Configurable dashboard cards (net-worth, cash-flow, etc.)
- **Type:** [loot-core/src/types/models/dashboard.ts](loot-core/src/types/models/dashboard.ts) defines all widget types
- **Reports:** Query-based spreadsheet views
- **Integration:** Desktop-client reports import and use `aqlQuery()` to fetch data

### ESLint & Formatting
- **Strict mode:** `--max-warnings 0` (zero tolerance)
- **Custom plugin:** `eslint-plugin-actual` in [packages/eslint-plugin-actual/](packages/eslint-plugin-actual/)
- **Prettier:** Enforced; run `yarn lint:fix` to auto-fix
- **Commit hooks:** lint-staged runs eslint/prettier on staged files (husky)

## External Integrations

### Bank Sync (GoCardless & Pluggy)
- **Location:** [sync-server/src/app-gocardless/](sync-server/src/app-gocardless/)
- **Pattern:** Bank-specific normalizers in [banks/](sync-server/src/app-gocardless/banks/) dir
- **Service:** [gocardless-service.js](sync-server/src/app-gocardless/services/gocardless-service.js) handles API errors
- **Data flow:** Bank → normalized transactions → Actual database

### Import/Export
- **Importers:** [loot-core/src/server/importers/](loot-core/src/server/importers/) support YNAB, CSV, OFX
- **Example:** [ynab4.ts](loot-core/src/server/importers/ynab4.ts) uses public API (`@actual-app/api/methods`)
- **Pattern:** Each importer maps external format → internal entity models

## Important Development Notes

### Monorepo Management
- Uses **Yarn 4.9.1+** with workspaces
- Package resolution: `workspace:*` for internal deps
- Scripts are often prefixed with package scope: `yarn workspace @actual-app/web start`
- Check [run_commit_myself_docker.md](run_commit_myself_docker.md) for custom scripts

### Docker & Deployment
- **Development:** [Dockerfile](Dockerfile) + [docker-compose.yml](docker-compose.yml) for isolated environment
- **Sync server:** [sync-server/docker/](sync-server/docker/) contains deployment config
- **Command:** `yarn vrt:docker` for visual regression testing in Docker

### Common Gotchas
1. **Strict mode incomplete:** Many files have `@ts-strict-ignore` comments; cannot enforce strict types globally
2. **Synchronization is fragile:** Always test mutations in both directions (client→server, server→client)
3. **Platform differences:** Features split by `.web.ts` variants; don't assume Node.js APIs work in browser
4. **Type inference:** Handlers are loosely typed; use Pylance refactoring to add annotations incrementally
5. **Database state:** Tests use `global.emptyDatabase()` setup; verify test isolation

### Useful Tools
- **Code refactoring:** Use Pylance's `source.unusedImports`, `source.addTypeAnnotation`
- **AST Parsing:** PEG grammar in [bin/build-browser](bin/build-browser); used for AQL compilation
- **Bundle analysis:** Vite's `rollup-plugin-visualizer` (check bundle size diffs)

## When Adding Features

1. **Add a handler** in the appropriate domain app module (e.g., [loot-core/src/server/accounts/app.ts](loot-core/src/server/accounts/app.ts))
2. **Use mutators** for mutations: `handlers['foo'] = mutator(async function() { ... })`
3. **Add types** to [loot-core/src/types/handlers.ts](loot-core/src/types/handlers.ts) so client can call it
4. **Test both paths:** Node test (`src/foo.test.ts`) and web test (`src/foo.web.test.ts`) if needed
5. **Update schema migration** in [sync-server/migrations/](sync-server/migrations/) if database changes
6. **Run full test suite** before commit: `yarn test && yarn lint`

---

**Last Updated:** February 2026  
**Contributing:** See [CONTRIBUTING.md](CONTRIBUTING.md) and https://actualbudget.org/docs/contributing/
