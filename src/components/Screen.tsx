import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

export function Screen({ children, scroll = false }: { children: React.ReactNode; scroll?: boolean }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Body style={{ flex: 1, paddingHorizontal: 26 }}>{children}</Body>
    </View>
  );
}
