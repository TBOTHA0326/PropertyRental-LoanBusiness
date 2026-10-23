export type Workspace = 'properties' | 'loans';
export type Room = { id: string; number: string; property: string; rate: number };
export type Tenant = { id: string; name: string; email: string; phone: string; idNumber: string; roomId: string; moveIn: string; deposit: number; emergencyContact: string; notes: string; status: 'active' | 'archived' };
export type Payment = { id: string; tenantId: string; amount: number; date: string; period: string; method: string; reference: string; invoiceId: string };
export type Maintenance = { id: string; roomId: string; title: string; description: string; date: string; completedDate: string; cost: number; priority: 'Low' | 'Medium' | 'High'; status: 'Open' | 'In progress' | 'Completed' };
export type Complaint = { id: string; tenantId: string; title: string; description: string; date: string; status: 'Open' | 'Investigating' | 'Resolved'; resolution: string };
export type Client = { id: string; name: string; phone: string; email: string; idNumber: string; address: string; notes: string };
export type Loan = { id: string; clientId: string; principal: number; totalDue: number; issued: string; due: string; promisedDate: string; payLater: boolean; notes: string };
export type Repayment = { id: string; loanId: string; amount: number; date: string; method: string; reference: string };
export type Settings = { owner: string; email: string; phone: string; address: string; autoInvoice: boolean };
export type Data = { version: 1; rooms: Room[]; tenants: Tenant[]; payments: Payment[]; maintenance: Maintenance[]; complaints: Complaint[]; clients: Client[]; loans: Loan[]; repayments: Repayment[]; settings: Settings };
export const uid = () => crypto.randomUUID();
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const monthKey = (date = today()) => date.slice(0, 7);
export const money = (value: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
export const fullMoney = (value: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value);
export const dateLabel = (date: string, options?: Intl.DateTimeFormatOptions) => date ? new Intl.DateTimeFormat('en-ZA', options ?? { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date + 'T12:00:00')) : '—';
export const monthLabel = (period: string, short = false) => dateLabel(period + '-01', { month: short ? 'short' : 'long', year: short ? undefined : 'numeric' });
export function tenantPaid(data: Data, tenantId: string, period: string) { return data.payments.filter(p => p.tenantId === tenantId && p.period === period).reduce((a, p) => a + p.amount, 0); }
export function tenantBalance(data: Data, tenant: Tenant, period: string) {
  if (tenant.moveIn.slice(0, 7) > period) return 0;
  return Math.max(0, (data.rooms.find(r => r.id === tenant.roomId)?.rate ?? 0) - tenantPaid(data, tenant.id, period));
}
export function rentStatus(data: Data, tenant: Tenant, period: string) {
  if (tenant.status === 'archived') return 'Archived';
  if (tenant.moveIn.slice(0, 7) > period) return 'Upcoming';
  if (tenantBalance(data, tenant, period) === 0) return 'Paid';
  return tenantPaid(data, tenant.id, period) > 0 ? 'Partial' : 'Outstanding';
}
export function loanBalance(data: Data, loan: Loan) { return Math.max(0, loan.totalDue - data.repayments.filter(p => p.loanId === loan.id).reduce((a, p) => a + p.amount, 0)); }
export function loanStatus(data: Data, loan: Loan, date = today()) {
  if (loanBalance(data, loan) === 0) return 'Settled';
  if (loan.payLater) return 'Pay later';
  return loan.due < date ? 'Overdue' : 'Active';
}
export function portfolio(data: Data, period: string) {
  const active = data.tenants.filter(t => t.status === 'active' && t.moveIn.slice(0, 7) <= period);
  const expected = active.reduce((a, t) => a + (data.rooms.find(r => r.id === t.roomId)?.rate ?? 0), 0);
  const collected = data.payments.filter(p => p.period === period).reduce((a, p) => a + p.amount, 0);
  const outstanding = active.reduce((a, t) => a + tenantBalance(data, t, period), 0);
  const occupied = new Set(data.tenants.filter(t => t.status === 'active').map(t => t.roomId)).size;
  return { active, expected, collected, outstanding, occupied, vacant: data.rooms.length - occupied, occupancy: data.rooms.length ? Math.round(occupied / data.rooms.length * 100) : 0 };
}
export const initials = (name: string) => name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
export function shiftedMonth(offset: number, date = today()) { const d = new Date(date + 'T12:00:00'); d.setDate(1); d.setMonth(d.getMonth() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
export function downloadCsv(name: string, rows: (string | number)[][]) {
  const safe = (v: string | number) => { const s = String(v); return `"${(/^[=+@\-\t\r]/.test(s) ? "'" : '') + s.replaceAll('"', '""')}"`; };
  downloadFile(name + '.csv', '\uFEFF' + rows.map(r => r.map(safe).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
}
export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
