import {
  useWallet,
  selectBalance,
  selectExpiringSoon,
  selectLitresThisMonth,
  selectCapRemaining,
} from '../wallet';

const initial = useWallet.getState();

beforeEach(() => {
  useWallet.setState(initial, true);
});

describe('useWallet initial state (from the seed)', () => {
  test('balance is 42.6 L', () => {
    expect(selectBalance(useWallet.getState())).toBeCloseTo(42.6, 1);
  });

  test('nothing expires within 30 days', () => {
    expect(selectExpiringSoon(useWallet.getState())).toBe(0);
  });

  test('September top-ups total 105.2 L, leaving 44.8 L of cap', () => {
    expect(selectLitresThisMonth(useWallet.getState())).toBeCloseTo(105.2, 1);
    expect(selectCapRemaining(useWallet.getState())).toBeCloseTo(44.8, 1);
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
    before.topUp(100_000); // litres far beyond the 44.8 L of cap headroom
    const after = useWallet.getState();
    expect(after.ledger.length).toBe(before.ledger.length);
    expect(after.lots.length).toBe(before.lots.length);
    expect(selectBalance(after)).toBeCloseTo(selectBalance(before), 1);
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
