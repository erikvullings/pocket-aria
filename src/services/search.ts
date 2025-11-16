import MiniSearch from 'minisearch';
import { Project } from '@/models/types';

let searchIndex: MiniSearch<Project> | null = null;

export function initSearchIndex(projects: Project[]): void {
  searchIndex = new MiniSearch<Project>({
    fields: ['metadata.title', 'metadata.composer', 'metadata.description', 'metadata.tags'],
    storeFields: ['id', 'metadata'],
    searchOptions: {
      boost: { 'metadata.title': 2, 'metadata.composer': 1.5 },
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

  return searchIndex.search(query) as unknown as Project[];
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
