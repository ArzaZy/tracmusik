import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Track, Artist, Playlist } from '../types/music';

// ============================================================
// Library Store - local-first, Supabase sync in Phase 4
// ============================================================

interface LibraryState {
  likedTrackIds:    Set<string>;
  likedTracks:      Track[];
  followedArtists:  Artist[];
  playlists:        Playlist[];
  recentlyPlayed:   Track[];
  isLoaded:         boolean;
}

interface LibraryActions {
  loadLibrary:         () => Promise<void>;
  likeTrack:           (track: Track) => Promise<void>;
  unlikeTrack:         (trackId: string) => Promise<void>;
  isLiked:             (trackId: string) => boolean;
  followArtist:        (artist: Artist) => Promise<void>;
  unfollowArtist:      (artistId: string) => Promise<void>;
  createPlaylist:      (title: string, description?: string) => Promise<Playlist>;
  deletePlaylist:      (playlistId: string) => Promise<void>;
  renamePlaylist:      (playlistId: string, title: string, desc?: string) => Promise<void>;
  addTrackToPlaylist:  (playlistId: string, track: Track) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  addToRecentlyPlayed: (track: Track) => Promise<void>;
}

const KEYS = {
  liked:    '@tracmusic/liked_tracks',
  artists:  '@tracmusic/followed_artists',
  playlists:'@tracmusic/playlists',
  recent:   '@tracmusic/recently_played',
};

const MAX_RECENT = 50;

async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function saveJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[Library] Failed to save:', key, e);
  }
}

export const useLibraryStore = create<LibraryState & LibraryActions>((set, get) => ({
  likedTrackIds:   new Set(),
  likedTracks:     [],
  followedArtists: [],
  playlists:       [],
  recentlyPlayed:  [],
  isLoaded:        false,

  loadLibrary: async () => {
    const [likedTracks, followedArtists, playlists, recentlyPlayed] = await Promise.all([
      loadJson<Track[]>(KEYS.liked,    []),
      loadJson<Artist[]>(KEYS.artists, []),
      loadJson<Playlist[]>(KEYS.playlists, []),
      loadJson<Track[]>(KEYS.recent,   []),
    ]);
    set({
      likedTracks,
      likedTrackIds:   new Set(likedTracks.map(t => t.id)),
      followedArtists,
      playlists,
      recentlyPlayed,
      isLoaded:        true,
    });
  },

  likeTrack: async (track) => {
    const { likedTracks, likedTrackIds } = get();
    if (likedTrackIds.has(track.id)) return;
    const updated = [track, ...likedTracks];
    set({ likedTracks: updated, likedTrackIds: new Set([track.id, ...likedTrackIds]) });
    await saveJson(KEYS.liked, updated);
  },

  unlikeTrack: async (trackId) => {
    const { likedTracks, likedTrackIds } = get();
    const updated = likedTracks.filter(t => t.id !== trackId);
    const newSet  = new Set(likedTrackIds);
    newSet.delete(trackId);
    set({ likedTracks: updated, likedTrackIds: newSet });
    await saveJson(KEYS.liked, updated);
  },

  isLiked: (trackId) => get().likedTrackIds.has(trackId),

  followArtist: async (artist) => {
    const { followedArtists } = get();
    if (followedArtists.some(a => a.id === artist.id)) return;
    const updated = [artist, ...followedArtists];
    set({ followedArtists: updated });
    await saveJson(KEYS.artists, updated);
  },

  unfollowArtist: async (artistId) => {
    const updated = get().followedArtists.filter(a => a.id !== artistId);
    set({ followedArtists: updated });
    await saveJson(KEYS.artists, updated);
  },

  createPlaylist: async (title, description) => {
    const playlist: Playlist = {
      id:          `local_${Date.now()}`,
      title,
      description: description ?? null,
      artworkUrl:  null,
      trackIds:    [],
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
      isLocal:     true,
      userId:      null,
    };
    const updated = [playlist, ...get().playlists];
    set({ playlists: updated });
    await saveJson(KEYS.playlists, updated);
    return playlist;
  },

  deletePlaylist: async (playlistId) => {
    const updated = get().playlists.filter(p => p.id !== playlistId);
    set({ playlists: updated });
    await saveJson(KEYS.playlists, updated);
  },

  renamePlaylist: async (playlistId, title, desc) => {
    const updated = get().playlists.map(p =>
      p.id === playlistId
        ? { ...p, title, description: desc ?? p.description, updatedAt: new Date().toISOString() }
        : p,
    );
    set({ playlists: updated });
    await saveJson(KEYS.playlists, updated);
  },

  addTrackToPlaylist: async (playlistId, track) => {
    const updated = get().playlists.map(p => {
      if (p.id !== playlistId) return p;
      if (p.trackIds.includes(track.id)) return p;
      return { ...p, trackIds: [...p.trackIds, track.id], updatedAt: new Date().toISOString() };
    });
    set({ playlists: updated });
    await saveJson(KEYS.playlists, updated);
  },

  removeTrackFromPlaylist: async (playlistId, trackId) => {
    const updated = get().playlists.map(p =>
      p.id === playlistId
        ? { ...p, trackIds: p.trackIds.filter(id => id !== trackId), updatedAt: new Date().toISOString() }
        : p,
    );
    set({ playlists: updated });
    await saveJson(KEYS.playlists, updated);
  },

  addToRecentlyPlayed: async (track) => {
    const prev    = get().recentlyPlayed.filter(t => t.id !== track.id);
    const updated = [track, ...prev].slice(0, MAX_RECENT);
    set({ recentlyPlayed: updated });
    await saveJson(KEYS.recent, updated);
  },
}));
