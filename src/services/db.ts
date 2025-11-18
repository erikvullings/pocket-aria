import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Project, Playlist } from '@/models/types';

export interface AppSettings {
  key: string;
  value: string | number | boolean;
}

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
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'pocket-aria-db';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<PocketAriaDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<PocketAriaDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<PocketAriaDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

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

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
    blocked() {
      console.warn('Database upgrade blocked - please close other tabs using this app');
    },
    blocking() {
      console.warn('Database blocking another connection - closing this connection');
      dbInstance?.close();
      dbInstance = null;
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

// Settings operations
export async function saveSetting(key: string, value: string | number | boolean): Promise<void> {
  const db = await initDB();
  await db.put('settings', { key, value });
}

export async function getSetting<T extends string | number | boolean>(key: string): Promise<T | undefined> {
  const db = await initDB();
  const setting = await db.get('settings', key);
  return setting?.value as T | undefined;
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await initDB();
  await db.delete('settings', key);
}

// Utility functions
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
