/**
 * LRC format utilities for parsing and formatting timestamped lyrics
 */

import { LrcTimestamp } from "../models/types";

/**
 * Format seconds to LRC timestamp format [MM:SS.xx]
 */
export function formatLrcTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `[${mins.toString().padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}]`;
}

/**
 * Parse LRC timestamp string to seconds
 */
export function parseLrcTimestamp(timestamp: string): number | null {
  const match = timestamp.match(/\[(\d{2}):(\d{2})\.(\d{2})\]/);
  if (!match) return null;

  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const centiseconds = parseInt(match[3], 10);

  return minutes * 60 + seconds + centiseconds / 100;
}

/**
 * Convert lyrics content with LRC timestamps to plain text and timestamp array
 */
export function parseLrcContent(content: string): {
  plainText: string;
  timestamps: LrcTimestamp[];
} {
  const lines = content.split("\n");
  const plainLines: string[] = [];
  const timestamps: LrcTimestamp[] = [];

  lines.forEach((line, index) => {
    const timestampMatch = line.match(/^\[(\d{2}):(\d{2})\.(\d{2})\]/);
    if (timestampMatch) {
      const timestamp = parseLrcTimestamp(timestampMatch[0]);
      if (timestamp !== null) {
        timestamps.push({ lineIndex: index, timestamp });
      }
      plainLines.push(line.replace(/^\[(\d{2}):(\d{2})\.(\d{2})\]/, "").trim());
    } else {
      plainLines.push(line);
    }
  });

  return {
    plainText: plainLines.join("\n"),
    timestamps,
  };
}

/**
 * Convert plain text and timestamps to LRC format content
 */
export function formatLrcContent(
  plainText: string,
  timestamps: LrcTimestamp[]
): string {
  const lines = plainText.split("\n");
  const timestampMap = new Map<number, number>();

  timestamps.forEach((ts) => {
    timestampMap.set(ts.lineIndex, ts.timestamp);
  });

  return lines
    .map((line, index) => {
      const timestamp = timestampMap.get(index);
      if (timestamp !== undefined) {
        return `${formatLrcTimestamp(timestamp)}${line}`;
      }
      return line;
    })
    .join("\n");
}

/**
 * Find the active line index based on current time and timestamps
 */
export function getActiveLrcLine(
  currentTime: number,
  timestamps: LrcTimestamp[]
): number {
  if (timestamps.length === 0) return -1;

  // Sort timestamps by timestamp value
  const sorted = [...timestamps].sort((a, b) => a.timestamp - b.timestamp);

  // Find the last timestamp that is less than or equal to current time
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].timestamp <= currentTime) {
      return sorted[i].lineIndex;
    }
  }

  return -1;
}
