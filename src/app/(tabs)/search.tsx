import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { usePlaybackStore } from '../../services/audio/playbackStore';
import { providerRegistry } from '../../providers/registry';
import { TrackRow } from '../../components/ui/TrackRow';
import { TrackRowSkeleton } from '../../components/ui/Skeleton';
import type { Track, Artist, Album, SearchResults } from '../../types/music';
import { useTranslation } from 'react-i18next';

type SearchTab = 'tracks' | 'artists' | 'albums';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function SearchScreen() {
  const { theme }       = useTheme();
  const { t }           = useTranslation();
  const router          = useRouter();
  const insets          = useSafeAreaInsets();
  const inputRef        = useRef<TextInput>(null);

  const [query,      setQuery]      = useState('');
  const [activeTab,  setActiveTab]  = useState<SearchTab>('tracks');
  const [results,    setResults]    = useState<SearchResults | null>(null);
  const [artists,    setArtists]    = useState<Artist[]>([]);
  const [albums,     setAlbums]     = useState<Album[]>([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const debouncedQuery = useDebounce(query.trim(), 400);

  const currentTrack   = usePlaybackStore(s => s.currentTrack);
  const setCurrentTrack = usePlaybackStore(s => s.setCurrentTrack);
  const addToQueue     = usePlaybackStore(s => s.addToQueue);

  const TAB_BOTTOM = 70 + (currentTrack ? 72 : 0) + insets.bottom;

  const doSearch = useCallback(async (q: string) => {
    if (!q) { setResults(null); setArtists([]); setAlbums([]); return; }
    const provider = providerRegistry.get('jamendo');
    if (!provider) { setError('No music provider available'); return; }

    setIsLoading(true);
    setError(null);
    try {
      const [trackRes, artistRes, albumRes] = await Promise.all([
        provider.searchTracks({ query: q }),
        provider.searchArtists({ query: q }),
        provider.searchAlbums({ query: q }),
      ]);
      setResults(trackRes);
      setArtists(artistRes);
      setAlbums(albumRes);
    } catch (e: any) {
      setError(e.message ?? t('errors.searchFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    doSearch(debouncedQuery);
  }, [debouncedQuery, doSearch]);

  const handleTrackPress = useCallback((track: Track) => {
    if (track.playbackAvailability === 'unavailable') return;
    setCurrentTrack(track);
    addToQueue(track);
    Keyboard.dismiss();
    router.push('/player');
  }, [setCurrentTrack, addToQueue, router]);

  const tabs: SearchTab[] = ['tracks', 'artists', 'albums'];
  const tabCounts: Record<SearchTab, number> = {
    tracks:  results?.tracks.length ?? 0,
    artists: artists.length,
    albums:  albums.length,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, paddingHorizontal: theme.spacing[4] }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {t('tabs.search')}
        </Text>

        {/* Search bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.xl,
            },
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder')}
            placeholderTextColor={theme.colors.placeholder}
            style={[styles.input, { color: theme.colors.textPrimary }]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search music"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={{ fontSize: 18, opacity: 0.5 }}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Tabs */}
        {(results || isLoading) && (
          <View style={styles.tabs}>
            {tabs.map(tab => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  activeTab === tab && { backgroundColor: theme.colors.accent },
                  activeTab !== tab && { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: activeTab === tab ? '#fff' : theme.colors.textSecondary },
                  ]}
                >
                  {t(`search.${tab}`)}
                  {tabCounts[tab] > 0 && ` (${tabCounts[tab]})`}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {/* Empty / placeholder */}
        {!query && !isLoading && (
          <View style={styles.emptyCenter}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🎵</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('search.typeToSearch')}
            </Text>
          </View>
        )}

        {/* Loading skeletons */}
        {isLoading && activeTab === 'tracks' && (
          <View style={{ paddingTop: 8 }}>
            {Array.from({ length: 8 }).map((_, i) => <TrackRowSkeleton key={i} />)}
          </View>
        )}

        {/* Error */}
        {error && !isLoading && (
          <View style={styles.emptyCenter}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>⚠️</Text>
            <Text style={[styles.emptyText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        )}

        {/* No results */}
        {!isLoading && !error && query && results?.tracks.length === 0 && activeTab === 'tracks' && (
          <View style={styles.emptyCenter}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🔍</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('search.noResultsFor', { query })}
            </Text>
          </View>
        )}

        {/* Track results */}
        {!isLoading && activeTab === 'tracks' && results && results.tracks.length > 0 && (
          <FlatList
            data={results.tracks}
            keyExtractor={t => t.id}
            contentContainerStyle={{ paddingBottom: TAB_BOTTOM }}
            renderItem={({ item }) => (
              <TrackRow
                track={item}
                isPlaying={currentTrack?.id === item.id}
                onPress={handleTrackPress}
                showProvider
                showDuration
              />
            )}
          />
        )}

        {/* Artist results */}
        {!isLoading && activeTab === 'artists' && (
          <FlatList
            data={artists}
            keyExtractor={a => a.id}
            contentContainerStyle={{ paddingBottom: TAB_BOTTOM }}
            renderItem={({ item }) => <ArtistRow artist={item} theme={theme} />}
            ListEmptyComponent={
              <View style={styles.emptyCenter}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {t('common.noResults')}
                </Text>
              </View>
            }
          />
        )}

        {/* Album results */}
        {!isLoading && activeTab === 'albums' && (
          <FlatList
            data={albums}
            keyExtractor={a => a.id}
            contentContainerStyle={{ paddingBottom: TAB_BOTTOM }}
            renderItem={({ item }) => <AlbumRow album={item} theme={theme} />}
            ListEmptyComponent={
              <View style={styles.emptyCenter}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {t('common.noResults')}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

function ArtistRow({ artist, theme }: { artist: Artist; theme: any }) {
  return (
    <View style={[styles.artistRow, { paddingHorizontal: theme.spacing[4] }]}>
      <View style={[styles.artistAvatar, { backgroundColor: theme.colors.bgTertiary }]}>
        {artist.imageUrl ? (
          <Image source={{ uri: artist.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Text style={{ fontSize: 22 }}>🎤</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.artistName, { color: theme.colors.textPrimary }]}>
          {artist.name}
        </Text>
        <Text style={[styles.artistSub, { color: theme.colors.textTertiary }]}>
          Jamendo Artist
        </Text>
      </View>
    </View>
  );
}

function AlbumRow({ album, theme }: { album: Album; theme: any }) {
  return (
    <View style={[styles.artistRow, { paddingHorizontal: theme.spacing[4] }]}>
      <View style={[styles.albumCover, { backgroundColor: theme.colors.bgTertiary, borderRadius: theme.radius.sm }]}>
        {album.artworkUrl ? (
          <Image source={{ uri: album.artworkUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Text style={{ fontSize: 22 }}>💿</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.artistName, { color: theme.colors.textPrimary }]}>
          {album.title}
        </Text>
        <Text style={[styles.artistSub, { color: theme.colors.textSecondary }]}>
          {album.artists[0]?.name ?? ''}{album.releaseYear ? ` · ${album.releaseYear}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 16 },
  input: { flex: 1, fontSize: 16, fontWeight: '400' },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, textAlign: 'center', maxWidth: 240 },
  artistRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  artistAvatar: {
    width: 52, height: 52, borderRadius: 26,
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
  },
  artistName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  artistSub: { fontSize: 12 },
  albumCover: {
    width: 52, height: 52, overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
  },
});
