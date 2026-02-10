import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. IMPORT DATA
import { AddOnsList, type ItemData } from '../components/Menu/AddOns';
import { AffordaBowlsList } from '../components/Menu/AffordaBowls';
import { AlaCarteList } from '../components/Menu/AlaCarte';
import { AllDayList } from '../components/Menu/AllDay';
import { LuckyCardList } from '../components/Menu/LuckyCard';
import { CheeseCakeList } from '../components/Menu/CheeseCake';
import { ChickenWingsList } from '../components/Menu/ChickenWings';
import { ClassicMilkteaList } from '../components/Menu/ClassicMilktea';
import { CoffeeFrappeList } from '../components/Menu/CoffeeFrappe';

const CATEGORIES = [
  "Add Ons Sinkers", "AFFORDA-BOWLS", "ALA CARTE SNACKS", "ALL DAY MEALS", "CARD",
  "CHEESECAKE MILK TEA", "CHICKEN WINGS", "CLASSIC MILKTEA", "COFFEE FRAPPE", "COMBO MEALS",
  "CREAM CHEESE M. TEA", "FLAVORED MILK TEA", "FP COFFEE BUNDLES", "FP/GF FET2 CLASSIC", "FRAPPE SERIES",
  "FREEBIES", "FRUIT SODA SERIES", "GF DUO BUNDLES", "GRAND OPENING PROMO", "GREEN TEA SERIES",
  "HOT COFFEE", "HOT DRINKS", "ICED COFFEE", "NOVA SERIES", "OKINAWA BROWN SUGAR",
  "PROMOS", "PUMPKIN SPICE ROCK SALT & CHEESE", "WAFFLE", "YAKULT SERIES", "YOGURT SERIES"
];

// Categories that require a Size/Quantity selection BEFORE showing items
const DRINK_CATEGORIES = [
  "CHEESECAKE MILK TEA", "CLASSIC MILKTEA", "COFFEE FRAPPE", 
  "CREAM CHEESE M. TEA", "FLAVORED MILK TEA", "FRAPPE SERIES", 
  "FRUIT SODA SERIES", "GREEN TEA SERIES", "HOT COFFEE", "HOT DRINKS", 
  "ICED COFFEE", "NOVA SERIES", "OKINAWA BROWN SUGAR", 
  "PUMPKIN SPICE ROCK SALT & CHEESE", "YAKULT SERIES", "YOGURT SERIES"
];

// 2. REGISTER DATA
const CATEGORY_ITEMS: Record<string, ItemData[]> = {
  "Add Ons Sinkers": AddOnsList,
  "AFFORDA-BOWLS": AffordaBowlsList,
  "ALA CARTE SNACKS": AlaCarteList,
  "ALL DAY MEALS": AllDayList,
  "CARD": LuckyCardList,
  "CHEESECAKE MILK TEA": CheeseCakeList,
  "CHICKEN WINGS": ChickenWingsList,
  "CLASSIC MILKTEA": ClassicMilkteaList,
  "COFFEE FRAPPE": CoffeeFrappeList,
};

interface MenuItem {
  id: string;
  name: string;
  price: number;
  barcode: string;
}

interface CartItem extends MenuItem {
  qty: number;
  remarks: string;
  charges: { grab: boolean; panda: boolean };
  sugarLevel?: string;
  size?: string;
  options?: string[];
  finalPrice: number;
}

const SalesOrder = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Stores 'M'/'L' for drinks, OR '3pc'/'4pc'/'6pc'/'12pc' for wings
  const [categorySize, setCategorySize] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [qty, setQty] = useState(1);
  const [remarks, setRemarks] = useState('');
  const [charges, setCharges] = useState({ grab: false, panda: false });
  
  // Modifiers
  const [sugarLevel, setSugarLevel] = useState('100%');
  const [size, setSize] = useState('M'); 
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);

  const SUGAR_LEVELS = ['25%', '50%', '75%', '100%'];
  const EXTRA_OPTIONS = ['NO ICE', '-ICE', '+ICE', 'WARM', 'NO PRL', 'W/ PRL', 'R NAT'];

  // Logic flags
  const isDrink = selectedCategory && DRINK_CATEGORIES.includes(selectedCategory);
  const isWings = selectedCategory === "CHICKEN WINGS";

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Helper to get items DYNAMICALLY based on selections ---
  const getItemsForCategory = (category: string): MenuItem[] => {
    const specificItems = CATEGORY_ITEMS[category];
    
    if (specificItems) {
      return specificItems.map((item, i) => {
        
        let barcode = item.barcode || `GEN${i + 1}`; 
        let price = item.price;
        let name = item.name;

        // --- Custom Logic: BARCODES & PRICES ---
        if (category === "Add Ons Sinkers") barcode = `AO${i + 1}`; 
        else if (category === "AFFORDA-BOWLS") barcode = `AB${i + 1}`;
        else if (category === "ALL DAY MEALS") barcode = `ADM${i + 1}`;
        else if (category === "ALA CARTE SNACKS") {
          if (item.name === "Bottled Mineral Water") barcode = "BTL1";
          else if (item.name === "Rice") barcode = "RCE";
          else barcode = `ACS${i + 1}`;
        }
        else if (category === "CHICKEN WINGS" && categorySize) {
          name = `${item.name} (${categorySize})`;
          if (categorySize === '3pc') price = 100;
          if (categorySize === '4pc') price = 120;
          if (categorySize === '6pc') price = 195;
          if (categorySize === '12pc') price = 390; 
          const prefix = categorySize.replace('pc', '');
          barcode = `${prefix}CW${i + 1}`;
        }

        return {
          id: `${category}-${i}`,
          name: name,
          price: price,
          barcode: barcode
        };
      });
    } else {
      return Array.from({ length: 8 }).map((_, i) => ({
        id: `${category}-mock-${i}`,
        name: `${category} Item ${i + 1}`,
        price: 0, 
        barcode: `9900${i}`
      }));
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleNavClick = (label: string) => {
    if (label === 'Home') navigate('/');
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setCategorySize(null);
  };

  const handleBack = () => {
    if ((isDrink || isWings) && categorySize) {
      setCategorySize(null);
    } else {
      setSelectedCategory(null);
    }
  };

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setQty(1);
    setRemarks('');
    setCharges({ grab: false, panda: false });
    setSugarLevel('100%');
    
    // Set size based on previous screen selection
    // Only applied for drinks; Wings price is already baked into item.price
    setSize(isDrink && categorySize === 'L' ? 'L' : 'M'); 
    setSelectedOptions([]);
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  const adjustQty = (delta: number) => {
    setQty(prev => Math.max(1, prev + delta));
  };

  const toggleCharge = (type: 'grab' | 'panda') => {
    setCharges(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const toggleOption = (opt: string) => {
    setSelectedOptions(prev => 
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );
  };

  const addToOrder = () => {
    if (!selectedItem) return;

    let extraCost = 0;
    if (charges.grab) extraCost += 10;
    if (charges.panda) extraCost += 10;
    
    // Size Upcharge Logic: Add 20 if Large Drink
    if (isDrink && size === 'L') {
      extraCost += 20; 
    }

    // --- BARCODE SWITCHING LOGIC ---
    let finalBarcode = selectedItem.barcode;
    if (isDrink && size === 'L') {
      // Cheesecake: CCMM -> CCML
      if (finalBarcode.startsWith("CCMM")) {
        finalBarcode = finalBarcode.replace("CCMM", "CCML");
      }
      // Classic Milktea: CMM -> CML
      else if (finalBarcode.startsWith("CMM")) {
        finalBarcode = finalBarcode.replace("CMM", "CML");
      }
      // Coffee Frappe: CFM -> CFL
      else if (finalBarcode.startsWith("CFM")) {
        finalBarcode = finalBarcode.replace("CFM", "CFL");
      }
    }
    // -------------------------------

    const newItem: CartItem = {
      ...selectedItem,
      barcode: finalBarcode, 
      qty,
      remarks,
      charges,
      sugarLevel: isDrink ? sugarLevel : undefined,
      size: isDrink ? size : undefined,
      options: isDrink ? selectedOptions : undefined,
      finalPrice: (selectedItem.price + extraCost) * qty
    };

    setCart([...cart, newItem]);
    closeModal();
  };

  const subtotal = cart.reduce((acc, item) => acc + item.finalPrice, 0);
  const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);

  const getDisplayPrice = () => {
    if (!selectedItem) return "0.00";
    let price = selectedItem.price;
    if (isDrink && size === 'L') {
      price += 20;
    }
    return price.toFixed(2);
  };

  const getDisplayBarcode = () => {
    if (!selectedItem) return "";
    const code = selectedItem.barcode; // FIX: Changed 'let' to 'const'
    if (isDrink && size === 'L') {
      if (code.startsWith('CCMM')) return code.replace('CCMM', 'CCML');
      if (code.startsWith('CMM')) return code.replace('CMM', 'CML');
      if (code.startsWith('CFM')) return code.replace('CFM', 'CFL');
    }
    return code;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f8f6ff] relative overflow-hidden font-sans">
      
      {/* === MODAL POPUP === */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
            
            <div className="bg-[#3b2063] p-5 text-white text-center relative shrink-0">
              <h2 className="text-lg font-black uppercase tracking-wider">{selectedItem.name}</h2>
              <button onClick={closeModal} className="absolute top-5 right-6 text-white/50 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Barcode</span>
                  <span className="text-sm font-black text-[#3b2063]">
                    {getDisplayBarcode()}
                  </span>
                </div>
                <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Unit Price</span>
                  <span className="text-sm font-black text-[#3b2063]">₱ {getDisplayPrice()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-2 border border-zinc-100">
                <button onClick={() => adjustQty(-1)} className="w-12 h-12 bg-white rounded-xl shadow-sm border border-zinc-200 text-[#3b2063] hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
                </button>
                <input type="text" value={qty} readOnly className="bg-transparent text-center font-black text-2xl text-[#3b2063] w-20 outline-none" />
                <button onClick={() => adjustQty(1)} className="w-12 h-12 bg-[#3b2063] rounded-xl shadow-lg shadow-purple-900/20 text-white hover:bg-[#2a1647] transition-colors flex items-center justify-center active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
              </div>

              {/* --- ONLY SHOW MODIFIERS FOR DRINKS --- */}
              {isDrink && (
                <>
                  <div className="animate-in fade-in duration-300 delay-75">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-2 block">Sugar Level</label>
                    <div className="flex gap-2">
                      {SUGAR_LEVELS.map((level) => (
                        <button
                          key={level}
                          onClick={() => setSugarLevel(level)}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${
                            sugarLevel === level 
                            ? 'bg-[#3b2063] text-white shadow-md' 
                            : 'bg-zinc-50 text-zinc-400 border border-zinc-100 hover:bg-zinc-100'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="animate-in fade-in duration-300 delay-100">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-2 block">Options</label>
                    <div className="flex flex-wrap gap-2">
                      {EXTRA_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => toggleOption(opt)}
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
                            selectedOptions.includes(opt)
                            ? 'bg-[#3b2063] text-white shadow-md'
                            : 'bg-zinc-50 text-zinc-400 border border-zinc-100 hover:bg-zinc-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-2 block">Charges (+10.00)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => toggleCharge('grab')} className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${charges.grab ? 'border-green-500 bg-green-50 text-green-700' : 'border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-green-200'}`}>
                    <span className="font-bold text-xs uppercase">Grab Food</span>
                  </button>
                  <button onClick={() => toggleCharge('panda')} className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${charges.panda ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-pink-200'}`}>
                    <span className="font-bold text-xs uppercase">Food Panda</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-2 block">Remarks</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Additional notes..." className="w-full p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] resize-none h-16 outline-none focus:ring-2 focus:ring-[#f0ebff] focus:border-[#3b2063] transition-all" />
              </div>

              <button onClick={addToOrder} className="w-full bg-[#3b2063] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-purple-900/20 active:scale-95 transition-all hover:bg-[#2a1647]">Add Order</button>
            </div>
          </div>
        </div>
      )}

      {/* === TOP HEADER SECTION === */}
      <div className="flex gap-4 p-4 border-b border-zinc-200 bg-white items-stretch h-24 shrink-0 shadow-sm z-20 relative">
        <div className="flex gap-2">
          {['Home', 'Cat', 'Kit', 'Bar', 'Bill'].map((label) => (
            <button key={label} onClick={() => handleNavClick(label)} className="bg-[#3b2063] hover:bg-[#2a1647] text-white w-20 h-full rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md shadow-purple-900/20 transition-all active:scale-95 flex flex-col items-center justify-center gap-1 group">
              <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                {label === 'Home' && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>}
                {label === 'Cat' && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>}
                {label === 'Kit' && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
                {label === 'Bar' && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" /></svg>}
                {label === 'Bill' && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>}
              </div>
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 bg-zinc-50 rounded-2xl p-2 flex gap-2 shadow-inner border border-zinc-200">
          <input type="text" placeholder="Search Item..." className="flex-1 bg-transparent px-4 font-bold text-zinc-700 outline-none uppercase placeholder:text-zinc-300 text-sm" />
          <button className="bg-white text-[#3b2063] hover:bg-[#f0ebff] px-6 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm border border-zinc-100 transition-colors">Search</button>
        </div>
        <div className="flex flex-col gap-2 w-56">
          <div className="flex-1 bg-white border border-zinc-100 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-[#3b2063] font-black uppercase text-[10px] tracking-widest">Main Branch - QC</span>
          </div>
          <div className="flex-1 bg-[#3b2063] rounded-xl flex items-center justify-center px-4 text-white shadow-lg shadow-purple-900/20">
             <div className="text-center">
               <div className="text-[10px] font-bold uppercase leading-none opacity-80 mb-1">{formatDate(currentDate)}</div>
               <div className="text-sm font-black leading-none">{formatTime(currentDate)}</div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative z-10">
        <div className="flex-1 overflow-y-auto p-6 bg-[#f8f6ff]">
          
          {selectedCategory ? (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* --- HEADER WITH BACK BUTTON --- */}
              <div className="flex items-center gap-4 mb-6 sticky top-0 z-10 bg-[#f8f6ff] py-2">
                <button onClick={handleBack} className="bg-white p-3 rounded-xl shadow-sm border border-zinc-200 hover:bg-zinc-50 text-[#3b2063] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                </button>
                <h2 className="text-[#3b2063] font-black text-xl uppercase tracking-wide">
                  {selectedCategory} 
                  {categorySize && <span className="opacity-50"> &bull; {isWings ? categorySize : (categorySize === 'M' ? 'MEDIUM' : 'LARGE')}</span>}
                </h2>
              </div>

              {/* --- 1. DRINK SIZE SELECTION --- */}
              {isDrink && !categorySize ? (
                <div className="flex flex-col items-center justify-center h-full max-h-[50vh] gap-6 animate-in zoom-in duration-300">
                  <h3 className="text-xl font-bold text-zinc-400 uppercase tracking-widest">Select Size</h3>
                  <div className="flex gap-6 w-full max-w-lg">
                    <button onClick={() => setCategorySize('M')} className="flex-1 h-48 bg-white rounded-3xl shadow-lg border-2 border-transparent hover:border-[#3b2063] hover:bg-[#f0ebff] transition-all flex flex-col items-center justify-center group">
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🥤</div>
                      <span className="text-xl font-black text-[#3b2063] uppercase tracking-wider">Medium</span>
                    </button>
                    <button onClick={() => setCategorySize('L')} className="flex-1 h-48 bg-[#3b2063] text-white rounded-3xl shadow-xl shadow-purple-900/30 hover:bg-[#2a1647] hover:scale-105 transition-all flex flex-col items-center justify-center">
                      <div className="text-5xl mb-2">🥤</div>
                      <span className="text-xl font-black uppercase tracking-wider">Large</span>
                      <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full mt-2">+ ₱20.00</span>
                    </button>
                  </div>
                </div>
              ) 
              /* --- 2. CHICKEN WINGS QUANTITY SELECTION --- */
              : isWings && !categorySize ? (
                <div className="flex flex-col items-center justify-center h-full max-h-[60vh] gap-6 animate-in zoom-in duration-300">
                  <h3 className="text-xl font-bold text-zinc-400 uppercase tracking-widest">Select Quantity</h3>
                  <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                    <button onClick={() => setCategorySize('3pc')} className="h-40 bg-white rounded-3xl shadow-md border-2 border-transparent hover:border-[#3b2063] hover:bg-[#f0ebff] transition-all flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-[#3b2063]">3 pcs</span>
                      <span className="text-sm font-bold text-zinc-400">₱ 100.00</span>
                    </button>
                    <button onClick={() => setCategorySize('4pc')} className="h-40 bg-white rounded-3xl shadow-md border-2 border-transparent hover:border-[#3b2063] hover:bg-[#f0ebff] transition-all flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-[#3b2063]">4 pcs</span>
                      <span className="text-sm font-bold text-zinc-400">₱ 120.00</span>
                    </button>
                    <button onClick={() => setCategorySize('6pc')} className="h-40 bg-white rounded-3xl shadow-md border-2 border-transparent hover:border-[#3b2063] hover:bg-[#f0ebff] transition-all flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-[#3b2063]">6 pcs</span>
                      <span className="text-sm font-bold text-zinc-400">₱ 195.00</span>
                    </button>
                    <button onClick={() => setCategorySize('12pc')} className="h-40 bg-[#3b2063] text-white rounded-3xl shadow-xl hover:bg-[#2a1647] transition-all flex flex-col items-center justify-center">
                      <span className="text-2xl font-black">12 pcs</span>
                      <span className="text-sm font-bold opacity-70">₱ 390.00</span>
                    </button>
                  </div>
                </div>
              )
              /* --- 3. ITEMS LIST (Standard) --- */
              : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {getItemsForCategory(selectedCategory).map((item) => (
                    <button key={item.id} onClick={() => handleItemClick(item)} className="bg-white hover:bg-[#3b2063] hover:text-white text-[#3b2063] p-4 rounded-2xl shadow-sm hover:shadow-lg border border-zinc-100 active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-2 group h-24">
                      <span className="font-bold text-xs uppercase leading-tight line-clamp-2">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}

            </div>
          ) : (
            // --- MAIN CATEGORY LIST ---
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-20 animate-in fade-in zoom-in duration-300">
              {CATEGORIES.map((cat, index) => (
                <button key={index} onClick={() => handleCategoryClick(cat)} className="bg-white hover:bg-[#3b2063] hover:text-white text-[#3b2063] font-bold text-[10px] uppercase p-3 rounded-2xl h-24 shadow-sm hover:shadow-lg border border-zinc-100 active:scale-95 transition-all flex items-center justify-center text-center break-words leading-tight group">
                  <span className="group-hover:translate-y-0 transition-transform">{cat}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-96 bg-white border-l border-zinc-200 flex flex-col shrink-0 shadow-2xl z-30">
          <div className="bg-zinc-50 border-b border-zinc-200 p-4 text-center">
            <h2 className="text-[#3b2063] font-black uppercase tracking-[0.2em] text-xs">Current Order</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-white relative">
            {cart.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-200 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                <p className="font-bold text-[10px] uppercase tracking-[0.2em]">No Items Added</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between items-start bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <div className="flex-1">
                      <p className="font-bold text-xs text-[#3b2063]">{item.name}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.size && (
                          <span className="bg-purple-100 text-purple-700 text-[9px] px-1.5 py-0.5 rounded font-bold">{item.size === 'M' ? 'MEDIUM' : (item.size === 'L' ? 'LARGE' : item.size)}</span>
                        )}
                        {item.sugarLevel && item.sugarLevel !== '100%' && (
                          <span className="bg-orange-100 text-orange-700 text-[9px] px-1.5 py-0.5 rounded font-bold">{item.sugarLevel} Sugar</span>
                        )}
                        {item.options && item.options.map(opt => (
                          <span key={opt} className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded font-bold">{opt}</span>
                        ))}
                      </div>

                      {(item.charges.grab || item.charges.panda) && (
                        <div className="flex gap-1 mt-1">
                          {item.charges.grab && <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded font-bold">GRAB</span>}
                          {item.charges.panda && <span className="bg-pink-100 text-pink-700 text-[9px] px-1.5 py-0.5 rounded font-bold">PANDA</span>}
                        </div>
                      )}
                      {item.remarks && <p className="text-[10px] text-zinc-400 mt-1 italic">"{item.remarks}"</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm">₱ {item.finalPrice.toFixed(2)}</p>
                      <p className="text-[10px] text-zinc-400 font-bold">x {item.qty}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-[#3b2063] text-white p-6 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(59,32,99,0.3)] relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Subtotal</span>
                <span className="text-3xl font-black tracking-tight">₱ {subtotal.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-2 px-3">
                   <span className="text-[9px] font-bold uppercase opacity-60 block tracking-wider">Count</span>
                   <span className="text-lg font-bold">{totalCount}</span>
                </div>
                <div className="bg-white/10 rounded-xl p-2 px-3">
                   <span className="text-[9px] font-bold uppercase opacity-60 block tracking-wider">Pax</span>
                   <span className="text-lg font-bold">1</span>
                </div>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase opacity-50 tracking-widest">Cashier</span>
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">Admin User</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOrder;