import React, { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { DARK, RADIUS } from '../theme/tokens';
import { MOTION } from '../theme/motion';

const TRACK_W = 44;
const TRACK_H = 26;
const PAD = 3;
const KNOB = 20;
// Derived, not typed in: the knob travels the track's width less its own width
// and both insets. Retuning any of the four above cannot desync the animation.
const TRAVEL = TRACK_W - KNOB - PAD * 2;

export function Toggle({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  const t = useTheme();

  // The knob used to jump between `alignItems: flex-start` and `flex-end`,
  // which is a layout change and cannot be animated. Driving translateX
  // instead lets it slide on the native driver.
  const slide = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(slide, {
      toValue: on ? 1 : 0,
      duration: MOTION.toggle,
      useNativeDriver: true,
    }).start();
  }, [on, slide]);

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
        width: TRACK_W, height: TRACK_H, padding: PAD, justifyContent: 'center',
        borderRadius: RADIUS.pill,
        // Switched rather than animated: `backgroundColor` cannot run on the
        // native driver, so animating it would move every toggle press onto
        // the JS thread to smooth a change the sliding knob already sells.
        backgroundColor: on ? t.positive : t.border,
      }}
    >
      {/* spec §3.1: `inverse` is text-on-accent/white — #FFFFFF in light mode,
          which on this lime track is 1.30:1 and nearly invisible. The knob
          needs a dark fill against the lime track in both themes, so it's
          pinned to DARK.bg rather than themed. */}
      <Animated.View style={{
        width: KNOB, height: KNOB, borderRadius: RADIUS.pill,
        backgroundColor: on ? DARK.bg : t.textMuted,
        transform: [{
          translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] }),
        }],
      }} />
    </Pressable>
  );
}
