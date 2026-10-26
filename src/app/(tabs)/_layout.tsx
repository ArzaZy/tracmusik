import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle, withSpring, useSharedValue, withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { MiniPlayer } from '../../components/ui/MiniPlayer';
import { usePlaybackStore } from '../../services/audio/playbackStore';
import { useTranslation } from 'react-i18next';

const TAB_HEIGHT = 58;

function TabBarBackground() {
  const { theme } = useTheme();
  return (
    <>
      <BlurView intensity={75} tint={theme.isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, {
        backgroundColor: theme.colors.tabBarBg,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.separator,
      }]} />
    </>
  );
}

function TabIcon({ name, color, focused }: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const dotOp = useSharedValue(0);

  React.useEffect(() => {
    scale.value = focused ? withSpring(1.15, { damping: 10, stiffness: 280 }) : withSpring(1, { damping: 14 });
    dotOp.value = focused ? withTiming(1, { duration: 200 }) : withTiming(0, { duration: 150 });
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const dotStyle  = useAnimatedStyle(() => ({ opacity: dotOp.value, transform: [{ scale: dotOp.value }] }));

  return (
    <View style={styles.tabIconWrap}>
      <Animated.View style={iconStyle}>
        <Ionicons name={name} size={24} color={color} />
      </Animated.View>
      <Animated.View style={[styles.activeDot, { backgroundColor: theme.colors.accent }, dotStyle]} />
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();
  const { t }     = useTranslation();
  const insets    = useSafeAreaInsets();
  const hasTrack  = usePlaybackStore(s => !!s.currentTrack);
  const TAB_FULL  = TAB_HEIGHT + insets.bottom;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { position: "absolute", height: TAB_FULL, borderTopWidth: 0, backgroundColor: "transparent", elevation: 0 },
          tabBarBackground: () => <TabBarBackground />,
          tabBarActiveTintColor: theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.textTertiary,
          tabBarShowLabel: false,
          tabBarItemStyle: { paddingTop: 6 },
        }}
      >
        <Tabs.Screen name="index"   options={{ title: t("tabs.home"),     tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? "home" : "home-outline"} color={color} focused={focused} /> }} />
        <Tabs.Screen name="search"  options={{ title: t("tabs.search"),   tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? "search" : "search-outline"} color={color} focused={focused} /> }} />
        <Tabs.Screen name="library" options={{ title: t("tabs.library"),  tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? "library" : "library-outline"} color={color} focused={focused} /> }} />
        <Tabs.Screen name="settings" options={{ title: t("tabs.settings"), tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? "settings" : "settings-outline"} color={color} focused={focused} /> }} />
      </Tabs>
      {hasTrack && (
        <View style={[styles.miniPlayerWrap, { bottom: TAB_FULL }]}>
          <MiniPlayer />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabIconWrap:    { alignItems: "center", gap: 4 },
  activeDot:      { width: 4, height: 4, borderRadius: 2 },
  miniPlayerWrap: { position: "absolute", left: 0, right: 0 },
});
