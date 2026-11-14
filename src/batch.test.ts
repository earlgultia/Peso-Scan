import { describe, expect, it } from 'vitest';
import { getBatchTotals, type BatchLine } from './batch';

describe('getBatchTotals', () => {
  it('totals manually entered denomination quantities', () => {
    const items: BatchLine[] = [
      { id: 'a', denomination: 1000, quantity: 1 },
      { id: 'b', denomination: 500, quantity: 2 },
      { id: 'c', denomination: 100, quantity: 3 },
    ];
    expect(getBatchTotals(items)).toEqual({ noteCount: 6, totalValue: 2300 });
  });
  it('returns zero totals for an empty batch', () => {
    expect(getBatchTotals([])).toEqual({ noteCount: 0, totalValue: 0 });
  });
});
