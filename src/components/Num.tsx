import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

// @expo-google-fonts/outfit loads each weight as its own font family — RN
// does not synthesize weights for custom fonts. `fontWeight` against a fixed
// family is a no-op (and can silently fall back to the system font on iOS),
// so the weight must select a family instead. These five are exactly the
// ones Task 10 loads; do not add a sixth here.
const FAMILY: Record<string, string> = {
  '400': 'Outfit_400Regular',
  '500': 'Outfit_500Medium',
  '600': 'Outfit_600SemiBold',
  '700': 'Outfit_700Bold',
  '800': 'Outfit_800ExtraBold',
};

export function Num({
  children, size, color, weight = '800', style,
}: {
  children: React.ReactNode;
  size: number;
  color?: string;
  weight?: TextStyle['fontWeight'];
  style?: TextStyle;
}) {
  const t = useTheme();
  return (
    <Text
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      style={[{
        fontFamily: FAMILY[String(weight)] ?? 'Outfit_800ExtraBold',
        fontSize: size,
        color: color ?? t.text,
        fontVariant: ['tabular-nums'],
        letterSpacing: -0.045 * size,
      }, style]}
    >
      {children}
    </Text>
  );
}
