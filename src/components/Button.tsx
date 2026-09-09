import React, { useRef } from 'react';
import { Animated, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, useIsLight } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/tokens';
import { MOTION } from '../theme/motion';

type Variant = 'primary' | 'secondary' | 'white';

export function Button({
  label, onPress, variant = 'primary', disabled = false, height = 58, flex,
}: {
  label: string; onPress?: () => void; variant?: Variant;
  disabled?: boolean; height?: number; flex?: number;
}) {
  const t = useTheme();
  // The ONE component that legitimately needs this hook. Everything else in
  // the system expresses a theme difference as a token pair, but the
  // requirement below is about a luminance RELATIONSHIP between two tokens
  // rather than about a colour, so no pair can carry it.
  const isLight = useIsLight();

  // The button had haptics but no visual response at all — it fired a tap you
  // could feel and not see. Scale and opacity are the two properties the
  // native driver can animate, so the press never touches the JS thread and
  // stays smooth while a screen is bundling or a list is scrolling.
  const press = useRef(new Animated.Value(0)).current;
  const animate = (to: number, duration: number) =>
    Animated.timing(press, { toValue: to, duration, useNativeDriver: true }).start();

  const bg = disabled ? t.surface
    : variant === 'primary' ? t.accent
    : variant === 'white' ? t.text
    : t.bg;
  const fg = disabled ? t.textMuted
    : variant === 'secondary' ? t.text
    : t.inverse;

  // The amber button's edge is undefined in light mode: neither amber value
  // reaches 3:1 against white, so fill and ground are too close to separate.
  // An ink border defines it, and reads as deliberate in this language.
  //
  // Only `primary` needs it. `white` is ink-on-white at 21:1 in light mode and
  // paper-on-black in dark, so its edge is never in doubt; dark mode's amber
  // is far brighter than its ground. A border in any of those cases would draw
  // a line around nothing, or around itself.
  const needsEdge = !disabled && variant === 'primary' && isLight;

  return (
    <Animated.View style={{
      flex,
      transform: [{
        scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, MOTION.pressScale] }),
      }],
      opacity: press.interpolate({ inputRange: [0, 1], outputRange: [1, MOTION.pressOpacity] }),
    }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        // A disabled button must not animate — it would imply the press landed.
        onPressIn={() => !disabled && animate(1, MOTION.pressIn)}
        onPressOut={() => !disabled && animate(0, MOTION.pressOut)}
        onPress={() => { Haptics.selectionAsync(); onPress?.(); }}
        style={{
          height, borderRadius: RADIUS.md, backgroundColor: bg,
          borderWidth: variant === 'secondary' || needsEdge ? 1 : 0,
          borderColor: variant === 'secondary' ? t.border : t.text,
          alignItems: 'center', justifyContent: 'center',
          minHeight: 44, minWidth: 44,
        }}
      >
        <Text style={{
          fontFamily: 'Figtree_800ExtraBold', fontSize: 15,
          letterSpacing: 0.45, color: fg,
        }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
