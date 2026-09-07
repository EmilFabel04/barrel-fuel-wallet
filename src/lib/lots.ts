import { Lot } from '../data/types';
import { round1 } from './round';

export function activeLots(lots: Lot[], at: Date): Lot[] {
  return lots
    .filter(l => l.expiresAt.getTime() >= at.getTime())
    .sort((a, b) => a.purchasedAt.getTime() - b.purchasedAt.getTime());
}

export function balanceOf(lots: Lot[], at: Date): number {
  return round1(activeLots(lots, at).reduce((sum, l) => sum + l.litres, 0));
}

export function expiringWithin(lots: Lot[], at: Date, days: number): number {
  const cutoff = new Date(at.getTime() + days * 86_400_000);
  return round1(
    activeLots(lots, at)
      .filter(l => l.expiresAt.getTime() <= cutoff.getTime())
      .reduce((sum, l) => sum + l.litres, 0)
  );
}

export function consumeFifo(
  lots: Lot[],
  litres: number,
  at: Date
): { lots: Lot[]; consumedIds: string[] } {
  if (litres > balanceOf(lots, at)) {
    throw new Error('insufficient unexpired litres');
  }
  const order = activeLots(lots, at);
  const remainingById = new Map(lots.map(l => [l.id, l.litres]));
  const consumedIds: string[] = [];
  let outstanding = litres;

  for (const l of order) {
    if (outstanding <= 0) break;
    const take = Math.min(l.litres, outstanding);
    remainingById.set(l.id, round1(l.litres - take));
    outstanding = round1(outstanding - take);
    consumedIds.push(l.id);
  }

  const next = lots
    .map(l => ({ ...l, litres: remainingById.get(l.id)! }))
    .filter(l => l.litres > 0);

  return { lots: next, consumedIds };
}
