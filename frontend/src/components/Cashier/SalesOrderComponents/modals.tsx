// ── modals.tsx ────────────────────────────────────────────────────────────────
// All modal overlays used in the SalesOrder page.

import React from 'react';
import {
  type CartItem, type Bundle, type MenuItem,
  SUGAR_LEVELS, EXTRA_OPTIONS,
} from '../../../types/index';
import {
  CloseIcon, QtyControl, AddOnModalShell,
  ArrowRightIcon, ChevronRight,
  PAYMENT_METHODS, type Discount,
  getItemSurcharge,
} from './shared';
import { useToast } from '../../../context/ToastContext';

// ─────────────────────────────────────────────────────────────────────────────
// AdminPinOverlay
// ─────────────────────────────────────────────────────────────────────────────

const AdminPinOverlay = ({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) => {
  const [pin, setPin]         = React.useState('');
  const [error, setError]     = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

  const getHeaders = (): Record<string, string> => {
    const token =
      localStorage.getItem('auth_token') ??
      localStorage.getItem('lucky_boba_token') ??
      localStorage.getItem('token') ??
      '';
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const handleSubmit = async () => {
    if (!pin.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_BASE}/auth/verify-manager-pin`, {
        method:  'POST',
        headers: getHeaders(),
        body:    JSON.stringify({ pin }),
      });
      const json = await res.json();

      if (json.success) {
        onSuccess();
      } else {
        setError(json.message ?? 'Incorrect PIN. Try again.');
        setPin('');
      }
    } catch {
      setError('Connection error. Try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[0.625rem]">
      <div className="bg-white rounded-[0.625rem] shadow-2xl w-72 overflow-hidden">
        <div className="bg-[#7c14d4] px-6 py-5 text-white text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50 mb-1">Authorization Required</p>
          <h3 className="text-base font-black uppercase tracking-widest">Admin PIN</h3>
          <p className="text-white/50 text-[10px] mt-1">Enter admin PIN to cancel this order</p>
        </div>
        <div className="p-5 space-y-4">
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="••••"
            autoFocus
            className="w-full bg-[#f5f0ff] border-2 border-[#e9d5ff] rounded-[0.625rem] py-3 px-4 text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-[#7c14d4] transition-colors"
          />
          {error && (
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-[0.625rem] border-2 border-zinc-200 text-zinc-500 font-black text-xs uppercase tracking-widest hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !pin.trim()}
              className="flex-1 py-3 rounded-[0.625rem] bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CartItemEditModal
// ─────────────────────────────────────────────────────────────────────────────

interface CartItemEditModalProps {
  editingCartItem: CartItem;
  itemDiscountType: 'none' | 'percent' | 'fixed';
  itemDiscountValue: number | '';
  editingItemDiscountId: number | null;
  discounts: Discount[];
  computeDiscountedTotal: () => number;
  onAdjustQty: (delta: number) => void;
  onSetDiscountId: (id: number | null) => void;
  onSetDiscountType: (t: 'none' | 'percent' | 'fixed') => void;
  onSetDiscountValue: (v: number | '') => void;
  onSave: () => void;
  onRemove: () => void;
  onClose: () => void;
}

export const CartItemEditModal = ({
  editingCartItem,
  itemDiscountType,
  itemDiscountValue,
  editingItemDiscountId,
  discounts,
  computeDiscountedTotal,
  onAdjustQty,
  onSetDiscountId,
  onSetDiscountType,
  onSetDiscountValue,
  onSave,
  onRemove,
  onClose,
}: CartItemEditModalProps) => {
const discountOptions = [
  { id: null, label: 'No Discount', type: 'none' as const, value: 0, badge: null },
  ...discounts
    .filter(d => d.type === 'Item-Percent')
    .map(d => ({
      id:    d.id,
      label: d.name,
      type:  'percent' as const,
      value: Number(d.amount),
      badge: `${d.amount}% OFF`,
    })),
  ];
  
  return (
    <div className="fixed inset-0 z-150 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-[0.625rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-[#7c14d4] px-6 pt-5 pb-5 text-white relative shrink-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1">Edit Item</p>
          <h2 className="text-base font-black uppercase tracking-wide leading-tight pr-8">
            {editingCartItem.name}
            {editingCartItem.cupSizeLabel && (
              <span className="ml-2 text-white/40 font-semibold text-sm">({editingCartItem.cupSizeLabel})</span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
          >
            <CloseIcon size={4} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 bg-white">
          {/* Detail badges */}
          {(editingCartItem.sugarLevel != null ||
            (editingCartItem.options?.length ?? 0) > 0 ||
            (editingCartItem.addOns?.length  ?? 0) > 0 ||
            editingCartItem.charges?.grab ||
            editingCartItem.charges?.panda ||
            editingCartItem.remarks) && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {editingCartItem.sugarLevel != null && (
                <span className="inline-flex items-center bg-[#7c14d4]/10 text-black border border-[#7c14d4]/20 text-[10px] px-2 py-1 rounded-md font-semibold">🍬 {editingCartItem.sugarLevel}</span>
              )}
              {editingCartItem.options?.map(opt => (
                <span key={opt} className="inline-flex items-center bg-sky-50 text-sky-700 border border-sky-200 text-[10px] px-2 py-1 rounded-md font-semibold">{opt}</span>
              ))}
              {editingCartItem.addOns?.map(a => (
                <span key={a} className="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-1 rounded-md font-semibold">+{a}</span>
              ))}
              {editingCartItem.charges?.grab  && <span className="inline-flex items-center bg-green-50 text-green-700 border border-green-200 text-[10px] px-2 py-1 rounded-md font-semibold">🛵 Grab</span>}
              {editingCartItem.charges?.panda && <span className="inline-flex items-center bg-pink-50 text-pink-700 border border-pink-200 text-[10px] px-2 py-1 rounded-md font-semibold">🐼 Panda</span>}
              {editingCartItem.remarks && (
                <span className="inline-flex items-center bg-zinc-100 text-zinc-500 border border-zinc-200 text-[10px] px-2 py-1 rounded-md font-semibold italic">📝 {editingCartItem.remarks}</span>
              )}
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Quantity</label>
            <QtyControl
              value={editingCartItem.qty}
              onDecrement={() => onAdjustQty(-1)}
              onIncrement={() => onAdjustQty(1)}
            />
          </div>

          {/* Item discount */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Item Discount</label>
            <div className="border-2 border-zinc-200 rounded-[0.625rem] overflow-hidden divide-y divide-zinc-100">
              {discountOptions.map(option => {
                const isSelected = editingItemDiscountId === option.id;
                const isNone     = option.id === null;
                return (
                  <button
                    key={String(option.id)}
                    onClick={() => {
                      onSetDiscountId(option.id);
                      onSetDiscountType(option.type);
                      onSetDiscountValue(option.value || '');
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                      ${isSelected
                        ? isNone ? 'bg-red-500 text-white' : 'bg-[#7c14d4] text-white'
                        : 'bg-white text-zinc-600 hover:bg-zinc-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-white bg-white' : 'border-zinc-300'}`}>
                        {isSelected && <div className={`w-2 h-2 rounded-full ${isNone ? 'bg-red-500' : 'bg-[#7c14d4]'}`} />}
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider">{option.label}</span>
                    </div>
                    {option.badge && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full tabular-nums shrink-0 ml-2
                        ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        {option.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price preview */}
          <div className="bg-zinc-50 rounded-[0.625rem] border border-zinc-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-1">Item Total</p>
              {itemDiscountType !== 'none' && itemDiscountValue !== '' && (
                <p className="text-xs text-zinc-400 line-through font-semibold">₱ {editingCartItem.finalPrice.toFixed(2)}</p>
              )}
            </div>
            <span className="font-black text-xl text-black tabular-nums">₱ {computeDiscountedTotal().toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#f5f0ff] border-t border-[#e9d5ff] flex gap-3 shrink-0">
          <button
            onClick={onRemove}
            className="flex-1 py-3 rounded-[0.625rem] border-2 border-red-100 bg-white text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
            Remove
          </button>
          <button
            onClick={onSave}
            className="flex-2 py-3 rounded-[0.625rem] bg-[#7c14d4] hover:bg-[#6a12b8] text-white font-black text-xs uppercase tracking-widest transition-all shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ItemSelectionModal
// ─────────────────────────────────────────────────────────────────────────────

interface ItemSelectionModalProps {
  selectedItem: NonNullable<CartItem>;
  qty: number;
  remarks: string;
  sugarLevel: string;
  selectedOptions: string[];
  selectedAddOns: string[];
  orderCharge: 'grab' | 'panda' | null;
  isDrink: boolean;
  isCombo: boolean;
  isWaffleCategory: boolean;
  onQtyChange: (q: number) => void;
  onRemarksChange: (r: string) => void;
  onSugarChange: (s: string) => void;
  onToggleOption: (opt: string) => void;
  onToggleOrderCharge: (type: 'grab' | 'panda') => void;
  onOpenAddOns: () => void;
  onAddToOrder: () => void;
  onClose: () => void;
}

export const ItemSelectionModal = ({
  selectedItem,
  qty,
  remarks,
  sugarLevel,
  selectedOptions,
  selectedAddOns,
  orderCharge,
  isDrink,
  isCombo,
  isWaffleCategory,
  onQtyChange,
  onRemarksChange,
  onSugarChange,
  onToggleOption,
  onToggleOrderCharge,
  onOpenAddOns,
  onAddToOrder,
  onClose,
}: ItemSelectionModalProps) => {
  const itemOpts = (selectedItem as { options?: string[] })?.options ?? [];
  const visibleOpts = EXTRA_OPTIONS.filter((opt: string) => {
    const pearlOpts = ['NO PRL', 'W/ PRL'];
    const iceOpts   = ['NO ICE', '-ICE', '+ICE'];
    if (pearlOpts.includes(opt)) return itemOpts.includes('pearl');
    if (iceOpts.includes(opt))   return itemOpts.includes('ice');
    if (opt === 'WARM')          return false;
    return true;
  });

  const hasPearlOption = (selectedItem as { options?: string[] })?.options?.includes('pearl') ?? false;
  const sugarSelected  = !isDrink || sugarLevel !== '';
  const canAdd = sugarSelected && (isCombo || !isDrink || !hasPearlOption || selectedOptions.some((o: string) => ['NO PRL', 'W/ PRL'].includes(o)));

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-[0.625rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-[#7c14d4] p-5 text-white text-center relative shrink-0">
          <h2 className="text-lg font-black uppercase tracking-wider">{selectedItem.name}</h2>
          {isCombo && (
            <div className="mt-1 inline-block bg-white/20 text-white text-[10px] font-black uppercase px-3 py-1 rounded-[0.625rem] tracking-widest">🧋 Includes Classic Pearl</div>
          )}
          <button onClick={onClose} className="absolute top-5 right-6 text-white/50 hover:text-white transition-colors">
            <CloseIcon size={6} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto bg-white">
          {/* Barcode + Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-[0.625rem] border-2 border-zinc-200">
              <span className="text-sm font-bold text-zinc-900 uppercase tracking-widest block mb-1">Barcode</span>
              <span className="text-sm font-black text-[#7c14d4]">{selectedItem.barcode}</span>
            </div>
            <div className="bg-white p-3 rounded-[0.625rem] border-2 border-zinc-200">
              <span className="text-sm font-bold text-zinc-900 uppercase tracking-widest block mb-1">Unit Price</span>
              <span className="text-sm font-black text-black">₱ {Number(selectedItem.price).toFixed(2)}</span>
            </div>
          </div>

          {/* Qty */}
          <div className="flex items-center justify-between bg-white rounded-[0.625rem] p-2 border-2 border-zinc-200">
            <button onClick={() => onQtyChange(Math.max(1, qty - 1))} className="w-12 h-12 bg-[#f5f0ff] rounded-[0.625rem] border border-[#e9d5ff] text-black hover:text-red-500 transition-colors flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
            </button>
            <input type="text" value={qty} readOnly className="bg-transparent text-center font-black text-2xl text-black w-20 outline-none" />
            <button onClick={() => onQtyChange(qty + 1)} className="w-12 h-12 bg-[#7c14d4] rounded-[0.625rem] shadow-lg text-white transition-colors flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </button>
          </div>

          {/* Drink-specific options */}
          {isDrink && (
            <>
              <div>
                <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Sugar Level</label>
                <div className="flex gap-2">
                  {SUGAR_LEVELS.map((level: string) => (
                    <button key={level} onClick={() => onSugarChange(level)}
                      className={`flex-1 py-2 rounded-[0.625rem] text-sm font-black transition-all ${sugarLevel === level && sugarLevel !== '' ? 'bg-[#7c14d4] text-white shadow-md' : 'bg-white text-black border-2 border-[#e9d5ff] hover:bg-[#f5f0ff]'}`}>
                      {level}
                    </button>
                  ))}
                </div>
                {sugarLevel === '' && (
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1.5 ml-1">⚠ Please select sugar level</p>
                )}
              </div>
              <div>
                <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Extra</label>
                <AddOnTriggerButton count={selectedAddOns.length} onClick={onOpenAddOns} />
              </div>
              {visibleOpts.length > 0 && (
                <div>
                  <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Options (Free)</label>
                  <div className="flex flex-wrap gap-2">
                    {visibleOpts.map((opt: string) => (
                      <button key={opt} onClick={() => onToggleOption(opt)}
                        className={`px-3 py-2 rounded-[0.625rem] text-sm font-bold uppercase transition-all ${selectedOptions.includes(opt) ? 'bg-[#7c14d4] text-white shadow-md' : 'bg-white text-black border-2 border-[#e9d5ff] hover:bg-[#f5f0ff]'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Waffle add-ons */}
          {isWaffleCategory && (
            <div>
              <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Combo Add-ons</label>
              <AddOnTriggerButton count={selectedAddOns.length} onClick={onOpenAddOns} />
            </div>
          )}

          {/* Delivery charges */}
          <div>
            <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">
              Charges
              {orderCharge === 'grab'  && Number((selectedItem as { grab_price?: number })?.grab_price  ?? 0) > 0 ? ` (+₱${Number((selectedItem as { grab_price?: number })?.grab_price).toFixed(2)})` : ''}
              {orderCharge === 'panda' && Number((selectedItem as { panda_price?: number })?.panda_price ?? 0) > 0 ? ` (+₱${Number((selectedItem as { panda_price?: number })?.panda_price).toFixed(2)})` : ''}
              {orderCharge && Number((selectedItem as { grab_price?: number; panda_price?: number })?.[orderCharge === 'grab' ? 'grab_price' : 'panda_price'] ?? 0) === 0 ? ' (No Surcharge)' : ''}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['grab', 'panda'] as const).map(type => {
                const isActive   = orderCharge === type;
                const isDisabled = orderCharge !== null && orderCharge !== type;
                return (
                  <button key={type} type="button" onClick={() => !isDisabled && onToggleOrderCharge(type)} disabled={isDisabled}
                    className={`p-3 rounded-[0.625rem] border-2 transition-all flex items-center justify-center gap-2
                      ${isDisabled ? 'border-zinc-200 bg-white text-zinc-300 opacity-40'
                        : isActive
                          ? type === 'grab' ? 'border-green-500 bg-green-50 text-green-700' : 'border-pink-500 bg-pink-50 text-pink-700'
                          : type === 'grab' ? 'border-zinc-300 bg-white text-zinc-500 hover:border-green-300 hover:bg-green-50' : 'border-zinc-300 bg-white text-zinc-500 hover:border-pink-300 hover:bg-pink-50'
                      }`}>
                    <span className="font-bold text-xs uppercase">{type === 'grab' ? 'Grab Food' : 'Food Panda'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Remarks</label>
            <textarea
              value={remarks}
              onChange={e => onRemarksChange(e.target.value)}
              placeholder="Additional notes..."
              className="w-full bg-[#f5f0ff] border border-[#e9d5ff] text-sm font-bold p-4 resize-none h-16 outline-none focus:border-[#7c14d4] focus:bg-white transition-all"
            />
          </div>

          {/* Add button */}
          <button
            onClick={onAddToOrder}
            disabled={!canAdd}
            title={!canAdd ? (!sugarSelected ? 'Please select sugar level' : 'Please select NO PRL or W/ PRL') : ''}
            className={`w-full py-4 rounded-[0.625rem] font-black text-sm uppercase tracking-[0.2em] shadow-lg transition-colors
              ${canAdd ? 'bg-[#7c14d4] text-white hover:bg-[#6a12b8]' : 'bg-[#f5f0ff] text-black cursor-not-allowed'}`}
          >
            {isCombo
              ? 'Next: Customize Drink →'
              : !sugarSelected
                ? '⚠ Select Sugar Level First'
                : canAdd
                  ? 'Add Order'
                  : 'Select Pearl Option First'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BundleModal
// ─────────────────────────────────────────────────────────────────────────────

interface BundleModalProps {
  activeBundleItem: Bundle;
  bundleComponentIndex: number;
  bundleComponentSugar: string;
  bundleComponentOptions: string[];
  bundleComponentAddOns: string[];
  filteredAddOns: { 
    id: number; 
    name: string; 
    price: number; 
    grab_price?: number;
    panda_price?: number;
  }[];
  bundleComponentAddOnModalOpen: boolean;
  onSugarChange: (s: string) => void;
  onToggleOption: (opt: string) => void;
  onOpenAddOns: () => void;
  onCloseAddOns: () => void;
  onToggleAddOn: (name: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  orderCharge?: 'grab' | 'panda' | null;
  onToggleOrderCharge?: (type: 'grab' | 'panda') => void;
  bundleGrabPrice:  number;
  bundlePandaPrice: number;
}

export const BundleModal = ({
  activeBundleItem,
  bundleComponentIndex,
  bundleComponentSugar,
  bundleComponentOptions,
  bundleComponentAddOns,
  bundleGrabPrice,
  bundlePandaPrice,
  filteredAddOns,
  bundleComponentAddOnModalOpen,
  onSugarChange,
  onToggleOption,
  onOpenAddOns,
  onCloseAddOns,
  onToggleAddOn,
  onConfirm,
  onClose,
  orderCharge,
  onToggleOrderCharge,
}: BundleModalProps) => {
  const component   = activeBundleItem.items[bundleComponentIndex];
  const totalSteps  = activeBundleItem.items.length;
  const isLastStep  = bundleComponentIndex === totalSteps - 1;
  const displayName = component.display_name ?? component.custom_name ?? '';
  const isMilkTea   = displayName.toLowerCase().includes('milk tea') || displayName.toLowerCase().includes('m.tea');
  const hasPearl    = bundleComponentOptions.some(o => ['NO PRL', 'W/ PRL'].includes(o));
  const canNext     = bundleComponentSugar !== '' && (!isMilkTea || hasPearl);

  return (
    <>
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-lg rounded-[0.625rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="bg-[#7c14d4] p-5 text-white relative shrink-0">
            <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1">
              Bundle — {activeBundleItem.display_name ?? activeBundleItem.name}
            </div>
            <h2 className="text-base font-black uppercase tracking-wide leading-tight pr-8">
              Drink {bundleComponentIndex + 1} of {totalSteps}: {displayName}
              {component.quantity > 1 && <span className="ml-2 text-white/50 font-bold text-sm">×{component.quantity}</span>}
            </h2>
            <div className="mt-3 w-full bg-white/20 rounded-full h-1.5">
              <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${((bundleComponentIndex + 1) / totalSteps) * 100}%` }} />
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Bundle Price</span>
              <span className="text-white font-black text-sm">₱{Number(activeBundleItem.price).toFixed(2)}</span>
              {bundleGrabPrice > 0 && orderCharge === 'grab' && (
                <span className="text-green-300 font-black text-sm">+₱{bundleGrabPrice.toFixed(2)} Grab</span>
              )}
              {bundlePandaPrice > 0 && orderCharge === 'panda' && (
                <span className="text-pink-300 font-black text-sm">+₱{bundlePandaPrice.toFixed(2)} Panda</span>
              )}
            </div>
            <button onClick={onClose} className="absolute top-5 right-5 w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors">
              <CloseIcon size={4} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 overflow-y-auto bg-white">
            <div>
              <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Sugar Level</label>
              <div className="flex gap-2">
                {SUGAR_LEVELS.map((level: string) => (
                  <button key={level} onClick={() => onSugarChange(level)}
                    className={`flex-1 py-2 rounded-[0.625rem] text-sm font-black transition-all ${bundleComponentSugar === level && bundleComponentSugar !== '' ? 'bg-[#7c14d4] text-white shadow-md' : 'bg-white text-black border-2 border-[#e9d5ff] hover:bg-[#f5f0ff]'}`}>
                    {level}
                  </button>
                ))}
              </div>
              {bundleComponentSugar === '' && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1.5 ml-1">⚠ Please select sugar level</p>
              )}
            </div>

            <div>
              <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Options (Free)</label>
              <div className="flex flex-wrap gap-2">
                {EXTRA_OPTIONS.map((opt: string) => (
                  <button key={opt} onClick={() => onToggleOption(opt)}
                    className={`px-3 py-2 rounded-[0.625rem] text-sm font-bold uppercase transition-all ${bundleComponentOptions.includes(opt) ? 'bg-[#7c14d4] text-white shadow-md' : 'bg-white text-black border-2 border-[#e9d5ff] hover:bg-[#f5f0ff]'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Extra Add-ons</label>
              <AddOnTriggerButton count={bundleComponentAddOns.length} onClick={onOpenAddOns} />
            </div>

            {/* Delivery charges */}
            {onToggleOrderCharge && (
              <div>
                <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">
                  Charges
                  {orderCharge === 'grab'  && bundleGrabPrice  > 0 && ` (+₱${bundleGrabPrice.toFixed(2)})`}
                  {orderCharge === 'panda' && bundlePandaPrice > 0 && ` (+₱${bundlePandaPrice.toFixed(2)})`}
                  {orderCharge && (orderCharge === 'grab' ? bundleGrabPrice : bundlePandaPrice) === 0 && ' (No Surcharge)'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['grab', 'panda'] as const).map(type => {
                    const isActive = orderCharge === type;
                    return (
                      <button key={type} type="button"
                        onClick={() => onToggleOrderCharge(type)}
                        className={`p-3 rounded-[0.625rem] border-2 transition-all flex items-center justify-center
                          ${isActive
                            ? type === 'grab' ? 'border-green-500 bg-green-50 text-green-700' : 'border-pink-500 bg-pink-50 text-pink-700'
                            : type === 'grab' ? 'border-zinc-300 bg-white text-zinc-500 hover:border-green-300 hover:bg-green-50' : 'border-zinc-300 bg-white text-zinc-500 hover:border-pink-300 hover:bg-pink-50'
                          }`}>
                        <span className="font-bold text-xs uppercase">{type === 'grab' ? 'Grab Food' : 'Food Panda'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button onClick={onConfirm} disabled={!canNext}
              className={`w-full py-4 rounded-[0.625rem] font-black text-sm uppercase tracking-[0.2em] shadow-lg transition-colors ${canNext ? 'bg-[#7c14d4] text-white hover:bg-[#6a12b8]' : 'bg-[#f5f0ff] text-black cursor-not-allowed'}`}>
              {!canNext ? 'Select Pearl Option First' : isLastStep ? '✓ Add Bundle to Order' : `Next: Drink ${bundleComponentIndex + 2} of ${totalSteps} →`}
            </button>
          </div>
        </div>
      </div>

      {/* Bundle Add-on sub-modal */}
      {bundleComponentAddOnModalOpen && (
        <AddOnModalShell
          title="Bundle Drink Add-ons"
          addOns={filteredAddOns}
          selected={bundleComponentAddOns}
          onToggle={onToggleAddOn}
          onClose={onCloseAddOns}
          zIndex="z-[110]"
          orderCharge={orderCharge}
        />
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ComboDrinkModal
// ─────────────────────────────────────────────────────────────────────────────

interface ComboDrinkModalProps {
  pendingComboCart: CartItem;
  comboDrinkSugar: string;
  comboDrinkOptions: string[];
  comboDrinkAddOns: string[];
  filteredAddOns: { id: number; name: string; price: number; grab_price?: number; panda_price?: number }[];
  orderCharge?: 'grab' | 'panda' | null;
  comboDrinkAddOnModalOpen: boolean;
  onSugarChange: (s: string) => void;
  onToggleOption: (opt: string) => void;
  onOpenAddOns: () => void;
  onCloseAddOns: () => void;
  onToggleAddOn: (name: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const ComboDrinkModal = ({
  pendingComboCart,
  comboDrinkSugar,
  comboDrinkOptions,
  comboDrinkAddOns,
  filteredAddOns,
  comboDrinkAddOnModalOpen,
  onSugarChange,
  onToggleOption,
  onOpenAddOns,
  onCloseAddOns,
  onToggleAddOn,
  onConfirm,
  onClose,
  orderCharge,
}: ComboDrinkModalProps) => {

  return (
    <>
      <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-lg rounded-[0.625rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="bg-[#7c14d4] p-5 text-white text-center relative shrink-0">
            <div className="text-[10px] font-bold uppercase opacity-60 tracking-widest leading-none mb-1">Step 2 of 2 — Combo Drink for</div>
            <h2 className="text-base font-black uppercase tracking-wider leading-tight">{pendingComboCart.name}</h2>
            <div className="mt-2 inline-block bg-white/20 text-white text-[10px] font-black uppercase px-3 py-1 rounded-[0.625rem] tracking-widest">
              🧋 {pendingComboCart.name?.toUpperCase().includes('PIZZA +') && !pendingComboCart.name?.toUpperCase().includes('CLASSIC PEARL')
                ? pendingComboCart.name.replace(/^PIZZA \+ /i, '')
                : 'Classic Pearl Milk Tea'}
            </div>
            <button onClick={onClose} className="absolute top-5 right-6 text-white/50 hover:text-white transition-colors">
              <CloseIcon size={6} />
            </button>
          </div>
          <div className="p-6 space-y-5 overflow-y-auto bg-white">
            <div>
              <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Sugar Level</label>
              <div className="flex gap-2">
                {SUGAR_LEVELS.map((level: string) => (
                  <button key={level} onClick={() => onSugarChange(level)}
                    className={`flex-1 py-2 rounded-[0.625rem] text-sm font-black transition-all ${comboDrinkSugar === level && comboDrinkSugar !== '' ? 'bg-[#7c14d4] text-white shadow-md' : 'bg-white text-black border-2 border-[#e9d5ff] hover:bg-[#f5f0ff]'}`}>
                    {level}
                  </button>
                ))}
              </div>
              {comboDrinkSugar === '' && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1.5 ml-1">⚠ Please select sugar level</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Extra</label>
              <AddOnTriggerButton count={comboDrinkAddOns.length} onClick={onOpenAddOns} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Options (Free)</label>
              <div className="flex flex-wrap gap-2">
                {EXTRA_OPTIONS
                  .filter((opt: string) => {
                    const isPizzaCombo   = pendingComboCart.name?.toUpperCase().includes('PIZZA +');
                    const isClassicPearl = pendingComboCart.name?.toUpperCase().includes('CLASSIC PEARL');
                    if (['NO PRL', 'W/ PRL'].includes(opt)) {
                      return isPizzaCombo && !isClassicPearl;
                    }
                    return true;
                  })
                  .map((opt: string) => (
                    <button key={opt} onClick={() => onToggleOption(opt)}
                      className={`px-3 py-2 rounded-[0.625rem] text-sm font-bold uppercase transition-all ${comboDrinkOptions.includes(opt) ? 'bg-[#7c14d4] text-white shadow-md' : 'bg-white text-black border-2 border-[#e9d5ff] hover:bg-[#f5f0ff]'}`}>
                      {opt}
                    </button>
                  ))}
              </div>
            </div>
            <button onClick={onConfirm}
              className="w-full py-4 rounded-[0.625rem] font-black text-sm uppercase tracking-[0.2em] shadow-lg transition-colors bg-[#7c14d4] text-white hover:bg-[#6a12b8]">
              🧋 Confirm & Add to Order
            </button>
          </div>
        </div>
      </div>

      {comboDrinkAddOnModalOpen && (
        <AddOnModalShell
          title="Classic Pearl Add-ons"
          addOns={filteredAddOns}
          selected={comboDrinkAddOns}
          onToggle={onToggleAddOn}
          onClose={onCloseAddOns}
          zIndex="z-[120]"
          orderCharge={orderCharge}
        />
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MixAndMatchDrinkModal
// ─────────────────────────────────────────────────────────────────────────────

interface MixAndMatchDrinkModalProps {
  pendingMixMatchCart: CartItem;
  drinkItems: MenuItem[];
  selectedDrink: MenuItem | null;
  drinkSugar: string;
  drinkOptions: string[];
  drinkAddOns: string[];
  filteredAddOns: { id: number; name: string; price: number; grab_price?: number; panda_price?: number }[];
  drinkAddOnModalOpen: boolean;
  orderCharge: 'grab' | 'panda' | null;
  onSelectDrink: (item: MenuItem) => void;
  onSugarChange: (s: string) => void;
  onToggleOption: (opt: string) => void;
  onOpenAddOns: () => void;
  onCloseAddOns: () => void;
  onToggleAddOn: (name: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  onToggleOrderCharge: (type: 'grab' | 'panda') => void;
}

export const MixAndMatchDrinkModal = ({
  pendingMixMatchCart,
  drinkItems,
  selectedDrink,
  drinkSugar,
  drinkOptions,
  drinkAddOns,
  filteredAddOns,
  drinkAddOnModalOpen,
  orderCharge,
  onSelectDrink,
  onSugarChange,
  onToggleOption,
  onOpenAddOns,
  onCloseAddOns,
  onToggleAddOn,
  onToggleOrderCharge,
  onConfirm,
  onClose,
}: MixAndMatchDrinkModalProps) => {
  const drinkOpts        = (selectedDrink as unknown as { options?: string[] })?.options ?? [];
  const hasPearlOption   = drinkOpts.includes('pearl');
  const hasPearlSelected = drinkOptions.some(o => ['NO PRL', 'W/ PRL'].includes(o));
  const canConfirm       = selectedDrink !== null && drinkSugar !== '' && (!hasPearlOption || hasPearlSelected);

  return (
    <>
      <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-2xl rounded-[0.625rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="bg-[#7c14d4] p-5 text-white relative shrink-0">
            <div className="text-[10px] font-bold uppercase opacity-60 tracking-widest leading-none mb-1">Step 2 of 2 — Choose Your Drink</div>
            <h2 className="text-base font-black uppercase tracking-wider leading-tight">
              {pendingMixMatchCart.name}
            </h2>
            <div className="mt-1 inline-block bg-white/20 text-white text-[10px] font-black uppercase px-3 py-1 rounded-[0.625rem] tracking-widest">
              🧋 Select a drink to complete your Mix & Match
            </div>
            <button onClick={onClose} className="absolute top-5 right-6 text-white/50 hover:text-white transition-colors">
              <CloseIcon size={6} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            {!selectedDrink ? (
              <div className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Available Drinks</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {drinkItems.map(drink => (
                    <button
                      key={drink.id}
                      onClick={() => onSelectDrink(drink)}
                      className="p-4 rounded-[0.625rem] border-2 border-[#e9d5ff] bg-white hover:border-[#7c14d4] hover:bg-[#f5f0ff] transition-all text-left flex flex-col gap-1"
                    >
                      <span className="text-xs font-black uppercase leading-tight text-black">{drink.name}</span>
                      {drink.size && drink.size !== 'none' && (
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">{drink.size}</span>
                      )}
                      <span className="text-sm font-black text-[#7c14d4] mt-1">₱{Number(drink.price).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between bg-[#f5f0ff] border-2 border-[#7c14d4]/30 rounded-[0.625rem] px-4 py-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Selected Drink</p>
                    <p className="font-black text-sm text-black uppercase">{selectedDrink.name}</p>
                  </div>
                  <button
                    onClick={() => onSelectDrink(null as unknown as MenuItem)}
                    className="text-[10px] font-black uppercase text-[#7c14d4] hover:text-red-500 transition-colors"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Sugar Level</label>
                  <div className="flex gap-2">
                    {SUGAR_LEVELS.map((level: string) => (
                      <button key={level} onClick={() => onSugarChange(level)}
                        className={`flex-1 py-2 rounded-[0.625rem] text-sm font-black transition-all ${drinkSugar === level ? 'bg-[#7c14d4] text-white shadow-md' : 'bg-white text-black border-2 border-[#e9d5ff] hover:bg-[#f5f0ff]'}`}>
                        {level}
                      </button>
                    ))}
                  </div>
                  {drinkSugar === '' && (
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1.5 ml-1">⚠ Please select sugar level</p>
                  )}
                </div>

                {(() => {
                  const drinkOpts = (selectedDrink as unknown as { options?: string[] })?.options ?? [];
                  const visibleOpts = EXTRA_OPTIONS.filter((opt: string) => {
                    const pearlOpts = ['NO PRL', 'W/ PRL'];
                    const iceOpts   = ['NO ICE', '-ICE', '+ICE'];
                    if (pearlOpts.includes(opt)) return drinkOpts.includes('pearl');
                    if (iceOpts.includes(opt))   return drinkOpts.includes('ice');
                    if (opt === 'WARM')           return false;
                    return true;
                  });
                  if (visibleOpts.length === 0) return null;
                  return (
                    <div>
                      <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Options (Free)</label>
                      <div className="flex flex-wrap gap-2">
                        {visibleOpts.map((opt: string) => (
                          <button key={opt} onClick={() => onToggleOption(opt)}
                            className={`px-3 py-2 rounded-[0.625rem] text-sm font-bold uppercase transition-all ${drinkOptions.includes(opt) ? 'bg-[#7c14d4] text-white shadow-md' : 'bg-white text-black border-2 border-[#e9d5ff] hover:bg-[#f5f0ff]'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Extra Add-ons</label>
                  <AddOnTriggerButton count={drinkAddOns.length} onClick={onOpenAddOns} />
                </div>

                {/* Delivery charges */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">
                    Charges
                    {orderCharge === 'grab'  && Number((pendingMixMatchCart as { grab_price?: number })?.grab_price  ?? 0) > 0 ? ` (+₱${Number((pendingMixMatchCart as { grab_price?: number })?.grab_price).toFixed(2)})` : ''}
                    {orderCharge === 'panda' && Number((pendingMixMatchCart as { panda_price?: number })?.panda_price ?? 0) > 0 ? ` (+₱${Number((pendingMixMatchCart as { panda_price?: number })?.panda_price).toFixed(2)})` : ''}
                    {orderCharge && Number((pendingMixMatchCart as { grab_price?: number; panda_price?: number })?.[orderCharge === 'grab' ? 'grab_price' : 'panda_price'] ?? 0) === 0 ? ' (No Surcharge)' : ''}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['grab', 'panda'] as const).map(type => {
                      const isActive   = orderCharge === type;
                      const isDisabled = orderCharge !== null && orderCharge !== type;
                      return (
                        <button key={type} type="button"
                          onClick={() => !isDisabled && onToggleOrderCharge(type)}
                          disabled={isDisabled}
                          className={`p-3 rounded-[0.625rem] border-2 transition-all flex items-center justify-center gap-2
                            ${isDisabled ? 'border-zinc-200 bg-white text-zinc-300 opacity-40 cursor-not-allowed'
                              : isActive
                                ? type === 'grab' ? 'border-green-500 bg-green-50 text-green-700' : 'border-pink-500 bg-pink-50 text-pink-700'
                                : type === 'grab' ? 'border-zinc-300 bg-white text-zinc-500 hover:border-green-300 hover:bg-green-50' : 'border-zinc-300 bg-white text-zinc-500 hover:border-pink-300 hover:bg-pink-50'
                            }`}>
                          <span className="font-bold text-xs uppercase">{type === 'grab' ? 'Grab Food' : 'Food Panda'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={onConfirm}
                  disabled={!canConfirm}
                  className={`w-full py-4 rounded-[0.625rem] font-black text-sm uppercase tracking-[0.2em] shadow-lg transition-colors ${canConfirm ? 'bg-[#7c14d4] text-white hover:bg-[#6a12b8]' : 'bg-[#f5f0ff] text-black cursor-not-allowed'}`}
                >
                  {!drinkSugar ? '⚠ Select Sugar Level First' : hasPearlOption && !hasPearlSelected ? 'Select Pearl Option First' : '✓ Add Mix & Match to Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {drinkAddOnModalOpen && (
        <AddOnModalShell
          title="Drink Add-ons"
          addOns={filteredAddOns}
          selected={drinkAddOns}
          onToggle={onToggleAddOn}
          onClose={onCloseAddOns}
          zIndex="z-[120]"
          orderCharge={orderCharge}
        />
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ConfirmOrderModal
// ─────────────────────────────────────────────────────────────────────────────

interface ConfirmOrderModalProps {
  cart: CartItem[];
  cashierName: string;
  totalCount: number;
  subtotal: number;
  amtDue: number;
  vatableSales: number;
  vatAmount: number;
  change: number;
  totalDiscountDisplay: number;
  orderCharge: 'grab' | 'panda' | null;
  selectedDiscount: Discount | null;
  selectedDiscounts: Discount[];
  paymentMethod: string;
  cashTendered: number | '';
  referenceNumber: string;
  discountRemarks: string;
  paxSenior: number;
  paxPwd: number;
  seniorId: string;
  pwdId: string;
  discounts: Discount[];
  activeTab: 'payment' | 'discount' | 'pax';
  submitting: boolean;
  onTabChange: (t: 'payment' | 'discount' | 'pax') => void;
  onPaymentMethodChange: (m: string) => void;
  onCashTenderedChange: (v: number | '') => void;
  onReferenceNumberChange: (v: string) => void;
  onDiscountChange: (d: Discount | null) => void;
  onDiscountsChange: (d: Discount[]) => void;
  onDiscountRemarksChange: (v: string) => void;
  onPaxSeniorChange: (v: number) => void;
  onPaxPwdChange: (v: number) => void;
  onSeniorIdChange: (v: string) => void;
  onPwdIdChange: (v: string) => void;
  onEditCartItem: (i: number) => void;
  onConfirm: () => void;
  onClose: () => void;
  onResetOrder?: () => void;
  vatType?: 'vat' | 'non_vat';
}

export const ConfirmOrderModal = ({
  cart, cashierName, totalCount, subtotal, amtDue,
  vatableSales, vatAmount, change, totalDiscountDisplay,
  orderCharge, selectedDiscount, selectedDiscounts, paymentMethod, cashTendered,
  referenceNumber, discountRemarks, paxSenior, paxPwd, seniorId, pwdId, discounts,
  activeTab, submitting, vatType = 'vat',
  onTabChange, onPaymentMethodChange, onCashTenderedChange,
  onReferenceNumberChange, onDiscountChange, onDiscountsChange, onDiscountRemarksChange,
  onPaxSeniorChange, onPaxPwdChange, onSeniorIdChange, onPwdIdChange,
  onEditCartItem, onConfirm, onClose,
  onResetOrder,
}: ConfirmOrderModalProps) => {
  const { showToast } = useToast();
  const isVat = vatType === 'vat';
  const [showPinOverlay, setShowPinOverlay] = React.useState(false);

  return (
    <>
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* added `relative` so AdminPinOverlay anchors to this box */}
      <div className="bg-white w-full max-w-6xl rounded-[0.625rem] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] relative">

        {/* Admin PIN overlay */}
        {showPinOverlay && (
          <AdminPinOverlay
            onCancel={() => setShowPinOverlay(false)}
            onSuccess={() => {
              onResetOrder?.();
              onClose();
              showToast('Order cancelled by admin authorization.', 'error');
            }}
          />
        )}

        {/* Header */}
        <div className="bg-[#7c14d4] p-5 text-white text-center shrink-0 shadow-sm z-10 flex justify-between items-center">
          <div className="w-1/3" />
          <div className="w-1/3">
            <h2 className="text-xl font-black uppercase tracking-widest">Payment Details</h2>
            <p className="text-white/60 text-xs mt-1 uppercase">Cashier: {cashierName ?? 'Admin'}</p>
          </div>
          <div className="w-1/3 text-right">
            {/* always clickable — triggers PIN overlay for everyone */}
            <button
              onClick={() => setShowPinOverlay(true)}
              className="text-white/50 hover:text-white transition-colors"
            >
              <CloseIcon size={6} />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-[50vh] max-h-[85vh] overflow-hidden bg-zinc-50">

          {/* Left: Cart summary */}
          <div className="flex-1 flex flex-col bg-white border-r border-zinc-200 overflow-hidden">
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="font-black text-sm text-black uppercase mb-4 tracking-wider">Cart Items</h3>
              <div className="space-y-4">
                {cart.map((item, i) => (
                  <div key={i} onClick={() => onEditCartItem(i)}
                    className="flex justify-between items-start pb-3 border-b border-[#e9d5ff] last:border-0 mb-2 cursor-pointer hover:bg-[#f5f0ff] rounded-lg px-2 -mx-2 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-black">
                        {item.qty}x {item.name}
                        {item.cupSizeLabel && <span className="ml-1 opacity-60">({item.cupSizeLabel})</span>}
                      </p>
                      <div className="text-[10px] text-zinc-500 mt-1 ml-2">
                        {item.sugarLevel != null && <p>• Sugar {item.sugarLevel}</p>}
                        {item.options?.map(o => <p key={o}>• {o}</p>)}
                        {item.addOns?.map(a => <p key={a}>• + {a}</p>)}
                        {item.remarks && <p className="italic">• {item.remarks}</p>}
                      </div>
                    </div>
                    <p className="font-black text-sm text-black">
                      ₱ {(item.finalPrice + getItemSurcharge(item)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Section */}
            <div className="p-6 bg-[#f5f0ff] shrink-0 border-t border-[#e9d5ff]">
              <div className="space-y-1.5 text-[11px] font-bold text-zinc-600">
                <div className="flex justify-between"><span>Quantity (Items)</span><span>{totalCount}</span></div>
                <div className="flex justify-between"><span>Sub Total</span><span>₱ {subtotal.toFixed(2)}</span></div>
                {cart.some(i => i.charges?.grab || i.charges?.panda) && (
                  <div className="flex justify-between text-zinc-500">
                    <span>{orderCharge === 'grab' ? 'Grab' : 'FoodPanda'} Surcharge</span>
                    <span>₱ {cart.reduce((acc, i) => acc + getItemSurcharge(i), 0).toFixed(2)}</span>
                  </div>
                )}
                {isVat ? (
                  <>
                    <div className="flex justify-between"><span>VATable Sales</span><span>₱ {vatableSales.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>VAT Amount (12%)</span><span>₱ {vatAmount.toFixed(2)}</span></div>
                  </>
                ) : (
                  <div className="flex justify-between text-zinc-400 text-[10px]">
                    <span>VAT Exempt</span><span>Non-VAT</span>
                  </div>
                )}
                {totalDiscountDisplay > 0 && (
                  <div className="flex justify-between text-red-500 font-black">
                    <span>
                      Discount
                      {selectedDiscount ? ` (${selectedDiscount.name})` : ''}
                      {selectedDiscounts.length > 0 ? ` + ${selectedDiscounts.map(d => d.name).join(' + ')}` : ''}
                    </span>
                    <span>- ₱ {totalDiscountDisplay.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-black border-t-2 border-[#e9d5ff] pt-3 mt-2">
                  <span className="font-black uppercase text-sm">Amt Due</span>
                  <span className="text-2xl font-black">₱ {amtDue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Tabs */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="flex border-b border-[#e9d5ff] shrink-0 bg-[#f5f0ff] p-2 gap-2">
              {([
                { id: 'payment',  label: 'Payment',    dot: false },
                { id: 'discount', label: 'Promo',      dot: !!selectedDiscount },
                { id: 'pax',      label: 'Senior/PWD', dot: selectedDiscounts.length > 0 },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => onTabChange(tab.id)}
                  className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-[0.625rem] transition-all border-2 relative
                    ${activeTab === tab.id ? 'bg-[#7c14d4] text-white border-[#7c14d4] shadow-md' : 'bg-white text-black border-[#e9d5ff] hover:border-[#7c14d4]/40 hover:bg-[#f5f0ff]'}`}>
                  {tab.label}
                  {tab.dot && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}
                </button>
              ))}
            </div>

            <div className="flex-1 p-6 overflow-y-auto">

              {/* Payment Tab */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-black text-sm text-black uppercase mb-3 tracking-wider">Payment Method</h3>
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {PAYMENT_METHODS.map(({ id, label }) => {
                        const isDeliveryMethod = id === 'grab' || id === 'food_panda';
                        const isLocked =
                          (orderCharge === 'grab'  && id !== 'grab') ||
                          (orderCharge === 'panda' && id !== 'food_panda') ||
                          (!orderCharge && isDeliveryMethod);

                        return (
                          <button
                            key={id}
                            onClick={() => { if (!isLocked) { onPaymentMethodChange(id); onReferenceNumberChange(''); onCashTenderedChange(''); }}}
                            disabled={isLocked}
                            className={`py-3 rounded-[0.625rem] font-black text-sm uppercase transition-all border-2 flex flex-col items-center gap-1
                              ${isLocked
                                ? 'bg-zinc-100 text-zinc-300 border-zinc-100 cursor-not-allowed opacity-40'
                                : paymentMethod === id
                                  ? 'bg-[#7c14d4] text-white border-[#7c14d4] shadow-md'
                                  : 'bg-[#f5f0ff] text-black border-[#e9d5ff] hover:border-[#7c14d4]/40'
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {paymentMethod === 'cash' ? (
                      <>
                        <h3 className="font-black text-[10px] text-zinc-400 tracking-widest uppercase mb-2">Cash Tendered</h3>
                        <div className="relative mb-3">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-2xl text-[#7c14d4]/30">₱</span>
                          <input type="number" value={cashTendered} onChange={e => onCashTenderedChange(e.target.value ? Number(e.target.value) : '')}
                            className="w-full bg-[#f5f0ff] border-2 border-[#e9d5ff] rounded-[0.625rem] py-4 pl-12 pr-4 text-3xl font-black text-black outline-none focus:border-[#7c14d4] focus:bg-white transition-colors" placeholder="0.00" />
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                          <button onClick={() => onCashTenderedChange(amtDue)} className="col-span-2 lg:col-span-4 bg-[#7c14d4] hover:bg-[#6a12b8] hover:text-white text-white py-2.5 rounded-[0.625rem] font-black text-sm uppercase tracking-widest transition-all shadow-md border-2 border-[#7c14d4]">
                            Exact Amount (₱ {amtDue.toFixed(2)})
                          </button>
                          {[100, 200, 500, 1000].map(amount => (
                            <button key={amount} onClick={() => onCashTenderedChange(amount)}
                              className="bg-[#f5f0ff] hover:bg-[#7c14d4] hover:text-white text-black py-3 rounded-[0.625rem] font-black text-base transition-all border-2 border-[#e9d5ff] hover:border-[#7c14d4]">
                              ₱ {amount}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between items-center mt-4 bg-[#f5f0ff] border border-[#e9d5ff] p-4 rounded-[0.625rem]">
                          <span className="font-black text-zinc-400 uppercase text-xs tracking-widest">Change</span>
                          <span className="text-2xl font-black text-green-600">₱ {change.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-black text-[10px] text-zinc-400 tracking-widest uppercase">
                            {paymentMethod === 'grab' ? 'GrabFood Order Reference (Optional)'
                              : paymentMethod === 'food_panda' ? 'FoodPanda Order Reference (Optional)'
                              : 'Reference Number'}
                          </h3>
                          <input
                            type="text"
                            value={referenceNumber}
                            onChange={e => {
                            const value = e.target.value;
                            // ✅ allow only numbers and max 13 digits
                            if (/^\d{0,13}$/.test(value)) {
                            onReferenceNumberChange(value);
                            }
                            }}
                            maxLength={13}
                            className="w-full bg-zinc-50 border-2 border-zinc-300 rounded-[0.625rem] py-4 px-5 text-xl font-black outline-none focus:border-[#3b2063] focus:bg-white transition-colors"
                            placeholder={paymentMethod === 'grab' ? 'GRAB-XXXXXX' : paymentMethod === 'food_panda' ? 'FP-XXXXXX' : 'REF#'}
                          />
                        </div>

                        {(paymentMethod === 'grab' || paymentMethod === 'food_panda') && (
                          <div className="space-y-2">
                            <h3 className="font-black text-[10px] text-zinc-400 tracking-widest uppercase">
                              Cash Sent to {paymentMethod === 'grab' ? 'GrabFood' : 'FoodPanda'} Credits
                            </h3>
                            <div className="relative">
                              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-2xl text-[#7c14d4]/30">₱</span>
                              <input
                                type="number"
                                value={cashTendered}
                                onChange={e => onCashTenderedChange(e.target.value ? Number(e.target.value) : '')}
                                className="w-full bg-[#f5f0ff] border-2 border-[#e9d5ff] rounded-[0.625rem] py-4 pl-12 pr-4 text-3xl font-black text-black outline-none focus:border-[#7c14d4] focus:bg-white transition-colors"
                                placeholder="0.00"
                              />
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <button onClick={() => onCashTenderedChange(amtDue)}
                                className="col-span-4 bg-[#7c14d4] text-white py-2.5 rounded-[0.625rem] font-black text-sm uppercase tracking-widest">
                                Exact Amount (₱ {amtDue.toFixed(2)})
                              </button>
                              {[100, 200, 500, 1000].map(amount => (
                                <button key={amount} onClick={() => onCashTenderedChange(amount)}
                                  className="bg-[#f5f0ff] hover:bg-[#7c14d4] hover:text-white text-black py-3 rounded-[0.625rem] font-black text-base transition-all border-2 border-[#e9d5ff] hover:border-[#7c14d4]">
                                  ₱{amount}
                                </button>
                              ))}
                            </div>
                            {cashTendered !== '' && (
                              <div className="flex justify-between items-center bg-[#f5f0ff] border border-[#e9d5ff] p-4 rounded-[0.625rem]">
                                <span className="font-black text-zinc-400 uppercase text-xs tracking-widest">
                                  {Number(cashTendered) >= amtDue ? 'Change' : 'Short by'}
                                </span>
                                <span className={`text-2xl font-black ${Number(cashTendered) >= amtDue ? 'text-green-600' : 'text-red-500'}`}>
                                  ₱ {Math.abs(Number(cashTendered) - amtDue).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Discount Tab */}
              {activeTab === 'discount' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-black text-sm text-[#3b2063] uppercase tracking-wider">Select Promo</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => onDiscountChange(null)}
                        className={`p-3 rounded-[0.625rem] text-sm font-black uppercase transition-all border-2 flex items-center justify-center text-center
                          ${!selectedDiscount ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-zinc-50 text-red-500 border-red-100 hover:border-red-300'}`}>
                        Remove Promo
                      </button>
                     {discounts.filter(d => d.type === 'Global-Percent' && !['SENIOR', 'PWD', 'DIPLOMAT'].some(x => d.name.toUpperCase().includes(x))).map(d => (
                        <button key={d.id} onClick={() => onDiscountChange(d)}
                          className={`p-3 rounded-[0.625rem] text-sm font-black uppercase transition-all border-2 flex items-center justify-center text-center
                            ${selectedDiscount?.id === d.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-emerald-300'}`}>
                          {d.name} ({d.amount}{d.type.includes('Percent') ? '%' : ' OFF'})
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-[10px] text-zinc-400 tracking-widest uppercase">Discount Remarks</h3>
                    <textarea value={discountRemarks} onChange={e => onDiscountRemarksChange(e.target.value)}
                      placeholder="Enter notes (e.g., Manager's Approval, Birthday Promo)"
                      className="w-full text-sm font-bold p-4 bg-zinc-50 border-2 border-zinc-200 rounded-[0.625rem] outline-none focus:border-[#3b2063] focus:bg-white transition-colors h-24 resize-none" />
                  </div>
                </div>
              )}

              {/* PAX Tab — Senior/PWD Multi-Select Discounts */}
              {activeTab === 'pax' && (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                    <p className="text-xs font-bold text-amber-900 uppercase tracking-widest">Original Price: ₱ {subtotal.toFixed(2)}</p>
                  </div>

                  {/* Senior Citizen PAX Section */}
                  <div className="border-b border-zinc-200 pb-6">
                    <h3 className="font-black text-sm text-[#3b2063] uppercase tracking-wider mb-4">Senior Citizen Discount</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block mb-2">Number of Senior Customers (PAX)</label>
                        <input type="number" value={paxSenior} onChange={e => onPaxSeniorChange(Math.min(Number(e.target.value), totalCount - paxPwd))} min="0" max={totalCount - paxPwd}
                          className="w-full px-3 py-2 border-2 border-zinc-200 rounded-lg font-bold text-sm focus:border-blue-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block mb-2">Senior ID / Card Number</label>
                        <input type="text" value={seniorId} onChange={e => onSeniorIdChange(e.target.value)} placeholder="ID Number"
                          className="w-full px-3 py-2 border-2 border-zinc-200 rounded-lg font-bold text-sm focus:border-blue-500 focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* PWD PAX Section */}
                  <div className="border-b border-zinc-200 pb-6">
                    <h3 className="font-black text-sm text-[#3b2063] uppercase tracking-wider mb-4">PWD Discount</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block mb-2">Number of PWD Customers (PAX)</label>
                        <input type="number" value={paxPwd} onChange={e => onPaxPwdChange(Math.min(Number(e.target.value), totalCount - paxSenior))} min="0" max={totalCount - paxSenior}
                          className="w-full px-3 py-2 border-2 border-zinc-200 rounded-lg font-bold text-sm focus:border-blue-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block mb-2">PWD ID / Card Number</label>
                        <input type="text" value={pwdId} onChange={e => onPwdIdChange(e.target.value)} placeholder="ID Number"
                          className="w-full px-3 py-2 border-2 border-zinc-200 rounded-lg font-bold text-sm focus:border-blue-500 focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Multi-select Discount Buttons */}
                  <div className="space-y-3">
                    <h3 className="font-black text-sm text-[#3b2063] uppercase tracking-wider">
                      Available Discounts
                      <span className="ml-2 text-[10px] font-bold text-zinc-400 normal-case tracking-normal">(You can select both)</span>
                    </h3>

                    {/* Clear all button */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onDiscountsChange([])}
                        className={`p-3 rounded-[0.625rem] text-sm font-black uppercase transition-all border-2 flex items-center justify-center text-center
                          ${selectedDiscounts.length === 0
                            ? 'bg-red-500 text-white border-red-500 shadow-md'
                            : 'bg-zinc-50 text-red-500 border-red-100 hover:border-red-300'}`}
                      >
                        No Discount
                      </button>

                      {discounts
                        .filter(d => ['SENIOR', 'PWD', 'DIPLOMAT'].some(x => d.name.toUpperCase().includes(x)))
                        .map(d => {
                          const isSelected = selectedDiscounts.some(sd => sd.id === d.id);

                          const isSenior   = d.name.toUpperCase().includes('SENIOR');
                          const isPwd      = d.name.toUpperCase().includes('PWD') || d.name.toUpperCase().includes('DIPLOMAT');
                          const isDisabled = (isSenior && paxSenior === 0) || (isPwd && paxPwd === 0);

                          return (
                            <button
                              key={d.id}
                              disabled={isDisabled}
                              onClick={() => {
                                if (isDisabled) return;
                                if (isSelected) {
                                  onDiscountsChange(selectedDiscounts.filter(sd => sd.id !== d.id));
                                } else {
                                  onDiscountsChange([...selectedDiscounts, d]);
                                }
                              }}
                              className={`relative p-3 rounded-[0.625rem] text-sm font-black uppercase transition-all border-2 flex flex-col items-center justify-center text-center
                                ${isDisabled
                                  ? 'bg-zinc-100 text-zinc-300 border-zinc-100 cursor-not-allowed opacity-50'
                                  : isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-blue-300 hover:bg-blue-50'
                                }`}
                            >
                              {/* Checkmark badge when selected */}
                              {isSelected && (
                                <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="#2563eb" className="w-3 h-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                </span>
                              )}
                              <span>{d.name}</span>
                              <span className="text-xs font-semibold mt-1">
                                ({d.amount}{d.type.includes('Percent') ? '%' : ' OFF'})
                              </span>
                              {isDisabled && (
                                <span className="text-[9px] font-bold text-zinc-400 mt-1 normal-case">
                                  {isSenior ? 'Set Senior PAX first' : 'Set PWD PAX first'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Final Price Display */}
                  {selectedDiscounts.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                      <p className="text-xs font-bold text-emerald-900 uppercase tracking-widest mb-1">
                        Applied: {selectedDiscounts.map(d => d.name).join(' + ')}
                      </p>
                      <p className="text-2xl font-black text-emerald-700">₱ {amtDue.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-zinc-200 shrink-0">
              <button
                onClick={onConfirm}
                disabled={
                  submitting ||
                  (paymentMethod === 'cash' && (cashTendered === '' || cashTendered < amtDue))
                }
                className="w-full bg-[#7c14d4] hover:bg-[#6a12b8] transition-colors text-white py-4 rounded-[0.625rem] font-black uppercase tracking-widest shadow-lg disabled:bg-zinc-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Complete Transaction'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CustomerNameModal
// ─────────────────────────────────────────────────────────────────────────────

interface CustomerNameModalProps {
  customerName: string;
  onChange: (v: string) => void;
  onSkip: () => void;
  onConfirm: () => void;
}

export const CustomerNameModal = ({ customerName, onChange, onConfirm }: CustomerNameModalProps) => (
  <div className="fixed inset-0 z-140 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="bg-white w-full max-w-sm rounded-[0.625rem] shadow-2xl overflow-hidden">
      <div className="bg-[#7c14d4] px-6 pt-6 pb-5 text-white text-center">
        <div className="w-12 h-12 bg-emerald-400 rounded-[0.625rem] flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/50 mb-1">Order Confirmed</p>
        <h2 className="text-lg font-black uppercase tracking-widest">Customer Name</h2>
        <p className="text-white/50 text-[10px] mt-1 uppercase tracking-wider">For sticker label</p>
      </div>
      <div className="p-6 bg-white space-y-4">
        <input
          type="text"
          value={customerName}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onConfirm(); }}
          placeholder="e.g. Juan"
          autoFocus
          className="w-full bg-[#f5f0ff] border border-[#e9d5ff] text-sm font-bold p-4 resize-none h-16 outline-none focus:border-[#7c14d4] focus:bg-white transition-colors uppercase placeholder:normal-case placeholder:text-[#7c14d4]/30"
        />
        <button
          onClick={onConfirm}
          disabled={customerName.trim() === ''}
          className={`w-full py-3 rounded-[0.625rem] font-black text-xs uppercase tracking-widest transition-colors shadow-md
            ${customerName.trim() !== '' ? 'bg-[#7c14d4] text-white hover:bg-[#6a12b8]' : 'bg-[#f5f0ff] text-zinc-400 cursor-not-allowed'}`}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);
// ─────────────────────────────────────────────────────────────────────────────
// SuccessModal
// ─────────────────────────────────────────────────────────────────────────────

interface SuccessModalProps {
  orNumber: string;
  hasStickers: boolean;
  printedReceipt: boolean;
  printedKitchen: boolean;
  printedStickers: boolean;
  onPrintReceipt: () => void;
  onPrintKitchen: () => void;
  onPrintStickers: () => void;
  onNewOrder: () => void;
}

export const SuccessModal = ({
  orNumber, hasStickers,
  printedReceipt, printedKitchen, printedStickers,
  onPrintReceipt, onPrintKitchen, onPrintStickers, onNewOrder,
}: SuccessModalProps) => {
  const printItems = [
    {
      label: 'Customer Receipt', done: printedReceipt, onPrint: onPrintReceipt,
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0v3.398c0 .796.604 1.48 1.389 1.554a41.349 41.349 0 0 1 7.722 0c.785.074 1.389-.758 1.389-1.554V7.034Z" /></svg>,
    },
    {
      label: 'Order Ticket', done: printedKitchen, onPrint: onPrintKitchen,
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.866 8.21 8.21 0 0 0 3 2.48Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" /></svg>,
    },
    ...(hasStickers ? [{
      label: 'Drink Stickers', done: printedStickers, onPrint: onPrintStickers,
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>,
    }] : []),
  ];

  const pending    = printItems.filter(p => !p.done);
  const allPrinted = true;

  return (
    <div className="fixed inset-0 z-130 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-[0.625rem] shadow-2xl flex flex-col overflow-hidden border border-zinc-200">
        <div className="bg-[#7c14d4] px-9 pt-10 pb-9 text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 border-2 border-white/10 rounded-[0.625rem] rotate-12" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 border border-white/10 rounded-[0.625rem] -rotate-6" />
          <div className="relative flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-400 rounded-[0.625rem] flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 leading-none mb-1.5">Transaction Complete</p>
              <h2 className="text-2xl font-black uppercase tracking-widest leading-none">Order Saved</h2>
              <p className="text-white/60 text-xs font-bold mt-2 font-mono">{orNumber}</p>
            </div>
          </div>
        </div>

        <div className="px-8 pt-6 pb-4 space-y-3 bg-white">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-4">Required Prints</p>
          {printItems.map(({ label, done, onPrint, icon }) => (
            <button key={label} onClick={onPrint}
              className={`w-full h-14 flex items-center justify-between px-5 border-2 transition-all font-bold text-xs uppercase tracking-widest rounded-[0.625rem]
                ${done ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-[#e9d5ff] text-black hover:border-[#7c14d4] hover:text-[#7c14d4] hover:bg-[#f5f0ff]'}`}>
              <div className="flex items-center gap-3">{icon}<span>{label}</span></div>
              {done ? <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Printed ✓</span> : <ChevronRight />}
            </button>
          ))}
        </div>

        <div className="px-8 pb-8 bg-white">
          <div className="mt-1 mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                {pending.length === 0 ? 'All done' : `${printItems.length - pending.length} / ${printItems.length} printed`}
              </span>
              {pending.length > 0 && (
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Pending: {pending.map(p => p.label).join(', ')}</span>
              )}
            </div>
            <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${pending.length === 0 ? 'bg-emerald-400' : 'bg-[#3b2063]'}`}
                style={{ width: `${((printItems.length - pending.length) / printItems.length) * 100}%` }}
              />
            </div>
          </div>
          <button onClick={onNewOrder} disabled={!allPrinted}
            className={`w-full h-14 font-black uppercase tracking-widest text-sm transition-all rounded-[0.625rem] flex items-center justify-center gap-2
              ${allPrinted ? 'bg-[#7c14d4] hover:bg-[#6a12b8] text-white cursor-pointer' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>
            {allPrinted ? <><span>New Order</span><ArrowRightIcon /></> : `Print ${pending.length} remaining to continue`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable trigger button for opening add-on sheet
// ─────────────────────────────────────────────────────────────────────────────

export const AddOnTriggerButton = ({ count, onClick }: { count: number; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full py-4 rounded-[0.625rem] border-2 border-dashed border-[#7c14d4]/40 bg-[#f5f0ff] hover:bg-[#e4dbff] text-black font-black uppercase tracking-wider text-sm flex items-center justify-center transition-all group"
  >
    <span className="mr-2">{count > 0 ? `${count} Add-on(s) Selected` : 'Select Add-ons'}</span>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  </button>
);

export { AddOnModalShell };