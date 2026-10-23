import type { Data } from './model.ts';
export const emptyData = (): Data => ({ version: 1, rooms: [], tenants: [], payments: [], maintenance: [], complaints: [], clients: [], loans: [], repayments: [], settings: { owner: 'T2PKs Administration', email: '', phone: '', address: '', autoInvoice: true } });
export function isData(value: unknown): value is Data {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string,unknown>;
  return v.version === 1 && ['rooms','tenants','payments','maintenance','complaints','clients','loans','repayments'].every(key => Array.isArray(v[key])) && !!v.settings && typeof v.settings === 'object' && typeof (v.settings as Record<string,unknown>).owner === 'string';
}
export function savedRevision(result: unknown): number {
  if (!Array.isArray(result) || result.length !== 1 || !Number.isInteger(result[0]?.revision) || result[0].revision < 1) throw new Error('The database did not confirm this save. Reload live records before trying again.');
  return result[0].revision;
}
