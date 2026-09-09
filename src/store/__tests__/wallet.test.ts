import {
  useWallet,
  selectBalance,
  selectExpiringSoon,
  selectLitresThisMonth,
  selectTopUpCapRemaining,
  selectRedemptionRemaining,
  selectSpendable,
  selectLastFill,
} from '../wallet';
import { LedgerEntry } from '../../data/types';

const initial = useWallet.getState();

beforeEach(() => {
  useWallet.setState(initial, true);
});

describe('useWallet initial state (from the seed)', () => {
  test('balance is 42.6 L', () => {
    expect(selectBalance(useWallet.getState())).toBeCloseTo(42.6, 1);
  });

  // The laddered seed's oldest surviving lot -- 12.0 L bought 8 July at
  // R21.40 -- expires 6 October, six days after the demo instant. The previous
  // seed drained FIFO until only the newest lot stood, so this read 0.0 L and
  // the expiry warning could not be demonstrated at all.
  test('12.0 L expires within 30 days', () => {
    expect(selectExpiringSoon(useWallet.getState())).toBe(12);
  });

  test('September top-ups total 18.6 L, leaving 481.4 L of the 500 L cap', () => {
    expect(selectLitresThisMonth(useWallet.getState())).toBeCloseTo(18.6, 1);
    expect(selectTopUpCapRemaining(useWallet.getState())).toBeCloseTo(481.4, 1);
  });

  // The seed's last two fills -- 12.0 L on 24 Sep and 8.0 L on 30 Sep -- both
  // fall inside the trailing 7 days from the demo instant, so 20.0 L of the
  // 110 L weekly cap is spent. That leaves far more headroom than the balance,
  // so the cap is NOT the binding constraint on a laddered one-tank wallet --
  // which is the truth of the product for a normal user. The cap is fraud
  // mitigation aimed at heavy redemption, and the tests below construct that
  // case explicitly rather than relying on the seed to produce it.
  test('20.0 L of the weekly redemption cap is spent, leaving 90.0 L', () => {
    expect(selectRedemptionRemaining(useWallet.getState())).toBeCloseTo(90.0, 1);
  });

  test('spendable is the balance while the weekly cap has more room than that', () => {
    const s = useWallet.getState();
    expect(selectSpendable(s)).toBeCloseTo(42.6, 1);
    expect(selectSpendable(s)).toBeLessThan(selectRedemptionRemaining(s));
  });

  test('appearance defaults to dark and the card starts unfrozen', () => {
    expect(useWallet.getState().appearance).toBe('dark');
    expect(useWallet.getState().cardFrozen).toBe(false);
  });
});

describe('topUp', () => {
  test('adds litres priced at today\'s inland rate and appends a ledger entry', () => {
    const before = useWallet.getState();
    before.topUp(500);
    const after = useWallet.getState();
    expect(selectBalance(after)).toBeGreaterThan(selectBalance(before));
    expect(after.ledger.length).toBe(before.ledger.length + 1);
    const entry = after.ledger[after.ledger.length - 1];
    expect(entry.kind).toBe('topup');
    expect(entry.deltaLitres).toBeGreaterThan(0);
    expect(entry.balanceAfter).toBeCloseTo(selectBalance(after), 1);
  });

  test('is a no-op once the monthly cap is exhausted', () => {
    const before = useWallet.getState();
    before.topUp(100_000); // litres far beyond the 394.8 L of cap headroom
    const after = useWallet.getState();
    expect(after.ledger.length).toBe(before.ledger.length);
    expect(after.lots.length).toBe(before.lots.length);
    expect(selectBalance(after)).toBeCloseTo(selectBalance(before), 1);
  });

  test('topUp(0) is a no-op', () => {
    const before = useWallet.getState();
    before.topUp(0);
    const after = useWallet.getState();
    expect(after.ledger.length).toBe(before.ledger.length);
    expect(after.lots.length).toBe(before.lots.length);
  });

  test('topUp(-500) is a no-op', () => {
    const before = useWallet.getState();
    before.topUp(-500);
    const after = useWallet.getState();
    expect(after.ledger.length).toBe(before.ledger.length);
    expect(after.lots.length).toBe(before.lots.length);
  });
});

describe('cardFill', () => {
  test('resolves a known merchant descriptor, deducts balance, and records the buy price', () => {
    const before = useWallet.getState();
    before.cardFill('ENGEN WILLIAM NICOL 4412', 200, null);
    const after = useWallet.getState();
    expect(selectBalance(after)).toBeLessThan(selectBalance(before));
    const entry = after.ledger[after.ledger.length - 1];
    expect(entry.kind).toBe('fill');
    expect(entry.card?.stationId).toBe('engen-william-nicol');
    expect(entry.card?.zone).toBe('inland');
    expect(entry.buyPricePerLitre).toBeGreaterThan(0);
  });

  test('is a no-op when the requested fill exceeds the current balance', () => {
    const before = useWallet.getState();
    before.cardFill('SHELL GRAYSTON SANDTON', 1_000_000, null);
    const after = useWallet.getState();
    expect(after.ledger.length).toBe(before.ledger.length);
    expect(after.lots.length).toBe(before.lots.length);
  });

  // Spec §11: "Fail open on attribution; never fail the card at the pump."
  test('an unresolvable descriptor with no fallback zone is a no-op, and does not throw', () => {
    const before = useWallet.getState();
    expect(() => before.cardFill('SOME UNKNOWN MERCHANT 9999', 200, null)).not.toThrow();
    const after = useWallet.getState();
    expect(after.ledger.length).toBe(before.ledger.length);
    expect(after.lots.length).toBe(before.lots.length);
  });

  // Spec §11: "never fail silently on price." The bare `catch {}` this
  // replaced left no way to tell an expected no-op from a swallowed bug.
  test('an unresolvable descriptor records why in lastCardFillError', () => {
    useWallet.getState().cardFill('SOME UNKNOWN MERCHANT 9999', 200, null);
    expect(useWallet.getState().lastCardFillError).toMatch(/cannot resolve zone/i);
  });

  test('a non-positive rand amount records why in lastCardFillError', () => {
    useWallet.getState().cardFill('SASOL RIVONIA', 0, null);
    expect(useWallet.getState().lastCardFillError).toMatch(/positive/i);
  });

  test('lastCardFillError clears on the next successful fill', () => {
    useWallet.getState().cardFill('SOME UNKNOWN MERCHANT 9999', 200, null);
    expect(useWallet.getState().lastCardFillError).not.toBeNull();

    useWallet.getState().cardFill('SASOL RIVONIA', 200, null);
    expect(useWallet.getState().lastCardFillError).toBeNull();
  });
});

describe('cardFill — weekly redemption cap (spec §8.5)', () => {
  // These tests are about the CAP, not about the seed. They used to lean on
  // the seed happening to leave only 40.6 L of cap, which quietly turned them
  // into no-ops the moment the seed changed -- the fill simply succeeded and
  // the "declines" assertions passed for the wrong reason. So the binding
  // state is now constructed here: a 60 L fill dated the day before the demo
  // instant, added to the LEDGER only. Lots are untouched, so the balance
  // stays 42.6 L and the cap is isolated from the balance guard above it.
  beforeEach(() => {
    const s = useWallet.getState();
    useWallet.setState({
      ledger: [...s.ledger, {
        id: 'cap-setup', kind: 'fill', what: 'Fill · Setup',
        when: new Date(2026, 8, 29), detail: '', grade: '95',
        deltaLitres: -60, balanceAfter: 0,
      }],
    });
  });

  test('the constructed state really does make the cap the tighter limit', () => {
    const s = useWallet.getState();
    expect(selectRedemptionRemaining(s)).toBeCloseTo(30.0, 1);
    expect(selectSpendable(s)).toBeLessThan(selectBalance(s));
  });

  // R900 buys 41.2 L: inside the 42.6 L balance, but past the 30.0 L left of
  // the weekly cap. So this isolates the cap from the balance guard above it.
  test('declines a fill that fits the balance but breaches the weekly cap', () => {
    const before = useWallet.getState();
    before.cardFill('SASOL RIVONIA', 900, null);
    const after = useWallet.getState();
    expect(after.ledger.length).toBe(before.ledger.length);
    expect(after.lots.length).toBe(before.lots.length);
    expect(selectBalance(after)).toBeCloseTo(selectBalance(before), 1);
  });

  // Spec §11 requires the reason be observable rather than swallowed. A cap
  // decline is a deliberate refusal, not the attribution failure §11 forbids.
  test('records the cap as the reason rather than failing silently', () => {
    useWallet.getState().cardFill('SASOL RIVONIA', 900, null);
    expect(useWallet.getState().lastCardFillError).toMatch(/weekly redemption cap/i);
  });

  test('allows a fill that fits inside the remaining cap', () => {
    const before = useWallet.getState();
    before.cardFill('SASOL RIVONIA', 200, null);
    const after = useWallet.getState();
    expect(after.ledger.length).toBe(before.ledger.length + 1);
    expect(after.lastCardFillError).toBeNull();
  });

  test('spending against the cap reduces what is left', () => {
    const before = selectRedemptionRemaining(useWallet.getState());
    useWallet.getState().cardFill('SASOL RIVONIA', 200, null);
    expect(selectRedemptionRemaining(useWallet.getState())).toBeLessThan(before);
  });
});

describe('selectLastFill', () => {
  const fill = (when: Date, delta: number, id: string): LedgerEntry => ({
    id, kind: 'fill', what: '', when, detail: '', grade: '95',
    deltaLitres: delta, balanceAfter: 0,
  });

  test('is the seed\'s newest fill — Shell Grayston, 8.0 L on 30 September', () => {
    const e = selectLastFill(useWallet.getState());
    expect(e).not.toBeNull();
    expect(e!.what).toBe('Fill · Shell Grayston');
    expect(Math.abs(e!.deltaLitres)).toBeCloseTo(8.0, 1);
    expect(e!.when.getDate()).toBe(30);
  });

  test('is null when nothing has been spent', () => {
    useWallet.setState({ ledger: [] });
    expect(selectLastFill(useWallet.getState())).toBeNull();
  });

  test('ignores entries that are not fills', () => {
    useWallet.setState({ ledger: [
      { id: 'a', kind: 'topup', what: '', when: new Date(2026, 8, 29), detail: '',
        grade: '95', deltaLitres: 10, balanceAfter: 0 },
    ] });
    expect(selectLastFill(useWallet.getState())).toBeNull();
  });

  // The reason this is a reduce over dates rather than a reverse().find():
  // array order is not guaranteed to be chronological.
  test('picks by date, not by position in the ledger', () => {
    useWallet.setState({ ledger: [
      fill(new Date(2026, 8, 30), -38, 'newest'),
      fill(new Date(2026, 8, 11), -28, 'older'),
    ] });
    expect(selectLastFill(useWallet.getState())!.id).toBe('newest');
  });

  // Every store-created fill is dated at the clock, so a second simulated fill shares
  // its date with the first and the later one must win.
  test('breaks a same-day tie toward the later entry', () => {
    const d = new Date(2026, 8, 30);
    useWallet.setState({ ledger: [fill(d, -10, 'first'), fill(d, -12, 'second')] });
    expect(selectLastFill(useWallet.getState())!.id).toBe('second');
  });

  test('follows a new card fill', () => {
    const before = selectLastFill(useWallet.getState());
    useWallet.getState().cardFill('SASOL RIVONIA', 200, null);
    const after = selectLastFill(useWallet.getState());
    expect(after!.id).not.toBe(before!.id);
    expect(after!.card?.stationId).toBe('sasol-rivonia');
  });
});

describe('disputeFill', () => {
  test('flags the card as disputed without changing balance or litres', () => {
    useWallet.getState().cardFill('SASOL RIVONIA', 200, null);
    const entry = useWallet.getState().ledger[useWallet.getState().ledger.length - 1];
    const balanceBefore = selectBalance(useWallet.getState());

    useWallet.getState().disputeFill(entry.id);

    const updated = useWallet.getState().ledger.find(e => e.id === entry.id);
    expect(updated?.card?.disputed).toBe(true);
    expect(selectBalance(useWallet.getState())).toBeCloseTo(balanceBefore, 1);
  });
});

describe('simple setters', () => {
  test('setAppearance, toggleAlert, setSubscription, freezeCard', () => {
    useWallet.getState().setAppearance('light');
    expect(useWallet.getState().appearance).toBe('light');

    const before0 = useWallet.getState().alerts[0];
    useWallet.getState().toggleAlert(0);
    expect(useWallet.getState().alerts[0]).toBe(!before0);

    useWallet.getState().setSubscription('active');
    expect(useWallet.getState().subscription).toBe('active');

    useWallet.getState().freezeCard(true);
    expect(useWallet.getState().cardFrozen).toBe(true);
  });
});
