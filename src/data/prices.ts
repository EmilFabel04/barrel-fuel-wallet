import { PricePoint, Zone } from './types';

// DMPR sets petrol prices by zone, effective the first Wednesday of each month.
// Coastal runs roughly R0.55-0.65/L below inland.
//
// 2026 saw an oil supply shock: prices rallied from March through June, eased
// back in July, then resumed climbing into September/October. September and
// October inland are pinned exactly (21.87 / 21.99) — other tests and screens
// depend on both.
export const PRICES: PricePoint[] = [
  { zone: 'inland',  effectiveFrom: new Date(2026, 2, 4),  pricePerLitre: 19.50 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 2, 4),  pricePerLitre: 18.90 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 3, 1),  pricePerLitre: 20.40 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 3, 1),  pricePerLitre: 19.80 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 4, 6),  pricePerLitre: 21.30 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 4, 6),  pricePerLitre: 20.70 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 5, 3),  pricePerLitre: 21.80 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 5, 3),  pricePerLitre: 21.20 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 6, 1),  pricePerLitre: 21.40 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 6, 1),  pricePerLitre: 20.80 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 7, 5),  pricePerLitre: 21.60 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 7, 5),  pricePerLitre: 21.00 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 8, 2),  pricePerLitre: 21.87 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 8, 2),  pricePerLitre: 21.25 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 9, 7),  pricePerLitre: 21.99 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 9, 7),  pricePerLitre: 21.37 },
];

export function priceOn(zone: Zone, at: Date): number {
  const candidates = PRICES
    .filter(p => p.zone === zone && p.effectiveFrom.getTime() <= at.getTime())
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());
  if (candidates.length === 0) {
    throw new Error(`no price for ${zone} on ${at.toISOString()}`);
  }
  return candidates[0].pricePerLitre;
}

// The next scheduled price change for a zone after a given date, or
// `undefined` if the table has nothing later — never a hand-picked date.
// Used by both app/alerts.tsx and app/(tabs)/index.tsx, the two screens
// that say "the price is about to change": each hardcoding its own
// date/cents is exactly how the Wallet screen's "Next change · 02 Oct"
// literal survived three fix rounds and two reviews after the source
// design's canvas copy was already known to be wrong.
export function nextPriceChange(zone: Zone, after: Date): PricePoint | undefined {
  return PRICES
    .filter(p => p.zone === zone && p.effectiveFrom.getTime() > after.getTime())
    .sort((a, b) => a.effectiveFrom.getTime() - b.effectiveFrom.getTime())[0];
}
