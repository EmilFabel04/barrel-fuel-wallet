export type Tokens = {
  bg: string; bgRaised: string; surface: string; border: string; hairline: string;
  textMuted: string; textDim: string; text: string; inverse: string;
  accent: string; accentText: string;
  positive: string; positiveText: string;
  heroInk: string;
};

/**
 * Pump — the night face. Amber on warm near-black, borrowed from a fuel-pump
 * readout. `bg` is #0A0908 rather than pure black: warm reads as machined
 * metal, and elevation is absent in dark either way (see DARK_ELEVATION).
 */
export const DARK: Tokens = {
  // border is #635C53 rather than something darker so it clears 3:1 against
  // this ground, the same floor light mode meets. It has to: `bgRaised` sits
  // almost on top of `bg` in dark, and elevation is deliberately absent here,
  // so a panel's border carries nearly all of its definition. A subtler line
  // would leave panels indistinguishable from the screen behind them.
  bg: '#0A0908', bgRaised: '#0E0D0C', surface: '#1C1917', border: '#635C53',
  hairline: '#1C1917', textMuted: '#857E74', textDim: '#A79E93',
  text: '#F5F1EA', inverse: '#0A0908',
  // On this ground amber is legible as text (7.6:1), so accent and accentText
  // hold the same value. The split only bites in light mode.
  accent: '#FF7A1A', accentText: '#FF7A1A',
  positive: '#D6E84A', positiveText: '#D6E84A',
  heroInk: '#FF7A1A',
};

/**
 * Pump — the day face. Bright, because this app is opened standing at a pump
 * outdoors. Glare adds a flat white veil: it can only ADD light, so the
 * brighter the ground, the more of the contrast range survives it. Pure white
 * at full panel output beats an off-white at ~82%. The warm character lives in
 * the greys instead of the ground.
 *
 * Every text value here clears 7:1 (AAA), not the 4.5:1 AA floor. Under a veil
 * AA is not enough.
 */
export const LIGHT: Tokens = {
  bg: '#FFFFFF', bgRaised: '#FFFFFF', surface: '#F7F5F0', border: '#948A78',
  hairline: '#DCD6C9', textMuted: '#5C554C', textDim: '#3A342D',
  text: '#000000', inverse: '#FFFFFF',
  // You cannot have an orange that is both luminous and high-contrast on
  // white — they are opposites. So in light mode amber stops being a text
  // colour and becomes a FILL with ink set on it (7.3:1): the price badge, the
  // gauge, the meter, the primary button. Road-sign logic. `accentText` is for
  // the small delta glyphs where a filled block would be absurd.
  accent: '#FF6A00', accentText: '#9A3200',
  // `positive` changed value here, overturning the prior ruling that a fill
  // only contends with neighbouring fills: #C6F24E is 1.30:1 on white and a
  // lime bar on a white chart ground is genuinely hard to locate.
  positive: '#7A9000', positiveText: '#3F5406',
  // A hero cannot be amber on white and stay legible, so the hero's colour is
  // its own token rather than a branch inside a screen.
  heroInk: '#0A0908',
};

/**
 * The Barrel card pass depicts a physical object: a white card with black text.
 * It renders identically in both themes, so its colours are fixed rather than
 * themed. These are the ONLY hard-coded colours in the system (Ruling C1).
 */
export const PASS = {
  bg: '#FFFFFF',
  bgFrozen: '#EDEBE7',
  text: '#000000',
  dim: '#A8A8A8',
  muted: '#6B6B6B',
  hairline: '#E2DFDA',
  strataA: '#A8A8A8', // upper grey stratum beneath the card
  strataB: '#4A4A4A', // lower grey stratum
} as const;

/**
 * Corner radii (spec §3.3, amended). The original system was square
 * everywhere with a single 3px radius on buttons; this replaces it with a
 * scale so the whole surface language rounds together rather than each screen
 * inventing a number.
 */
export const RADIUS = {
  xs: 2,     // meters, chart bars, the gauge's segments
  sm: 4,     // chips, small boxes, the grade selector
  md: 6,     // buttons and panels
  lg: 10,    // the card pass
  pill: 999, // the Toggle track and knob
} as const;

export type Elevation = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number; // Android reads this; iOS reads the four above
};

export type ElevationSet = { low: Elevation; high: Elevation };

const NONE: Elevation = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};

/**
 * Elevation is a LIGHT-MODE affordance and deliberately absent in dark.
 *
 * A shadow is a dark blur, and `DARK.bg` is `#000000` — so in dark mode a
 * shadow is not subtle, it is literally invisible. Shipping one anyway would
 * repeat Ruling C1's defect in mirror image: a treatment that looks correct on
 * the theme you happen to be viewing and does nothing on the other.
 *
 * Dark mode does not need the affordance. The surfaces that take elevation are
 * the ones that would otherwise be white-on-white or near-groundless in light
 * mode — the card pass, the inverted price-watch block, the alert cards. In
 * dark mode each of those is already separated from the ground by luminance,
 * so there is nothing for a shadow to add.
 */
export const LIGHT_ELEVATION: ElevationSet = {
  low: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  high: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
};

export const DARK_ELEVATION: ElevationSet = { low: NONE, high: NONE };
