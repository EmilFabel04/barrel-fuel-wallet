export type Grade = '95';
export type Zone = 'inland' | 'coastal';

export type Lot = {
  id: string;
  grade: Grade;
  litres: number;
  pricePerLitre: number;
  purchasedAt: Date;
  expiresAt: Date;
};

export type CardFill = {
  merchantDescriptor: string;
  stationId: string | null;
  mcc: '5541' | '5542';
  randAmount: number;
  zone: Zone;
  pricePerLitre: number;
  litres: number;
  disputed: boolean;
};

export type LedgerEntry = {
  id: string;
  kind: 'topup' | 'fill' | 'bonus' | 'expiry';
  what: string;
  when: Date;
  detail: string;
  grade: Grade;
  deltaLitres: number;
  balanceAfter: number;
  lotIds?: string[];
  card?: CardFill;
};

export type Station = {
  id: string;
  name: string;
  brand: string;
  suburb: string;
  hours: string;
  km: number;
  zone: Zone;
};

export type PricePoint = {
  zone: Zone;
  effectiveFrom: Date;
  pricePerLitre: number;
};
