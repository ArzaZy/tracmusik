// ============================================================
// TracMusic — AudioService
// Wraps react-native-track-player v4.x
//
// REQUIRES a development build (not Expo Go).
// Run: npx eas-cli build --profile development --platform android
//
// Docs: https://rntp.dev/docs/api/functions/setup
// ============================================================

import TrackPlayer, {
  Event,
  State,
  RepeatMode as RNTPRepeatMode,
  Capability,
  AppKilledPlaybackBehavior,
  type Track as RNTPTrack,
} from 'react-native-track-player';
import { usePlaybackStore } from './playbackStore';
import type { Track } from '../../types/music';

// ---- Map our RepeatMode to RNTP RepeatMode ----
function toRNTPRepeat(mode: 'off' | 'all' | 'one'): RNTPRepeatMode {
  if (mode === 'all') return RNTPRepeatMode.Queue;
  if (mode === 'one') return RNTPRepeatMode.Track;
  return RNTPRepeatMode.Off;
}

// ---- Convert our Track to RNTP Track format ----
function toRNTPTrack(track: Track): RNTPTrack {
  return {
    id:       track.id,
    url:      track.streamUrl ?? '',   // Empty string = RNTP won't play, shows error
    title:    track.title,
    artist:   track.artists.map(a => a.name).join(', '),
    album:    track.album?.title ?? undefined,
    artwork:  track.artworkUrl ?? undefined,
    duration: track.durationMs != null ? track.durationMs / 1000 : undefined,
    // Custom field stored in RNTP track object
    description: JSON.stringify({
      providerId: track.providerId,
      providerTrackId: track.providerTrackId,
      playbackAvailability: track.playbackAvailability,
    }),
  };
}

class AudioServiceClass {
  private isSetup = false;
  private positionUpdateInterval: ReturnType<typeof setInterval> | null = null;

  // ---- Setup (call once at app start) ----
  async setup(): Promise<void> {
    if (this.isSetup) return;

    try {
      await TrackPlayer.setupPlayer({
        // Buffer configuration for mobile networks
        minBuffer:    15,  // seconds
        maxBuffer:    50,
        playBuffer:   2.5,
        backBuffer:   30,
      });

      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior:
            AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },
        // Lock screen / notification capabilities
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.Stop,
          Capability.SeekTo,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
        ],
        progressUpdateEventThrottle: 1000,
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
      });

      this.isSetup = true;
      this.startPositionUpdater();
      console.log('[AudioService] Setup complete');
    } catch (e) {
      console.error('[AudioService] Setup failed:', e);
      throw e;
    }
  }

  // ---- Play a single track (replaces queue) ----
  async playTrack(track: Track): Promise<void> {
    if (!this.isSetup) await this.setup();

    const store = usePlaybackStore.getState();
    store.setStatus('loading');
    store.setCurrentTrack(track);

    try {
      // If track needs a fresh stream URL, resolve it first
      let playable = track;
      if (!playable.streamUrl && playable.playbackAvailability === 'available') {
        // The provider will re-resolve the URL
        // (handled by caller before this point)
      }

      if (!playable.streamUrl) {
        store.setError('Audio not available for this track');
        return;
      }

      await TrackPlayer.reset();
      await TrackPlayer.add(toRNTPTrack(playable));
      await TrackPlayer.play();
      store.setStatus('playing');
    } catch (e: any) {
      store.setError(e.message ?? 'Playback failed');
    }
  }

  // ---- Play from queue ----
  async playQueue(tracks: Track[], startIndex = 0): Promise<void> {
    if (!this.isSetup) await this.setup();
    if (tracks.length === 0) return;

    const store = usePlaybackStore.getState();
    store.setStatus('loading');

    try {
      await TrackPlayer.reset();

      const rntpTracks = tracks.map(toRNTPTrack);
      await TrackPlayer.add(rntpTracks);
      await TrackPlayer.skip(startIndex);
      await TrackPlayer.play();

      store.setCurrentTrack(tracks[startIndex]);
      store.setStatus('playing');
    } catch (e: any) {
      store.setError(e.message ?? 'Queue playback failed');
    }
  }

  // ---- Playback controls ----
  async play(): Promise<void> {
    await TrackPlayer.play();
    usePlaybackStore.getState().setStatus('playing');
  }

  async pause(): Promise<void> {
    await TrackPlayer.pause();
    usePlaybackStore.getState().setStatus('paused');
  }

  async togglePlayPause(): Promise<void> {
    const state = await TrackPlayer.getPlaybackState();
    if (state.state === State.Playing) {
      await this.pause();
    } else {
      await this.play();
    }
  }

  async seekTo(positionMs: number): Promise<void> {
    await TrackPlayer.seekTo(positionMs / 1000);
    usePlaybackStore.getState().setPosition(positionMs);
  }

  async skipToNext(): Promise<void> {
    const store = usePlaybackStore.getState();
    try {
      await TrackPlayer.skipToNext();
      store.playNext();
    } catch {
      // End of queue — handle repeat
      if (store.repeatMode === 'all') {
        await TrackPlayer.skip(0);
        store.setQueueIndex(0);
        await this.play();
      } else {
        await TrackPlayer.pause();
        store.setStatus('paused');
      }
    }
  }

  async skipToPrevious(): Promise<void> {
    const store  = usePlaybackStore.getState();
    const prevTrack = store.playPrev();
    if (!prevTrack) return;

    try {
      if (store.positionMs > 3000) {
        await TrackPlayer.seekTo(0);
      } else {
        await TrackPlayer.skipToPrevious();
      }
    } catch {
      await TrackPlayer.seekTo(0);
    }
  }

  async stop(): Promise<void> {
    await TrackPlayer.stop();
    usePlaybackStore.getState().setStatus('stopped');
  }

  async reset(): Promise<void> {
    await TrackPlayer.reset();
    usePlaybackStore.getState().clearQueue();
  }

  // ---- Repeat / shuffle ----
  async setRepeatMode(mode: 'off' | 'all' | 'one'): Promise<void> {
    await TrackPlayer.setRepeatMode(toRNTPRepeat(mode));
    usePlaybackStore.getState().setRepeatMode(mode);
  }

  // ---- Queue management ----
  async addToQueue(track: Track): Promise<void> {
    if (!this.isSetup) return;
    try {
      await TrackPlayer.add(toRNTPTrack(track));
      usePlaybackStore.getState().addToQueue(track);
    } catch (e) {
      console.warn('[AudioService] addToQueue failed:', e);
    }
  }

  async removeFromQueue(queueId: string, rnIndex: number): Promise<void> {
    try {
      await TrackPlayer.remove(rnIndex);
      usePlaybackStore.getState().removeFromQueue(queueId);
    } catch (e) {
      console.warn('[AudioService] removeFromQueue failed:', e);
    }
  }

  // ---- Position polling (1 sec) ----
  private startPositionUpdater(): void {
    if (this.positionUpdateInterval) return;
    this.positionUpdateInterval = setInterval(async () => {
      try {
        const [position, duration] = await Promise.all([
          TrackPlayer.getProgress().then(p => p.position),
          TrackPlayer.getProgress().then(p => p.duration),
        ]);
        const store = usePlaybackStore.getState();
        store.setPosition(Math.floor(position * 1000));
        if (duration > 0) store.setDuration(Math.floor(duration * 1000));
      } catch {
        // Player not ready yet — ignore
      }
    }, 1000);
  }

  stopPositionUpdater(): void {
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval);
      this.positionUpdateInterval = null;
    }
  }

  // ---- Cleanup ----
  destroy(): void {
    this.stopPositionUpdater();
  }
}

export const AudioService = new AudioServiceClass();
