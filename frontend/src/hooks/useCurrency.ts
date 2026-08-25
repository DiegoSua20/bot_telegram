import { useCompanyStore, formatMoney } from '../store/companyStore';

export function useCurrency() {
  const symbol = useCompanyStore((s) => s.config?.currencySymbol ?? 'Q');
  return { symbol, format: (value: string | number) => formatMoney(value, symbol) };
}
