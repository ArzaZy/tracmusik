// ============================================================
// TracMusic — PlaybackService (Background Event Handler)
//
// This file MUST be registered in index.js as:
//   TrackPlayer.registerPlaybackService(() => require('./src/services/audio/PlaybackService'));
//
// It runs in a separate JS context when the app is in background.
// Do NOT import React or UI components here.
// ============================================================

import TrackPlayer, { Event, State } from 'react-native-track-player';
import { usePlaybackStore } from './playbackStore';

export async function PlaybackService() {
  // ---- Remote control events (lock screen / notification) ----

  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
    usePlaybackStore.getState().setStatus('playing');
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
    usePlaybackStore.getState().setStatus('paused');
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop();
    usePlaybackStore.getState().setStatus('stopped');
  });

  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    try {
      await TrackPlayer.skipToNext();
      usePlaybackStore.getState().playNext();
    } catch {
      // End of queue
    }
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    try {
      await TrackPlayer.skipToPrevious();
      usePlaybackStore.getState().playPrev();
    } catch {
      await TrackPlayer.seekTo(0);
    }
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
    await TrackPlayer.seekTo(event.position);
    usePlaybackStore.getState().setPosition(Math.floor(event.position * 1000));
  });

  // ---- Playback state changes ----

  TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
    const store = usePlaybackStore.getState();
    switch (event.state) {
      case State.Playing:
        store.setStatus('playing');
        break;
      case State.Paused:
        store.setStatus('paused');
        break;
      case State.Stopped:
        store.setStatus('stopped');
        break;
      case State.Buffering:
      case State.Loading:
        store.setStatus('loading');
        break;
      case State.Error:
        store.setStatus('error');
        store.setError('Playback error occurred');
        break;
      case State.Ended:
        store.setStatus('idle');
        break;
      default:
        break;
    }
  });

  // ---- Track change (auto-advance in queue) ----

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (event) => {
    if (event.track == null) return;
    const store = usePlaybackStore.getState();
    // Sync current queue index
    try {
      const idx = await TrackPlayer.getActiveTrackIndex();
      if (idx != null) store.setQueueIndex(idx);
    } catch {}
  });

  // ---- Playback errors ----

  TrackPlayer.addEventListener(Event.PlaybackError, (event) => {
    console.error('[PlaybackService] Playback error:', event);
    usePlaybackStore.getState().setError(
      event.message ?? 'Unknown playback error'
    );
  });

  // ---- Audio interruptions (phone calls, other apps) ----

  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    // event.paused = true means another app took audio focus
    if (event.paused) {
      await TrackPlayer.pause();
      usePlaybackStore.getState().setStatus('paused');
    } else if (event.permanent) {
      await TrackPlayer.stop();
      usePlaybackStore.getState().setStatus('stopped');
    } else {
      // Ducked (volume lowered) — resume when duck ends
      // RNTP handles this automatically
    }
  });
}
