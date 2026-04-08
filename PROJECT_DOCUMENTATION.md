# Lucky Boba POS - Project Documentation

## Overview

**Lucky Boba POS** is a full-stack Point of Sale system designed for bubble tea shops. It features role-based access control, real-time sales processing, inventory management, and offline capabilities through Progressive Web App (PWA) technology.

---

## Technology Stack

### Backend
- **Framework:** Laravel 12 (PHP 8.3+)
- **API Authentication:** Laravel Sanctum
- **Database:** SQLite (default) / MySQL compatible
- **Caching:** Redis (via Predis)
- **Excel Export:** Maatwebsite Excel
- **Performance:** Laravel Octane for high-performance serving
- **Queue Processing:** Laravel Queue with concurrent workers

### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 7
- **Routing:** React Router DOM 7
- **Styling:** TailwindCSS 4
- **State Management:** Zustand
- **Icons:** Lucide React
- **Charts:** Recharts
- **Virtual Keyboard:** React Simple Keyboard
- **Excel Operations:** XLSX library
- **HTTP Client:** Axios
- **PWA:** Vite Plugin PWA with Workbox

---

## Project Structure

```
luckyboba-pos/
├── .github/                # GitHub workflows and templates
├── backend/                # Laravel API backend
│   ├── app/
│   │   ├── Helpers/        # Custom helper classes
│   │   ├── Http/
│   │   │   ├── Controllers/   # API & Auth controllers
│   │   │   ├── Middleware/    # Request middleware
│   │   │   └── Requests/      # Form request validation
│   │   ├── Imports/        # Import handlers
│   │   ├── Models/         # Eloquent models (42 models)
│   │   ├── Observers/      # Model observers
│   │   ├── Providers/      # Service providers
│   │   ├── Services/       # Business logic services
│   │   └── Traits/         # Shared traits
│   ├── bootstrap/          # Application bootstrap
│   ├── config/             # Laravel configuration
│   ├── database/
│   │   ├── factories/      # Model factories
│   │   ├── migrations/     # Database migrations (118 files)
│   │   └── seeders/        # Database seeders (19 files)
│   ├── public/             # Public assets
│   ├── resources/          # Views (not used for API)
│   ├── routes/
│   │   ├── api.php         # API routes (main)
│   │   ├── auth.php        # Authentication routes
│   │   ├── console.php     # Console commands
│   │   └── web.php         # Web routes
│   ├── storage/            # Logs, cache, uploads
│   └── tests/              # PHPUnit tests
├── frontend/               # React SPA frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── assets/         # Images, fonts, etc.
│   │   ├── components/     # React components (role-based)
│   │   ├── context/        # React contexts (Auth, Toast)
│   │   ├── data/           # Static data
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page-level components
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── App.tsx             # Root application component
│   ├── main.tsx            # Entry point
│   ├── routes.tsx          # Route definitions
│   └── vite-env.d.ts       # Vite type declarations
├── .env                    # Environment configuration
└── README.md               # Project documentation
```

---

## Backend Architecture

### Models (42 entities)

**Core Business Models:**
- `User` - User accounts with role-based access
- `Branch` - Store/branch locations
- `PosDevice` - Registered POS devices per branch
- `Sale` / `SaleItem` - Sales transactions
- `Receipt` - Receipt records

**Menu & Products:**
- `MenuItem` - Menu items/products
- `Category` / `SubCategory` - Product categorization
- `CategoryDrink` - Drink-specific categories
- `Cup` - Cup size definitions
- `SugarLevel` - Sugar level options
- `AddOn` - Add-on items
- `Bundle` / `BundleItem` - Product bundles

**Inventory:**
- `RawMaterial` - Raw material stock
- `RawMaterialLog` - Material usage logs
- `Recipe` / `RecipeItem` - Product recipes
- `StockMovement` - Stock transaction records
- `StockTransfer` / `StockTransferItem` - Branch transfers
- `PurchaseOrder` / `PurchaseOrderItem` - Purchase orders
- `Supplier` - Supplier information
- `ItemSerial` - Serial number tracking

**Financial:**
- `CashCount` - Cash drawer counts
- `CashTransaction` - Cash in/out transactions
- `Expense` - Business expenses
- `Discount` - Discount rules
- `Card` / `UserCard` / `CardUsageLog` - Loyalty cards
- `Voucher` - Voucher system

**Administration:**
- `AuditLog` - System audit logs
- `VoidRequest` - Void/void request tracking
- `ZReading` - End-of-day Z-readings
- `Setting` - System settings

### Controllers

**API Controllers (42 endpoints):**

| Controller | Purpose |
|------------|---------|
| `AuthController` | Authentication (login/logout/register) |
| `BranchController` | Branch CRUD & management |
| `MenuController` | Menu operations |
| `MenuItemController` | Menu item CRUD |
| `SalesController` | Sales processing |
| `SalesDashboardController` | Sales analytics |
| `InventoryController` | Stock management |
| `InventoryDashboardController` | Inventory analytics |
| `ReportController` | Various reports |
| `SuperAdminReportController` | Admin reports |
| `CashCountController` | Cash drawer operations |
| `CashTransactionController` | Cash flow management |
| `ReceiptController` | Receipt generation |
| `PosDeviceController` | Device registration |
| `BundleController` | Bundle management |
| `DiscountController` | Discount rules |
| `CardController` / `CardPurchaseController` | Loyalty system |
| `AuditLogController` | Audit trail |
| `SettingsController` | System settings |
| `ExpenseController` | Expense tracking |
| `CategoryController` / `SubCategoryController` | Categories |
| `SugarLevelController` / `CupController` | Product options |
| `AddOnController` / `MenuItemOptionController` | Add-ons |
| `RawMaterialController` / `RecipeController` | Recipes & materials |
| `StockTransferController` | Inter-branch transfers |
| `PurchaseOrderController` | Purchasing |
| `SupplierController` | Supplier management |
| `ItemSerialController` / `ItemCheckerController` | Serial tracking |
| `InventoryReportController` / `ItemsReportController` | Reports |
| `VoucherController` | Voucher management |
| `NotificationController` | Push notifications |
| `UploadController` | File uploads |
| `BackupController` | Database backups |
| `OnlineOrderController` | Online order integration |

### Services (6 services)

| Service | Description |
|---------|-------------|
| `DashboardService` | Dashboard data aggregation |
| `SalesDashboardService` | Sales analytics & reporting |
| `GlobalCacheService` | Application-wide caching |
| `CashierService` | Cashier operations helper |
| `UserService` | User management logic |
| `ItemsReportService` | Item-level reporting |

### Routes

All API endpoints are defined in `/backend/routes/api.php` (26KB) with the `/api` prefix.

---

## Frontend Architecture

### Pages (10 main pages)

| Page | Path | Access |
|------|------|--------|
| `Login` | `/login` | Public |
| `Dashboard` | `/dashboard`, `/cashier` | Admin, Cashier |
| `SalesOrder` | `/pos`, `/cashier/pos` | Cashier, Manager, Superadmin |
| `SuperAdminDashboard` | `/super-admin` | Super Admin |
| `BranchManagerDashboard` | `/branch-manager` | Branch Manager |
| `TeamLeaderDashboard` | `/team-leader` | Team Leader |
| `SupervisorDashboard` | `/supervisor` | Supervisor |
| `ITDashboard` | `/it-admin` | IT Admin |
| `PosDeviceManager` | `/pos-devices` | Super Admin |
| `Calendar` | `/calendar` | Admin, Branch Manager |
| `OnlineOrdersPage` | `/cashier/online-orders` | Cashier |

### Component Organization

**Role-Based Components:**

```
components/
├── AuthLoader.tsx           # Authentication loading state
├── BranchManager/           # Branch Manager UI
│   ├── BranchManagerSidebar.tsx
│   ├── BranchManagerTopNav.tsx
│   ├── BranchManagerAuditLogsTab.tsx
│   ├── FloorOps/
│   ├── Home/
│   ├── Inventory/
│   ├── MenuItems/
│   ├── SalesReport/
│   └── Settings/
├── Cashier/                 # Cashier UI
│   ├── Sidebar.tsx
│   ├── TopNavbar.tsx
│   ├── Expense.tsx
│   ├── OrderTypeModal.tsx
│   ├── Inventory/
│   ├── MenuItems/
│   ├── SalesOrder/
│   │   ├── CashCount.tsx
│   │   ├── CashDrop.tsx
│   │   ├── CashIn.tsx
│   │   ├── OnlineOrdersPage.tsx
│   │   └── SearchReceipts.tsx
│   ├── SalesOrderComponents/
│   ├── SalesReport/
│   └── Settings/
├── NewSuperAdmin/           # Super Admin UI
│   ├── SuperAdminSidebar.tsx
│   ├── SuperAdminTopBar.tsx
│   └── Sidebar/
├── Supervisor/              # Supervisor UI (3 components)
├── TeamLeader/              # Team Leader UI (11 components)
├── DeviceGate.tsx           # Device authorization
├── ErrorBoundary.tsx        # Error handling
├── ErrorFallback.tsx        # Error display
├── ProtectedRoute.tsx       # Route protection
├── PublicRoute.tsx          # Public route handler
├── PWAUpdateBanner.tsx      # PWA update prompt
└── Toast.tsx                # Toast notifications
```

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Authentication state |
| `useAuthRedirect` | Role-based redirects |
| `useBranches` | Branch data management |
| `useDeviceCheck` | POS device validation |
| `useOfflineQueue` | Offline request queue |
| `useServiceWorker` | PWA service worker |
| `useToast` | Toast notifications |
| `useUsers` | User data management |
| `useApiActivityTracker` | API monitoring |

### Services

| Service | Description |
|---------|-------------|
| `api.ts` | Axios instance & interceptors |
| `BranchService.ts` | Branch API calls |
| `UserService.ts` | User API calls |
| `reportService.ts` | Report API calls |

### Types

- `analytics.ts` - Analytics data structures
- `branch.type.ts` - Branch types
- `branchManagerUser.ts` - Branch manager types
- `cash-count.ts` - Cash count types
- `dashboard.ts` - Dashboard types
- `transactions.ts` - Transaction types
- `user.ts` - User types
- `index.ts` - Type exports

### Utilities

| Utility | Purpose |
|---------|---------|
| `authHelpers.ts` | Authentication helpers |
| `cache.ts` | Client-side caching |
| `componentRegistry.ts` | Component registration |
| `deviceId.ts` | Device identification |
| `prefetch.ts` | Data prefetching |
| `roleRoutes.ts` | Role-route mappings |

---

## Role-Based Access Control

| Role | Permissions | Dashboard |
|------|-------------|-----------|
| **Super Admin** | Full system access, POS devices, all branches | SuperAdminDashboard |
| **System Admin** | Dashboard, Calendar access | Dashboard |
| **Branch Manager** | Branch operations, POS, Calendar | BranchManagerDashboard |
| **Supervisor** | Supervisor operations | SupervisorDashboard |
| **Team Leader** | Team management | TeamLeaderDashboard |
| **IT Admin** | IT operations | ITDashboard |
| **Cashier** | POS, Sales, Online Orders | Dashboard (Cashier view) |

---

## Progressive Web App (PWA)

**Configuration:** `frontend/vite.config.ts`

- **App Name:** Lucky Boba POS
- **Display Mode:** Standalone
- **Orientation:** Landscape (for POS screens)
- **Theme Color:** #3b2063
- **Background Color:** #f4f2fb

**Caching Strategy:**
- Menu data: Stale-while-revalidate (24h cache)
- Categories: Stale-while-revalidate (24h cache)
- Sales/Receipts: Network-only (real-time)
- General API: Network-first (2h cache)

**Offline Capabilities:**
- Offline queue for sales transactions (`useOfflineQueue`)
- Cached menu and category data
- Automatic sync when connection restored

---

## API Routes Summary

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `POST /api/register` - User registration
- `GET /api/user` - Current user

### Sales
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `GET /api/sales/{id}` - Get sale details
- `POST /api/void` - Void transaction

### Inventory
- `GET /api/inventory` - Stock levels
- `POST /api/inventory` - Update stock
- `GET /api/stock-transfers` - Transfer list
- `POST /api/stock-transfers` - Create transfer

### Menu
- `GET /api/menu` - Menu items
- `GET /api/categories` - Categories
- `GET /api/add-ons` - Add-ons
- `GET /api/discounts` - Active discounts
- `GET /api/bundles` - Product bundles

### Reports
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/items` - Items report
- `GET /api/audit-logs` - Audit trail

---

## Development Commands

### Backend
```bash
cd backend

# Setup
composer setup          # Full installation

# Development
composer dev            # Start dev server + queue + logs + vite

# Testing
composer test           # Run PHPUnit tests
```

### Frontend
```bash
cd frontend

# Development
npm run dev             # Start Vite dev server

# Build
npm run build           # Production build

# Preview
npm run preview         # Preview production build

# Lint
npm run lint            # ESLint check
```

---

## Database Schema

**Migration Files (118 total):**

Key tables:
- `users` - User accounts
- `branches` - Branch locations
- `pos_devices` - Registered devices
- `menu_items` - Products
- `categories` / `sub_categories` - Taxonomy
- `sales` / `sale_items` - Transactions
- `receipts` - Receipt records
- `raw_materials` / `recipes` - Inventory
- `stock_transfers` - Inter-branch transfers
- `purchase_orders` - Procurement
- `cash_counts` / `cash_transactions` - Cash management
- `cards` / `user_cards` - Loyalty system
- `audit_logs` - Audit trail
- `settings` - System configuration

**Seeders (19 total):**

Includes seeders for users, branches, menu items, categories, POS devices, raw materials, and test data.

---

## Configuration Files

### Backend Config
- `app.php` - Application settings
- `auth.php` - Authentication
- `cache.php` - Caching (Redis)
- `cors.php` - CORS settings
- `database.php` - Database connections
- `excel.php` - Excel export settings
- `filesystems.php` - Storage
- `logging.php` - Logging
- `mail.php` - Email
- `octane.php` - Octane settings
- `queue.php` - Queue workers
- `sanctum.php` - API tokens
- `services.php` - External services
- `session.php` - Sessions

### Frontend Config
- `vite.config.ts` - Vite + PWA configuration
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` - TypeScript
- `tailwind.config.js` - TailwindCSS
- `postcss.config.js` - PostCSS
- `eslint.config.js` - ESLint rules

---

## Key Features

1. **Multi-Role System** - 7 distinct user roles with tailored interfaces
2. **Real-time POS** - Fast sales processing with offline queue
3. **Inventory Management** - Stock tracking, transfers, recipes
4. **Loyalty Program** - Card-based customer rewards
5. **Analytics Dashboard** - Sales, inventory, and operational reports
6. **Audit Logging** - Complete activity tracking
7. **Multi-Branch** - Support for multiple store locations
8. **Device Management** - POS device registration and authorization
9. **Bundle & Discount System** - Flexible pricing rules
10. **Online Orders** - Integration with online ordering
11. **PWA Support** - Works offline, installable app
12. **Excel Export** - Report export functionality

---

## File Statistics

| Component | Count |
|-----------|-------|
| Backend Models | 42 |
| Backend Controllers | 51 |
| Backend Services | 6 |
| Backend Migrations | 118 |
| Backend Seeders | 19 |
| Frontend Pages | 10 |
| Frontend Components | 100+ |
| Frontend Hooks | 9 |
| Frontend Types | 8 |
| Frontend Services | 4 |
| Frontend Utils | 6 |

---

## Environment Variables

### Backend (.env)
```
APP_NAME=LuckyBobaPOS
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

CACHE_STORE=redis
QUEUE_CONNECTION=redis

SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_DOMAIN=localhost
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api
```

---

## License

This project is proprietary software for Lucky Boba business operations.
