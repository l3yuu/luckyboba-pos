import { useState, useEffect, useCallback, useRef } from 'react';
import logo from '../../assets/logo.png';
import api from '../../services/api';
import KioskLayout from '../../components/Kiosk/KioskLayout';
import {
  ShoppingBag,
  ChevronRight,
  CheckCircle2,
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

          const cats = Array.from(new Set(rawItems.map(i => i.category))).filter(Boolean);
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
        const cats = Array.from(new Set(rawItems.map(i => i.category))).filter(Boolean);
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
          size: 'Standard',
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
      className="flex-1 flex flex-col items-center justify-between p-12 cursor-pointer relative overflow-hidden bg-white kiosk-splash-shell kiosk-splash-gradient"
      onClick={() => setStep('order_type')}
    >
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[100px] animate-float-slow opacity-60"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[450px] h-[450px] bg-amber-400/10 rounded-full blur-[80px] animate-float opacity-50"></div>
      
      {/* Floating Boba Icons (Decorative) */}
      <div className="absolute top-[20%] left-[15%] opacity-20 animate-float pointer-events-none">
        <div className="w-16 h-16 bg-violet-200 rounded-full flex items-center justify-center">
          <ShoppingBag size={32} className="text-violet-600" />
        </div>
      </div>
      <div className="absolute bottom-[30%] right-[12%] opacity-20 animate-float-slow pointer-events-none" style={{ animationDelay: '1s' }}>
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
          <CheckCircle2 size={40} className="text-amber-500" />
        </div>
      </div>

      <div className="w-full flex justify-center pt-4 relative z-10 pointer-events-none shrink-0">
        <div className="glass px-6 py-2 rounded-full border border-zinc-200/50 shadow-sm">
          <p className="text-xs text-zinc-500 font-semibold tracking-[0.16em] uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {branchName}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 relative z-10 w-full gap-8 animate-scale-in">
        <div className="relative group">
          <div className="absolute -inset-4 bg-violet-600/5 rounded-full blur-2xl group-hover:bg-violet-600/10 transition-all duration-500"></div>
          <img src={logo} alt="Lucky Boba" className="w-[280px] h-auto object-contain drop-shadow-2xl relative animate-float-slow" />
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-extrabold text-zinc-900 tracking-[-0.02em] uppercase leading-[0.95]">
            Freshly Brewed<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500">Happiness.</span>
          </h1>
          <p className="text-lg text-zinc-400 font-medium uppercase tracking-[0.12em] max-w-lg">
            Experience the ultimate boba journey
          </p>
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-6 pb-12 relative z-10 shrink-0">
        <button className="group relative overflow-hidden animate-pulse-glow bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-12 py-5 rounded-full font-extrabold text-2xl tracking-[0.08em] uppercase shadow-[0_12px_35px_rgba(124,58,237,0.35)] flex items-center gap-4 transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:-translate-y-[1px] active:scale-95">
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500" />
          <span className="relative z-10">Tap to Start</span>
          <ChevronRight size={28} strokeWidth={4} className="relative z-10 transition-transform group-hover:translate-x-1" />
        </button>
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.22em]">
          © 2026 LUCKY BOBA • PREMIUM SERIES
        </p>
      </div>
    </div>
  );

    const OrderTypeView = () => (
    <div
      className="flex-1 flex flex-col p-8 animate-scale-in relative overflow-hidden kiosk-menu-shell"
      style={{
        background: 'linear-gradient(145deg, #faf7ff 0%, #f2ecff 40%, #fff4fb 72%, #fff8ec 100%)'
      }}
    >
      {/* Decorative BG */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[110px] translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-8%] w-[420px] h-[420px] bg-fuchsia-400/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[30%] left-[46%] w-[280px] h-[280px] bg-amber-300/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full flex shrink-0 relative z-10">
         <button className="glass px-4 py-2 rounded-full flex items-center gap-2 text-zinc-500 font-black uppercase text-xs hover:bg-white transition-all shadow-sm active:scale-95" onClick={() => setStep('splash')}>
           <ChevronRight className="rotate-180" size={16} strokeWidth={3} />
           <span>Restart</span>
         </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 w-full max-w-4xl mx-auto relative z-10">
        <div className="text-center space-y-2">
           <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase">How will you enjoy your Boba?</h2>
           <p className="text-sm font-bold text-zinc-400 uppercase tracking-[0.2em]">Select your dining preference</p>
        </div>

        <div className="flex gap-8 w-full justify-center">
          {[
            { id: 'dine_in', label: 'Eat Here', icon: (
              <svg viewBox="0 0 24 24" className="w-14 h-14" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
              </svg>
            )},
            { id: 'take_out', label: 'Take Out', icon: (
              <svg viewBox="0 0 24 24" className="w-14 h-14" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            )}
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setOrderType(type.id as 'dine_in' | 'take_out')}
              className={`group w-[280px] aspect-[4/5] rounded-[2.5rem] shadow-xl border-2 flex flex-col items-center justify-center gap-6 transition-all duration-500 active:scale-95 relative overflow-hidden ${
                orderType === type.id
                  ? 'bg-white border-violet-500 -translate-y-2 shadow-2xl ring-4 ring-violet-100'
                  : 'bg-white/90 border-zinc-100 hover:border-violet-400 hover:-translate-y-2 hover:shadow-2xl'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br transition-opacity ${
                orderType === type.id
                  ? 'from-violet-600/10 via-fuchsia-400/5 to-amber-300/10 opacity-100'
                  : 'from-violet-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100'
              }`} />
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-inner ${
                orderType === type.id
                  ? 'bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white rotate-3'
                  : 'bg-zinc-50 text-zinc-500 group-hover:bg-gradient-to-br group-hover:from-violet-600 group-hover:to-fuchsia-500 group-hover:text-white group-hover:rotate-3'
              }`}>
                {type.icon}
              </div>
              <span className="text-2xl font-black text-zinc-900 uppercase tracking-tight">{type.label}</span>
              <div className={`flex gap-1.5 transition-all transform ${
                orderType === type.id
                  ? 'text-violet-700 opacity-100 translate-y-0'
                  : 'text-violet-600 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {orderType === type.id ? 'Selected' : 'Tap to Select'}
                </span>
                <ChevronRight size={14} strokeWidth={3} />
              </div>
            </button>
          ))}
        </div>

        {orderType ? (
          <div className="flex flex-col items-center gap-3 animate-fade-up">
            <button
              onClick={() => setStep('menu')}
              className="group px-14 py-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-black text-lg uppercase tracking-[0.08em] shadow-[0_12px_35px_rgba(124,58,237,0.35)] flex items-center gap-2.5 hover:from-violet-500 hover:to-fuchsia-500 hover:-translate-y-[1px] transition-all active:scale-95"
            >
              Continue
              <ChevronRight size={20} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
            </button>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500 font-bold">
              Selected: {orderType === 'dine_in' ? 'Eat Here' : 'Take Out'}
            </p>
          </div>
        ) : (
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400 font-bold">
            Tap a card to continue
          </p>
        )}
      </div>
    </div>
  );


        const MenuView = () => {
    return (
      <div
        className="flex-1 flex overflow-hidden relative"
        style={{
          background: 'linear-gradient(145deg, #faf7ff 0%, #f2ecff 40%, #fff4fb 72%, #fff8ec 100%)'
        }}
      >
        <div className="absolute top-[-8%] right-[-6%] w-[360px] h-[360px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[28%] w-[300px] h-[300px] bg-fuchsia-400/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-[32%] left-[48%] w-[220px] h-[220px] bg-amber-300/10 rounded-full blur-[90px] pointer-events-none" />
        {/* Sidebar — fixed at 220px for 1024-wide screens */}
        <div className="w-[220px] bg-zinc-50 border-r border-zinc-200 flex flex-col overflow-y-auto scrollbar-hide z-20 shrink-0">
          <div className="p-4 pb-4 flex flex-col items-center bg-zinc-50/50 border-b border-zinc-200/60">
            <img
              src={logo}
              alt="Lucky Boba"
              className="w-20 h-auto cursor-pointer hover:opacity-80 transition-opacity drop-shadow-md"
              onClick={handleLogoClick}
            />
          </div>
          
          <div className="flex-1 p-2 space-y-1">
            <button
              onClick={() => {
                setActiveCategory('');
                setSearchQuery('');
              }}
              className="w-full transition-all group"
            >
              <div className={`w-full px-4 py-3 rounded-xl text-left transition-all flex items-center justify-between ${activeCategory === '' && searchQuery === ''
                  ? 'bg-white font-bold shadow-sm border border-zinc-200'
                  : 'text-zinc-500 font-semibold hover:bg-zinc-100/50 hover:text-zinc-900 border border-transparent'
                }`}>
                <span className={`text-sm tracking-tight ${activeCategory === '' && searchQuery === ''
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500'
                  : 'text-zinc-500'
                }`}>
                  All Menu
                </span>
              </div>
            </button>
            
            {categories.map((cat: string) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setSearchQuery('');
                }}
                className="w-full transition-all group"
              >
                <div className={`w-full px-4 py-3 rounded-xl text-left transition-all flex items-center justify-between ${activeCategory === cat
                    ? 'bg-white font-bold shadow-sm border border-zinc-200'
                    : 'text-zinc-500 font-semibold hover:bg-zinc-100/50 hover:text-zinc-900 border border-transparent'
                  }`}>
                  <span className={`text-sm tracking-tight capitalize truncate pr-2 ${activeCategory === cat
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500'
                    : 'text-zinc-500'
                  }`}>
                    {cat}
                  </span>
                </div>
              </button>
            ))}
          </div>
          
          <button onClick={() => setStep('splash')} className="m-3 mt-auto py-3 bg-zinc-200/50 border border-zinc-200/50 rounded-xl text-zinc-500 font-bold text-sm hover:bg-zinc-200 hover:text-zinc-800 transition-all flex items-center justify-center gap-1.5">
            <ChevronRight className="rotate-180" size={18} />
            Cancel Order
          </button>
        </div>

        {/* Main Products Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-transparent">
          {/* Header Banners */}
          <div className="h-16 px-4 border-b border-zinc-200 flex items-center justify-between bg-white shrink-0 shadow-sm z-10 gap-3">
            <h2 className="text-xl font-black text-zinc-900 tracking-tight capitalize shrink-0">
              {searchQuery ? 'Search Results' : (activeCategory || 'All Menu')}
            </h2>
            <div className="relative flex-1 max-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="Find a drink..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeCategory) setActiveCategory('');
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-full py-2.5 pl-9 pr-4 text-sm font-bold placeholder:text-zinc-400 focus:bg-white focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all outline-none text-zinc-900"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 scroll-smooth">
            <div className="grid grid-cols-3 gap-3">
              {items
                .filter((item: MenuItem) => {
                  const matchesSearch = searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesCategory = activeCategory === '' || item.category === activeCategory || (!item.category && activeCategory === 'Others');
                  return matchesSearch && matchesCategory;
                })
                .map((item: MenuItem) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="bg-white rounded-2xl shadow-sm border border-zinc-200/60 overflow-hidden flex flex-col active:scale-95 transition-all cursor-pointer group hover:shadow-md relative"
                  >
                    <div className="w-full aspect-[4/3] bg-zinc-50 relative flex items-center justify-center">
                      {item.image ? (
                        <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <ShoppingBag size={32} className="text-zinc-200" />
                      )}
                    </div>
                    
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="font-bold text-xs text-zinc-900 leading-tight mb-1 h-8 overflow-hidden line-clamp-2 uppercase">
                        {item.name}
                      </h3>
                      
                      <div className="flex items-center justify-between mt-auto pt-1">
                        <div className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500 font-black text-base tracking-tight">
                          ₱{Number(item.sellingPrice).toFixed(0)}
                        </div>
                        <div className="w-7 h-7 bg-zinc-100 text-zinc-600 group-hover:bg-violet-600 group-hover:text-white rounded-full flex items-center justify-center transition-colors">
                          <Plus size={14} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {items.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center py-20 opacity-40">
                <Search size={64} className="mb-6 text-zinc-300" />
                <p className="font-bold tracking-wide text-2xl text-center text-zinc-500">No items found</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart — fixed 260px wide to stay compact */}
        <div className="w-[260px] bg-white flex flex-col shadow-xl z-20 border-l border-zinc-200 shrink-0">
          <div className="h-16 px-4 border-b border-zinc-100 flex items-center justify-between bg-white relative z-20 shrink-0 shadow-sm">
            <h2 className="text-base font-black text-zinc-900 tracking-tight uppercase">Your Tray</h2>
            <div className="bg-violet-50 border border-violet-100 text-violet-700 px-3 py-1.5 rounded-lg font-black text-sm flex items-center gap-1.5 shadow-sm">
              <ShoppingBag size={14} strokeWidth={2.5}/>
              <span>{cart.reduce((s: number, i: CartItem) => s + i.qty, 0)}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <ShoppingBag size={40} className="mb-3 text-zinc-300" />
                <p className="font-bold uppercase tracking-widest text-xs text-zinc-500">Tray is empty</p>
              </div>
            ) : (
              cart.map((item: CartItem) => (
                <div key={item.uniqueId} className="flex gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl relative shadow-sm">
                  <button onClick={() => removeFromCart(item.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-zinc-200 text-zinc-500 rounded-full flex items-center justify-center shadow-sm hover:bg-zinc-100 hover:text-red-500 transition-colors">
                     <X size={12} strokeWidth={3} />
                  </button>
                  <div className="w-14 h-14 bg-white rounded-lg overflow-hidden shrink-0 border border-zinc-100 shadow-sm flex items-center justify-center">
                    {item.image ? <img src={getImageUrl(item.image)} className="w-full h-full object-cover" /> : <ShoppingBag size={16} className="text-zinc-200" />}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h4 className="font-bold text-zinc-900 text-[11px] leading-tight uppercase line-clamp-2">{item.name}</h4>
                    <div className="flex flex-col gap-0.5 mt-0.5 mb-1">
                       {item.selectedSugarLevel && <p className="text-[9px] font-bold text-violet-600 uppercase">Sugar: {item.selectedSugarLevel}</p>}
                       {item.selectedAddOns && item.selectedAddOns.length > 0 && <p className="text-[9px] font-bold text-zinc-500 uppercase truncate">+{item.selectedAddOns.map(a=>a.name).join(', ')}</p>}
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500 text-sm tracking-tight">₱{(item.itemTotal * item.qty).toFixed(0)}</span>
                      <div className="flex items-center bg-white rounded-full border border-zinc-200 shadow-sm">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 rounded-l-full"><Minus size={10} strokeWidth={3}/></button>
                        <span className="w-5 text-center font-black text-xs text-zinc-900">{item.qty}</span>
                        <button onClick={() => addToCart(item, item.selectedAddOns, item.selectedSugarLevel)} className="w-6 h-6 flex items-center justify-center text-white bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-500 rounded-full transition-all"><Plus size={10} strokeWidth={3}/></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-zinc-200 bg-white space-y-3 relative z-20 shrink-0 shadow-[0_-4px_20px_rgb(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-bold uppercase tracking-wider text-xs">Amount Due</span>
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-fuchsia-500 tracking-tighter">₱{calculateTotal().toFixed(0)}</div>
            </div>
            
            <button
               onClick={handleSubmit}
               disabled={cart.length === 0 || loading}
               className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-black uppercase text-base tracking-wide shadow-[0_10px_30px_rgba(124,58,237,0.35)] active:scale-95 hover:from-violet-500 hover:to-fuchsia-500 hover:-translate-y-[1px] transition-all disabled:opacity-50 disabled:bg-zinc-300 disabled:bg-none disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
               {loading ? 'Processing...' : 'Checkout'}
               {!loading && <ChevronRight size={20} strokeWidth={4}/>}
            </button>

            <button onClick={handleReset} disabled={cart.length === 0} className="w-full py-2 text-center font-bold text-zinc-400 uppercase tracking-widest text-[10px] hover:text-zinc-800 hover:bg-zinc-50 rounded-lg transition-colors disabled:opacity-0 active:scale-95">
              Clear Order
            </button>
          </div>
        </div>

        {/* Customization Modal */}
        {showCustomizer && customizingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-zinc-900/60">
            <div className="absolute inset-0" onClick={() => setShowCustomizer(false)} />
            <div className="relative bg-zinc-50 w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              
              <div className="p-8 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100 flex items-center justify-center shadow-inner">
                    {customizingItem.image ? (
                      <img src={getImageUrl(customizingItem.image)} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag size={32} className="text-zinc-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-zinc-900 tracking-tight uppercase line-clamp-1">{customizingItem.name}</h3>
                    <div className="inline-block px-3 py-1 bg-violet-50 border border-violet-100 text-violet-700 rounded-lg text-sm font-bold uppercase tracking-widest mt-2">{customizingItem.category}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomizer(false)}
                  className="w-14 h-14 bg-white border border-zinc-200 text-zinc-500 rounded-full flex items-center justify-center hover:bg-zinc-50 hover:text-zinc-900 transition-colors shrink-0 shadow-sm"
                >
                  <X size={28} strokeWidth={3}/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
                {(customizingItem.category?.toLowerCase().includes('milk tea') ||
                  customizingItem.category?.toLowerCase().includes('milktea')) && sugarLevels.length > 0 && (
                    <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center font-black text-lg shrink-0">1</div>
                        <h4 className="font-black text-zinc-900 text-2xl tracking-tight uppercase">Select Sugar</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {sugarLevels.map((sl) => (
                          <button
                            key={sl.id}
                            onClick={() => setSelectedSugarLevel(sl.value)}
                            className={`py-5 rounded-2xl font-bold text-lg transition-all border-4 ${selectedSugarLevel === sl.value
                                ? 'bg-violet-50 border-violet-600 text-violet-800 scale-105 shadow-md'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'
                              }`}
                          >
                            {sl.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-zinc-100 text-zinc-700 rounded-full flex items-center justify-center font-black text-lg shrink-0 border border-zinc-200">
                      {((customizingItem.category?.toLowerCase().includes('milk') || customizingItem.category?.toLowerCase().includes('milktea')) && sugarLevels.length > 0) ? '2' : '1'}
                    </div>
                    <h4 className="font-black text-zinc-900 text-2xl tracking-tight uppercase">Add Toppings</h4>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                            className={`p-5 rounded-2xl border-4 flex flex-col transition-all text-left ${isSelected
                                ? 'border-violet-600 bg-violet-50 scale-[1.02] shadow-md'
                                : 'border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300'
                              }`}
                          >
                            <div className="flex justify-between items-start mb-2 w-full">
                               <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm transition-colors ${isSelected ? 'border-violet-600 bg-violet-600 text-white' : 'border-zinc-300 bg-zinc-50'}`}>
                                  {isSelected && <CheckCircle2 size={20} strokeWidth={3}/>}
                               </div>
                               <span className={`font-black text-xl ${isSelected ? 'text-violet-700' : 'text-zinc-500'}`}>
                                  +₱{Number(ao.price).toFixed(0)}
                               </span>
                            </div>
                            <span className={`font-bold text-lg leading-tight uppercase ${isSelected ? 'text-violet-900' : 'text-zinc-700'}`}>
                              {ao.name}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-zinc-200 bg-white flex items-center justify-between shrink-0 shadow-[0_-10px_30px_rgb(0,0,0,0.03)] z-10">
                <div>
                  <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-1">Total</p>
                  <div className="text-4xl font-black text-zinc-900 tracking-tighter">
                    ₱{(
                      Number(customizingItem.sellingPrice) +
                      selectedAddOns.reduce((sum, a) => sum + Number(a.price), 0)
                    ).toFixed(0)}
                  </div>
                </div>
                <button
                  onClick={confirmCustomization}
                  className="bg-violet-600 text-white px-12 py-6 rounded-2xl font-black uppercase tracking-wider text-xl flex items-center gap-3 hover:bg-violet-700 transition-all shadow-[0_8px_20px_rgb(124,58,237,0.3)] hover:shadow-[0_12px_25px_rgb(124,58,237,0.4)] hover:-translate-y-[1px] active:scale-95"
                >
                  <span>Add to Tray</span>
                  <Plus size={24} strokeWidth={3}/>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


      const ConfirmView = () => (
    <div className="flex-1 flex flex-col p-12 animate-in fade-in zoom-in-95 duration-500 bg-zinc-50 overflow-y-auto relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-12 max-w-2xl mx-auto w-full relative z-10">
        
        <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.4)] animate-bounce relative">
          <div className="absolute inset-0 border-4 border-emerald-400 rounded-full animate-ping opacity-50"></div>
          <CheckCircle2 size={56} strokeWidth={3} className="relative z-10" />
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-5xl font-black text-zinc-900 tracking-tight uppercase">Order Received</h2>
          <p className="text-xl text-emerald-600 font-bold uppercase tracking-widest text-center">Please proceed to counter to pay</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] w-full shadow-2xl relative overflow-hidden flex flex-col items-center border border-zinc-200">
           {/* Receipt Zigzag */}
           <div className="absolute -bottom-4 left-0 right-0 max-w-full overflow-hidden flex transform scale-y-50">
             {[...Array(20)].map((_, i) => (
                <div key={i} className="w-8 h-8 bg-zinc-50 rotate-45 shrink-0 -ml-4" />
             ))}
           </div>
           
           <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm mb-2">Your Ticket Number</p>
           <div className="bg-zinc-50 px-10 py-6 rounded-2xl mb-8 border border-zinc-200 shadow-inner">
             <h3 className="text-7xl font-black text-violet-600 tracking-tighter" style={{ fontFamily: 'monospace' }}>
               #{orderNumber}
             </h3>
           </div>
           
           <div className="w-full flex items-center justify-between pt-6 border-t border-dashed border-zinc-300">
             <span className="text-zinc-500 font-bold uppercase">Total Due</span>
             <span className="text-3xl font-black text-zinc-900 tracking-tight">₱{calculateTotal().toFixed(0)}</span>
           </div>
        </div>

        <button
          onClick={handleReset}
          className="bg-zinc-900 hover:bg-violet-600 text-white px-16 py-6 rounded-full font-black uppercase text-2xl tracking-wider transition-all shadow-[0_12px_40px_rgba(24,24,27,0.2)] hover:shadow-[0_16px_50px_rgba(124,58,237,0.3)] hover:-translate-y-1 active:scale-95"
        >
          New Order
        </button>
      </div>
    </div>
  );



  const BranchSelectorView = () => {
    const filtered = allBranches.filter(b =>
      b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
      b.address?.toLowerCase().includes(branchSearch.toLowerCase())
    );

    return (
      <div className="flex-1 flex flex-col bg-zinc-50 p-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-100 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none opacity-40"></div>

        <div className="max-w-4xl mx-auto w-full flex flex-col h-full relative z-10">
          <div className="flex flex-col items-center mb-10 shrink-0">
            <img src={logo} alt="Lucky Boba" className="w-32 h-auto mb-6" />
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Kiosk Setup</h1>
            <p className="text-zinc-500 font-medium text-sm mt-2">Select the branch for this device</p>
          </div>

          <div className="mb-8 shrink-0 w-full max-w-xl mx-auto">
            <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-5 py-4 shadow-sm group focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-50 transition-all">
              <Search size={20} className="text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
              <input
                value={branchSearch}
                onChange={e => setBranchSearch(e.target.value)}
                className="flex-1 bg-transparent text-base font-medium text-zinc-900 outline-none placeholder:text-zinc-400"
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
                className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200/80 flex flex-col items-start text-left hover:border-violet-300 hover:shadow-md transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center gap-4 w-full mb-4">
                  <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 text-zinc-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:border-violet-600 group-hover:text-white transition-colors">
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 line-clamp-1 capitalize">{branch.name.toLowerCase()}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full mt-1">
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
                  <div className="flex items-center gap-1 text-xs font-semibold text-violet-600 opacity-0 transform translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <span>Select Branch</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-400">
                <Search size={40} className="mb-4 opacity-30 text-zinc-300" />
                <p className="font-semibold tracking-wide text-sm">No branches found matching your search</p>
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
        <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center print:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-xl animate-in zoom-in-95 duration-200 border border-zinc-100">
            <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MapPin size={28} />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 text-center mb-2 tracking-tight">Confirm Branch</h2>
            <p className="text-zinc-500 text-sm text-center mb-6 font-medium">
              Set this kiosk to <strong className="text-zinc-800">{selectedBranchToConfirm.name}</strong>? This will bind the device to this location.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedBranchToConfirm(null)}
                className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-semibold tracking-wide text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBranchSelection}
                className="flex-1 py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold tracking-wide text-sm shadow-[0_4px_14px_0_rgb(124,58,237,0.39)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.23)] active:scale-[0.98] transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Security PIN Modal */}
      {isPinModalOpen && (
        <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center print:hidden p-6 animate-in fade-in duration-200">
          <div className={`bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl transition-all duration-300 border border-zinc-100 ${pinError ? 'animate-shake' : ''}`}>
            <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock size={32} />
            </div>

            <h2 className="text-xl font-bold text-zinc-900 text-center mb-2 tracking-tight">Access Control</h2>
            <p className="text-zinc-500 text-sm text-center mb-8 font-medium">
              Enter Admin Security PIN to reset Kiosk settings.
            </p>

            {/* PIN Dots */}
            <div className="flex justify-center gap-4 mb-8">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${pinInput.length > i
                      ? 'bg-violet-600 scale-110'
                      : 'bg-zinc-200'
                    }`}
                />
              ))}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    if (pinInput.length < 4) {
                      const newPin = pinInput + num;
                      setPinInput(newPin);
                      if (newPin.length === 4) {
                        if (newPin === '1234') {
                          localStorage.removeItem('kiosk_branch_id');
                          window.location.reload();
                        } else {
                          setPinError(true);
                          setTimeout(() => {
                            setPinError(false);
                            setPinInput('');
                          }, 600);
                        }
                      }
                    }
                  }}
                  className="h-14 rounded-xl bg-zinc-50 text-lg font-bold text-zinc-800 hover:bg-violet-50 hover:text-violet-600 active:scale-95 transition-all outline-none border border-zinc-100"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setPinInput('')}
                className="h-14 rounded-xl bg-zinc-50 text-sm font-semibold text-zinc-500 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all outline-none border border-zinc-100"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  if (pinInput.length < 4) {
                    const newPin = pinInput + '0';
                    setPinInput(newPin);
                    if (newPin.length === 4) {
                      if (newPin === '1234') {
                        localStorage.removeItem('kiosk_branch_id');
                        window.location.reload();
                      } else {
                        setPinError(true);
                        setTimeout(() => {
                          setPinError(false);
                          setPinInput('');
                        }, 600);
                      }
                    }
                  }
                }}
                className="h-14 rounded-xl bg-zinc-50 text-lg font-bold text-zinc-800 hover:bg-violet-50 hover:text-violet-600 active:scale-95 transition-all outline-none border border-zinc-100"
              >
                0
              </button>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="h-14 rounded-xl bg-zinc-50 text-sm font-semibold text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 active:scale-95 transition-all outline-none border border-zinc-100"
              >
                Exit
              </button>
            </div>

            {pinError ? (
              <p className="text-red-500 text-sm font-semibold text-center tracking-wide animate-pulse h-5">
                Incorrect PIN
              </p>
            ) : (
              <div className="h-5" />
            )}
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm z-[110] flex items-center justify-center print:hidden animate-in fade-in duration-200 px-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-auto shadow-xl animate-in zoom-in-95 duration-200 border border-zinc-100">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <X size={32} strokeWidth={3} />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 text-center mb-2 tracking-tight">Order Failed</h2>
            <p className="text-zinc-500 text-sm text-center mb-8 font-medium leading-relaxed">
              {errorMessage || 'Failed to place order. Please call staff for assistance.'}
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold tracking-wide text-sm transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] active:scale-[0.98]"
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
