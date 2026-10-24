// ============================================================
// Jamendo Provider
// API docs: https://developer.jamendo.com/v3.0
// License:  https://developer.jamendo.com/terms
//
// Jamendo tracks are released under Creative Commons licenses.
// Full streaming is permitted via the official API.
// Attribution is REQUIRED for CC-BY tracks.
// ============================================================

import type { MusicProvider, SearchOptions } from '../types';
import type {
  Track,
  Artist,
  Album,
  SearchResults,
  ProviderCapabilities,
  LicenseInfo,
} from '../../types/music';
import { ProviderCapabilityError, ProviderApiError } from '../types';

const JAMENDO_BASE = 'https://api.jamendo.com/v3.0';

// ---- Raw API response shapes ----
interface JamendoTrack {
  id: string;
  name: string;
  duration: number;
  artist_id: string;
  artist_name: string;
  album_id: string;
  album_name: string;
  album_image: string;
  image: string;
  audio: string;           // Direct MP3 stream URL (legal, official)
  audiodownload: string;   // Direct MP3 download URL
  shorturl: string;
  shareurl: string;
  license_ccurl: string;
}

interface JamendoArtist {
  id: string;
  name: string;
  image: string;
  shorturl: string;
  shareurl: string;
  website: string | null;
}

interface JamendoAlbum {
  id: string;
  name: string;
  artist_id: string;
  artist_name: string;
  image: string;
  releasedate: string;
  shareurl: string;
}

interface JamendoApiResponse<T> {
  headers: {
    status: string;
    code: number;
    error_message: string;
    results_count: number;
  };
  results: T[];
}

// ---- License resolution ----
function resolveLicense(ccUrl: string): LicenseInfo {
  // Jamendo provides CC URLs like https://creativecommons.org/licenses/by/3.0/
  const isAttribution = ccUrl.includes('/by');
  const isShareAlike  = ccUrl.includes('/sa');
  const isNoDerivs    = ccUrl.includes('/nd');
  const isNonComm     = ccUrl.includes('/nc');

  let name = 'CC ';
  if (isAttribution) name += 'BY';
  if (isNonComm)     name += '-NC';
  if (isNoDerivs)    name += '-ND';
  if (isShareAlike)  name += '-SA';
  name += ' 3.0';

  return {
    name,
    url: ccUrl || null,
    allowsStreaming:  true,
    allowsDownload:   !isNonComm,  // Non-commercial restricts redistribution
    requiresAttribution: isAttribution,
  };
}

// ---- Provider ----
export class JamendoProvider implements MusicProvider {
  readonly id = 'jamendo' as const;
  readonly displayName = 'Jamendo';

  private readonly clientId: string;

  constructor(clientId: string) {
    if (!clientId) {
      throw new Error(
        'Jamendo Client ID is required. Get a free key at https://developer.jamendo.com',
      );
    }
    this.clientId = clientId;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      canSearchTracks:   true,
      canSearchArtists:  true,
      canSearchAlbums:   true,
      canStreamAudio:    true,   // Official API provides direct MP3 URLs
      canGetLyrics:      false,  // Jamendo does not provide lyrics
      canImportPlaylists: false,
      requiresAuth:      false,  // Client ID only, no user auth
      supportsSeek:      true,   // MP3 files support seeking
      supportsPagination: true,
    };
  }

  // ---- Private helpers ----
  private async fetch<T>(
    endpoint: string,
    params: Record<string, string | number>,
  ): Promise<JamendoApiResponse<T>> {
    const url = new URL(`${JAMENDO_BASE}/${endpoint}`);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('format', 'json');
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (e) {
      throw new ProviderApiError('jamendo', null, 'Network request failed');
    }

    if (!response.ok) {
      throw new ProviderApiError('jamendo', response.status, response.statusText);
    }

    const data = (await response.json()) as JamendoApiResponse<T>;
    if (data.headers.code !== 0) {
      throw new ProviderApiError(
        'jamendo',
        data.headers.code,
        data.headers.error_message,
      );
    }

    return data;
  }

  private normalizeTrack(t: JamendoTrack): Track {
    return {
      id:               `jamendo:${t.id}`,
      providerId:       'jamendo',
      providerTrackId:  t.id,
      title:            t.name,
      artists: [{
        id:                `jamendo:${t.artist_id}`,
        providerId:        'jamendo',
        providerArtistId:  t.artist_id,
        name:              t.artist_name,
        imageUrl:          null,
        bio:               null,
        externalUrl:       null,
        providerName:      'Jamendo',
      }],
      album: t.album_id
        ? { id: `jamendo:${t.album_id}`, title: t.album_name, artworkUrl: t.album_image || null }
        : null,
      artworkUrl:           t.image || t.album_image || null,
      durationMs:           t.duration ? t.duration * 1000 : null,
      explicitStatus:       'unknown',
      externalUrl:          t.shareurl || null,
      playbackAvailability: t.audio ? 'available' : 'unavailable',
      streamUrl:            t.audio || null,
      licenseInfo:          t.license_ccurl ? resolveLicense(t.license_ccurl) : null,
      providerName:         'Jamendo',
    };
  }

  private normalizeArtist(a: JamendoArtist): Artist {
    return {
      id:                `jamendo:${a.id}`,
      providerId:        'jamendo',
      providerArtistId:  a.id,
      name:              a.name,
      imageUrl:          a.image || null,
      bio:               null,
      externalUrl:       a.shareurl || null,
      providerName:      'Jamendo',
    };
  }

  private normalizeAlbum(a: JamendoAlbum): Album {
    const year = a.releasedate ? parseInt(a.releasedate.slice(0, 4), 10) : null;
    return {
      id:                `jamendo:${a.id}`,
      providerId:        'jamendo',
      providerAlbumId:   a.id,
      title:             a.name,
      artists: [{
        id:                `jamendo:${a.artist_id}`,
        providerId:        'jamendo',
        providerArtistId:  a.artist_id,
        name:              a.artist_name,
        imageUrl:          null,
        bio:               null,
        externalUrl:       null,
        providerName:      'Jamendo',
      }],
      artworkUrl:   a.image || null,
      releaseYear:  isNaN(year ?? NaN) ? null : year,
      trackCount:   null,
      externalUrl:  a.shareurl || null,
      providerName: 'Jamendo',
    };
  }

  // ---- Public API ----
  async searchTracks(options: SearchOptions): Promise<SearchResults> {
    const limit  = options.limit ?? 20;
    const offset = options.offset ?? 0;

    const data = await this.fetch<JamendoTrack>('tracks', {
      namesearch: options.query,
      audioformat: 'mp32',   // 128kbps MP3 — matches API docs
      include:     'licenses',
      limit,
      offset,
    });

    return {
      tracks:      data.results.map(t => this.normalizeTrack(t)),
      artists:     [],
      albums:      [],
      query:       options.query,
      providerId:  'jamendo',
      totalTracks: null,   // Jamendo does not return total count
      hasMore:     data.results.length === limit,
      nextPage:    data.results.length === limit ? String(offset + limit) : null,
    };
  }

  async searchArtists(options: SearchOptions): Promise<Artist[]> {
    const data = await this.fetch<JamendoArtist>('artists', {
      namesearch: options.query,
      limit:      options.limit ?? 20,
      offset:     options.offset ?? 0,
    });
    return data.results.map(a => this.normalizeArtist(a));
  }

  async searchAlbums(options: SearchOptions): Promise<Album[]> {
    const data = await this.fetch<JamendoAlbum>('albums', {
      namesearch: options.query,
      limit:      options.limit ?? 20,
      offset:     options.offset ?? 0,
    });
    return data.results.map(a => this.normalizeAlbum(a));
  }

  async getTrackDetails(providerTrackId: string): Promise<Track> {
    const data = await this.fetch<JamendoTrack>('tracks', {
      id:          providerTrackId,
      audioformat: 'mp32',
      include:     'licenses',
    });
    if (!data.results[0]) {
      throw new ProviderApiError('jamendo', null, `Track ${providerTrackId} not found`);
    }
    return this.normalizeTrack(data.results[0]);
  }

  async getAlbumTracks(providerAlbumId: string): Promise<Track[]> {
    const data = await this.fetch<JamendoTrack>('tracks', {
      album_id:    providerAlbumId,
      audioformat: 'mp32',
      include:     'licenses',
      limit:       200,
    });
    return data.results.map(t => this.normalizeTrack(t));
  }

  async getArtistDetails(providerArtistId: string): Promise<Artist> {
    const data = await this.fetch<JamendoArtist>('artists', {
      id: providerArtistId,
    });
    if (!data.results[0]) {
      throw new ProviderApiError('jamendo', null, `Artist ${providerArtistId} not found`);
    }
    return this.normalizeArtist(data.results[0]);
  }

  async getArtistTracks(providerArtistId: string): Promise<Track[]> {
    const data = await this.fetch<JamendoTrack>('tracks', {
      artist_id:   providerArtistId,
      audioformat: 'mp32',
      include:     'licenses',
      limit:       50,
    });
    return data.results.map(t => this.normalizeTrack(t));
  }

  async getPlayableSource(providerTrackId: string): Promise<string | null> {
    // The audio URL is already included in track search/detail results.
    // We call getTrackDetails here to ensure we have a fresh URL.
    const track = await this.getTrackDetails(providerTrackId);
    return track.streamUrl;
  }

  // ---- Extra: get featured/trending tracks (uses Jamendo's popular endpoint) ----
  async getPopularTracks(limit = 20): Promise<Track[]> {
    const data = await this.fetch<JamendoTrack>('tracks', {
      order:       'popularity_week',
      audioformat: 'mp32',
      include:     'licenses',
      limit,
    });
    return data.results.map(t => this.normalizeTrack(t));
  }

  async getNewTracks(limit = 20): Promise<Track[]> {
    const data = await this.fetch<JamendoTrack>('tracks', {
      order:       'releasedate_desc',
      audioformat: 'mp32',
      include:     'licenses',
      limit,
    });
    return data.results.map(t => this.normalizeTrack(t));
  }
}
