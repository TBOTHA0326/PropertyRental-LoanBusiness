import { createContext, useContext } from 'react';
export type ModalState = { type: 'tenant' | 'tenant-detail' | 'room' | 'payment' | 'invoice' | 'maintenance' | 'complaint' | 'client' | 'client-detail' | 'loan' | 'loan-detail' | 'repayment' | 'defer'; id?: string };
export const AppContext = createContext<{ open: (modal: ModalState) => void; notify: (message: string) => void; navigate: (path: string) => void }>({ open: () => {}, notify: () => {}, navigate: () => {} });
export const useApp = () => useContext(AppContext);
