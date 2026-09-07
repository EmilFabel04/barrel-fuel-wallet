import { Lot } from '../data/types';
import { round1 } from './round';
import { DAY } from './window';

export function activeLots(lots: Lot[], at: Date): Lot[] {
  return lots
    .filter(l => l.expiresAt.getTime() >= at.getTime())
    .sort((a, b) => a.purchasedAt.getTime() - b.purchasedAt.getTime());
}

export function balanceOf(lots: Lot[], at: Date): number {
  return round1(activeLots(lots, at).reduce((sum, l) => sum + l.litres, 0));
}

export function expiringWithin(lots: Lot[], at: Date, days: number): number {
  const cutoff = new Date(at.getTime() + days * DAY);
  return round1(
    activeLots(lots, at)
      .filter(l => l.expiresAt.getTime() <= cutoff.getTime())
      .reduce((sum, l) => sum + l.litres, 0)
  );
}

/**
 * FIFO consumption that also reports what the consumed litres originally cost.
 * `cost` is the rand total of the lots drawn down, so `cost / litres` is the
 * weighted buy price — the sole input to the savings calculation. Callers must
 * not re-derive this ordering themselves: one definition of FIFO, one of cost.
 */
export function consumeFifoWithCost(
  lots: Lot[],
  litres: number,
  at: Date
): { lots: Lot[]; consumedIds: string[]; cost: number } {
  if (litres > balanceOf(lots, at)) {
    throw new Error('insufficient unexpired litres');
  }
  const order = activeLots(lots, at);
  const remainingById = new Map(lots.map(l => [l.id, l.litres]));
  const consumedIds: string[] = [];
  let outstanding = litres;
  let cost = 0;

  for (const l of order) {
    if (outstanding <= 0) break;
    const take = Math.min(l.litres, outstanding);
    cost += take * l.pricePerLitre;
    remainingById.set(l.id, round1(l.litres - take));
    outstanding = round1(outstanding - take);
    consumedIds.push(l.id);
  }

  const next = lots
    .map(l => ({ ...l, litres: remainingById.get(l.id)! }))
    .filter(l => l.litres > 0);

  return { lots: next, consumedIds, cost };
}

export function consumeFifo(
  lots: Lot[],
  litres: number,
  at: Date
): { lots: Lot[]; consumedIds: string[] } {
  const { lots: next, consumedIds } = consumeFifoWithCost(lots, litres, at);
  return { lots: next, consumedIds };
}
