import {
  litresThisMonth, topUpCapRemaining, withinTopUpCap, MONTHLY_TOPUP_CAP_L,
  litresRedeemedSince, redemptionCapRemaining, withinRedemptionCap,
  WEEKLY_REDEMPTION_CAP_L, REDEMPTION_CAP_WINDOW_DAYS,
} from '../caps';
import { DAY, REDEMPTION_DAYS } from '../window';
import { LedgerEntry } from '../../data/types';

const entry = (
  kind: LedgerEntry['kind'], when: Date, delta: number
): LedgerEntry => ({
  id: `${kind}-${when.getTime()}`, kind, what: '', when, detail: '',
  grade: '95', deltaLitres: delta, balanceAfter: 0,
});

const AT = new Date(2026, 8, 30);
const sept = [
  entry('topup', new Date(2026, 8, 18), 36.6),
  entry('topup', new Date(2026, 8, 28), 68.6),
];

// Boundaries are derived from AT rather than written as calendar dates, so the
// exact-window cases stay true regardless of the machine's timezone.
const daysBefore = (n: number) => new Date(AT.getTime() - n * DAY);

describe('the two caps are distinct', () => {
  test('monthly top-up cap is 500 litres', () => expect(MONTHLY_TOPUP_CAP_L).toBe(500));
  test('weekly redemption cap is 110 litres', () => expect(WEEKLY_REDEMPTION_CAP_L).toBe(110));
  test('the redemption cap window is 7 days', () => expect(REDEMPTION_CAP_WINDOW_DAYS).toBe(7));

  // The two constants that both say "redemption" mean different things: 90 days
  // is how long a litre keeps its purchase price, 7 days is how fast litres may
  // be spent. Pinned so neither can be quietly pointed at the other.
  test('the redemption cap window is not the 90-day price-lock window', () => {
    expect(REDEMPTION_CAP_WINDOW_DAYS).not.toBe(REDEMPTION_DAYS);
    expect(REDEMPTION_DAYS).toBe(90);
  });
});

describe('litresThisMonth', () => {
  test('sums top-ups in the current month', () => {
    expect(litresThisMonth(sept, AT)).toBe(105.2);
  });
  test('excludes a top-up from the previous month', () => {
    const withAug = [...sept, entry('topup', new Date(2026, 7, 20), 50)];
    expect(litresThisMonth(withAug, AT)).toBe(105.2);
  });
  test('excludes bonuses — only purchases count against the cap', () => {
    const withBonus = [...sept, entry('bonus', new Date(2026, 8, 4), 2)];
    expect(litresThisMonth(withBonus, AT)).toBe(105.2);
  });
  test('excludes fills', () => {
    const withFill = [...sept, entry('fill', new Date(2026, 8, 24), -31.4)];
    expect(litresThisMonth(withFill, AT)).toBe(105.2);
  });
  test('is zero with no entries', () => expect(litresThisMonth([], AT)).toBe(0));
});

describe('topUpCapRemaining', () => {
  test('is the cap minus this month', () => expect(topUpCapRemaining(sept, AT)).toBe(394.8));
  test('never goes below zero', () => {
    const over = [entry('topup', new Date(2026, 8, 1), 600)];
    expect(topUpCapRemaining(over, AT)).toBe(0);
  });
});

describe('withinTopUpCap', () => {
  test('allows a purchase that fits', () => expect(withinTopUpCap(sept, AT, 394.8)).toBe(true));
  test('rejects a purchase that exceeds', () => expect(withinTopUpCap(sept, AT, 394.9)).toBe(false));
  test('allows exactly reaching the cap', () => {
    expect(withinTopUpCap([], AT, MONTHLY_TOPUP_CAP_L)).toBe(true);
  });
  // Regression guard for the seed's own demo state: the September seed must
  // leave room for the Top up screen's restored R1 500 default (68.6 L at
  // R21.87), or the screen opens disabled the way ruling C3 had to work around.
  test('leaves room for the R1 500 default against the seeded month', () => {
    expect(withinTopUpCap(sept, AT, 68.6)).toBe(true);
  });
});

describe('litresRedeemedSince', () => {
  test('sums fills inside the window, as positive litres', () => {
    const l = [entry('fill', daysBefore(1), -30), entry('fill', daysBefore(3), -20)];
    expect(litresRedeemedSince(l, AT)).toBe(50);
  });
  test('includes a fill one day inside the window', () => {
    const l = [entry('fill', daysBefore(REDEMPTION_CAP_WINDOW_DAYS - 1), -40)];
    expect(litresRedeemedSince(l, AT)).toBe(40);
  });
  test('excludes a fill exactly one window old — it has aged out', () => {
    const l = [entry('fill', daysBefore(REDEMPTION_CAP_WINDOW_DAYS), -40)];
    expect(litresRedeemedSince(l, AT)).toBe(0);
  });
  test('excludes a fill older than the window', () => {
    const l = [entry('fill', daysBefore(30), -40)];
    expect(litresRedeemedSince(l, AT)).toBe(0);
  });
  test('excludes a future-dated fill', () => {
    const l = [entry('fill', new Date(AT.getTime() + DAY), -40)];
    expect(litresRedeemedSince(l, AT)).toBe(0);
  });
  test('counts a fill dated exactly now', () => {
    expect(litresRedeemedSince([entry('fill', AT, -12)], AT)).toBe(12);
  });
  test('excludes top-ups and bonuses — only spending counts', () => {
    const l = [
      entry('fill', daysBefore(1), -30),
      entry('topup', daysBefore(1), 68.6),
      entry('bonus', daysBefore(2), 2),
    ];
    expect(litresRedeemedSince(l, AT)).toBe(30);
  });
  test('is zero with no entries', () => expect(litresRedeemedSince([], AT)).toBe(0));
});

describe('redemptionCapRemaining', () => {
  test('is the cap minus the trailing window', () => {
    expect(redemptionCapRemaining([entry('fill', daysBefore(2), -30)], AT)).toBe(80);
  });
  test('is the full cap when nothing was spent', () => {
    expect(redemptionCapRemaining([], AT)).toBe(WEEKLY_REDEMPTION_CAP_L);
  });
  test('never goes below zero', () => {
    const over = [entry('fill', daysBefore(1), -200)];
    expect(redemptionCapRemaining(over, AT)).toBe(0);
  });
});

describe('withinRedemptionCap', () => {
  const spent = [entry('fill', daysBefore(2), -80)];
  test('allows a fill that fits', () => expect(withinRedemptionCap(spent, AT, 30)).toBe(true));
  test('allows exactly reaching the cap', () => expect(withinRedemptionCap(spent, AT, 30)).toBe(true));
  test('rejects a fill that would exceed', () => expect(withinRedemptionCap(spent, AT, 30.1)).toBe(false));
  test('allows a full-cap fill against an empty ledger', () => {
    expect(withinRedemptionCap([], AT, WEEKLY_REDEMPTION_CAP_L)).toBe(true);
  });

  // The property the rolling window exists for: a calendar-week reset would
  // let the cap be spent twice within hours across the boundary. Spending the
  // full cap six days ago must still block a fill today.
  test('a full cap spent inside the window still blocks today', () => {
    const l = [entry('fill', daysBefore(6), -WEEKLY_REDEMPTION_CAP_L)];
    expect(withinRedemptionCap(l, AT, 1)).toBe(false);
  });
  test('the same spend one day earlier has aged out and no longer blocks', () => {
    const l = [entry('fill', daysBefore(7), -WEEKLY_REDEMPTION_CAP_L)];
    expect(withinRedemptionCap(l, AT, 1)).toBe(true);
  });
});
