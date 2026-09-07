import React from 'react';
import { Platform, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { TabIcon, TabName } from '../../src/components/TabIcon';

const TABS: { name: string; label: string; icon: TabName }[] = [
  { name: 'index',    label: 'Wallet',   icon: 'wallet' },
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
      {TABS.map(({ name, label, icon }) => {
        // Card is the one tab that acts in the physical world, so it alone
        // takes the accent colour when active; the rest take plain text.
        // Spec §5 gave it the centre position of five as well, but with the
        // Stations tab removed there is no centre of four — so the accent
        // carries that emphasis on its own, and Card sits second, grouping
        // the two tabs you use the product with ahead of the two you review
        // it with.
        const tint = (focused: boolean) =>
          focused ? (name === 'card' ? t.accent : t.text) : t.textMuted;
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              tabBarAccessibilityLabel: label,
              tabBarLabel: ({ focused }) => (
                <Text style={{
                  fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
                  fontSize: 9, letterSpacing: 0.9, textTransform: 'uppercase',
                  color: tint(focused),
                }}>{label}</Text>
              ),
              tabBarIcon: ({ focused }) => (
                <TabIcon name={icon} color={tint(focused)} />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
