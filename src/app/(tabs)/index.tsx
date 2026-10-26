import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useLibraryStore } from '../../services/libraryStore';
import { useAudio } from '../../hooks/useAudio';
import { providerRegistry } from '../../providers/registry';
import { CardSkeleton, TrackRowSkeleton } from '../../components/ui/Skeleton';
import { TrackRow } from '../../components/ui/TrackRow';
import { GlassCard } from '../../components/ui/GlassCard';
import type { Track } from '../../types/music';
import { useTranslation } from 'react-i18next';

function getGreeting(t: (key: string) => string): string {
  const h = new Date().getHours();
  if (h < 12) return t('home.greeting_morning');
  if (h < 18) return t('home.greeting_afternoon');
  return t('home.greeting_evening');
}

export default function HomeScreen() {
  const { theme }         = useTheme();
  const { t }             = useTranslation();
  const router            = useRouter();
  const insets            = useSafeAreaInsets();
  const { width }         = useWindowDimensions();

  const recentlyPlayed  = useLibraryStore(s => s.recentlyPlayed);
  const { currentTrack, playTrack } = useAudio();

  const [popularTracks, setPopularTracks] = useState<Track[]>([]);
  const [newTracks,     setNewTracks]     = useState<Track[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const CARD_SIZE = Math.round(width * 0.38);
  const TAB_BOTTOM = 70 + 64 + insets.bottom; // tab bar + mini player

  const loadContent = useCallback(async () => {
    const jamendo = providerRegistry.get('jamendo');
    if (!jamendo) {
      setError('Music provider not configured. Add EXPO_PUBLIC_JAMENDO_CLIENT_ID to .env');
      setIsLoading(false);
      return;
    }
    try {
      setError(null);
      // Cast to JamendoProvider to access extra methods
      const j = jamendo as any;
      const [popular, fresh] = await Promise.all([
        j.getPopularTracks?.(12) ?? [],
        j.getNewTracks?.(12) ?? [],
      ]);
      setPopularTracks(popular);
      setNewTracks(fresh);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load content');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadContent(); }, [loadContent]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadContent();
  }, [loadContent]);

  const handleTrackPress = useCallback(async (track: Track) => {
    if (track.playbackAvailability === 'unavailable') return;
    await playTrack(track);
    router.push('/player');
  }, [playTrack, router]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {/* Decorative gradient behind header */}
      <LinearGradient
        colors={[theme.colors.accentLight, 'transparent']}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BOTTOM }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16, paddingHorizontal: theme.spacing[5] }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
                {getGreeting(t)}
              </Text>
              <Text style={[styles.appName, { color: theme.colors.textPrimary }]}>
                TracMusic
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/search')}
              style={[styles.searchBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              accessibilityLabel="Open search"
            >
              <Text style={{ fontSize: 18 }}>🔍</Text>
            </Pressable>
          </View>
        </View>

        {/* Error state */}
        {error && !isLoading && (
          <GlassCard style={[styles.errorCard, { marginHorizontal: theme.spacing[5] }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              ⚠ {error}
            </Text>
          </GlassCard>
        )}

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <Section title={t('home.recentlyPlayed')} theme={theme}>
            <HorizontalTrackCards
              tracks={recentlyPlayed.slice(0, 10)}
              cardSize={CARD_SIZE}
              onPress={handleTrackPress}
              currentTrack={currentTrack}
              theme={theme}
            />
          </Section>
        )}

        {/* Trending (Jamendo popularity_week) */}
        <Section
          title={t('home.trendingNow')}
          subtitle="Jamendo · CC Licensed"
          theme={theme}
        >
          {isLoading ? (
            <HorizontalSkeletons count={5} size={CARD_SIZE} theme={theme} />
          ) : (
            <HorizontalTrackCards
              tracks={popularTracks}
              cardSize={CARD_SIZE}
              onPress={handleTrackPress}
              currentTrack={currentTrack}
              theme={theme}
            />
          )}
        </Section>

        {/* New Releases */}
        <Section title={t('home.newReleases')} theme={theme}>
          {isLoading ? (
            <>
              <TrackRowSkeleton />
              <TrackRowSkeleton />
              <TrackRowSkeleton />
            </>
          ) : (
            newTracks.slice(0, 8).map(track => (
              <TrackRow
                key={track.id}
                track={track}
                isPlaying={currentTrack?.id === track.id}
                onPress={handleTrackPress}
                showDuration
              />
            ))
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

// ---- Sub-components ----
function Section({
  title,
  subtitle,
  children,
  theme,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { paddingHorizontal: theme.spacing[5] }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

function HorizontalTrackCards({
  tracks,
  cardSize,
  onPress,
  currentTrack,
  theme,
}: {
  tracks: Track[];
  cardSize: number;
  onPress: (t: Track) => void;
  currentTrack: Track | null;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: theme.spacing[5], gap: theme.spacing[3] }}
    >
      {tracks.map(track => (
        <TrackCard
          key={track.id}
          track={track}
          size={cardSize}
          isPlaying={currentTrack?.id === track.id}
          onPress={() => onPress(track)}
          theme={theme}
        />
      ))}
    </ScrollView>
  );
}

function TrackCard({
  track,
  size,
  isPlaying,
  onPress,
  theme,
}: {
  track: Track;
  size: number;
  isPlaying: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <Pressable onPress={onPress} style={{ width: size }}>
      <View
        style={[
          styles.cardArtwork,
          {
            width: size,
            height: size,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.bgTertiary,
            borderWidth: isPlaying ? 2 : 0,
            borderColor: theme.colors.accent,
          },
          theme.shadow.sm,
        ]}
      >
        {track.artworkUrl ? (
          <Image
            source={{ uri: track.artworkUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
        ) : null}
        {isPlaying && (
          <View style={[StyleSheet.absoluteFill, styles.playingOverlay]}>
            <Text style={{ fontSize: 28 }}>▶</Text>
          </View>
        )}
        {/* License badge */}
        {track.licenseInfo && (
          <View style={[styles.licenseBadge, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
            <Text style={styles.licenseText}>
              {track.licenseInfo.name.replace('Creative Commons ', 'CC ')}
            </Text>
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.cardTitle,
          { color: isPlaying ? theme.colors.accent : theme.colors.textPrimary },
        ]}
      >
        {track.title}
      </Text>
      <Text numberOfLines={1} style={[styles.cardArtist, { color: theme.colors.textSecondary }]}>
        {track.artists[0]?.name ?? ''}
      </Text>
    </Pressable>
  );
}

function HorizontalSkeletons({
  count,
  size,
  theme,
}: {
  count: number;
  size: number;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: theme.spacing[5], gap: theme.spacing[3] }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} size={size} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  cardArtwork: {
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardArtist: {
    fontSize: 12,
  },
  playingOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  licenseBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  licenseText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  errorCard: {
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
