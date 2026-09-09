import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/tokens';

export function Chip({
  label, selected, onPress,
}: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 34, justifyContent: 'center',
        paddingHorizontal: 12, borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: selected ? t.accent : t.border,
        // Selected takes the amber fill with inverse ink on it, which is how
        // amber stays legible in light mode.
        backgroundColor: selected ? t.accent : 'transparent',
      }}
    >
      <Text style={{
        fontFamily: 'JetBrainsMono_700Bold', fontSize: 10, letterSpacing: 1.1,
        color: selected ? t.inverse : t.textMuted,
      }}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}
