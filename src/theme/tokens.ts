export type Tokens = {
  bg: string; bgRaised: string; surface: string; border: string; hairline: string;
  textMuted: string; textDim: string; text: string; inverse: string;
  accent: string; positive: string;
};

export const DARK: Tokens = {
  bg: '#000000', bgRaised: '#0A0A0A', surface: '#1A1A1A', border: '#2E2E2E',
  hairline: '#1F1F1F', textMuted: '#6B6B6B', textDim: '#A8A8A8',
  text: '#FFFFFF', inverse: '#000000', accent: '#D9541E', positive: '#C6F24E',
};

export const LIGHT: Tokens = {
  bg: '#FFFFFF', bgRaised: '#FFFFFF', surface: '#EDEBE7', border: '#D5D2CC',
  hairline: '#E2DFDA', textMuted: '#6B6B6B', textDim: '#A8A8A8',
  text: '#000000', inverse: '#FFFFFF', accent: '#D9541E', positive: '#C6F24E',
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
