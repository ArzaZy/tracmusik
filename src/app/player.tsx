import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useAudio } from '../hooks/useAudio';
import { useLibraryStore } from '../services/libraryStore';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARTWORK_SIZE = Math.min(SCREEN_WIDTH - 64, 320);

function formatMs(ms: number): string {
  const s   = Math.floor(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function PlayerScreen() {
  const { theme }  = useTheme();
  const { t }      = useTranslation();
  const router     = useRouter();
  const insets     = useSafeAreaInsets();

  const {
    currentTrack, status, positionMs, durationMs,
    isShuffled, repeatMode, isPlaying, isLoading, errorMessage,
    togglePlayPause, skipToNext, skipToPrevious,
    seekTo, toggleShuffle, cycleRepeat,
  } = useAudio();

  const { isLiked, likeTrack, unlikeTrack } = useLibraryStore();

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);

  const progressBarRef = useRef<View>(null);
  const progress = durationMs > 0
    ? (isScrubbing ? scrubPosition : positionMs) / durationMs
    : 0;

  const liked = currentTrack ? isLiked(currentTrack.id) : false;

  const handleLike = useCallback(async () => {
    if (!currentTrack) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (liked) unlikeTrack(currentTrack.id);
    else        likeTrack(currentTrack);
  }, [currentTrack, liked, likeTrack, unlikeTrack]);

  const handlePlayPause = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await togglePlayPause();
  }, [togglePlayPause]);

  const handleNext = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await skipToNext();
  }, [skipToNext]);

  const handlePrev = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await skipToPrevious();
  }, [skipToPrevious]);

  // Artwork scale animation when playing/paused
  const artworkScale = useSharedValue(isPlaying ? 1 : 0.88);
  React.useEffect(() => {
    artworkScale.value = withSpring(isPlaying ? 1 : 0.88, { damping: 14, stiffness: 120 });
  }, [isPlaying, artworkScale]);

  const artworkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: artworkScale.value }],
  }));

  // Play button
  const playBtnScale = useSharedValue(1);
  const playBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playBtnScale.value }],
  }));

  if (!currentTrack) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.bg }]}>
        <Text style={{ fontSize: 44, marginBottom: 12 }}>🎵</Text>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {t('player.noTrackLoaded')}
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
          <Text style={{ color: theme.colors.accent, fontSize: 16, fontWeight: '600' }}>
            {t('common.close')}
          </Text>
        </Pressable>
      </View>
    );
  }

  const artistText = currentTrack.artists.map(a => a.name).join(', ');
  const artworkUri = currentTrack.artworkUrl;

  return (
    <View style={styles.container}>
      {/* Dynamic blurred artwork background */}
      {artworkUri && (
        <>
          <Image
            source={{ uri: artworkUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={Platform.OS === 'ios' ? 50 : 22}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.60)' }]} />
        </>
      )}
      {!artworkUri && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.playerBg }]} />
      )}

      {/* Bottom gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.90)']}
        style={[StyleSheet.absoluteFill, { top: '30%' }]}
        pointerEvents="none"
      />

      <View style={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>

        {/* Header */}
        <View style={[styles.headerBar, { paddingHorizontal: 20 }]}>
          <Pressable onPress={() => router.back()} hitSlop={14}>
            <Ionicons name="chevron-down" size={28} color="rgba(255,255,255,0.85)" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerLabel}>{t('player.nowPlaying')}</Text>
            <Text style={styles.providerBadge}>
              {currentTrack.providerName}
              {currentTrack.licenseInfo && ` · ${currentTrack.licenseInfo.name}`}
            </Text>
          </View>
          <Pressable hitSlop={14}>
            <Ionicons name="ellipsis-horizontal" size={22} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>

        {/* Artwork — scales with play state */}
        <Animated.View style={[styles.artworkContainer, artworkStyle]}>
          <View style={[styles.artwork, { borderRadius: theme.radius.xl }, theme.shadow.lg]}>
            {artworkUri ? (
              <Image
                source={{ uri: artworkUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={300}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, {
                backgroundColor: theme.colors.bgTertiary,
                justifyContent: 'center', alignItems: 'center',
              }]}>
                <Text style={{ fontSize: 80 }}>🎵</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Track info + like */}
        <View style={[styles.infoRow, { paddingHorizontal: 32, marginTop: 28 }]}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text numberOfLines={1} style={styles.trackTitle}>
              {currentTrack.title}
            </Text>
            <Text numberOfLines={1} style={styles.trackArtist}>{artistText}</Text>
            {currentTrack.album && (
              <Text numberOfLines={1} style={styles.trackAlbum}>
                {currentTrack.album.title}
              </Text>
            )}
          </View>
          <Animated.View>
            <Pressable
              onPress={handleLike}
              hitSlop={10}
              style={styles.likeBtn}
            >
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={28}
                color={liked ? '#FF4B6E' : 'rgba(255,255,255,0.65)'}
              />
            </Pressable>
          </Animated.View>
        </View>

        {/* Error state */}
        {errorMessage && (
          <View style={[styles.errorBadge, { marginHorizontal: 32, marginTop: 8 }]}>
            <Text style={styles.errorText}>⚠ {errorMessage}</Text>
          </View>
        )}

        {/* Unavailable notice */}
        {currentTrack.playbackAvailability === 'unavailable' && !errorMessage && (
          <View style={[styles.noticeBadge, { marginHorizontal: 32, marginTop: 8 }]}>
            <Text style={styles.noticeText}>{t('player.audioUnavailable')}</Text>
          </View>
        )}

        {/* Progress / seek bar */}
        <View style={[styles.progressSection, { paddingHorizontal: 32, marginTop: 20 }]}>
          {/* Track - tappable */}
          <View
            ref={progressBarRef}
            style={[styles.progressBg, { backgroundColor: 'rgba(255,255,255,0.22)' }]}
            onStartShouldSetResponder={() => durationMs > 0}
            onResponderGrant={(e) => {
              setIsScrubbing(true);
              const x = e.nativeEvent.locationX;
              const barWidth = SCREEN_WIDTH - 64;
              const pct = Math.max(0, Math.min(1, x / barWidth));
              setScrubPosition(pct * durationMs);
            }}
            onResponderMove={(e) => {
              const x = e.nativeEvent.locationX;
              const barWidth = SCREEN_WIDTH - 64;
              const pct = Math.max(0, Math.min(1, x / barWidth));
              setScrubPosition(pct * durationMs);
            }}
            onResponderRelease={async () => {
              setIsScrubbing(false);
              await seekTo(scrubPosition);
            }}
          >
            <View
              style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: '#fff' }]}
            />
            {/* Scrubber handle */}
            <View
              style={[styles.scrubHandle, {
                left: `${progress * 100}%`,
                backgroundColor: '#fff',
                transform: [{ scale: isScrubbing ? 1.4 : 1 }],
              }]}
            />
          </View>

          {/* Time */}
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatMs(isScrubbing ? scrubPosition : positionMs)}</Text>
            <Text style={styles.timeText}>{formatMs(durationMs)}</Text>
          </View>
        </View>

        {/* Main controls */}
        <View style={[styles.controls, { paddingHorizontal: 24, marginTop: 12 }]}>
          {/* Shuffle */}
          <ControlIcon
            onPress={() => { Haptics.selectionAsync(); toggleShuffle(); }}
            active={isShuffled}
            activeColor={theme.colors.accent}
          >
            <Ionicons name="shuffle" size={22}
              color={isShuffled ? theme.colors.accent : 'rgba(255,255,255,0.55)'} />
          </ControlIcon>

          {/* Previous */}
          <ControlIcon onPress={handlePrev}>
            <Ionicons name="play-skip-back" size={30} color="rgba(255,255,255,0.9)" />
          </ControlIcon>

          {/* Play / Pause */}
          <Animated.View style={playBtnStyle}>
            <Pressable
              onPress={handlePlayPause}
              onPressIn={() => { playBtnScale.value = withSpring(0.90, { damping: 8 }); }}
              onPressOut={() => { playBtnScale.value = withSpring(1, { damping: 10 }); }}
              style={[styles.playBtn, { backgroundColor: '#fff' }]}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color={theme.colors.playerBg} />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color={theme.isDark ? '#100D1E' : '#1A0458'}
                  style={!isPlaying ? { marginLeft: 3 } : undefined}
                />
              )}
            </Pressable>
          </Animated.View>

          {/* Next */}
          <ControlIcon onPress={handleNext}>
            <Ionicons name="play-skip-forward" size={30} color="rgba(255,255,255,0.9)" />
          </ControlIcon>

          {/* Repeat */}
          <View style={{ position: 'relative' }}>
            <ControlIcon
              onPress={() => { Haptics.selectionAsync(); cycleRepeat(); }}
              active={repeatMode !== 'off'}
              activeColor={theme.colors.accent}
            >
              <Ionicons
                name="repeat"
                size={22}
                color={repeatMode !== 'off' ? theme.colors.accent : 'rgba(255,255,255,0.55)'}
              />
            </ControlIcon>
            {repeatMode === 'one' && (
              <View style={styles.repeatOneDot}>
                <Text style={styles.repeatOneText}>1</Text>
              </View>
            )}
          </View>
        </View>

        {/* Secondary row: queue button + add to playlist */}
        <View style={[styles.secondaryRow, { paddingHorizontal: 32, marginTop: 20 }]}>
          <Pressable onPress={() => router.push('/queue')} style={styles.secondaryBtn} hitSlop={8}>
            <Ionicons name="list" size={20} color="rgba(255,255,255,0.55)" />
            <Text style={styles.secondaryLabel}>{t('player.queue')}</Text>
          </Pressable>

          <View style={[styles.separatorDot, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />

          <Pressable style={styles.secondaryBtn} hitSlop={8}>
            <Ionicons name="add-circle-outline" size={20} color="rgba(255,255,255,0.55)" />
            <Text style={styles.secondaryLabel}>{t('player.addToPlaylist')}</Text>
          </Pressable>
        </View>

        {/* CC attribution — required for CC-BY tracks */}
        {currentTrack.licenseInfo?.requiresAttribution && (
          <View style={[styles.attribution, { marginHorizontal: 32, marginTop: 16 }]}>
            <Text style={styles.attributionText}>
              "{currentTrack.title}" by {artistText}
            </Text>
            <Text style={styles.attributionLicense}>
              {currentTrack.licenseInfo.name}
              {currentTrack.externalUrl ? ' · jamendo.com' : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ---- Helper components ----
function ControlIcon({
  children, onPress, active = false, activeColor,
}: {
  children: React.ReactNode;
  onPress: () => void;
  active?: boolean;
  activeColor?: string;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.82, { damping: 8 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        hitSlop={10}
        style={styles.iconWrap}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  emptyContainer:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:       { fontSize: 16, textAlign: 'center' },
  content:         { flex: 1 },
  headerBar:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerLabel:     { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  providerBadge:   { color: 'rgba(255,255,255,0.40)', fontSize: 10, marginTop: 1 },
  artworkContainer:{ alignItems: 'center', marginTop: 20 },
  artwork:         { width: ARTWORK_SIZE, height: ARTWORK_SIZE, overflow: 'hidden' },
  infoRow:         { flexDirection: 'row', alignItems: 'flex-start' },
  trackTitle:      { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  trackArtist:     { color: 'rgba(255,255,255,0.75)', fontSize: 16, fontWeight: '500', marginBottom: 2 },
  trackAlbum:      { color: 'rgba(255,255,255,0.42)', fontSize: 13 },
  likeBtn:         { padding: 4 },
  errorBadge:      { backgroundColor: 'rgba(248,113,113,0.18)', borderRadius: 8, padding: 10 },
  errorText:       { color: '#F87171', fontSize: 12 },
  noticeBadge:     { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 8, padding: 10 },
  noticeText:      { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  progressSection: {},
  progressBg:      { height: 4, borderRadius: 2, position: 'relative' },
  progressFill:    { height: 4, borderRadius: 2 },
  scrubHandle:     {
    position: 'absolute', top: -6,
    width: 16, height: 16, borderRadius: 8,
    marginLeft: -8,
  },
  timeRow:         { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  timeText:        { color: 'rgba(255,255,255,0.50)', fontSize: 12 },
  controls:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playBtn:         { width: 74, height: 74, borderRadius: 37, justifyContent: 'center', alignItems: 'center' },
  iconWrap:        { padding: 6 },
  repeatOneDot:    {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#7035E0', borderRadius: 7,
    width: 14, height: 14, justifyContent: 'center', alignItems: 'center',
  },
  repeatOneText:   { color: '#fff', fontSize: 8, fontWeight: '800' },
  secondaryRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  secondaryBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secondaryLabel:  { color: 'rgba(255,255,255,0.50)', fontSize: 13 },
  separatorDot:    { width: 4, height: 4, borderRadius: 2 },
  attribution:     { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: 12, alignItems: 'center' },
  attributionText: { color: 'rgba(255,255,255,0.55)', fontSize: 11, textAlign: 'center' },
  attributionLicense:{ color: 'rgba(255,255,255,0.32)', fontSize: 10, marginTop: 2 },
});
