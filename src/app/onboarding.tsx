import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/ui/GlassCard';
import { useTranslation } from 'react-i18next';

const ONBOARDING_KEY = '@tracmusic/onboarding_done';

export async function isOnboardingDone(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === 'true';
  } catch { return false; }
}

export default function OnboardingScreen() {
  const { theme, setMode } = useTheme();
  const { t }              = useTranslation();
  const insets             = useSafeAreaInsets();
  const router             = useRouter();
  const [step, setStep]    = useState(0);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  const steps = [
    {
      emoji: '🎵',
      title: t('onboarding.welcome'),
      body:  t('onboarding.subtitle'),
    },
    {
      emoji: '📚',
      title: t('onboarding.musicSources'),
      body:  t('onboarding.sourcesDescription'),
    },
    {
      emoji: '🔒',
      title: t('onboarding.permissions'),
      body:  t('onboarding.permissionsDescription'),
    },
  ];

  const currentStep = steps[step];
  const isLast      = step === steps.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <LinearGradient
        colors={[theme.colors.accentLight, theme.colors.bg]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* Emoji */}
        <View style={[styles.emojiWrap, { backgroundColor: theme.colors.accentDim }]}>
          <Text style={styles.emoji}>{currentStep.emoji}</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {currentStep.title}
        </Text>

        {/* Body */}
        <GlassCard style={styles.bodyCard}>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
            {currentStep.body}
          </Text>
        </GlassCard>

        {/* Theme picker on last step */}
        {isLast && (
          <View style={styles.themeRow}>
            <Text style={[styles.themeLabel, { color: theme.colors.textSecondary }]}>
              Choose theme:
            </Text>
            {(['system', 'light', 'dark'] as const).map(m => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[styles.themeBtnText, { color: theme.colors.textPrimary }]}>
                  {{ system: '🌗 System', light: '☀️ Light', dark: '🌙 Dark' }[m]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Dots */}
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === step ? theme.colors.accent : theme.colors.bgTertiary,
                  width: i === step ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Actions */}
        {isLast ? (
          <View style={styles.actions}>
            <Pressable
              onPress={completeOnboarding}
              style={[styles.primaryBtn, { backgroundColor: theme.colors.accent }]}
            >
              <Text style={styles.primaryBtnText}>{t('onboarding.continueGuest')}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setStep(s => s + 1)}
            style={[styles.primaryBtn, { backgroundColor: theme.colors.accent }]}
          >
            <Text style={styles.primaryBtnText}>Next →</Text>
          </Pressable>
        )}

        {/* Skip */}
        <Pressable onPress={completeOnboarding} style={{ marginTop: 16 }}>
          <Text style={[styles.skipText, { color: theme.colors.textTertiary }]}>
            Skip
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content:    { alignItems: 'center', paddingHorizontal: 28, flexGrow: 1, justifyContent: 'center' },
  emojiWrap:  { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emoji:      { fontSize: 52 },
  title:      { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 20, letterSpacing: -0.4 },
  bodyCard:   { padding: 20, marginBottom: 24, width: '100%' },
  body:       { fontSize: 15, lineHeight: 24, textAlign: 'center' },
  themeRow:   { alignItems: 'center', gap: 10, marginBottom: 24 },
  themeLabel: { fontSize: 14, fontWeight: '500' },
  themeBtn:   { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  themeBtnText:{ fontSize: 14, fontWeight: '600' },
  dots:       { flexDirection: 'row', gap: 8, marginBottom: 28, alignItems: 'center' },
  dot:        { height: 8, borderRadius: 4 },
  actions:    { gap: 12, width: '100%' },
  primaryBtn: { width: '100%', height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText:{ color: '#fff', fontSize: 17, fontWeight: '700' },
  skipText:   { fontSize: 14 },
});
