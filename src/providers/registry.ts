import { JamendoProvider } from './jamendo/JamendoProvider';
import { YouTubeMusicProvider } from './youtubeMusic/YouTubeMusicProvider';
import type { MusicProvider } from './types';
import type { ProviderId } from '../types/music';
import Constants from 'expo-constants';

// ============================================================
// Provider Registry
// Single source of truth for all configured music providers.
// ============================================================

class ProviderRegistry {
  private providers: Map<ProviderId, MusicProvider> = new Map();

  register(provider: MusicProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: ProviderId): MusicProvider | null {
    return this.providers.get(id) ?? null;
  }

  getAll(): MusicProvider[] {
    return Array.from(this.providers.values());
  }

  has(id: ProviderId): boolean {
    return this.providers.has(id);
  }
}

export const providerRegistry = new ProviderRegistry();

// ---- Initialize providers ----
// Call this once at app startup (in _layout.tsx)
export function initializeProviders(): void {
  const jamendoClientId = Constants.expoConfig?.extra?.jamendoClientId as string | undefined;

  if (jamendoClientId) {
    try {
      const jamendo = new JamendoProvider(jamendoClientId);
      providerRegistry.register(jamendo);
      console.log('[TracMusic] Jamendo provider registered');
    } catch (e) {
      console.warn('[TracMusic] Failed to initialize Jamendo provider:', e);
    }
  } else {
    console.warn(
      '[TracMusic] EXPO_PUBLIC_JAMENDO_CLIENT_ID not set. ' +
      'Get a free key at https://developer.jamendo.com',
    );
  }

  // YouTube Music companion — external links + playlist import only
  const ytCompanion = new YouTubeMusicProvider();
  providerRegistry.register(ytCompanion);
  console.log('[TracMusic] YouTube Music companion registered (external links only)');
}
