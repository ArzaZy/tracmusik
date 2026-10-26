import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { useAudio } from '../hooks/useAudio';
import { usePlaybackStore } from '../services/audio/playbackStore';
import { useTranslation } from 'react-i18next';
import type { QueueItem } from '../types/music';

function formatMs(ms: number | null): string {
  if (!ms) return '--:--';
  const s   = Math.floor(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function QueueScreen() {
  const { theme }          = useTheme();
  const { t }              = useTranslation();
  const router             = useRouter();
  const insets             = useSafeAreaInsets();
  const { queue, currentQueueIndex, status } = useAudio();
  const { removeFromQueue, clearQueue, setQueueIndex } = usePlaybackStore();

  const handleClearQueue = useCallback(() => {
    Alert.alert(
      t('player.queue'),
      'Clear the entire queue?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => { clearQueue(); router.back(); },
        },
      ],
    );
  }, [clearQueue, router, t]);

  const handlePlayItem = useCallback((index: number) => {
    setQueueIndex(index);
    router.back();
  }, [setQueueIndex, router]);

  const renderItem = useCallback(({ item, index }: { item: QueueItem; index: number }) => {
    const isCurrent = index === currentQueueIndex;
    const track     = item.track;
    const artist    = track.artists.map(a => a.name).join(', ');

    return (
      <Pressable
        onPress={() => handlePlayItem(index)}
        style={[
          styles.item,
          isCurrent && { backgroundColor: theme.colors.accentDim },
          { paddingHorizontal: theme.spacing[4] },
        ]}
      >
        {/* Drag handle (Phase 5 reordering) */}
        <View style={styles.dragHandle}>
          <Ionicons name="reorder-two" size={20} color={theme.colors.textTertiary} />
        </View>

        {/* Artwork */}
        <View style={[styles.artwork, { borderRadius: theme.radius.sm, backgroundColor: theme.colors.bgTertiary }]}>
          {track.artworkUrl ? (
            <Image source={{ uri: track.artworkUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Text style={{ fontSize: 16, textAlign: 'center' }}>🎵</Text>
          )}
          {isCurrent && status === 'playing' && (
            <View style={[StyleSheet.absoluteFill, styles.playingOverlay, { borderRadius: theme.radius.sm }]}>
              <Text style={{ fontSize: 14, color: '#fff' }}>▶</Text>
            </View>
          )}
        </View>

        {/* Track info */}
        <View style={styles.textBlock}>
          <Text
            numberOfLines={1}
            style={[
              styles.trackTitle,
              {
                color: isCurrent ? theme.colors.accent : theme.colors.textPrimary,
                fontWeight: isCurrent ? '700' : '500',
              },
            ]}
          >
            {track.title}
          </Text>
          <Text numberOfLines={1} style={[styles.trackArtist, { color: theme.colors.textSecondary }]}>
            {artist}
          </Text>
        </View>

        {/* Duration + remove */}
        <View style={styles.right}>
          <Text style={[styles.duration, { color: theme.colors.textTertiary }]}>
            {formatMs(track.durationMs)}
          </Text>
          {!isCurrent && (
            <Pressable
              onPress={() => removeFromQueue(item.queueId)}
              hitSlop={8}
              style={{ padding: 4 }}
            >
              <Ionicons name="close" size={16} color={theme.colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  }, [currentQueueIndex, status, theme, handlePlayItem, removeFromQueue]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <BlurView
        intensity={50}
        tint={theme.isDark ? 'dark' : 'light'}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={[StyleSheet.absoluteFill, {
          backgroundColor: theme.colors.glass,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.separator,
        }]} />
        <View style={[styles.headerContent, { paddingHorizontal: theme.spacing[4] }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-down" size={26} color={theme.colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              {t('player.queue')}
            </Text>
            <Text style={[styles.headerSub, { color: theme.colors.textTertiary }]}>
              {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
            </Text>
          </View>
          <Pressable onPress={handleClearQueue} hitSlop={8}>
            <Text style={[styles.clearBtn, { color: theme.colors.error }]}>Clear</Text>
          </Pressable>
        </View>
      </BlurView>

      {/* Queue list */}
      {queue.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>🎵</Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Queue is empty
          </Text>
        </View>
      ) : (
        <FlatList
          data={queue}
          keyExtractor={item => item.queueId}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          initialScrollIndex={Math.max(0, currentQueueIndex)}
          getItemLayout={(_, index) => ({ length: 68, offset: 68 * index, index })}
          onScrollToIndexFailed={() => {}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header:         { overflow: 'hidden' },
  headerContent:  { flexDirection: 'row', alignItems: 'center', paddingBottom: 14, gap: 12 },
  headerTitle:    { fontSize: 17, fontWeight: '700' },
  headerSub:      { fontSize: 12, marginTop: 2 },
  clearBtn:       { fontSize: 14, fontWeight: '600' },
  item:           { flexDirection: 'row', alignItems: 'center', height: 68, gap: 10 },
  dragHandle:     { width: 24, alignItems: 'center' },
  artwork:        { width: 46, height: 46, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  playingOverlay: { backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  textBlock:      { flex: 1 },
  trackTitle:     { fontSize: 14, marginBottom: 2 },
  trackArtist:    { fontSize: 12 },
  right:          { alignItems: 'flex-end', gap: 4 },
  duration:       { fontSize: 11 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:      { fontSize: 15 },
});
