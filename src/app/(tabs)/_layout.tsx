import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
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
      <BlurView
        intensity={70}
        tint={theme.isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme.colors.tabBarBg,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.colors.border,
          },
        ]}
      />
    </>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();
  const { t }     = useTranslation();
  const insets    = useSafeAreaInsets();
  const hasTrack  = usePlaybackStore(s => !!s.currentTrack);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            height: TAB_HEIGHT + insets.bottom,
            borderTopWidth: 0,
            backgroundColor: 'transparent',
            elevation: 0,
          },
          tabBarBackground: () => <TabBarBackground />,
          tabBarActiveTintColor:   theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.textTertiary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginBottom: Platform.OS === 'ios' ? 0 : 4,
          },
          tabBarItemStyle: {
            paddingTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'home' : 'home-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: t('tabs.search'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'search' : 'search-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: t('tabs.library'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'library' : 'library-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabs.settings'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Mini player floats above the tab bar */}
      {hasTrack && (
        <View
          style={[
            styles.miniPlayerWrap,
            { bottom: TAB_HEIGHT + insets.bottom },
          ]}
        >
          <MiniPlayer />
        </View>
      )}
    </View>
  );
}

function TabIcon({
  name,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Ionicons name={name} size={24} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  miniPlayerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
