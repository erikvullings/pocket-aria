# Codebase Structure

## Directory Layout

```bash
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
│   ├── utils/            # Utility functions
│   ├── assets/           # Static assets
│   ├── app.ts           # Main app component
│   ├── routes.ts        # Route definitions
│   └── index.ts         # Entry point
├── public/              # Public assets
├── docs/                # Documentation
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Key Directories

- **components/**: Reusable UI components (audio player, score viewer, lyrics viewer)
- **views/**: Page-level components for different routes
- **services/**: Business logic, database operations, search functionality
- **models/**: TypeScript type definitions and interfaces
- **utils/**: Helper functions and utilities
