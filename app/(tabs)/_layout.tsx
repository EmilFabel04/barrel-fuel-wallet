import React from 'react';
import { Platform, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { TabIcon, TabName } from '../../src/components/TabIcon';

const TABS: { name: string; label: string; icon: TabName }[] = [
  { name: 'index',    label: 'Wallet',   icon: 'wallet' },
  { name: 'stations', label: 'Stations', icon: 'stations' },
  { name: 'card',     label: 'Card',     icon: 'card' },
  { name: 'savings',  label: 'Savings',  icon: 'savings' },
  { name: 'settings', label: 'Settings', icon: 'settings' },
];

export default function TabsLayout() {
  const t = useTheme();
  // The bottom-tabs implementation always adds `insets.bottom` as its own
  // paddingBottom on top of whatever height we give it (it does this even
  // when the height is a fixed number, not just its own default). A
  // hardcoded platform fudge factor here would stack with that real inset
  // instead of matching it, so we read the actual device inset and let 56pt
  // be the constant content height regardless of device.
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.bg, borderTopWidth: 1, borderTopColor: t.hairline,
          height: 56 + insets.bottom, elevation: 0,
        },
      }}
    >
      {TABS.map(({ name, label, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarAccessibilityLabel: label,
            tabBarLabel: ({ focused }) => (
              <Text style={{
                fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
                fontSize: 9, letterSpacing: 0.9, textTransform: 'uppercase',
                color: focused ? (name === 'card' ? t.accent : t.text) : t.textMuted,
              }}>{label}</Text>
            ),
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name={icon}
                color={focused ? (name === 'card' ? t.accent : t.text) : t.textMuted}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
