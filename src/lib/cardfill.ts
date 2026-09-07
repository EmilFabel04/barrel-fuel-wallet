import { STATIONS } from '../data/stations';
import { Zone } from '../data/types';
import { round1 } from './round';

// Merchant descriptors arrive dirty: 'ENGEN WILLIAM NICOL 4412',
// 'SHELL GRAYSTON SANDTON'. Strip digits and punctuation, then look for a
// station whose significant name words are all present.
const STOP_WORDS = new Set(['energy', 'garage', 'service', 'station']);

function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

export function normaliseDescriptor(raw: string): string | null {
  const have = new Set(words(raw));
  for (const station of STATIONS) {
    const need = words(station.name);
    if (need.length > 0 && need.every(w => have.has(w))) return station.id;
  }
  return null;
}

export function resolveZone(stationId: string | null, fallbackZone: Zone | null): Zone {
  const station = stationId ? STATIONS.find(s => s.id === stationId) : undefined;
  if (station) return station.zone;
  if (fallbackZone) return fallbackZone;
  throw new Error('cannot resolve zone: no station match and no transaction location');
}

export function deriveLitres(randAmount: number, pricePerLitre: number): number {
  if (randAmount <= 0) throw new Error('rand amount must be positive');
  if (pricePerLitre <= 0) throw new Error('price must be positive');
  return round1(randAmount / pricePerLitre);
}
