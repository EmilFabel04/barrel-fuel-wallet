import { DEMO_NOW, now, setClock, resetClock } from '../clock';
import { buildSeed } from '../../data/seed';

afterEach(resetClock);

describe('the app clock', () => {
  test('DEMO_NOW is 30 September 2026', () => {
    expect(DEMO_NOW.getFullYear()).toBe(2026);
    expect(DEMO_NOW.getMonth()).toBe(8);
    expect(DEMO_NOW.getDate()).toBe(30);
  });

  test('now() returns the demo instant by default', () => {
    expect(now().getTime()).toBe(DEMO_NOW.getTime());
  });

  test('setClock installs a different clock', () => {
    const other = new Date(2027, 0, 15);
    setClock(() => other);
    expect(now().getTime()).toBe(other.getTime());
  });

  test('resetClock restores the demo instant', () => {
    setClock(() => new Date(2027, 0, 15));
    resetClock();
    expect(now().getTime()).toBe(DEMO_NOW.getTime());
  });

  test('now() is read at call time, not captured at import', () => {
    let t = new Date(2027, 0, 1);
    setClock(() => t);
    expect(now().getFullYear()).toBe(2027);
    t = new Date(2028, 0, 1);
    expect(now().getFullYear()).toBe(2028);
  });

  // The seed's final fill is dated at the demo instant deliberately: it is the
  // fill the Wallet's "last fill" row shows on open. Pinned so the two cannot
  // drift apart into two literals that merely happen to match.
  test('the seed ends with a fill dated at the demo instant', () => {
    const { ledger } = buildSeed();
    const fills = ledger.filter(e => e.kind === 'fill');
    const last = fills[fills.length - 1];
    expect(last.when.getTime()).toBe(DEMO_NOW.getTime());
  });
});
