-- ============================================================
-- TracMusic - Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Liked tracks
CREATE TABLE IF NOT EXISTS liked_tracks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id         TEXT NOT NULL,            -- "{providerId}:{providerTrackId}"
  provider_id      TEXT NOT NULL,
  track_title      TEXT NOT NULL,
  artist_names     TEXT NOT NULL,
  artwork_url      TEXT,
  track_data       JSONB NOT NULL,           -- Full serialized Track object
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

-- Followed artists
CREATE TABLE IF NOT EXISTS followed_artists (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id        TEXT NOT NULL,
  provider_id      TEXT NOT NULL,
  artist_name      TEXT NOT NULL,
  artist_data      JSONB NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, artist_id)
);

-- Playlists
CREATE TABLE IF NOT EXISTS playlists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  artwork_url  TEXT,
  is_public    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist tracks (ordered)
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id  UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id     TEXT NOT NULL,
  track_data   JSONB NOT NULL,
  position     INTEGER NOT NULL DEFAULT 0,
  added_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, track_id)
);

-- Listening history
CREATE TABLE IF NOT EXISTS listening_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id     TEXT NOT NULL,
  track_data   JSONB NOT NULL,
  played_at    TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_mode    TEXT DEFAULT 'system',
  accent_color  TEXT DEFAULT '#7035E0',
  language      TEXT DEFAULT 'en',
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_liked_tracks_user     ON liked_tracks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_order ON playlist_tracks(playlist_id, position ASC);
CREATE INDEX IF NOT EXISTS idx_history_user_date     ON listening_history(user_id, played_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE liked_tracks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE followed_artists   ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists          ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences   ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/write own profile only
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Liked tracks: private to owner
CREATE POLICY "Users can view own liked tracks"
  ON liked_tracks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own liked tracks"
  ON liked_tracks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own liked tracks"
  ON liked_tracks FOR DELETE USING (auth.uid() = user_id);

-- Followed artists: private to owner
CREATE POLICY "Users can manage own followed artists"
  ON followed_artists FOR ALL USING (auth.uid() = user_id);

-- Playlists: private unless is_public
CREATE POLICY "Users can view own playlists"
  ON playlists FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can insert own playlists"
  ON playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own playlists"
  ON playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own playlists"
  ON playlists FOR DELETE USING (auth.uid() = user_id);

-- Playlist tracks: private to owner
CREATE POLICY "Users can manage own playlist tracks"
  ON playlist_tracks FOR ALL USING (auth.uid() = user_id);

-- Listening history: private to owner
CREATE POLICY "Users can manage own listening history"
  ON listening_history FOR ALL USING (auth.uid() = user_id);

-- Preferences: private to owner
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Handle new user registration
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  INSERT INTO user_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
