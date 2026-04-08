/**
 * globalCache.tsx — CacheProvider for LuckyBoba POS
 * Only exports the CacheProvider component to satisfy react-refresh.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { CacheContext } from "./CacheContext";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Branch          { id: number; name: string; [k: string]: unknown }
export interface Category        { id: number; name: string; [k: string]: unknown }
export interface SubCategory     { id: number; name: string; category_id: number; [k: string]: unknown }
export interface MenuItem        { id: number; name: string; category_id: number; sub_category_id?: number; price: number; is_active: 0 | 1; [k: string]: unknown }
export interface Discount        { id: number; name: string; is_active: 0 | 1; [k: string]: unknown }
export interface Voucher         { id: number; code: string; is_active: 0 | 1; [k: string]: unknown }
export interface Sale            { id: number; branch_id: number; total: number; created_at: string; [k: string]: unknown }
export interface SaleItem        { id: number; sale_id: number; menu_item_id: number; quantity: number; price: number; [k: string]: unknown }
export interface Receipt         { id: number; sale_id: number; [k: string]: unknown }
export interface CashTransaction { id: number; branch_id: number; amount: number; [k: string]: unknown }
export interface CashCount       { id: number; branch_id: number; [k: string]: unknown }
export interface PurchaseOrder   { id: number; status: string; [k: string]: unknown }
export interface StockTransaction{ id: number; [k: string]: unknown }
export interface ItemSerial      { id: number; status: string; [k: string]: unknown }
export interface Expense         { id: number; amount: number; [k: string]: unknown }
export interface User            { id: number; name: string; email: string; [k: string]: unknown }
export interface Setting         { id: number; key: string; value: unknown; [k: string]: unknown }
export interface ZReading        { id: number; [k: string]: unknown }
export interface AuditLog        { id: number; [k: string]: unknown }

export type Row = Record<string, unknown>;

export interface CacheStore {
  branches:           Branch[];
  categories:         Category[];
  sub_categories:     SubCategory[];
  menu_items:         MenuItem[];
  discounts:          Discount[];
  vouchers:           Voucher[];
  sales:              Sale[];
  sale_items:         SaleItem[];
  receipts:           Receipt[];
  cash_transactions:  CashTransaction[];
  cash_counts:        CashCount[];
  purchase_orders:    PurchaseOrder[];
  stock_transactions: StockTransaction[];
  item_serials:       ItemSerial[];
  expenses:           Expense[];
  users:              User[];
  settings:           Setting[];
  z_readings:         ZReading[];
  audit_logs:         AuditLog[];
}

export type TableName = keyof CacheStore;

export interface CacheCtx {
  store:    CacheStore;
  loading:  boolean;
  error:    string | null;
  ready:    boolean;

  all:     <T = Row>(table: TableName) => T[];
  getById: <T = Row>(table: TableName, id: number) => T | undefined;
  find:    <T = Row>(table: TableName, fn: (r: T) => boolean) => T[];
  findOne: <T = Row>(table: TableName, fn: (r: T) => boolean) => T | undefined;

  menuItemsByCategory:     (categoryId: number)    => MenuItem[];
  menuItemsBySubCategory:  (subCategoryId: number) => MenuItem[];
  subCategoriesByCategory: (categoryId: number)    => SubCategory[];
  saleItems:               (saleId: number)        => SaleItem[];
  salesByBranch:           (branchId: number)      => Sale[];
  activeDiscounts:         ()                      => Discount[];
  activeVouchers:          ()                      => Voucher[];
  setting:                 (key: string)           => unknown;

  insert:  <T extends Row>(table: TableName, data: Partial<T>) => Promise<T>;
  update:  <T extends Row>(table: TableName, id: number, data: Partial<T>) => Promise<void>;
  remove:  (table: TableName, id: number) => Promise<void>;

  reloadTable: (table: TableName) => Promise<void>;
  reloadAll:   () => Promise<void>;
}

// ─── Config ────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const AUTH_TOKEN_KEY = "lucky_boba_token";

const TABLE_ROUTES: Record<TableName, string> = {
  branches:           "branches",
  categories:         "categories",
  sub_categories:     "sub-categories",
  menu_items:         "menu-list",
  discounts:          "discounts",
  vouchers:           "vouchers",
  sales:              "sales",
  sale_items:         "sales",
  receipts:           "receipts/search",
  cash_transactions:  "cash-transactions",
  cash_counts:        "cash-counts",
  purchase_orders:    "purchase-orders",
  stock_transactions: "inventory/history",
  item_serials:       "item-serials",
  expenses:           "expenses",
  users:              "users",
  settings:           "settings",
  z_readings:         "reports/z-reading",
  audit_logs:         "system/audit",
};

const EMPTY_STORE: CacheStore = {
  branches:           [],
  categories:         [],
  sub_categories:     [],
  menu_items:         [],
  discounts:          [],
  vouchers:           [],
  sales:              [],
  sale_items:         [],
  receipts:           [],
  cash_transactions:  [],
  cash_counts:        [],
  purchase_orders:    [],
  stock_transactions: [],
  item_serials:       [],
  expenses:           [],
  users:              [],
  settings:           [],
  z_readings:         [],
  audit_logs:         [],
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  });
  if (!res.ok) throw new Error(`[${res.status}] ${path}`);
  return res.json() as Promise<T>;
}

function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Returns true when we're on a super-admin route.
 * The cache/all endpoint is not authorized for super-admin users,
 * so we skip loading entirely to avoid the 403.
 */
function shouldSkipCache(): boolean {
  if (window.location.pathname.startsWith("/super-admin")) return true;
  
  const role = localStorage.getItem('lucky_boba_user_role');
  if (role === 'cashier' || role === 'branch_manager') return true;

  return false;
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function CacheProvider({ children }: { children: ReactNode }) {
  const [store, setStore]     = useState<CacheStore>(EMPTY_STORE);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [ready, setReady]     = useState(false);

  const ref = useRef<CacheStore>(EMPTY_STORE);

  const sync = useCallback((s: CacheStore) => {
    ref.current = s;
    setStore(s);
  }, []);

  // ── Data Loading ─────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    // ✅ Skip cache loading on super-admin routes — the endpoint returns 403
    // for super-admin users. Each super-admin tab fetches its own data directly.
    if (!getAuthToken() || shouldSkipCache()) {
      setLoading(false);
      setReady(true); // mark ready so consumers don't show infinite loading
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<CacheStore>("/cache/all");
      sync(data);
      setReady(true);
    } catch (err) {
      // ✅ Gracefully handle 403/401 — don't block the UI
      const msg = err instanceof Error ? err.message : "Cache failed to load";
      if (msg.includes("[403]") || msg.includes("[401]")) {
        // Not authorized for this endpoint — silently skip
        setReady(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [sync]);

  const reloadTable = useCallback(async (table: TableName) => {
    if (shouldSkipCache()) return;
    const result = await apiFetch<{ rows: Row[]; message: string }>(
      `/cache/reload/${table}`, { method: "POST" }
    );
    sync({ ...ref.current, [table]: result.rows ?? [] });
  }, [sync]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Reads ─────────────────────────────────────────────────────────────────────

  const all = useCallback(
    <T,>(t: TableName): T[] => (ref.current[t] as unknown[]) as T[], []);

  const getById = useCallback(
    <T,>(t: TableName, id: number): T | undefined =>
      (ref.current[t] as Row[]).find(r => r.id === id) as T | undefined, []);

  const find = useCallback(
    <T,>(t: TableName, fn: (r: T) => boolean): T[] =>
      ((ref.current[t] as unknown[]) as T[]).filter(fn), []);

  const findOne = useCallback(
    <T,>(t: TableName, fn: (r: T) => boolean): T | undefined =>
      ((ref.current[t] as unknown[]) as T[]).find(fn), []);

  // ── Domain Shortcuts ──────────────────────────────────────────────────────────

  const menuItemsByCategory    = useCallback((id: number) =>
    find<MenuItem>("menu_items", r => r.category_id === id), [find]);
  const menuItemsBySubCategory = useCallback((id: number) =>
    find<MenuItem>("menu_items", r => r.sub_category_id === id), [find]);
  const subCategoriesByCategory= useCallback((id: number) =>
    find<SubCategory>("sub_categories", r => r.category_id === id), [find]);
  const saleItems              = useCallback((id: number) =>
    find<SaleItem>("sale_items", r => r.sale_id === id), [find]);
  const salesByBranch          = useCallback((id: number) =>
    find<Sale>("sales", r => r.branch_id === id), [find]);
  const activeDiscounts        = useCallback(() =>
    find<Discount>("discounts", r => r.is_active === 1), [find]);
  const activeVouchers         = useCallback(() =>
    find<Voucher>("vouchers", r => r.is_active === 1), [find]);
  const setting                = useCallback((key: string) =>
    findOne<Setting>("settings", r => r.key === key)?.value ?? null, [findOne]);

  // ── Writes ────────────────────────────────────────────────────────────────────

  const insert = useCallback(async <T extends Row>(
    table: TableName, data: Partial<T>
  ): Promise<T> => {
    const created = await apiFetch<T>(`/${TABLE_ROUTES[table]}`, {
      method: "POST", body: JSON.stringify(data),
    });
    sync({ ...ref.current, [table]: [...(ref.current[table] as Row[]), created as Row] });
    return created;
  }, [sync]);

  const update = useCallback(async <T extends Row>(
    table: TableName, id: number, data: Partial<T>
  ): Promise<void> => {
    await apiFetch(`/${TABLE_ROUTES[table]}/${id}`, {
      method: "PUT", body: JSON.stringify(data),
    });
    sync({
      ...ref.current,
      [table]: (ref.current[table] as Row[]).map(r =>
        r.id === id ? { ...r, ...(data as Row) } : r
      ),
    });
  }, [sync]);

  const remove = useCallback(async (table: TableName, id: number): Promise<void> => {
    await apiFetch(`/${TABLE_ROUTES[table]}/${id}`, { method: "DELETE" });
    sync({
      ...ref.current,
      [table]: (ref.current[table] as Row[]).filter(r => r.id !== id),
    });
  }, [sync]);

  return (
    <CacheContext.Provider value={{
      store, loading, error, ready,
      all, getById, find, findOne,
      menuItemsByCategory, menuItemsBySubCategory, subCategoriesByCategory,
      saleItems, salesByBranch, activeDiscounts, activeVouchers, setting,
      insert, update, remove,
      reloadTable, reloadAll: loadAll,
    }}>
      {children}
    </CacheContext.Provider>
  );
}