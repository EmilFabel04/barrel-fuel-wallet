import { ping } from '../format';

test('test harness runs and imports from src/lib', () => {
  expect(ping()).toBe('pong');
});
