import { api } from './client';
import type {
  AuditLog,
  CashSession,
  CashSessionSummary,
  Category,
  Client,
  CompanyConfig,
  CreditAccount,
  DashboardData,
  Expense,
  InventoryMovement,
  Invoice,
  PaginatedResult,
  Permission,
  Product,
  Role,
  Series,
  User,
} from '../types';

// ---------- Auth ----------
export const authApi = {
  login: (username: string, password: string) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// ---------- Users ----------
export const usersApi = {
  list: (params: Record<string, string>) => api.get<PaginatedResult<User>>('/users', { params }),
  get: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: unknown) => api.post<User>('/users', data),
  update: (id: string, data: unknown) => api.put<User>(`/users/${id}`, data),
  setActive: (id: string, active: boolean) => api.patch<User>(`/users/${id}/active`, { active }),
  resetPassword: (id: string, password: string) => api.post(`/users/${id}/reset-password`, { password }),
};

// ---------- Roles ----------
export const rolesApi = {
  list: () => api.get<Role[]>('/roles'),
  permissions: () => api.get<Permission[]>('/roles/permissions'),
  create: (data: unknown) => api.post<Role>('/roles', data),
  update: (id: string, data: unknown) => api.put<Role>(`/roles/${id}`, data),
  updatePermissions: (id: string, permissionIds: string[]) =>
    api.put<Role>(`/roles/${id}/permissions`, { permissionIds }),
};

// ---------- Clients ----------
export const clientsApi = {
  list: (params: Record<string, string>) => api.get<PaginatedResult<Client>>('/clients', { params }),
  search: (q: string) => api.get<Client[]>('/clients/search', { params: { q } }),
  get: (id: string) => api.get<Client>(`/clients/${id}`),
  create: (data: unknown) => api.post<Client>('/clients', data),
  update: (id: string, data: unknown) => api.put<Client>(`/clients/${id}`, data),
  setActive: (id: string, active: boolean) => api.patch<Client>(`/clients/${id}/active`, { active }),
};

// ---------- Categories ----------
export const categoriesApi = {
  list: (activeOnly = false) => api.get<Category[]>('/categories', { params: activeOnly ? { active: 'true' } : {} }),
  create: (data: unknown) => api.post<Category>('/categories', data),
  update: (id: string, data: unknown) => api.put<Category>(`/categories/${id}`, data),
  setActive: (id: string, active: boolean) => api.patch<Category>(`/categories/${id}/active`, { active }),
};

// ---------- Products ----------
export const productsApi = {
  list: (params: Record<string, string>) => api.get<PaginatedResult<Product>>('/products', { params }),
  search: (q: string) => api.get<Product[]>('/products/search', { params: { q } }),
  get: (id: string) => api.get<Product>(`/products/${id}`),
  byBarcode: (barcode: string) => api.get<Product>(`/products/barcode/${barcode}`),
  create: (data: unknown) => api.post<Product>('/products', data),
  update: (id: string, data: unknown) => api.put<Product>(`/products/${id}`, data),
  setActive: (id: string, active: boolean) => api.patch<Product>(`/products/${id}/active`, { active }),
};

// ---------- Inventory ----------
export const inventoryApi = {
  listMovements: (params: Record<string, string>) =>
    api.get<PaginatedResult<InventoryMovement>>('/inventory/movements', { params }),
  kardex: (productId: string) => api.get(`/inventory/kardex/${productId}`),
  register: (data: unknown) => api.post<InventoryMovement>('/inventory/movements', data),
};

// ---------- Series ----------
export const seriesApi = {
  list: () => api.get<Series[]>('/series'),
  create: (name: string) => api.post<Series>('/series', { name }),
  setActive: (id: string, active: boolean) => api.patch<Series>(`/series/${id}/active`, { active }),
};

// ---------- Invoices ----------
export const invoicesApi = {
  list: (params: Record<string, string>) => api.get<PaginatedResult<Invoice>>('/invoices', { params }),
  get: (id: string) => api.get<Invoice>(`/invoices/${id}`),
  create: (data: unknown) => api.post<Invoice>('/invoices', data),
  cancel: (id: string, reason: string) => api.post<Invoice>(`/invoices/${id}/cancel`, { reason }),
  pdfPath: (id: string, format: 'A4' | 'THERMAL' = 'A4') => `/invoices/${id}/pdf?format=${format}`,
};

// ---------- Credit ----------
export const creditApi = {
  list: (params: Record<string, string>) => api.get<PaginatedResult<CreditAccount>>('/credit-accounts', { params }),
  get: (id: string) => api.get<CreditAccount>(`/credit-accounts/${id}`),
  registerPayment: (id: string, data: unknown) => api.post(`/credit-accounts/${id}/payments`, data),
};

// ---------- Cash ----------
export const cashApi = {
  list: (params: Record<string, string>) => api.get<PaginatedResult<CashSession>>('/cash-sessions', { params }),
  current: () => api.get<CashSession | null>('/cash-sessions/current'),
  summary: (id: string) => api.get<CashSessionSummary>(`/cash-sessions/${id}/summary`),
  open: (openingAmount: number, notes?: string) => api.post<CashSession>('/cash-sessions/open', { openingAmount, notes }),
  close: (id: string, breakdown: { denomination: number; quantity: number }[], notes?: string) =>
    api.post<CashSession>(`/cash-sessions/${id}/close`, { breakdown, notes }),
  manualMovement: (id: string, data: unknown) => api.post(`/cash-sessions/${id}/movements`, data),
};

// ---------- Expenses ----------
export const expensesApi = {
  list: (params: Record<string, string>) => api.get<PaginatedResult<Expense>>('/expenses', { params }),
  create: (data: unknown) => api.post<Expense>('/expenses', data),
};

// ---------- Dashboard ----------
export const dashboardApi = {
  get: () => api.get<DashboardData>('/dashboard'),
};

// ---------- Reports ----------
export const reportsApi = {
  types: () => api.get<string[]>('/reports'),
  get: (type: string, params: Record<string, string>) => api.get(`/reports/${type}`, { params }),
  exportPath: (type: string, format: 'xlsx' | 'pdf', params: Record<string, string>) => {
    const search = new URLSearchParams({ ...params, format }).toString();
    return `/reports/${type}/export?${search}`;
  },
};

// ---------- Company ----------
export const companyApi = {
  get: () => api.get<CompanyConfig>('/company-config'),
  update: (data: unknown) => api.put<CompanyConfig>('/company-config', data),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return api.post<CompanyConfig>('/company-config/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// ---------- Audit ----------
export const auditApi = {
  list: (params: Record<string, string>) => api.get<PaginatedResult<AuditLog>>('/audit-logs', { params }),
};
