import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import type { Track } from '../../types/music';

interface TrackRowProps {
  track: Track;
  isPlaying?: boolean;
  isLoading?: boolean;
  onPress?: (track: Track) => void;
  onLongPress?: (track: Track) => void;
  showProvider?: boolean;
  showDuration?: boolean;
  rightElement?: React.ReactNode;
  index?: number;
}

function formatDuration(ms: number): string {
  const s   = Math.floor(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function TrackRow({
  track,
  isPlaying = false,
  isLoading = false,
  onPress,
  onLongPress,
  showProvider = false,
  showDuration = false,
  rightElement,
  index,
}: TrackRowProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn  = useCallback(() => { scale.value = withSpring(0.97, theme.animation.spring.snappy); }, [scale, theme]);
  const handlePressOut = useCallback(() => { scale.value = withSpring(1, theme.animation.spring.gentle); }, [scale, theme]);

  const artistText = track.artists.map(a => a.name).join(', ');
  const isUnavailable = track.playbackAvailability === 'unavailable';

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => onPress?.(track)}
        onLongPress={() => onLongPress?.(track)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.container,
          { paddingHorizontal: theme.spacing[4], opacity: isUnavailable ? 0.45 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${track.title} by ${artistText}`}
        accessibilityState={{ selected: isPlaying }}
      >
        {/* Artwork */}
        <View style={[styles.artworkWrap, { borderRadius: theme.radius.sm }]}>
          {track.artworkUrl ? (
            <Image
              source={{ uri: track.artworkUrl }}
              style={styles.artwork}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View
              style={[
                styles.artworkPlaceholder,
                { backgroundColor: theme.colors.bgTertiary, borderRadius: theme.radius.sm },
              ]}
            />
          )}
          {isPlaying && !isLoading && (
            <View style={[StyleSheet.absoluteFill, styles.playingOverlay, { borderRadius: theme.radius.sm }]}>
              <PlayingWave color={theme.colors.accent} />
            </View>
          )}
          {isLoading && (
            <View style={[StyleSheet.absoluteFill, styles.playingOverlay, { borderRadius: theme.radius.sm }]}>
              <ActivityIndicator size="small" color={theme.colors.accent} />
            </View>
          )}
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          {index !== undefined && (
            <Text style={[styles.index, { color: theme.colors.textTertiary }]}>
              {isPlaying ? '▶' : String(index + 1)}
            </Text>
          )}
          <View style={styles.titleBlock}>
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                {
                  color: isPlaying ? theme.colors.accent : theme.colors.textPrimary,
                  fontWeight: isPlaying ? theme.typography.weight.semibold : theme.typography.weight.medium,
                },
              ]}
            >
              {track.title}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.artist, { color: theme.colors.textSecondary }]}
            >
              {artistText}
              {showProvider && (
                <Text style={{ color: theme.colors.textTertiary }}>
                  {' · '}{track.providerName}
                </Text>
              )}
            </Text>
          </View>
        </View>

        {/* Right side */}
        <View style={styles.right}>
          {showDuration && track.durationMs != null && (
            <Text style={[styles.duration, { color: theme.colors.textTertiary }]}>
              {formatDuration(track.durationMs)}
            </Text>
          )}
          {isUnavailable && (
            <Text style={[styles.unavailable, { color: theme.colors.textTertiary }]}>
              N/A
            </Text>
          )}
          {rightElement}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function PlayingWave({ color }: { color: string }) {
  return (
    <View style={styles.wave}>
      {[0, 1, 2].map(i => (
        <WaveBar key={i} color={color} delay={i * 150} />
      ))}
    </View>
  );
}

function WaveBar({ color, delay }: { color: string; delay: number }) {
  const height = useSharedValue(4);

  React.useEffect(() => {
    const interval = setInterval(() => {
      height.value = withSpring(4 + Math.random() * 12, { damping: 8, stiffness: 200 });
    }, 300 + delay);
    return () => clearInterval(interval);
  }, [height, delay]);

  const style = useAnimatedStyle(() => ({
    height: height.value,
    backgroundColor: color,
    width: 3,
    borderRadius: 2,
  }));

  return <Animated.View style={style} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  artworkWrap: {
    width: 52,
    height: 52,
    overflow: 'hidden',
  },
  artwork: {
    width: 52,
    height: 52,
  },
  artworkPlaceholder: {
    width: 52,
    height: 52,
  },
  playingOverlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  index: {
    fontSize: 13,
    width: 20,
    textAlign: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    marginBottom: 2,
  },
  artist: {
    fontSize: 13,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  duration: {
    fontSize: 12,
  },
  unavailable: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  wave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
