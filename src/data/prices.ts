import { PricePoint, Zone } from './types';

// DMPR sets petrol prices by zone, effective the first Wednesday of each month.
// Coastal runs roughly R0.60/L below inland.
export const PRICES: PricePoint[] = [
  { zone: 'inland',  effectiveFrom: new Date(2026, 2, 4),  pricePerLitre: 20.94 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 2, 4),  pricePerLitre: 20.32 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 3, 1),  pricePerLitre: 21.12 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 3, 1),  pricePerLitre: 20.50 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 4, 6),  pricePerLitre: 21.35 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 4, 6),  pricePerLitre: 20.73 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 5, 3),  pricePerLitre: 21.08 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 5, 3),  pricePerLitre: 20.46 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 6, 1),  pricePerLitre: 21.61 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 6, 1),  pricePerLitre: 20.99 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 7, 5),  pricePerLitre: 21.75 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 7, 5),  pricePerLitre: 21.13 },
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
