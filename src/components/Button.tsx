import React, { useRef } from 'react';
import { Animated, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';
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
          borderWidth: variant === 'secondary' ? 1 : 0, borderColor: t.border,
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
