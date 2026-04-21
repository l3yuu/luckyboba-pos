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
  Globe,
  HelpCircle,
  Check,
} from 'lucide-react';
import { KioskTicketPrint } from '../../components/Cashier/SalesOrderComponents/print';
import { getImageUrl } from '../../utils/imageUtils';
import { generateORNumber } from '../../components/Cashier/SalesOrderComponents/shared';

// --- Types ---

interface MenuItem {
  id: number;
  name: string;
  category: string;
  category_type?: string;
  category_id?: number;
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
  selectedOptions?: string[];
  remarks?: string;
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

  // --- Mix and Match State ---
  const [isMixMatchViewOpen, setIsMixMatchViewOpen] = useState(false);
  const [pendingMixMatchItem, setPendingMixMatchItem] = useState<MenuItem | null>(null);
  const [mixMatchDrinkPool, setMixMatchDrinkPool] = useState<MenuItem[]>([]);
  const [mixMatchStep, setMixMatchStep] = useState<'select_drink' | 'customize_drink'>('select_drink');
  const [selectedMixMatchDrink, setSelectedMixMatchDrink] = useState<MenuItem | null>(null);
  const [mixMatchSugar, setMixMatchSugar] = useState('100%');
  const [mixMatchOptions, setMixMatchOptions] = useState<string[]>([]);
  const [mixMatchAddOns, setMixMatchAddOns] = useState<AddOnOption[]>([]);

  const [printData, setPrintData] = useState<{
    invoice: string;
    cart: CartItem[];
    queueNumber?: string;
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

  // Cart Drawer State (floating overlay)
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Slideshow State for Landing Page
  const [currentSlide, setCurrentSlide] = useState(0);
  const splashSlides = [
    '/images/slideshow/lucky_classic.png',
    '/images/slideshow/hot_drinks.png',
    '/images/slideshow/iced_coffee.png',
    '/images/slideshow/fruit_juices.png',
    '/images/slideshow/frappe.png',
    '/images/slideshow/classicjr.png',
    '/images/slideshow/pudding.png',
  ];

  useEffect(() => {
    if (step === 'splash') {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % splashSlides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [step, splashSlides.length]);

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

  const triggerPinError = () => {
    setPinError(true);
    setTimeout(() => {
      setPinError(false);
      setPinInput('');
    }, 600);
  };

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
        triggerPinError();
      }
    } catch (_err) {
      triggerPinError();
    } finally {
      setLoading(false);
    }
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

  const fetchMixMatchPool = async (categoryId: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/category-drinks?category_id=${categoryId}`);
      interface DrinkPoolItem { menu_item_id: number; name: string; size: string; price: number }
      const pool: DrinkPoolItem[] = res.data.data ?? [];
      const transformedPool: MenuItem[] = pool.map(d => ({
        id: d.menu_item_id,
        name: d.name,
        sellingPrice: Number(d.price),
        size: d.size,
        category: "Mix & Match Drink",
        image: null,
      }));
      setMixMatchDrinkPool(transformedPool);
    } catch (err) {
      console.error("Failed to fetch mix and match drinks", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmMixAndMatch = () => {
    if (!pendingMixMatchItem || !selectedMixMatchDrink) return;

    const addonsTotal = mixMatchAddOns.reduce((sum, a) => sum + a.price, 0);
    const drinkDetails = [
      `Drink: ${selectedMixMatchDrink.name}${selectedMixMatchDrink.size ? ` (${selectedMixMatchDrink.size})` : ''}`,
      `Sugar: ${mixMatchSugar}`,
      ...mixMatchOptions,
      ...mixMatchAddOns.map(a => `+${a.name}`),
    ].join(' | ');

    const finalItem: CartItem = {
      ...pendingMixMatchItem,
      qty: 1,
      uniqueId: Math.random().toString(36).substr(2, 9),
      remarks: `[${drinkDetails}]`,
      itemTotal: Number(pendingMixMatchItem.sellingPrice) + addonsTotal,
      selectedAddOns: mixMatchAddOns,
      selectedSugarLevel: mixMatchSugar,
      selectedOptions: mixMatchOptions,
    };

    setCart(prev => [...prev, finalItem]);
    setIsMixMatchViewOpen(false);
    setPendingMixMatchItem(null);
    setSelectedMixMatchDrink(null);
    setMixMatchDrinkPool([]);
    setMixMatchStep('select_drink');
  };

  const mixMatchToggleOption = (opt: string) => {
    setMixMatchOptions(prev => {
      const iceOpts = ['NO ICE', '-ICE', '+ICE', 'WARM'];
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

  const handleItemClick = (item: MenuItem) => {
    if (item.category_type === 'mix_and_match') {
      setPendingMixMatchItem(item);
      setMixMatchStep('select_drink');
      setSelectedMixMatchDrink(null);
      setMixMatchOptions([]);
      setMixMatchAddOns([]);
      setMixMatchSugar('100%');
      setIsMixMatchViewOpen(true);
      if (item.category_id) {
        fetchMixMatchPool(item.category_id);
      }
      return;
    }

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

  const updateQty = (uniqueId: string, delta: number) => {
    setCart((prev: CartItem[]) => prev.map((i: CartItem) => i.uniqueId === uniqueId ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeFromCart = (uniqueId: string) => {
    setCart((prev: CartItem[]) => prev.filter((i: CartItem) => i.uniqueId !== uniqueId));
  };

  const calculateTotal = () => cart.reduce((sum: number, item: CartItem) => sum + (item.itemTotal * item.qty), 0);

  const handleSubmit = async () => {
    if (cart.length === 0 || !branchId) return;
    try {
      setLoading(true);

      let seq = 1;
      let nextQueue = 1;
      const todayKey = new Date().toISOString().split('T')[0];

      try {
        const { data } = await api.get(`/receipts/next-sequence?branch_id=${branchId}`);
        const serverSeq = parseInt(data.next_sequence, 10);
        const serverQueue = parseInt(data.next_queue, 10);

        if (!isNaN(serverSeq)) {
          seq = serverSeq;
          nextQueue = !isNaN(serverQueue) ? serverQueue : 1;

          // Sync local storage as well
          const seqKey = `last_or_sequence_${branchId}`;
          const queueKey = `last_queue_number_${branchId}`;
          const dateKey = `last_queue_date_${branchId}`;

          localStorage.setItem(seqKey, String(seq));
          localStorage.setItem(queueKey, String(nextQueue));
          localStorage.setItem(dateKey, todayKey);
        } else {
          throw new Error('Invalid sequence');
        }
      } catch {
        const seqKey = `last_or_sequence_${branchId}`;
        const queueKey = `last_queue_number_${branchId}`;
        const dateKey = `last_queue_date_${branchId}`;

        // Handle SI Sequence fallback
        seq = parseInt(localStorage.getItem(seqKey) || '0', 10) + 1;
        localStorage.setItem(seqKey, String(seq));

        // Handle Queue Number fallback with Daily Reset
        const lastDate = localStorage.getItem(dateKey);
        if (lastDate !== todayKey) {
          nextQueue = 1; // Reset for a new day
        } else {
          nextQueue = parseInt(localStorage.getItem(queueKey) || '0', 10) + 1;
        }
        localStorage.setItem(queueKey, String(nextQueue));
        localStorage.setItem(dateKey, todayKey);
      }

      const siNumber = generateORNumber(seq);

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
          remarks: item.remarks || '',
          add_ons: (item.selectedAddOns || []).map(ao => ({
            name: ao.name,
            price: ao.price
          })),
          size: item.size || 'Standard',
        }))
      };

      await api.post('/kiosk-sales', payload);

      const formattedQueue = String(nextQueue).padStart(3, '0');
      setOrderNumber(formattedQueue);
      setPrintData({
        invoice: siNumber,
        cart: [...cart],
        queueNumber: formattedQueue
      });
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
      className="flex-1 flex flex-col bg-[#fdf8ff] cursor-pointer relative overflow-hidden"
      onClick={() => setStep('order_type')}
    >
      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 h-20 px-12 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Lucky Boba" className="h-14 w-auto drop-shadow-sm" />
          <span className="text-3xl font-bold text-[#3b0764] tracking-tighter" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Lucky Boba</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-zinc-600 font-medium text-sm bg-white/70 backdrop-blur-md px-5 py-2.5 rounded-full border border-white shadow-sm">
            <Globe size={18} className="text-[#7c3aed]" />
            <span>English</span>
          </div>
          <div className="w-12 h-12 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
            <HelpCircle size={24} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center px-12 pt-20 pb-20 gap-12 relative z-10">
        {/* Left Content */}
        <div className="flex-[0.5] flex flex-col items-start gap-8 pl-6 animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="space-y-4">
            <h1 className="text-[4.8rem] font-bold text-[#2e0a4e] leading-[0.82] tracking-tighter uppercase whitespace-pre-line">
              Freshly<br />
              <span className="text-[#7c3aed] italic">Brewed</span><br />
              Happiness.
            </h1>
            <p className="text-lg text-zinc-400 font-medium uppercase tracking-[0.18em] max-w-md mt-6 leading-relaxed">
              Experience the ultimate boba journey
            </p>
          </div>

          <button className="group relative overflow-hidden bg-[#7c3aed] text-white pl-8 pr-4 py-3.5 rounded-[1.5rem] font-bold text-lg tracking-[0.12em] uppercase shadow-[0_15px_40px_rgba(124,58,237,0.3)] flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-95">
            <span className="relative z-10">Tap to Start</span>
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-[#7c3aed] group-hover:translate-x-1 transition-transform shadow-md relative z-10">
              <ChevronRight size={20} strokeWidth={4} />
            </div>
            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>
        </div>

        {/* Right Slideshow */}
        <div className="flex-[3] h-full relative flex items-center justify-center animate-in fade-in zoom-in duration-1000 delay-300">
          <div className="relative w-full aspect-[4/5] max-w-[1000px] overflow-hidden shadow-[0_60px_150px_rgba(88,28,135,0.18)] z-20">
            {splashSlides.map((slide, index) => (
              <div
                key={slide}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${index === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0'}`}
              >
                <img src={slide} alt="Slideshow" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* Background Decorations */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-purple-200/20 rounded-full blur-[120px] -z-10" />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-24 px-12 flex items-center justify-between z-50 border-t border-purple-50 bg-white/40 backdrop-blur-xl">
        <div className="flex gap-20">
          <div className="space-y-1.5">
            <p className="text-4xl font-bold text-[#3b0764] tracking-tighter">50+</p>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">Signature Flavors</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-4xl font-bold text-[#581c87] tracking-tighter">100%</p>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">Organic Tea Base</p>
          </div>
        </div>
        <div className="text-right space-y-2">
          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">Ordering hours: 10:00 AM - 10:00 PM</p>
          <div className="flex items-center justify-end gap-2 text-[#7c3aed]">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <p className="text-2xl font-bold uppercase tracking-tighter text-[#3b0764]">{branchName}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const OrderTypeView = () => (
    <div
      className="flex-1 flex flex-col relative overflow-hidden bg-[#fdf8ff]"
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-50/40 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4 pointer-events-none" />

      {/* Top Bar (Unified with Splash) */}
      <div className="h-20 px-12 flex items-center justify-between shrink-0 relative z-50">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Lucky Boba" className="h-14 w-auto drop-shadow-sm" />
          <span className="text-3xl font-bold text-[#3b0764] tracking-tighter" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Lucky Boba</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => setStep('splash')}
            className="flex items-center gap-2 text-zinc-500 font-medium text-sm bg-white/70 backdrop-blur-md px-6 py-2.5 rounded-full border border-white shadow-sm hover:bg-white transition-all active:scale-95"
          >
            <ChevronRight size={18} className="rotate-180 text-zinc-400" />
            <span>Restart</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center text-zinc-400 border border-white shadow-sm">
            <HelpCircle size={20} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 px-12 relative z-10 pt-4">
        <div className="text-center space-y-4 max-w-2xl animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-4xl font-bold text-[#2e0a4e] tracking-tighter uppercase leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            How will you enjoy<br />
            your <span className="text-[#7c3aed] italic">Boba?</span>
          </h2>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-[0.3em]">Select your dining preference</p>
        </div>

        <div className="flex gap-12 w-full justify-center max-w-6xl">
          {[
            {
              id: 'dine_in', label: 'Eat Here', icon: (
                <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                </svg>
              )
            },
            {
              id: 'take_out', label: 'Take Out', icon: <ShoppingBag size={52} strokeWidth={1.5} />
            }
          ].map((type, index) => (
            <button
              key={type.id}
              onClick={() => {
                setOrderType(type.id as 'dine_in' | 'take_out');
                setTimeout(() => setStep('menu'), 400);
              }}
              className={`group relative flex flex-col items-center justify-center gap-8 p-10 w-[290px] aspect-[4/5] rounded-[3rem] transition-all duration-500 animate-in fade-in zoom-in-95 duration-700`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Card Base */}
              <div className={`absolute inset-0 rounded-[3rem] transition-all duration-500 ${orderType === type.id
                ? 'bg-white shadow-[0_40px_100px_rgba(124,58,237,0.15)] ring-2 ring-[#7c3aed]/20'
                : 'bg-white/60 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.03)] group-hover:bg-white group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)]'
                }`} />

              {/* Icon Container */}
              <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${orderType === type.id
                ? 'bg-[#7c3aed] text-white shadow-[0_15px_30px_rgba(124,58,237,0.3)] scale-110'
                : 'bg-purple-50 text-zinc-400 group-hover:bg-purple-100 group-hover:text-[#7c3aed] group-hover:scale-105'
                }`}>
                {type.icon}
              </div>

              {/* Label */}
              <div className="relative z-10 text-center space-y-2">
                <span className={`block text-2xl font-bold tracking-tight uppercase transition-colors duration-300 ${orderType === type.id ? 'text-[#3b0764]' : 'text-zinc-600 group-hover:text-zinc-900'
                  }`}>
                  {type.label}
                </span>
                <div className={`h-1.5 w-8 mx-auto rounded-full transition-all duration-500 ${orderType === type.id ? 'bg-[#7c3aed] w-12' : 'bg-transparent'
                  }`} />
              </div>

              {/* Selected Indicator */}
              <div className={`absolute top-8 right-8 w-10 h-10 rounded-full bg-[#7c3aed] text-white flex items-center justify-center transition-all duration-500 ${orderType === type.id ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-45'
                }`}>
                <Check size={20} strokeWidth={4} />
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );

  const MenuView = () => {
    const displayItems = items.filter((item: MenuItem) => {
      if (isExpoMode && !expoItemIds.includes(item.id)) return false;
      const matchesSearch = searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === '' || item.category === activeCategory || (!item.category && activeCategory === 'Others');
      return matchesSearch && matchesCategory;
    });

    const featuredItems = items.filter((item: MenuItem) => {
      if (isExpoMode && !expoItemIds.includes(item.id)) return false;
      return true;
    }).slice(0, 2);

    const cartCount = cart.reduce((s: number, i: CartItem) => s + i.qty, 0);

    // Category icons map
    const getSizeLabel = (item: MenuItem) => {
      const s = item.size?.toLowerCase();
      const cat = item.category?.toLowerCase() || '';
      const isJunior = cat.includes('jr') || cat.includes('junior');
      let displaySize: string | null = null;
      if (isJunior && (!s || s === 'none')) displaySize = 'JR';
      else if (s === 'l') displaySize = 'SL';
      else if (s === 'm') displaySize = 'SM';
      else if (s && !['none'].includes(s)) displaySize = s.toUpperCase();
      const allowed = ['SL', 'SM', 'PCM', 'PCL', 'UL', 'UM', 'JR'];
      return displaySize && allowed.includes(displaySize) ? displaySize : null;
    };

    return (
      <div
        className="flex-1 flex overflow-hidden relative"
        style={{ background: 'linear-gradient(145deg, #fef9f3 0%, #faf5ff 35%, #fff5ee 65%, #fef7f0 100%)' }}
      >
        {/* Decorative BG Orbs */}
        <div className="absolute top-[-8%] right-[-6%] w-[400px] h-[400px] bg-orange-300/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[30%] w-[350px] h-[350px] bg-purple-400/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[40%] right-[20%] w-[250px] h-[250px] bg-amber-200/10 rounded-full blur-[100px] pointer-events-none" />

        {/* ─── Left Sidebar ──────────────────────────────── */}
        <div className="w-[190px] bg-white/80 backdrop-blur-md border-r border-purple-100/60 flex flex-col z-20 shrink-0">
          {/* Logo */}
          <div className="p-4 pb-3 flex flex-col items-center border-b border-purple-50">
            <img
              src={logo}
              alt="Lucky Boba"
              className="w-16 h-auto cursor-pointer hover:opacity-80 transition-opacity drop-shadow-sm"
              onClick={handleLogoClick}
            />
          </div>

          {/* Category Header */}
          <div className="px-5 pt-5 pb-2">
            <h3 className="text-base font-black text-[#7c14d4] tracking-tight">Categories</h3>
            <p className="text-[10px] font-semibold text-zinc-400 tracking-wide">Pick your vibe</p>
          </div>

          {/* Category List */}
          <div className="flex-1 px-3 pb-3 space-y-1 overflow-y-auto scrollbar-hide">
            <button
              onClick={() => { setActiveCategory(''); setSearchQuery(''); }}
              className={`w-full px-3 py-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 ${activeCategory === '' && searchQuery === ''
                ? 'bg-[#7c14d4] text-white font-bold shadow-lg shadow-purple-200'
                : 'text-zinc-500 font-semibold hover:bg-purple-50 hover:text-[#7c14d4]'
                }`}
            >
              <span className="text-sm truncate">All Menu</span>
            </button>

            {categories.map((cat: string) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setSearchQuery(''); }}
                className={`w-full px-3 py-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 ${activeCategory === cat
                  ? 'bg-[#7c14d4] text-white font-bold shadow-lg shadow-purple-200'
                  : 'text-zinc-500 font-semibold hover:bg-purple-50 hover:text-[#7c14d4]'
                  }`}
              >
                <span className="text-sm truncate capitalize">{cat}</span>
              </button>
            ))}
          </div>

          {/* Cancel Order */}
          <button
            onClick={() => setStep('splash')}
            className="m-3 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-500 font-bold text-xs hover:bg-zinc-200 hover:text-zinc-800 transition-all flex items-center justify-center gap-1.5"
          >
            <ChevronRight className="rotate-180" size={16} />
            Cancel Order
          </button>
        </div>

        {/* ─── Main Content ──────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Top Nav */}
          <div className="h-[60px] px-5 flex items-center justify-between bg-white/70 backdrop-blur-md border-b border-purple-100/40 shrink-0 z-10">

            {/* Search */}
            <div className="relative flex-1 max-w-[320px] mx-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
              <input
                type="text"
                placeholder="Search beverages..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (activeCategory) setActiveCategory(''); }}
                className="w-full bg-white/80 border border-purple-100 rounded-full py-2.5 pl-11 pr-4 text-sm font-semibold placeholder:text-zinc-400 focus:bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-300 transition-all outline-none text-zinc-800 shadow-sm"
              />
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCartDrawer(!showCartDrawer)}
                className="relative w-10 h-10 bg-white border border-purple-100 rounded-full flex items-center justify-center hover:bg-purple-50 transition-colors shadow-sm"
              >
                <ShoppingBag size={18} className="text-[#7c14d4]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scroll-smooth">
            <div className="p-5 pb-32 space-y-6">

              {/* ── Hero Section ──────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1
                      className="text-4xl font-bold text-zinc-800 leading-[1.1]"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                      Pick Your<br />
                      <span
                        className="italic text-[#7c14d4]"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      >
                        Happiness
                      </span>
                    </h1>
                    <p className="text-sm text-zinc-400 font-medium mt-2 max-w-[300px]">
                      The perfect blend of flavor and joy, crafted just for your afternoon boost.
                    </p>
                  </div>
                </div>

                {/* Featured Cards */}
                {featuredItems.length >= 2 && !searchQuery && !activeCategory && (
                  <div className="grid grid-cols-[2fr_1fr] gap-4">
                    {/* Main Featured */}
                    <div
                      className="relative rounded-3xl overflow-hidden h-[280px] cursor-pointer group shadow-xl"
                      onClick={() => handleItemClick(featuredItems[0])}
                    >
                      {featuredItems[0].image ? (
                        <img
                          src={getImageUrl(featuredItems[0].image)}
                          alt={featuredItems[0].name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                          <ShoppingBag size={64} className="text-orange-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-6">
                        <div className="flex gap-2 mb-2">
                          <span className="px-3 py-1 bg-[#7c14d4] text-white text-[9px] font-black uppercase tracking-widest rounded-lg">Bestseller</span>
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest rounded-lg">{featuredItems[0].category}</span>
                        </div>
                        <h3
                          className="text-2xl font-bold text-white mb-1"
                          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                          {featuredItems[0].name}
                        </h3>
                        <p className="text-white/60 text-xs font-medium mb-3">Freshly crafted with premium ingredients.</p>
                        <button className="px-5 py-2.5 bg-white text-orange-600 rounded-full font-bold text-sm hover:bg-orange-50 transition-colors shadow-lg flex items-center gap-2 active:scale-95">
                          Quick Add – ₱{Number(featuredItems[0].sellingPrice).toFixed(0)}
                        </button>
                      </div>
                    </div>

                    {/* Side Featured */}
                    <div
                      className="relative rounded-3xl overflow-hidden h-[280px] cursor-pointer group shadow-lg"
                      onClick={() => handleItemClick(featuredItems[1])}
                    >
                      {featuredItems[1].image ? (
                        <img
                          src={getImageUrl(featuredItems[1].image)}
                          alt={featuredItems[1].name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-fuchsia-100 flex items-center justify-center">
                          <ShoppingBag size={48} className="text-purple-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-5">
                        <h3
                          className="text-xl font-bold text-white mb-1"
                          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                          {featuredItems[1].name}
                        </h3>
                        <p className="text-white/60 text-xs font-medium">₱{Number(featuredItems[1].sellingPrice).toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Product Grid ──────────────────────── */}
              <div>
                <h2
                  className="text-xl font-bold text-zinc-800 mb-4"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {searchQuery ? 'Search Results' : activeCategory ? activeCategory : 'Recommended for You'}
                </h2>
                <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayItems.map((item: MenuItem) => {
                    const sizeLabel = getSizeLabel(item);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="bg-white rounded-2xl shadow-sm border border-orange-100/40 overflow-hidden flex flex-col cursor-pointer group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 active:scale-[0.97]"
                      >
                        <div className="w-full aspect-[4/3] bg-gradient-to-br from-orange-50 to-amber-50 relative flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <ShoppingBag size={32} className="text-orange-200" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="p-3 flex flex-col flex-1">
                          <h3 className="font-bold text-xs text-zinc-800 leading-tight mb-1 h-8 overflow-hidden line-clamp-2">
                            {item.name}
                            {sizeLabel && <span className="text-[#7c14d4] ml-1 font-bold">({sizeLabel})</span>}
                          </h3>
                          <div className="flex items-center justify-between mt-auto pt-1.5">
                            <span className="text-orange-600 font-black text-base tracking-tight">
                              ₱{Number(item.sellingPrice).toFixed(0)}
                            </span>
                            <div className="w-7 h-7 bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                              <Plus size={14} strokeWidth={3} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {displayItems.length === 0 && !loading && (
                  <div className="py-20 flex flex-col items-center justify-center opacity-40">
                    <Search size={64} className="mb-6 text-zinc-300" />
                    <p className="font-bold tracking-wide text-xl text-center text-zinc-500">No items found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Floating Cart Drawer ──────────────────────── */}
        {showCartDrawer && (
          <div className="fixed inset-0 z-[90] pointer-events-none">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto transition-opacity"
              onClick={() => setShowCartDrawer(false)}
            />

            {/* Drawer */}
            <div className="absolute bottom-4 right-4 w-[340px] max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-purple-100/50 flex flex-col pointer-events-auto overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              {/* Header */}
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-[#7c14d4]" />
                  <h2 className="text-base font-black text-zinc-900">My Order ({cartCount})</h2>
                </div>
                <button
                  onClick={() => setShowCartDrawer(false)}
                  className="w-7 h-7 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors"
                >
                  <X size={14} strokeWidth={3} className="text-zinc-500" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                {cart.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center opacity-40">
                    <ShoppingBag size={40} className="mb-3 text-zinc-300" />
                    <p className="font-bold uppercase tracking-widest text-xs text-zinc-500">Your tray is empty</p>
                  </div>
                ) : (
                  cart.map((item: CartItem) => {
                    const sizeLabel = getSizeLabel(item);
                    return (
                      <div key={item.uniqueId} className="flex gap-3 p-3 bg-zinc-50/80 border border-zinc-100 rounded-xl relative group/item">
                        <button
                          onClick={() => removeFromCart(item.uniqueId)}
                          className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white border border-zinc-200 text-red-400 rounded-full flex items-center justify-center shadow-md hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all active:scale-95 z-20"
                        >
                          <X size={12} strokeWidth={4} />
                        </button>
                        <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0 border border-zinc-100 shadow-sm flex items-center justify-center">
                          {item.image ? <img src={getImageUrl(item.image)} className="w-full h-full object-cover" /> : <ShoppingBag size={14} className="text-zinc-200" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-zinc-800 text-xs leading-tight line-clamp-1">
                            {item.name}
                            {sizeLabel && <span className="text-[#7c14d4] ml-1">({sizeLabel})</span>}
                          </h4>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {item.selectedSugarLevel && <span className="text-[8px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{item.selectedSugarLevel} Sugar</span>}
                            {item.selectedAddOns && item.selectedAddOns.length > 0 && <span className="text-[8px] font-bold text-zinc-400">{item.selectedAddOns.map(a => a.name).join(' · ')}</span>}
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center bg-white rounded-full border border-zinc-200 shadow-sm">
                              <button onClick={() => updateQty(item.uniqueId, -1)} className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 rounded-l-full"><Minus size={10} strokeWidth={3} /></button>
                              <span className="w-5 text-center font-black text-[11px] text-zinc-800">{item.qty}</span>
                              <button onClick={() => updateQty(item.uniqueId, 1)} className="w-6 h-6 flex items-center justify-center text-white bg-gradient-to-r from-orange-400 to-amber-500 rounded-full"><Plus size={10} strokeWidth={3} /></button>
                            </div>
                            <span className="font-black text-orange-600 text-sm">₱{(item.itemTotal * item.qty).toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="p-4 border-t border-zinc-100 bg-white space-y-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-bold text-sm">Total Amount</span>
                    <span className="text-2xl font-black text-orange-600 tracking-tight">₱{calculateTotal().toFixed(0)}</span>
                  </div>
                  <button
                    onClick={() => { setShowCartDrawer(false); handleSubmit(); }}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black uppercase text-sm tracking-wider shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-amber-600 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? 'Processing...' : 'Checkout'}
                    {!loading && <ChevronRight size={18} strokeWidth={3} />}
                  </button>
                  <button
                    onClick={() => { setCart([]); setShowCartDrawer(false); }}
                    className="w-full py-2 text-center font-bold text-zinc-400 text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors"
                  >
                    Clear Order
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Floating Cart Pill (when drawer is closed & has items) ─── */}
        {!showCartDrawer && cartCount > 0 && (
          <button
            onClick={() => setShowCartDrawer(true)}
            className="fixed bottom-6 right-6 z-[80] bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3.5 rounded-full font-black text-sm uppercase tracking-wider shadow-xl shadow-orange-300/40 hover:from-orange-600 hover:to-amber-600 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300"
          >
            <ShoppingBag size={18} strokeWidth={2.5} />
            <span>{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
            <span className="w-px h-4 bg-white/30" />
            <span>₱{calculateTotal().toFixed(0)}</span>
          </button>
        )}

        {/* Mix and Match Overlay */}
        {isMixMatchViewOpen && pendingMixMatchItem && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-xl bg-zinc-900/60">
            <div className="absolute inset-0" onClick={() => setIsMixMatchViewOpen(false)} />
            <div className="relative bg-[#fdf8ff] w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300 border border-purple-100">

              {/* Header */}
              <div className="p-8 border-b border-purple-50 bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center shadow-inner">
                    <ShoppingBag size={32} className="text-[#7c14d4]" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-zinc-900 tracking-tight uppercase" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      {mixMatchStep === 'select_drink' ? 'Choose Your Drink' : 'Customize Drink'}
                    </h3>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-[0.2em]">
                      {mixMatchStep === 'select_drink' ? pendingMixMatchItem.name : selectedMixMatchDrink?.name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  {mixMatchStep === 'customize_drink' && (
                    <button
                      onClick={() => setMixMatchStep('select_drink')}
                      className="px-6 py-3 bg-white border border-purple-200 text-[#7c14d4] rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-purple-50 transition-all flex items-center gap-2"
                    >
                      <ChevronRight className="rotate-180" size={16} />
                      Back to Selection
                    </button>
                  )}
                  <button
                    onClick={() => setIsMixMatchViewOpen(false)}
                    className="w-14 h-14 bg-white border border-zinc-200 text-zinc-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                  >
                    <X size={28} strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                {mixMatchStep === 'select_drink' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {loading ? (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                        <p className="font-bold text-zinc-400 uppercase tracking-widest text-xs">Loading collection...</p>
                      </div>
                    ) : mixMatchDrinkPool.length === 0 ? (
                      <div className="col-span-full py-20 text-center">
                        <p className="text-zinc-400 font-bold">No drinks available for this bundle.</p>
                      </div>
                    ) : (
                      mixMatchDrinkPool.map((drink) => (
                        <div
                          key={drink.id}
                          onClick={() => {
                            setSelectedMixMatchDrink(drink);
                            setMixMatchStep('customize_drink');
                          }}
                          className="bg-white p-5 rounded-3xl border-2 border-purple-50 shadow-sm hover:border-purple-300 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col items-center text-center gap-4"
                        >
                          <div className="w-full aspect-square bg-gradient-to-br from-purple-50 to-orange-50 rounded-2xl flex items-center justify-center overflow-hidden">
                            <ShoppingBag size={48} className="text-purple-200 group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div>
                            <h4 className="font-black text-zinc-800 uppercase text-sm tracking-tight leading-tight mb-1">{drink.name}</h4>
                            {drink.size && <span className="text-[10px] font-black bg-purple-50 text-[#7c14d4] px-2 py-0.5 rounded-full">{drink.size}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-10 max-w-2xl mx-auto">
                    {/* Sugar Level */}
                    <div className="bg-white p-8 rounded-[2rem] border border-purple-50 shadow-sm">
                      <h4 className="font-black text-zinc-900 text-xl tracking-tight uppercase mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#7c14d4] text-white flex items-center justify-center text-sm shadow-md shadow-purple-200">1</span>
                        Select Sugar Level
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {sugarLevels.map((sl) => (
                          <button
                            key={sl.id}
                            onClick={() => setMixMatchSugar(sl.value)}
                            className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${mixMatchSugar === sl.value
                              ? 'bg-[#7c14d4] border-[#7c14d4] text-white shadow-lg shadow-purple-200'
                              : 'bg-white border-zinc-100 text-zinc-400 hover:border-purple-200 hover:text-purple-600'
                              }`}
                          >
                            {sl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Options (Ice/Pearl) */}
                    <div className="bg-white p-8 rounded-[2rem] border border-orange-50 shadow-sm">
                      <h4 className="font-black text-zinc-900 text-xl tracking-tight uppercase mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm shadow-md shadow-orange-200">2</span>
                        Drink Options
                      </h4>
                      <div className="space-y-8">
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Ice Level</p>
                          <div className="grid grid-cols-4 gap-3">
                            {['NO ICE', '-ICE', '+ICE', 'WARM'].map(opt => (
                              <button
                                key={opt}
                                onClick={() => mixMatchToggleOption(opt)}
                                className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${mixMatchOptions.includes(opt)
                                  ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200'
                                  : 'bg-white border-zinc-100 text-zinc-400 hover:border-orange-200 hover:text-orange-600'
                                  }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Pearl Preference</p>
                          <div className="grid grid-cols-2 gap-4">
                            {['NO PRL', 'W/ PRL'].map(opt => (
                              <button
                                key={opt}
                                onClick={() => mixMatchToggleOption(opt)}
                                className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${mixMatchOptions.includes(opt)
                                  ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200'
                                  : 'bg-white border-zinc-100 text-zinc-400 hover:border-orange-200 hover:text-orange-600'
                                  }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Add-ons */}
                    <div className="bg-white p-8 rounded-[2rem] border border-purple-50 shadow-sm">
                      <h4 className="font-black text-zinc-900 text-xl tracking-tight uppercase mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm shadow-md shadow-purple-200">3</span>
                        Extra Toppings
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {allAddOns
                          .filter(ao => ao.category === 'drink' || ao.category === 'Toppings')
                          .map((ao) => {
                            const isSelected = mixMatchAddOns.some(a => a.id === ao.id);
                            return (
                              <button
                                key={ao.id}
                                onClick={() => {
                                  setMixMatchAddOns(prev =>
                                    isSelected ? prev.filter(p => p.id !== ao.id) : [...prev, ao]
                                  );
                                }}
                                className={`p-4 rounded-2xl border-2 flex flex-col gap-1 transition-all ${isSelected
                                  ? 'border-purple-500 bg-purple-50 shadow-md'
                                  : 'border-zinc-100 bg-white hover:border-purple-200'
                                  }`}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span className={`text-[10px] font-black ${isSelected ? 'text-purple-600' : 'text-zinc-400'}`}>+₱{ao.price}</span>
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'bg-white border-zinc-200'}`}>
                                    {isSelected && <Check size={10} strokeWidth={4} />}
                                  </div>
                                </div>
                                <span className={`font-bold text-xs uppercase ${isSelected ? 'text-purple-900' : 'text-zinc-600'}`}>{ao.name}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-purple-50 bg-white flex items-center justify-between shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-10">
                <div className="flex items-center gap-8">
                  <div className="bg-zinc-50 px-6 py-4 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Bundle Total</p>
                    <p className="text-3xl font-black text-zinc-900 tracking-tighter">₱{pendingMixMatchItem.sellingPrice}</p>
                  </div>
                  {mixMatchStep === 'customize_drink' && mixMatchAddOns.reduce((s, a) => s + a.price, 0) > 0 && (
                    <div className="text-orange-600 font-bold">
                      <p className="text-[10px] uppercase tracking-widest mb-1">Add-ons</p>
                      <p className="text-xl">+₱{mixMatchAddOns.reduce((s, a) => s + a.price, 0)}</p>
                    </div>
                  )}
                </div>

                {mixMatchStep === 'customize_drink' && (
                  <button
                    onClick={confirmMixAndMatch}
                    className="bg-gradient-to-r from-[#7c14d4] to-purple-500 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-wider text-xl flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-purple-200"
                  >
                    Add to Tray
                    <Plus size={24} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customization Modal */}
        {showCustomizer && customizingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-zinc-900/55">
            <div className="absolute inset-0" onClick={() => setShowCustomizer(false)} />
            <div className="relative bg-gradient-to-br from-orange-50 to-purple-50 w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-orange-100/70">

              <div className="p-8 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl overflow-hidden border border-orange-100 flex items-center justify-center shadow-inner">
                    {customizingItem.image ? (
                      <img src={getImageUrl(customizingItem.image)} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag size={32} className="text-orange-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-zinc-900 tracking-tight uppercase line-clamp-1">{customizingItem.name}</h3>
                    <div className="inline-block px-3 py-1 bg-purple-50 border border-purple-200 text-[#7c14d4] rounded-lg text-sm font-bold uppercase tracking-widest mt-2">{customizingItem.category}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomizer(false)}
                  className="w-14 h-14 bg-white border border-zinc-200 text-zinc-500 rounded-full flex items-center justify-center hover:bg-zinc-50 hover:text-zinc-900 transition-colors shrink-0 shadow-sm"
                >
                  <X size={28} strokeWidth={3} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
                {(customizingItem.category?.toLowerCase().includes('milk tea') ||
                  customizingItem.category?.toLowerCase().includes('milktea')) && sugarLevels.length > 0 && (
                    <div className="bg-white/95 p-8 rounded-3xl border border-purple-100 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#7c14d4] to-purple-500 text-white rounded-full flex items-center justify-center font-black text-lg shrink-0">1</div>
                        <h4 className="font-black text-zinc-900 text-2xl tracking-tight uppercase">Select Sugar</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {sugarLevels.map((sl) => (
                          <button
                            key={sl.id}
                            onClick={() => setSelectedSugarLevel(sl.value)}
                            className={`py-5 rounded-2xl font-bold text-lg transition-all border-4 ${selectedSugarLevel === sl.value
                              ? 'bg-gradient-to-r from-[#7c14d4] to-purple-500 border-[#7c14d4] text-white scale-105 shadow-[0_12px_25px_rgba(124,20,212,0.3)]'
                              : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'
                              }`}
                          >
                            {sl.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="bg-white/95 p-8 rounded-3xl border border-orange-100 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full flex items-center justify-center font-black text-lg shrink-0 border border-orange-300/50">
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
                              ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 scale-[1.02] shadow-md'
                              : 'border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300'
                              }`}
                          >
                            <div className="flex justify-between items-start mb-2 w-full">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm transition-colors ${isSelected ? 'border-orange-500 bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'border-zinc-300 bg-zinc-50'}`}>
                                {isSelected && <CheckCircle2 size={20} strokeWidth={3} />}
                              </div>
                              <span className={`font-black text-xl ${isSelected ? 'text-orange-600' : 'text-zinc-500'}`}>
                                +₱{Number(ao.price).toFixed(0)}
                              </span>
                            </div>
                            <span className={`font-bold text-lg leading-tight uppercase ${isSelected ? 'text-orange-900' : 'text-zinc-700'}`}>
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
                  <div className="text-4xl font-black text-orange-600 tracking-tighter">
                    ₱{(
                      Number(customizingItem.sellingPrice) +
                      selectedAddOns.reduce((sum, a) => sum + Number(a.price), 0)
                    ).toFixed(0)}
                  </div>
                </div>
                <button
                  onClick={confirmCustomization}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-12 py-6 rounded-2xl font-black uppercase tracking-wider text-xl flex items-center gap-3 hover:from-orange-600 hover:to-amber-600 transition-all shadow-[0_8px_20px_rgba(234,88,12,0.3)] hover:shadow-[0_12px_25px_rgba(234,88,12,0.4)] hover:-translate-y-[1px] active:scale-95"
                >
                  <span>Add to Tray</span>
                  <Plus size={24} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  const ConfirmView = () => (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[#fdf8ff]">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-50/40 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4 pointer-events-none" />

      {/* Top Bar (Unified) */}
      <div className="h-20 px-12 flex items-center justify-between shrink-0 relative z-50">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Lucky Boba" className="h-12 w-auto drop-shadow-sm" />
          <span className="text-2xl font-bold text-[#3b0764] tracking-tighter" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Lucky Boba</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center text-zinc-400 border border-white shadow-sm">
            <HelpCircle size={20} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 px-12 relative z-10 py-12">
        <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(16,185,129,0.3)] animate-bounce relative shrink-0">
          <div className="absolute inset-0 border-4 border-emerald-400 rounded-full animate-ping opacity-50"></div>
          <CheckCircle2 size={48} strokeWidth={3} className="relative z-10" />
        </div>

        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-5xl font-bold text-[#2e0a4e] tracking-tighter uppercase leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Order <span className="text-[#7c3aed] italic">Received</span>
          </h2>
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-[0.2em]">Please proceed to counter to pay</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] w-full max-w-lg shadow-[0_40px_100px_rgba(0,0,0,0.08)] relative overflow-hidden flex flex-col items-center border border-purple-50/50 animate-in fade-in zoom-in-95 duration-1000 delay-300">
          <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-5">Your Ticket Number</p>

          <div className="bg-purple-50/50 px-12 py-8 rounded-[2.5rem] mb-10 border border-purple-100/50 shadow-inner w-full text-center">
            <h3 className="text-7xl font-bold text-[#7c3aed] tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>
              #{orderNumber}
            </h3>
          </div>

          <div className="w-full flex items-center justify-between pt-8 border-t border-dashed border-purple-100">
            <span className="text-zinc-400 font-bold uppercase text-xs tracking-widest">Total Due</span>
            <span className="text-4xl font-bold text-[#3b0764] tracking-tighter">₱{calculateTotal().toFixed(0)}</span>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="group relative overflow-hidden bg-[#7c3aed] text-white pl-12 pr-8 py-5 rounded-full font-bold text-xl tracking-[0.15em] uppercase shadow-[0_25px_60px_rgba(124,58,237,0.35)] flex items-center gap-8 transition-all hover:scale-[1.02] active:scale-95 mt-4"
        >
          <span className="relative z-10">New Order</span>
          <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-[#7c3aed] group-hover:translate-x-1 transition-transform shadow-md relative z-10">
            <ChevronRight size={24} strokeWidth={4} />
          </div>
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
      <div
        className="flex-1 flex flex-col p-10 overflow-hidden relative"
        style={{
          background: 'linear-gradient(145deg, #faf7ff 0%, #f2ecff 45%, #fff4fb 78%, #fff8ec 100%)'
        }}
      >
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-violet-500/12 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-6%] w-[420px] h-[420px] bg-fuchsia-400/12 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-[35%] left-[45%] w-[300px] h-[300px] bg-amber-300/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto w-full flex flex-col h-full relative z-10">
          <div className="flex flex-col items-center mb-10 shrink-0">
            <img src={logo} alt="Lucky Boba" className="w-32 h-auto mb-6 drop-shadow-sm" />
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Kiosk Setup</h1>
            <p className="text-zinc-500 font-semibold text-sm mt-2 uppercase tracking-[0.12em]">Select the branch for this device</p>
          </div>

          <div className="mb-8 shrink-0 w-full max-w-xl mx-auto">
            <div className="flex items-center gap-3 bg-white/95 border border-violet-200 rounded-2xl px-5 py-4 shadow-lg group focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100 transition-all backdrop-blur-sm">
              <Search size={20} className="text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
              <input
                value={branchSearch}
                onChange={e => setBranchSearch(e.target.value)}
                className="flex-1 bg-transparent text-base font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
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
                className={`p-6 rounded-2xl shadow-md border flex flex-col items-start text-left transition-all group active:scale-[0.98] backdrop-blur-sm ${selectedBranchToConfirm?.id === branch.id
                  ? 'bg-white border-violet-500 ring-4 ring-violet-100 shadow-xl -translate-y-[2px]'
                  : 'bg-white/95 border-zinc-200/80 hover:border-violet-300 hover:shadow-xl hover:-translate-y-[2px]'
                  }`}
              >
                <div className="flex items-center gap-4 w-full mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors border ${selectedBranchToConfirm?.id === branch.id
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 border-violet-500 text-white'
                    : 'bg-zinc-50 border-zinc-100 text-zinc-600 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-fuchsia-500 group-hover:border-violet-600 group-hover:text-white'
                    }`}>
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-900 line-clamp-1 capitalize">{branch.name.toLowerCase()}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">Active</span>
                      {selectedBranchToConfirm?.id === branch.id && (
                        <span className="text-[10px] font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-500 px-2 py-0.5 rounded uppercase tracking-wider">Selected</span>
                      )}
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
                  <div className={`flex items-center gap-1 text-xs font-semibold transition-all duration-300 ${selectedBranchToConfirm?.id === branch.id
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500 opacity-100 translate-x-0'
                    : 'text-violet-600 opacity-0 transform translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0'
                    }`}>
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
          queueNumber={printData.queueNumber || printData.invoice.slice(-4)}
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
                className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 text-white rounded-xl font-semibold tracking-wide text-sm shadow-[0_4px_14px_0_rgba(124,58,237,0.39)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.3)] active:scale-[0.98] transition-all"
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
                        handleVerifyPin(newPin);
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
                      handleVerifyPin(newPin);
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
                              {(() => {
                                const s = item.size?.toLowerCase();
                                const cat = item.category?.toLowerCase() || '';
                                const isJunior = cat.includes('jr') || cat.includes('junior');

                                let displaySize = null;
                                if (isJunior && (!s || s === 'none')) displaySize = 'jr';
                                else if (s === 'l') displaySize = 'sl';
                                else if (s === 'm') displaySize = 'sm';
                                else if (s && !['none'].includes(s)) displaySize = s;

                                const allowed = ['sl', 'sm', 'pcm', 'pcl', 'ul', 'um', 'jr'];
                                if (displaySize && allowed.includes(displaySize)) {
                                  return <span className="font-bold text-violet-400 capitalize ml-1">({displaySize})</span>;
                                }
                                return null;
                              })()}
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
