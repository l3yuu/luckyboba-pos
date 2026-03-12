// ─── ENUMS / CONSTANTS ───────────────────────────────────────────────────────

export const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%'] as const;

export const EXTRA_OPTIONS = ['NO ICE', '-ICE', '+ICE', 'NO PRL', 'W/ PRL'];

export const WINGS_QUANTITIES = ['3pc', '4pc', '6pc', '12pc'] as const;

// ─── MODELS ──────────────────────────────────────────────────────────────────

export interface Cup {
    id: number;
    name: string;
    code: string;         // e.g. "SM/SL", "JR", "UM/UL", "PCM/PCL"
    size_m: string;       // e.g. "22oz", "12oz" — label shown on the M button
    size_l: string;       // e.g. "32oz", "16oz" — label shown on the L button
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
    /**
     * 'M' | 'L' | 'none'
     * Populated by the MenuSeeder from the `size` column.
     * Used to filter which items appear when the cashier picks M or L.
     */
    size: 'M' | 'L' | 'none';
    cup_id?: number | null;
    sub_category_id?: number | null;
    created_at?: string;
    updated_at?: string;
    grab_price?: number;
    panda_price?: number;
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

// ─── CART ─────────────────────────────────────────────────────────────────────

export interface CartItem extends MenuItem {
    qty: number;
    remarks: string;
    charges: {
        grab: boolean;
        panda: boolean;
    };
    /** Sugar level chosen in modal — only set for drink items */
    sugarLevel?: string;
    /** Size chosen in the size-picker screen — only set for drink items */
    size: 'M' | 'L' | 'none';
    /**
     * Full cup size label from the category's cup relationship.
     * e.g. "SM", "SL", "UM", "UL", "PCM", "PCL", "JR"
     * Used for display in cart, receipt, kitchen ticket, and stickers.
     * Only set for drink/oz items.
     */
    cupSizeLabel?: string;
    options?: string[];
    addOns?: string[];
    finalPrice: number;
}