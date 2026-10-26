import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SpringButton } from './SpringButton';
import { useTheme } from '../../theme/ThemeContext';

interface EmptyStateProps {
  emoji:       string;
  title:       string;
  subtitle?:   string;
  actionLabel?: string;
  onAction?:   () => void;
}

export function EmptyState({
  emoji, title, subtitle, actionLabel, onAction,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      )}
      {actionLabel && onAction && (
        <SpringButton
          onPress={onAction}
          style={[styles.btn, { backgroundColor: theme.colors.accent }]}
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.btnText}>{actionLabel}</Text>
        </SpringButton>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emoji:     { fontSize: 52, marginBottom: 16 },
  title:     { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle:  { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24, maxWidth: 260 },
  btn:       { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
});
