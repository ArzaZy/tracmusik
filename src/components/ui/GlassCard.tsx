import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
  noBorder?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity = 40,
  borderRadius,
  noBorder = false,
}: GlassCardProps) {
  const { theme } = useTheme();
  const r = borderRadius ?? theme.radius.lg;

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderRadius: r,
          borderColor: noBorder ? 'transparent' : theme.colors.border,
          borderWidth: noBorder ? 0 : StyleSheet.hairlineWidth,
        },
        theme.shadow.sm,
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={theme.isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: r }]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: r,
            backgroundColor: theme.isDark
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(255,255,255,0.55)',
          },
        ]}
      />
      <View style={{ borderRadius: r, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
});
