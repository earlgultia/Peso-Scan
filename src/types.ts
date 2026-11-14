export type Assessment = 'likely-genuine' | 'suspicious' | 'unable-to-verify';
export type ScanRecord = { id: string; date: string; denomination: number | null; denominationSource?: 'manual' | 'model' | null; material: string; assessment: Assessment; quality: string; modelVersion: string };
export type BatchRecord = { id: string; date: string; items: { denomination: number; quantity: number; manuallyEntered: true }[]; noteCount: number; totalValue: number };
export type Feature = { label: string; instruction: string; method: 'LOOK' | 'FEEL' | 'TILT' };
