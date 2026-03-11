"use client"

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { type MenuItem, type Category, type CartItem, SUGAR_LEVELS, EXTRA_OPTIONS, WINGS_QUANTITIES } from '../types/index';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Discount {
  id: number;
  name: string;
  amount: number;
  type: string;
  status: 'ON' | 'OFF';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateORNumber    = (count = 1) => `SI-${String(count).padStart(10, '0')}`;
const generateQueueNumber = (count = 1) => String(count).padStart(3, '0');

const DrinkIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="m187.4 22.88l-21.5 4.54l22.7 108.08c7.2-.7 14.6-1.2 22-1.6zM256 147.7c-41.2 0-82.3 3.7-123.5 11.1l-11.6 1.1l4.3 22.1l10.6-2.1c20.1-3.2 40.1-6.3 61.2-7.4l8.4 40.1h22.2l-8.4-42.2c51.6-2.1 104.4 1.1 157.1 9.5l10.6 2.1l4.2-22.1l-11.6-1.1c-41.2-7.4-82.3-11.1-123.5-11.1m-119.1 51.6l26.4 281.3l8.3 1c56.2 9.5 112.3 10.6 168.5 0l8.1-1l26.5-281.3h-22.1l-3.6 37.8H232.2l42.3 202.3l-24.3-9.5l-40.4-192.8h-47.3l-3.6-37.8zm188.8 155.3c7.4 0 13.5 6 13.5 13.5s-6.1 13.5-13.5 13.5c-7.5 0-13.5-6-13.5-13.5s6-13.5 13.5-13.5M292 380.2c7.4 0 13.6 6.1 13.6 13.5c0 7.5-6.2 13-13.6 13s-13.6-5.5-13.6-13c0-7.4 6.2-13.5 13.6-13.5m-74.2 5.1c7.5 0 13.5 6.1 13.5 13.5c0 7.9-6 13.2-13.5 13.2c-7.4 0-13.5-5.3-13.5-13.2c0-7.4 6.1-13.5 13.5-13.5m107 7.8c7.5 0 13.6 6 13.6 13.6c0 7.4-6.1 13.7-13.6 13.7c-7.4 0-13.5-6.3-13.5-13.7c0-7.6 6.1-13.6 13.5-13.6m-140.9 10.5c7.5 0 13.5 5.2 13.5 12.6s-6 13.7-13.5 13.7s-13.5-6.3-13.5-13.7s6-12.6 13.5-12.6m111.2 12.6c7.5 0 13.5 6.3 13.5 13.7s-6 13.7-13.5 13.7s-13.5-6.3-13.5-13.7s6-13.7 13.5-13.7m-76.1 7.4c7.5 0 13.6 6.3 13.6 13.7S226.5 451 219 451c-7.4 0-13.5-6.3-13.5-13.7s6.1-13.7 13.5-13.7m-32.7 14.8c7.5 0 13.5 5.2 13.5 12.6s-6 13.7-13.5 13.7c-7.4 0-13.5-6.3-13.5-13.7s6.1-12.6 13.5-12.6m134.7 2.1c7.5 0 13.5 6.3 13.5 13.7s-6 13.7-13.5 13.7s-13.5-6.3-13.5-13.7s6-13.7 13.5-13.7m-66.5 4.2c7.4 0 13.5 5.3 13.5 12.7c0 7.3-6.1 13.7-13.5 13.7c-7.5 0-13.5-6.4-13.5-13.7c0-7.4 6-12.7 13.5-12.7" strokeWidth="13" stroke="currentColor" />
  </svg>
);

// ── Icons ─────────────────────────────────────────────────────────────────────

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 opacity-40">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const CloseIcon = ({ size = 6 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-${size} h-${size}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const MinusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

// ── Constants ─────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { id: 'cash',     label: 'Cash'   },
  { id: 'gcash',   label: 'GCash'  },
  { id: 'paymaya', label: 'Maya'   },
  { id: 'credit',  label: 'Credit' },
  { id: 'debit',   label: 'Debit'  },
] as const;

const TYPE_BADGE = {
  food:  { pill: 'bg-orange-500 text-white', card: 'hover:bg-orange-500 hover:border-orange-500 hover:text-white' },
  wings: { pill: 'bg-orange-500 text-white', card: 'hover:bg-orange-500 hover:border-orange-500 hover:text-white' },
  drink: { pill: 'bg-[#3b2063] text-white',  card: 'hover:bg-[#3b2063] hover:border-[#3b2063] hover:text-white'  },
  promo: { pill: 'bg-emerald-600 text-white', card: 'hover:bg-emerald-600 hover:border-emerald-600 hover:text-white' },
};

const BASE_CARD = 'bg-white font-black text-sm uppercase p-4 rounded-[0.625rem] h-24 shadow-sm border-2 border-zinc-200 transition-all hover:shadow-lg hover:scale-[1.03] active:scale-100 text-[#3b2063] flex items-center justify-center text-center';

// ── Sub-components ────────────────────────────────────────────────────────────

const QtyControl = ({
  value, onDecrement, onIncrement, className = '',
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  className?: string;
}) => (
  <div className={`flex items-center justify-between bg-zinc-50 rounded-[0.625rem] p-2 border-2 border-zinc-200 ${className}`}>
    <button onClick={onDecrement} className="w-11 h-11 bg-white rounded-lg border border-zinc-200 text-zinc-500 hover:text-red-500 hover:border-red-200 transition-colors flex items-center justify-center shadow-sm">
      <MinusIcon />
    </button>
    <span className="font-black text-2xl text-[#3b2063] w-16 text-center tabular-nums">{value}</span>
    <button onClick={onIncrement} className="w-11 h-11 bg-[#3b2063] rounded-lg text-white flex items-center justify-center hover:bg-[#2a1647] transition-colors shadow-sm">
      <PlusIcon />
    </button>
  </div>
);

const AddOnGrid = ({
  addOns, selected, onToggle,
}: {
  addOns: { id: number; name: string; price: number }[];
  selected: string[];
  onToggle: (name: string) => void;
}) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {addOns.map(addon => (
      <button
        key={addon.id}
        onClick={() => onToggle(addon.name)}
        className={`p-3 rounded-[0.625rem] text-left border-2 transition-all h-24 flex flex-col justify-between
          ${selected.includes(addon.name)
            ? 'bg-[#3b2063] border-[#3b2063] text-white'
            : 'bg-white border-zinc-300 text-zinc-600 hover:border-[#3b2063]/40 hover:bg-[#f0ebff]'
          }`}
      >
        <span className="text-[10px] font-black uppercase leading-tight">{addon.name}</span>
        <span className="text-xs font-bold">₱{Number(addon.price).toFixed(2)}</span>
      </button>
    ))}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const SalesOrder = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const branchId   = user?.branch_id ?? null;
  const branchName = user?.branch_name ?? localStorage.getItem('lucky_boba_user_branch') ?? 'Main Branch';

  const handleNavClick = (label: string) => {
    if (label !== 'Home') return;
    if (user?.role === 'cashier')         navigate('/cashier');
    else if (user?.role === 'branch_manager') navigate('/branch-manager');
    else                                  navigate('/dashboard');
  };

  // ── State ─────────────────────────────────────────────────────────────────

  const [cashierName, setCashierName] = useState<string>(() =>
    localStorage.getItem('lucky_boba_user_name') ?? 'Admin'
  );
  const [currentDate, setCurrentDate] = useState(new Date());

  // Cash-in gate — modal is handled by CashIn.tsx
  const [menuAvailable, setMenuAvailable] = useState(false);
  const [checkingCashIn, setCheckingCashIn] = useState(true);

  // Menu / category
  const [categories] = useState<Category[]>(() => {
    const cached = localStorage.getItem('pos_menu_cache');
    return cached ? JSON.parse(cached) : [];
  });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categorySize, setCategorySize]         = useState<string | null>(null);
  const [loading]                               = useState(!localStorage.getItem('pos_menu_cache'));
  const [searchQuery, setSearchQuery]           = useState('');

  // Item selection modal
  const [selectedItem, setSelectedItem]       = useState<MenuItem | null>(null);
  const [qty, setQty]                         = useState(1);
  const [remarks, setRemarks]                 = useState('');
  const [sugarLevel, setSugarLevel]           = useState('100%');
  const [size, setSize]                       = useState<'M' | 'L' | 'none'>('M');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns]   = useState<string[]>([]);
  const [orderCharge, setOrderCharge]         = useState<'grab' | 'panda' | null>(null);
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);

  // Add-ons data
  const [addOnsData] = useState<{ id: number; name: string; price: number }[]>(() => {
    try {
      const c = localStorage.getItem('pos_addons_cache');
      return c ? JSON.parse(c) : [];
    } catch { return []; }
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Cart item editing
  const [editingCartIndex, setEditingCartIndex]         = useState<number | null>(null);
  const [editingCartItem, setEditingCartItem]           = useState<CartItem | null>(null);
  const [itemDiscountType, setItemDiscountType]         = useState<'none' | 'percent' | 'fixed'>('none');
  const [itemDiscountValue, setItemDiscountValue]       = useState<number | ''>('');
  const [editingItemDiscountId, setEditingItemDiscountId] = useState<number | null>(null);

  // Combo drink
  const [isCombodrinkModalOpen, setIsCombodrinkModalOpen]     = useState(false);
  const [comboDrinkSugar, setComboDrinkSugar]                 = useState('100%');
  const [comboDrinkOptions, setComboDrinkOptions]             = useState<string[]>([]);
  const [comboDrinkAddOns, setComboDrinkAddOns]               = useState<string[]>([]);
  const [comboDrinkAddOnModalOpen, setComboDrinkAddOnModalOpen] = useState(false);
  const [pendingComboCart, setPendingComboCart]               = useState<CartItem | null>(null);

  // Confirm / payment
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [submitting, setSubmitting]                 = useState(false);
  const [activeTab, setActiveTab]                   = useState<'payment' | 'discount' | 'pax'>('payment');
  const [cashTendered, setCashTendered]             = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod]           = useState<typeof PAYMENT_METHODS[number]['id']>('cash');
  const [referenceNumber, setReferenceNumber]       = useState('');

  // Pax / discounts
  const [pax, setPax]                         = useState({ regular: 1, senior: 0, pwd: 0, diplomat: 0 });
  const [discountIDs, setDiscountIDs]         = useState({ senior: '', pwd: '', diplomat: '' });
  const [discountRemarks, setDiscountRemarks] = useState('');
  const [discounts] = useState<Discount[]>(() => {
    try {
      const c = localStorage.getItem('pos_discounts_cache');
      const all = c ? JSON.parse(c) : [];
      return all.filter((d: Discount) => d.status === 'ON');
    } catch { return []; }
  });
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);

  // OR / Queue
  const [orNumber, setOrNumber]       = useState(generateORNumber(1));
  const [queueNumber, setQueueNumber] = useState(generateQueueNumber(1));

  // Success / print
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [printTarget, setPrintTarget]               = useState<'receipt' | 'stickers' | 'kitchen' | null>(null);
  const [printedReceipt, setPrintedReceipt]         = useState(false);
  const [printedKitchen, setPrintedKitchen]         = useState(false);
  const [printedStickers, setPrintedStickers]       = useState(false);

  // ── Derived values ────────────────────────────────────────────────────────

  const isDrink = selectedCategory?.type === 'drink';
  const isWings = selectedCategory?.name === 'CHICKEN WINGS';
  const isOz    = selectedCategory?.name === 'HOT DRINKS' || selectedCategory?.name === 'HOT COFFEE';
  const isCombo = selectedCategory?.name?.toUpperCase() === 'COMBO MEALS';
  const categoryHasOnlyOneSize = (selectedCategory?.sub_categories?.length ?? 0) <= 1;

  const subtotal = cart.reduce((acc, item) => {
    const surcharge = (item.charges?.grab || item.charges?.panda) ? 30 * item.qty : 0;
    return acc + item.finalPrice + surcharge;
  }, 0);

  const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const hasStickers = cart.some(item => item.sugarLevel !== undefined || item.size === 'M' || item.size === 'L');

  const totalPax          = pax.regular + pax.senior + pax.pwd + pax.diplomat;
  const sharePerPax       = subtotal / (totalPax || 1);
  const seniorPwdDiscount = (pax.senior + pax.pwd) * (sharePerPax * 0.20);
  const diplomatDiscount  = pax.diplomat * (sharePerPax * 0.20);
  const promoDiscount     = selectedDiscount
    ? selectedDiscount.type.includes('Percent')
      ? subtotal * (Number(selectedDiscount.amount) / 100)
      : Number(selectedDiscount.amount)
    : 0;
  const discountAmount    = seniorPwdDiscount + diplomatDiscount + promoDiscount;
  const itemDiscountTotal = cart.reduce((acc, item) => acc + Math.max(0, Number(item.price) * item.qty - item.finalPrice), 0);
  const amtDue            = Math.max(0, subtotal - discountAmount - itemDiscountTotal);
  const vatableSales      = amtDue / 1.12;
  const vatAmount         = amtDue - vatableSales;
  const change            = typeof cashTendered === 'number' ? Math.max(0, cashTendered - amtDue) : 0;
  const totalDiscountDisplay = discountAmount + itemDiscountTotal;

  const formattedDate = currentDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // ── Effects ───────────────────────────────────────────────────────────────

  // Boot: check cash-in status
  useEffect(() => {
    const boot = async () => {
      try {
        const { data } = await api.get('/cash-transactions/status');
        setMenuAvailable(data?.hasCashedIn ?? false);
      } catch {
        setMenuAvailable(false);
      } finally {
        setCheckingCashIn(false);
      }
    };
    boot();

    // CashIn.tsx dispatches this after a successful cash-in POST
    const onCashIn = () => { setMenuAvailable(true); setCheckingCashIn(false); };
    window.addEventListener('cash-in-completed', onCashIn);
    return () => window.removeEventListener('cash-in-completed', onCashIn);
  }, []);

  // Keep regular pax in sync with cart count
  useEffect(() => {
    const count      = cart.reduce((acc, item) => acc + item.qty, 0);
    const specialPax = pax.senior + pax.pwd + pax.diplomat;
    setPax(prev => ({ ...prev, regular: Math.max(0, count - specialPax) }));
  }, [cart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Init: sync OR sequence, cashier name, clock
  useEffect(() => {
    const syncSequence = async () => {
      try {
        const { data } = await api.get('/receipts/next-sequence');
        const serverSeq = parseInt(data.next_sequence, 10);
        const safeSeq   = Math.max(isNaN(serverSeq) ? 1 : serverSeq, parseInt(localStorage.getItem('last_or_sequence') || '0') + 1);
        localStorage.setItem('last_or_sequence', String(safeSeq));
        setOrNumber(generateORNumber(safeSeq));
        setQueueNumber(generateQueueNumber(safeSeq));
      } catch {
        const fallback = parseInt(localStorage.getItem('last_or_sequence') || '0') + 1;
        setOrNumber(generateORNumber(fallback));
        setQueueNumber(generateQueueNumber(fallback));
      }
    };

    const fetchCashierName = async () => {
      try {
        const { data: u } = await api.get('/user');
        const name = u?.name || u?.username || u?.full_name || u?.display_name;
        setCashierName(name?.trim() || 'Admin');
      } catch {
        setCashierName('Admin');
      }
    };

    syncSequence();
    fetchCashierName();

    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Sequence helpers ──────────────────────────────────────────────────────

  const syncNextSequence = async () => {
    try {
      const { data } = await api.get('/receipts/next-sequence');
      const serverSeq = parseInt(data.next_sequence, 10);
      const safeSeq   = Math.max(isNaN(serverSeq) ? 1 : serverSeq, parseInt(localStorage.getItem('last_or_sequence') || '0') + 1);
      localStorage.setItem('last_or_sequence', String(safeSeq));
      setOrNumber(generateORNumber(safeSeq));
      setQueueNumber(generateQueueNumber(safeSeq));
    } catch {
      const fallback = parseInt(localStorage.getItem('last_or_sequence') || '0') + 1;
      localStorage.setItem('last_or_sequence', String(fallback));
      setOrNumber(generateORNumber(fallback));
      setQueueNumber(generateQueueNumber(fallback));
    }
  };

  // ── Pax handlers ──────────────────────────────────────────────────────────

  const handleAddPax = (type: keyof typeof pax) => {
    const currentTotal = pax.regular + pax.senior + pax.pwd + pax.diplomat;
    if (currentTotal < totalCount) {
      setPax(prev => ({ ...prev, [type]: prev[type] + 1 }));
    } else if (type !== 'regular' && pax.regular > 0) {
      setPax(prev => ({ ...prev, regular: prev.regular - 1, [type]: prev[type] + 1 }));
    } else {
      showToast(`Total Pax cannot exceed total items (${totalCount}).`, 'warning');
    }
  };

  const handleSubPax = (type: keyof typeof pax) => {
    if (pax[type] > 0) {
      if (type !== 'regular') {
        setPax(prev => ({ ...prev, regular: prev.regular + 1, [type]: prev[type] - 1 }));
      } else {
        showToast(`Total Pax must equal ${totalCount}`, 'warning');
      }
    }
  };

  // ── Category / item navigation ────────────────────────────────────────────

  const handleCategoryClick = (cat: Category) => {
    setSelectedCategory(cat);
    setCategorySize(null);

    const isDrinkCat = cat.type === 'drink';
    const isWingsCat = cat.name === 'CHICKEN WINGS';
    const subCats    = cat.sub_categories ?? [];

    if (!isDrinkCat && !isWingsCat) { setCategorySize('all'); return; }
    if (isWingsCat) return;
    if (subCats.length === 1) { setCategorySize(subCats[0].name); return; }
    if (subCats.length === 0 && cat.cup?.size_l == null) {
      setCategorySize(cat.cup?.size_m || 'M');
    }
  };

  const handleBack = () => {
    if ((isDrink || isWings) && categorySize && !categoryHasOnlyOneSize) {
      setCategorySize(null);
    } else {
      setSelectedCategory(null);
      setCategorySize(null);
    }
  };

  const getFilteredItems = (items: MenuItem[]): MenuItem[] => {
    if (!categorySize || categorySize === 'all') return items;

    const cupSizeM = selectedCategory?.cup?.size_m || 'M';
    const cupSizeL = selectedCategory?.cup?.size_l || 'L';

    if (isWings) {
      const selectedSub = selectedCategory?.sub_categories?.find(s => s.name === categorySize);
      return selectedSub
        ? items.filter(item => item.sub_category_id === selectedSub.id)
        : items.filter(item => item.size === categorySize);
    }

    const selectedSub = selectedCategory?.sub_categories?.find(s => s.name === categorySize);
    if (selectedSub) {
      return items.filter(item => {
        if (item.sub_category_id != null) return item.sub_category_id === selectedSub.id;
        if (categorySize === cupSizeM)    return item.size === 'M' || item.size === 'none';
        if (categorySize === cupSizeL)    return item.size === 'L' || item.size === 'none';
        return true;
      });
    }

    if (categorySize === cupSizeM) return items.filter(item => item.size === 'M' || item.size === 'none');
    if (categorySize === cupSizeL) return items.filter(item => item.size === 'L' || item.size === 'none');
    return items;
  };

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setQty(1);
    setRemarks('');
    setSugarLevel('100%');
    setSelectedOptions([]);
    setSelectedAddOns([]);
    setIsAddOnModalOpen(false);

    if (item.size === 'M' || item.size === 'L') {
      setSize(item.size);
    } else {
      const cupSizeL = selectedCategory?.cup?.size_l || 'L';
      setSize(categorySize === cupSizeL ? 'L' : 'M');
    }
  };

  const closeModal = () => { setSelectedItem(null); setIsAddOnModalOpen(false); };

  // ── Order charge toggle ───────────────────────────────────────────────────

  const toggleOrderCharge = (type: 'grab' | 'panda') => {
    const next = orderCharge === type ? null : type;
    setOrderCharge(next);
    // Update charge flag on existing cart items — backend recalculates price
    setCart(prev => prev.map(item => ({
      ...item,
      charges: { grab: next === 'grab', panda: next === 'panda' },
    })));
  };

  // ── Options / add-ons toggles ─────────────────────────────────────────────

  const makeToggleOption = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (opt: string) => {
    setter(prev => {
      const iceOpts   = ['NO ICE', '-ICE', '+ICE', 'WARM'];
      const pearlOpts = ['NO PRL', 'W/ PRL'];
      if (iceOpts.includes(opt)) {
        const rest = prev.filter(o => !iceOpts.includes(o));
        return prev.includes(opt) ? rest : [...rest, opt];
      }
      if (pearlOpts.includes(opt)) {
        const rest = prev.filter(o => !pearlOpts.includes(o));
        return prev.includes(opt) ? rest : [...rest, opt];
      }
      return prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt];
    });
  };

  const toggleOption           = makeToggleOption(setSelectedOptions);
  const toggleComboDrinkOption = makeToggleOption(setComboDrinkOptions);
  const toggleAddOn = (name: string) =>
    setSelectedAddOns(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]);

  // ── Cart deduplication ────────────────────────────────────────────────────

  const isSameCartItem = (a: CartItem, b: CartItem): boolean =>
    a.id === b.id &&
    a.size === b.size &&
    a.cupSizeLabel === b.cupSizeLabel &&
    a.sugarLevel === b.sugarLevel &&
    a.remarks === b.remarks &&
    JSON.stringify(a.options ?? []) === JSON.stringify(b.options ?? []) &&
    JSON.stringify(a.addOns  ?? []) === JSON.stringify(b.addOns  ?? []) &&
    a.charges.grab  === b.charges.grab &&
    a.charges.panda === b.charges.panda;

  const mergeIntoCart = (newItem: CartItem) => {
    setCart(prev => {
      const unitPrice = newItem.finalPrice / newItem.qty;
      const idx = prev.findIndex(item => isSameCartItem(item, newItem));
      if (idx !== -1) {
        return prev.map((item, i) =>
          i === idx
            ? { ...item, qty: item.qty + newItem.qty, finalPrice: item.finalPrice + unitPrice * newItem.qty }
            : item
        );
      }
      return [...prev, newItem];
    });
  };

  // ── Add to order ──────────────────────────────────────────────────────────

  const addToOrder = () => {
    if (!selectedItem || !selectedCategory) return;

    let extraCost = 0;
    if (isDrink) {
      selectedAddOns.forEach(name => {
        const addon = addOnsData.find(a => a.name === name);
        if (addon) extraCost += Number(addon.price);
      });
    }

    const cartSize: 'M' | 'L' | 'none' = isDrink ? size : 'none';
    const cupSizeLabel = (isDrink || isOz) && categorySize ? categorySize : undefined;
    const unitPrice    = Number(selectedItem.price) + extraCost;

    const newCartItem: CartItem = {
      ...selectedItem,
      name:       isWings ? `${selectedItem.name} (${categorySize})` : selectedItem.name,
      qty,
      remarks,
      charges:    { grab: orderCharge === 'grab', panda: orderCharge === 'panda' },
      sugarLevel: isDrink ? sugarLevel : undefined,
      size:       cartSize,
      cupSizeLabel,
      options:    isDrink ? selectedOptions : undefined,
      addOns:     isDrink ? selectedAddOns  : undefined,
      finalPrice: unitPrice * qty,
    };

    if (isCombo) {
      setPendingComboCart(newCartItem);
      setComboDrinkSugar('100%');
      setComboDrinkOptions([]);
      setComboDrinkAddOns([]);
      setSelectedItem(null);
      setIsCombodrinkModalOpen(true);
      return;
    }

    mergeIntoCart(newCartItem);
    closeModal();
    showToast(`${selectedItem.name} added to order`, 'success');
  };

  // ── Combo drink confirm ───────────────────────────────────────────────────

  const confirmComboDrink = () => {
    if (!pendingComboCart) return;
    const pearlOpts = ['NO PRL', 'W/ PRL'];
    if (!comboDrinkOptions.some(o => pearlOpts.includes(o))) {
      showToast('Please select NO PRL or W/ PRL for the Classic Pearl', 'warning');
      return;
    }

    const drinkDetails = [
      `Sugar: ${comboDrinkSugar}`,
      ...comboDrinkOptions,
      ...comboDrinkAddOns.map(a => `+${a}`),
    ].join(' | ');

    const finalItem: CartItem = {
      ...pendingComboCart,
      remarks:    `Classic Pearl [${drinkDetails}]${pendingComboCart.remarks ? ` | Note: ${pendingComboCart.remarks}` : ''}`,
      sugarLevel: comboDrinkSugar,
      options:    comboDrinkOptions,
      addOns:     comboDrinkAddOns.length > 0 ? comboDrinkAddOns : undefined,
    };

    mergeIntoCart(finalItem);
    setIsCombodrinkModalOpen(false);
    setPendingComboCart(null);
    showToast(`${finalItem.name} + Classic Pearl added!`, 'success');
  };

  // ── Cart item editing ─────────────────────────────────────────────────────

  const openCartItemEdit = (index: number) => {
    setEditingCartIndex(index);
    setEditingCartItem({ ...cart[index] });
    setItemDiscountType('none');
    setItemDiscountValue('');
    setEditingItemDiscountId(null);
  };

  const closeCartItemEdit = () => {
    setEditingCartIndex(null);
    setEditingCartItem(null);
    setItemDiscountType('none');
    setItemDiscountValue('');
    setEditingItemDiscountId(null);
  };

  const adjustEditQty = (delta: number) => {
    if (!editingCartItem) return;
    const newQty    = Math.max(1, editingCartItem.qty + delta);
    const unitPrice = editingCartItem.finalPrice / editingCartItem.qty;
    setEditingCartItem({ ...editingCartItem, qty: newQty, finalPrice: unitPrice * newQty });
  };

  const saveCartItemEdit = () => {
    if (editingCartIndex === null || !editingCartItem) return;

    const unitPrice = editingCartItem.finalPrice / editingCartItem.qty;
    let discountedUnit = unitPrice;
    let discountLabel: string | undefined;

    if (itemDiscountType === 'percent' && itemDiscountValue !== '') {
      discountedUnit = unitPrice * (1 - Number(itemDiscountValue) / 100);
      if (editingItemDiscountId === -1) {
        discountLabel = 'Senior/PWD (20%)';
      } else {
        const d = discounts.find(d => d.id === editingItemDiscountId);
        if (d) discountLabel = `${d.name} (${d.amount}%)`;
      }
    } else if (itemDiscountType === 'fixed' && itemDiscountValue !== '') {
      discountedUnit = Math.max(0, unitPrice - Number(itemDiscountValue));
      const d = discounts.find(d => d.id === editingItemDiscountId);
      if (d) discountLabel = `${d.name} (-₱${d.amount})`;
    }

    const updated: CartItem = { ...editingCartItem, finalPrice: discountedUnit * editingCartItem.qty, discountLabel };
    setCart(prev => prev.map((item, i) => i === editingCartIndex ? updated : item));
    showToast('Item updated', 'success');
    closeCartItemEdit();
  };

  const removeEditingItem = () => {
    if (editingCartIndex === null) return;
    const name = cart[editingCartIndex].name;
    setCart(prev => prev.filter((_, i) => i !== editingCartIndex));
    showToast(`${name} removed`, 'warning');
    closeCartItemEdit();
  };

  // ── Confirm order ─────────────────────────────────────────────────────────

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const orderData = {
        si_number:        orNumber,
        branch_id:        branchId,
        items: cart.map(item => ({
          menu_item_id:   item.id,
          name:           item.name,
          quantity:       item.qty,
          unit_price:     Number(item.price),
          total_price:    item.finalPrice,
          size:           item.size !== 'none' ? item.size : null,
          cup_size_label: item.cupSizeLabel ?? null,
          sugar_level:    item.sugarLevel || null,
          options:        item.options || [],
          add_ons:        item.addOns  || [],
          remarks:        item.remarks || null,
          charges:        { grab: item.charges.grab, panda: item.charges.panda },
        })),
        subtotal,
        discount_amount:  discountAmount,
        discount_id:      selectedDiscount?.id || null,
        total:            amtDue,
        cashier_name:     cashierName ?? 'Admin',
        payment_method:   paymentMethod,
        reference_number: referenceNumber || null,
        pax_regular:      pax.regular,
        pax_senior:       pax.senior,
        pax_pwd:          pax.pwd,
        pax_diplomat:     pax.diplomat,
        senior_id:        discountIDs.senior   || null,
        pwd_id:           discountIDs.pwd      || null,
        diplomat_id:      discountIDs.diplomat || null,
        discount_remarks: discountRemarks || null,
        vatable_sales:    vatableSales,
        vat_amount:       vatAmount,
      };

      await api.post('/sales', orderData);

      const currentSeq = parseInt(orNumber.replace('SI-', ''), 10);
      if (!isNaN(currentSeq)) localStorage.setItem('last_or_sequence', String(currentSeq));
      localStorage.setItem('dashboard_stats_timestamp', '0');

      const today = new Date().toISOString().split('T')[0];
      Promise.all([
        api.get('/dashboard/stats').then(res => {
          localStorage.setItem('dashboard_stats', JSON.stringify(res.data));
          localStorage.setItem('dashboard_stats_timestamp', Date.now().toString());
        }),
        api.get('/inventory'),
        api.get('/receipts/search', { params: { query: '', date: today } }).then(res => {
          const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
          sessionStorage.setItem('lucky_boba_receipt_cache_results', JSON.stringify(data));
          sessionStorage.setItem('lucky_boba_receipt_cache_query', '');
          sessionStorage.setItem('lucky_boba_receipt_cache_date', today);
        }),
      ]).catch(e => console.error('Failed to fetch fresh data', e));

      setIsConfirmModalOpen(false);
      setIsSuccessModalOpen(true);
      setPrintedReceipt(false);
      setPrintedKitchen(false);
      setPrintedStickers(false);
      showToast('Order saved successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create order. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Print handlers ────────────────────────────────────────────────────────

  const handlePrintReceipt  = () => { setPrintTarget('receipt');  setPrintedReceipt(true);  setTimeout(() => window.print(), 100); };
  const handlePrintKitchen  = () => { setPrintTarget('kitchen');  setPrintedKitchen(true);  setTimeout(() => window.print(), 100); };
  const handlePrintStickers = () => { setPrintTarget('stickers'); setPrintedStickers(true); setTimeout(() => window.print(), 100); };

  // ── New order ─────────────────────────────────────────────────────────────

  const handleNewOrder = async () => {
    setCart([]);
    setOrderCharge(null);
    setCashTendered('');
    setPaymentMethod('cash');
    setReferenceNumber('');
    setSelectedDiscount(null);
    setIsSuccessModalOpen(false);
    setPrintTarget(null);
    setPrintedReceipt(false);
    setPrintedKitchen(false);
    setPrintedStickers(false);
    setSelectedCategory(null);
    setCategorySize(null);
    setPax({ regular: 1, senior: 0, pwd: 0, diplomat: 0 });
    setDiscountIDs({ senior: '', pwd: '', diplomat: '' });
    setDiscountRemarks('');
    await syncNextSequence();
  };

  // ── Filtered categories ───────────────────────────────────────────────────

  const filteredCategories = categories
    .map(cat => ({
      ...cat,
      menu_items: cat.menu_items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(cat =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.menu_items.length > 0
    );

  // ── Sticker renderer ──────────────────────────────────────────────────────

  const renderStickers = () => {
    const stickers: React.ReactNode[] = [];
    let drinkIndex = 1;
    const totalDrinks = cart.reduce((acc, item) => {
      const isSticker = item.sugarLevel !== undefined || item.size === 'M' || item.size === 'L';
      return acc + (isSticker ? item.qty : 0);
    }, 0);

    cart.forEach((item, cartIndex) => {
      const isSticker = item.sugarLevel !== undefined || item.size === 'M' || item.size === 'L';
      if (!isSticker) return;

      const extraCount    = (item.options?.length || 0) + (item.addOns?.length || 0) + (item.remarks ? 1 : 0);
      const isCrowded     = extraCount >= 3;
      const isVeryCrowded = extraCount >= 5;

      const paddingClass = isVeryCrowded ? 'p-0.5' : 'p-1';
      const titleSize    = isVeryCrowded ? 'text-[10px]' : isCrowded ? 'text-[11px]' : 'text-[12px]';
      const nameSize     = isVeryCrowded ? 'text-[8.5px]' : isCrowded ? 'text-[10px]' : 'text-xs';
      const addOnSize    = isVeryCrowded ? 'text-[6px]'   : isCrowded ? 'text-[7px]'  : 'text-[9px]';
      const gapClass     = isVeryCrowded ? 'space-y-0 leading-none' : 'space-y-0.5 leading-tight';
      const marginClass  = isVeryCrowded ? 'mb-0' : 'mb-1';
      const sizeLabel    = item.cupSizeLabel ? `(${item.cupSizeLabel})` : '';

      for (let i = 0; i < item.qty; i++) {
        stickers.push(
          <div key={`sticker-${cartIndex}-${i}`} className={`sticker-area page-break bg-white text-black flex flex-col justify-between items-center h-full w-full ${paddingClass}`} style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <div className="w-full text-center flex flex-col items-center">
              <div className={`font-black uppercase leading-none ${titleSize}`}>LUCKY BOBA</div>
              <div className={`font-bold uppercase leading-none opacity-120 tracking-widest ${isVeryCrowded ? 'text-[5px] mt-0.5' : 'text-[6.5px] mt-1'}`}>{branchName.toUpperCase()}</div>
              <div className={`w-full flex justify-between items-center font-bold border-b-[1.5px] border-black px-1 ${isVeryCrowded ? 'text-[10px] pb-0 mb-0.5 mt-0.5' : 'text-[10px] pb-0.5 mb-1 mt-1'}`}>
                <span>Q: {queueNumber} | SI: {orNumber.slice(-6)}</span>
                <span>{drinkIndex}/{totalDrinks}</span>
              </div>
            </div>
            <div className="w-full text-center flex-1 flex flex-col justify-center items-center px-1 overflow-hidden">
              <div className={`w-full font-black uppercase leading-tight ${nameSize} ${marginClass}`}>
                {item.size === 'none' && item.sugarLevel != null ? 'CLASSIC PEARL' : `${item.name} ${sizeLabel}`}
              </div>
              <div className={`w-full text-center font-bold ${addOnSize} ${gapClass}`}>
                {item.sugarLevel != null && <div>Sugar: {item.sugarLevel}</div>}
                {item.options?.map(opt => <div key={opt}>{opt}</div>)}
                {item.addOns?.map(a => <div key={a}>+ {a}</div>)}
              </div>
            </div>
            <div className="w-full text-center mt-auto mb-0.5">
              <p className={`font-black uppercase whitespace-nowrap tracking-tighter ${isVeryCrowded ? 'text-[5.5px]' : 'text-[7px]'}`}>
                Best consume within 30 minutes
              </p>
            </div>
            <div className={`w-full font-bold text-center border-t border-zinc-800 ${isVeryCrowded ? 'text-[8.5px] pt-0.5 mt-0.5' : 'text-[8.5px] pt-1 mt-1'}`}>
              {formattedDate} {formattedTime}
            </div>
          </div>
        );
        drinkIndex++;
      }
    });
    return stickers;
  };

  // ── Discount preview helper ───────────────────────────────────────────────

  const computeDiscountedTotal = () => {
    if (!editingCartItem) return 0;
    const unitPrice = editingCartItem.finalPrice / editingCartItem.qty;
    let discounted  = unitPrice;
    if (itemDiscountType === 'percent' && itemDiscountValue !== '')
      discounted = unitPrice * (1 - Number(itemDiscountValue) / 100);
    else if (itemDiscountType === 'fixed' && itemDiscountValue !== '')
      discounted = Math.max(0, unitPrice - Number(itemDiscountValue));
    return discounted * editingCartItem.qty;
  };

  // ── Loading screen ────────────────────────────────────────────────────────

  if (checkingCashIn || loading) return (
    <div className="h-screen flex items-center justify-center font-black text-[#3b2063] bg-[#f8f6ff]">
      <div className="text-center">
        <DrinkIcon className="w-16 h-16 mx-auto mb-4 text-[#3b2063] opacity-30 animate-pulse" />
        <div className="text-sm tracking-widest uppercase opacity-50">Loading...</div>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @media print {
          @page { ${printTarget === 'stickers' ? 'size: 38.5mm 50.8mm;' : 'size: 80mm auto;'} margin: 0 !important; }
          html, body { margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden; }
          nav, header, aside, button, .print\\:hidden { display: none !important; }
          .printable-receipt-container, .printable-receipt-container * { visibility: visible !important; }
          .printable-receipt-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: ${printTarget === 'stickers' ? '38.5mm' : '76mm'} !important; margin: 0 !important; padding: 0 !important; }
          .receipt-area { width: 66mm !important; margin: 0 auto !important; padding: 2mm 0 !important; box-sizing: border-box !important; color: #000 !important; font-family: Arial, Helvetica, sans-serif !important; font-size: 12px !important; line-height: 1.4 !important; }
          .sticker-area { width: 38.5mm !important; height: 50.8mm !important; padding: 2mm !important; margin: 0 auto !important; box-sizing: border-box !important; color: #000 !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; align-items: center !important; text-align: center !important; font-family: Arial, Helvetica, sans-serif !important; overflow: hidden !important; page-break-after: always !important; break-after: page !important; }
        }
      `}</style>

      <div className="flex flex-col h-screen w-screen bg-[#f0edf8] relative overflow-hidden font-sans print:hidden">

        {/* ── MODAL: CART ITEM EDIT ──────────────────────────────────────── */}
        {editingCartItem && editingCartIndex !== null && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-[0.625rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-[#3b2063] px-6 pt-5 pb-5 text-white relative shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1">Edit Item</p>
                <h2 className="text-base font-black uppercase tracking-wide leading-tight pr-8">
                  {editingCartItem.name}
                  {editingCartItem.cupSizeLabel && (
                    <span className="ml-2 text-white/40 font-semibold text-sm">({editingCartItem.cupSizeLabel})</span>
                  )}
                </h2>
                <button onClick={closeCartItemEdit} className="absolute top-5 right-5 w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors">
                  <CloseIcon size={4} />
                </button>
              </div>

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
                      <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-200 text-[10px] px-2 py-1 rounded-md font-semibold">🍬 {editingCartItem.sugarLevel}</span>
                    )}
                    {editingCartItem.options?.map(opt => (
                      <span key={opt} className="inline-flex items-center bg-sky-50 text-sky-700 border border-sky-200 text-[10px] px-2 py-1 rounded-md font-semibold">{opt}</span>
                    ))}
                    {editingCartItem.addOns?.map(a => (
                      <span key={a} className="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-1 rounded-md font-semibold">+{a}</span>
                    ))}
                    {editingCartItem.charges?.grab  && <span className="inline-flex items-center bg-green-50 text-green-700 border border-green-200 text-[10px] px-2 py-1 rounded-md font-semibold">🛵 Grab</span>}
                    {editingCartItem.charges?.panda && <span className="inline-flex items-center bg-pink-50  text-pink-700  border border-pink-200  text-[10px] px-2 py-1 rounded-md font-semibold">🐼 Panda</span>}
                    {editingCartItem.remarks && (
                      <span className="inline-flex items-center bg-zinc-100 text-zinc-500 border border-zinc-200 text-[10px] px-2 py-1 rounded-md font-semibold italic">📝 {editingCartItem.remarks}</span>
                    )}
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Quantity</label>
                  <QtyControl value={editingCartItem.qty} onDecrement={() => adjustEditQty(-1)} onIncrement={() => adjustEditQty(1)} />
                </div>

                {/* Item discount */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Item Discount</label>
                  <div className="border-2 border-zinc-200 rounded-[0.625rem] overflow-hidden divide-y divide-zinc-100">
                    {[
                      { id: null, label: 'No Discount', type: 'none' as const,    value: 0,  badge: null },
                      { id: -1,  label: 'Senior / PWD', type: 'percent' as const, value: 20, badge: '20% OFF' },
                      ...discounts.map(d => ({
                        id:    d.id,
                        label: d.name,
                        type:  d.type.includes('Percent') ? 'percent' as const : 'fixed' as const,
                        value: Number(d.amount),
                        badge: d.type.includes('Percent') ? `${d.amount}% OFF` : `₱${d.amount} OFF`,
                      })),
                    ].map(option => {
                      const isSelected = editingItemDiscountId === option.id;
                      const isNone     = option.id === null;
                      return (
                        <button
                          key={String(option.id)}
                          onClick={() => {
                            setEditingItemDiscountId(option.id);
                            setItemDiscountType(option.type);
                            setItemDiscountValue(option.value || '');
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                            ${isSelected
                              ? isNone ? 'bg-red-500 text-white' : 'bg-[#3b2063] text-white'
                              : 'bg-white text-zinc-600 hover:bg-zinc-50'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-white bg-white' : 'border-zinc-300'}`}>
                              {isSelected && <div className={`w-2 h-2 rounded-full ${isNone ? 'bg-red-500' : 'bg-[#3b2063]'}`} />}
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
                  <span className="font-black text-xl text-[#3b2063] tabular-nums">₱ {computeDiscountedTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex gap-3 shrink-0">
                <button onClick={removeEditingItem} className="flex-1 py-3 rounded-[0.625rem] border-2 border-red-100 bg-white text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                  Remove
                </button>
                <button onClick={saveCartItemEdit} className="flex-[2] py-3 rounded-[0.625rem] bg-[#3b2063] hover:bg-[#2a1647] text-white font-black text-xs uppercase tracking-widest transition-all shadow-sm">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: ITEM SELECTION ──────────────────────────────────────── */}
        {selectedItem && !isAddOnModalOpen && !isConfirmModalOpen && !isSuccessModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-[0.625rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-[#3b2063] p-5 text-white text-center relative shrink-0">
                <h2 className="text-lg font-black uppercase tracking-wider">{selectedItem.name}</h2>
                {isCombo && (
                  <div className="mt-1 inline-block bg-white/20 text-white text-[10px] font-black uppercase px-3 py-1 rounded-[0.625rem] tracking-widest">🧋 Includes Classic Pearl</div>
                )}
                <button onClick={closeModal} className="absolute top-5 right-6 text-white/50 hover:text-white transition-colors">
                  <CloseIcon size={6} />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto bg-white">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-[0.625rem] border-2 border-zinc-200">
                    <span className="text-sm font-bold text-zinc-900 uppercase tracking-widest block mb-1">Barcode</span>
                    <span className="text-sm font-black text-[#3b2063]">{selectedItem.barcode}</span>
                  </div>
                  <div className="bg-white p-3 rounded-[0.625rem] border-2 border-zinc-200">
                    <span className="text-sm font-bold text-zinc-900 uppercase tracking-widest block mb-1">Unit Price</span>
                    <span className="text-sm font-black text-[#3b2063]">₱ {Number(selectedItem.price).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white rounded-[0.625rem] p-2 border-2 border-zinc-200">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-12 h-12 bg-zinc-100 rounded-[0.625rem] border border-zinc-300 text-[#3b2063] hover:text-red-500 transition-colors flex items-center justify-center"><MinusIcon /></button>
                  <input type="text" value={qty} readOnly className="bg-transparent text-center font-black text-2xl text-[#3b2063] w-20 outline-none" />
                  <button onClick={() => setQty(q => q + 1)} className="w-12 h-12 bg-[#3b2063] rounded-[0.625rem] shadow-lg text-white transition-colors flex items-center justify-center"><PlusIcon /></button>
                </div>

                {isDrink && (
                  <>
                    <div>
                      <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Sugar Level</label>
                      <div className="flex gap-2">
                        {SUGAR_LEVELS.map(level => (
                          <button key={level} onClick={() => setSugarLevel(level)}
                            className={`flex-1 py-2 rounded-[0.625rem] text-sm font-black transition-all
                              ${sugarLevel === level ? 'bg-[#3b2063] text-white shadow-md' : 'bg-white text-zinc-900 border-2 border-zinc-300 hover:bg-zinc-100'}`}>
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Extra</label>
                      <button onClick={() => setIsAddOnModalOpen(true)}
                        className="w-full py-4 rounded-[0.625rem] border-2 border-dashed border-[#3b2063]/40 bg-[#f0ebff] hover:bg-[#e4dbff] text-[#3b2063] font-black uppercase tracking-wider text-sm flex items-center justify-center transition-all group">
                        <span className="mr-2">{selectedAddOns.length > 0 ? `${selectedAddOns.length} Add-on(s) Selected` : 'Select Add-ons'}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Options (Free)</label>
                      <div className="flex flex-wrap gap-2">
                        {EXTRA_OPTIONS.map(opt => (
                          <button key={opt} onClick={() => toggleOption(opt)}
                            className={`px-3 py-2 rounded-[0.625rem] text-sm font-bold uppercase transition-all
                              ${selectedOptions.includes(opt) ? 'bg-[#3b2063] text-white shadow-md' : 'bg-white text-zinc-900 border-2 border-zinc-300 hover:bg-zinc-100'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Charges (+₱30.00)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['grab', 'panda'] as const).map(type => {
                      const isActive   = orderCharge === type;
                      const isDisabled = orderCharge !== null && orderCharge !== type;
                      return (
                        <button key={type} type="button" onClick={() => !isDisabled && toggleOrderCharge(type)} disabled={isDisabled}
                          className={`p-3 rounded-[0.625rem] border-2 transition-all flex items-center justify-center gap-2
                            ${isDisabled
                              ? 'border-zinc-200 bg-white text-zinc-300 opacity-40'
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

                <div>
                  <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Remarks</label>
                  <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Additional notes..."
                    className="w-full p-4 bg-white rounded-[0.625rem] border-2 border-zinc-200 text-sm font-bold text-[#3b2063] resize-none h-16 outline-none focus:border-[#3b2063] transition-all" />
                </div>

                {(() => {
                  const canAdd = isCombo || !isDrink || selectedOptions.some(o => ['NO PRL', 'W/ PRL'].includes(o));
                  return (
                    <button onClick={addToOrder} disabled={!canAdd} title={!canAdd ? 'Please select NO PRL or W/ PRL' : ''}
                      className={`w-full py-4 rounded-[0.625rem] font-black text-sm uppercase tracking-[0.2em] shadow-lg transition-colors
                        ${canAdd ? 'bg-[#3b2063] text-white hover:bg-[#2a1647]' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}>
                      {isCombo ? 'Next: Customize Drink →' : canAdd ? 'Add Order' : 'Select Pearl Option'}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: ADD-ONS ─────────────────────────────────────────────── */}
        {isAddOnModalOpen && (
          <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-[0.625rem] shadow-2xl flex flex-col h-[80vh]">
              <div className="bg-[#3b2063] p-6 text-white text-center relative shrink-0">
                <h2 className="text-lg font-black uppercase tracking-wider">Select Add-ons</h2>
                <button onClick={() => setIsAddOnModalOpen(false)} className="absolute top-6 right-6 text-white font-bold text-xs bg-white/20 px-3 py-1.5 rounded-lg">Done</button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-white">
                <AddOnGrid addOns={addOnsData} selected={selectedAddOns} onToggle={toggleAddOn} />
              </div>
              <div className="p-4 border-t border-zinc-200 bg-white">
                <button onClick={() => setIsAddOnModalOpen(false)} className="w-full bg-[#3b2063] text-white py-4 rounded-[0.625rem] font-black uppercase tracking-widest shadow-lg">
                  Confirm Selection ({selectedAddOns.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: COMBO DRINK ─────────────────────────────────────────── */}
        {isCombodrinkModalOpen && pendingComboCart && (
          <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-[0.625rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-[#3b2063] p-5 text-white text-center relative shrink-0">
                <div className="text-[10px] font-bold uppercase opacity-60 tracking-widest leading-none mb-1">Step 2 of 2 — Combo Drink for</div>
                <h2 className="text-base font-black uppercase tracking-wider leading-tight">{pendingComboCart.name}</h2>
                <div className="mt-2 inline-block bg-white/20 text-white text-[10px] font-black uppercase px-3 py-1 rounded-[0.625rem] tracking-widest">🧋 Classic Pearl Milk Tea</div>
                <button onClick={() => { setIsCombodrinkModalOpen(false); setPendingComboCart(null); }} className="absolute top-5 right-6 text-white/50 hover:text-white transition-colors">
                  <CloseIcon size={6} />
                </button>
              </div>
              <div className="p-6 space-y-5 overflow-y-auto bg-white">
                <div>
                  <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Sugar Level</label>
                  <div className="flex gap-2">
                    {SUGAR_LEVELS.map(level => (
                      <button key={level} onClick={() => setComboDrinkSugar(level)}
                        className={`flex-1 py-2 rounded-[0.625rem] text-sm font-black transition-all
                          ${comboDrinkSugar === level ? 'bg-[#3b2063] text-white shadow-md' : 'bg-white text-zinc-900 border-2 border-zinc-300 hover:bg-zinc-100'}`}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Extra</label>
                  <button onClick={() => setComboDrinkAddOnModalOpen(true)}
                    className="w-full py-4 rounded-[0.625rem] border-2 border-dashed border-[#3b2063]/40 bg-[#f0ebff] hover:bg-[#e4dbff] text-[#3b2063] font-black uppercase tracking-wider text-sm flex items-center justify-center transition-all group">
                    <span className="mr-2">{comboDrinkAddOns.length > 0 ? `${comboDrinkAddOns.length} Add-on(s) Selected` : 'Select Add-ons'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Options (Free)</label>
                  <div className="flex flex-wrap gap-2">
                    {EXTRA_OPTIONS.map(opt => (
                      <button key={opt} onClick={() => toggleComboDrinkOption(opt)}
                        className={`px-3 py-2 rounded-[0.625rem] text-sm font-bold uppercase transition-all
                          ${comboDrinkOptions.includes(opt) ? 'bg-[#3b2063] text-white shadow-md' : 'bg-white text-zinc-900 border-2 border-zinc-300 hover:bg-zinc-100'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                {(() => {
                  const hasPearl = comboDrinkOptions.some(o => ['NO PRL', 'W/ PRL'].includes(o));
                  return (
                    <button onClick={confirmComboDrink} disabled={!hasPearl}
                      className={`w-full py-4 rounded-[0.625rem] font-black text-sm uppercase tracking-[0.2em] shadow-lg transition-colors
                        ${hasPearl ? 'bg-[#3b2063] text-white hover:bg-[#2a1647]' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}>
                      {hasPearl ? '🧋 Confirm & Add to Order' : 'Select Pearl Option First'}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: COMBO DRINK ADD-ONS ─────────────────────────────────── */}
        {comboDrinkAddOnModalOpen && (
          <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-[0.625rem] shadow-2xl flex flex-col h-[80vh]">
              <div className="bg-[#3b2063] p-6 text-white text-center relative shrink-0">
                <h2 className="text-lg font-black uppercase tracking-wider">Classic Pearl Add-ons</h2>
                <button onClick={() => setComboDrinkAddOnModalOpen(false)} className="absolute top-6 right-6 text-white font-bold text-xs bg-white/20 px-3 py-1.5 rounded-lg">Done</button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-white">
                <AddOnGrid
                  addOns={addOnsData}
                  selected={comboDrinkAddOns}
                  onToggle={name => setComboDrinkAddOns(prev =>
                    prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
                  )}
                />
              </div>
              <div className="p-4 border-t border-zinc-200 bg-white">
                <button onClick={() => setComboDrinkAddOnModalOpen(false)} className="w-full bg-[#3b2063] text-white py-4 rounded-[0.625rem] font-black uppercase tracking-widest shadow-lg">
                  Confirm Selection ({comboDrinkAddOns.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: CONFIRM ORDER ───────────────────────────────────────── */}
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-6xl rounded-[0.625rem] shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">
              <div className="bg-[#3b2063] p-5 text-white text-center shrink-0 shadow-sm z-10 flex justify-between items-center">
                <div className="w-1/3" />
                <div className="w-1/3">
                  <h2 className="text-xl font-black uppercase tracking-widest">Payment Details</h2>
                  <p className="text-white/60 text-xs mt-1 uppercase">Cashier: {cashierName ?? 'Admin'}</p>
                </div>
                <div className="w-1/3 text-right">
                  <button onClick={() => setIsConfirmModalOpen(false)} className="text-white/50 hover:text-white transition-colors">
                    <CloseIcon size={6} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row flex-1 min-h-[50vh] max-h-[85vh] overflow-hidden bg-zinc-50">
                {/* Cart summary */}
                <div className="flex-1 flex flex-col bg-white border-r border-zinc-200 overflow-hidden">
                  <div className="flex-1 p-6 overflow-y-auto">
                    <h3 className="font-black text-sm text-[#3b2063] uppercase mb-4 tracking-wider">Cart Items</h3>
                    {cart.length === 0 ? (
                      <p className="text-center text-zinc-400 font-bold text-sm py-8">Cart is empty.</p>
                    ) : (
                      <div className="space-y-4">
                        {cart.map((item, i) => (
                          <div key={i} onClick={() => openCartItemEdit(i)} className="flex justify-between items-start pb-3 border-b border-zinc-100 last:border-0 mb-2 cursor-pointer hover:bg-[#f9f7ff] rounded-lg px-2 -mx-2 transition-colors">
                            <div>
                              <p className="font-bold text-sm text-[#3b2063]">
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
                            <p className="font-black text-sm text-[#3b2063]">₱ {item.finalPrice.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-6 bg-zinc-50 shrink-0 border-t border-zinc-200">
                    <div className="space-y-1.5 text-[11px] font-bold text-zinc-600">
                      <div className="flex justify-between"><span>Quantity (Items)</span><span>{totalCount}</span></div>
                      <div className="flex justify-between"><span>Sub Total</span><span>₱ {subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>VATable Sales</span><span>₱ {vatableSales.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>VAT Amount</span><span>₱ {vatAmount.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>VAT Exempt Sales</span><span>₱ 0.00</span></div>
                      <div className="flex justify-between text-red-500 font-black">
                        <span>Discount {selectedDiscount ? `(${selectedDiscount.name})` : ''}</span>
                        <span>- ₱ {totalDiscountDisplay.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between"><span>Service Charge</span><span>₱ 0.00</span></div>
                      <div className="flex justify-between items-center text-[#3b2063] border-t-2 border-zinc-200 pt-3 mt-2">
                        <span className="font-black uppercase text-sm">Amt Due</span>
                        <span className="text-2xl font-black">₱ {amtDue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment tabs */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                  <div className="flex border-b border-zinc-200 shrink-0 bg-zinc-50 p-2 gap-2">
                    {([
                      { id: 'payment',  label: 'Payment',  dot: false },
                      { id: 'discount', label: 'Promo',    dot: !!selectedDiscount },
                      { id: 'pax',      label: 'Pax & ID', dot: pax.senior > 0 || pax.pwd > 0 || pax.diplomat > 0 },
                    ] as const).map(tab => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-[0.625rem] transition-all border-2 relative
                          ${activeTab === tab.id ? 'bg-[#3b2063] text-white border-[#3b2063] shadow-md' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100'}`}>
                        {tab.label}
                        {tab.dot && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto">
                    {activeTab === 'payment' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-black text-sm text-[#3b2063] uppercase mb-3 tracking-wider">Payment Method</h3>
                          <div className="grid grid-cols-3 gap-2 mb-5">
                            {PAYMENT_METHODS.map(({ id, label }) => (
                              <button key={id} onClick={() => { setPaymentMethod(id); setReferenceNumber(''); setCashTendered(''); }}
                                className={`py-3 rounded-[0.625rem] font-black text-sm uppercase transition-all border-2 flex flex-col items-center gap-1
                                  ${paymentMethod === id ? 'bg-[#3b2063] text-white border-[#3b2063] shadow-md' : 'bg-zinc-50 text-[#3b2063] border-zinc-200 hover:border-[#3b2063]/40'}`}>
                                {label}
                              </button>
                            ))}
                          </div>

                          {paymentMethod === 'cash' ? (
                            <>
                              <h3 className="font-black text-[10px] text-zinc-400 tracking-widest uppercase mb-2">Cash Tendered</h3>
                              <div className="relative mb-3">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-2xl text-zinc-400">₱</span>
                                <input type="number" value={cashTendered} onChange={e => setCashTendered(e.target.value ? Number(e.target.value) : '')}
                                  className="w-full bg-zinc-50 border-2 border-zinc-300 rounded-[0.625rem] py-4 pl-12 pr-4 text-3xl font-black text-[#3b2063] outline-none focus:border-[#3b2063] focus:bg-white transition-colors" placeholder="0.00" />
                              </div>
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                                <button onClick={() => setCashTendered(amtDue)} className="col-span-2 lg:col-span-4 bg-green-100 hover:bg-green-500 hover:text-white text-green-700 py-2.5 rounded-[0.625rem] font-black text-sm uppercase tracking-widest transition-all shadow-sm border-2 border-green-200">
                                  Exact Amount (₱ {amtDue.toFixed(2)})
                                </button>
                                {[100, 200, 500, 1000].map(amount => (
                                  <button key={amount} onClick={() => setCashTendered(amount)}
                                    className="bg-zinc-50 hover:bg-[#3b2063] hover:text-white text-[#3b2063] py-3 rounded-[0.625rem] font-black text-base transition-all border-2 border-zinc-200 hover:border-[#3b2063]">
                                    ₱ {amount}
                                  </button>
                                ))}
                              </div>
                              <div className="flex justify-between items-center mt-4 bg-zinc-50 border border-zinc-200 p-4 rounded-[0.625rem]">
                                <span className="font-black text-zinc-400 uppercase text-xs tracking-widest">Change</span>
                                <span className="text-2xl font-black text-green-600">₱ {change.toFixed(2)}</span>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <h3 className="font-black text-[10px] text-zinc-400 tracking-widest uppercase">Reference Number</h3>
                              <input type="text" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)}
                                className="w-full bg-zinc-50 border-2 border-zinc-300 rounded-[0.625rem] py-4 px-5 text-xl font-black outline-none focus:border-[#3b2063] focus:bg-white transition-colors" placeholder="REF#" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'discount' && (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h3 className="font-black text-sm text-[#3b2063] uppercase tracking-wider">Select Promo</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setSelectedDiscount(null)}
                              className={`p-3 rounded-[0.625rem] text-sm font-black uppercase transition-all border-2 flex items-center justify-center text-center
                                ${!selectedDiscount ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-zinc-50 text-red-500 border-red-100 hover:border-red-300'}`}>
                              Remove Promo
                            </button>
                            {discounts.map(d => (
                              <button key={d.id} onClick={() => setSelectedDiscount(d)}
                                className={`p-3 rounded-[0.625rem] text-sm font-black uppercase transition-all border-2 flex items-center justify-center text-center
                                  ${selectedDiscount?.id === d.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-emerald-300'}`}>
                                {d.name} ({d.amount}{d.type.includes('Percent') ? '%' : ' OFF'})
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-black text-[10px] text-zinc-400 tracking-widest uppercase">Discount Remarks</h3>
                          <textarea value={discountRemarks} onChange={e => setDiscountRemarks(e.target.value)}
                            placeholder="Enter notes (e.g., Manager's Approval, Birthday Promo)"
                            className="w-full text-sm font-bold p-4 bg-zinc-50 border-2 border-zinc-200 rounded-[0.625rem] outline-none focus:border-[#3b2063] focus:bg-white transition-colors h-24 resize-none" />
                        </div>
                      </div>
                    )}

                    {activeTab === 'pax' && (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h3 className="font-black text-sm text-[#3b2063] uppercase tracking-wider">Headcount (Max {totalCount})</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {(Object.keys(pax) as Array<keyof typeof pax>).map(type => (
                              <div key={type} className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{type}</label>
                                <QtyControl value={pax[type]} onDecrement={() => handleSubPax(type)} onIncrement={() => handleAddPax(type)} />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h3 className="font-black text-sm text-[#3b2063] uppercase tracking-wider">Required Card IDs</h3>
                          <div className="space-y-2">
                            {(['senior', 'pwd', 'diplomat'] as const).map(type => (
                              <div key={type} className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest text-zinc-400 w-16 capitalize">{type}</span>
                                <input type="text" placeholder="ID Number..." value={discountIDs[type]}
                                  onChange={e => setDiscountIDs({ ...discountIDs, [type]: e.target.value })}
                                  className="w-full text-xs font-bold pl-20 p-3 bg-zinc-50 border-2 rounded-[0.625rem] border-zinc-200 outline-none focus:bg-white focus:border-[#3b2063] transition-colors" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-white border-t border-zinc-200 shrink-0">
                    <button
                      onClick={handleConfirmOrder}
                      disabled={
                        submitting ||
                        (paymentMethod === 'cash' && (cashTendered === '' || cashTendered < amtDue)) ||
                        (paymentMethod !== 'cash' && !referenceNumber) ||
                        (pax.regular + pax.senior + pax.pwd + pax.diplomat !== totalCount)
                      }
                      className="w-full bg-[#3b2063] hover:bg-[#2a1647] transition-colors text-white py-4 rounded-[0.625rem] font-black uppercase tracking-widest shadow-lg disabled:bg-zinc-300 disabled:cursor-not-allowed"
                    >
                      {submitting
                        ? 'Processing...'
                        : pax.regular + pax.senior + pax.pwd + pax.diplomat !== totalCount
                          ? `PAX MUST EQUAL ${totalCount}`
                          : 'Complete Transaction'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: SUCCESS / PRINT ─────────────────────────────────────── */}
        {isSuccessModalOpen && (() => {
          const printItems = [
            {
              label: 'Customer Receipt', done: printedReceipt, onPrint: handlePrintReceipt,
              icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0v3.398c0 .796.604 1.48 1.389 1.554a41.349 41.349 0 0 1 7.722 0c.785.074 1.389-.758 1.389-1.554V7.034Z" /></svg>,
            },
            {
              label: 'Order Ticket', done: printedKitchen, onPrint: handlePrintKitchen,
              icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.866 8.21 8.21 0 0 0 3 2.48Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" /></svg>,
            },
            ...(hasStickers ? [{
              label: 'Drink Stickers', done: printedStickers, onPrint: handlePrintStickers,
              icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>,
            }] : []),
          ];

          const pending    = printItems.filter(p => !p.done);
          const allDone    = pending.length === 0;
          const allPrinted = printedReceipt && printedKitchen && (!hasStickers || printedStickers);

          return (
            <div className="fixed inset-0 z-130 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-lg rounded-[0.625rem] shadow-2xl flex flex-col overflow-hidden border border-zinc-200">
                <div className="bg-[#3b2063] px-9 pt-10 pb-9 text-white relative overflow-hidden">
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
                        ${done ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-zinc-200 text-zinc-600 hover:border-[#3b2063] hover:text-[#3b2063] hover:bg-[#f9f7ff]'}`}>
                      <div className="flex items-center gap-3">{icon}<span>{label}</span></div>
                      {done ? <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Printed ✓</span> : <ChevronRight />}
                    </button>
                  ))}
                </div>

                <div className="px-8 pb-8 bg-white">
                  <div className="mt-1 mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                        {allDone ? 'All done' : `${printItems.length - pending.length} / ${printItems.length} printed`}
                      </span>
                      {!allDone && (
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Pending: {pending.map(p => p.label).join(', ')}</span>
                      )}
                    </div>
                    <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${allDone ? 'bg-emerald-400' : 'bg-[#3b2063]'}`}
                        style={{ width: `${((printItems.length - pending.length) / printItems.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <button onClick={handleNewOrder} disabled={!allPrinted}
                    className={`w-full h-14 font-black uppercase tracking-widest text-sm transition-all rounded-[0.625rem] flex items-center justify-center gap-2
                      ${allPrinted ? 'bg-[#3b2063] text-white hover:bg-[#2a1647] cursor-pointer' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>
                    {allPrinted
                      ? <><span>New Order</span><ArrowRightIcon /></>
                      : `Print ${pending.length} remaining to continue`}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <div className="flex gap-3 px-4 py-3 bg-white border-b border-zinc-200 items-center h-20 shrink-0 shadow-sm z-20">
          <button onClick={() => handleNavClick('Home')}
            className="bg-[#3b2063] text-white h-full px-5 rounded-[0.625rem] font-black text-[11px] uppercase tracking-widest shadow-md hover:bg-[#2a1647] transition-all flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Home
          </button>
          <div className="flex-1 bg-zinc-50 rounded-[0.625rem] border-2 border-zinc-200 flex items-center px-4 gap-2 h-full focus-within:border-[#3b2063] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-zinc-400 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z" />
            </svg>
            <input type="text" placeholder="Search item..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent font-bold text-zinc-700 outline-none uppercase placeholder:text-zinc-300 text-sm" />
          </div>
          <div className="flex gap-2 h-full">
            <div className="bg-[#f0ebff] border-2 border-[#3b2063]/20 rounded-[0.625rem] flex items-center justify-center px-4">
              <div className="text-center">
                <div className="text-[9px] font-black uppercase text-[#3b2063]/50 tracking-widest leading-none">Branch</div>
                <div className="text-[11px] font-black text-[#3b2063] uppercase leading-tight mt-0.5">{branchName}</div>
              </div>
            </div>
            <div className="bg-[#3b2063] rounded-[0.625rem] flex items-center justify-center px-4 min-w-22.5 shadow-md">
              <div className="text-center text-white">
                <div className="text-[9px] font-bold uppercase opacity-60 leading-none">{formattedDate}</div>
                <div className="text-[13px] font-black leading-tight mt-0.5">{formattedTime}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY ──────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden relative z-10">

          {/* Menu area */}
          <div className={`flex-1 overflow-y-auto p-5 bg-[#f0edf8] transition-all duration-500 ${!menuAvailable ? 'pointer-events-none select-none' : ''}`}>
            {!menuAvailable && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f0edf8]/80 backdrop-blur-sm">
                <div className="w-16 h-16 bg-[#3b2063]/10 rounded-[0.625rem] flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-[#3b2063]/40">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <p className="text-[#3b2063]/40 font-black uppercase text-xs tracking-widest">Complete cash in to unlock menu</p>
              </div>
            )}

            {selectedCategory ? (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 mb-5 sticky top-0 z-10 bg-[#f0edf8] py-2">
                  <button onClick={handleBack} className="bg-white p-3 rounded-[0.625rem] shadow-sm border-2 border-zinc-200 text-[#3b2063] hover:border-[#3b2063] hover:bg-[#f0ebff] transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-0.5">Category</div>
                    <h2 className="text-[#3b2063] font-black text-lg uppercase tracking-wide leading-none">
                      {selectedCategory.name}
                      {categorySize && <span className="ml-2 text-sm opacity-40 font-bold">• {categorySize}</span>}
                    </h2>
                  </div>
                </div>

                {categorySize ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-20">
                    {getFilteredItems(
                      selectedCategory.menu_items.filter(item =>
                        item.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    ).map(item => (
                      <button key={item.id} onClick={() => handleItemClick(item)} className={`${BASE_CARD} hover:bg-[#3b2063] hover:border-[#3b2063] hover:text-white`}>
                        {item.name}
                      </button>
                    ))}
                    {getFilteredItems(selectedCategory.menu_items).length === 0 && (
                      <div className="col-span-full text-center text-zinc-400 font-bold text-sm py-12 uppercase tracking-widest">No items found for this size.</div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 gap-5">
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Step</div>
                      <h3 className="text-xl font-black text-[#3b2063] uppercase">{isWings ? 'Select Quantity' : 'Select Size'}</h3>
                    </div>

                    {isWings ? (
                      <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                        {WINGS_QUANTITIES.map(qty => (
                          <button key={qty} onClick={() => setCategorySize(qty)}
                            className="h-44 bg-white rounded-[0.625rem] shadow-md border-2 border-zinc-200 hover:border-[#3b2063] hover:shadow-xl hover:scale-105 transition-all flex flex-col items-center justify-center font-black uppercase text-sm text-[#3b2063]">
                            {qty}
                          </button>
                        ))}
                      </div>
                    ) : selectedCategory?.sub_categories && selectedCategory.sub_categories.length > 0 ? (
                      <div className="flex gap-5 w-full max-w-md flex-wrap justify-center">
                        {selectedCategory.sub_categories.map(sub => (
                          <button key={sub.id} onClick={() => setCategorySize(sub.name)}
                            className="flex-1 min-w-35 h-56 bg-white rounded-[0.625rem] shadow-md border-2 border-zinc-200 hover:border-[#3b2063] hover:shadow-xl hover:scale-105 transition-all flex flex-col items-center justify-center font-black text-sm text-[#3b2063]">
                            <DrinkIcon className="w-14 h-14 mb-3 opacity-70" />
                            <span className="text-3xl font-black tracking-widest">{sub.name}</span>
                            <span className="mt-2 bg-[#3b2063]/10 text-[#3b2063] text-sm font-black px-3 py-1 rounded-full tracking-widest">
                              {sub.name === 'SM' || sub.name === 'UM' || sub.name === 'PCM' ? 'Medium' :
                               sub.name === 'SL' || sub.name === 'UL' || sub.name === 'PCL' ? 'Large'  :
                               sub.name === 'JR' ? 'Junior' : sub.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-5 w-full max-w-md">
                        {[
                          { key: selectedCategory?.cup?.size_m || 'M', label: 'Medium', sizeClass: 'w-14 h-14' },
                          ...(selectedCategory?.cup?.size_l ? [{ key: selectedCategory.cup.size_l, label: 'Large', sizeClass: 'w-20 h-20' }] : []),
                        ].map(({ key, label, sizeClass }) => (
                          <button key={key} onClick={() => setCategorySize(key)}
                            className="flex-1 h-56 bg-white rounded-[0.625rem] shadow-md border-2 border-zinc-200 hover:border-[#3b2063] hover:shadow-xl hover:scale-105 transition-all flex flex-col items-center justify-center font-black text-sm text-[#3b2063]">
                            <DrinkIcon className={`${sizeClass} mb-3 opacity-70`} />
                            <span className="text-3xl font-black tracking-widest">{key}</span>
                            <span className="mt-2 bg-[#3b2063]/10 text-[#3b2063] text-sm font-black px-3 py-1 rounded-full tracking-widest">{label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="pb-20 animate-in fade-in zoom-in duration-300 space-y-7">
                {[
                  { label: 'Food',   types: ['food', 'wings'], colorKey: 'food'  },
                  { label: 'Drinks', types: ['drink'],         colorKey: 'drink' },
                  { label: 'Promo',  types: ['promo'],         colorKey: 'promo' },
                ].map(({ label, types, colorKey }) => {
                  const groupCats = filteredCategories.filter(cat => types.includes(cat.type));
                  if (groupCats.length === 0) return null;
                  const { pill, card } = TYPE_BADGE[colorKey as keyof typeof TYPE_BADGE];
                  return (
                    <div key={colorKey}>
                      <div className="flex items-center gap-3 mb-3 px-1">
                        <span className={`${pill} text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm`}>{label}</span>
                        <div className="flex-1 h-px bg-zinc-300/60" />
                        <span className="text-[11px] text-zinc-400 font-bold">{groupCats.length} categories</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {groupCats.map(cat => (
                          <button key={cat.id} onClick={() => handleCategoryClick(cat)} className={`${BASE_CARD} ${card}`}>
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {(() => {
                  const known  = ['food', 'wings', 'drink', 'promo'];
                  const others = filteredCategories.filter(cat => !known.includes(cat.type));
                  if (others.length === 0) return null;
                  return (
                    <div>
                      <div className="flex items-center gap-3 mb-3 px-1">
                        <span className="bg-zinc-400 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">Other</span>
                        <div className="flex-1 h-px bg-zinc-300/60" />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {others.map(cat => (
                          <button key={cat.id} onClick={() => handleCategoryClick(cat)} className={`${BASE_CARD} hover:bg-[#3b2063] hover:border-[#3b2063] hover:text-white`}>
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* ── SIDEBAR CART ────────────────────────────────────────────── */}
          <div className="w-96 bg-white border-l-2 border-zinc-200 flex flex-col shrink-0 shadow-2xl z-30">
            <div className="bg-[#3b2063] p-4 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none">Cashier</div>
                <div className="text-[11px] font-black uppercase leading-tight mt-0.5">{cashierName ?? 'Admin'}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none">Current Order</div>
                <div className="text-[11px] font-black uppercase leading-tight mt-0.5">{orNumber}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none">Items</div>
                <div className="text-[15px] font-black leading-tight mt-0.5">{totalCount}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-white">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                  <DrinkIcon className="w-12 h-12 text-zinc-200" />
                  <p className="text-zinc-300 font-black uppercase text-[10px] tracking-widest">No Items Yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} onClick={() => openCartItemEdit(index)}
                      className="flex justify-between items-start gap-2 bg-zinc-50 p-3 rounded-[0.625rem] border-2 border-zinc-100 hover:border-[#3b2063]/30 hover:bg-[#f9f7ff] transition-colors group cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-xs text-[#3b2063] leading-tight">
                          <span className="text-zinc-400 mr-1">×{item.qty}</span>
                          {item.name}
                          {item.cupSizeLabel && <span className="ml-1 opacity-50 font-bold">({item.cupSizeLabel})</span>}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.sugarLevel != null  && <span className="bg-[#3b2063]/10 text-[#3b2063] text-[9px] px-1.5 py-0.5 rounded-lg font-bold">🍬 {item.sugarLevel}</span>}
                          {item.options?.map(opt    => <span key={opt}   className="bg-blue-100  text-blue-700  text-[9px] px-1.5 py-0.5 rounded-lg font-bold">{opt}</span>)}
                          {item.addOns?.map(addon   => <span key={addon} className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-lg font-bold">+{addon}</span>)}
                          {item.charges?.grab  && <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded-lg font-bold">🛵 Grab</span>}
                          {item.charges?.panda && <span className="bg-pink-100  text-pink-700  text-[9px] px-1.5 py-0.5 rounded-lg font-bold">🐼 Panda</span>}
                          {item.remarks && <span className="bg-zinc-200 text-zinc-600 text-[9px] px-1.5 py-0.5 rounded-lg font-bold italic">📝 {item.remarks}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="text-[#3b2063]/20 group-hover:text-[#3b2063]/60 transition-colors mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                          </svg>
                        </div>
                        <p className="font-black text-sm text-[#3b2063]">
                          ₱{(item.finalPrice + ((item.charges?.grab || item.charges?.panda) ? 30 * item.qty : 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#3b2063] text-white p-5 shrink-0">
              <div className="flex justify-between items-end mb-4 pb-4 border-b border-white/10">
                <div>
                  <div className="text-[9px] font-bold uppercase opacity-60 tracking-widest leading-none">Subtotal</div>
                  <div className="text-[10px] font-bold opacity-40 uppercase mt-0.5">{totalCount} item{totalCount !== 1 ? 's' : ''}</div>
                </div>
                <span className="text-3xl font-black">₱ {subtotal.toFixed(2)}</span>
              </div>
              <button onClick={() => setIsConfirmModalOpen(true)} disabled={cart.length === 0}
                className="w-full py-4 bg-white text-[#3b2063] font-black uppercase tracking-widest text-sm rounded-[0.625rem] shadow-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f0ebff] transition-colors">
                {cart.length === 0 ? 'Add Items to Order' : 'Confirm Order →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── PRINT: RECEIPT ────────────────────────────────────────────────── */}
      {printTarget === 'receipt' && (
        <div className="printable-receipt-container hidden print:block">
          <div className="receipt-area bg-white text-black">
            <div className="text-center mb-4 border-b border-black pb-3">
              <img src={logo} alt="Lucky Boba Logo" className="w-48 h-auto mx-auto mb-2 grayscale" style={{ filter: 'grayscale(100%) contrast(1.2)' }} />
              <h1 className="uppercase leading-tight font-bold text-xl">LUCKY BOBA MILKTEA</h1>
              <p className="text-base mt-1">Quezon City</p>
              <h2 className="text-lg mt-2">SI # {orNumber}</h2>
              <p className="text-sm mt-1">{formattedDate} {formattedTime}</p>
            </div>

            <div className="text-xs space-y-1 mb-3">
              <div className="flex justify-between"><span># 1</span><span>Total Guests: {totalPax}</span></div>
              <div className="flex justify-between"><span>Regular: {pax.regular}</span><span>Senior: {pax.senior}</span></div>
              <div className="mt-1">Cashier: {cashierName ?? 'Admin'}</div>
              {orderCharge && <div className="mt-1">Order Type: {orderCharge === 'grab' ? 'GRABFOOD' : 'FOODPANDA'}</div>}
            </div>

            <div className="mt-3 mb-3 text-xs border-t border-dashed border-black pt-3">
              {cart.map((item, i) => (
                <div key={i} className="mb-2">
                  <div className="uppercase">{item.name} {item.cupSizeLabel ? `(${item.cupSizeLabel})` : ''}</div>
                  <div className="flex justify-between w-full mt-0.5">
                    <span>{item.qty} X {(item.finalPrice / item.qty).toFixed(2)}</span>
                    <span>{item.finalPrice.toFixed(2)}</span>
                  </div>
                  {(item.charges?.grab || item.charges?.panda) && (
                    <div className="flex justify-between w-full text-[10px]">
                      <span>  • {item.charges.grab ? 'Grab' : 'FoodPanda'} Surcharge</span>
                      <span>+{(30 * item.qty).toFixed(2)}</span>
                    </div>
                  )}
                  {item.discountLabel && (
                    <div className="flex justify-between w-full text-[10px] italic">
                      <span>  • Discount: {item.discountLabel}</span>
                    </div>
                  )}
                  {item.size === 'none' && item.sugarLevel != null ? (
                    <>
                      <div className="pl-2 text-[10px]">• Classic Pearl</div>
                      <div className="pl-4 text-[10px]">• Sugar {item.sugarLevel}</div>
                      {item.options?.map(o => <div key={o} className="pl-4 text-[10px]">• {o}</div>)}
                      {item.addOns?.map(a  => <div key={a} className="pl-4 text-[10px]">• + {a}</div>)}
                    </>
                  ) : (
                    <>
                      {item.sugarLevel != null && <div className="pl-2 text-[10px]">• Sugar {item.sugarLevel}</div>}
                      {item.options?.map(o => <div key={o} className="pl-2 text-[10px]">• {o}</div>)}
                      {item.addOns?.map(a  => <div key={a} className="pl-2 text-[10px]">• + {a}</div>)}
                      {item.remarks && <div className="pl-2 text-[10px] italic">• {item.remarks}</div>}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="text-xs space-y-1 border-t border-dashed border-black pt-2">
              <div className="flex justify-between"><span>Total Items</span><span>{totalCount}</span></div>
              <div className="flex justify-between"><span>Sub Total</span><span>{subtotal.toFixed(2)}</span></div>
              {totalDiscountDisplay > 0 && (
                <>
                  {itemDiscountTotal > 0 && (
                    <div className="flex justify-between"><span>Item Discounts</span><span>- {itemDiscountTotal.toFixed(2)}</span></div>
                  )}
                  {(pax.senior > 0 || pax.pwd > 0) && (
                    <div className="flex justify-between"><span>Senior/PWD ({pax.senior + pax.pwd} pax)</span><span>- {seniorPwdDiscount.toFixed(2)}</span></div>
                  )}
                  {selectedDiscount && (
                    <div className="flex justify-between w-full font-bold"><span>Promo: {selectedDiscount.name}</span><span>- {promoDiscount.toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between font-bold border-t border-dashed border-black pt-1 mt-1">
                    <span>Total Discount</span><span>- {totalDiscountDisplay.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-base font-bold mt-1"><span>TOTAL DUE</span><span>{amtDue.toFixed(2)}</span></div>
            </div>

            <div className="text-xs mt-2 space-y-1 border-b border-dashed border-black pb-3">
              <div className="flex justify-between"><span>Payment Method</span><span className="uppercase font-bold">{paymentMethod}</span></div>
              {paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between"><span>Cash (Tendered)</span><span>{typeof cashTendered === 'number' ? cashTendered.toFixed(2) : amtDue.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Change</span><span>{change.toFixed(2)}</span></div>
                </>
              )}
              {referenceNumber && (
                <div className="flex justify-between"><span>Ref/Approval #</span><span className="font-bold">{referenceNumber}</span></div>
              )}
            </div>

            <div className="text-[11px] mt-3 space-y-1">
              <div className="flex justify-between"><span>VATable Sales(V)</span><span>{vatableSales.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>VAT Amount</span><span>{vatAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>VAT Exempt Sales(E)</span><span>0.00</span></div>
              <div className="flex justify-between"><span>Zero-Rated Sales(Z)</span><span>0.00</span></div>
            </div>

            <div className="text-xs mt-5 space-y-2">
              {['Name:', 'TIN/ID/SC:', 'Address:', 'Signature:'].map(label => (
                <div key={label} className="flex justify-between items-end w-full">
                  <span>{label}</span><span className="border-b border-black w-[70%]" />
                </div>
              ))}
            </div>

            <div className="mt-6 mb-4 text-center text-xs uppercase">
              FOR FRANCHISE<br />EMAIL OR CONTACT US ON<br />luckybobafranchising@gmail.com<br />09260029894
            </div>

            <div className="mt-6 py-4 text-center">
              <p className="text-sm tracking-widest uppercase mb-1">Your Order Number Is:</p>
              <h2 className="font-black text-4xl">#{queueNumber}</h2>
              <p className="text-[10px] mt-2 uppercase text-gray-500">Please wait for your number to be called</p>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT: ORDER TICKET ───────────────────────────────────────────── */}
      {printTarget === 'kitchen' && (
        <div className="printable-receipt-container hidden print:block">
          <div className="receipt-area bg-white text-black">
            <div className="text-center mb-4 border-b-4 border-black pb-3">
              <h1 className="uppercase leading-tight font-black text-3xl mb-1">ORDER TICKET</h1>
              <h2 className="font-bold text-lg mt-1 uppercase tracking-widest">Main Branch - QC</h2>
              <div className="py-3 my-3">
                <p className="text-sm tracking-widest uppercase mb-1">Queue</p>
                <h2 className="font-black text-5xl tracking-widest">#{queueNumber}</h2>
              </div>
              <h2 className="text-m mt-1">SI # {orNumber}</h2>
              <p className="text-sm mt-1">{formattedDate} {formattedTime}</p>
            </div>
            <div className="mt-2">
              {cart.map((item, i) => (
                <div key={i} className="mb-4 border-b-2 border-dashed border-gray-400 pb-3">
                  <div className="flex items-start">
                    <span className="font-bold text-m mr-3">{item.qty}x</span>
                    <div className="flex-1">
                      <div className="uppercase text-sm leading-tight mb-1">{item.name} {item.cupSizeLabel ? `(${item.cupSizeLabel})` : ''}</div>
                      {item.size === 'none' && item.sugarLevel != null ? (
                        <>
                          <div className="text-sm font-bold mt-1">• Classic Pearl</div>
                          <div className="text-sm pl-3">Sugar: {item.sugarLevel}</div>
                          {item.options && item.options.length > 0 && <div className="text-sm pl-3">Options: {item.options.join(', ')}</div>}
                          {item.addOns  && item.addOns.length  > 0 && <div className="text-sm pl-3">Add: {item.addOns.join(', ')}</div>}
                        </>
                      ) : (
                        <>
                          {item.sugarLevel != null && <div className="text-sm mt-1">Sugar: {item.sugarLevel}</div>}
                          {item.options && item.options.length > 0 && <div className="text-sm">Options: {item.options.join(', ')}</div>}
                          {item.addOns  && item.addOns.length  > 0 && <div className="text-sm">Add: {item.addOns.join(', ')}</div>}
                          {item.remarks && <div className="text-sm italic mt-2 border-t border-gray-200 pt-1">{item.remarks}</div>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center text-sm mt-4 uppercase tracking-widest">--- END OF TICKET ---</div>
          </div>
        </div>
      )}

      {/* ── PRINT: STICKERS ───────────────────────────────────────────────── */}
      {printTarget === 'stickers' && (
        <div className="printable-receipt-container hidden print:block">
          {renderStickers()}
        </div>
      )}
    </>
  );
};

export default SalesOrder;