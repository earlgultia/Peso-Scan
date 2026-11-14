import Dexie, { type Table } from 'dexie';
import type { BatchRecord, ScanRecord } from './types';

class PesoDatabase extends Dexie {
  scans!: Table<ScanRecord, string>;
  batches!: Table<BatchRecord, string>;
  constructor() { super('peso-scan-local'); this.version(1).stores({ scans: 'id,date,denomination,assessment' }); this.version(2).stores({ scans: 'id,date,denomination,assessment', batches: 'id,date' }); }
}
export const db = new PesoDatabase();
export async function saveScan(record: ScanRecord): Promise<void> { await db.scans.put(record); }
export async function getScans(): Promise<ScanRecord[]> { return db.scans.orderBy('date').reverse().toArray(); }
export async function saveBatch(record: BatchRecord): Promise<void> { await db.batches.put(record); }
export async function getBatches(): Promise<BatchRecord[]> { return db.batches.orderBy('date').reverse().toArray(); }
