import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function Toggle({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={onPress}
      // The track is 44x26 to match the design's switch proportions; hitSlop
      // pads the vertical hit area out to the 44x44 minimum touch target.
      hitSlop={{ top: 9, bottom: 9 }}
      style={{
        width: 44, height: 26, padding: 3, justifyContent: 'center',
        alignItems: on ? 'flex-end' : 'flex-start',
        backgroundColor: on ? t.positive : t.border,
      }}
    >
      <View style={{ width: 20, height: 20, backgroundColor: on ? t.inverse : t.textMuted }} />
    </Pressable>
  );
}
