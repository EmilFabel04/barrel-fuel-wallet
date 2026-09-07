import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

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
        fontFamily: 'Outfit_800ExtraBold',
        fontWeight: weight,
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
