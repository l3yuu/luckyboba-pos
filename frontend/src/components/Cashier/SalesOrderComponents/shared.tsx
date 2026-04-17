// ── shared.tsx ────────────────────────────────────────────────────────────────
// Icons, reusable sub-components, and constants shared across SalesOrder files.

/* eslint-disable react-refresh/only-export-components */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Discount {
  id: number;
  name: string;
  amount: number;
  type: string;
  status: 'ON' | 'OFF';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const generateORNumber = (seq: number): string => {
  const padded = String(seq).padStart(9, '0');
  return `SI-${padded}`;
  // e.g. SI-000000001
};

export const generateTerminalNumber = (branchId: number | null): string => {
  const branch = branchId ? String(branchId).padStart(2, '0') : '00';
  return `T${branch}-01`;
  // e.g. T01-01 for branch 1, always terminal 01
};

export const generateQueueNumber = (count = 1) => String(count).padStart(3, '0');

export const getItemSurcharge = (item: {
  charges?: { grab?: boolean; panda?: boolean };
  grab_price?: number | string;
  panda_price?: number | string;
  qty: number;
}): number => {
  if (item.charges?.grab)  return Number(item.grab_price  ?? 0) * item.qty;
  if (item.charges?.panda) return Number(item.panda_price ?? 0) * item.qty;
  return 0;
};

// ── Icons ─────────────────────────────────────────────────────────────────────

export const DrinkIcon = ({ className, size }: { className?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} 
    fill="currentColor" style={size ? { width: size, height: size } : undefined}>
    <path d="m187.4 22.88l-21.5 4.54l22.7 108.08c7.2-.7 14.6-1.2 22-1.6zM256 147.7c-41.2 0-82.3 3.7-123.5 11.1l-11.6 1.1l4.3 22.1l10.6-2.1c20.1-3.2 40.1-6.3 61.2-7.4l8.4 40.1h22.2l-8.4-42.2c51.6-2.1 104.4 1.1 157.1 9.5l10.6 2.1l4.2-22.1l-11.6-1.1c-41.2-7.4-82.3-11.1-123.5-11.1m-119.1 51.6l26.4 281.3l8.3 1c56.2 9.5 112.3 10.6 168.5 0l8.1-1l26.5-281.3h-22.1l-3.6 37.8H232.2l42.3 202.3l-24.3-9.5l-40.4-192.8h-47.3l-3.6-37.8zm188.8 155.3c7.4 0 13.5 6 13.5 13.5s-6.1 13.5-13.5 13.5c-7.5 0-13.5-6-13.5-13.5s6-13.5 13.5-13.5M292 380.2c7.4 0 13.6 6.1 13.6 13.5c0 7.5-6.2 13-13.6 13s-13.6-5.5-13.6-13c0-7.4 6.2-13.5 13.6-13.5m-74.2 5.1c7.5 0 13.5 6.1 13.5 13.5c0 7.9-6 13.2-13.5 13.2c-7.4 0-13.5-5.3-13.5-13.2c0-7.4 6.1-13.5 13.5-13.5m107 7.8c7.5 0 13.6 6 13.6 13.6c0 7.4-6.1 13.7-13.6 13.7c-7.4 0-13.5-6.3-13.5-13.7c0-7.6 6.1-13.6 13.5-13.6m-140.9 10.5c7.5 0 13.5 5.2 13.5 12.6s-6 13.7-13.5 13.7s-13.5-6.3-13.5-13.7s6-12.6 13.5-12.6m111.2 12.6c7.5 0 13.5 6.3 13.5 13.7s-6 13.7-13.5 13.7s-13.5-6.3-13.5-13.7s6-13.7 13.5-13.7m-76.1 7.4c7.5 0 13.6 6.3 13.6 13.7S226.5 451 219 451c-7.4 0-13.5-6.3-13.5-13.7s6.1-13.7 13.5-13.7m-32.7 14.8c7.5 0 13.5 5.2 13.5 12.6s-6 13.7-13.5 13.7c-7.4 0-13.5-6.3-13.5-13.7s6.1-12.6 13.5-12.6m134.7 2.1c7.5 0 13.5 6.3 13.5 13.7s-6 13.7-13.5 13.7s-13.5-6.3-13.5-13.7s6-13.7 13.5-13.7m-66.5 4.2c7.4 0 13.5 5.3 13.5 12.7c0 7.3-6.1 13.7-13.5 13.7c-7.5 0-13.5-6.4-13.5-13.7c0-7.4 6-12.7 13.5-12.7" strokeWidth="13" stroke="currentColor" />
  </svg>
);

export interface IconProps {
  className?: string;
  size?: number;
}

export const ChevronRight: React.FC<IconProps> = ({ className, size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className || "w-4 h-4 opacity-40"}
    style={size ? { width: size, height: size } : undefined}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

export const CloseIcon = ({ size = 6 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-${size} h-${size}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export const MinusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ className, size }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className={className || "w-4 h-4"}
    style={size ? { width: size, height: size } : undefined}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

// ── Constants ─────────────────────────────────────────────────────────────────

export const PAYMENT_METHODS = [
  { id: 'cash',     label: 'Cash'   },
  { id: 'gcash',   label: 'GCash'  },
  { id: 'paymaya', label: 'Maya'   },
  { id: 'credit',  label: 'Credit' },
  { id: 'debit',   label: 'Debit'  },
  { id: 'grab',       label: 'GrabFood' },   // ← ADD
  { id: 'food_panda', label: 'FoodPanda' },  // ← ADD
] as const;

export const TYPE_BADGE = {
  food:  { pill: 'bg-orange-500 text-white', card: 'hover:bg-orange-500 hover:border-orange-500 hover:text-white' },
  wings: { pill: 'bg-orange-500 text-white', card: 'hover:bg-orange-500 hover:border-orange-500 hover:text-white' },
  drink: { pill: 'bg-[#3b2063] text-white',  card: 'hover:bg-[#3b2063] hover:border-[#3b2063] hover:text-white'  },
  promo: { pill: 'bg-emerald-600 text-white', card: 'hover:bg-emerald-600 hover:border-emerald-600 hover:text-white' },
};

export const BASE_CARD = 'bg-white font-black text-sm uppercase p-4 rounded-[0.625rem] h-24 shadow-sm border-2 border-zinc-200 transition-all hover:shadow-lg hover:scale-[1.03] active:scale-100 text-black flex items-center justify-center text-center';

// ── Sub-components ────────────────────────────────────────────────────────────

export const QtyControl = ({
  value, onDecrement, onIncrement, className = '',
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  className?: string;
}) => (
  <div className={`flex items-center justify-between bg-[#f5f0ff] rounded-[0.625rem] p-2 border-2 border-[#e9d5ff] ${className}`}>
    <button
      onClick={onDecrement}
      className="w-11 h-11 bg-white rounded-lg border border-[#e9d5ff] text-[#3b2063] hover:text-red-500 hover:border-red-200 transition-colors flex items-center justify-center shadow-sm"
    >
      <MinusIcon />
    </button>
    <span className="font-black text-2xl text-black w-16 text-center tabular-nums">{value}</span>
    <button
      onClick={onIncrement}
      className="w-11 h-11 bg-[#3b2063] rounded-lg text-white flex items-center justify-center hover:bg-[#6a12b8] transition-colors shadow-sm"
    >
      <PlusIcon />
    </button>
  </div>
);

export const AddOnGrid = ({
  addOns, selected, onToggle, orderCharge,
}: {
  addOns: { id: number; name: string; price: number; grab_price?: number; panda_price?: number }[];
  selected: string[];
  onToggle: (name: string) => void;
  orderCharge?: 'grab' | 'panda' | null;
}) => {
  const displayPrice = (addon: { price: number; grab_price?: number; panda_price?: number }) => {
    if (orderCharge === 'grab'  && Number(addon.grab_price  ?? 0) > 0) return Number(addon.grab_price);
    if (orderCharge === 'panda' && Number(addon.panda_price ?? 0) > 0) return Number(addon.panda_price);
    return Number(addon.price);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {addOns.map(addon => (
        <button
          key={addon.id}
          onClick={() => onToggle(addon.name)}
          className={`p-3 rounded-[0.625rem] text-left border-2 transition-all h-24 flex flex-col justify-between
            ${selected.includes(addon.name)
              ? 'bg-[#3b2063] border-[#3b2063] text-white'
              : 'bg-white border-[#e9d5ff] text-black hover:border-[#3b2063]/40 hover:bg-[#f5f0ff]'
            }`}
        >
          <span className="text-[10px] font-black uppercase leading-tight">{addon.name}</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold">₱{displayPrice(addon).toFixed(2)}</span>
            {/* Show original price as strikethrough if grab/panda price is different */}
            {(orderCharge === 'grab' || orderCharge === 'panda') &&
              displayPrice(addon) !== Number(addon.price) && (
              <span className="text-[10px] line-through opacity-50">₱{Number(addon.price).toFixed(2)}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

// ── Generic AddOn Modal Shell ─────────────────────────────────────────────────
// Reused by item add-ons, bundle add-ons, and combo drink add-ons.

export const AddOnModalShell = ({
  title,
  addOns,
  selected,
  onToggle,
  onClose,
  zIndex = 'z-110',
  orderCharge,
}: {
  title: string;
  addOns: { id: number; name: string; price: number; grab_price?: number; panda_price?: number }[];
  selected: string[];
  onToggle: (name: string) => void;
  onClose: () => void;
  zIndex?: string;
  orderCharge?: 'grab' | 'panda' | null;
}) => (
  <div className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/60 backdrop-blur-sm p-4`}>
    <div className="bg-white w-full max-w-lg rounded-[0.625rem] shadow-2xl flex flex-col h-[80vh]">
      <div className="bg-[#3b2063] p-6 text-white text-center relative shrink-0">
        <h2 className="text-lg font-black uppercase tracking-wider">{title}</h2>
        {/* Show active charge badge */}
        {orderCharge && (
          <span className={`inline-block mt-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full
            ${orderCharge === 'grab' ? 'bg-green-400 text-green-900' : 'bg-pink-400 text-pink-900'}`}>
            {orderCharge === 'grab' ? '🛵 Grab Prices' : '🐼 Panda Prices'}
          </span>
        )}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white font-bold text-xs bg-white/20 px-3 py-1.5 rounded-lg"
        >
          Done
        </button>
      </div>
      <div className="p-6 overflow-y-auto flex-1 bg-white">
        <AddOnGrid addOns={addOns} selected={selected} onToggle={onToggle} orderCharge={orderCharge} />
      </div>
      <div className="p-4 border-t border-[#e9d5ff] bg-white">
        <button
          onClick={onClose}
          className="w-full bg-[#3b2063] text-white py-4 rounded-[0.625rem] font-black uppercase tracking-widest shadow-lg"
        >
          Confirm Selection ({selected.length})
        </button>
      </div>
    </div>
  </div>
);
