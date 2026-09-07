export type Tokens = {
  bg: string; bgRaised: string; surface: string; border: string; hairline: string;
  textMuted: string; textDim: string; text: string; inverse: string;
  accent: string; positive: string; positiveText: string;
};

export const DARK: Tokens = {
  bg: '#000000', bgRaised: '#0A0A0A', surface: '#1A1A1A', border: '#2E2E2E',
  hairline: '#1F1F1F', textMuted: '#6B6B6B', textDim: '#A8A8A8',
  text: '#FFFFFF', inverse: '#000000', accent: '#D9541E', positive: '#C6F24E',
  // Unchanged from `positive` — #C6F24E on black is already well above AA.
  positiveText: '#C6F24E',
};

export const LIGHT: Tokens = {
  bg: '#FFFFFF', bgRaised: '#FFFFFF', surface: '#EDEBE7', border: '#D5D2CC',
  hairline: '#E2DFDA', textMuted: '#6B6B6B', textDim: '#A8A8A8',
  text: '#000000', inverse: '#FFFFFF', accent: '#D9541E', positive: '#C6F24E',
  // #C6F24E measures 1.30:1 on white — invisible as text. #5A7A0A measures
  // 4.97:1, passing WCAG AA, while still reading as the same lime-green hue.
  // `positive` itself stays #C6F24E: it is the *fill* colour (chart bars, the
  // Toggle track), where contrast is against neighbouring fills rather than
  // through the colour to a background, so the fill value never had this
  // problem. `positiveText` is for text and glyphs only (spec §3.1).
  positiveText: '#5A7A0A',
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
  xs: 4,     // savings bars, the cap-meter fill
  sm: 10,    // small boxes: avatar squares, the grade selector
  md: 14,    // buttons and bordered cards
  lg: 18,    // large surfaces: the card pass, the inverted price-watch block
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
