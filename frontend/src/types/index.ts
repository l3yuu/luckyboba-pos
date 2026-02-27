// src/types/index.ts

export interface MenuItem {
    id: number;
    name: string;
    price: number;
    barcode: string;
    category_id: number;
}

export interface Cup {
    id: number;
    name: string;
    size_m: string;
    size_l: string;
    code: string;
}

export interface Category {
    id: number;
    name: string;
    type: string;
    cup_id: number | null;
    cup: Cup | null;
    menu_items: MenuItem[];
}

export interface CartItem extends MenuItem {
    qty: number;
    remarks: string;
    charges: { grab: boolean; panda: boolean };
    sugarLevel?: string;
    size?: string;
    options?: string[];
    addOns?: string[];
    finalPrice: number;
}

// Moving these here prevents errors and keeps the main component clean
export const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%'];
export const EXTRA_OPTIONS = ['NO ICE', '-ICE', '+ICE', 'WARM', 'NO PRL', 'W/ PRL', 'R NAT'];
export const WINGS_QUANTITIES = ['3pc', '4pc', '6pc', '12pc'];