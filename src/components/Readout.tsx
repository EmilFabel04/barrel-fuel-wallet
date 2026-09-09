import React, { useEffect, useRef } from 'react';
import { Animated, Text, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { MOTION } from '../theme/motion';

// Each weight is a separate family — RN does not synthesize weights for custom
// fonts, and `fontWeight` against a fixed family is a silent no-op that can
// fall back to the system font on iOS. These four are exactly the ones
// app/_layout.tsx loads; do not add a fifth here without loading it there.
//
// JetBrains Mono replaced Figtree for numerals because a pump readout is
// monospaced — and because monospaced digits CANNOT change width, which
// retires the `fontVariant: ['tabular-nums']` dependency entirely. That
// dependency is what disqualified DM Sans; it no longer constrains anything.
const FAMILY: Record<string, string> = {
  '400': 'JetBrainsMono_400Regular',
  '500': 'JetBrainsMono_500Medium',
  '700': 'JetBrainsMono_700Bold',
  '800': 'JetBrainsMono_800ExtraBold',
};

export function Readout({
  children, size, color, weight = '800', style, roll = false,
}: {
  children: React.ReactNode;
  size: number;
  color?: string;
  weight?: '400' | '500' | '700' | '800';
  style?: TextStyle;
  /** Roll on change, like an odometer. For heroes that move under the user. */
  roll?: boolean;
}) {
  const t = useTheme();
  const shift = useRef(new Animated.Value(0)).current;
  const key = typeof children === 'string' || typeof children === 'number' ? String(children) : '';
  const previous = useRef(key);

  useEffect(() => {
    if (!roll || key === previous.current) return;
    previous.current = key;
    // Only transform and opacity, so the roll stays on the native driver and
    // never lands on the JS thread while a list is scrolling.
    shift.setValue(1);
    Animated.timing(shift, {
      toValue: 0, duration: MOTION.readout, useNativeDriver: true,
    }).start();
  }, [key, roll, shift]);

  const body = (
    <Text
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      style={[{
        fontFamily: FAMILY[String(weight)] ?? FAMILY['800'],
        fontSize: size,
        color: color ?? t.text,
        letterSpacing: -0.045 * size,
      }, style]}
    >
      {children}
    </Text>
  );

  if (!roll) return body;

  return (
    <Animated.View style={{
      opacity: shift.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
      transform: [{
        translateY: shift.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.22] }),
      }],
    }}>
      {body}
    </Animated.View>
  );
}
