import { Project } from "@/models/types";
import { generatePermalink } from "@/services/import-export";

/**
 * Generate a shareable permalink URL for a project and copy it to clipboard
 * @param project - The project to generate a permalink for
 * @returns Promise that resolves with the full URL or rejects with an error
 */
export async function copyPermalinkToClipboard(
  project: Project
): Promise<string> {
  const permalink = await generatePermalink(project);
  const baseUrl = window.location.origin + window.location.pathname;
  const fullUrl = `${baseUrl}#!/import-export?permalink=${encodeURIComponent(
    permalink
  )}`;

  await navigator.clipboard.writeText(fullUrl);
  return fullUrl;
}
