"use client"

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// IMPORT TYPES AND CONSTANTS
import { 
    type MenuItem, 
    type Category, 
    type CartItem, 
    SUGAR_LEVELS, 
    EXTRA_OPTIONS, 
    WINGS_QUANTITIES 
} from '../types/index'; 
// 1. IMPORT THE GLOBAL HOOK
import { useToast } from '../hooks/useToast';

// === CUSTOM ICON COMPONENT ===
const DrinkIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
        <path d="m187.4 22.88l-21.5 4.54l22.7 108.08c7.2-.7 14.6-1.2 22-1.6zM256 147.7c-41.2 0-82.3 3.7-123.5 11.1l-11.6 1.1l4.3 22.1l10.6-2.1c20.1-3.2 40.1-6.3 61.2-7.4l8.4 40.1h22.2l-8.4-42.2c51.6-2.1 104.4 1.1 157.1 9.5l10.6 2.1l4.2-22.1l-11.6-1.1c-41.2-7.4-82.3-11.1-123.5-11.1m-119.1 51.6l26.4 281.3l8.3 1c56.2 9.5 112.3 10.6 168.5 0l8.1-1l26.5-281.3h-22.1l-3.6 37.8H232.2l42.3 202.3l-24.3-9.5l-40.4-192.8h-47.3l-3.6-37.8zm188.8 155.3c7.4 0 13.5 6 13.5 13.5s-6.1 13.5-13.5 13.5c-7.5 0-13.5-6-13.5-13.5s6-13.5 13.5-13.5M292 380.2c7.4 0 13.6 6.1 13.6 13.5c0 7.5-6.2 13-13.6 13s-13.6-5.5-13.6-13c0-7.4 6.2-13.5 13.6-13.5m-74.2 5.1c7.5 0 13.5 6.1 13.5 13.5c0 7.9-6 13.2-13.5 13.2c-7.4 0-13.5-5.3-13.5-13.2c0-7.4 6.1-13.5 13.5-13.5m107 7.8c7.5 0 13.6 6 13.6 13.6c0 7.4-6.1 13.7-13.6 13.7c-7.4 0-13.5-6.3-13.5-13.7c0-7.6 6.1-13.6 13.5-13.6m-140.9 10.5c7.5 0 13.5 5.2 13.5 12.6s-6 13.7-13.5 13.7s-13.5-6.3-13.5-13.7s6-12.6 13.5-12.6m111.2 12.6c7.5 0 13.5 6.3 13.5 13.7s-6 13.7-13.5 13.7s-13.5-6.3-13.5-13.7s6-13.7 13.5-13.7m-76.1 7.4c7.5 0 13.6 6.3 13.6 13.7S226.5 451 219 451c-7.4 0-13.5-6.3-13.5-13.7s6.1-13.7 13.5-13.7m-32.7 14.8c7.5 0 13.5 5.2 13.5 12.6s-6 13.7-13.5 13.7c-7.4 0-13.5-6.3-13.5-13.7s6.1-12.6 13.5-12.6m134.7 2.1c7.5 0 13.5 6.3 13.5 13.7s-6 13.7-13.5 13.7s-13.5-6.3-13.5-13.7s6-13.7 13.5-13.7m-66.5 4.2c7.4 0 13.5 5.3 13.5 12.7c0 7.3-6.1 13.7-13.5 13.7c-7.5 0-13.5-6.4-13.5-13.7c0-7.4 6-12.7 13.5-12.7" strokeWidth="13" stroke="currentColor" />
    </svg>
);

const SalesOrder = () => {
    const navigate = useNavigate();
    // 2. INITIALIZE GLOBAL TOAST
    const { showToast } = useToast();
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');

    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categorySize, setCategorySize] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const [qty, setQty] = useState(1);
    const [remarks, setRemarks] = useState('');
    const [charges, setCharges] = useState({ grab: false, panda: false });
    const [, setOrderChargeType] = useState<'grab' | 'panda' | null>(null);

    const [sugarLevel, setSugarLevel] = useState('100%');
    const [size, setSize] = useState('M');
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

    const [cart, setCart] = useState<CartItem[]>([]);

    useEffect(() => {
        const fetchMenu = async () => {
            const token = localStorage.getItem('lucky_boba_token');
            try {
                const response = await fetch('http://localhost:8000/api/menu', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                });
                const data = await response.json();
                if (Array.isArray(data)) {
                    setCategories(data);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching menu:", error);
                setLoading(false);
            }
        };
        fetchMenu();

        const timer = setInterval(() => setCurrentDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // LOGIC HELPERS
    const isDrink = selectedCategory?.type === 'drink';
    const isWings = selectedCategory?.name === "CHICKEN WINGS";
    const isOz = selectedCategory?.name === "HOT DRINKS" || selectedCategory?.name === "HOT COFFEE";

    const getAddOnsSinkers = () => categories.find(c => c.name === "Add Ons Sinkers")?.menu_items || [];
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const handleNavClick = (label: string) => { if (label === 'Home') navigate('/dashboard'); };

    const handleCategoryClick = (cat: Category) => {
        setSelectedCategory(cat);
        setCategorySize(null);
    };

    const handleBack = () => {
        if ((isDrink || isWings || isOz) && categorySize) {
            setCategorySize(null);
        } else {
            setSelectedCategory(null);
        }
    };

    const cartHasGrab = cart.some(item => item.charges.grab);
    const cartHasPanda = cart.some(item => item.charges.panda);

    const handleItemClick = (item: MenuItem) => {
        setSelectedItem(item);
        setQty(1);
        setRemarks('');
        setCharges(
            cartHasGrab ? { grab: true, panda: false }
                : cartHasPanda ? { grab: false, panda: true }
                    : { grab: false, panda: false }
        );
        setSugarLevel('100%');
        setSize(isDrink && categorySize === 'L' ? 'L' : 'M');
        setSelectedOptions([]);
        setSelectedAddOns([]);
        setIsAddOnModalOpen(false);
    };

    const closeModal = () => { setSelectedItem(null); setIsAddOnModalOpen(false); };
    const adjustQty = (delta: number) => setQty(prev => Math.max(1, prev + delta));

    const toggleCharge = (type: 'grab' | 'panda') => {
        setCharges(prev => ({
            grab: type === 'grab' ? !prev.grab : false,
            panda: type === 'panda' ? !prev.panda : false
        }));
    };

    const toggleOption = (opt: string) => {
        setSelectedOptions(prev => {
            const iceOptions = ['NO ICE', '-ICE', '+ICE', 'WARM'];
            const pearlOptions = ['NO PRL', 'W/ PRL'];
            if (iceOptions.includes(opt)) {
                const withoutIce = prev.filter(o => !iceOptions.includes(o));
                return prev.includes(opt) ? withoutIce : [...withoutIce, opt];
            }
            if (pearlOptions.includes(opt)) {
                const withoutPearls = prev.filter(o => !pearlOptions.includes(o));
                return prev.includes(opt) ? withoutPearls : [...withoutPearls, opt];
            }
            return prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt];
        });
    };

    const toggleAddOn = (addOnName: string) => setSelectedAddOns(prev => prev.includes(addOnName) ? prev.filter(a => a !== addOnName) : [...prev, addOnName]);

    const addToOrder = () => {
        if (!selectedItem || !selectedCategory) return;
        let basePrice = Number(selectedItem.price);
        let extraCost = 0;
        if (charges.grab || charges.panda) extraCost += 10;
        if (isDrink && size === 'L') extraCost += 20;
        if (isWings && categorySize) {
            const pricing: Record<string, number> = { '3pc': 100, '4pc': 120, '6pc': 195, '12pc': 390 };
            basePrice = pricing[categorySize] || 0;
        }
        if (isDrink) {
            const addOnsData = getAddOnsSinkers();
            selectedAddOns.forEach(name => {
                const addon = addOnsData.find(a => a.name === name);
                if (addon) extraCost += Number(addon.price);
            });
        }
        setCart([...cart, { 
            ...selectedItem, 
            name: isWings ? `${selectedItem.name} (${categorySize})` : selectedItem.name, 
            qty, 
            remarks, 
            charges, 
            sugarLevel: isDrink ? sugarLevel : undefined, 
            size: isDrink ? size : undefined, 
            options: isDrink ? selectedOptions : undefined, 
            addOns: isDrink ? selectedAddOns : undefined, 
            finalPrice: (basePrice + extraCost) * qty 
        }]);
        closeModal();
        // 3. SUCCESS TOAST FOR ADDING TO CART
        showToast(`${selectedItem.name} added to order`, 'success');
    };

    const removeFromCart = (index: number) => {
        const itemToRemove = cart[index];
        setCart(prev => prev.filter((_, i) => i !== index));
        showToast(`${itemToRemove.name} removed from order`, 'warning');
    };

    const handleConfirmOrder = async () => {
        if (cart.length === 0) return;
        
        setSubmitting(true);
        const token = localStorage.getItem('lucky_boba_token');

        try {
            const orderData = {
                items: cart.map(item => ({
                    menu_item_id: item.id,
                    name: item.name,
                    quantity: item.qty,
                    unit_price: Number(item.price),
                    total_price: item.finalPrice,
                    size: item.size || null,
                    sugar_level: item.sugarLevel || null,
                    options: item.options || [],
                    add_ons: item.addOns || [],
                    remarks: item.remarks || null,
                    charges: {
                        grab: item.charges.grab,
                        panda: item.charges.panda
                    }
                })),
                subtotal: subtotal,
                total: subtotal
            };

            const response = await fetch('http://localhost:8000/api/sales', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create order');
            }

            // --- SUCCESS FLOW ---
            window.print();
            setCart([]);
            setIsConfirmModalOpen(false);
            
            // 4. CALL GLOBAL SUCCESS TOAST
            showToast('Order confirmed and receipt printed!', 'success');
            
            } catch (error) {
                console.error('Error creating order:', error);
                
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : 'Failed to create order. Please try again.';

                // 5. CALL GLOBAL ERROR TOAST
                showToast(errorMessage, 'error');
            } finally {
                setSubmitting(false);
            }
    };

    const subtotal = cart.reduce((acc, item) => acc + item.finalPrice, 0);
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);

    const mediumDrinks = cart.filter(item => item.size === 'M');
    const largeDrinks = cart.filter(item => item.size === 'L');
    const otherItems = cart.filter(item => !item.size);

    const filteredCategories = categories.map(cat => ({
        ...cat,
        menu_items: cat.menu_items.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.menu_items.length > 0
    );
    
    if (loading) return <div className="h-screen flex items-center justify-center font-black text-[#3b2063]">LUCKY BOBA IS LOADING...</div>;

    return (
        <>
            <style>
                {`@media print { @page { size: 60mm auto; margin: 0; } html, body { width: 60mm; margin: 0; padding: 0; } body * { visibility: hidden; } .printable-receipt-container, .printable-receipt-container * { visibility: visible; } .printable-receipt-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 5mm 4mm; box-sizing: border-box; background: white; color: black; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 600; line-height: 1.2; } .receipt-header { text-align: center; margin-bottom: 8px; border-bottom: 1px dashed black; padding-bottom: 5px; } .receipt-header h1 { font-size: 16px; margin: 0; font-weight: 800; } .receipt-header p { margin: 0; font-size: 10px; } .group-header { font-weight: 800; border-bottom: 1px solid black; margin: 8px 0 2px 0; font-size: 10px; text-transform: uppercase; } .item-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-weight: 700; } .modifier-row { display: flex; justify-content: space-between; font-size: 10px; padding-left: 8px; color: #000; font-weight: normal; } .total-section { border-top: 2px dashed black; margin-top: 10px; padding-top: 5px; font-weight: 900; font-size: 14px; } .total-section .item-row { margin-bottom: 0; } .footer-text { text-align: center; font-size: 9px; margin-top: 15px; padding-top: 5px; border-top: 1px dashed black; font-style: italic; } }`}
            </style>

            <div className="flex flex-col h-screen w-screen bg-[#f8f6ff] relative overflow-hidden font-sans print:hidden">
                
                {/* MODAL: ITEM SELECTION */}
                {selectedItem && !isAddOnModalOpen && !isConfirmModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            
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
                                        <span className="text-sm font-black text-[#3b2063]">{selectedItem.barcode}</span>
                                    </div>
                                    <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Total Unit Price</span>
                                        <span className="text-sm font-black text-[#3b2063]">₱ {Number(selectedItem.price).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-2 border border-zinc-100">
                                    <button onClick={() => adjustQty(-1)} className="w-12 h-12 bg-white rounded-xl shadow-sm border border-zinc-200 text-[#3b2063] hover:text-red-500 transition-colors flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
                                    </button>
                                    <input type="text" value={qty} readOnly className="bg-transparent text-center font-black text-2xl text-[#3b2063] w-20 outline-none" />
                                    <button onClick={() => adjustQty(1)} className="w-12 h-12 bg-[#3b2063] rounded-xl shadow-lg text-white transition-colors flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    </button>
                                </div>

                                {isDrink && (
                                    <>
                                        <div>
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

                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-2 block">Extra</label>
                                            <button 
                                                onClick={() => setIsAddOnModalOpen(true)}
                                                className="w-full py-4 rounded-xl border-2 border-dashed border-[#3b2063]/30 bg-[#f0ebff]/50 hover:bg-[#f0ebff] text-[#3b2063] font-black uppercase tracking-wider text-xs flex items-center justify-center transition-all group"
                                            >
                                                <span className="mr-2">
                                                    {selectedAddOns.length > 0 
                                                        ? `${selectedAddOns.length} Add-on(s) Selected` 
                                                        : 'Select Add-ons'}
                                                </span>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-2 block">Options (Free)</label>
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
                                        <button
                                            type="button"
                                            onClick={() => !cartHasPanda && toggleCharge('grab')}
                                            disabled={cartHasPanda}
                                            className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${cartHasPanda ? 'border-zinc-100 bg-zinc-50 text-zinc-300 opacity-60 cursor-not-allowed' : charges.grab ? 'border-green-500 bg-green-50 text-green-700' : 'border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-green-200'}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="12" viewBox="0 0 522.6 201.3" className="shrink-0" aria-hidden>
                                                <path fill="#00b45e" d="M415.9 63.4V0h13v54.5c-3.6 1.8-8.5 5.2-13 8.9zm-22.6 19.1c4-4.8 8.1-9.6 13-13.7V0h-13v82.5zm-150.6 50.4c0 16.9 6.7 33 19 45.3 12.2 12.2 28.3 19 45.3 19 7.2 0 14.6-1.5 19.8-4.1v-13c-6.1 2.6-13.5 4.1-19.8 4.1-27.8 0-51.2-23.4-51.2-51.2v-11.7c0-27.8 23.5-51.2 51.2-51.2 13.8 0 26.7 5.3 36.3 14.9 9.6 9.6 14.9 22.5 14.9 36.3v76h13v-78.5c-.8-16.6-7.9-32.1-19.9-43.7-12.1-11.6-27.8-18-44.3-18-16.9 0-33 6.7-45.3 19-12.2 12.2-19 28.3-19 45.3v11.5zm194.6-31.2c5.9-5.9 13.5-9.2 21-9.2 16.1 0 28.6 12.6 28.6 28.6v11.7c0 16.1-12.6 28.6-28.6 28.6-7.8 0-15.3-4.3-21.2-12-5.2-6.8-8.6-16.1-9.1-24.4l-10.5 13c2.1 9.8 7.2 19.3 14.5 25.9 7.5 6.8 16.9 10.6 26.3 10.6 23 0 41.7-18.7 41.7-41.6v-11.7c0-10.9-4.4-21.3-12.4-29.2-8-8-18.4-12.4-29.3-12.4-6.9 0-17.8 2.5-30.8 14.2-3.5 3.5-11.7 11.7-16.7 17.5-8.4 9.2-20.5 22.9-30.9 36.8v20.3c11.5-14.8 18.1-23.1 29-35.6 9.6-11.4 21.6-25.1 28.4-31.1zM130.1 77.2V61.8c-11.8-6.3-24.6-9.1-41.6-9.1-17.4 0-33.9 6.4-46.4 17.9-12.6 11.6-19.5 26.8-19.5 43v4.2c0 33.6 26.9 60.9 60.1 60.9 26.9 0 38-8.8 40.8-11.6V128h-44v13h31.8v19.6h-.1c-4.1 1.6-12.6 5-28.5 5-12.6 0-24.5-4.9-33.3-13.9-8.9-9-13.7-21-13.7-34v-4.2c0-25.9 24.2-47.9 52.9-47.9 19.7.1 31.5 3.4 41.5 11.6zm94.8 15.3c4.9 0 9.1.8 12.5 2.4 1.6-4 3.3-7.4 5.7-11.4-3.5-2.5-12-4.1-18.2-4.1-23.7 0-41.6 17.9-41.6 41.7v76h13v-76c0-16.8 11.7-28.6 28.6-28.6zM0 113.6v4.2c0 22.6 8.6 43.6 24.1 59.3 15.5 15.6 36.3 24.2 58.5 24.2 17.9 0 33.7-4 47.1-12 11-6.6 15.9-13.2 16.3-13.8v-70H79.5v13H133v53.1c-6.3 6.3-21.2 16.8-50.3 16.8-19 0-36.6-7.3-49.6-20.5-12.9-13.1-20-30.9-20-50v-4.2c0-18.1 8.1-36.1 22.3-49.4 14.5-13.6 33.4-21.1 53.2-21.1 18.5 0 31.3 2.8 41.6 9.1V37.6C119.4 33 106.5 31 88.5 31 40.5 31 0 68.8 0 113.6zm348.5 83.5v-76c0-23.4-18.3-41.7-41.7-41.7-10.9 0-21.3 4.4-29.3 12.4s-12.4 18.4-12.4 29.2v11.7c0 22.6 19.1 41.6 41.6 41.6 6.2 0 14.6-1.5 19.8-5.8V155c-5.1 4.1-12.4 6.5-19.8 6.5-16 0-28.6-12.6-28.6-28.6v-11.7c0-16.1 12.6-28.6 28.6-28.6 16.1 0 28.6 12.6 28.6 28.6v76h13.2zM224.9 69.9c8.8 0 16.5 1.9 23.4 5.8 3.2-4.1 6.5-7.3 9-9.8-7.3-5.6-19.7-9-32.3-9-18.1 0-34.5 6.5-46.2 18.4-11.6 11.7-18 28-18 45.9v76h13v-76c-.1-30.2 20.9-51.3 51.1-51.3zm278.7 6c-12.2-12.2-28.3-19-45.3-19-12.4 0-24.8 4.6-31.7 9.2-14.2 9.4-25.8 19.7-46.8 46.8v19.5c17.8-23.2 34.6-41.4 47.4-51.5 8.4-6.7 20.3-10.9 31.1-10.9 27.8 0 51.2 23.5 51.2 51.2v11.7c0 13.7-5.4 26.6-15.2 36.3-9.7 9.6-22.5 14.9-36 14.9-22.8 0-42.9-15.7-48.3-37l-9.2 11.1c6.7 22.4 30.9 38.9 57.5 38.9 17 0 33-6.8 45.3-19 12.2-12.3 19-28.3 19-45.3v-11.7c0-16.9-6.8-33-19-45.2z"/>
                                            </svg>
                                            <span className="font-bold text-xs uppercase">Grab Food</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => !cartHasGrab && toggleCharge('panda')}
                                            disabled={cartHasGrab}
                                            className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${cartHasGrab ? 'border-zinc-100 bg-zinc-50 text-zinc-300 opacity-60 cursor-not-allowed' : charges.panda ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-pink-200'}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" className="shrink-0" aria-hidden>
                                                <path fill="#d70f64" d="M44,24c0-0.129-0.017-0.253-0.019-0.381c-0.01-0.414-0.028-0.827-0.062-1.234c-0.028-0.348-0.068-0.691-0.114-1.033c-0.023-0.168-0.049-0.335-0.077-0.502c-0.454-2.859-1.497-5.519-3.027-7.838c1.104-0.892,1.67-2.305,1.67-3.864c0-2.94-2.368-5.146-5.336-5.146c-1.785,0-3.315,0.771-4.234,2.061C30.142,4.754,27.163,4,24,4c-3.161,0-6.14,0.753-8.797,2.059C14.277,4.766,12.756,4,10.966,4C8.065,3.969,5.682,6.267,5.63,9.146c0.024,1.457,0.628,2.841,1.671,3.861c-1.536,2.329-2.582,5-3.033,7.872c-0.033,0.201-0.065,0.401-0.092,0.603c-0.035,0.276-0.067,0.552-0.09,0.832c-0.042,0.473-0.066,0.949-0.072,1.426C4.012,23.828,4,23.912,4,24c0,0.021,0.003,0.041,0.003,0.062c0,0.027-0.003,0.055-0.003,0.082c0.003,10.084,7.584,18.392,17.396,19.667C22.25,43.923,23.115,44,24,44c0,0,0,0,0,0c0.04,0,0.078-0.006,0.117-0.006c0.792-0.005,1.569-0.066,2.336-0.16C36.337,42.627,43.994,34.284,44,24.15c0-0.029-0.003-0.058-0.003-0.087C43.997,24.042,44,24.021,44,24z M24,42c-9.925,0-18-8.075-18-18S14.075,6,24,6s18,8.075,18,18S33.925,42,24,42z"/>
                                                <path fill="#d70f64" d="M23.997,33.25c2.73,0,5.003-1.912,5.003-4.262H19c0,2.351,2.118,4.262,5.003,4.262H23.997z"/>
                                                <path fill="#d70f64" d="M24.034,27.536c0.302,0.145,3.415-1.03,3.415-2.506c0-0.885-2.52-1.03-3.415-1.03c-0.896,0-3.404,0.145-3.404,1.03c-0.146,1.476,3.113,2.651,3.41,2.506H24.034z"/>
                                                <path fill="#d70f64" d="M35.545,15.13c-1.775-1.219-5.627-1.831-7.111,0.156c0,0-1.926,2.137,0,4.273c1.926,2.137,3.259,4.285,3.707,5.966c0.448,1.831,1.181,2.443,2.52,2.443c1.338,0,3.998-2.137,4.44-5.654C39.329,19.418,37.953,16.638,35.545,15.13z M32,20c-0.573,0-1-0.43-1-0.995s0.432-1,1-1s1,0.43,1,1C33,19.575,32.568,20,32,20z"/>
                                                <path fill="#d70f64" d="M12.444,15.13c-1.78,1.219-3.852,3.667-3.555,7.184c0.297,3.517,2.967,5.654,4.446,5.654c1.333,0,2.072-0.762,2.52-2.443c0.448-1.836,1.926-3.823,3.701-5.96c1.926-2.293,0-4.279,0-4.279C18.077,13.299,14.224,13.911,12.444,15.13z M16.008,20v-0.005c-0.575,0-1.008-0.426-1.008-0.992S15.434,18,16.008,18c0.574,0,1.003,0.431,1.003,1.003S16.577,20,16.008,20z"/>
                                            </svg>
                                            <span className="font-bold text-xs uppercase">Food Panda</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-2 block">Remarks</label>
                                    <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Additional notes..." className="w-full p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] resize-none h-16 outline-none transition-all" />
                                </div>

                                <button onClick={addToOrder} className="w-full bg-[#3b2063] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg hover:bg-[#2a1647]">Add Order</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: ADD-ONS */}
                {isAddOnModalOpen && (
                    <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
                        <div className="bg-white w-full max-w-lg rounded-4xl shadow-2xl flex flex-col h-[80vh]">
                            <div className="bg-[#3b2063] p-6 text-white text-center relative shrink-0 rounded-t-4xl">
                                <h2 className="text-lg font-black uppercase tracking-wider">Select Add-ons</h2>
                                <button onClick={() => setIsAddOnModalOpen(false)} className="absolute top-6 right-6 text-white font-bold text-xs bg-white/20 px-3 py-1.5 rounded-lg">Done</button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {getAddOnsSinkers().map((addon) => (
                                        <button
                                            key={addon.id}
                                            onClick={() => toggleAddOn(addon.name)}
                                            className={`p-3 rounded-xl text-left border-2 transition-all h-24 flex flex-col justify-between ${
                                                selectedAddOns.includes(addon.name)
                                                ? 'bg-[#3b2063] border-[#3b2063] text-white'
                                                : 'bg-white border-zinc-100 text-zinc-500 hover:bg-zinc-50'
                                            }`}
                                        >
                                            <span className="text-[10px] font-black uppercase leading-tight">{addon.name}</span>
                                            <span className="text-xs font-bold">₱{Number(addon.price).toFixed(2)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="p-4 border-t border-zinc-100 bg-zinc-50 rounded-b-4xl">
                                <button onClick={() => setIsAddOnModalOpen(false)} className="w-full bg-[#3b2063] text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg">Confirm Selection ({selectedAddOns.length})</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: CONFIRM ORDER */}
                {isConfirmModalOpen && (
                    <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
                            <div className="bg-[#3b2063] p-6 text-white text-center">
                                <h2 className="text-xl font-black uppercase tracking-widest">Confirm Order</h2>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar bg-zinc-50">
                                {cart.length === 0 ? <p className="text-center text-zinc-400 font-bold text-sm py-8">Cart is empty.</p> : (
                                    <div className="space-y-4">
                                        {cart.map((item, i) => (
                                            <div key={i} className="flex justify-between items-start border-b border-zinc-200 pb-3 last:border-0">
                                                <div>
                                                    <p className="font-bold text-sm text-[#3b2063]">{item.qty}x {item.name}</p>
                                                    <div className="text-[10px] text-zinc-500 mt-1 ml-2">
                                                        {item.sugarLevel != null && <p key="sugar">• Sugar {item.sugarLevel}</p>}
                                                        {item.options?.map(o => <p key={o}>• {o}</p>)}
                                                        {item.addOns?.map(a => <p key={a}>• + {a}</p>)}
                                                    </div>
                                                </div>
                                                <p className="font-black text-sm">₱ {item.finalPrice.toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-white border-t border-zinc-100 space-y-3">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-xs font-bold text-zinc-400 uppercase">Total Amount</span>
                                    <span className="text-3xl font-black text-[#3b2063]">₱ {subtotal.toFixed(2)}</span>
                                </div>
                                <button 
                                    onClick={handleConfirmOrder} 
                                    disabled={cart.length === 0 || submitting} 
                                    className="w-full bg-[#3b2063] text-white py-4 rounded-xl font-black uppercase tracking-widest disabled:bg-zinc-300"
                                >
                                    {submitting ? 'Processing...' : 'Print Receipt'}
                                </button>
                                <button onClick={() => { setIsConfirmModalOpen(false); setOrderChargeType(null); }} className="w-full bg-white border-2 border-zinc-100 text-zinc-500 py-4 rounded-xl font-bold uppercase tracking-widest">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* HEADER */}
                <div className="flex gap-4 p-4 border-b border-zinc-200 bg-white items-stretch h-24 shrink-0 shadow-sm z-20">
                    <div className="flex gap-2">
                        {['Home', 'Cat', 'Kit', 'Bar', 'Bill'].map((label) => (
                            <button key={label} onClick={() => handleNavClick(label)} className="bg-[#3b2063] text-white w-20 h-full rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md hover:bg-[#2a1647] transition-all flex flex-col items-center justify-center gap-1">
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 bg-zinc-50 rounded-2xl p-2 flex gap-2 shadow-inner border border-zinc-200">
                        <input 
                            type="text" 
                            placeholder="Search Item..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent px-4 font-bold text-zinc-700 outline-none uppercase placeholder:text-zinc-300 text-sm" 
                        />
                    </div>
                    <div className="flex flex-col gap-2 w-56">
                        <div className="flex-1 bg-white border border-zinc-100 rounded-xl flex items-center justify-center text-[#3b2063] font-black uppercase text-[10px]">Main Branch - QC</div>
                        <div className="flex-1 bg-[#3b2063] rounded-xl flex items-center justify-center text-white text-center">
                            <div>
                                <div className="text-[10px] font-bold uppercase leading-none opacity-80">{formatDate(currentDate)}</div>
                                <div className="text-sm font-black leading-none">{formatTime(currentDate)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MAIN BODY */}
                <div className="flex flex-1 overflow-hidden relative z-10">
                    <div className="flex-1 overflow-y-auto p-6 bg-[#f8f6ff]">
                        {selectedCategory ? (
                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-4 mb-6 sticky top-0 z-10 bg-[#f8f6ff] py-2">
                                    <button onClick={handleBack} className="bg-white p-3 rounded-xl shadow-sm border border-zinc-200 text-[#3b2063]">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                                    </button>
                                    <h2 className="text-[#3b2063] font-black text-xl uppercase tracking-wide">
                                        {selectedCategory.name} {categorySize && <span className="opacity-50"> &bull; {categorySize}</span>}
                                    </h2>
                                </div>
                                
                                {/* SIZE/QTY SELECTION BEFORE ITEMS */}
                                {(isDrink || isOz || isWings) && !categorySize ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-6">
                                        <h3 className="text-xl font-bold text-zinc-400 uppercase">
                                            {isWings ? "Select Quantity" : "Select Size/Qty"}
                                        </h3>
                                        
                                        {isWings ? (
                                            <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                                                {WINGS_QUANTITIES.map((qty) => (
                                                    <button 
                                                        key={qty}
                                                        onClick={() => setCategorySize(qty)}
                                                        className="h-48 bg-white rounded-3xl shadow-lg border-2 border-transparent hover:border-[#3b2063] transition-all flex flex-col items-center justify-center group font-black uppercase text-[#3b2063] text-2xl"
                                                    >
                                                        {qty}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex gap-6 w-full max-w-lg">
                                                <button onClick={() => setCategorySize('M')} className="flex-1 h-56 bg-white rounded-3xl shadow-lg border-2 border-transparent hover:border-[#3b2063] transition-all flex flex-col items-center justify-center group font-black uppercase text-[#3b2063]">
                                                    <DrinkIcon className="w-16 h-16 mb-4 opacity-80" />
                                                    <span>Medium / Sm</span>
                                                </button>
                                                <button onClick={() => setCategorySize('L')} className="flex-1 h-56 bg-white rounded-3xl shadow-xl border-2 border-transparent hover:border-[#3b2063] hover:scale-105 transition-all flex flex-col items-center justify-center group font-black uppercase text-[#3b2063]">
                                                    <DrinkIcon className="w-24 h-24 mb-4" />
                                                    <span>Large / Lg</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-20">
                                        {selectedCategory.menu_items
                                            .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((item) => (
                                                <button key={item.id} onClick={() => handleItemClick(item)} className="bg-white hover:bg-[#3b2063] hover:text-white text-[#3b2063] p-4 rounded-2xl shadow-sm border border-zinc-100 h-24 text-xs uppercase font-bold text-center">
                                                    {item.name}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-20 animate-in fade-in zoom-in duration-300">
                                {filteredCategories.map((cat) => (
                                    <button key={cat.id} onClick={() => handleCategoryClick(cat)} className="bg-white hover:bg-[#3b2063] hover:text-white text-[#3b2063] font-bold text-[10px] uppercase p-3 rounded-2xl h-24 shadow-sm border border-zinc-100 transition-all">
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SIDEBAR CART */}
                    <div className="w-96 bg-white border-l border-zinc-200 flex flex-col shrink-0 shadow-2xl z-30">
                        <div className="bg-zinc-50 border-b border-zinc-200 p-4 text-center">
                            <h2 className="text-[#3b2063] font-black uppercase text-xs">Current Order</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-white relative">
                            {cart.length === 0 ? <p className="text-center mt-20 text-zinc-200 font-black uppercase text-[10px]">No Items</p> : (
                                <div className="space-y-2">
                                    {cart.map((item, index) => (
                                        <div key={index} className="flex justify-between items-start gap-2 bg-zinc-50 p-3 rounded-xl border border-zinc-100 group">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <p className="font-bold text-xs text-[#3b2063]">{item.name}</p>
                                                    {item.charges.grab && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="8" viewBox="0 0 522.6 201.3" className="shrink-0" aria-hidden>
                                                            <path fill="#00b45e" d="M415.9 63.4V0h13v54.5c-3.6 1.8-8.5 5.2-13 8.9zm-22.6 19.1c4-4.8 8.1-9.6 13-13.7V0h-13v82.5zm-150.6 50.4c0 16.9 6.7 33 19 45.3 12.2 12.2 28.3 19 45.3 19 7.2 0 14.6-1.5 19.8-4.1v-13c-6.1 2.6-13.5 4.1-19.8 4.1-27.8 0-51.2-23.4-51.2-51.2v-11.7c0-27.8 23.5-51.2 51.2-51.2 13.8 0 26.7 5.3 36.3 14.9 9.6 9.6 14.9 22.5 14.9 36.3v76h13v-78.5c-.8-16.6-7.9-32.1-19.9-43.7-12.1-11.6-27.8-18-44.3-18-16.9 0-33 6.7-45.3 19-12.2 12.2-19 28.3-19 45.3v11.5zm194.6-31.2c5.9-5.9 13.5-9.2 21-9.2 16.1 0 28.6 12.6 28.6 28.6v11.7c0 16.1-12.6 28.6-28.6 28.6-7.8 0-15.3-4.3-21.2-12-5.2-6.8-8.6-16.1-9.1-24.4l-10.5 13c2.1 9.8 7.2 19.3 14.5 25.9 7.5 6.8 16.9 10.6 26.3 10.6 23 0 41.7-18.7 41.7-41.6v-11.7c0-10.9-4.4-21.3-12.4-29.2-8-8-18.4-12.4-29.3-12.4-6.9 0-17.8 2.5-30.8 14.2-3.5 3.5-11.7 11.7-16.7 17.5-8.4 9.2-20.5 22.9-30.9 36.8v20.3c11.5-14.8 18.1-23.1 29-35.6 9.6-11.4 21.6-25.1 28.4-31.1zM130.1 77.2V61.8c-11.8-6.3-24.6-9.1-41.6-9.1-17.4 0-33.9 6.4-46.4 17.9-12.6 11.6-19.5 26.8-19.5 43v4.2c0 33.6 26.9 60.9 60.1 60.9 26.9 0 38-8.8 40.8-11.6V128h-44v13h31.8v19.6h-.1c-4.1 1.6-12.6 5-28.5 5-12.6 0-24.5-4.9-33.3-13.9-8.9-9-13.7-21-13.7-34v-4.2c0-25.9 24.2-47.9 52.9-47.9 19.7.1 31.5 3.4 41.5 11.6zm94.8 15.3c4.9 0 9.1.8 12.5 2.4 1.6-4 3.3-7.4 5.7-11.4-3.5-2.5-12-4.1-18.2-4.1-23.7 0-41.6 17.9-41.6 41.7v76h13v-76c0-16.8 11.7-28.6 28.6-28.6zM0 113.6v4.2c0 22.6 8.6 43.6 24.1 59.3 15.5 15.6 36.3 24.2 58.5 24.2 17.9 0 33.7-4 47.1-12 11-6.6 15.9-13.2 16.3-13.8v-70H79.5v13H133v53.1c-6.3 6.3-21.2 16.8-50.3 16.8-19 0-36.6-7.3-49.6-20.5-12.9-13.1-20-30.9-20-50v-4.2c0-18.1 8.1-36.1 22.3-49.4 14.5-13.6 33.4-21.1 53.2-21.1 18.5 0 31.3 2.8 41.6 9.1V37.6C119.4 33 106.5 31 88.5 31 40.5 31 0 68.8 0 113.6zm348.5 83.5v-76c0-23.4-18.3-41.7-41.7-41.7-10.9 0-21.3 4.4-29.3 12.4s-12.4 18.4-12.4 29.2v11.7c0 22.6 19.1 41.6 41.6 41.6 6.2 0 14.6-1.5 19.8-5.8V155c-5.1 4.1-12.4 6.5-19.8 6.5-16 0-28.6-12.6-28.6-28.6v-11.7c0-16.1 12.6-28.6 28.6-28.6 16.1 0 28.6 12.6 28.6 28.6v76h13.2zM224.9 69.9c8.8 0 16.5 1.9 23.4 5.8 3.2-4.1 6.5-7.3 9-9.8-7.3-5.6-19.7-9-32.3-9-18.1 0-34.5 6.5-46.2 18.4-11.6 11.7-18 28-18 45.9v76h13v-76c-.1-30.2 20.9-51.3 51.1-51.3zm278.7 6c-12.2-12.2-28.3-19-45.3-19-12.4 0-24.8 4.6-31.7 9.2-14.2 9.4-25.8 19.7-46.8 46.8v19.5c17.8-23.2 34.6-41.4 47.4-51.5 8.4-6.7 20.3-10.9 31.1-10.9 27.8 0 51.2 23.5 51.2 51.2v11.7c0 13.7-5.4 26.6-15.2 36.3-9.7 9.6-22.5 14.9-36 14.9-22.8 0-42.9-15.7-48.3-37l-9.2 11.1c6.7 22.4 30.9 38.9 57.5 38.9 17 0 33-6.8 45.3-19 12.2-12.3 19-28.3 19-45.3v-11.7c0-16.9-6.8-33-19-45.2z"/>
                                                        </svg>
                                                    )}
                                                    {item.charges.panda && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 48 48" className="shrink-0" aria-hidden>
                                                            <path fill="#d70f64" d="M44,24c0-0.129-0.017-0.253-0.019-0.381c-0.01-0.414-0.028-0.827-0.062-1.234  c-0.028-0.348-0.068-0.691-0.114-1.033c-0.023-0.168-0.049-0.335-0.077-0.502c-0.454-2.859-1.497-5.519-3.027-7.838 c1.104-0.892,1.67-2.305,1.67-3.864c0-2.94-2.368-5.146-5.336-5.146c-1.785,0-3.315,0.771-4.234,2.061C30.142,4.754,27.163,4,24,4   c-3.161,0-6.14,0.753-8.797,2.059C14.277,4.766,12.756,4,10.966,4C8.065,3.969,5.682,6.267,5.63,9.146  c0.024,1.457,0.628,2.841,1.671,3.861c-1.536,2.329-2.582,5-3.033,7.872c-0.033,0.201-0.065,0.401-0.092,0.603  c-0.035,0.276-0.067,0.552-0.09,0.832c-0.042,0.473-0.066,0.949-0.072,1.426C4.012,23.828,4,23.912,4,24    c0,0.021,0.003,0.041,0.003,0.062c0,0.027-0.003,0.055-0.003,0.082c0.003,10.084,7.584,18.392,17.396,19.667    C22.25,43.923,23.115,44,24,44c0,0,0,0,0,0c0.04,0,0.078-0.006,0.117-0.006c0.792-0.005,1.569-0.066,2.336-0.16 C36.337,42.627,43.994,34.284,44,24.15c0-0.029-0.003-0.058-0.003-0.087C43.997,24.042,44,24.021,44,24z M24,42 c-9.925,0-18-8.075-18-18S14.075,6,24,6s18,8.075,18,18S33.925,42,24,42z"/><path fill="#d70f64" d="M23.997,33.25c2.73,0,5.003-1.912,5.003-4.262H19c0,2.351,2.118,4.262,5.003,4.262H23.997z"/><path fill="#d70f64" d="M24.034,27.536c0.302,0.145,3.415-1.03,3.415-2.506c0-0.885-2.52-1.03-3.415-1.03   c-0.896,0-3.404,0.145-3.404,1.03c-0.146,1.476,3.113,2.651,3.41,2.506H24.034z"/><path fill="#d70f64" d="M35.545,15.13c-1.775-1.219-5.627-1.831-7.111,0.156c0,0-1.926,2.137,0,4.273 c1.926,2.137,3.259,4.285,3.707,5.966c0.448,1.831,1.181,2.443,2.52,2.443c1.338,0,3.998-2.137,4.44-5.654 C39.329,19.418,37.953,16.638,35.545,15.13z M32,20c-0.573,0-1-0.43-1-0.995s0.432-1,1-1s1,0.43,1,1C33,19.575,32.568,20,32,20z"/><path fill="#d70f64" d="M12.444,15.13c-1.78,1.219-3.852,3.667-3.555,7.184c0.297,3.517,2.967,5.654,4.446,5.654 c1.333,0,2.072-0.762,2.52-2.443c0.448-1.836,1.926-3.823,3.701-5.96c1.926-2.293,0-4.279,0-4.279 C18.077,13.299,14.224,13.911,12.444,15.13z M16.008,20v-0.005c-0.575,0-1.008-0.426-1.008-0.992S15.434,18,16.008,18 c0.574,0,1.003,0.431,1.003,1.003S16.577,20,16.008,20z"/>
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {item.sugarLevel != null && (
                                                        <span className="bg-[#3b2063]/10 text-[#3b2063] text-[9px] px-1.5 py-0.5 rounded font-bold">Sugar {item.sugarLevel}</span>
                                                    )}
                                                    {item.options?.map(opt => <span key={opt} className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded font-bold">{opt}</span>)}
                                                    {item.addOns?.map(addon => <span key={addon} className="bg-yellow-100 text-yellow-700 text-[9px] px-1.5 py-0.5 rounded font-bold">{addon}</span>)}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(index)}
                                                    className="p-2.5 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    aria-label="Remove item"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                                        <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                                                    </svg>
                                                </button>
                                                <p className="font-black text-sm">₱ {item.finalPrice.toFixed(2)}</p>
                                                <p className="text-[10px] text-zinc-400 font-bold">x {item.qty}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="bg-[#3b2063] text-white p-6 rounded-t-4xl">
                            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                <span className="text-[10px] font-bold uppercase opacity-70">Subtotal</span>
                                <span className="text-3xl font-black">₱ {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="pt-2 flex justify-between items-center mt-2">
                                <button onClick={() => { setOrderChargeType(null); setIsConfirmModalOpen(true); }} disabled={cart.length === 0} className="text-xs font-bold uppercase bg-white text-[#3b2063] px-4 py-2 rounded-full disabled:opacity-50">Confirm Order</button>
                                <div className="text-right">
                                    <span className="text-xs font-bold uppercase opacity-60">Admin User</span>
                                    <span className="block text-[10px] opacity-40 uppercase">Items: {totalCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRINTABLE RECEIPT */}
            <div className="printable-receipt-container hidden print:block">
                <div className="receipt-header">
                    <h1>LUCKY BOBA</h1>
                    <p>Main Branch - Quezon City</p>
                    <p>{formatDate(currentDate)} | {formatTime(currentDate)}</p>
                </div>

                <div className="receipt-body">
                    {mediumDrinks.length > 0 && (
                        <div>
                            <div className="group-header">Medium Drinks</div>
                            {mediumDrinks.map((item, i) => (
                                <div key={i} style={{ marginBottom: '4px' }}>
                                    <div className="item-row">
                                        <span>{item.qty}x {item.name}</span>
                                        <span>{item.finalPrice.toFixed(2)}</span>
                                    </div>
                                    {item.sugarLevel != null && <div className="modifier-row">• Sugar {item.sugarLevel}</div>}
                                    {item.options?.map(o => <div key={o} className="modifier-row">• {o}</div>)}
                                </div>
                            ))}
                        </div>
                    )}

                    {largeDrinks.length > 0 && (
                        <div>
                            <div className="group-header">Large Drinks</div>
                            {largeDrinks.map((item, i) => (
                                <div key={i} style={{ marginBottom: '4px' }}>
                                    <div className="item-row">
                                        <span>{item.qty}x {item.name}</span>
                                        <span>{item.finalPrice.toFixed(2)}</span>
                                    </div>
                                    {item.sugarLevel != null && <div className="modifier-row">• Sugar {item.sugarLevel}</div>}
                                    {item.options?.map(o => <div key={o} className="modifier-row">• {o}</div>)}
                                </div>
                            ))}
                        </div>
                    )}

                    {otherItems.length > 0 && (
                        <div>
                            <div className="group-header">Food & Others</div>
                            {otherItems.map((item, i) => (
                                <div key={i} className="item-row">
                                    <span>{item.qty}x {item.name}</span>
                                    <span>{item.finalPrice.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="total-section">
                    <div className="item-row">
                        <span>TOTAL</span>
                        <span>₱ {subtotal.toFixed(2)}</span>
                    </div>
                </div>

                <div className="footer-text">
                    Thank you for ordering!<br />
                    Follow us @LuckyBoba
                </div>
            </div>
        </> 
    );
};

export default SalesOrder;