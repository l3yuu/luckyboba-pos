import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import KioskLayout from '../../components/Kiosk/KioskLayout';
import { 
  ShoppingBag, 
  ChevronRight, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Minus,
} from 'lucide-react';

// --- Types ---

interface MenuItem {
  id: number;
  name: string;
  category: string;
  sellingPrice: number;
  image: string | null;
}

interface CartItem extends MenuItem {
  qty: number;
  uniqueId: string;
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
  const [step, setStep] = useState<'splash' | 'menu' | 'confirm'>('splash');
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);

  // Auto-reset helper
  const handleReset = useCallback(() => {
    setStep('splash');
    setCart([]);
    setOrderNumber(null);
  }, []);

  useKioskIdle(handleReset);

  // Initialization
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bId = params.get('branch_id');
    if (bId) setBranchId(parseInt(bId));

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/public-menu' + (bId ? `?branch_id=${bId}` : ''));
        const rawItems: MenuItem[] = res.data;
        setItems(rawItems);
        
        const cats = Array.from(new Set(rawItems.map(i => i.category))).filter(Boolean);
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0]);
      } catch (err) {
        console.error('Failed to fetch kiosk menu', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1, uniqueId: Math.random().toString(36).substr(2, 9) }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (Number(item.sellingPrice) * item.qty), 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    try {
      setLoading(true);
      const siNumber = `KSK-${Math.floor(Date.now() / 1000)}`;
      
      const total = calculateTotal();
      const vatableSales = total / 1.12;
      const vatAmount = total - vatableSales;

      const payload = {
        si_number: siNumber,
        branch_id: branchId,
        payment_method: 'cash', 
        status: 'pending',
        source: 'kiosk',
        subtotal: total,
        total: total,
        vatable_sales: Number(vatableSales.toFixed(2)),
        vat_amount: Number(vatAmount.toFixed(2)),
        items: cart.map(item => ({
          menu_item_id: item.id,
          name: item.name,
          quantity: item.qty,
          unit_price: Number(item.sellingPrice),
          total_price: Number(item.sellingPrice) * item.qty,
        }))
      };

      await api.post('/sales', payload);
      setOrderNumber(siNumber.replace('KSK-', ''));
      setStep('confirm');
      
      // Auto-reset after 15s when showing order number
      setTimeout(handleReset, 15000);
    } catch (_err) {
      alert('Failed to place order. Please call staff.');
    } finally {
      setLoading(false);
    }
  };

  // --- Views ---

  const SplashView = () => (
    <div 
      className="flex-1 flex flex-col items-center justify-center p-10 cursor-pointer animate-in fade-in duration-500"
      onClick={() => setStep('menu')}
    >
      <div className="w-56 h-56 bg-violet-600 rounded-full flex items-center justify-center shadow-2xl mb-12 animate-pulse">
        <ShoppingBag size={80} className="text-white" />
      </div>
      <h1 className="text-6xl font-black text-zinc-900 mb-4 text-center">Touch to Start Order</h1>
      <p className="text-2xl text-zinc-400 font-bold uppercase tracking-widest">Lucky Boba Milk Tea</p>
      
      <div className="mt-20 flex items-center gap-4 text-violet-500 font-black text-xl">
        <ChevronRight size={32} />
        <span>Tap Screen to Order</span>
        <ChevronRight size={32} />
      </div>
    </div>
  );

  const MenuView = () => {
    const filteredItems = items.filter(i => i.category === activeCategory);

    return (
      <div className="flex-1 flex overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-56 bg-zinc-900 flex flex-col overflow-y-auto scrollbar-hide py-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-10 text-left text-xs font-black uppercase tracking-[0.2em] transition-all border-l-4 ${activeCategory === cat ? 'bg-violet-600/10 text-violet-400 border-violet-600' : 'text-zinc-500 border-transparent hover:bg-zinc-800'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-12 bg-zinc-50">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredItems.map(item => (
              <div 
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 flex flex-col items-center text-center active:scale-95 transition-all"
              >
                <div className="w-32 h-32 bg-zinc-100 rounded-2xl mb-6 flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="text-zinc-300" size={32} />
                  )}
                </div>
                <h3 className="font-black text-zinc-900 leading-tight mb-2 h-10 overflow-hidden line-clamp-2 uppercase text-sm">
                  {item.name}
                </h3>
                <span className="text-violet-600 font-black text-lg">₱{Number(item.sellingPrice).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="w-[450px] bg-white border-l border-zinc-200 flex flex-col shadow-2xl">
          <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-2xl font-black text-zinc-900 uppercase">Your Cart</h2>
            <span className="bg-violet-100 text-violet-600 px-4 py-1 rounded-full text-sm font-black">
              {cart.reduce((s, i) => s + i.qty, 0)} Items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <ShoppingBag size={64} className="mb-6" />
                <p className="font-black uppercase tracking-widest">Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-6 group">
                  <div className="w-16 h-16 bg-zinc-100 rounded-xl shrink-0 overflow-hidden">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-zinc-800 uppercase text-xs mb-2">{item.name}</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-zinc-100 rounded-lg">
                        <button onClick={() => updateQty(item.id, -1)} className="p-2 hover:text-violet-600"><Minus size={14} /></button>
                        <span className="w-8 text-center font-black text-sm">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="p-2 hover:text-violet-600"><Plus size={14} /></button>
                      </div>
                      <span className="font-black text-violet-600 text-sm">₱{(Number(item.sellingPrice) * item.qty).toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-8 bg-zinc-50 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-black uppercase tracking-widest">Total Amount</span>
              <span className="text-3xl font-black text-zinc-900">₱{calculateTotal().toFixed(2)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleReset}
                className="py-6 rounded-2xl bg-white border-2 border-zinc-200 text-zinc-400 font-black uppercase tracking-widest hover:border-red-200 hover:text-red-500 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={cart.length === 0 || loading}
                className="py-6 rounded-2xl bg-violet-600 text-white font-black uppercase tracking-widest shadow-xl shadow-violet-100 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? 'Ordering...' : 'Order Now'}
              </button>
            </div>
            
            <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-tight">
              Please pay cash at the cashier after ordering
            </p>
          </div>
        </div>
      </div>
    );
  };

  const ConfirmView = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-10 animate-in zoom-in duration-500">
      <div className="w-48 h-48 text-emerald-500 mb-12">
        <CheckCircle2 size={192} strokeWidth={1} />
      </div>
      <h2 className="text-5xl font-black text-zinc-900 mb-4 uppercase">Order Sent Successfully!</h2>
      <p className="text-2xl text-zinc-400 font-bold mb-12">Please present your order number to the cashier</p>
      
      <div className="bg-white p-16 rounded-[4rem] shadow-2xl border border-zinc-100 flex flex-col items-center">
        <span className="text-sm font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">Your Order Number</span>
        <h3 className="text-[12rem] font-black leading-none text-zinc-900 font-mono tracking-tighter">
          #{orderNumber}
        </h3>
      </div>
      
      <button 
        onClick={handleReset}
        className="mt-20 flex items-center gap-2 text-violet-600 font-black text-xl hover:translate-x-2 transition-transform"
      >
        <span>Back to Menu</span>
        <ChevronRight size={24} />
      </button>
    </div>
  );

  return (
    <KioskLayout>
      {step === 'splash' && <SplashView />}
      {step === 'menu' && <MenuView />}
      {step === 'confirm' && <ConfirmView />}
      
      {/* Loading Overlay */}
      {loading && step !== 'menu' && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            <span className="font-black text-violet-600 uppercase tracking-widest text-sm">Processing...</span>
          </div>
        </div>
      )}
    </KioskLayout>
  );
};

export default KioskPage;
