import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAudio } from '../../hooks/useAudio';
import { useRouter } from 'expo-router';

export function MiniPlayer() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const {
    currentTrack, status, positionMs, durationMs,
    togglePlayPause, skipToNext, skipToPrevious,
    isPlaying, isLoading,
  } = useAudio();

  if (!currentTrack) return null;

  const progress   = durationMs > 0 ? positionMs / durationMs : 0;
  const artistText = currentTrack.artists.map(a => a.name).join(', ');

  const handlePlayPause = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await togglePlayPause();
  }, [togglePlayPause]);

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(20)}
      style={[styles.container, { marginHorizontal: theme.spacing[3] }]}
    >
      <BlurView
        intensity={65}
        tint={theme.isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: theme.radius.xl }]}
      />
      <View style={[StyleSheet.absoluteFill, {
        borderRadius: theme.radius.xl,
        backgroundColor: theme.isDark ? 'rgba(30,27,46,0.82)' : 'rgba(255,255,255,0.78)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
      }]} />

      {/* Progress bar */}
      <View style={[styles.progressBg, { backgroundColor: theme.colors.borderLight }]}>
        <View style={[styles.progressFill, {
          width: `${Math.min(progress * 100, 100)}%`,
          backgroundColor: theme.colors.accent,
        }]} />
      </View>

      <Pressable
        style={styles.inner}
        onPress={() => router.push('/player')}
        accessibilityLabel="Open full player"
      >
        {/* Artwork */}
        <View style={[styles.artwork, { borderRadius: theme.radius.sm }]}>
          {currentTrack.artworkUrl ? (
            <Image
              source={{ uri: currentTrack.artworkUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.bgTertiary, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 18 }}>🎵</Text>
            </View>
          )}
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.colors.textPrimary }]}>
            {currentTrack.title}
          </Text>
          <Text numberOfLines={1} style={[styles.artist, { color: theme.colors.textSecondary }]}>
            {artistText}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <MiniBtn icon="play-skip-back"  color={theme.colors.textTertiary} onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); await skipToPrevious(); }} />
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.accent} style={{ width: 36 }} />
          ) : (
            <MiniBtn icon={isPlaying ? 'pause' : 'play'} color={theme.colors.textPrimary} size={24} onPress={handlePlayPause} />
          )}
          <MiniBtn icon="play-skip-forward" color={theme.colors.textTertiary} onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); await skipToNext(); }} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function MiniBtn({ icon, color, size = 19, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string; size?: number; onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.8); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        hitSlop={10}
        style={styles.miniBtn}
      >
        <Ionicons name={icon} size={size} color={color} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container:    { height: 64, borderRadius: 20, overflow: 'hidden', marginBottom: 8 },
  progressBg:   { height: 2, position: 'absolute', top: 0, left: 0, right: 0 },
  progressFill: { height: 2 },
  inner:        { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 12 },
  artwork:      { width: 44, height: 44, overflow: 'hidden' },
  textBlock:    { flex: 1 },
  title:        { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  artist:       { fontSize: 12 },
  controls:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  miniBtn:      { padding: 7 },
});
