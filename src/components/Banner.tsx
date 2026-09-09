import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/tokens';
import { MOTION } from '../theme/motion';

/**
 * The arriving-fill notification. Renders nothing until there is something to
 * announce, so it can be mounted unconditionally above the stack.
 */
export function Banner({
  title, detail, onPress, onDismiss,
}: {
  title: string | null;
  detail: string;
  onPress: () => void;
  onDismiss: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const drop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!title) return;
    drop.setValue(0);
    Animated.timing(drop, {
      toValue: 1, duration: MOTION.banner, useNativeDriver: true,
    }).start();
    // Auto-dismiss: a banner that waits forever becomes furniture.
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [title, drop, onDismiss]);

  if (!title) return null;

  return (
    <Animated.View style={{
      position: 'absolute', top: insets.top + 8, left: 14, right: 14,
      opacity: drop,
      transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
    }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Fill recorded. ${title}, ${detail}. View the fill.`}
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: t.accent, borderRadius: RADIUS.md,
          paddingVertical: 13, paddingHorizontal: 15,
          opacity: pressed ? MOTION.pressOpacity : 1,
        })}
      >
        <Text style={{
          fontFamily: 'JetBrainsMono_700Bold', fontSize: 9,
          letterSpacing: 1.4, color: t.inverse,
        }}>FILL RECORDED</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
          <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 14, color: t.inverse }}>{title}</Text>
          <Text style={{ fontFamily: 'JetBrainsMono_800ExtraBold', fontSize: 14, color: t.inverse }}>{detail}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
