import m from "mithril";
import "mithril-materialized/index.css";
import "./styles.css";
import { App } from "./app";
import { LibraryView } from './views/LibraryView';
import { ProjectView } from './views/ProjectView';
import { ProjectEditor } from './views/ProjectEditor';
import { PracticeView } from './views/PracticeView';
import { LrcEditorView } from './views/LrcEditorView';
import { SearchView } from './views/SearchView';
import { PlaylistsView } from './views/PlaylistsView';
import { ImportExportView } from './views/ImportExportView';
import { registerSW } from 'virtual:pwa-register';
import { parsePermalink } from './services/import-export';
import { saveProject } from './services/db';

// Handle permalink query parameter from hash-based routing
const handlePermalinkParam = async () => {
  // Parse query params from the hash (e.g., #!/import-export?permalink=...)
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');

  if (queryIndex === -1) return;

  const queryString = hash.substring(queryIndex + 1);
  const urlParams = new URLSearchParams(queryString);
  const permalinkData = urlParams.get('permalink');

  if (permalinkData) {
    try {
      const project = await parsePermalink(decodeURIComponent(permalinkData));
      await saveProject(project);

      // Navigate to the imported song (this also cleans up the URL)
      m.route.set(`/song/${project.id}`);
    } catch (error) {
      console.error('Failed to import from permalink:', error);
      // Navigate to import-export page without the query param
      m.route.set('/import-export');
    }
  }
};

// Call after routes are set up
setTimeout(handlePermalinkParam, 100);

// Initialize Mithril routing
m.route(document.body, "/library", {
  "/": {
    render: () => m(App, m(LibraryView)),
  },
  "/library": {
    render: () => m(App, m(LibraryView)),
  },
  "/search": {
    render: () => m(App, m(SearchView)),
  },
  "/playlists": {
    render: () => m(App, m(PlaylistsView)),
  },
  "/playlist/:id": {
    render: () => m(App, m(PlaylistsView)),
  },
  "/song/new": {
    render: () => m(App, m(ProjectEditor)),
  },
  "/song/:id": {
    render: () => m(App, m(ProjectView)),
  },
  "/song/:id/edit": {
    render: () => m(App, m(ProjectEditor)),
  },
  "/song/:id/practice": {
    render: () => m(PracticeView),
  },
  "/song/:id/lrc-editor": {
    render: () => m(App, m(LrcEditorView)),
  },
  "/import-export": {
    render: () => m(App, m(ImportExportView)),
  },
});

// Register service worker for PWA using Vite PWA plugin
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});
