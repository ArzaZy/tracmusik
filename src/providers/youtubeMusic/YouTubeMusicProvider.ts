// ============================================================
// TracMusic — YouTube Music Companion Provider
//
// PENTING — INI BUKAN AUDIO EXTRACTOR.
// Provider ini HANYA menyimpan link eksternal dan membuka
// track di aplikasi YouTube Music atau browser.
//
// Yang TIDAK dilakukan:
//   ❌ Mengekstrak audio dari YouTube
//   ❌ Menggunakan endpoint tidak resmi (yt-dlp, cobalt, dll.)
//   ❌ Mengumpulkan password Google
//   ❌ Bypass pembatasan akses YouTube
//
// Yang dilakukan:
//   ✅ Menyimpan ID video YouTube yang disediakan pengguna
//   ✅ Membuka link di YouTube Music / browser
//   ✅ Mencocokkan metadata playlist dengan provider lain
//   ✅ Import metadata dari file ekspor yang didukung pengguna
// ============================================================

import { Linking } from 'react-native';
import type { MusicProvider, SearchOptions } from '../types';
import type {
  Track, Artist, Album, SearchResults, ProviderCapabilities,
} from '../../types/music';
import { ProviderCapabilityError } from '../types';

// YouTube Music deep-link patterns (official)
const YTM_TRACK_URL   = (videoId: string) => `https://music.youtube.com/watch?v=${videoId}`;
const YTM_SCHEME      = (videoId: string) => `youtubemusic://watch?v=${videoId}`;

export class YouTubeMusicProvider implements MusicProvider {
  readonly id          = 'youtube_companion' as const;
  readonly displayName = 'YouTube Music';

  getCapabilities(): ProviderCapabilities {
    return {
      canSearchTracks:    false,  // No search API access
      canSearchArtists:   false,
      canSearchAlbums:    false,
      canStreamAudio:     false,  // Audio is NEVER extracted
      canGetLyrics:       false,
      canImportPlaylists: true,   // Via user-exported file
      requiresAuth:       false,
      supportsSeek:       false,
      supportsPagination: false,
    };
  }

  // ---- All search/playback methods throw — not supported ----
  async searchTracks(_: SearchOptions): Promise<SearchResults> {
    throw new ProviderCapabilityError(this.id, 'searchTracks');
  }
  async searchArtists(_: SearchOptions): Promise<Artist[]> {
    throw new ProviderCapabilityError(this.id, 'searchArtists');
  }
  async searchAlbums(_: SearchOptions): Promise<Album[]> {
    throw new ProviderCapabilityError(this.id, 'searchAlbums');
  }
  async getTrackDetails(_: string): Promise<Track> {
    throw new ProviderCapabilityError(this.id, 'getTrackDetails');
  }
  async getAlbumTracks(_: string): Promise<Track[]> {
    throw new ProviderCapabilityError(this.id, 'getAlbumTracks');
  }
  async getArtistDetails(_: string): Promise<Artist> {
    throw new ProviderCapabilityError(this.id, 'getArtistDetails');
  }
  async getArtistTracks(_: string): Promise<Track[]> {
    throw new ProviderCapabilityError(this.id, 'getArtistTracks');
  }
  async getPlayableSource(_: string): Promise<string | null> {
    // Audio extraction is forbidden. Return null — caller opens externally.
    return null;
  }

  // ---- External link handling (the ONLY playback mechanism) ----

  /**
   * Opens a YouTube Music track in the YouTube Music app or browser.
   * This is the ONLY way TracMusic "plays" YouTube Music content.
   */
  async openInYouTubeMusic(videoId: string): Promise<boolean> {
    // Try YouTube Music app first (deep link)
    const appUrl     = YTM_SCHEME(videoId);
    const browserUrl = YTM_TRACK_URL(videoId);

    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
        return true;
      }
    } catch {}

    // Fall back to browser
    try {
      await Linking.openURL(browserUrl);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Creates a Track object that represents an external YouTube Music link.
   * playbackAvailability is 'external_only' — the UI must show
   * "Open in YouTube Music" instead of a play button.
   */
  createExternalTrack({
    videoId,
    title,
    artistName,
    albumName,
    artworkUrl,
    durationMs,
  }: {
    videoId:     string;
    title:       string;
    artistName:  string;
    albumName?:  string;
    artworkUrl?: string;
    durationMs?: number;
  }): Track {
    return {
      id:               `youtube_companion:${videoId}`,
      providerId:       'youtube_companion',
      providerTrackId:  videoId,
      title,
      artists: [{
        id:                `youtube_companion:artist_${artistName.toLowerCase().replace(/\s+/g, '_')}`,
        providerId:        'youtube_companion',
        providerArtistId:  artistName,
        name:              artistName,
        imageUrl:          null,
        bio:               null,
        externalUrl:       null,
        providerName:      'YouTube Music',
      }],
      album: albumName ? {
        id:        `youtube_companion:album_${albumName}`,
        title:     albumName,
        artworkUrl: artworkUrl ?? null,
      } : null,
      artworkUrl:           artworkUrl ?? null,
      durationMs:           durationMs ?? null,
      explicitStatus:       'unknown',
      externalUrl:          YTM_TRACK_URL(videoId),
      playbackAvailability: 'external_only',  // ALWAYS external — no audio extraction
      streamUrl:            null,             // ALWAYS null — no extraction
      licenseInfo:          null,
      providerName:         'YouTube Music',
    };
  }

  // ---- Playlist import ----

  /**
   * Parses a YouTube Music playlist export (CSV or JSON format
   * from third-party tools like YTMusicTakeout).
   *
   * Format expected (CSV):
   *   Title,Artist,Album,Duration
   *   "Song Name","Artist Name","Album Name","3:45"
   *
   * Returns ImportedTrack[] for the caller to match against
   * available providers (e.g. Jamendo).
   *
   * This is metadata-only — no audio URLs are involved.
   */
  parsePlaylistCsv(csvContent: string): ImportedTrack[] {
    const lines   = csvContent.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const header  = lines[0].toLowerCase();
    const hasHeader = header.includes('title') || header.includes('song');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map(line => {
      // Simple CSV parser (handles quoted fields)
      const fields = parseCsvLine(line);
      return {
        title:      fields[0]?.replace(/^["']|["']$/g, '').trim() ?? '',
        artistName: fields[1]?.replace(/^["']|["']$/g, '').trim() ?? '',
        albumName:  fields[2]?.replace(/^["']|["']$/g, '').trim() ?? undefined,
        videoId:    fields[3]?.replace(/^["']|["']$/g, '').trim() ?? undefined,
        matched:    false,
        matchedTrack: null,
      } satisfies ImportedTrack;
    }).filter(t => t.title);
  }

  parsePlaylistJson(jsonContent: string): ImportedTrack[] {
    try {
      const data = JSON.parse(jsonContent);
      const items = Array.isArray(data) ? data : data.tracks ?? data.items ?? [];
      return items.map((item: any) => ({
        title:        item.title ?? item.name ?? '',
        artistName:   item.artist ?? item.artists?.[0]?.name ?? '',
        albumName:    item.album ?? undefined,
        videoId:      item.videoId ?? item.id ?? undefined,
        matched:      false,
        matchedTrack: null,
      })).filter((t: ImportedTrack) => t.title);
    } catch {
      return [];
    }
  }

  /**
   * Attempts to match imported tracks against a search provider.
   * Returns each track with matched=true if a close match is found.
   *
   * The user MUST review matches before saving (never auto-confirm).
   */
  async matchImportedTracks(
    importedTracks: ImportedTrack[],
    searchProvider: MusicProvider,
    onProgress?: (done: number, total: number) => void,
  ): Promise<ImportedTrack[]> {
    const results: ImportedTrack[] = [];

    for (let i = 0; i < importedTracks.length; i++) {
      const imported = importedTracks[i];
      onProgress?.(i, importedTracks.length);

      try {
        const query   = `${imported.title} ${imported.artistName}`.trim();
        const search  = await searchProvider.searchTracks({ query, limit: 3 });
        const best    = search.tracks[0];

        if (best && isGoodMatch(imported, best)) {
          results.push({ ...imported, matched: true, matchedTrack: best });
        } else {
          results.push({ ...imported, matched: false, matchedTrack: best ?? null });
        }
      } catch {
        results.push({ ...imported, matched: false, matchedTrack: null });
      }

      // Rate limit: don't hammer the API
      await delay(120);
    }

    onProgress?.(importedTracks.length, importedTracks.length);
    return results;
  }
}

// ---- Types ----
export interface ImportedTrack {
  title:        string;
  artistName:   string;
  albumName?:   string;
  videoId?:     string;
  matched:      boolean;
  matchedTrack: Track | null;
}

// ---- Helpers ----
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuotes = !inQuotes; }
    else if (c === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += c; }
  }
  result.push(current);
  return result;
}

function isGoodMatch(imported: ImportedTrack, track: Track): boolean {
  const titleMatch  = similarity(imported.title.toLowerCase(), track.title.toLowerCase()) > 0.7;
  const artistMatch = track.artists.some(a =>
    similarity(a.name.toLowerCase(), imported.artistName.toLowerCase()) > 0.6
  );
  return titleMatch && artistMatch;
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;
  const shorter = a.length < b.length ? a : b;
  const longer  = a.length < b.length ? b : a;
  let matches = 0;
  for (const ch of shorter) { if (longer.includes(ch)) matches++; }
  return matches / longer.length;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
