# Getting Started with PocketAria

## Quick Start

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Run Development Server**
   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:5173`

3. **Build for Production**
   ```bash
   pnpm build
   ```

## What's Been Implemented

### Core Features ✅

1. **Data Models**
   - Project with metadata (title, composer, genre, voice type, year, tags, description)
   - Audio tracks (MP3, WAV, M4A support)
   - Scores (PDF, MusicXML, Images)
   - Lyrics (text, markdown, HTML)
   - Playlists
   - Cue points

2. **Services**
   - IndexedDB integration for offline storage
   - Full-text search with MiniSearch
   - Import/Export with JSON and permalinks (LZ-String compression)

3. **Components**
   - AudioPlayer with play/pause/seek/replay controls
   - ScoreViewer (PDF.js for PDFs, image viewer, MusicXML placeholder)
   - LyricsViewer with format support

4. **Views**
   - Library view (browse all projects)
   - Project view (view individual project with audio, scores, lyrics)
   - Project editor (create/edit projects)
   - Search view (full-text search)
   - Playlists view (manage playlists)
   - Import/Export view (share and backup data)

5. **PWA Support**
   - Service worker configuration via Vite PWA plugin
   - Offline-capable
   - Installable as standalone app

## What's Still TODO

1. **Playlist Player**
   - Currently only shows playlist list
   - Need to implement:
     - Play playlists in sequence
     - Configurable pause between items
     - Playlist playback controls

2. **Cue Point Editor**
   - UI for adding/editing cue points
   - Link measure numbers to timestamps
   - Visual cue point markers in audio player

3. **Categories View**
   - Group projects by genre, voice type, composer, etc.
   - Category navigation

4. **MusicXML Rendering**
   - Full OpenSheetMusicDisplay integration
   - Currently just a placeholder

5. **Advanced Features**
   - Waveform visualization
   - Synchronized lyrics scrolling
   - Better markdown rendering (consider using marked.js)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AudioPlayer.ts   # Audio playback with controls
│   ├── ScoreViewer.ts   # PDF/MusicXML/Image viewer
│   └── LyricsViewer.ts  # Lyrics display
├── views/               # Page-level views
│   ├── LibraryView.ts   # Browse projects
│   ├── ProjectView.ts   # View single project
│   ├── ProjectEditor.ts # Create/edit project
│   ├── SearchView.ts    # Search projects
│   ├── PlaylistsView.ts # Manage playlists
│   └── ImportExportView.ts # Import/export data
├── services/            # Business logic
│   ├── db.ts           # IndexedDB operations
│   ├── search.ts       # MiniSearch integration
│   └── import-export.ts # Permalink & JSON export
├── models/
│   └── types.ts        # TypeScript interfaces
├── app.ts              # Main app layout
├── routes.ts           # Route definitions
└── index.ts            # Entry point
```

## Testing the App

1. **Create a Project**
   - Go to Library → New Project
   - Fill in metadata (title is required)
   - Upload an audio file (optional)
   - Upload a score PDF or image (optional)
   - Add lyrics (optional)
   - Save

2. **Search for Projects**
   - Go to Search
   - Type a search query (searches title, composer, tags, description)
   - Click on results to view

3. **Export/Import**
   - Go to Import/Export
   - Export all data as JSON
   - Generate permalink for a single project
   - Import from JSON or permalink

## Known Issues & Solutions

1. **PWA Icons Missing**:
   - You'll see warnings about missing icons (pwa-192x192.png, pwa-512x512.png)
   - Generate icons using https://realfavicongenerator.net/ and place them in the `public/` directory
   - The app works fine without them during development

2. **MusicXML**: OpenSheetMusicDisplay needs proper setup and initialization.

3. **Mobile Navigation**: The responsive menu (hamburger) needs Materialize JS initialization.

4. **Service Worker**:
   - In development, the service worker is handled by Vite PWA plugin
   - Console warnings about service worker are normal in dev mode
   - Build the production version to see the full PWA functionality

## Next Steps

To complete the full requirements from PocketAria.md:

1. Implement the playlist player component
2. Add cue point editor to ProjectEditor
3. Create categories view
4. Set up OpenSheetMusicDisplay properly
5. Add Materialize JS initialization for interactive components
6. Test on mobile devices
7. Add PWA icons and manifest customization

## Development Tips

- The app uses Material Design via Materialize CSS
- All data is stored in IndexedDB (no backend needed)
- Permalinks use LZ-String compression (format: `PA1:{compressed-data}`)
- Audio files are stored as Blobs in IndexedDB
- The search index is rebuilt on app load

## Browser Support

Requires:
- Modern browser with IndexedDB support
- Service Worker support (for PWA features)
- File API and Blob support

Tested on: Chrome, Edge, Firefox (latest versions)
