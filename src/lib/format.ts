const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function group(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fixed(n: number, dp: number): string {
  const [i, f] = n.toFixed(dp).split('.');
  const g = group(i);
  return f ? `${g}.${f}` : g;
}

export const formatLitres = (n: number): string => fixed(n, 1);
export const formatRand = (n: number): string => fixed(n, 2);
export const formatRandWhole = (n: number): string => fixed(n, 0);
export const formatPrice = (n: number): string => n.toFixed(2);

// Spec §10.1: numeric heroes need an accessibilityLabel that spells the
// value out, since a screen reader announces "42.6 L" split across two Num
// nodes as two separate stops. Rand amounts read as "<whole> rand <cents>"
// (cents omitted when exactly zero) rather than "42.6", which VoiceOver/
// TalkBack otherwise announce as "forty-two point six" for a currency value.
export function spokenRand(n: number): string {
  const whole = Math.floor(n);
  const cents = Math.round((n - whole) * 100);
  return cents > 0 ? `${whole} rand ${cents}` : `${whole} rand`;
}

export function formatDayMonth(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
