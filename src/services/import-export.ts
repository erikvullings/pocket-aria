import LZString from 'lz-string';
import { Project, Playlist, ExportData } from '@/models/types';

const PERMALINK_VERSION = 'PA1';

/**
 * Convert Blob to Base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert Base64 string to Blob
 */
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(',');
  const contentType = parts[0].match(/:(.*?);/)?.[1] || '';
  const raw = atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Prepare project for export by converting blobs to base64
 */
async function prepareProjectForExport(project: Project): Promise<any> {
  const exported: any = {
    ...project,
    scores: await Promise.all(
      project.scores.map(async (score) => ({
        ...score,
        blob: await blobToBase64(score.blob)
      }))
    )
  };

  if (project.audioTrack) {
    exported.audioTrack = {
      ...project.audioTrack,
      blob: await blobToBase64(project.audioTrack.blob)
    };
  }

  return exported;
}

/**
 * Restore project from export by converting base64 to blobs
 */
function restoreProjectFromExport(exported: any): Project {
  const project: Project = {
    ...exported,
    scores: exported.scores.map((score: any) => ({
      ...score,
      blob: base64ToBlob(score.blob)
    }))
  };

  if (exported.audioTrack) {
    project.audioTrack = {
      ...exported.audioTrack,
      blob: base64ToBlob(exported.audioTrack.blob)
    };
  }

  return project;
}

/**
 * Export single project to JSON
 */
export async function exportProjectToJSON(project: Project): Promise<string> {
  const exported = await prepareProjectForExport(project);
  return JSON.stringify(exported, null, 2);
}

/**
 * Export multiple projects and playlists to JSON
 */
export async function exportAllToJSON(projects: Project[], playlists: Playlist[]): Promise<string> {
  const exportData: ExportData = {
    version: '1.0',
    projects: await Promise.all(projects.map(prepareProjectForExport)),
    playlists,
    exportedAt: Date.now()
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import project from JSON
 */
export function importProjectFromJSON(json: string): Project {
  const data = JSON.parse(json);
  return restoreProjectFromExport(data);
}

/**
 * Import multiple projects and playlists from JSON
 */
export function importAllFromJSON(json: string): ExportData {
  const data: ExportData = JSON.parse(json);
  return {
    ...data,
    projects: data.projects.map(restoreProjectFromExport)
  };
}

/**
 * Generate permalink for a project
 */
export async function generatePermalink(project: Project): Promise<string> {
  const exported = await prepareProjectForExport(project);
  const json = JSON.stringify(exported);
  const compressed = LZString.compressToBase64(json);
  return `${PERMALINK_VERSION}:${compressed}`;
}

/**
 * Parse permalink and restore project
 */
export function parsePermalink(permalink: string): Project {
  const [version, compressed] = permalink.split(':');

  if (version !== PERMALINK_VERSION) {
    throw new Error(`Unsupported permalink version: ${version}`);
  }

  const json = LZString.decompressFromBase64(compressed);
  if (!json) {
    throw new Error('Failed to decompress permalink');
  }

  const data = JSON.parse(json);
  return restoreProjectFromExport(data);
}

/**
 * Download data as file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read file content
 */
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
