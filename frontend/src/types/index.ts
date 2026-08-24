export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions: { permission: Permission }[];
}

export interface Permission {
  id: string;
  code: string;
  module: string;
  description?: string | null;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roleId: string;
  role: { id: string; name: string };
}

export interface Client {
  id: string;
  code: string;
  name: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  contact?: string | null;
  notes?: string | null;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  _count?: { products: number };
}

export type ProductType = 'PRODUCTO' | 'SERVICIO';

export interface Product {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  category?: Category | null;
  type: ProductType;
  salePrice: string | number;
  costPrice: string | number;
  taxRate: string | number;
  trackInventory: boolean;
  stock: string | number;
  minStock: string | number;
  unit: string;
  active: boolean;
}

export type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export interface InventoryMovement {
  id: string;
  productId: string;
  product?: { id: string; name: string; sku: string; unit: string };
  type: MovementType;
  quantity: string | number;
  balanceAfter: string | number;
  reason: string;
  reference?: string | null;
  user?: { id: string; name: string };
  createdAt: string;
}

export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CHEQUE' | 'CREDITO' | 'COMBINADO';
export type InvoiceStatus = 'EMITIDA' | 'PAGADA' | 'PENDIENTE' | 'PARCIAL' | 'ANULADA';

export interface InvoiceDetail {
  id: string;
  productId: string;
  product: Product;
  quantity: string | number;
  unitPrice: string | number;
  discount: string | number;
  taxRate: string | number;
  taxAmount: string | number;
  lineTotal: string | number;
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: string | number;
  reference?: string | null;
  createdAt: string;
}

export interface CreditAccount {
  id: string;
  invoiceId: string;
  clientId: string;
  totalAmount: string | number;
  paidAmount: string | number;
  balance: string | number;
  dueDate: string;
  status: string;
  displayStatus?: string;
  client?: Client;
  invoice?: { id: string; fullNumber: string; createdAt: string };
}

export interface Invoice {
  id: string;
  fullNumber: string;
  number: number;
  seriesId: string;
  clientId: string;
  client: Client;
  userId: string;
  user: { id: string; name: string; username?: string };
  subtotal: string | number;
  discount: string | number;
  tax: string | number;
  total: string | number;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: { id: string; name: string } | null;
  createdAt: string;
  details?: InvoiceDetail[];
  payments?: Payment[];
  creditAccount?: CreditAccount | null;
}

export interface Series {
  id: string;
  name: string;
  currentNumber: number;
  active: boolean;
}

export interface CompanyConfig {
  id: string;
  tradeName: string;
  legalName: string;
  taxId: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  currency: string;
  currencySymbol: string;
  defaultTaxRate: string | number;
  country: string;
  invoiceFormat: string;
  allowOversell: boolean;
}

export interface CashSession {
  id: string;
  userId: string;
  user?: { id: string; name: string };
  openedAt: string;
  closedAt?: string | null;
  openingAmount: string | number;
  expectedAmount?: string | number | null;
  declaredAmount?: string | number | null;
  difference?: string | number | null;
  status: 'ABIERTA' | 'CERRADA';
  notes?: string | null;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: string | number;
  paymentMethod: PaymentMethod;
  user?: { id: string; name: string };
  referenceDoc?: string | null;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: { id: string; name: string; username: string } | null;
  action: string;
  module: string;
  recordId?: string | null;
  oldData?: unknown;
  newData?: unknown;
  createdAt: string;
}

export interface DashboardData {
  salesToday: number;
  salesMonth: number;
  invoicesIssuedToday: number;
  invoicesVoidedToday: number;
  totalCollectedToday: number;
  totalPending: number;
  clientsRegistered: number;
  lowStockProducts: Product[];
  lowStockCount: number;
  salesChart: { date: string; total: number }[];
  topProducts: { productId: string; name: string; sku: string; quantity: number; total: number }[];
  latestInvoices: Invoice[];
}
