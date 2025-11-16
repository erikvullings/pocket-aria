import m from "mithril";
import "mithril-materialized/index.css";
import { App } from "./app";
import { LibraryView } from './views/LibraryView';
import { ProjectView } from './views/ProjectView';
import { ProjectEditor } from './views/ProjectEditor';
import { SearchView } from './views/SearchView';
import { PlaylistsView } from './views/PlaylistsView';
import { ImportExportView } from './views/ImportExportView';
import { registerSW } from 'virtual:pwa-register';

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
