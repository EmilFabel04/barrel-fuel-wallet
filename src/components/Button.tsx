import React from 'react';
import { Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'white';

export function Button({
  label, onPress, variant = 'primary', disabled = false, height = 58, flex,
}: {
  label: string; onPress?: () => void; variant?: Variant;
  disabled?: boolean; height?: number; flex?: number;
}) {
  const t = useTheme();
  const bg = disabled ? t.surface
    : variant === 'primary' ? t.accent
    : variant === 'white' ? t.text
    : t.bg;
  const fg = disabled ? t.textMuted
    : variant === 'secondary' ? t.text
    : t.inverse;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => { Haptics.selectionAsync(); onPress?.(); }}
      style={{
        height, flex, borderRadius: 3, backgroundColor: bg,
        borderWidth: variant === 'secondary' ? 1 : 0, borderColor: t.border,
        alignItems: 'center', justifyContent: 'center',
        minHeight: 44, minWidth: 44,
      }}
    >
      <Text style={{
        fontFamily: 'Outfit_800ExtraBold', fontSize: 15,
        letterSpacing: 0.45, color: fg,
      }}>{label}</Text>
    </Pressable>
  );
}
