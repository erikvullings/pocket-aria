import LZString from "lz-string";
import { Project, Playlist, ExportData } from "@/models/types";

const PERMALINK_VERSION = "PA1";
const PERMALINK_0x0_VERSION = "PA2"; // For catbox/litterbox hosted files
const EXPIRY_TIME = "72h"; // 3 days

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
  const parts = base64.split(",");
  const contentType = parts[0].match(/:(.*?);/)?.[1] || "";
  const raw = atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Upload a file to litterbox.catbox.moe with 72-hour expiry
 * litterbox has excellent CORS support
 */
async function uploadToLitterbox(
  blob: Blob,
  suggestedName: string
): Promise<string> {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("time", EXPIRY_TIME);
  form.append("fileToUpload", blob, suggestedName);

  const resp = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
    method: "POST",
    body: form,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Litterbox upload failed: ${resp.status} – ${err}`);
  }

  const url = await resp.text();

  // Check if the response is an error message
  if (url.includes("error") || !url.startsWith("http")) {
    throw new Error(`Litterbox upload failed: ${url}`);
  }

  return url.trim();
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
        blob: await blobToBase64(score.blob),
      }))
    ),
  };

  if (project.audioTrack) {
    exported.audioTrack = {
      ...project.audioTrack,
      blob: await blobToBase64(project.audioTrack.blob),
    };
  }

  return exported;
}

/**
 * Prepare project for 0x0.st export as a single blob
 * Uses the same format as prepareProjectForExport (base64-encoded blobs in JSON)
 */
async function prepareProjectBlobForHostedExport(
  project: Project
): Promise<Blob> {
  const exported = await prepareProjectForExport(project);
  const json = JSON.stringify(exported);
  return new Blob([json], { type: "application/json" });
}

/**
 * Restore project from export by converting base64 to blobs
 */
function restoreProjectFromExport(exported: any): Project {
  const project: Project = {
    ...exported,
    scores: exported.scores.map((score: any) => ({
      ...score,
      blob: base64ToBlob(score.blob),
    })),
  };

  if (exported.audioTrack) {
    project.audioTrack = {
      ...exported.audioTrack,
      blob: base64ToBlob(exported.audioTrack.blob),
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
export async function exportAllToJSON(
  projects: Project[],
  playlists: Playlist[]
): Promise<string> {
  const exportData: ExportData = {
    version: "1.0",
    projects: await Promise.all(projects.map(prepareProjectForExport)),
    playlists,
    exportedAt: Date.now(),
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
    projects: data.projects.map(restoreProjectFromExport),
  };
}

/**
 * Generate permalink for a project
 * Always uploads to litterbox.catbox.moe with 72-hour expiry
 */
export async function generatePermalink(project: Project): Promise<string> {
  // Create single blob with all project data
  const blob = await prepareProjectBlobForHostedExport(project);

  // Upload to litterbox
  const url = await uploadToLitterbox(blob, "pocket-aria-project.json");

  // Create compact permalink with just the URL
  const encoded = btoa(url)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${PERMALINK_0x0_VERSION}:${encoded}`;
}

/**
 * Parse permalink and restore project
 * Supports both compressed (PA1) and hosted (PA2) permalinks
 */
export async function parsePermalink(permalink: string): Promise<Project> {
  const [version, data] = permalink.split(":");

  if (version === PERMALINK_VERSION) {
    // Original compressed format
    const json = LZString.decompressFromBase64(data);
    if (!json) {
      throw new Error("Failed to decompress permalink");
    }
    const parsed = JSON.parse(json);
    return restoreProjectFromExport(parsed);
  }

  if (version === PERMALINK_0x0_VERSION) {
    // Hosted format from 0x0.st
    return parseHostedPermalink(data);
  }

  throw new Error(`Unsupported permalink version: ${version}`);
}

/**
 * Parse hosted permalink from litterbox/catbox
 */
async function parseHostedPermalink(encoded: string): Promise<Project> {
  try {
    // Decode the URL
    const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
    const url = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));

    // Fetch the project data directly
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch shared project data");
    }

    const json = await response.text();
    const data = JSON.parse(json);

    return restoreProjectFromExport(data);
  } catch (err) {
    console.error("Failed to parse hosted permalink:", err);
    throw new Error(
      `Failed to load shared project: ${
        err instanceof Error ? err.message : "Unknown error"
      }`
    );
  }
}

/**
 * Download data as file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = "application/json"
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
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
