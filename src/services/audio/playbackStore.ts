import { create } from 'zustand';
import type { Track, PlaybackState, QueueItem, RepeatMode } from '../../types/music';

// ============================================================
// Playback Store
// Manages queue, playback state, and now-playing metadata.
// Actual audio engine is in AudioService (Phase 3).
// ============================================================

interface PlaybackActions {
  setCurrentTrack: (track: Track | null) => void;
  setStatus: (status: PlaybackState['status']) => void;
  setPosition: (positionMs: number) => void;
  setDuration: (durationMs: number) => void;
  setError: (message: string | null) => void;
  setQueue: (items: QueueItem[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (queueId: string) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  setQueueIndex: (index: number) => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  playNext: () => Track | null;
  playPrev: () => Track | null;
}

type PlaybackStore = PlaybackState & PlaybackActions;

function makeQueueId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const usePlaybackStore = create<PlaybackStore>((set, get) => ({
  // ---- State ----
  status:            'idle',
  currentTrack:      null,
  queue:             [],
  currentQueueIndex: -1,
  positionMs:        0,
  durationMs:        0,
  isShuffled:        false,
  repeatMode:        'off',
  errorMessage:      null,

  // ---- Actions ----
  setCurrentTrack: (track) => set({ currentTrack: track, positionMs: 0, errorMessage: null }),
  setStatus:       (status) => set({ status }),
  setPosition:     (positionMs) => set({ positionMs }),
  setDuration:     (durationMs) => set({ durationMs }),
  setError:        (message) => set({ errorMessage: message, status: message ? 'error' : 'idle' }),

  setQueue: (items) =>
    set({ queue: items, currentQueueIndex: items.length > 0 ? 0 : -1 }),

  addToQueue: (track) => {
    const item: QueueItem = {
      queueId: makeQueueId(),
      track,
      addedAt: Date.now(),
    };
    set((state) => ({ queue: [...state.queue, item] }));
  },

  removeFromQueue: (queueId) => {
    set((state) => {
      const newQueue = state.queue.filter((item) => item.queueId !== queueId);
      const removedIndex = state.queue.findIndex((item) => item.queueId === queueId);
      let newIndex = state.currentQueueIndex;
      if (removedIndex < newIndex) newIndex--;
      else if (removedIndex === newIndex) newIndex = Math.min(newIndex, newQueue.length - 1);
      return { queue: newQueue, currentQueueIndex: newIndex };
    });
  },

  reorderQueue: (fromIndex, toIndex) => {
    set((state) => {
      const newQueue = [...state.queue];
      const [moved] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, moved);
      return { queue: newQueue };
    });
  },

  clearQueue: () => set({ queue: [], currentQueueIndex: -1, currentTrack: null, status: 'idle' }),

  setQueueIndex: (index) => {
    const { queue } = get();
    if (index < 0 || index >= queue.length) return;
    set({ currentQueueIndex: index, currentTrack: queue[index].track });
  },

  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),

  setRepeatMode: (mode) => set({ repeatMode: mode }),

  playNext: () => {
    const { queue, currentQueueIndex, repeatMode, isShuffled } = get();
    if (queue.length === 0) return null;

    let nextIndex: number;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentQueueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') nextIndex = 0;
        else return null;
      }
    }

    const nextTrack = queue[nextIndex].track;
    set({ currentQueueIndex: nextIndex, currentTrack: nextTrack, positionMs: 0 });
    return nextTrack;
  },

  playPrev: () => {
    const { queue, currentQueueIndex, positionMs } = get();
    if (queue.length === 0) return null;

    // If more than 3s in, restart current track
    if (positionMs > 3000) {
      set({ positionMs: 0 });
      return queue[currentQueueIndex]?.track ?? null;
    }

    const prevIndex = Math.max(0, currentQueueIndex - 1);
    const prevTrack = queue[prevIndex].track;
    set({ currentQueueIndex: prevIndex, currentTrack: prevTrack, positionMs: 0 });
    return prevTrack;
  },
}));
