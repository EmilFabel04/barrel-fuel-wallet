import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export type TabName = 'wallet' | 'stations' | 'card' | 'savings' | 'settings';

export function TabIcon({ name, color }: { name: TabName; color: string }) {
  const p = { stroke: color, strokeWidth: 1.5, fill: 'none' };
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {name === 'wallet' && <Rect x={3} y={6} width={18} height={13} {...p} />}
      {name === 'stations' && <><Path d="M12 21s6-5.4 6-10a6 6 0 1 0-12 0c0 4.6 6 10 6 10z" {...p} /><Circle cx={12} cy={11} r={2} {...p} /></>}
      {name === 'card' && <><Rect x={2} y={5} width={20} height={14} {...p} /><Path d="M2 10h20" {...p} /></>}
      {name === 'savings' && <Path d="M4 20V10M10 20V4M16 20v-8M22 20V7" {...p} />}
      {name === 'settings' && <><Path d="M3 7h18M3 12h18M3 17h18" {...p} /></>}
    </Svg>
  );
}
