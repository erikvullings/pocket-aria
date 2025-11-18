# Code Style and Conventions

## TypeScript Configuration

- **Target**: ES2020
- **Module**: ESNext
- **Strict Mode**: Enabled
- **No Unused Locals/Parameters**: Enforced
- **JSX Factory**: `m` (Mithril)
- **Path Aliases**: `@/*` maps to `src/*`

## File Naming

- TypeScript files use `.ts` extension
- Components and views use PascalCase (e.g., `AudioPlayer.ts`, `LibraryView.ts`)
- Services and utilities use kebab-case (e.g., `db.ts`, `search.ts`, `import-export.ts`)
- Type definitions in `models/types.ts`

## Code Organization

- **Components**: Reusable UI components in `src/components/`
- **Views**: Page-level components in `src/views/`
- **Services**: Business logic and data access in `src/services/`
- **Models**: Type definitions in `src/models/`
- **Utils**: Helper functions in `src/utils/`

## Mithril Conventions

- Use Mithril.js framework for UI components
- JSX factory set to `m`
- Components follow Mithril component pattern

## TypeScript Style

- Use strict typing
- Define interfaces in `models/types.ts`
- Avoid unused parameters and variables
- Use explicit type annotations where beneficial
