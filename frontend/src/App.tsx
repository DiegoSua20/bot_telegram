import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PERMISSIONS } from './constants/permissions';

import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { KardexPage } from './pages/KardexPage';
import { InvoicingPage } from './pages/InvoicingPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { CreditAccountsPage } from './pages/CreditAccountsPage';
import { CreditAccountDetailPage } from './pages/CreditAccountDetailPage';
import { CashPage } from './pages/CashPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { CompanyConfigPage } from './pages/CompanyConfigPage';
import { AuditPage } from './pages/AuditPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.DASHBOARD_VIEW]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/facturacion"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.INVOICES_CREATE]}>
              <InvoicingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/facturas"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.INVOICES_VIEW]}>
              <InvoicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/facturas/:id"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.INVOICES_VIEW]}>
              <InvoiceDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.CLIENTS_MANAGE]}>
              <ClientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categorias"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.CATEGORIES_MANAGE]}>
              <CategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/productos"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.PRODUCTS_MANAGE]}>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_MANAGE]}>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario/kardex/:productId"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_MANAGE]}>
              <KardexPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cuentas-por-cobrar"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.CREDIT_VIEW, PERMISSIONS.CREDIT_MANAGE]}>
              <CreditAccountsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cuentas-por-cobrar/:id"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.CREDIT_VIEW, PERMISSIONS.CREDIT_MANAGE]}>
              <CreditAccountDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caja"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.CASH_VIEW, PERMISSIONS.CASH_MANAGE]}>
              <CashPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gastos"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.EXPENSES_VIEW, PERMISSIONS.EXPENSES_MANAGE]}>
              <ExpensesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reportes"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.REPORTS_VIEW]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE, PERMISSIONS.ROLES_MANAGE]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auditoria"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.AUDIT_VIEW]}>
              <AuditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracion"
          element={
            <ProtectedRoute permissions={[PERMISSIONS.COMPANY_MANAGE]}>
              <CompanyConfigPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
