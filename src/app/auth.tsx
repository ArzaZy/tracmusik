import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../services/auth/AuthService';
import { CloudSync } from '../services/auth/CloudSync';
import { isSupabaseConfigured } from '../services/supabase';
import { GlassCard } from '../components/ui/GlassCard';

type AuthMode = 'signin' | 'signup';

export default function AuthScreen() {
  const { theme }    = useTheme();
  const router       = useRouter();
  const insets       = useSafeAreaInsets();
  const { signIn, signUp, isLoading, error, clearError } = useAuthStore();

  const [mode,     setMode]     = useState<AuthMode>('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!email.trim() || !password) return;
    clearError();
    if (mode === 'signin') {
      await signIn(email.trim(), password);
    } else {
      await signUp(email.trim(), password);
    }
    const { user } = useAuthStore.getState();
    if (user) {
      CloudSync.setUserId(user.id);
      await CloudSync.fullSync();
      router.replace('/(tabs)');
    }
  }, [mode, email, password, signIn, signUp, clearError, router]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <LinearGradient
          colors={[theme.colors.accentLight, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }}
        />
        <ScrollView
          contentContainerStyle={[styles.content, {
            paddingTop: insets.top + 48,
            paddingBottom: insets.bottom + 32,
          }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.textSecondary} />
          </Pressable>

          {/* Logo area */}
          <View style={styles.logoWrap}>
            <View style={[styles.logoCircle, { backgroundColor: theme.colors.accent }]}>
              <Text style={{ fontSize: 36 }}>🎵</Text>
            </View>
            <Text style={[styles.appName, { color: theme.colors.textPrimary }]}>TracMusic</Text>
          </View>

          {/* Tabs */}
          <View style={[styles.modeTabs, { backgroundColor: theme.colors.bgSecondary, borderRadius: theme.radius.lg }]}>
            {(['signin', 'signup'] as AuthMode[]).map(m => (
              <Pressable
                key={m}
                onPress={() => { setMode(m); clearError(); }}
                style={[
                  styles.modeTab,
                  { borderRadius: theme.radius.md },
                  mode === m && { backgroundColor: theme.colors.accent },
                ]}
              >
                <Text style={[
                  styles.modeTabText,
                  { color: mode === m ? '#fff' : theme.colors.textSecondary },
                ]}>
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Form */}
          <GlassCard style={styles.form}>
            {/* Supabase warning */}
            {!isSupabaseConfigured && (
              <View style={[styles.warnBox, { backgroundColor: theme.colors.accentDim, borderRadius: theme.radius.md }]}>
                <Text style={[styles.warnText, { color: theme.colors.accent }]}>
                  ⚠ Supabase tidak dikonfigurasi.{'\n'}
                  Tambahkan EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY ke file .env untuk mengaktifkan cloud sync.
                </Text>
              </View>
            )}

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Email</Text>
              <View style={[styles.inputWrap, {
                backgroundColor: theme.colors.bgSecondary,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              }]}>
                <Ionicons name="mail-outline" size={18} color={theme.colors.textTertiary} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor={theme.colors.placeholder}
                  style={[styles.input, { color: theme.colors.textPrimary }]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Password</Text>
              <View style={[styles.inputWrap, {
                backgroundColor: theme.colors.bgSecondary,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              }]}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.colors.textTertiary} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Password'}
                  placeholderTextColor={theme.colors.placeholder}
                  style={[styles.input, { color: theme.colors.textPrimary }]}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPass(p => !p)} hitSlop={8}>
                  <Ionicons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={theme.colors.textTertiary}
                  />
                </Pressable>
              </View>
            </View>

            {/* Error */}
            {error && (
              <View style={[styles.errorBox, { backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: theme.radius.sm }]}>
                <Text style={{ color: theme.colors.error, fontSize: 13 }}>⚠ {error}</Text>
              </View>
            )}

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={isLoading || !email || !password}
              style={[
                styles.submitBtn,
                { backgroundColor: theme.colors.accent, borderRadius: theme.radius.lg },
                (isLoading || !email || !password) && { opacity: 0.5 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </Pressable>

            {/* Privacy note */}
            {mode === 'signup' && (
              <Text style={[styles.privacyNote, { color: theme.colors.textTertiary }]}>
                Dengan mendaftar, data kamu disimpan aman di Supabase dengan Row Level Security — hanya kamu yang bisa mengaksesnya.
              </Text>
            )}
          </GlassCard>

          {/* Guest option */}
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.guestBtn}>
            <Text style={[styles.guestText, { color: theme.colors.textSecondary }]}>
              Lanjut sebagai Tamu →
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  content:      { flexGrow: 1, paddingHorizontal: 24 },
  backBtn:      { position: 'absolute', top: 0, left: 24, zIndex: 10, padding: 8 },
  logoWrap:     { alignItems: 'center', marginBottom: 32 },
  logoCircle:   { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  appName:      { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  modeTabs:     { flexDirection: 'row', padding: 4, marginBottom: 20 },
  modeTab:      { flex: 1, paddingVertical: 10, alignItems: 'center' },
  modeTabText:  { fontSize: 15, fontWeight: '600' },
  form:         { padding: 20, gap: 16, marginBottom: 16 },
  warnBox:      { padding: 12 },
  warnText:     { fontSize: 12, lineHeight: 18 },
  fieldWrap:    { gap: 6 },
  fieldLabel:   { fontSize: 13, fontWeight: '500' },
  inputWrap:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10, borderWidth: 1, height: 50 },
  input:        { flex: 1, fontSize: 15 },
  errorBox:     { padding: 10 },
  submitBtn:    { height: 54, justifyContent: 'center', alignItems: 'center' },
  submitText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  privacyNote:  { fontSize: 11, textAlign: 'center', lineHeight: 16 },
  guestBtn:     { alignItems: 'center', padding: 16 },
  guestText:    { fontSize: 15, fontWeight: '500' },
});
