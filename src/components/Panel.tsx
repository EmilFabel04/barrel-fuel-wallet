import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { SectionLabel } from './SectionLabel';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/tokens';
import { MOTION } from '../theme/motion';

/**
 * A bordered instrument block. Panels are defined by their border and fill,
 * never a shadow — elevation is absent in dark mode by design, so a
 * shadow-defined surface would exist in only one of the two themes.
 */
export function Panel({
  label, children, onPress, tone = 'plain', style,
}: {
  label?: string;
  children: React.ReactNode;
  onPress?: () => void;
  /** `accent` draws the eye to a panel making a claim rather than stating a fact. */
  tone?: 'plain' | 'accent';
  style?: ViewStyle;
}) {
  const t = useTheme();
  const base: ViewStyle = {
    borderWidth: 1,
    borderColor: tone === 'accent' ? t.accent : t.border,
    backgroundColor: t.bgRaised,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 15,
    gap: 10,
  };

  if (!onPress) {
    return (
      <View style={[base, style]}>
        {label ? <SectionLabel>{label}</SectionLabel> : null}
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      // Dim only. A panel that scales under the thumb reads as a button; it is
      // a tappable region, and the distinction is worth keeping.
      style={({ pressed }) => [base, { opacity: pressed ? MOTION.surfaceOpacity : 1 }, style]}
    >
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      {children}
    </Pressable>
  );
}
