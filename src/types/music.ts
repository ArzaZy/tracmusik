// ============================================================
// TracMusic - Core Music Data Types
// ============================================================

export type ProviderId = 'jamendo' | 'youtube_companion' | 'local';

export type PlaybackAvailability =
  | 'available'       // Can be played directly
  | 'preview_only'    // Only short preview available
  | 'external_only'   // Must open in external app
  | 'unavailable'     // Cannot be played
  | 'unknown';        // Not yet checked

export type ExplicitStatus = 'explicit' | 'clean' | 'unknown';

// ---- Track ----
export interface Track {
  id: string;                          // Internal unique ID: `{providerId}:{providerTrackId}`
  providerId: ProviderId;
  providerTrackId: string;
  title: string;
  artists: Artist[];
  album: AlbumRef | null;
  artworkUrl: string | null;
  durationMs: number | null;
  explicitStatus: ExplicitStatus;
  externalUrl: string | null;
  playbackAvailability: PlaybackAvailability;
  streamUrl: string | null;            // Populated only when playback is available
  licenseInfo: LicenseInfo | null;
  providerName: string;                // Human-readable provider name for UI attribution
}

// ---- Artist ----
export interface Artist {
  id: string;
  providerId: ProviderId;
  providerArtistId: string;
  name: string;
  imageUrl: string | null;
  bio: string | null;
  externalUrl: string | null;
  providerName: string;
}

// ---- Album ----
export interface Album {
  id: string;
  providerId: ProviderId;
  providerAlbumId: string;
  title: string;
  artists: Artist[];
  artworkUrl: string | null;
  releaseYear: number | null;
  trackCount: number | null;
  externalUrl: string | null;
  providerName: string;
}

// Reference to an album used inside a Track (avoids circular refs)
export interface AlbumRef {
  id: string;
  title: string;
  artworkUrl: string | null;
}

// ---- License ----
export interface LicenseInfo {
  name: string;           // e.g. "CC BY-SA 3.0"
  url: string | null;
  allowsStreaming: boolean;
  allowsDownload: boolean;
  requiresAttribution: boolean;
}

// ---- Playlist ----
export interface Playlist {
  id: string;
  title: string;
  description: string | null;
  artworkUrl: string | null;
  trackIds: string[];                 // Array of Track.id (can span providers)
  createdAt: string;
  updatedAt: string;
  isLocal: boolean;                   // true = guest/local, false = synced to Supabase
  userId: string | null;
}

// ---- Queue ----
export interface QueueItem {
  queueId: string;                    // Unique per-queue-slot
  track: Track;
  addedAt: number;                    // timestamp ms
}

// ---- Playback State ----
export type PlaybackStatus =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'error';

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlaybackState {
  status: PlaybackStatus;
  currentTrack: Track | null;
  queue: QueueItem[];
  currentQueueIndex: number;
  positionMs: number;
  durationMs: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  errorMessage: string | null;
}

// ---- Search ----
export interface SearchResults {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  query: string;
  providerId: ProviderId;
  totalTracks: number | null;
  hasMore: boolean;
  nextPage: string | null;
}

// ---- Provider Capabilities ----
export interface ProviderCapabilities {
  canSearchTracks: boolean;
  canSearchArtists: boolean;
  canSearchAlbums: boolean;
  canStreamAudio: boolean;
  canGetLyrics: boolean;
  canImportPlaylists: boolean;
  requiresAuth: boolean;
  supportsSeek: boolean;
  supportsPagination: boolean;
}
