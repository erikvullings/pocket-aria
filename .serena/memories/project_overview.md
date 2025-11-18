# Project Overview: PocketAria

## Purpose

PocketAria is a fully offline Progressive Web App (PWA) for managing vocal repertoire with audio tracks, scores, and lyrics. It allows users to organize, search, and play their vocal music collection entirely offline.

## Key Features

- Offline-first design using IndexedDB for data storage
- Audio playback with play/pause/seek controls (MP3, WAV, M4A)
- Score viewing (MusicXML, PDF, images)
- Lyrics display (plain text, Markdown, HTML)
- Full-text search functionality
- Playlist management
- Import/export via permalinks or JSON files
- Installable as standalone PWA

## Tech Stack

- **Framework**: Mithril.js with TypeScript
- **UI**: Material Design via Materialize CSS (using mithril-materialized)
- **Storage**: IndexedDB via idb library
- **Search**: MiniSearch for full-text search
- **Score Rendering**: PDF.js for PDFs, OpenSheetMusicDisplay for MusicXML
- **Compression**: LZ-String for permalinks
- **Build Tool**: Vite
- **Package Manager**: pnpm (version 10.22.0)
