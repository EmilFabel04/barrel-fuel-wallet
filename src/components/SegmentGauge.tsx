import React from 'react';
import { Pressable, View } from 'react-native';
import { LotBand } from '../lib/holdings';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/tokens';
import { MOTION } from '../theme/motion';

/** Below this share a segment would be a hairline; give it a visible floor. */
const MIN_SHARE = 0.04;

/**
 * The balance, split by expiry.
 *
 * Deliberately not a "weeks of driving" gauge. Against a laddered wallet that
 * reads almost full and undercuts the very action the screen is asking for,
 * while saying nothing about the resource that is actually scarce: time on the
 * oldest litres. This shows quantity and urgency in one strip, and needs no
 * arbitrary maximum to scale against.
 */
export function SegmentGauge({
  bands, urgentDays = 30, height = 12, onPress, accessibilityLabel,
}: {
  bands: LotBand[];
  urgentDays?: number;
  height?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const t = useTheme();

  const body = (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {bands.length === 0 ? (
        <View
          testID="gauge-empty"
          style={{ flex: 1, height, borderRadius: RADIUS.xs, backgroundColor: t.border }}
        />
      ) : bands.map(b => (
        <View
          key={b.id}
          testID={`gauge-segment-${b.id}`}
          accessibilityLabel={
            b.daysLeft <= urgentDays
              ? `${b.litres} litres, expires in ${b.daysLeft} days`
              : `${b.litres} litres`
          }
          style={{
            flexGrow: Math.max(b.share, MIN_SHARE),
            flexBasis: 0,
            height,
            borderRadius: RADIUS.xs,
            backgroundColor: b.daysLeft <= urgentDays ? t.accent : t.border,
          }}
        />
      ))}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      // Enlarge the target without changing the layout: the strip itself is
      // 12pt tall, well under the 44pt minimum.
      hitSlop={{ top: 16, bottom: 16, left: 0, right: 0 }}
      style={({ pressed }) => ({ opacity: pressed ? MOTION.surfaceOpacity : 1 })}
    >
      {body}
    </Pressable>
  );
}
