import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

export function Screen({
  children,
  scroll = false,
  insetBottom = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  /**
   * Pushed screens sit directly on the safe area and need the bottom inset.
   * Tab screens do not — the tab bar already clears it, and padding twice
   * leaves visible dead space the design does not have.
   */
  insetBottom?: boolean;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, paddingBottom: insetBottom ? insets.bottom : 0 }}>
      <Body style={{ flex: 1, paddingHorizontal: 26 }}>{children}</Body>
    </View>
  );
}
