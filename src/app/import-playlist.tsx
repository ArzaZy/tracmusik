import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/ui/GlassCard';
import { YouTubeMusicProvider, type ImportedTrack } from '../providers/youtubeMusic/YouTubeMusicProvider';
import { providerRegistry } from '../providers/registry';
import { useLibraryStore } from '../services/libraryStore';

const ytProvider = new YouTubeMusicProvider();

type ImportStep = 'pick' | 'matching' | 'review' | 'done';

export default function ImportPlaylistScreen() {
  const { theme }   = useTheme();
  const insets      = useSafeAreaInsets();
  const router      = useRouter();
  const { createPlaylist, addTrackToPlaylist } = useLibraryStore();

  const [step,       setStep]       = useState<ImportStep>('pick');
  const [tracks,     setTracks]     = useState<ImportedTrack[]>([]);
  const [progress,   setProgress]   = useState(0);
  const [total,      setTotal]      = useState(0);
  const [selected,   setSelected]   = useState<Set<number>>(new Set());

  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets[0]) return;

      const asset   = result.assets[0];
      const content = await FileSystem.readAsStringAsync(asset.uri);
      const ext     = asset.name.split('.').pop()?.toLowerCase();

      let imported: ImportedTrack[] = [];
      if (ext === 'json') {
        imported = ytProvider.parsePlaylistJson(content);
      } else {
        imported = ytProvider.parsePlaylistCsv(content);
      }

      if (imported.length === 0) {
        Alert.alert(
          'Format tidak dikenali',
          'Pastikan file CSV memiliki kolom: Title, Artist, Album\natau file JSON dengan format yang didukung.',
        );
        return;
      }

      setTotal(imported.length);
      setStep('matching');

      // Match against Jamendo
      const provider = providerRegistry.get('jamendo');
      if (!provider) {
        setTracks(imported);
        setStep('review');
        return;
      }

      const matched = await ytProvider.matchImportedTracks(
        imported,
        provider,
        (done, total) => setProgress(done),
      );

      setTracks(matched);
      // Pre-select all matched tracks
      setSelected(new Set(
        matched
          .map((t, i) => t.matched ? i : -1)
          .filter(i => i >= 0)
      ));
      setStep('review');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Gagal membaca file');
    }
  }, []);

  const toggleSelect = useCallback((index: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    const toSave = tracks.filter((_, i) => selected.has(i) && _.matchedTrack);
    if (toSave.length === 0) {
      Alert.alert('Tidak ada lagu yang dipilih', 'Pilih minimal satu lagu yang cocok untuk disimpan.');
      return;
    }

    const playlist = await createPlaylist(
      'YouTube Music Import',
      `${toSave.length} lagu diimpor dari YouTube Music`,
    );

    for (const t of toSave) {
      if (t.matchedTrack) {
        await addTrackToPlaylist(playlist.id, t.matchedTrack);
      }
    }

    setStep('done');
  }, [tracks, selected, createPlaylist, addTrackToPlaylist]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, {
        paddingTop: insets.top + 12,
        paddingHorizontal: theme.spacing[4],
        borderBottomColor: theme.colors.separator,
      }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Import Playlist
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: 16, paddingBottom: insets.bottom + 40 }}>

        {/* Step: pick file */}
        {step === 'pick' && (
          <>
            <GlassCard style={{ padding: 20, gap: 12 }}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                📋 Import dari YouTube Music
              </Text>
              <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
                TracMusic dapat mengimpor <Text style={{ fontWeight: '700' }}>metadata</Text> playlist dari YouTube Music. Ini membantu kamu menemukan lagu yang sama di Jamendo.
              </Text>
              <View style={[styles.infoBox, { backgroundColor: theme.colors.accentDim, borderRadius: theme.radius.md }]}>
                <Text style={[styles.infoText, { color: theme.colors.accent }]}>
                  ℹ Format yang didukung:{'\n'}
                  • CSV: Title, Artist, Album{'\n'}
                  • JSON: format YTMusicTakeout atau format kustom{'\n\n'}
                  Cara ekspor: Gunakan aplikasi "YT Music Playlist Exporter" (pihak ketiga) atau ekspor manual ke CSV.
                </Text>
              </View>
            </GlassCard>

            <GlassCard style={{ padding: 20, gap: 10 }}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                ⚠ Penting untuk diketahui
              </Text>
              <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
                • TracMusic TIDAK mengakses akun YouTube Music kamu{'\n'}
                • Tidak ada password Google yang diminta{'\n'}
                • Import hanya membaca file yang kamu pilih{'\n'}
                • Pencocokan lagu adalah perkiraan — selalu review sebelum simpan{'\n'}
                • Lagu yang tidak cocok akan ditandai "Tidak ditemukan"
              </Text>
            </GlassCard>

            <Pressable
              onPress={handlePickFile}
              style={[styles.primaryBtn, { backgroundColor: theme.colors.accent, borderRadius: theme.radius.lg }]}
            >
              <Ionicons name="document-outline" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Pilih File (CSV / JSON)</Text>
            </Pressable>
          </>
        )}

        {/* Step: matching */}
        {step === 'matching' && (
          <GlassCard style={{ padding: 32, alignItems: 'center', gap: 16 }}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Mencocokkan lagu…
            </Text>
            <Text style={[styles.body, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
              {progress} / {total} lagu diproses
            </Text>
            <View style={[styles.progressBg, { backgroundColor: theme.colors.bgTertiary, borderRadius: 4 }]}>
              <View style={[styles.progressFill, {
                width: `${total > 0 ? (progress / total) * 100 : 0}%`,
                backgroundColor: theme.colors.accent,
                borderRadius: 4,
              }]} />
            </View>
            <Text style={[styles.hint, { color: theme.colors.textTertiary, textAlign: 'center' }]}>
              Mencari di Jamendo… Ini mungkin memakan beberapa menit untuk playlist besar.
            </Text>
          </GlassCard>
        )}

        {/* Step: review */}
        {step === 'review' && (
          <>
            <GlassCard style={{ padding: 16, gap: 6 }}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Review Hasil Pencocokan
              </Text>
              <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
                {tracks.filter(t => t.matched).length} dari {tracks.length} lagu ditemukan di Jamendo.
                Centang lagu yang ingin kamu simpan.
              </Text>
            </GlassCard>

            {tracks.map((t, i) => (
              <Pressable
                key={i}
                onPress={() => t.matched && toggleSelect(i)}
                style={[
                  styles.trackRow,
                  {
                    backgroundColor: selected.has(i) ? theme.colors.accentDim : theme.colors.surface,
                    borderColor: selected.has(i) ? theme.colors.accent : theme.colors.border,
                    borderRadius: theme.radius.md,
                    opacity: t.matched ? 1 : 0.5,
                  },
                ]}
              >
                <View style={[
                  styles.checkbox,
                  {
                    borderColor: t.matched ? theme.colors.accent : theme.colors.border,
                    backgroundColor: selected.has(i) ? theme.colors.accent : 'transparent',
                  },
                ]}>
                  {selected.has(i) && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.trackTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <Text style={[styles.trackArtist, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {t.artistName}
                  </Text>
                  {t.matched && t.matchedTrack && (
                    <Text style={[styles.matchLabel, { color: theme.colors.accent }]} numberOfLines={1}>
                      ✓ {t.matchedTrack.title} — {t.matchedTrack.artists[0]?.name}
                    </Text>
                  )}
                  {!t.matched && (
                    <Text style={[styles.matchLabel, { color: theme.colors.textTertiary }]}>
                      Tidak ditemukan di Jamendo
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}

            <Pressable
              onPress={handleSave}
              style={[styles.primaryBtn, {
                backgroundColor: selected.size > 0 ? theme.colors.accent : theme.colors.bgTertiary,
                borderRadius: theme.radius.lg,
              }]}
            >
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>
                Simpan {selected.size} Lagu ke Playlist
              </Text>
            </Pressable>
          </>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <GlassCard style={{ padding: 32, alignItems: 'center', gap: 16 }}>
            <Text style={{ fontSize: 56 }}>✅</Text>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, textAlign: 'center' }]}>
              Playlist berhasil diimpor!
            </Text>
            <Text style={[styles.body, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
              Lagu yang cocok telah disimpan ke playlist "YouTube Music Import" di Koleksi kamu.
            </Text>
            <Pressable
              onPress={() => router.replace('/library')}
              style={[styles.primaryBtn, { backgroundColor: theme.colors.accent, borderRadius: theme.radius.lg, width: '100%' }]}
            >
              <Text style={styles.primaryBtnText}>Lihat di Koleksi →</Text>
            </Pressable>
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle:  { fontSize: 17, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  body:         { fontSize: 14, lineHeight: 22 },
  infoBox:      { padding: 14 },
  infoText:     { fontSize: 13, lineHeight: 20 },
  hint:         { fontSize: 12, lineHeight: 18 },
  primaryBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
  primaryBtnText:{ color: '#fff', fontSize: 16, fontWeight: '700' },
  progressBg:   { height: 6, width: '100%' },
  progressFill: { height: 6 },
  trackRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1 },
  checkbox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  trackTitle:   { fontSize: 14, fontWeight: '600', marginBottom: 1 },
  trackArtist:  { fontSize: 12, marginBottom: 2 },
  matchLabel:   { fontSize: 11 },
});
