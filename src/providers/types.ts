import type {
  Track,
  Artist,
  Album,
  SearchResults,
  ProviderCapabilities,
  ProviderId,
} from '../types/music';

// ============================================================
// TracMusic Provider Interface
// All providers must implement this interface.
// Only implement methods listed in getCapabilities().
// ============================================================

export interface SearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  page?: string | null;
}

export interface MusicProvider {
  readonly id: ProviderId;
  readonly displayName: string;

  /** Returns what this provider can and cannot do. */
  getCapabilities(): ProviderCapabilities;

  /** Search for tracks. Throws if canSearchTracks is false. */
  searchTracks(options: SearchOptions): Promise<SearchResults>;

  /** Search for artists. Throws if canSearchArtists is false. */
  searchArtists(options: SearchOptions): Promise<Artist[]>;

  /** Search for albums. Throws if canSearchAlbums is false. */
  searchAlbums(options: SearchOptions): Promise<Album[]>;

  /** Get detailed track info including stream URL if available. */
  getTrackDetails(providerTrackId: string): Promise<Track>;

  /** Get all tracks in an album. */
  getAlbumTracks(providerAlbumId: string): Promise<Track[]>;

  /** Get artist details. */
  getArtistDetails(providerArtistId: string): Promise<Artist>;

  /** Get artist's top tracks. */
  getArtistTracks(providerArtistId: string): Promise<Track[]>;

  /** Resolve the playable audio URL for a track at play time.
   *  Returns null if audio is not available.
   *  Must not return unauthorized extracted URLs. */
  getPlayableSource(providerTrackId: string): Promise<string | null>;
}

// Error thrown when a provider does not support a capability
export class ProviderCapabilityError extends Error {
  constructor(providerId: ProviderId, capability: string) {
    super(`Provider "${providerId}" does not support: ${capability}`);
    this.name = 'ProviderCapabilityError';
  }
}

// Error thrown when an API call fails
export class ProviderApiError extends Error {
  constructor(
    providerId: ProviderId,
    public readonly statusCode: number | null,
    message: string,
  ) {
    super(`[${providerId}] API Error${statusCode ? ` (${statusCode})` : ''}: ${message}`);
    this.name = 'ProviderApiError';
  }
}
