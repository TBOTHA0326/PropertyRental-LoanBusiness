import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
const expect = (actual: unknown) => ({ toBe: (expected: unknown) => assert.equal(actual,expected), toBeGreaterThan: (expected: number) => assert.ok(typeof actual === 'number' && actual > expected), toMatchObject: (expected: Record<string,unknown>) => { for (const [key,value] of Object.entries(expected)) assert.equal((actual as Record<string,unknown>)[key],value); } });
import { createSeed } from './seed.ts';
import { loanBalance, loanStatus, monthKey, portfolio, rentStatus, tenantBalance, tenantPaid } from './model.ts';
describe('rent records', () => {
  it('allocates partial payments to the correct rent period', () => {
    const data=createSeed(), tenant=data.tenants[4], period=monthKey();
    expect(tenantPaid(data,tenant.id,period)).toBe(1500);
    expect(tenantBalance(data,tenant,period)).toBe(1100);
    expect(rentStatus(data,tenant,period)).toBe('Partial');
    data.payments.push({id:'extra',tenantId:tenant.id,amount:1100,date:period+'-20',period,method:'Cash',reference:'',invoiceId:'INV-TEST'});
    expect(tenantBalance(data,tenant,period)).toBe(0);
    expect(rentStatus(data,tenant,period)).toBe('Paid');
    expect(tenantPaid(data,tenant.id,'2000-01')).toBe(0);
  });
  it('does not bill a tenant before their move-in month', () => { const data=createSeed(); expect(tenantBalance(data,data.tenants[0],'2000-01')).toBe(0); expect(rentStatus(data,data.tenants[0],'2000-01')).toBe('Upcoming'); });
  it('keeps vacancy and occupied room totals in sync after a move out', () => { const data=createSeed(); const before=portfolio(data,monthKey()); expect(before.occupied).toBe(14); expect(before.vacant).toBe(4); data.tenants[0].status='archived'; const after=portfolio(data,monthKey()); expect(after.occupied).toBe(13); expect(after.vacant).toBe(5); expect(data.payments.filter(p=>p.tenantId===data.tenants[0].id).length).toBeGreaterThan(0); });
  it('handles an empty portfolio without invalid percentages', () => { const data=createSeed(); data.rooms=[]; data.tenants=[]; data.payments=[]; expect(portfolio(data,monthKey())).toMatchObject({collected:0,expected:0,outstanding:0,occupancy:0,vacant:0}); });
});
describe('loan ledger', () => {
  it('subtracts repayments and settles a fully repaid loan', () => { const data=createSeed(),loan=data.loans[0]; expect(loanBalance(data,loan)).toBe(2300); data.repayments.push({id:'test',loanId:loan.id,amount:2300,date:'2026-10-23',method:'Cash',reference:''}); expect(loanBalance(data,loan)).toBe(0); expect(loanStatus(data,loan)).toBe('Settled'); });
  it('preserves the original due date when recording pay later', () => { const data=createSeed(),loan=data.loans[0],originalDue=loan.due; loan.payLater=true; loan.promisedDate='2026-12-01'; expect(loanStatus(data,loan,'2026-11-01')).toBe('Pay later'); expect(loan.due).toBe(originalDue); });
  it('marks overdue loans using an explicit reporting date', () => { const data=createSeed(),loan=data.loans[0]; expect(loanStatus(data,loan,'2099-01-01')).toBe('Overdue'); expect(loanStatus(data,loan,loan.due)).toBe('Active'); });
  it('settlement takes precedence over a pay later flag', () => { const data=createSeed(),loan=data.loans[4]; loan.payLater=true; expect(loanStatus(data,loan)).toBe('Settled'); });
});
