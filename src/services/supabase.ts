// ============================================================
// TracMusic — Supabase Client
// ============================================================
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const supabaseUrl     = Constants.expoConfig?.extra?.supabaseUrl     as string | undefined;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.\n' +
    'Cloud sync is disabled. Running in local-only mode.',
  );
}

// Safe fallback so the app doesn't crash when env vars are missing
export const supabase = createClient(
  supabaseUrl     ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder',
  {
    auth: {
      storage:            AsyncStorage,
      autoRefreshToken:   true,
      persistSession:     true,
      detectSessionInUrl: false,
    },
  },
);

export const isSupabaseConfigured =
  !!supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co';
