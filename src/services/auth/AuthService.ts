// ============================================================
// TracMusic — AuthService
// Wraps Supabase auth. Falls back gracefully when Supabase
// is not configured (local-only / guest mode).
// ============================================================

import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../supabase';

// ---- Auth State ----
interface AuthState {
  user:        User | null;
  session:     Session | null;
  isLoading:   boolean;
  isGuest:     boolean;
  error:       string | null;
}

interface AuthActions {
  initialize:   () => Promise<void>;
  signUp:       (email: string, password: string) => Promise<void>;
  signIn:       (email: string, password: string) => Promise<void>;
  signOut:      () => Promise<void>;
  clearError:   () => void;
  deleteAccount:() => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user:      null,
  session:   null,
  isLoading: true,
  isGuest:   true,
  error:     null,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      set({ isLoading: false, isGuest: true });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({
        session,
        user:      session?.user ?? null,
        isGuest:   !session?.user,
        isLoading: false,
      });

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user:    session?.user ?? null,
          isGuest: !session?.user,
        });
      });
    } catch (e: any) {
      set({ isLoading: false, isGuest: true, error: e.message });
    }
  },

  signUp: async (email, password) => {
    if (!isSupabaseConfigured) {
      set({ error: 'Supabase not configured. Add credentials to .env file.' });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      // Session will be set via onAuthStateChange
    } catch (e: any) {
      set({ error: e.message ?? 'Sign up failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured) {
      set({ error: 'Supabase not configured. Add credentials to .env file.' });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (e: any) {
      set({ error: e.message ?? 'Sign in failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      if (isSupabaseConfigured) await supabase.auth.signOut();
      set({ user: null, session: null, isGuest: true });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  deleteAccount: async () => {
    const { user } = get();
    if (!user || !isSupabaseConfigured) return;
    set({ isLoading: true });
    try {
      // Delete user data (RLS ensures only own data is deleted)
      await Promise.all([
        supabase.from('liked_tracks').delete().eq('user_id', user.id),
        supabase.from('playlists').delete().eq('user_id', user.id),
        supabase.from('listening_history').delete().eq('user_id', user.id),
        supabase.from('followed_artists').delete().eq('user_id', user.id),
        supabase.from('user_preferences').delete().eq('user_id', user.id),
      ]);
      // Note: deleting auth.users requires a server-side function in production
      // For now, sign out after deleting all data
      await supabase.auth.signOut();
      set({ user: null, session: null, isGuest: true });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
