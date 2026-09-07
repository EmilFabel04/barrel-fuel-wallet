import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

export function BarrelMark({ size = 17, color }: { size?: number; color?: string }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fillRule="evenodd"
        fill={color ?? t.text}
        d="M0 0h24v24H0V0zm12 5.4c-3.1 3.7-4.7 6.2-4.7 8.3a4.7 4.7 0 0 0 9.4 0c0-2.1-1.6-4.6-4.7-8.3z"
      />
    </Svg>
  );
}
