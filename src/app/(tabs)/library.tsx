import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useAudio } from '../../hooks/useAudio';
import { useLibraryStore } from '../../services/libraryStore';
import { usePlaybackStore } from '../../services/audio/playbackStore';
import { TrackRow } from '../../components/ui/TrackRow';
import { GlassCard } from '../../components/ui/GlassCard';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

type LibraryView = 'main' | 'liked' | 'playlists' | 'artists' | 'recent';

export default function LibraryScreen() {
  const { theme }          = useTheme();
  const { t }              = useTranslation();
  const insets             = useSafeAreaInsets();
  const router             = useRouter();
  const [view, setView]    = useState<LibraryView>('main');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle]     = useState('');

  const {
    likedTracks, followedArtists, playlists, recentlyPlayed,
    createPlaylist, deletePlaylist,
  } = useLibraryStore();

  const { currentTrack, playTrack } = useAudio();

  const TAB_BOTTOM = 70 + (currentTrack ? 72 : 0) + insets.bottom;

  const handleCreatePlaylist = useCallback(async () => {
    if (!newTitle.trim()) return;
    await createPlaylist(newTitle.trim());
    setNewTitle('');
    setShowCreate(false);
  }, [newTitle, createPlaylist]);

  const handleDeletePlaylist = useCallback((id: string, title: string) => {
    Alert.alert(
      t('common.delete'),
      `Delete "${title}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => deletePlaylist(id) },
      ],
    );
  }, [deletePlaylist, t]);

  const handleTrackPress = useCallback(async (track: any) => {
    await playTrack(track);
    router.push('/player');
  }, [playTrack, router]);

  // ---- Sub-views ----
  if (view === 'liked') {
    return (
      <SubView
        title={t('library.liked')}
        onBack={() => setView('main')}
        theme={theme}
        insets={insets}
        bottomPad={TAB_BOTTOM}
      >
        {likedTracks.length === 0 ? (
          <EmptyState emoji="🎵" message={t('library.noLiked')} theme={theme} />
        ) : (
          likedTracks.map(track => (
            <TrackRow
              key={track.id}
              track={track}
              isPlaying={currentTrack?.id === track.id}
              onPress={handleTrackPress}
              showDuration
            />
          ))
        )}
      </SubView>
    );
  }

  if (view === 'recent') {
    return (
      <SubView
        title={t('library.recentlyPlayed')}
        onBack={() => setView('main')}
        theme={theme}
        insets={insets}
        bottomPad={TAB_BOTTOM}
      >
        {recentlyPlayed.length === 0 ? (
          <EmptyState emoji="🕐" message={t('home.noRecentlyPlayed')} theme={theme} />
        ) : (
          recentlyPlayed.map(track => (
            <TrackRow
              key={track.id}
              track={track}
              isPlaying={currentTrack?.id === track.id}
              onPress={handleTrackPress}
            />
          ))
        )}
      </SubView>
    );
  }

  // ---- Main view ----
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BOTTOM }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16, paddingHorizontal: theme.spacing[5] }]}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {t('library.title')}
          </Text>
        </View>

        {/* Quick-access cards */}
        <View style={[styles.grid, { paddingHorizontal: theme.spacing[4] }]}>
          <LibraryCard
            emoji="❤️"
            label={t('library.liked')}
            count={likedTracks.length}
            onPress={() => setView('liked')}
            theme={theme}
          />
          <LibraryCard
            emoji="🕐"
            label={t('library.recentlyPlayed')}
            count={recentlyPlayed.length}
            onPress={() => setView('recent')}
            theme={theme}
          />
        </View>

        {/* Playlists */}
        <View style={[styles.section, { paddingHorizontal: theme.spacing[5] }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              {t('library.playlists')}
            </Text>
            <Pressable
              onPress={() => setShowCreate(true)}
              style={[styles.createBtn, { backgroundColor: theme.colors.accentLight }]}
            >
              <Ionicons name="add" size={20} color={theme.colors.accent} />
            </Pressable>
          </View>

          {playlists.length === 0 ? (
            <Pressable onPress={() => setShowCreate(true)}>
              <GlassCard style={styles.emptyPlaylist}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>＋</Text>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {t('library.noPlaylists')}
                </Text>
                <Text style={[styles.emptySubText, { color: theme.colors.accent }]}>
                  {t('library.createPlaylist')}
                </Text>
              </GlassCard>
            </Pressable>
          ) : (
            playlists.map(pl => (
              <PlaylistRow
                key={pl.id}
                title={pl.title}
                trackCount={pl.trackIds.length}
                onPress={() => {}}
                onDelete={() => handleDeletePlaylist(pl.id, pl.title)}
                theme={theme}
                t={t}
              />
            ))
          )}
        </View>

        {/* Followed Artists */}
        {followedArtists.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: theme.spacing[5] }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginBottom: 12 }]}>
              {t('library.artists')}
            </Text>
            {followedArtists.map(artist => (
              <View key={artist.id} style={styles.artistRow}>
                <View style={[styles.artistAvatar, { backgroundColor: theme.colors.bgTertiary }]}>
                  {artist.imageUrl ? (
                    <Image source={{ uri: artist.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : (
                    <Text style={{ fontSize: 20 }}>🎤</Text>
                  )}
                </View>
                <Text style={[styles.artistName, { color: theme.colors.textPrimary }]}>
                  {artist.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Playlist Modal */}
      <Modal
        visible={showCreate}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreate(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              {t('library.createPlaylist')}
            </Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder={t('library.playlistName')}
              placeholderTextColor={theme.colors.placeholder}
              style={[
                styles.modalInput,
                {
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.bgSecondary,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                },
              ]}
              autoFocus
              maxLength={50}
            />
            <View style={styles.modalBtns}>
              <Pressable
                onPress={() => { setShowCreate(false); setNewTitle(''); }}
                style={[styles.modalBtn, { backgroundColor: theme.colors.bgSecondary }]}
              >
                <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>
                  {t('common.cancel')}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCreatePlaylist}
                style={[styles.modalBtn, { backgroundColor: theme.colors.accent, opacity: newTitle.trim() ? 1 : 0.4 }]}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {t('common.save')}
                </Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

// ---- Helper components ----
function SubView({
  title, children, onBack, theme, insets, bottomPad,
}: {
  title: string; children: React.ReactNode; onBack: () => void;
  theme: any; insets: any; bottomPad: number;
}) {
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={[styles.subHeader, { paddingTop: insets.top + 12, paddingHorizontal: theme.spacing[4] }]}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={[styles.subTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
        {children}
      </ScrollView>
    </View>
  );
}

function LibraryCard({ emoji, label, count, onPress, theme }: any) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <GlassCard style={styles.quickCard}>
        <Text style={{ fontSize: 28 }}>{emoji}</Text>
        <Text style={[styles.quickLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
        {count > 0 && (
          <Text style={[styles.quickCount, { color: theme.colors.textTertiary }]}>{count}</Text>
        )}
      </GlassCard>
    </Pressable>
  );
}

function PlaylistRow({ title, trackCount, onPress, onDelete, theme, t }: any) {
  return (
    <Pressable onPress={onPress} style={styles.plRow}>
      <View style={[styles.plArt, { backgroundColor: theme.colors.bgTertiary, borderRadius: theme.radius.sm }]}>
        <Text style={{ fontSize: 22 }}>🎵</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.plTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.plCount, { color: theme.colors.textSecondary }]}>
          {t('library.tracks', { count: trackCount })}
        </Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={theme.colors.textTertiary} />
      </Pressable>
    </Pressable>
  );
}

function EmptyState({ emoji, message, theme }: any) {
  return (
    <View style={styles.emptyCenter}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</Text>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  content:     { flexGrow: 1 },
  header:      { marginBottom: 20 },
  title:       { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  grid:        { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickCard:   { padding: 16, gap: 6, flex: 1 },
  quickLabel:  { fontSize: 14, fontWeight: '700' },
  quickCount:  { fontSize: 12 },
  section:     { marginBottom: 24 },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  createBtn:   { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  emptyPlaylist:{ padding: 24, alignItems: 'center' },
  emptyText:   { fontSize: 14, textAlign: 'center', marginBottom: 4 },
  emptySubText:{ fontSize: 13, fontWeight: '600' },
  plRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  plArt:       { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  plTitle:     { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  plCount:     { fontSize: 12 },
  artistRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  artistAvatar:{ width: 46, height: 46, borderRadius: 23, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  artistName:  { fontSize: 15, fontWeight: '500' },
  modalOverlay:{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard:   { margin: 16, padding: 24, borderRadius: 24 },
  modalTitle:  { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalInput:  { height: 48, paddingHorizontal: 14, borderWidth: 1, marginBottom: 20, fontSize: 16 },
  modalBtns:   { flexDirection: 'row', gap: 12 },
  modalBtn:    { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  subHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 },
  subTitle:    { fontSize: 18, fontWeight: '700' },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, paddingTop: 60 },
});
