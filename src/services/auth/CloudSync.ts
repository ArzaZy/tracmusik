// ============================================================
// TracMusic — CloudSync
// Syncs local library data to Supabase when user is signed in.
// All writes are protected by Row Level Security — users can
// only write to their own rows.
// ============================================================

import { supabase, isSupabaseConfigured } from '../supabase';
import { useLibraryStore } from '../libraryStore';
import type { Track, Artist, Playlist } from '../../types/music';

class CloudSyncClass {
  private userId: string | null = null;

  setUserId(id: string | null) {
    this.userId = id;
  }

  private get db() { return supabase; }

  // ---- Liked Tracks ----
  async pushLikedTracks(tracks: Track[]): Promise<void> {
    if (!this.userId || !isSupabaseConfigured) return;
    try {
      const rows = tracks.map(t => ({
        user_id:      this.userId!,
        track_id:     t.id,
        provider_id:  t.providerId,
        track_title:  t.title,
        artist_names: t.artists.map(a => a.name).join(', '),
        artwork_url:  t.artworkUrl,
        track_data:   t as unknown as Record<string, unknown>,
      }));
      // upsert = insert or ignore if exists
      const { error } = await this.db
        .from('liked_tracks')
        .upsert(rows, { onConflict: 'user_id,track_id', ignoreDuplicates: true });
      if (error) console.warn('[CloudSync] pushLikedTracks error:', error.message);
    } catch (e) {
      console.warn('[CloudSync] pushLikedTracks failed:', e);
    }
  }

  async pullLikedTracks(): Promise<Track[]> {
    if (!this.userId || !isSupabaseConfigured) return [];
    try {
      const { data, error } = await this.db
        .from('liked_tracks')
        .select('track_data')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => row.track_data as Track);
    } catch (e) {
      console.warn('[CloudSync] pullLikedTracks failed:', e);
      return [];
    }
  }

  // ---- Playlists ----
  async pushPlaylist(playlist: Playlist, tracks: Track[]): Promise<void> {
    if (!this.userId || !isSupabaseConfigured) return;
    try {
      // Upsert playlist header
      const { data: plData, error: plError } = await this.db
        .from('playlists')
        .upsert({
          id:          playlist.id.startsWith('local_') ? undefined : playlist.id,
          user_id:     this.userId,
          title:       playlist.title,
          description: playlist.description,
          artwork_url: playlist.artworkUrl,
          is_public:   false,
          updated_at:  new Date().toISOString(),
        }, { onConflict: 'id' })
        .select('id')
        .single();
      if (plError) throw plError;

      const cloudId = plData?.id;
      if (!cloudId) return;

      // Push tracks
      const rows = tracks.map((t, i) => ({
        playlist_id: cloudId,
        user_id:     this.userId!,
        track_id:    t.id,
        track_data:  t as unknown as Record<string, unknown>,
        position:    i,
      }));
      await this.db
        .from('playlist_tracks')
        .upsert(rows, { onConflict: 'playlist_id,track_id', ignoreDuplicates: true });
    } catch (e) {
      console.warn('[CloudSync] pushPlaylist failed:', e);
    }
  }

  async pullPlaylists(): Promise<Playlist[]> {
    if (!this.userId || !isSupabaseConfigured) return [];
    try {
      const { data, error } = await this.db
        .from('playlists')
        .select('*, playlist_tracks(track_id, position)')
        .eq('user_id', this.userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        id:          row.id,
        title:       row.title,
        description: row.description,
        artworkUrl:  row.artwork_url,
        trackIds:    (row.playlist_tracks ?? [])
          .sort((a: any, b: any) => a.position - b.position)
          .map((pt: any) => pt.track_id as string),
        createdAt:   row.created_at,
        updatedAt:   row.updated_at,
        isLocal:     false,
        userId:      row.user_id,
      } satisfies Playlist));
    } catch (e) {
      console.warn('[CloudSync] pullPlaylists failed:', e);
      return [];
    }
  }

  // ---- Full sync (call after sign-in) ----
  async fullSync(): Promise<void> {
    if (!this.userId || !isSupabaseConfigured) return;

    const store = useLibraryStore.getState();
    console.log('[CloudSync] Starting full sync for user:', this.userId);

    // Push local data up first
    if (store.likedTracks.length > 0) {
      await this.pushLikedTracks(store.likedTracks);
    }

    // Pull remote data (remote wins for existing records)
    const [remoteLiked, remotePlaylists] = await Promise.all([
      this.pullLikedTracks(),
      this.pullPlaylists(),
    ]);

    // Merge: combine local + remote, deduplicate by id
    const mergedLiked = [
      ...remoteLiked,
      ...store.likedTracks.filter(
        local => !remoteLiked.some(r => r.id === local.id)
      ),
    ];

    const mergedPlaylists = [
      ...remotePlaylists,
      ...store.playlists.filter(
        local => !remotePlaylists.some(r => r.id === local.id)
      ),
    ];

    // Update local store with merged data (without saving to AsyncStorage
    // since remote is the source of truth for signed-in users)
    useLibraryStore.setState({
      likedTracks:   mergedLiked,
      likedTrackIds: new Set(mergedLiked.map(t => t.id)),
      playlists:     mergedPlaylists,
    });

    console.log('[CloudSync] Sync complete');
  }
}

export const CloudSync = new CloudSyncClass();
