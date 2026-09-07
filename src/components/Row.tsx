import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Rule } from './Rule';

export function Row({
  label, value, onPress, right,
}: {
  label: string; value?: string; onPress?: () => void; right?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={value ? `${label}, ${value}` : label}
        onPress={onPress}
        // Only a row that navigates gets a pressed state; a static row would
        // otherwise light up under a stray touch and imply it does something.
        // Negative margin + padding keeps the tint bleeding to the screen edge
        // rather than stopping at the 26px gutter, so it reads as the row
        // highlighting rather than a floating band.
        style={({ pressed }) => ({
          flexDirection: 'row', justifyContent: 'space-between',
          alignItems: 'center', paddingVertical: 17, minHeight: 44, gap: 16,
          marginHorizontal: -26, paddingHorizontal: 26,
          backgroundColor: pressed && onPress ? t.surface : 'transparent',
        })}
      >
        <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 14, color: t.text }}>{label}</Text>
        {right ?? (value ? (
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textMuted }}>{value}</Text>
        ) : null)}
      </Pressable>
      <Rule />
    </View>
  );
}
