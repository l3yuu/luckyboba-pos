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
} from 'lucide-react';
import { KioskTicketPrint } from '../../components/Cashier/SalesOrderComponents/print';
import { getImageUrl } from '../../utils/imageUtils';

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
  const [step, setStep] = useState<'splash' | 'order_type' | 'menu' | 'confirm'>('splash');
  const [orderType, setOrderType] = useState<'dine_in' | 'take_out' | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [printData, setPrintData] = useState<{
    invoice: string;
    cart: CartItem[];
  } | null>(null);

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
    setCart((prev: CartItem[]) => {
      const existing = prev.find((i: CartItem) => i.id === item.id);
      if (existing) {
        return prev.map((i: CartItem) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1, uniqueId: Math.random().toString(36).substr(2, 9) }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev: CartItem[]) => prev.map((i: CartItem) => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeFromCart = (id: number) => {
    setCart((prev: CartItem[]) => prev.filter((i: CartItem) => i.id !== id));
  };

  const calculateTotal = () => cart.reduce((sum: number, item: CartItem) => sum + (Number(item.sellingPrice) * item.qty), 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    try {
      setLoading(true);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const siNumber = `KSK-${timestamp}`;
      
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
          total_price: Number(item.sellingPrice) * item.qty,
        }))
      };

      await api.post('/sales', payload);
      setOrderNumber(timestamp.slice(-4));
      setPrintData({ invoice: siNumber, cart: [...cart] });
      setStep('confirm');
      
      // Auto-reset timer
      setTimeout(handleReset, 15000);
    } catch (err) {
      alert('Failed to place order. Please call staff.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Automatic Printing
  useEffect(() => {
    if (printData && step === 'confirm') {
      const timer = setTimeout(() => {
        window.print();
      }, 1000); // 1s buffer for thermal rendering
      return () => clearTimeout(timer);
    }
  }, [printData, step]);

  // --- Views ---

  const SplashView = () => (
    <div 
      className="flex-1 flex flex-col items-center justify-center p-10 cursor-pointer animate-in fade-in duration-700"
      onClick={() => setStep('order_type')}
    >
      <div className="w-56 h-56 bg-violet-600 rounded-full flex items-center justify-center shadow-2xl mb-12 animate-pulse">
        <ShoppingBag size={80} className="text-white" />
      </div>
      <h1 className="text-5xl font-black text-zinc-900 mb-4 text-center">Touch to Start Order</h1>
      <p className="text-2xl text-zinc-400 font-bold uppercase tracking-widest">Lucky Boba Milk Tea</p>
      
      <div className="mt-20 flex items-center gap-4 text-violet-500 font-black text-xl">
        <ChevronRight size={32} />
        <span>Tap Screen to Order</span>
        <ChevronRight size={32} />
      </div>
    </div>
  );

  const OrderTypeView = () => (
    <div className="flex-1 flex flex-col p-16 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-[#fafafa]">
      <div className="flex items-center gap-4 mb-20">
        <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
          <ShoppingBag size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">How would you like to eat?</h2>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select your dining preference</p>
        </div>
      </div>

      <div className="flex-1 flex gap-10 items-center justify-center">
        <button 
          onClick={() => {
            setOrderType('dine_in');
            setStep('menu');
          }}
          className="group relative flex-1 max-w-sm aspect-[4/5] bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border-2 border-transparent hover:border-violet-500 hover:scale-105 transition-all duration-500 flex flex-col items-center justify-center p-10"
        >
          <div className="w-40 h-40 bg-violet-50 rounded-full flex items-center justify-center mb-8 group-hover:bg-violet-600 group-hover:rotate-12 transition-all duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-violet-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h3 className="text-3xl font-black text-zinc-900 uppercase italic">Dine In</h3>
          <p className="mt-4 text-zinc-400 font-bold uppercase tracking-widest text-xs">Eat here at our branch</p>
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <CheckCircle2 className="text-violet-600" size={32} />
          </div>
        </button>

        <button 
          onClick={() => {
            setOrderType('take_out');
            setStep('menu');
          }}
          className="group relative flex-1 max-w-sm aspect-[4/5] bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border-2 border-transparent hover:border-violet-500 hover:scale-105 transition-all duration-500 flex flex-col items-center justify-center p-10"
        >
          <div className="w-40 h-40 bg-violet-50 rounded-full flex items-center justify-center mb-8 group-hover:bg-violet-600 group-hover:rotate-12 transition-all duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-violet-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-3xl font-black text-zinc-900 uppercase italic">Take Out</h3>
          <p className="mt-4 text-zinc-400 font-bold uppercase tracking-widest text-xs">Enjoy your boba at home</p>
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <CheckCircle2 className="text-violet-600" size={32} />
          </div>
        </button>
      </div>

      <button 
        onClick={() => setStep('splash')}
        className="mt-12 mx-auto text-zinc-400 font-bold uppercase tracking-widest text-[10px] hover:text-violet-600 transition-colors"
      >
        Go Back
      </button>
    </div>
  );

  const MenuView = () => {
    return (
      <div className="flex-1 flex overflow-hidden bg-[#fafafa]">
        {/* Categories Sidebar */}
        <div className="w-48 bg-white flex flex-col overflow-y-auto scrollbar-hide border-r border-zinc-100">
          <div className="p-8 pb-4">
            <span className="text-[10px] font-black text-violet-900/40 uppercase tracking-[0.2em] mb-4 block">Categories</span>
          </div>
          <button
            onClick={() => {
              setActiveCategory('');
              setSearchQuery('');
            }}
            className="px-6 py-2 group transition-all"
          >
            <div className={`px-4 py-3 rounded-xl text-left transition-all ${
              activeCategory === '' && searchQuery === '' 
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 font-bold' 
                : 'text-zinc-500 hover:bg-zinc-50 font-medium'
            }`}>
              <span className="text-xs uppercase tracking-wider leading-tight block">All Items</span>
            </div>
          </button>
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSearchQuery(''); // Clear search when picking category
              }}
              className="px-6 py-4 group transition-all"
            >
              <div className={`px-4 py-3 rounded-xl text-left transition-all ${
                activeCategory === cat 
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 font-bold' 
                  : 'text-zinc-500 hover:bg-zinc-50 font-medium'
              }`}>
                <span className="text-xs uppercase tracking-wider leading-tight block">
                  {cat}
                </span>
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
                className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-violet-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-10 scroll-smooth">
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {items
                .filter((item: MenuItem) => {
                  const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesCategory = activeCategory === '' || item.category === activeCategory;
                  return matchesSearch && matchesCategory;
                })
                .map((item: MenuItem) => (
                  <div 
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 flex flex-col items-center text-center active:scale-95 transition-all cursor-pointer group hover:shadow-md hover:border-violet-200"
                  >
                    <div className="w-full aspect-square rounded-xl bg-zinc-50 mb-4 flex items-center justify-center overflow-hidden relative border border-zinc-50">
                      {item.image ? (
                        <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 opacity-20">
                          <ShoppingBag size={32} />
                          <span className="text-[8px] font-bold uppercase tracking-widest">Lucky Boba</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-zinc-800 leading-tight mb-3 h-10 overflow-hidden line-clamp-2 uppercase text-[11px] tracking-wide">
                      {item.name}
                    </h3>
                    <div className="text-violet-600 font-bold text-base">
                      ₱{Number(item.sellingPrice).toFixed(2)}
                    </div>
                  </div>
                ))}
            </div>
            
            {items.filter((item: MenuItem) => {
              const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesCategory = activeCategory === '' || item.category === activeCategory;
              return matchesSearch && matchesCategory;
            }).length === 0 && (
              <div className="h-full flex flex-col items-center justify-center py-20 opacity-30">
                <ShoppingBag size={48} className="mb-4" />
                <p className="font-black uppercase tracking-widest text-sm">No items found</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="w-[380px] bg-white flex flex-col shadow-2xl z-10 border-l border-zinc-100">
          <div className="p-8 border-b border-zinc-50 flex items-center justify-between bg-white relative z-20">
            <div>
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Cart</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Order Summary</p>
            </div>
            <div className="bg-violet-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md shadow-violet-100">
              <span className="font-bold text-sm">{cart.reduce((s: number, i: CartItem) => s + i.qty, 0)}</span>
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
                <div key={item.id} className="flex items-center gap-6 group">
                  <div className="w-16 h-16 bg-zinc-100 rounded-xl shrink-0 overflow-hidden">
                    {item.image && <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />}
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

          <div className="p-8 border-t border-zinc-100 bg-zinc-50 space-y-6 relative z-20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px]">Total Amount</span>
                <div className="text-2xl font-black text-zinc-900">₱{calculateTotal().toFixed(2)}</div>
              </div>
              <div className="text-right">
                <span className="text-emerald-600 font-bold uppercase tracking-widest text-[9px] block">Cash Only</span>
                <span className="text-zinc-400 text-[8px] uppercase font-bold">Collect at counter</span>
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
      </div>
    );
  };

  const ConfirmView = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-10 bg-[#f3e8ff]/30 animate-in fade-in duration-700">
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

          <div className="space-y-2 mb-8 text-left text-[11px] font-bold text-gray-500 uppercase tracking-tight px-2">
            <div className="flex justify-between">
              <span>Items Total:</span>
              <span className="text-[#3b2063]">{cart.reduce((s: number, i: CartItem) => s + i.qty, 0)} Units</span>
            </div>
            <div className="flex justify-between border-t border-gray-50 pt-2">
              <span className="text-gray-400">Total Due:</span>
              <span className="text-lg text-[#3b2063] font-black">₱{calculateTotal().toFixed(2)}</span>
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

      <div className="flex flex-col gap-4 mt-12">
        <button
          onClick={handleReset}
          className="bg-[#3b2063] text-white px-16 py-6 rounded-full font-black uppercase tracking-[0.2em] flex items-center gap-4 hover:bg-[#2d184d] transition-all transform hover:scale-105 shadow-2xl shadow-[#3b2063]/30 active:scale-95"
        >
          <span>Finish Order</span>
          <ChevronRight size={20} />
        </button>

        <button
          onClick={() => window.print()}
          className="text-[#3b2063]/40 font-black uppercase tracking-widest text-[10px] hover:text-[#3b2063] transition-colors py-2"
        >
          Reprint Receipt
        </button>
      </div>
    </div>
  );

  return (
    <KioskLayout>
      <div className="h-full flex flex-col bg-white print:hidden">
        {step === 'splash' && <SplashView />}
        {step === 'order_type' && <OrderTypeView />}
        {step === 'menu' && <MenuView />}
        {step === 'confirm' && <ConfirmView />}
      </div>

      {printData && (
        <KioskTicketPrint
          cart={printData.cart as any}
          branchName="Lucky Boba - Main"
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
    </KioskLayout>
  );
};

export default KioskPage;
