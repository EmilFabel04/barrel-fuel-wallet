import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

/**
 * The official Barrel mark, taken verbatim from `Barrel_Logo.svg` so the path
 * can be diffed against the source artwork.
 *
 * The source is a two-tone lockup: a solid droplet with a white crescent
 * highlight in its lower right. Only the droplet ships here. The crescent is
 * 3.9% of the mark's area and stops resolving below roughly 20px — measured at
 * true size it reads at 30px, is marginal at 17px and is gone by 14px — and
 * this app only ever draws the mark at 17px (Wallet header, Card pass) and
 * 14px (Alerts lock-screen mock). Carrying it would also cost a second colour:
 * the crescent is a literal white, so against a `t.text`-tinted droplet it
 * disappears entirely in dark mode, and keeping it visible needs a knockout
 * mask and a second colour prop for a detail no screen can render. The full
 * two-tone artwork is used for the app icon set instead, where it renders at
 * 1024px and reads properly.
 */

// The droplet's exact bounds inside the source file's 1500x1500 canvas. Used
// as the viewBox so the path itself stays byte-identical to the artwork, and
// so the mark fills its box instead of sitting small and left of centre the
// way the untrimmed square canvas would leave it.
const VIEW = { x: 297, y: 0, w: 948, h: 1500 } as const;
const VIEW_BOX = `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`;

// The mark is taller than it is wide, so `size` means its height and the width
// follows from the artwork rather than being a second number to keep in step.
const ASPECT = VIEW.w / VIEW.h;

const DROPLET =
  'M 985.652344 383.585938 C 870.832031 184.472656 771.070312 0.277344 771.070312 0.277344 ' +
  'C 771.070312 0.277344 671.308594 184.472656 556.488281 383.585938 ' +
  'C 515.585938 454.539062 297.800781 791.832031 297.800781 993.859375 ' +
  'C 297.800781 1255.25 509.679688 1500.335938 771.070312 1500.335938 ' +
  'C 1032.460938 1500.335938 1244.339844 1255.25 1244.339844 993.859375 ' +
  'C 1244.339844 791.832031 1026.554688 454.539062 985.652344 383.585938';

export function BarrelMark({ size = 17, color }: { size?: number; color?: string }) {
  const t = useTheme();
  return (
    <Svg width={size * ASPECT} height={size} viewBox={VIEW_BOX}>
      <Path fill={color ?? t.text} d={DROPLET} />
    </Svg>
  );
}
