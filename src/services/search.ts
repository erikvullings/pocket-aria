import MiniSearch from 'minisearch';
import { Project } from '@/models/types';

let searchIndex: MiniSearch<Project> | null = null;

export function initSearchIndex(projects: Project[]): void {
  searchIndex = new MiniSearch<Project>({
    idField: 'id',
    fields: ['title', 'composer', 'description', 'tags'],
    storeFields: ['id', 'metadata', 'audioTrack', 'scores', 'lyrics', 'cuePoints'],
    extractField: (document: Project, fieldName: string) => {
      // Handle ID field
      if (fieldName === 'id') return document.id;

      // Extract nested metadata fields for indexing
      if (fieldName === 'title') return document.metadata.title;
      if (fieldName === 'composer') return document.metadata.composer || '';
      if (fieldName === 'description') return document.metadata.description || '';
      if (fieldName === 'tags') return document.metadata.tags?.join(' ') || '';

      // Store entire nested objects
      if (fieldName === 'metadata') return document.metadata;
      if (fieldName === 'audioTrack') return document.audioTrack;
      if (fieldName === 'scores') return document.scores;
      if (fieldName === 'lyrics') return document.lyrics;
      if (fieldName === 'cuePoints') return document.cuePoints;

      return '';
    },
    searchOptions: {
      boost: { title: 2, composer: 1.5 },
      fuzzy: 0.2,
      prefix: true
    }
  });

  searchIndex.addAll(projects);
}

export function updateSearchIndex(projects: Project[]): void {
  if (!searchIndex) {
    initSearchIndex(projects);
    return;
  }

  searchIndex.removeAll();
  searchIndex.addAll(projects);
}

export function searchProjects(query: string): Project[] {
  if (!searchIndex || !query.trim()) {
    return [];
  }

  const results = searchIndex.search(query);
  // MiniSearch returns objects with stored fields, we need to reconstruct Project objects
  return results.map((result: any) => ({
    id: result.id,
    metadata: result.metadata,
    audioTrack: result.audioTrack,
    scores: result.scores || [],
    lyrics: result.lyrics,
    cuePoints: result.cuePoints || []
  } as Project));
}

export function addToSearchIndex(project: Project): void {
  if (!searchIndex) {
    return;
  }

  searchIndex.add(project);
}

export function removeFromSearchIndex(projectId: string): void {
  if (!searchIndex) {
    return;
  }

  searchIndex.discard(projectId);
}
