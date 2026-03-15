// ─── ENUMS / CONSTANTS ───────────────────────────────────────────────────────

export const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%'] as const;

export const EXTRA_OPTIONS = ['NO ICE', '-ICE', '+ICE', 'NO PRL', 'W/ PRL'];

export const WINGS_QUANTITIES = ['3pc', '4pc', '6pc', '12pc'] as const;

export const BUNDLE_CATEGORIES = [
  'GF DUO BUNDLES',
  'FP COFFEE BUNDLES',
  'FP/GF FET2 CLASSIC',
] as const;

// ─── MODELS ──────────────────────────────────────────────────────────────────

export interface Cup {
    id: number;
    name: string;
    code: string;
    size_m: string;
    size_l: string;
    created_at?: string;
    updated_at?: string;
}

export interface MenuItem {
    id: number;
    category_id: number;
    name: string;
    price: number | string;
    cost?: number | string;
    quantity?: number;
    barcode: string;
    size: 'M' | 'L' | 'none';
    cup_id?: number | null;
    sub_category_id?: number | null;
    created_at?: string;
    updated_at?: string;
    grab_price?: number;
    panda_price?: number;
    /** Flat array from API: e.g. ["pearl", "ice"] — populated from menu_item_options table */
    options?: string[];
}

export interface Category {
    id: number;
    name: string;
    type: string;
    cup?: {
        id: number;
        code: string;
        size_m?: string;
        size_l?: string | null;
    };
    sub_categories?: { id: number; name: string }[];
    menu_items: MenuItem[];
}

// ─── BUNDLES ──────────────────────────────────────────────────────────────────

export interface BundleComponent {
    id: number;
    bundle_id: number;
    menu_item_id: number | null;
    custom_name: string | null;
    quantity: number;
    size: string;
    display_name: string;
}

export interface Bundle {
    id: number;
    name: string;
    display_name: string | null;
    category: string;
    barcode: string;
    price: number;
    size: string;
    cup_id: number | null;
    is_active: boolean;
    items: BundleComponent[];
}

export interface BundleComponentCustomization {
    name: string;
    quantity: number;
    sugarLevel: string;
    options: string[];
    addOns: string[];
}

// ─── CART ─────────────────────────────────────────────────────────────────────

export interface CartItem extends MenuItem {
    qty: number;
    remarks: string;
    charges: {
        grab: boolean;
        panda: boolean;
    };
    sugarLevel?: string;
    size: 'M' | 'L' | 'none';
    cupSizeLabel?: string;
    /** Selected options for this cart item (e.g. ["NO PRL", "NO ICE"]) */
    options?: string[];
    addOns?: string[];
    finalPrice: number;
    discountLabel?: string;

    // ── Bundle-specific fields ──────────────────────────────────────────────
    isBundle?: boolean;
    bundleId?: number;
    bundleComponents?: BundleComponentCustomization[];
}