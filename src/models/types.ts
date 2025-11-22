/**
 * Core data models for PocketAria
 */

export type Genre = 'classical' | 'pop' | 'jazz' | 'choir' | 'folk' | 'other';

export type VoiceType = 'soprano' | 'mezzo' | 'alto' | 'tenor' | 'baritone' | 'bass' | 'other';

export type ScoreType = 'musicxml' | 'pdf' | 'image';

export type LyricsFormat = 'text' | 'markdown' | 'html';

export type ContentType = 'classical' | 'karaoke' | 'language-learning' | 'other';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface Metadata {
  title: string;
  composer?: string;
  genre?: Genre;
  tags?: string[];
  year?: number;
  voiceType?: VoiceType;
  description?: string;
  createdAt: number;

  // Content categorization
  contentType?: ContentType;

  // Classical singing specific
  operaOrWork?: string;
  characterRole?: string;

  // Karaoke specific
  artist?: string;
  difficulty?: Difficulty;

  // Language learning specific
  language?: string;
}

export interface CuePoint {
  measureNumber: number;
  timestamp: number; // in seconds
  label?: string;
}

export interface Bookmark {
  id: string;
  timestamp: number; // in seconds
}

export interface Score {
  id: string;
  type: ScoreType;
  blob: Blob;
  filename: string;
}

export interface LrcTimestamp {
  lineIndex: number;
  timestamp: number; // in seconds
}

export interface Lyrics {
  id: string;
  format: LyricsFormat;
  content: string;
  translation?: string;
  translationLanguage?: string;
  lrcTimestamps?: LrcTimestamp[];
}

export interface AudioTrack {
  id: string;
  blob: Blob;
  filename: string;
  duration?: number;
}

export interface Project {
  id: string;
  metadata: Metadata;
  audioTrack?: AudioTrack;
  lyrics?: Lyrics;
  scores: Score[];
  cuePoints: CuePoint[];
  bookmarks?: Bookmark[];
}

export interface PlaylistItem {
  projectId: string;
  order: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  items: PlaylistItem[];
  pauseBetweenItems: number; // 0-30 seconds
  createdAt: number;
}

export interface ExportData {
  version: string;
  projects: Project[];
  playlists: Playlist[];
  exportedAt: number;
}
