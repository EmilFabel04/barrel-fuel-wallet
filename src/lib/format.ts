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

export function formatDayMonth(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
