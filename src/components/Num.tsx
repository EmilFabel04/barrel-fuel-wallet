import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

// @expo-google-fonts/figtree loads each weight as its own font family — RN
// does not synthesize weights for custom fonts. `fontWeight` against a fixed
// family is a no-op (and can silently fall back to the system font on iOS),
// so the weight must select a family instead. These five are exactly the
// ones app/_layout.tsx loads; do not add a sixth here.
//
// Figtree replaced Outfit for its smoother, more geometric letterforms. The
// swap was 1:1 — Figtree ships the same five weights under the same naming —
// but it was NOT interchangeable on numerals: DM Sans, the first choice, has
// no `tnum` OpenType feature at all, which would have made the
// `fontVariant: ['tabular-nums']` below a silent no-op and set every hero
// jittering as its digits changed width. Figtree has tnum. Verify before
// swapping this family again.
const FAMILY: Record<string, string> = {
  '400': 'Figtree_400Regular',
  '500': 'Figtree_500Medium',
  '600': 'Figtree_600SemiBold',
  '700': 'Figtree_700Bold',
  '800': 'Figtree_800ExtraBold',
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
        fontFamily: FAMILY[String(weight)] ?? 'Figtree_800ExtraBold',
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
