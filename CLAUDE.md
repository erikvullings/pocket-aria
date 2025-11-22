# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

This project **requires pnpm 10.22.0**. Always use `pnpm` for package management, never `npm` or `yarn`.

## Development Commands

```bash
# Start development server (http://localhost:5173)
pnpm run dev

# Build for production (outputs to docs/ directory)
pnpm run build

# Preview production build
pnpm run preview

# Type check without building
pnpm run type-check
```

## Architecture Overview

### Framework & UI Library

- **Framework**: Mithril.js with TypeScript (not React/Vue)
- **UI Components**: `mithril-materialized` (a Mithril wrapper for Material Design)
  - Import components like: `import { Sidenav, SidenavItem } from "mithril-materialized"`
  - **IMPORTANT**: There is NO global `M` object. Use components from `mithril-materialized`, not Materialize CSS directly
  - Uses Mithril's `m()` hyperscript function for rendering
- **JSX Factory**: Set to `m` (Mithril's hyperscript)

### Routing Architecture

- **Router**: Mithril's built-in router (hash-based: `#!/path`)
- **Route Definition**: Routes are defined in `src/index.ts` using `m.route()`
- **Navigation Links**: Use `href="#!/path"` format for links, or `m.route.set('/path')` programmatically
- **App Wrapper**: All routes except `/song/:id/practice` render through the `App` component wrapper
- **Practice View**: Renders standalone (no App wrapper) for full-screen practice mode

### Data Architecture

**Storage**: IndexedDB via the `idb` library (not localStorage)

**Database Schema** (`src/services/db.ts`):
- `projects` store: Main content with audio, scores, lyrics
- `playlists` store: Ordered collections of projects
- `settings` store: App configuration

**Core Data Model** (`src/models/types.ts`):
- `Project`: Contains metadata, audio track, lyrics, scores, cue points, and bookmarks
- `Playlist`: Collection of projects with configurable pause between items
- `AudioTrack`, `Lyrics`, `Score`: Embedded in projects, store binary data as Blobs

**Key Services**:
- `db.ts`: All database CRUD operations
- `search.ts`: MiniSearch integration for full-text search
- `import-export.ts`: JSON and permalink (LZ-String compressed) import/export

### Component Organization

**Views** (page-level components in `src/views/`):
- `LibraryView`: Main project listing
- `ProjectView`: Single project detail view
- `ProjectEditor`: Create/edit projects
- `PracticeView`: Full-screen practice mode with audio/score/lyrics
- `LrcEditorView`: LRC timestamp editor for synced lyrics
- `SearchView`: Search interface
- `PlaylistsView`: Playlist management
- `ImportExportView`: Import/export functionality

**Components** (reusable in `src/components/`):
- `AudioPlayer`: Audio playback controls
- `ScoreViewer`: Multi-format score rendering (PDF, MusicXML, images)
- `LyricsViewer`: Lyrics display with optional timestamps

### Special Features

**Permalink System**:
- Format: `PA1:{base64-lzstring-data}`
- Contains complete project data (including binary blobs as Base64)
- Can be shared as URL parameter: `#!/import-export?permalink=...`
- Handled by `handlePermalinkParam()` in `src/index.ts`

**Practice Mode**:
- Full-screen view with integrated audio/score/lyrics
- Bookmark support for quick navigation
- LRC-synced lyrics highlighting
- Separate from main app layout

**PWA Configuration**:
- Service worker auto-update via `vite-plugin-pwa`
- Workbox precaching for offline support
- Build output goes to `docs/` (for GitHub Pages deployment)
- Base path: `/pocket-aria/`

## TypeScript Configuration

- **Target**: ES2020
- **Module**: ESNext
- **Strict Mode**: Enabled
- **Path Alias**: `@/` maps to `src/`
- **JSX Factory**: `m` (for Mithril)

## Code Style

**File Naming**:
- Components/Views: PascalCase (e.g., `AudioPlayer.ts`, `LibraryView.ts`)
- Services/Utilities: kebab-case (e.g., `db.ts`, `import-export.ts`)

**Mithril Patterns**:
- Use `m.FactoryComponent` for components
- Component state via closure variables (not class properties)
- Lifecycle hooks: `oninit`, `oncreate`, `onupdate`, `onremove`, `view`
- Use `m.route.set()` for programmatic navigation
- Use `m.redraw()` when updating state outside Mithril's auto-redraw

**UI Components from mithril-materialized**:
- Never try to initialize with `M.AutoInit()` or similar - use the Mithril components
- Components manage their own lifecycle and initialization
- Pass props like `isOpen`, `onToggle`, etc. to control component state
- Example: `m(Sidenav, { isOpen, onToggle: (open) => { ... } }, children)`
