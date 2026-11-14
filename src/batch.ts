export type BatchLine = { id: string; denomination: number; quantity: number };
export function getBatchTotals(items: readonly BatchLine[]): { noteCount: number; totalValue: number } {
  return items.reduce((totals, item) => ({
    noteCount: totals.noteCount + item.quantity,
    totalValue: totals.totalValue + item.denomination * item.quantity,
  }), { noteCount: 0, totalValue: 0 });
}
