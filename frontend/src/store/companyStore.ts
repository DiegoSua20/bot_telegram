import { create } from 'zustand';
import type { CompanyConfig } from '../types';

interface CompanyState {
  config: CompanyConfig | null;
  setConfig: (config: CompanyConfig) => void;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}));

export function formatMoney(value: string | number, symbol = 'Q') {
  const n = typeof value === 'string' ? Number(value) : value;
  return `${symbol} ${n.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
