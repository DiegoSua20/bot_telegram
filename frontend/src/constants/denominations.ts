export interface Denomination {
  value: number;
  kind: 'billete' | 'moneda';
}

// Denominaciones de Quetzales (GTQ) en circulacion.
export const DENOMINATIONS: Denomination[] = [
  { value: 200, kind: 'billete' },
  { value: 100, kind: 'billete' },
  { value: 50, kind: 'billete' },
  { value: 20, kind: 'billete' },
  { value: 10, kind: 'billete' },
  { value: 5, kind: 'billete' },
  { value: 1, kind: 'moneda' },
  { value: 0.5, kind: 'moneda' },
  { value: 0.25, kind: 'moneda' },
  { value: 0.1, kind: 'moneda' },
  { value: 0.05, kind: 'moneda' },
  { value: 0.01, kind: 'moneda' },
];
