import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, ThemeMode } from '../../theme/ThemeContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { useTranslation } from 'react-i18next';
import i18n from '../../localization';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../services/auth/AuthService';

const ACCENT_PRESETS = [
  '#7035E0', // TracMusic purple (default)
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#8B5CF6', // Violet
];

export default function SettingsScreen() {
  const { theme, mode, accentColor, setMode, setAccentColor } = useTheme();
  const { t }     = useTranslation();
  const insets    = useSafeAreaInsets();
  const router    = useRouter();
  const [lang, setLangState] = useState(i18n.language);
  const { user, isGuest, signOut, deleteAccount } = useAuthStore();

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Sign out of TracMusic?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', onPress: () => signOut() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Ini akan menghapus semua data cloud kamu secara permanen. Data lokal di HP tetap ada.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAccount() },
      ],
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      t('settings.clearCache'),
      'This will clear recently played and cached metadata. Your playlists and liked songs will be kept.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.clearCache'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              '@tracmusic/recently_played',
            ]);
            Alert.alert('Done', 'Cache cleared.');
          },
        },
      ],
    );
  };

  const toggleLanguage = () => {
    const newLang = lang === 'id' ? 'en' : 'id';
    i18n.changeLanguage(newLang);
    setLangState(newLang);
  };

  const themeModes: { label: string; value: ThemeMode }[] = [
    { label: t('settings.themeSystem'), value: 'system' },
    { label: t('settings.themeLight'),  value: 'light' },
    { label: t('settings.themeDark'),   value: 'dark' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingHorizontal: theme.spacing[5] }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {t('settings.title')}
        </Text>
      </View>

      <View style={{ paddingHorizontal: theme.spacing[4], gap: 16 }}>

        {/* Appearance */}
        <SettingGroup title={t('settings.appearance')} theme={theme}>

          {/* Theme mode */}
          <View style={styles.themeRow}>
            {themeModes.map(({ label, value }) => (
              <Pressable
                key={value}
                onPress={() => setMode(value)}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: mode === value ? theme.colors.accent : theme.colors.bgSecondary,
                    borderColor: theme.colors.border,
                    borderWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <Text style={[
                  styles.themeBtnLabel,
                  { color: mode === value ? '#fff' : theme.colors.textSecondary },
                ]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Accent color */}
          <View style={[styles.row, { marginTop: 4 }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              {t('settings.accentColor')}
            </Text>
          </View>
          <View style={styles.colorGrid}>
            {ACCENT_PRESETS.map(color => (
              <Pressable
                key={color}
                onPress={() => setAccentColor(color)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  accentColor === color && styles.colorSwatchActive,
                ]}
              >
                {accentColor === color && (
                  <Text style={styles.colorCheck}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </SettingGroup>

        {/* Language */}
        <SettingGroup title={t('settings.language')} theme={theme}>
          <SettingRow theme={theme}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
              {lang === 'id' ? '🇮🇩 Bahasa Indonesia' : '🇬🇧 English'}
            </Text>
            <Pressable
              onPress={toggleLanguage}
              style={[styles.langBtn, { backgroundColor: theme.colors.accentLight }]}
            >
              <Text style={[styles.langBtnText, { color: theme.colors.accent }]}>
                {lang === 'id' ? 'Switch to EN' : 'Ganti ke ID'}
              </Text>
            </Pressable>
          </SettingRow>
        </SettingGroup>

        {/* Cache */}
        <SettingGroup title={t('settings.cache')} theme={theme}>
          <Pressable
            onPress={handleClearCache}
            style={styles.dangerRow}
          >
            <Text style={{ color: theme.colors.error, fontWeight: '600', fontSize: 15 }}>
              🗑 {t('settings.clearCache')}
            </Text>
          </Pressable>
          <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>
            Clears recently played history and cached metadata.{'\n'}
            Liked songs, playlists, and preferences are kept.
          </Text>
        </SettingGroup>

        {/* Music Sources */}
        <SettingGroup title="Music Sources" theme={theme}>
          <View style={{ padding: 4 }}>
            <SourceItem
              name="Jamendo"
              description="CC-licensed music from independent artists. Full streaming permitted."
              status="✅ Active"
              link="jamendo.com"
              theme={theme}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.separator }]} />
            <SourceItem
              name="YouTube Music"
              description="External links only. TracMusic opens tracks in YouTube Music. No audio extraction."
              status="🔗 Links only"
              link=""
              theme={theme}
            />
          </View>
        </SettingGroup>

        {/* Account */}
        <SettingGroup title={t('settings.account')} theme={theme}>
          {isGuest ? (
            <View style={{ gap: 8 }}>
              <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
                Kamu sedang menggunakan TracMusic sebagai tamu.{'\n'}
                Masuk untuk menyinkronkan playlist dan lagu favorit ke cloud.
              </Text>
              <Pressable
                onPress={() => router.push('/auth')}
                style={[styles.accentBtn, { backgroundColor: theme.colors.accent, borderRadius: theme.radius.md }]}
              >
                <Text style={styles.accentBtnText}>{t('settings.signIn')} / Daftar</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <View style={styles.accountRow}>
                <View style={[styles.avatarCircle, { backgroundColor: theme.colors.accentLight }]}>
                  <Text style={{ fontSize: 22 }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
                    {user?.email ?? 'User'}
                  </Text>
                  <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>
                    Akun tersinkronisasi ☁
                  </Text>
                </View>
              </View>
              <Pressable onPress={handleSignOut} style={[styles.dangerRow, { paddingVertical: 10 }]}>
                <Text style={{ color: theme.colors.error, fontWeight: '600', fontSize: 15 }}>
                  🚪 {t('settings.signOut')}
                </Text>
              </Pressable>
              <Pressable onPress={handleDeleteAccount}>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>
                  {t('settings.deleteAccount')}
                </Text>
              </Pressable>
            </View>
          )}
        </SettingGroup>

        {/* Privacy */}
        <SettingGroup title={t('settings.privacy')} theme={theme}>
          <Text style={[styles.hint, { color: theme.colors.textSecondary, lineHeight: 20 }]}>
            <Text style={{ fontWeight: '600', color: theme.colors.textPrimary }}>Stored locally on your device:{'\n'}</Text>
            Liked songs, playlists, recently played, and preferences.{'\n\n'}
            <Text style={{ fontWeight: '600', color: theme.colors.textPrimary }}>Never collected:{'\n'}</Text>
            Location, contacts, microphone, camera, or Google credentials.{'\n\n'}
            <Text style={{ fontWeight: '600', color: theme.colors.textPrimary }}>Supabase (optional, only when signed in):{'\n'}</Text>
            Cloud playlists and favorites. Protected with Row Level Security — only you can access your data.
          </Text>
        </SettingGroup>

        {/* About */}
        <SettingGroup title="About" theme={theme}>
          <View style={styles.aboutBlock}>
            <Text style={[styles.appNameBig, { color: theme.colors.textPrimary }]}>TracMusic</Text>
            <Text style={[styles.versionText, { color: theme.colors.textTertiary }]}>
              {t('settings.version', { version })}
            </Text>
            <Text style={[styles.hint, { color: theme.colors.textSecondary, marginTop: 8 }]}>
              Built with React Native & Expo.{'\n'}
              Music powered by Jamendo API.{'\n'}
              CC-licensed music — attribution required per artist license.
            </Text>
          </View>
        </SettingGroup>

      </View>
    </ScrollView>
  );
}

// ---- Helpers ----
function SettingGroup({
  title, children, theme,
}: {
  title: string; children: React.ReactNode; theme: any;
}) {
  return (
    <View>
      <Text style={[styles.groupTitle, { color: theme.colors.textTertiary }]}>
        {title.toUpperCase()}
      </Text>
      <GlassCard style={{ padding: 16, gap: 8 }}>
        {children}
      </GlassCard>
    </View>
  );
}

function SettingRow({ children, theme }: { children: React.ReactNode; theme: any }) {
  return (
    <View style={styles.settingRow}>
      {children}
    </View>
  );
}

function SourceItem({
  name, description, status, theme,
}: { name: string; description: string; status: string; link: string; theme: any }) {
  return (
    <View style={{ paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={[styles.sourceName, { color: theme.colors.textPrimary }]}>{name}</Text>
        <Text style={[styles.sourceStatus, { color: theme.colors.textSecondary }]}>{status}</Text>
      </View>
      <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header:         { marginBottom: 20 },
  title:          { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  groupTitle:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6, marginLeft: 4 },
  themeRow:       { flexDirection: 'row', gap: 8, marginBottom: 8 },
  themeBtn:       { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  themeBtnLabel:  { fontSize: 13, fontWeight: '600' },
  colorGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  colorSwatch:    { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  colorSwatchActive: { transform: [{ scale: 1.15 }], shadowColor: '#000', shadowRadius: 6, shadowOpacity: 0.3, elevation: 4 },
  colorCheck:     { color: '#fff', fontSize: 16, fontWeight: '800' },
  row:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:          { fontSize: 15, fontWeight: '500' },
  langBtn:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  langBtnText:    { fontSize: 13, fontWeight: '600' },
  settingRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  dangerRow:      { paddingVertical: 8 },
  hint:           { fontSize: 12, lineHeight: 18 },
  divider:        { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  sourceName:     { fontSize: 14, fontWeight: '700' },
  sourceStatus:   { fontSize: 12 },
  accentBtn:      { padding: 14, alignItems: 'center' },
  accentBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  accountRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle:   { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  aboutBlock:     { alignItems: 'center', padding: 8 },
  appNameBig:     { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  versionText:    { fontSize: 13, marginTop: 4 },
});
