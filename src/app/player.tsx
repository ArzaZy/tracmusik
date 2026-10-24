import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { usePlaybackStore } from '../services/audio/playbackStore';
import { useLibraryStore } from '../services/libraryStore';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ARTWORK_SIZE = Math.min(SCREEN_WIDTH - 64, 320);

export default function PlayerScreen() {
  const { theme }  = useTheme();
  const { t }      = useTranslation();
  const router     = useRouter();
  const insets     = useSafeAreaInsets();

  const {
    currentTrack, status, positionMs, durationMs,
    isShuffled, repeatMode,
    toggleShuffle, setRepeatMode,
  } = usePlaybackStore();

  const { isLiked, likeTrack, unlikeTrack } = useLibraryStore();

  const isPlaying  = status === 'playing';
  const isLoading  = status === 'loading';
  const progress   = durationMs > 0 ? positionMs / durationMs : 0;
  const liked      = currentTrack ? isLiked(currentTrack.id) : false;

  const handleLike = useCallback(() => {
    if (!currentTrack) return;
    if (liked) unlikeTrack(currentTrack.id);
    else        likeTrack(currentTrack);
  }, [currentTrack, liked, likeTrack, unlikeTrack]);

  const cycleRepeat = useCallback(() => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  }, [repeatMode, setRepeatMode]);

  const playBtnScale = useSharedValue(1);
  const playBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playBtnScale.value }],
  }));

  if (!currentTrack) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.bg }]}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🎵</Text>
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
    <View style={[styles.container, { backgroundColor: theme.colors.playerBg }]}>
      {/* Dynamic blurred background from artwork */}
      {artworkUri && (
        <>
          <Image
            source={{ uri: artworkUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={Platform.OS === 'ios' ? 40 : 20}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }]} />
        </>
      )}

      {/* Bottom gradient for readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={[StyleSheet.absoluteFill, { top: SCREEN_HEIGHT * 0.35 }]}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}
        scrollEnabled={false}
      >
        {/* Header bar */}
        <View style={[styles.headerBar, { paddingHorizontal: 20 }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-down" size={28} color="rgba(255,255,255,0.85)" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerLabel}>{t('player.nowPlaying')}</Text>
            <Text style={styles.providerBadge}>{currentTrack.providerName}</Text>
          </View>
          <Pressable hitSlop={12}>
            <Ionicons name="ellipsis-horizontal" size={22} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>

        {/* Artwork */}
        <View style={[styles.artworkContainer, { marginTop: 24 }]}>
          <Animated.View
            style={[
              styles.artworkShadow,
              {
                shadowColor: theme.colors.accent,
                shadowRadius: isPlaying ? 32 : 16,
                shadowOpacity: isPlaying ? 0.5 : 0.25,
              },
            ]}
          >
            <View style={[styles.artwork, { borderRadius: theme.radius.xl }]}>
              {artworkUri ? (
                <Image
                  source={{ uri: artworkUri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.bgTertiary, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 72 }}>🎵</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Track info + like */}
        <View style={[styles.infoRow, { paddingHorizontal: 32, marginTop: 32 }]}>
          <View style={{ flex: 1, marginRight: 12 }}>
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
          <Pressable onPress={handleLike} hitSlop={8}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={26}
              color={liked ? '#FF4B6E' : 'rgba(255,255,255,0.65)'}
            />
          </Pressable>
        </View>

        {/* Availability notice */}
        {currentTrack.playbackAvailability !== 'available' && (
          <View style={[styles.noticeBadge, { marginHorizontal: 32, marginTop: 8 }]}>
            <Text style={styles.noticeText}>
              {currentTrack.playbackAvailability === 'external_only'
                ? '🔗 ' + t('player.openIn', { app: 'YouTube Music' })
                : '⚠ ' + t('player.audioUnavailable')}
            </Text>
          </View>
        )}

        {/* Progress bar */}
        <View style={[styles.progressSection, { paddingHorizontal: 32, marginTop: 20 }]}>
          <View style={[styles.progressBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: '#fff',
                },
              ]}
            />
            {/* Scrubber dot */}
            <View
              style={[
                styles.scrubDot,
                { left: `${progress * 100}%`, backgroundColor: '#fff' },
              ]}
            />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatMs(positionMs)}</Text>
            <Text style={styles.timeText}>{formatMs(durationMs)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={[styles.controls, { paddingHorizontal: 20, marginTop: 16 }]}>
          {/* Shuffle */}
          <Pressable onPress={toggleShuffle} hitSlop={10}>
            <Ionicons
              name="shuffle"
              size={22}
              color={isShuffled ? theme.colors.accent : 'rgba(255,255,255,0.55)'}
            />
          </Pressable>

          {/* Prev */}
          <ControlBtn
            icon="play-skip-back"
            size={28}
            onPress={() => {/* Phase 3 */}}
          />

          {/* Play/Pause */}
          <Animated.View style={playBtnStyle}>
            <Pressable
              onPress={() => {/* Phase 3 */}}
              onPressIn={() => { playBtnScale.value = withSpring(0.92, { damping: 10 }); }}
              onPressOut={() => { playBtnScale.value = withSpring(1, { damping: 10 }); }}
              style={[styles.playBtn, { backgroundColor: '#fff' }]}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            >
              <Ionicons
                name={isLoading ? 'hourglass-outline' : isPlaying ? 'pause' : 'play'}
                size={30}
                color={theme.isDark ? theme.colors.playerBg : '#1A0458'}
              />
            </Pressable>
          </Animated.View>

          {/* Next */}
          <ControlBtn
            icon="play-skip-forward"
            size={28}
            onPress={() => {/* Phase 3 */}}
          />

          {/* Repeat */}
          <Pressable onPress={cycleRepeat} hitSlop={10}>
            <Ionicons
              name={repeatMode === 'one' ? 'repeat-outline' : 'repeat'}
              size={22}
              color={repeatMode !== 'off' ? theme.colors.accent : 'rgba(255,255,255,0.55)'}
            />
            {repeatMode === 'one' && (
              <View style={styles.repeatOneBadge}>
                <Text style={styles.repeatOneText}>1</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* License attribution */}
        {currentTrack.licenseInfo?.requiresAttribution && (
          <View style={[styles.attribution, { marginHorizontal: 32, marginTop: 20 }]}>
            <Text style={styles.attributionText}>
              "{currentTrack.title}" by {artistText} · {currentTrack.licenseInfo.name}
            </Text>
          </View>
        )}

        {/* Audio unavailable for Phase 3 notice */}
        {currentTrack.playbackAvailability === 'available' && (
          <View style={[styles.phase3Notice, { marginHorizontal: 32, marginTop: 12 }]}>
            <Text style={styles.phase3Text}>
              🔧 Audio engine coming in Phase 3.{'\n'}
              Stream URL ready: {currentTrack.streamUrl ? '✅' : '❌'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ControlBtn({
  icon, size, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  size: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.88); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        hitSlop={12}
      >
        <Ionicons name={icon} size={size} color="rgba(255,255,255,0.9)" />
      </Pressable>
    </Animated.View>
  );
}

function formatMs(ms: number): string {
  const s   = Math.floor(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  emptyContainer:{ flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:    { fontSize: 16, textAlign: 'center' },
  content:      { alignItems: 'center' },
  headerBar:    {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', gap: 12,
  },
  headerLabel:  { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  providerBadge:{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 1 },
  artworkContainer: { alignItems: 'center' },
  artworkShadow:{ elevation: 16 },
  artwork:      {
    width: ARTWORK_SIZE, height: ARTWORK_SIZE,
    overflow: 'hidden',
  },
  infoRow:      { flexDirection: 'row', alignItems: 'center', width: '100%' },
  trackTitle:   { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  trackArtist:  { color: 'rgba(255,255,255,0.75)', fontSize: 16, fontWeight: '500', marginBottom: 2 },
  trackAlbum:   { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  noticeBadge:  { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: 10 },
  noticeText:   { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  progressSection: { width: '100%' },
  progressBg:   { height: 4, borderRadius: 2, width: '100%', position: 'relative' },
  progressFill: { height: 4, borderRadius: 2 },
  scrubDot:     {
    position: 'absolute', top: -5, width: 14, height: 14,
    borderRadius: 7, marginLeft: -7,
  },
  timeRow:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  timeText:     { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
  controls:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  playBtn:      {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
  },
  repeatOneBadge:{
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: '#7035E0', borderRadius: 6, width: 12, height: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  repeatOneText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  attribution:  { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10 },
  attributionText:{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', lineHeight: 16 },
  phase3Notice: { backgroundColor: 'rgba(112,53,224,0.2)', borderRadius: 8, padding: 10 },
  phase3Text:   { color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center', lineHeight: 18 },
});
