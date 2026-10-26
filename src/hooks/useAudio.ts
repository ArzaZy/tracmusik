// ============================================================
// useAudio — Primary hook for playback control in components
// ============================================================

import { useCallback } from 'react';
import { usePlaybackStore } from '../services/audio/playbackStore';
import { AudioService } from '../services/audio/AudioService';
import { providerRegistry } from '../providers/registry';
import { useLibraryStore } from '../services/libraryStore';
import type { Track } from '../types/music';

export function useAudio() {
  const store        = usePlaybackStore();
  const addRecent    = useLibraryStore(s => s.addToRecentlyPlayed);

  // ---- Play a track (resolves stream URL if needed) ----
  const playTrack = useCallback(async (track: Track) => {
    // Check if track can actually be played
    if (track.playbackAvailability === 'unavailable') {
      usePlaybackStore.getState().setError(
        `"${track.title}" is not available for playback`
      );
      return;
    }

    if (track.playbackAvailability === 'external_only') {
      // External tracks handled separately (open in app)
      return;
    }

    // Resolve stream URL if not already present
    let readyTrack = track;
    if (!readyTrack.streamUrl) {
      const provider = providerRegistry.get(track.providerId);
      if (!provider) {
        usePlaybackStore.getState().setError(
          `Provider "${track.providerId}" not available`
        );
        return;
      }
      try {
        const url = await provider.getPlayableSource(track.providerTrackId);
        if (!url) {
          usePlaybackStore.getState().setError('No audio stream available');
          return;
        }
        readyTrack = { ...track, streamUrl: url };
      } catch (e: any) {
        usePlaybackStore.getState().setError(
          e.message ?? 'Failed to resolve audio stream'
        );
        return;
      }
    }

    // Add to recently played before playing
    await addRecent(readyTrack);

    // Hand off to AudioService
    await AudioService.playTrack(readyTrack);
  }, [addRecent]);

  // ---- Play a list of tracks starting at an index ----
  const playQueue = useCallback(async (tracks: Track[], startIndex = 0) => {
    const validTracks = tracks.filter(
      t => t.playbackAvailability === 'available' || t.streamUrl
    );
    if (validTracks.length === 0) return;

    // Resolve stream URLs for all tracks (Jamendo returns them already)
    const readyTracks: Track[] = [];
    for (const t of validTracks) {
      if (t.streamUrl) {
        readyTracks.push(t);
        continue;
      }
      try {
        const provider = providerRegistry.get(t.providerId);
        const url = provider ? await provider.getPlayableSource(t.providerTrackId) : null;
        readyTracks.push({ ...t, streamUrl: url ?? '' });
      } catch {
        readyTracks.push(t);
      }
    }

    const clampedStart = Math.min(startIndex, readyTracks.length - 1);
    await addRecent(readyTracks[clampedStart]);
    await AudioService.playQueue(readyTracks, clampedStart);
  }, [addRecent]);

  // ---- Controls ----
  const togglePlayPause = useCallback(() => AudioService.togglePlayPause(), []);
  const pause           = useCallback(() => AudioService.pause(), []);
  const play            = useCallback(() => AudioService.play(), []);
  const seekTo          = useCallback((ms: number) => AudioService.seekTo(ms), []);
  const skipToNext      = useCallback(() => AudioService.skipToNext(), []);
  const skipToPrevious  = useCallback(() => AudioService.skipToPrevious(), []);
  const stop            = useCallback(() => AudioService.stop(), []);

  const toggleShuffle   = useCallback(() => store.toggleShuffle(), [store]);
  const cycleRepeat     = useCallback(() => {
    const next = store.repeatMode === 'off' ? 'all'
               : store.repeatMode === 'all' ? 'one' : 'off';
    AudioService.setRepeatMode(next);
  }, [store]);

  const addToQueue      = useCallback(async (track: Track) => {
    store.addToQueue(track);
    await AudioService.addToQueue(track);
  }, [store]);

  return {
    // State
    currentTrack:      store.currentTrack,
    status:            store.status,
    positionMs:        store.positionMs,
    durationMs:        store.durationMs,
    queue:             store.queue,
    currentQueueIndex: store.currentQueueIndex,
    isShuffled:        store.isShuffled,
    repeatMode:        store.repeatMode,
    errorMessage:      store.errorMessage,
    isPlaying:         store.status === 'playing',
    isLoading:         store.status === 'loading',

    // Actions
    playTrack,
    playQueue,
    togglePlayPause,
    pause,
    play,
    seekTo,
    skipToNext,
    skipToPrevious,
    stop,
    toggleShuffle,
    cycleRepeat,
    addToQueue,
  };
}
