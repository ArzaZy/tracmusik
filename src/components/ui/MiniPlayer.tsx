import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { usePlaybackStore } from '../../services/audio/playbackStore';
import { useRouter } from 'expo-router';

export function MiniPlayer() {
  const { theme } = useTheme();
  const router    = useRouter();
  const { currentTrack, status, positionMs, durationMs } = usePlaybackStore();

  if (!currentTrack) return null;

  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const isPlaying = status === 'playing';
  const isLoading = status === 'loading';
  const artistText = currentTrack.artists.map(a => a.name).join(', ');

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(20)}
      style={[styles.container, { marginHorizontal: theme.spacing[3] }]}
    >
      <BlurView
        intensity={60}
        tint={theme.isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: theme.radius.xl }]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: theme.radius.xl,
            backgroundColor: theme.isDark
              ? 'rgba(30,27,46,0.80)'
              : 'rgba(255,255,255,0.75)',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
          },
        ]}
      />

      {/* Progress bar */}
      <View style={[styles.progressBg, { backgroundColor: theme.colors.borderLight }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: theme.colors.accent,
            },
          ]}
        />
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
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.bgTertiary }]} />
          )}
        </View>

        {/* Title */}
        <View style={styles.textBlock}>
          <Text
            numberOfLines={1}
            style={[styles.title, { color: theme.colors.textPrimary }]}
          >
            {currentTrack.title}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.artist, { color: theme.colors.textSecondary }]}
          >
            {artistText}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <MiniControl
            icon="play-skip-back"
            color={theme.colors.textSecondary}
            onPress={() => {/* Phase 3: audio engine */}}
          />
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.accent} style={styles.playBtn} />
          ) : (
            <MiniControl
              icon={isPlaying ? 'pause' : 'play'}
              color={theme.colors.textPrimary}
              size={26}
              style={styles.playBtn}
              onPress={() => {/* Phase 3: audio engine */}}
            />
          )}
          <MiniControl
            icon="play-skip-forward"
            color={theme.colors.textSecondary}
            onPress={() => {/* Phase 3: audio engine */}}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function MiniControl({
  icon,
  color,
  size = 20,
  onPress,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  size?: number;
  onPress: () => void;
  style?: object;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.85); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        hitSlop={8}
        style={styles.iconBtn}
      >
        <Ionicons name={icon} size={size} color={color} />
      </Pressable>
    </Animated.View>
  );
}

const MINI_HEIGHT = 64;

const styles = StyleSheet.create({
  container: {
    height: MINI_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBg: {
    height: 2,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  progressFill: {
    height: 2,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  artwork: {
    width: 44,
    height: 44,
    overflow: 'hidden',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
  },
});
