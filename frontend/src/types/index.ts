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
    quantity: number;        // e.g. 2 for "2 CL PEARL M.TEA"
    size: string;
    display_name: string;    // computed by Laravel accessor: menuItem.name ?? custom_name
}

export interface Bundle {
    id: number;
    name: string;            // short POS label e.g. "SWEETY", "2 CL PEARL M.TEA"
    display_name: string | null; // full label e.g. "SWEETY (WINTERMELON + DARK CHOCO RSC)"
    category: string;        // matches Category.name
    barcode: string;
    price: number;
    size: string;
    cup_id: number | null;
    is_active: boolean;
    items: BundleComponent[];
}

/** Customization captured per component drink during bundle ordering */
export interface BundleComponentCustomization {
    name: string;            // display_name of the component
    quantity: number;        // how many of this component (e.g. 2 for "2 CL PEARL")
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
    options?: string[];
    addOns?: string[];
    finalPrice: number;
    discountLabel?: string;

    // ── Bundle-specific fields ──────────────────────────────────────────────
    /** True when this cart item represents a bundle (not a single menu item) */
    isBundle?: boolean;
    /** The Bundle.id this cart item was built from */
    bundleId?: number;
    /** Per-component customizations collected during the bundle modal flow */
    bundleComponents?: BundleComponentCustomization[];
}