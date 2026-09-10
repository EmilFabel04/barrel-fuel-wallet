// The droplet path and viewBox are copied verbatim from
// src/components/BarrelMark.tsx, which took them verbatim from
// Barrel_Logo.svg. Copied rather than imported: web/ shares no code with the
// app. If the artwork changes, both copies change.
//
// Only the droplet ships here, as in the app. The source is two-tone — a
// droplet with a white crescent — but BarrelMark.tsx records the crescent as
// gone below ~14px and marginal at 17px. It survives only on the social card
// (public/og.png), which renders large.
const VIEW_BOX = '297 0 948 1500';
const ASPECT = 948 / 1500;

const DROPLET =
  'M 985.652344 383.585938 C 870.832031 184.472656 771.070312 0.277344 771.070312 0.277344 ' +
  'C 771.070312 0.277344 671.308594 184.472656 556.488281 383.585938 ' +
  'C 515.585938 454.539062 297.800781 791.832031 297.800781 993.859375 ' +
  'C 297.800781 1255.25 509.679688 1500.335938 771.070312 1500.335938 ' +
  'C 1032.460938 1500.335938 1244.339844 1255.25 1244.339844 993.859375 ' +
  'C 1244.339844 791.832031 1026.554688 454.539062 985.652344 383.585938';

/**
 * The app's lockup, reproduced exactly: mark height 17 against a 16px
 * wordmark, 8px apart, Figtree 800 at -0.56 tracking.
 * (app/(tabs)/index.tsx:76 and app/(tabs)/card.tsx:59, which agree.)
 * Expressed in `em` so it scales from `size` alone and nobody has to choose
 * a second set of numbers.
 */
export function Lockup({ size = 16 }: { size?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5em',          // 8 / 16
        fontSize: `${size}px`,
        lineHeight: 1,
      }}
    >
      <svg
        viewBox={VIEW_BOX}
        role="img"
        aria-label="Barrel"
        style={{ height: '1.0625em', width: `${1.0625 * ASPECT}em`, display: 'block' }}
      >
        <path d={DROPLET} fill="currentColor" />
      </svg>
      <span
        aria-hidden="true"
        style={{
          fontWeight: 800,
          letterSpacing: '-0.035em',   // -0.56 / 16
          textTransform: 'uppercase',
        }}
      >
        Barrel
      </span>
    </span>
  );
}
