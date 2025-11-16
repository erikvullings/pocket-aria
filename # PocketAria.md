# PocketAria

## 1. Technology Requirements

- Framework: **Mithril.js** (TypeScript)
- UI Library: **mithril-materialized**
- Storage: **IndexedDB** (via `idb`)
- Fully offline capable
- PWA (service worker + manifest)
- No backend
- All data must be exportable via JSON + Base64 blobs and via permalinks

## 2. Core Features

### 2.1 Audio Handling

- Upload legal audio files (MP3, WAV, M4A)
- Store audio Blobs in IndexedDB
- Audio player:
- Play / pause / seek
- Display time & duration
- Replay mode
- Optional waveform view (later)

### 2.2 Lyrics Handling

- User can upload lyrics as:
- Plain text
- Markdown
- Simple formatted HTML
- Lyrics-only mode available even without scores
- Synchronized scrolling option (optional future feature)

### 2.3 Score Handling

- Import:
- **MusicXML** (render using OSMD)
- **PDF** (render using pdf.js)
- **Images** (PNG/JPG)
- Display score with audio player
- Cue point editor:
- User can assign measure numbers to timestamps

### 2.4 Metadata

All items must support:

- title
- composer
- genre (classical, pop, jazz, choir, folk, other)
- tags[]
- **year** (released/written)
- **voice type** (soprano, mezzo, alto, tenor, baritone, bass, other)
- description/notes
- createdAt

### 2.5 Playlists

- User can create one or more playlists
- Add any Project/Song to playlist
- Reorder playlist entries
- Play in sequence
- Configurable **pause between items (0–30 sec)**

### 2.6 Projects (Songs)

- Combine:
- audio track (optional)
- lyrics (optional)
- scores (optional)
- metadata
- cue points
- Export single project as:
- **Permalink** (LZ-compressed Base64 JSON)
- **JSON file** containing Base64 blobs

### 2.7 Search & Categorization

- Search by:
- title
- composer
- year
- genre
- voice type
- tags
- Local index using MiniSearch or custom filter
- Category view (grouping)

### 2.8 Sharing / Import/Export

- Everything must be shareable without backend
- Permalink format:

```
PA1:{base64-lzstring-data}
```

- JSON import/export
- Import restores IndexedDB items

### 2.9 UI Requirements

- Mobile-first layout
- Material Design via mithril-materialized
- Main Views:

1. Library
2. Search
3. Categories
4. Playlists
5. Project/Song view
6. Editor (metadata, cues, lyrics)
7. Import / Export

### 2.10 App Structure

```
src/
index.ts
app.ts
routes.ts
components/
AudioPlayer.ts
ScoreViewer.ts
```
