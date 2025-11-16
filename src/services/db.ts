import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Project, Playlist } from '@/models/types';

interface PocketAriaDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: {
      'by-title': string;
      'by-composer': string;
      'by-genre': string;
      'by-voiceType': string;
      'by-createdAt': number;
    };
  };
  playlists: {
    key: string;
    value: Playlist;
    indexes: {
      'by-name': string;
      'by-createdAt': number;
    };
  };
}

const DB_NAME = 'pocket-aria-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<PocketAriaDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<PocketAriaDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<PocketAriaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Projects store
      if (!db.objectStoreNames.contains('projects')) {
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('by-title', 'metadata.title');
        projectStore.createIndex('by-composer', 'metadata.composer');
        projectStore.createIndex('by-genre', 'metadata.genre');
        projectStore.createIndex('by-voiceType', 'metadata.voiceType');
        projectStore.createIndex('by-createdAt', 'metadata.createdAt');
      }

      // Playlists store
      if (!db.objectStoreNames.contains('playlists')) {
        const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
        playlistStore.createIndex('by-name', 'name');
        playlistStore.createIndex('by-createdAt', 'createdAt');
      }
    },
  });

  return dbInstance;
}

// Project operations
export async function saveProject(project: Project): Promise<void> {
  const db = await initDB();
  await db.put('projects', project);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await initDB();
  return db.get('projects', id);
}

export async function getAllProjects(): Promise<Project[]> {
  const db = await initDB();
  return db.getAll('projects');
}

export async function deleteProject(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('projects', id);
}

export async function searchProjects(query: {
  title?: string;
  composer?: string;
  genre?: string;
  voiceType?: string;
}): Promise<Project[]> {
  const db = await initDB();
  const allProjects = await db.getAll('projects');

  return allProjects.filter(project => {
    if (query.title && !project.metadata.title.toLowerCase().includes(query.title.toLowerCase())) {
      return false;
    }
    if (query.composer && !project.metadata.composer?.toLowerCase().includes(query.composer.toLowerCase())) {
      return false;
    }
    if (query.genre && project.metadata.genre !== query.genre) {
      return false;
    }
    if (query.voiceType && project.metadata.voiceType !== query.voiceType) {
      return false;
    }
    return true;
  });
}

// Playlist operations
export async function savePlaylist(playlist: Playlist): Promise<void> {
  const db = await initDB();
  await db.put('playlists', playlist);
}

export async function getPlaylist(id: string): Promise<Playlist | undefined> {
  const db = await initDB();
  return db.get('playlists', id);
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await initDB();
  return db.getAll('playlists');
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('playlists', id);
}

// Utility functions
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
