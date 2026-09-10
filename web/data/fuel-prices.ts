// South African petrol prices, published figures.
//
//   source:     https://www.dmpr.gov.za/Branches/Petroleum-Resources/Fuel-Prices
//   retrieved:  2026-09-10
//   grade:      95 Unleaded
//   zone:       Inland (Gauteng)
//   crosscheck: https://aa.co.za/fuel-pricing/ — the Automobile Association of
//               South Africa's published fuel price series (Petrol Unleaded 95,
//               Inland). It agrees with the departmental figure to the cent in
//               all twelve months; no price discrepancy was found. The single
//               difference is a date label, not a price: the AA dates the
//               August 2026 change 2026-08-04, while the department's schedule
//               makes it effective 2026-08-05 (the first Wednesday). Both give
//               that month as R25.58.
//
// Provenance, month by month:
//   2025-10 .. 2025-12  Department of Mineral and Petroleum Resources,
//                       "Breakdown of Prices" for each month, via the Petrol
//                       Price Archive at
//                       https://www.dmpr.gov.za/Services/Petroleum-Resources/Petrol-Price-Archive
//                       Each states the 95 ULP & LRP Inland Region price for
//                       the month's effective date.
//   2026-01 .. 2026-09  Department of Mineral and Petroleum Resources,
//                       "History of Fuel Prices September 2026", the
//                       departmental year-to-date table, Unleaded / Inland 95
//                       column. Its September figure (2692.00 c/l) was checked
//                       against the separately published "Breakdown of Prices
//                       September 2026" (2692.00 c/l, 95 ULP & LRP, Inland
//                       Region), which confirms the column reading.
//
// The department publishes in cents per litre; the figures below are those
// values divided by 100, unrounded. The c/l figure as published is kept
// beside each row so any value can be traced back to its document.
//
// Prices change on the first Wednesday of each month. Every effective date
// behind these twelve figures satisfies that rule.
//
// These are REAL published prices. src/data/prices.ts in this repository is
// invented demo data with a fictional 2026 supply shock and pinned September
// and October values; it must never be imported here or anywhere in web/.
// See the website spec §7.

export type FuelPricePoint = { month: string; pricePerLitre: number };

export const FUEL_PRICE_SOURCE = {
  source: 'https://www.dmpr.gov.za/Branches/Petroleum-Resources/Fuel-Prices',
  retrieved: '2026-09-10',
  grade: '95 Unleaded',
  zone: 'Inland (Gauteng)',
} as const;

export const FUEL_PRICES: FuelPricePoint[] = [
  { month: '2025-10', pricePerLitre: 21.63 }, // 2163.00 c/l, effective 2025-10-01
  { month: '2025-11', pricePerLitre: 21.12 }, // 2112.00 c/l, effective 2025-11-05
  { month: '2025-12', pricePerLitre: 21.41 }, // 2141.00 c/l, effective 2025-12-03
  { month: '2026-01', pricePerLitre: 20.75 }, // 2075.00 c/l, effective 2026-01-07
  { month: '2026-02', pricePerLitre: 20.10 }, // 2010.00 c/l, effective 2026-02-04
  { month: '2026-03', pricePerLitre: 20.30 }, // 2030.00 c/l, effective 2026-03-04
  { month: '2026-04', pricePerLitre: 23.36 }, // 2336.00 c/l, effective 2026-04-01
  { month: '2026-05', pricePerLitre: 26.63 }, // 2663.00 c/l, effective 2026-05-06
  { month: '2026-06', pricePerLitre: 28.06 }, // 2806.00 c/l, effective 2026-06-03
  { month: '2026-07', pricePerLitre: 26.10 }, // 2610.00 c/l, effective 2026-07-01
  { month: '2026-08', pricePerLitre: 25.58 }, // 2558.00 c/l, effective 2026-08-05
  { month: '2026-09', pricePerLitre: 26.92 }, // 2692.00 c/l, effective 2026-09-02
];
