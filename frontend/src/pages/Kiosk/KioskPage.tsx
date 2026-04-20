import { useState, useEffect, useCallback, useRef } from 'react';
import logo from '../../assets/logo.png';
import api from '../../services/api';
import KioskLayout from '../../components/Kiosk/KioskLayout';
import {
  ShoppingBag,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Plus,
  Minus,
  Search,
  X,
  MapPin,
  Clock,
  Lock,
} from 'lucide-react';
import { KioskTicketPrint } from '../../components/Cashier/SalesOrderComponents/print';
import { getImageUrl } from '../../utils/imageUtils';
import { generateORNumber } from '../../components/Cashier/SalesOrderComponents/shared';

// --- Types ---

interface MenuItem {
  id: number;
  name: string;
  category: string;
  sellingPrice: number;
  image: string | null;
  size?: string;
}

interface Branch {
  id: number;
  name: string;
  address?: string;
}

interface AddOnOption {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface SugarLevelOption {
  id: number;
  label: string;
  value: string;
}

interface CartItem extends MenuItem {
  qty: number;
  uniqueId: string;
  selectedAddOns?: AddOnOption[];
  selectedSugarLevel?: string;
  itemTotal: number;
}

// --- Hooks ---

const IDLE_TIMEOUT = 120000; // 2 minutes

const useKioskIdle = (onReset: () => void) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(onReset, IDLE_TIMEOUT);
  }, [onReset]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handler = () => resetTimer();

    events.forEach(e => document.addEventListener(e, handler));
    resetTimer();

    return () => {
      events.forEach(e => document.removeEventListener(e, handler));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resetTimer]);
};

// --- Main Component ---

const KioskPage = () => {
  const [step, setStep] = useState<'splash' | 'order_type' | 'menu' | 'confirm' | 'select_branch'>('splash');
  const [orderType, setOrderType] = useState<'dine_in' | 'take_out' | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [printData, setPrintData] = useState<{
    invoice: string;
    cart: CartItem[];
  } | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [confirmCountdown, setConfirmCountdown] = useState<number>(30);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [branchSearch, setBranchSearch] = useState('');
  const [branchName, setBranchName] = useState<string>('Lucky Boba');
  const [selectedBranchToConfirm, setSelectedBranchToConfirm] = useState<Branch | null>(null);

  // Customization State
  const [allAddOns, setAllAddOns] = useState<AddOnOption[]>([]);
  const [sugarLevels, setSugarLevels] = useState<SugarLevelOption[]>([]);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnOption[]>([]);
  const [selectedSugarLevel, setSelectedSugarLevel] = useState<string>('100%');

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Admin & Expo State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isExpoMode, setIsExpoMode] = useState<boolean>(() => localStorage.getItem('kiosk_expo_mode') === 'true');
  const [expoItemIds, setExpoItemIds] = useState<number[]>(() => {
    const stored = localStorage.getItem('kiosk_expo_items');
    return stored ? JSON.parse(stored) : [];
  });
  const [expoCategoryFilter, setExpoCategoryFilter] = useState('');
  const [expoSearchQuery, setExpoSearchQuery] = useState('');

  // Order Status State
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-reset helper
  const handleReset = useCallback(() => {
    setStep('splash');
    setOrderType(null);
    setCart([]);
    setOrderNumber(null);
    setPrintData(null);
  }, []);

  useKioskIdle(handleReset);

  // Initialization
  useEffect(() => {
    const initKiosk = async () => {
      const params = new URLSearchParams(window.location.search);
      let bIdAttr = params.get('branch_id');

      // If not in URL, check localStorage
      if (!bIdAttr) {
        bIdAttr = localStorage.getItem('kiosk_branch_id');
      }

      if (bIdAttr) {
        const parsedId = parseInt(bIdAttr);
        setBranchId(parsedId);
        localStorage.setItem('kiosk_branch_id', bIdAttr);

        try {
          setLoading(true);
          const [res, aoRes, slRes] = await Promise.all([
            api.get(`/public-menu?branch_id=${parsedId}`),
            api.get('/add-ons'),
            api.get('/sugar-levels')
          ]);

          const rawItems: MenuItem[] = res.data;
          setItems(rawItems);

          const isExpo = localStorage.getItem('kiosk_expo_mode') === 'true';
          let eIds: number[] = [];
          const stored = localStorage.getItem('kiosk_expo_items');
          if (stored) eIds = JSON.parse(stored);

          const displayItems = isExpo ? rawItems.filter(i => eIds.includes(i.id)) : rawItems;

          const cats = Array.from(new Set(displayItems.map(i => i.category))).filter(Boolean);
          setCategories(cats);
          if (cats.length > 0) setActiveCategory(cats[0]);

          // Set customization options
          setAllAddOns(aoRes.data);
          if (slRes.data && slRes.data.success) {
            setSugarLevels(slRes.data.data);
          }

          // Also fetch branch name
          const bRes = await api.get('/branches/available');
          const branches: Branch[] = bRes.data.data;
          const current = branches.find(b => b.id === parsedId);
          if (current) setBranchName(current.name);

        } catch (err) {
          console.error("Failed to fetch menu", err);
        } finally {
          setLoading(false);
        }
      } else {
        // No branch ID found anywhere, go to selection
        setStep('select_branch');
        fetchBranches();
      }
    };

    initKiosk();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/branches/available');
      setAllBranches(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch branches", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranchToConfirm(branch);
  };

  const confirmBranchSelection = () => {
    if (!selectedBranchToConfirm) return;
    const branch = selectedBranchToConfirm;

    setBranchId(branch.id);
    setBranchName(branch.name);
    localStorage.setItem('kiosk_branch_id', branch.id.toString());
    setSelectedBranchToConfirm(null);
    setStep('splash');
    // Refresh items for this branch
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const [res, aoRes, slRes] = await Promise.all([
          api.get(`/public-menu?branch_id=${branch.id}`),
          api.get('/add-ons'),
          api.get('/sugar-levels')
        ]);

        const rawItems: MenuItem[] = res.data;
        setItems(rawItems);
        
        const isExpo = localStorage.getItem('kiosk_expo_mode') === 'true';
        let eIds: number[] = [];
        const stored = localStorage.getItem('kiosk_expo_items');
        if (stored) eIds = JSON.parse(stored);

        const displayItems = isExpo ? rawItems.filter(i => eIds.includes(i.id)) : rawItems;
        const cats = Array.from(new Set(displayItems.map(i => i.category))).filter(Boolean);
        setCategories(cats);
        // Default to 'All Items' for better user experience
        setActiveCategory('');

        // Set customization options
        setAllAddOns(aoRes.data);
        if (slRes.data && slRes.data.success) {
          setSugarLevels(slRes.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch menu", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  };

  const [, setLogoClickCount] = useState(0);
  const handleLogoClick = () => {
    setLogoClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setIsPinModalOpen(true);
        setPinInput('');
        setPinError(false);
        return 0;
      }
      return newCount;
    });
    // Reset counter after 2 seconds of inactivity
    setTimeout(() => setLogoClickCount(0), 2000);
  };

  const addToCart = (item: MenuItem, addons: AddOnOption[] = [], sugar: string = '100%') => {
    setCart((prev: CartItem[]) => {
      // We calculate a unique key for grouping same items with same customizations
      const addonIds = addons.map(a => a.id).sort().join(',');
      // groupKey REMOVED to fix lint warning (manually comparing below)

      const existing = prev.find((i: CartItem) => {
        const iAddonIds = (i.selectedAddOns || []).map(a => a.id).sort().join(',');
        return i.id === item.id && i.selectedSugarLevel === sugar && iAddonIds === addonIds;
      });

      const addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
      const itemPrice = Number(item.sellingPrice) || 0;
      const itemTotal = itemPrice + addonsTotal;

      if (existing) {
        return prev.map((i: CartItem) => {
          const iAddonIds = (i.selectedAddOns || []).map(a => a.id).sort().join(',');
          if (i.id === item.id && i.selectedSugarLevel === sugar && iAddonIds === addonIds) {
            return { ...i, qty: i.qty + 1 };
          }
          return i;
        });
      }

      return [...prev, {
        ...item,
        qty: 1,
        uniqueId: Math.random().toString(36).substr(2, 9),
        selectedAddOns: addons,
        selectedSugarLevel: sugar,
        itemTotal: itemTotal
      }];
    });
  };

  const handleItemClick = (item: MenuItem) => {
    const cat = item.category?.toLowerCase() || '';
    const needsCustomization = cat.includes('milk tea') || cat.includes('milktea') ||
      cat.includes('coffee') || cat.includes('yakult') ||
      cat.includes('fruit') || cat.includes('yogurt') ||
      cat.includes('waffle') || cat.includes('frappe') ||
      cat.includes('series') || cat.includes('drink');

    if (needsCustomization) {
      setCustomizingItem(item);
      setSelectedAddOns([]);
      setSelectedSugarLevel('100%');
      setShowCustomizer(true);
    } else {
      addToCart(item);
    }
  };

  const confirmCustomization = () => {
    if (customizingItem) {
      addToCart(customizingItem, selectedAddOns, selectedSugarLevel);
      setShowCustomizer(false);
      setCustomizingItem(null);
    }
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev: CartItem[]) => prev.map((i: CartItem) => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeFromCart = (id: number) => {
    setCart((prev: CartItem[]) => prev.filter((i: CartItem) => i.id !== id));
  };

  const calculateTotal = () => cart.reduce((sum: number, item: CartItem) => sum + (item.itemTotal * item.qty), 0);

  const handleSubmit = async () => {
    if (cart.length === 0 || !branchId) return;
    try {
      setLoading(true);
      
      let seq = 1;
      try {
        const { data } = await api.get('/receipts/next-sequence');
        const serverSeq = parseInt(data.next_sequence, 10);
        if (!isNaN(serverSeq)) {
          seq = serverSeq;
          const seqKey = `last_or_sequence_${branchId}`;
          localStorage.setItem(seqKey, String(seq));
        } else {
          throw new Error('Invalid sequence');
        }
      } catch {
        const seqKey = `last_or_sequence_${branchId}`;
        seq = parseInt(localStorage.getItem(seqKey) || '0', 10) + 1;
        localStorage.setItem(seqKey, String(seq));
      }
      
      const siNumber = generateORNumber(seq);
      const timestamp = Math.floor(Date.now() / 1000).toString();

      const total = calculateTotal();
      const vatableSales = total / 1.12;
      const vatAmount = total - vatableSales;

      const payload = {
        si_number: siNumber,
        branch_id: branchId,
        payment_method: 'cash',
        status: 'pending',
        source: 'kiosk',
        order_type: orderType,
        subtotal: total,
        total: total,
        vatable_sales: Number(vatableSales.toFixed(2)),
        vat_amount: Number(vatAmount.toFixed(2)),
        items: cart.map((item: CartItem) => ({
          menu_item_id: item.id,
          name: item.name,
          quantity: item.qty,
          unit_price: Number(item.sellingPrice),
          total_price: item.itemTotal * item.qty,
          sugar_level: item.selectedSugarLevel || '100%',
          add_ons: (item.selectedAddOns || []).map(ao => ({
            name: ao.name,
            price: ao.price
          })),
          size: item.size || 'Standard',
        }))
      };

      await api.post('/kiosk-sales', payload);
      setOrderNumber(timestamp.slice(-4));
      setPrintData({ invoice: siNumber, cart: [...cart] });
      setStep('confirm');
      setConfirmCountdown(30);

      // Auto-reset timer
      setTimeout(handleReset, 30000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Failed to place order. Please call staff.';
      setErrorMessage(msg);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle Automatic Printing
  useEffect(() => {
    if (printData && step === 'confirm') {
      const timer = setTimeout(() => {
        window.print();
      }, 500); // Reduced buffer for faster thermal response
      return () => clearTimeout(timer);
    }
  }, [printData, step]);

  // Handle Confirm Countdown Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'confirm' && confirmCountdown > 0) {
      timer = setInterval(() => {
        setConfirmCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, confirmCountdown]);

  // --- Views ---

  const SplashView = () => (
    <div
      className="flex-1 flex flex-col items-center justify-between p-10 lg:p-16 cursor-pointer relative overflow-hidden animate-in fade-in duration-700 bg-gradient-to-br from-violet-50 via-white to-violet-100"
      onClick={() => setStep('order_type')}
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-violet-200/40 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-emerald-100/30 rounded-full blur-[120px] translate-x-1/4 translate-y-1/4 pointer-events-none"></div>

      {/* Top Section */}
      <div className="w-full flex justify-center pt-12 lg:pt-20 relative z-10 pointer-events-none shrink-0">
        <div className="bg-white/80 backdrop-blur-md px-12 py-5 rounded-full shadow-sm border border-white/50">
          <p className="text-xl lg:text-3xl text-[#3b2063] font-black uppercase tracking-[0.2em]">{branchName}</p>
        </div>
      </div>

      {/* Center Section - Hero & Branding */}
      <div className="flex flex-col items-center justify-center flex-1 relative z-10 w-full px-4 gap-12 lg:gap-20">
        <img src={logo} alt="Lucky Boba" className="w-[300px] lg:w-[500px] h-auto object-contain drop-shadow-2xl" />

        <div className="flex flex-col items-center gap-6 lg:gap-10">
          <h1 className="text-5xl lg:text-8xl font-black text-[#3b2063] text-center italic tracking-tight drop-shadow-sm pointer-events-none">
            Life's Better with Boba.
          </h1>
          <p className="text-xl lg:text-4xl text-zinc-500 font-bold text-center max-w-2xl lg:max-w-4xl pointer-events-none leading-relaxed">
            Freshly brewed tea, creamy milk, and chewy pearls crafted just for you.
          </p>
        </div>
      </div>

      {/* Bottom Section - CTA */}
      <div className="w-full flex justify-center pb-16 lg:pb-32 relative z-10 shrink-0">
        <button className="bg-[#3b2063] text-white px-20 py-10 rounded-full font-black text-3xl lg:text-5xl uppercase tracking-widest shadow-[0_30px_60px_-15px_rgba(59,32,99,0.7)] animate-pulse hover:scale-105 transition-transform flex items-center gap-4">
          Tap Here to Order
        </button>
      </div>
    </div>
  );

  const OrderTypeView = () => (
    <div className="flex-1 flex flex-col p-16 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-[#fafafa]">
      <div className="flex items-center gap-4 mb-16">
        <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
          <ShoppingBag size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">How would you like to eat?</h2>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select your dining preference</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-20 w-full max-w-6xl mx-auto">
        <div className="flex gap-20 w-full justify-center">
          {/* Dine In - SLIGHT ACCENT */}
          <button
            onClick={() => setOrderType('dine_in')}
            className={`group relative flex-1 max-w-md aspect-[4/5] bg-white rounded-[3rem] shadow-2xl transition-all duration-300 flex flex-col items-center justify-center p-14 overflow-hidden ${orderType === 'dine_in'
                ? 'border-4 border-violet-600 shadow-violet-200/50 scale-105 bg-violet-50/30'
                : 'border-2 border-transparent hover:border-violet-300 hover:-translate-y-2'
              }`}
          >
            {orderType === 'dine_in' && (
              <div className="absolute top-10 right-10 text-violet-600 animate-in zoom-in duration-300">
                <CheckCircle2 size={48} className="fill-violet-100" />
              </div>
            )}
            <div className={`w-52 h-52 rounded-full flex items-center justify-center mb-10 transition-all duration-500 ${orderType === 'dine_in' ? 'bg-violet-600 rotate-12 scale-110 shadow-xl shadow-violet-300' : 'bg-violet-50 group-hover:bg-violet-100 group-hover:scale-105 group-hover:rotate-6'
              }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-24 h-24 transition-colors ${orderType === 'dine_in' ? 'text-white' : 'text-violet-600 group-hover:text-violet-700'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className={`text-5xl font-black uppercase italic transition-colors ${orderType === 'dine_in' ? 'text-violet-900' : 'text-zinc-900 group-hover:text-violet-800'
              }`}>Dine In</h3>
            <p className="mt-6 text-zinc-400 font-bold uppercase tracking-[0.2em] text-sm">Eat here at our branch</p>
          </button>

          {/* Take Out */}
          <button
            onClick={() => setOrderType('take_out')}
            className={`group relative flex-1 max-w-md aspect-[4/5] bg-white rounded-[3rem] shadow-2xl transition-all duration-300 flex flex-col items-center justify-center p-14 overflow-hidden ${orderType === 'take_out'
                ? 'border-4 border-violet-600 shadow-violet-200/50 scale-105 bg-violet-50/30'
                : 'border-2 border-transparent hover:border-violet-300 hover:-translate-y-2'
              }`}
          >
            {orderType === 'take_out' && (
              <div className="absolute top-10 right-10 text-violet-600 animate-in zoom-in duration-300">
                <CheckCircle2 size={48} className="fill-violet-100" />
              </div>
            )}
            <div className={`w-52 h-52 rounded-full flex items-center justify-center mb-10 transition-all duration-500 ${orderType === 'take_out' ? 'bg-violet-600 rotate-12 scale-110 shadow-xl shadow-violet-300' : 'bg-violet-50 group-hover:bg-violet-100 group-hover:scale-105 group-hover:rotate-6'
              }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-24 h-24 transition-colors ${orderType === 'take_out' ? 'text-white' : 'text-violet-600 group-hover:text-violet-700'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className={`text-5xl font-black uppercase italic transition-colors ${orderType === 'take_out' ? 'text-violet-900' : 'text-zinc-900 group-hover:text-violet-800'
              }`}>Take Out</h3>
            <p className="mt-6 text-zinc-400 font-bold uppercase tracking-[0.2em] text-sm">Enjoy your boba at home</p>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex justify-between items-center mt-6 px-10">
          <button
            onClick={() => setStep('splash')}
            className="text-zinc-400 font-bold uppercase tracking-widest text-xs hover:text-red-500 transition-colors flex items-center gap-2 px-6 py-4"
          >
            <X size={16} />
            Cancel Order
          </button>

          <button
            onClick={() => setStep('menu')}
            disabled={!orderType}
            className={`px-12 py-6 rounded-full font-black text-xl uppercase tracking-widest transition-all shadow-lg flex items-center gap-4 ${orderType
                ? 'bg-violet-600 text-white shadow-violet-300 hover:bg-violet-700 hover:scale-105 active:scale-95 cursor-pointer animate-pulse'
                : 'bg-zinc-200 text-zinc-400 shadow-transparent cursor-not-allowed opacity-50'
              }`}
          >
            <span>Continue</span>
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );

  const MenuView = () => {
    return (
      <div className="flex-1 flex overflow-hidden bg-[#fafafa]">
        {/* Categories Sidebar */}
        <div className="w-80 bg-white flex flex-col overflow-y-auto scrollbar-hide border-r border-zinc-100">
          <div className="p-10 pb-6 text-center">
            <img
              src={logo}
              alt="Lucky Boba"
              className="w-48 h-auto cursor-pointer active:scale-95 transition-transform mx-auto"
              onClick={handleLogoClick}
            />
            <span className="text-sm font-black text-violet-900/40 uppercase tracking-[0.2em] mb-4 block mt-10">Categories</span>
          </div>
          <button
            onClick={() => {
              setActiveCategory('');
              setSearchQuery('');
            }}
            className="px-6 py-4 group transition-all w-full"
          >
            <div className={`px-6 py-5 rounded-2xl text-left transition-all flex items-center justify-between ${activeCategory === '' && searchQuery === ''
                ? 'bg-violet-600 text-white shadow-xl shadow-violet-200 font-black'
                : 'text-zinc-500 hover:bg-zinc-50 font-bold'
              }`}>
              <span className="text-lg uppercase tracking-wider leading-tight truncate">All Items</span>
            </div>
          </button>
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSearchQuery(''); // Clear search when picking category
              }}
              className="px-6 py-4 group transition-all w-full"
            >
              <div className={`px-6 py-5 rounded-2xl text-left transition-all flex items-center justify-between gap-3 overflow-hidden ${activeCategory === cat
                  ? 'bg-violet-600 text-white shadow-xl shadow-violet-200 font-black'
                  : 'text-zinc-500 hover:bg-zinc-50 font-bold'
                }`}>
                <span className="text-lg uppercase tracking-wider leading-tight truncate">
                  {cat}
                </span>
                {activeCategory === cat && (
                  <div className="w-3 h-3 bg-white rounded-full shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Main Menu Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Header */}
          <div className="bg-white px-10 py-6 border-b border-zinc-100 flex items-center gap-6">
            <div className="relative flex-1 max-w-xl">
              <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Search your favorite boba..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeCategory) setActiveCategory('');
                }}
                className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-6 text-base font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-violet-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-10 scroll-smooth space-y-12">
            {categories
              .filter(cat => activeCategory === '' || cat === activeCategory)
              .map(cat => {
                const categoryItems = items.filter((item: MenuItem) => {
                  if (isExpoMode && !expoItemIds.includes(item.id)) return false;
                  const matchesSearch = searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesCategory = item.category === cat;
                  return matchesSearch && matchesCategory;
                });

                if (categoryItems.length === 0) return null;

                return (
                  <div key={cat} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-black text-[#3b2063] uppercase italic tracking-tight">{cat}</h2>
                      <div className="h-px flex-1 bg-zinc-100"></div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{categoryItems.length} Items</span>
                    </div>

                    <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {categoryItems.map((item: MenuItem) => (
                        <div
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100 flex flex-col items-center text-center active:scale-[0.98] transition-all cursor-pointer group hover:shadow-xl hover:shadow-violet-200/40 hover:border-violet-300 relative h-full"
                        >
                          <div className="w-full aspect-square rounded-xl bg-zinc-50 mb-5 flex items-center justify-center overflow-hidden relative border border-zinc-50/50 shadow-inner">
                            {item.image ? (
                              <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                              <div className="flex flex-col items-center gap-2 opacity-20">
                                <ShoppingBag size={32} />
                                <span className="text-[8px] font-bold uppercase tracking-widest">Lucky Boba</span>
                              </div>
                            )}
                          </div>
                          <h3 className="font-bold text-zinc-800 leading-tight mb-2 h-12 overflow-hidden line-clamp-2 capitalize text-base tracking-tight px-1 flex flex-col justify-center">
                            <span>
                              {item.name.toLowerCase()}
                              {item.size && <span className="font-bold text-violet-400 capitalize ml-1">({item.size.toLowerCase()})</span>}
                            </span>
                          </h3>

                          <div className="w-full flex items-center justify-between mt-auto pt-2 px-1 text-xs">
                            <div className="text-[#3b2063] font-black text-2xl">
                              ₱{Number(item.sellingPrice).toFixed(2)}
                            </div>

                            <button className="bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm">
                              <Plus size={20} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

            {/* Flat list for uncategorized items if using All Items search */}
            {activeCategory === '' && items.filter(i => (!i.category) && (!isExpoMode || expoItemIds.includes(i.id))).length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black text-[#3b2063] uppercase italic tracking-tight">Others</h2>
                  <div className="h-px flex-1 bg-zinc-100"></div>
                </div>
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {items.filter(i => (!i.category) && (!isExpoMode || expoItemIds.includes(i.id))).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100 flex flex-col items-center text-center active:scale-[0.98] transition-all cursor-pointer group hover:shadow-xl hover:shadow-violet-200/40 hover:border-violet-300 relative h-full"
                    >
                      {/* Same Item Card UI as above */}
                      <div className="w-full aspect-square rounded-xl bg-zinc-50 mb-5 flex items-center justify-center overflow-hidden relative border border-zinc-50/50 shadow-inner">
                        {item.image ? (
                          <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 opacity-20">
                            <ShoppingBag size={32} />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-zinc-800 leading-tight mb-2 h-12 overflow-hidden line-clamp-2 capitalize text-base tracking-tight px-1 flex flex-col justify-center">
                        <span>
                          {item.name.toLowerCase()}
                          {item.size && <span className="font-bold text-violet-400 capitalize ml-1">({item.size.toLowerCase()})</span>}
                        </span>
                      </h3>
                      <div className="w-full flex items-center justify-between mt-auto pt-2 px-1">
                        <div className="text-[#3b2063] font-black text-2xl">₱{Number(item.sellingPrice).toFixed(2)}</div>
                        <button className="bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm"><Plus size={20} strokeWidth={3} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {items.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center py-20 opacity-30">
                <ShoppingBag size={48} className="mb-4" />
                <p className="font-black uppercase tracking-widest text-base text-center">No items available at this branch</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="w-[480px] bg-white flex flex-col shadow-2xl z-10 border-l border-zinc-100">
          <div className="p-10 border-b border-zinc-50 flex items-center justify-between bg-white relative z-20">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Cart</h2>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Order Summary</p>
            </div>
            <div className="bg-violet-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-100">
              <span className="font-black text-xl">{cart.reduce((s: number, i: CartItem) => s + i.qty, 0)}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <ShoppingBag size={64} className="mb-6" />
                <p className="font-black uppercase tracking-widest text-xs">Your cart is empty</p>
              </div>
            ) : (
              cart.map((item: CartItem) => (
                <div key={item.uniqueId} className="flex items-center gap-6 group">
                  <div className="w-16 h-16 bg-zinc-100 rounded-xl shrink-0 overflow-hidden">
                    {item.image && <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-zinc-800 uppercase text-xs mb-1 truncate">
                      {item.name}
                      {item.size && <span className="text-[8px] font-bold text-violet-400 ml-1">({item.size})</span>}
                    </h4>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.selectedSugarLevel && (
                        <span className="text-[8px] px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded-md font-bold uppercase tracking-tight">
                          {item.selectedSugarLevel}
                        </span>
                      )}
                      {item.selectedAddOns?.map(ao => (
                        <span key={ao.id} className="text-[8px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md font-bold uppercase tracking-tight">
                          + {ao.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-zinc-100 rounded-lg">
                        <button onClick={() => updateQty(item.id, -1)} className="p-2 hover:text-violet-600"><Minus size={14} /></button>
                        <span className="w-8 text-center font-black text-sm">{item.qty}</span>
                        <button onClick={() => addToCart(item, item.selectedAddOns, item.selectedSugarLevel)} className="p-2 hover:text-violet-600"><Plus size={14} /></button>
                      </div>
                      <span className="font-black text-violet-600 text-sm">₱{(item.itemTotal * item.qty).toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-8 border-t border-zinc-100 bg-zinc-50 space-y-6 relative z-20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px]">Total Amount</span>
                <div className="text-3xl font-black text-zinc-900 mt-1">₱{calculateTotal().toFixed(2)}</div>
                {cart.length > 0 && (
                  <div className="text-[11px] text-zinc-500 font-bold mt-2 bg-zinc-100 inline-block px-3 py-1 rounded-full border border-zinc-200">
                    {cart.reduce((s: number, i: CartItem) => s + i.qty, 0)} Items Selected
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-emerald-600 font-bold uppercase tracking-widest text-[9px] block mb-1">Pay at Counter</span>
                <span className="text-zinc-400 text-[8px] uppercase font-bold">Cash/Card accepted</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleReset}
                className="py-5 rounded-2xl bg-white border border-zinc-200 text-zinc-400 font-bold uppercase tracking-widest text-[10px] hover:text-red-500 transition-all active:scale-95"
              >
                Clear
              </button>
              <button
                onClick={handleSubmit}
                disabled={cart.length === 0 || loading}
                className="py-5 rounded-2xl bg-violet-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-violet-100 active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100"
              >
                {loading ? '...' : 'Checkout'}
              </button>
            </div>
          </div>
        </div>

        {/* Customization Modal */}
        {showCustomizer && customizingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 print:hidden overflow-hidden">
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowCustomizer(false)} />
            <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-zinc-50 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center p-2">
                    {customizingItem.image ? (
                      <img src={getImageUrl(customizingItem.image)} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <ShoppingBag size={32} className="text-zinc-200" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-zinc-900 uppercase italic tracking-tight">{customizingItem.name}</h3>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{customizingItem.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomizer(false)}
                  className="w-12 h-12 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
                {/* Sugar Level Selection */}
                {(customizingItem.category?.toLowerCase().includes('milk tea') ||
                  customizingItem.category?.toLowerCase().includes('milktea')) && sugarLevels.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-6 h-6 bg-violet-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black">1</div>
                        <h4 className="font-black text-zinc-900 uppercase tracking-widest text-xs italic">Select Sugar Level</h4>
                      </div>
                      <div className="grid grid-cols-5 gap-3">
                        {sugarLevels.map((sl) => (
                          <button
                            key={sl.id}
                            onClick={() => setSelectedSugarLevel(sl.value)}
                            className={`py-6 rounded-2xl font-black text-sm transition-all border-2 ${selectedSugarLevel === sl.value
                                ? 'bg-violet-600 border-violet-600 text-white shadow-xl shadow-violet-200 active:scale-95'
                                : 'bg-white border-zinc-100 text-zinc-400 hover:border-violet-200'
                              }`}
                          >
                            {sl.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Addons Selection */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-6 h-6 bg-violet-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black">
                      {(customizingItem.category?.toLowerCase().includes('milk tea') || customizingItem.category?.toLowerCase().includes('milktea')) ? '2' : '1'}
                    </div>
                    <h4 className="font-black text-zinc-900 uppercase tracking-widest text-xs italic">Add Toppings</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {allAddOns
                      .filter(ao => {
                        const itemCat = customizingItem.category?.toLowerCase() || '';
                        if (itemCat.includes('waffle')) return ao.category === 'waffle';
                        return ao.category === 'drink' || ao.category === 'Toppings';
                      })
                      .map((ao) => {
                        const isSelected = selectedAddOns.some(a => a.id === ao.id);
                        return (
                          <button
                            key={ao.id}
                            onClick={() => {
                              setSelectedAddOns(prev =>
                                isSelected
                                  ? prev.filter(p => p.id !== ao.id)
                                  : [...prev, ao]
                              );
                            }}
                            className={`p-6 rounded-3xl border-2 flex items-center justify-between transition-all group ${isSelected
                                ? 'border-violet-600 bg-violet-50/50 shadow-lg shadow-violet-100 active:scale-95'
                                : 'border-zinc-100 bg-white hover:border-violet-200 active:scale-95'
                              }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-violet-600 text-white' : 'bg-zinc-100 text-zinc-300'
                                }`}>
                                {isSelected ? <Plus size={18} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                              </div>
                              <span className={`font-black uppercase text-[11px] ${isSelected ? 'text-violet-900' : 'text-zinc-500'}`}>
                                {ao.name}
                              </span>
                            </div>
                            <span className={`font-black text-sm ${isSelected ? 'text-violet-600' : 'text-zinc-400'}`}>
                              +₱{Number(ao.price).toFixed(0)}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-10 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between shrink-0">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Item Price</p>
                  <div className="text-4xl font-black text-zinc-900 italic tracking-tighter">
                    ₱{(
                      Number(customizingItem.sellingPrice) +
                      selectedAddOns.reduce((sum, a) => sum + Number(a.price), 0)
                    ).toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={confirmCustomization}
                  className="bg-violet-600 text-white px-12 py-6 rounded-full font-black uppercase tracking-[0.2em] shadow-2xl shadow-violet-200 flex items-center gap-4 hover:bg-violet-700 transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>Add to Tray</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ConfirmView = () => (
    <div className="flex-1 flex flex-col bg-[#f3e8ff]/30 animate-in fade-in duration-700 h-full">
      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center p-10 pb-20">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shrink-0 shadow-lg shadow-emerald-200/50">
          <CheckCircle2 size={32} />
        </div>

        <h1 className="text-3xl font-black mb-1 uppercase tracking-tight italic text-[#3b2063]">Order Placed!</h1>
        <p className="text-[#3b2063]/60 font-bold mb-10 uppercase tracking-widest text-xs">Please proceed to the cashier for payment</p>

        <div className="w-full max-w-sm relative">
          <div className="absolute -top-3 left-0 right-0 h-4 bg-white" style={{
            clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)'
          }}></div>

          <div className="bg-white p-8 pt-12 pb-12 shadow-[0_20px_50px_rgba(59,32,99,0.12)] text-center border-x border-gray-100">
            <img src={logo} alt="Logo" className="w-24 h-auto mx-auto mb-6 grayscale opacity-90" />

            <div className="border-y-2 border-dashed border-gray-200 py-8 mb-6">
              <p className="text-gray-400 font-black uppercase tracking-[0.2em] mb-2 text-[10px]">Your Ticket Number</p>
              <h2 className="text-7xl font-black text-[#3b2063] tracking-tighter italic font-mono">
                #{orderNumber}
              </h2>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full mb-8 py-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-400 font-bold uppercase tracking-widest text-[10px] rounded-2xl border border-zinc-100 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              Reprint Ticket
            </button>

            <div className="space-y-4 mb-8 text-center text-[11px] font-bold text-gray-500 uppercase tracking-tight px-2">
              <div className="flex justify-between border-t border-gray-50 pt-6">
                <span className="text-gray-400">Total Due:</span>
                <span className="text-2xl text-[#3b2063] font-black">₱{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="text-[9px] text-gray-300 font-bold uppercase tracking-[0.2em]">
              {new Date().toLocaleDateString()} — {new Date().toLocaleTimeString()}
            </div>
          </div>

          <div className="absolute -bottom-3 left-0 right-0 h-4 bg-white" style={{
            clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'
          }}></div>
        </div>

        <div className="flex flex-col items-center gap-4 mt-12 mb-10 w-full max-w-sm shrink-0">
          <button
            onClick={handleReset}
            className="bg-[#3b2063] text-white w-full py-8 rounded-full font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-[#2d184d] transition-all transform hover:scale-105 shadow-2xl shadow-[#3b2063]/30 active:scale-95"
          >
            <span className="text-xl">Finish Order ({confirmCountdown}s)</span>
            <ChevronRight size={24} />
          </button>

          <button
            onClick={() => window.print()}
            className="text-[#3b2063]/40 font-black uppercase tracking-widest text-[10px] hover:text-[#3b2063] transition-colors py-2"
          >
            Reprint Receipt
          </button>
        </div>
      </div>
    </div>
  );

  const BranchSelectorView = () => {
    const filtered = allBranches.filter(b =>
      b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
      b.address?.toLowerCase().includes(branchSearch.toLowerCase())
    );

    return (
      <div className="flex-1 flex flex-col bg-[#f5f4f8] p-10 overflow-hidden">
        <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
          <div className="flex flex-col items-center mb-10 shrink-0">
            <img src={logo} alt="Lucky Boba" className="w-40 h-auto mb-6" />
            <h1 className="text-3xl font-black text-[#3b2063] uppercase italic">Kiosk Setup</h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-2">Select the branch for this device</p>
          </div>

          <div className="mb-6 shrink-0 w-full max-w-xl mx-auto">
            <label className="block text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-2 px-1 text-center">
              Find your branch
            </label>
            <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl px-5 py-4 shadow-sm group focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
              <Search size={20} className="text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
              <input
                value={branchSearch}
                onChange={e => setBranchSearch(e.target.value)}
                className="flex-1 bg-transparent text-lg font-bold text-[#3b2063] outline-none placeholder:text-zinc-400"
                placeholder="Search by name or address..."
              />
              {branchSearch && (
                <button onClick={() => setBranchSearch("")} className="text-zinc-400 hover:text-zinc-600 transition-colors bg-zinc-100 hover:bg-zinc-200 p-1 rounded-full flex items-center justify-center">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
            {filtered.map(branch => (
              <button
                key={branch.id}
                onClick={() => handleSelectBranch(branch)}
                className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-col items-start text-left hover:border-violet-300 hover:shadow-md transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center gap-4 w-full mb-4">
                  <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#3b2063] uppercase italic line-clamp-1">{branch.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full mt-2">
                  <div className="flex items-start gap-2 text-zinc-500">
                    <MapPin size={14} className="shrink-0 mt-0.5 text-zinc-400" />
                    <p className="text-sm font-medium line-clamp-2">{branch.address || 'No address provided'}</p>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock size={14} className="shrink-0" />
                    <p className="text-xs font-medium">09:00 AM - 09:00 PM</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Select Branch</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-400">
                <Trash2 size={40} className="mb-4 opacity-20" />
                <p className="font-bold uppercase tracking-widest text-sm italic">No branches found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <KioskLayout>
      <div className="h-full flex flex-col bg-white print:hidden overflow-hidden">
        {step === 'select_branch' && BranchSelectorView()}
        {step === 'splash' && SplashView()}
        {step === 'order_type' && OrderTypeView()}
        {step === 'menu' && MenuView()}
        {step === 'confirm' && ConfirmView()}
      </div>

      {printData && (
        <KioskTicketPrint
          cart={printData.cart}
          branchName={branchName}
          orNumber={printData.invoice}
          queueNumber={printData.invoice.slice(-4)}
          formattedDate={new Date().toLocaleDateString()}
          formattedTime={new Date().toLocaleTimeString()}
          totalAmount={printData.cart.reduce((s: number, i: CartItem) => s + (Number(i.sellingPrice) * i.qty), 0)}
        />
      )}


      {loading && step !== 'menu' && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center print:hidden">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            <span className="font-black text-violet-600 uppercase tracking-widest text-sm">Processing...</span>
          </div>
        </div>
      )}

      {selectedBranchToConfirm && step === 'select_branch' && (
        <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center print:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={32} />
            </div>
            <h2 className="text-2xl font-black text-[#3b2063] uppercase italic text-center mb-2">Confirm Branch</h2>
            <p className="text-zinc-500 text-sm text-center mb-6 font-medium">
              Set this kiosk to <strong className="text-zinc-800">{selectedBranchToConfirm.name}</strong>? This will bind the device to this location.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedBranchToConfirm(null)}
                className="flex-1 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBranchSelection}
                className="flex-1 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-violet-200 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Security PIN Modal */}
      {isPinModalOpen && (() => {
        
        const handleVerifyPin = async (pinToVerify: string) => {
          try {
            setLoading(true);
            const response = await api.post('/kiosk/verify-pin', {
              pin: pinToVerify,
              branch_id: branchId
            });
            
            if (response.data.success) {
              setPinInput('');
              setIsPinModalOpen(false);
              setIsAdminModalOpen(true);
            } else {
              triggerError();
            }
          } catch (err) {
            triggerError();
          } finally {
            setLoading(false);
          }
        };

        const triggerError = () => {
          setPinError(true);
          setTimeout(() => {
            setPinError(false);
            setPinInput('');
          }, 600);
        };

        return (
        <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md z-[100] flex items-center justify-center print:hidden p-6">
          <div className={`bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl transition-all duration-300 ${pinError ? 'animate-shake' : ''}`}>
            <div className="w-20 h-20 bg-violet-100 text-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Lock size={40} />
            </div>

            <h2 className="text-2xl font-black text-[#3b2063] uppercase italic text-center mb-2">Access Control</h2>
            <p className="text-zinc-500 text-sm text-center mb-8 font-medium">
              Enter Admin Security PIN to reset Kiosk settings.
            </p>

            {/* PIN Dots */}
            <div className="flex justify-center gap-4 mb-10">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${pinInput.length > i
                      ? 'bg-violet-600 border-violet-600 scale-125'
                      : 'border-zinc-200'
                    }`}
                />
              ))}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    if (pinInput.length < 4) {
                      const newPin = pinInput + num;
                      setPinInput(newPin);
                      if (newPin.length === 4) {
                        handleVerifyPin(newPin);
                      }
                    }
                  }}
                  className="h-16 rounded-2xl bg-zinc-50 text-xl font-black text-zinc-700 hover:bg-violet-50 hover:text-violet-600 active:scale-95 transition-all outline-none"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setPinInput('')}
                className="h-16 rounded-2xl bg-zinc-50 text-xs font-black text-zinc-400 uppercase tracking-widest hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all outline-none"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  if (pinInput.length < 4) {
                    const newPin = pinInput + '0';
                    setPinInput(newPin);
                    if (newPin.length === 4) {
                      handleVerifyPin(newPin);
                    }
                  }
                }}
                className="h-16 rounded-2xl bg-zinc-50 text-xl font-black text-zinc-700 hover:bg-violet-50 hover:text-violet-600 active:scale-95 transition-all outline-none"
              >
                0
              </button>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="h-16 rounded-2xl bg-zinc-50 text-xs font-black text-zinc-400 uppercase tracking-widest hover:bg-zinc-200 hover:text-zinc-800 active:scale-95 transition-all outline-none"
              >
                Exit
              </button>
            </div>

            {pinError && (
              <p className="text-red-500 text-xs font-bold text-center uppercase tracking-widest animate-pulse">
                Incorrect PIN
              </p>
            )}
          </div>
        </div>
        );
      })()}

      {/* Admin Settings Modal */}
      {isAdminModalOpen && (
        <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-center print:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-10 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col items-center">
            <h2 className="text-3xl font-black text-[#3b2063] uppercase italic mb-8 shrink-0">Admin Settings</h2>
              
            <div className="w-full flex-1 overflow-y-auto pr-2 space-y-6 text-left shrink">
              {/* Expo Mode Toggle */}
              <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-zinc-900 uppercase">Expo Mode</h3>
                  <p className="text-xs text-zinc-500 font-medium">Limit the menu to specific items only.</p>
                </div>
                <button 
                  onClick={() => {
                      const newMode = !isExpoMode;
                      setIsExpoMode(newMode);
                      localStorage.setItem('kiosk_expo_mode', String(newMode));
                      
                      const displayItems = newMode ? items.filter(i => expoItemIds.includes(i.id)) : items;
                      const newCats = Array.from(new Set(displayItems.map(i => i.category))).filter(Boolean);
                      setCategories(newCats);
                      if (!newCats.includes(activeCategory)) setActiveCategory('');
                  }}
                  className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-colors w-32 shrink-0 ${isExpoMode ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600' : 'bg-zinc-200 text-zinc-400 hover:bg-zinc-300'}`}
                >
                  {isExpoMode ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Expo Item Selection */}
              {isExpoMode && (
                <div className="bg-white p-6 rounded-2xl border border-violet-100">
                  <h3 className="font-bold text-violet-900 uppercase">Select Expo Items</h3>
                  <p className="text-xs text-zinc-500 font-medium mb-4">Click to toggle items for the Expo.</p>
                  
                  {/* Search and Category Filter */}
                  {items.length > 0 && (
                    <div className="flex flex-col gap-3 mb-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                          type="text"
                          placeholder="Search items to add to Expo..."
                          value={expoSearchQuery}
                          onChange={(e) => setExpoSearchQuery(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 pl-10 pr-4 text-sm font-medium placeholder:text-zinc-400 focus:ring-2 focus:ring-violet-500 transition-all outline-none"
                        />
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                          onClick={() => setExpoCategoryFilter('')}
                          className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap shrink-0 ${expoCategoryFilter === '' ? 'bg-[#3b2063] text-white shadow-md' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                        >
                          All
                        </button>
                        {Array.from(new Set(items.map(i => i.category))).filter(Boolean).map(cat => (
                          <button
                            key={cat}
                            onClick={() => setExpoCategoryFilter(cat)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap shrink-0 ${expoCategoryFilter === cat ? 'bg-[#3b2063] text-white shadow-md' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {items.length === 0 ? (
                     <p className="text-xs text-zinc-400 italic">No items loaded for this branch.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto p-1 pr-2">
                      {items.filter(item => {
                         const matchesSearch = !expoSearchQuery || item.name.toLowerCase().includes(expoSearchQuery.toLowerCase());
                         const matchesCategory = !expoCategoryFilter || item.category === expoCategoryFilter;
                         return matchesSearch && matchesCategory;
                      }).map(item => {
                         const isSelected = expoItemIds.includes(item.id);
                         return (
                           <button
                             key={item.id}
                             onClick={() => {
                               let newIds = [...expoItemIds];
                               if (isSelected) {
                                  newIds = newIds.filter(id => id !== item.id);
                               } else {
                                  newIds.push(item.id);
                               }
                               setExpoItemIds(newIds);
                               localStorage.setItem('kiosk_expo_items', JSON.stringify(newIds));
                               
                               const displayItems = items.filter(i => newIds.includes(i.id));
                               const newCats = Array.from(new Set(displayItems.map(i => i.category))).filter(Boolean);
                               setCategories(newCats);
                               if (!newCats.includes(activeCategory)) setActiveCategory('');
                             }}
                             className={`p-4 rounded-xl border-2 text-left flex items-center justify-between group transition-colors ${isSelected ? 'border-violet-600 bg-violet-50 text-violet-900' : 'border-zinc-100 bg-white hover:border-violet-200 text-zinc-500'}`}
                           >
                              <span className={`text-xs font-bold leading-tight capitalize`}>
                                {item.name.toLowerCase()}
                                {item.size && <span className="font-bold text-violet-400 capitalize ml-1">({item.size.toLowerCase()})</span>}
                              </span>
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-violet-600 text-white' : 'bg-zinc-100 text-zinc-300'}`}>
                                {isSelected ? <CheckCircle2 size={14} strokeWidth={4} /> : <div className="w-2 h-2 bg-current rounded-full" />}
                              </div>
                           </button>
                         )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Reset Kiosk */}
              <div className="bg-white p-6 rounded-2xl border border-red-50 flex items-center justify-between mt-8">
                <div>
                  <h3 className="font-bold text-red-600 uppercase">Reset Location</h3>
                  <p className="text-xs text-red-400 font-medium">Unbind this device.</p>
                </div>
                <button 
                  onClick={() => {
                     localStorage.removeItem('kiosk_branch_id');
                     window.location.reload();
                  }}
                  className="px-6 py-4 bg-red-50 border border-red-100 text-red-600 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-colors"
                >
                  Reset Now
                </button>
              </div>
            </div>

            <button 
              onClick={() => setIsAdminModalOpen(false)}
               className="mt-8 py-5 bg-[#3b2063] hover:bg-[#2d184d] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-[#3b2063]/20 w-full shrink-0"
            >
              Close Settings
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm z-[110] flex items-center justify-center print:hidden animate-in fade-in duration-200 px-6">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full mx-auto shadow-2xl animate-in zoom-in-95 duration-200 border border-red-50">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              <X size={40} />
            </div>
            <h2 className="text-2xl font-black text-[#3b2063] uppercase italic text-center mb-2">Order Failed</h2>
            <p className="text-zinc-500 text-sm text-center mb-8 font-medium leading-relaxed">
              {errorMessage || 'Failed to place order. Please call staff for assistance.'}
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full py-6 bg-[#3b2063] hover:bg-[#2a1747] text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-violet-100"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </KioskLayout>
  );
};

export default KioskPage;
