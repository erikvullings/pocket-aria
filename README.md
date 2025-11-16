# PocketAria

A fully offline Progressive Web App (PWA) for managing vocal repertoire with audio tracks, scores, and lyrics.

## Features

- **Offline-First**: All data stored locally in IndexedDB
- **Audio Playback**: Upload and play MP3, WAV, M4A files with play/pause/seek controls
- **Score Viewing**: Support for MusicXML, PDF, and image formats
- **Lyrics Display**: Plain text, Markdown, and HTML lyrics
- **Search**: Fast full-text search with MiniSearch
- **Playlists**: Create and manage playlists with configurable pause between items
- **Import/Export**: Share projects via permalinks or JSON files
- **PWA**: Installable as a standalone app

## Technology Stack

- **Framework**: Mithril.js (TypeScript)
- **UI**: Material Design via Materialize CSS
- **Storage**: IndexedDB (via idb)
- **Search**: MiniSearch
- **Score Rendering**:
  - PDF.js for PDF scores
  - OpenSheetMusicDisplay for MusicXML (placeholder)
  - Native image rendering
- **Compression**: LZ-String for permalinks
- **Build Tool**: Vite

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start the development server at `http://localhost:5173`

### Build

```bash
npm run build
```

This will create a production build in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
pocket-aria/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── AudioPlayer.ts
│   │   ├── ScoreViewer.ts
│   │   └── LyricsViewer.ts
│   ├── views/            # Page-level components
│   │   ├── LibraryView.ts
│   │   ├── ProjectView.ts
│   │   ├── SearchView.ts
│   │   ├── PlaylistsView.ts
│   │   └── ImportExportView.ts
│   ├── services/         # Business logic and data access
│   │   ├── db.ts
│   │   ├── search.ts
│   │   └── import-export.ts
│   ├── models/           # TypeScript interfaces
│   │   └── types.ts
│   ├── app.ts           # Main app component
│   ├── routes.ts        # Route definitions
│   └── index.ts         # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Usage

### Creating a Project

1. Navigate to Library
2. Click "New Project"
3. Add metadata (title, composer, voice type, etc.)
4. Upload audio files, scores, and/or lyrics
5. Save the project

### Searching

Use the Search page to find projects by title, composer, tags, or other metadata.

### Playlists

1. Navigate to Playlists
2. Create a new playlist
3. Add projects to the playlist
4. Configure pause duration between items
5. Play the playlist in sequence

### Import/Export

- **Export All**: Download all projects and playlists as a JSON file
- **Export Project**: Download a single project as JSON or generate a shareable permalink
- **Import**: Upload a JSON file or paste a permalink to import projects

## Permalink Format

Permalinks use the format: `PA1:{base64-lzstring-data}`

The data is compressed using LZ-String and contains the complete project including audio and score blobs encoded as Base64.

## Data Model

### Project
- Metadata (title, composer, genre, voice type, year, tags, description)
- Audio track (optional)
- Lyrics (optional)
- Scores (multiple, optional)
- Cue points (measure numbers mapped to timestamps)

### Playlist
- Name and description
- List of projects
- Pause duration between items (0-30 seconds)

## Browser Compatibility

PocketAria works best in modern browsers with support for:
- IndexedDB
- Service Workers
- Web Audio API
- File API
- Blob/ArrayBuffer

Recommended browsers: Chrome, Edge, Firefox, Safari (latest versions)

## License

MIT

## Future Enhancements

- Waveform visualization
- Synchronized scrolling for lyrics
- Advanced cue point editor
- Category grouping view
- Cloud sync (optional)
- Multi-language support
