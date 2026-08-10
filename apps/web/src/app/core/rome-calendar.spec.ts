import { romeMonthKey } from './rome-calendar';

describe('romeMonthKey', () => {
  it('uses the complete calendar month in Europe/Rome', () => {
    expect(romeMonthKey(new Date('2026-07-31T21:59:59.000Z'))).toBe(
      '2026-07-01',
    );
    expect(romeMonthKey(new Date('2026-07-31T22:00:00.000Z'))).toBe(
      '2026-08-01',
    );
    expect(romeMonthKey(new Date('2026-08-31T21:59:59.000Z'))).toBe(
      '2026-08-01',
    );
    expect(romeMonthKey(new Date('2026-08-31T22:00:00.000Z'))).toBe(
      '2026-09-01',
    );
  });
});
