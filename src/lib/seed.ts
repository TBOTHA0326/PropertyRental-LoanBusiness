import { shiftedMonth, today } from './model.ts';
import type { Data } from './model.ts';
export function createSeed(): Data {
  const day = today(), month = day.slice(0, 7);
  const rooms = ['Mabopane House', 'Soshanguve House', 'Pretoria West'].flatMap((property, i) => Array.from({ length: 6 }, (_, j) => ({ id: `room-${i * 6 + j + 1}`, number: `${String.fromCharCode(65 + i)}${String(j + 1).padStart(2, '0')}`, property, rate: [2400, 2200, 2800][i] + (j > 3 ? 200 : 0) })));
  const names = ['Thabo Molefe', 'Naledi Dlamini', 'Sipho Nkosi', 'Lerato Mokoena', 'Kabelo Maseko', 'Zanele Khumalo', 'Bongani Ndlovu', 'Palesa Motaung', 'Tshepo Madiba', 'Nomsa Sithole', 'Sibusiso Zulu', 'Refilwe Tau', 'Mpho Selepe', 'Ayanda Nkomo'];
  const occupiedIndexes = [0, 1, 2, 3, 4, 6, 7, 8, 9, 12, 13, 14, 15, 16];
  const tenants = names.map((name, i) => ({ id: `tenant-${i + 1}`, name, email: name.toLowerCase().replace(' ', '.') + '@example.com', phone: `072 555 ${String(1000 + i)}`, idNumber: '', roomId: rooms[occupiedIndexes[i]].id, moveIn: shiftedMonth(-6) + '-01', deposit: rooms[occupiedIndexes[i]].rate, emergencyContact: 'Family contact · 082 555 0199', notes: i === 0 ? 'Prefers email for invoices. Lease reviewed at the start of each year.' : '', status: 'active' as const }));
  const payments = [-5, -4, -3, -2, -1, 0].flatMap((offset, m) => tenants.flatMap((t, i) => {
    if (offset === 0 && [2, 8, 12].includes(i)) return [];
    const rate = rooms.find(r => r.id === t.roomId)!.rate;
    return [{ id: `payment-${m}-${i}`, tenantId: t.id, amount: offset === 0 && i === 4 ? 1500 : rate, date: shiftedMonth(offset) + '-03', period: shiftedMonth(offset), method: i % 3 ? 'EFT' : 'Cash', reference: `RENT-${rooms.find(r => r.id === t.roomId)!.number}`, invoiceId: `INV-${shiftedMonth(offset).replace('-', '')}-${String(i + 1).padStart(3, '0')}` }];
  }));
  const clients = ['Themba Dube', 'Sarah Mokoena', 'James Phiri', 'Precious Mabuza', 'David Mhlongo', 'Grace Mashaba'].map((name, i) => ({ id: `client-${i + 1}`, name, email: name.toLowerCase().replace(' ', '.') + '@example.com', phone: `083 555 ${2000 + i}`, idNumber: '', address: ['Mabopane, Pretoria', 'Soshanguve, Pretoria', 'Pretoria West'][i % 3], notes: i === 1 ? 'Requested an extension until month end.' : '' }));
  return {
    version: 1, rooms, tenants, payments,
    maintenance: [
      { id: 'm1', roomId: 'room-3', title: 'Leaking bathroom tap', description: 'Tap continues to drip after closing. Plumber booked for inspection.', date: month + '-18', completedDate: '', cost: 0, priority: 'High', status: 'Open' },
      { id: 'm2', roomId: 'room-8', title: 'Replace door lock', description: 'New cylinder ordered. Tenant has a temporary key.', date: month + '-16', completedDate: '', cost: 350, priority: 'Medium', status: 'In progress' },
      { id: 'm3', roomId: 'room-13', title: 'Repaint room walls', description: 'Walls repainted and room inspected. Invoice filed.', date: month + '-05', completedDate: month + '-08', cost: 1250, priority: 'Low', status: 'Completed' },
      { id: 'm4', roomId: 'room-5', title: 'Replace light fitting', description: 'Installed an LED ceiling light.', date: shiftedMonth(-1) + '-20', completedDate: shiftedMonth(-1) + '-21', cost: 280, priority: 'Low', status: 'Completed' }
    ],
    complaints: [
      { id: 'c1', tenantId: 'tenant-2', title: 'Noise after quiet hours', description: 'Loud music from the courtyard after 22:00 on weekends.', date: month + '-19', status: 'Open', resolution: '' },
      { id: 'c2', tenantId: 'tenant-6', title: 'Shared kitchen cleaning', description: 'Kitchen is being left untidy. Discuss cleaning schedule with residents.', date: month + '-12', status: 'Investigating', resolution: 'A residents meeting has been scheduled.' },
      { id: 'c3', tenantId: 'tenant-1', title: 'Parking access blocked', description: 'Visitors parked in front of the entrance.', date: shiftedMonth(-1) + '-15', status: 'Resolved', resolution: 'Parking bays marked and tenants notified.' }
    ], clients,
    loans: [
      { id: 'loan-1', clientId: 'client-1', principal: 3000, totalDue: 3300, issued: month + '-01', due: month + '-28', promisedDate: '', payLater: false, notes: 'One payment due at month end.' },
      { id: 'loan-2', clientId: 'client-2', principal: 2000, totalDue: 2200, issued: shiftedMonth(-1) + '-15', due: month + '-15', promisedDate: month + '-31', payLater: true, notes: 'Agreed to pay after salary clears.' },
      { id: 'loan-3', clientId: 'client-3', principal: 5000, totalDue: 5500, issued: shiftedMonth(-1) + '-01', due: month + '-10', promisedDate: '', payLater: false, notes: 'Follow up on remaining balance.' },
      { id: 'loan-4', clientId: 'client-4', principal: 1500, totalDue: 1650, issued: month + '-10', due: shiftedMonth(1) + '-10', promisedDate: '', payLater: false, notes: '' },
      { id: 'loan-5', clientId: 'client-5', principal: 4000, totalDue: 4400, issued: shiftedMonth(-1) + '-01', due: month + '-05', promisedDate: '', payLater: false, notes: 'Paid in full.' },
      { id: 'loan-6', clientId: 'client-6', principal: 2500, totalDue: 2750, issued: month + '-05', due: month + '-30', promisedDate: '', payLater: false, notes: '' }
    ],
    repayments: [
      { id: 'rp1', loanId: 'loan-1', amount: 1000, date: month + '-18', method: 'EFT', reference: 'THEMBA-01' },
      { id: 'rp2', loanId: 'loan-3', amount: 2500, date: month + '-10', method: 'EFT', reference: 'JAMES-01' },
      { id: 'rp3', loanId: 'loan-5', amount: 4400, date: month + '-05', method: 'Cash', reference: 'DAVID-FINAL' },
      { id: 'rp4', loanId: 'loan-6', amount: 500, date: month + '-15', method: 'Cash', reference: '' }
    ], settings: { owner: 'T2PKs Administration', email: 'accounts@t2pks.example', phone: '012 555 0100', address: 'Pretoria, Gauteng, South Africa', autoInvoice: true }
  };
}
