# Sistema de Facturación

Sistema web de facturación completo y funcional para negocios reales: backend, frontend, base de datos y toda la lógica de negocio (facturación, inventario, caja, crédito, gastos, reportes, auditoría) están implementados y conectados de extremo a extremo — no es un prototipo ni una demo visual.

## Stack técnico

| Capa | Tecnología |
|---|---|
| Backend | Node.js + TypeScript + Express + Prisma ORM |
| Base de datos | PostgreSQL |
| Autenticación | JWT + bcrypt |
| Frontend | React + TypeScript + Vite + TailwindCSS |
| Estado / datos | Zustand + TanStack Query + Axios |
| Reportes | ExcelJS (Excel) + PDFKit (PDF) |
| Gráficas | Recharts |

## Estructura de carpetas

```
bot_telegram/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Modelo de datos completo
│   │   ├── migrations/          # Migraciones SQL versionadas
│   │   └── seed.ts              # Datos iniciales (roles, admin, catálogo de prueba)
│   ├── src/
│   │   ├── app.ts / server.ts   # Bootstrap de Express
│   │   ├── config/              # Env y cliente Prisma
│   │   ├── middlewares/         # Auth, permisos, validación, errores
│   │   ├── modules/             # Un módulo por dominio (routes/controller/service/validators)
│   │   │   ├── auth, users, roles
│   │   │   ├── clients, categories, products, inventory
│   │   │   ├── series, invoices, credit, cash, expenses
│   │   │   ├── dashboard, reports, company, audit
│   │   └── utils/                # Helpers compartidos (auditoría, paginación, permisos, PDF, etc.)
│   └── uploads/                  # Logos subidos (no versionado)
└── frontend/
    └── src/
        ├── api/                  # Cliente Axios + endpoints tipados por módulo
        ├── components/           # UI kit (tabla, modal, badge, etc.) y layout (sidebar/topbar)
        ├── pages/                 # Una página por módulo del menú lateral
        ├── store/                 # Auth y configuración de empresa (Zustand)
        └── types/                 # Tipos compartidos con el backend
```

## Módulos implementados

1. **Autenticación y usuarios**: login, logout, recuperación de contraseña, cambio de contraseña, activar/desactivar usuarios, último acceso, roles (Administrador, Facturación/Cajero, Supervisor, Contabilidad) con permisos granulares editables.
2. **Dashboard**: ventas del día/mes, facturas emitidas/anuladas, cobrado, pendiente, clientes, bajo inventario, gráfica de ventas, productos más vendidos, últimas facturas — todo con datos reales de la base de datos.
3. **Clientes**: CRUD completo, código autogenerado, búsqueda rápida.
4. **Productos y servicios / Categorías**: CRUD completo, SKU y código de barras, productos con o sin control de inventario.
5. **Inventario**: entradas, salidas, ajustes, kardex por producto, descuento y reintegro automático de existencias al facturar/anular.
6. **Facturación (POS)**: búsqueda de productos por nombre/SKU/código de barras, múltiples líneas, descuentos, impuestos, múltiples formas de pago (incluye pago combinado y crédito), correlativos automáticos por serie sin duplicados.
7. **Facturas**: listado con filtros, detalle, impresión/descarga en PDF (A4 y ticket térmico 80mm), anulación con motivo obligatorio, auditoría y reintegro de inventario.
8. **Cuentas por cobrar**: ventas al crédito, registro de abonos, historial de pagos, estados (pendiente/parcial/pagado/vencido).
9. **Caja**: apertura y cierre, registro automático de ventas por método de pago, ingresos/egresos manuales, reporte de cierre con diferencia.
10. **Gastos**: registro por categoría, método de pago y usuario.
11. **Reportes**: 17 reportes distintos (ventas, inventario, kardex, facturas anuladas, cuentas por cobrar, pagos, caja, gastos, utilidades, etc.) exportables a Excel y PDF.
12. **Configuración de empresa**: nombre, NIT, logo, moneda (Quetzales por defecto), impuesto, formato de factura, series/correlativos.
13. **Auditoría**: registro de toda operación relevante (login, creación, edición, anulación, movimientos de inventario, aperturas/cierres de caja, cambios de configuración) con datos anteriores/nuevos.

## Requisitos previos

- Node.js 18 o superior
- PostgreSQL 14 o superior (local o remoto)

## Instalación

### 1. Base de datos

Crea una base de datos vacía en PostgreSQL, por ejemplo:

```bash
createdb facturacion
```

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Edita `backend/.env` y ajusta al menos `DATABASE_URL` con tus credenciales de PostgreSQL, y `JWT_SECRET` con un valor propio y seguro. El resto de variables (SMTP, puerto, etc.) son opcionales.

```bash
npm install
npm run prisma:migrate     # crea las tablas en tu base de datos
npm run prisma:seed        # crea roles, permisos, usuario admin y datos de prueba
npm run dev                # levanta la API en http://localhost:4000
```

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev                # levanta la app en http://localhost:5173
```

El frontend está configurado para redirigir `/api` y `/uploads` al backend en `localhost:4000` (ver `frontend/vite.config.ts`), por lo que no se requiere configuración adicional en desarrollo.

Abre `http://localhost:5173` en tu navegador.

## Credenciales iniciales

Creadas automáticamente por `npm run prisma:seed`:

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin123!` | Administrador (acceso total) |
| `cajero` | `Cajero123!` | Facturación/Cajero |

**Cambia estas contraseñas antes de usar el sistema en producción.**

## Scripts útiles (backend)

- `npm run dev` — API en modo desarrollo con recarga automática
- `npm run build` / `npm start` — compilar y ejecutar en producción
- `npm run prisma:studio` — explorador visual de la base de datos
- `npm run prisma:migrate` — crear/aplicar migraciones en desarrollo
- `npm run prisma:deploy` — aplicar migraciones existentes (producción)
- `npm run prisma:seed` — volver a sembrar datos iniciales (usa upsert, es seguro re-ejecutarlo)

## Scripts útiles (frontend)

- `npm run dev` — servidor de desarrollo con recarga en caliente
- `npm run build` — build de producción (`dist/`)
- `npm run preview` — previsualizar el build de producción

## Despliegue en producción

1. Backend: configura `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (dominio del frontend) y, opcionalmente, SMTP para recuperación de contraseña y envío de facturas por correo. Ejecuta `npm run build && npm run prisma:deploy && npm start`.
2. Frontend: ejecuta `npm run build` y sirve el contenido de `frontend/dist` con tu servidor web/CDN, apuntando las rutas `/api` y `/uploads` al backend.
3. El primer despliegue requiere ejecutar `npm run prisma:seed` una vez para crear roles, permisos y el usuario administrador inicial.

## Seguridad implementada

- Contraseñas con hash bcrypt, nunca se almacenan ni se devuelven en texto plano.
- Autenticación JWT con expiración configurable.
- Autorización por permisos granulares validada en el backend en cada endpoint (nunca solo en el frontend).
- Validación de entrada con Zod en todas las rutas mutables.
- Protección contra SQL injection mediante Prisma (queries parametrizadas).
- Cabeceras de seguridad HTTP (Helmet), rate limiting en login y en la API en general.
- Validación de tipo/tamaño de archivos en la carga de logo.
- Manejo global y centralizado de errores, sin fugas de detalles internos al cliente.
- Auditoría de operaciones sensibles con usuario, fecha, acción y datos anteriores/nuevos.

## Notas de diseño de negocio

- Las facturas nunca se eliminan físicamente: se anulan (estado `ANULADA`), lo que reintegra el inventario y exige un motivo.
- Los correlativos de factura son atómicos por serie (transacción de base de datos), por lo que no pueden duplicarse aun con múltiples cajeros facturando simultáneamente.
- La venta de un producto descuenta inventario automáticamente; anular la factura lo reintegra. Por defecto no se permite vender más de la existencia disponible — esto es configurable desde **Configuración → Permitir vender más cantidad de la disponible**.
- La moneda por defecto es el Quetzal guatemalteco (Q / GTQ), configurable desde el módulo de Configuración de empresa.
