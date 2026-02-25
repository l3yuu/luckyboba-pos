"use client"

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { 
    type MenuItem, 
    type Category, 
    type CartItem, 
    SUGAR_LEVELS, 
    EXTRA_OPTIONS, 
    WINGS_QUANTITIES 
} from '../types/index'; 
import { useToast } from '../hooks/useToast';
import api from '../services/api';

const DrinkIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
        <path d="m187.4 22.88l-21.5 4.54l22.7 108.08c7.2-.7 14.6-1.2 22-1.6zM256 147.7c-41.2 0-82.3 3.7-123.5 11.1l-11.6 1.1l4.3 22.1l10.6-2.1c20.1-3.2 40.1-6.3 61.2-7.4l8.4 40.1h22.2l-8.4-42.2c51.6-2.1 104.4 1.1 157.1 9.5l10.6 2.1l4.2-22.1l-11.6-1.1c-41.2-7.4-82.3-11.1-123.5-11.1m-119.1 51.6l26.4 281.3l8.3 1c56.2 9.5 112.3 10.6 168.5 0l8.1-1l26.5-281.3h-22.1l-3.6 37.8H232.2l42.3 202.3l-24.3-9.5l-40.4-192.8h-47.3l-3.6-37.8zm188.8 155.3c7.4 0 13.5 6 13.5 13.5s-6.1 13.5-13.5 13.5c-7.5 0-13.5-6-13.5-13.5s6-13.5 13.5-13.5M292 380.2c7.4 0 13.6 6.1 13.6 13.5c0 7.5-6.2 13-13.6 13s-13.6-5.5-13.6-13c0-7.4 6.2-13.5 13.6-13.5m-74.2 5.1c7.5 0 13.5 6.1 13.5 13.5c0 7.9-6 13.2-13.5 13.2c-7.4 0-13.5-5.3-13.5-13.2c0-7.4 6.1-13.5 13.5-13.5m107 7.8c7.5 0 13.6 6 13.6 13.6c0 7.4-6.1 13.7-13.6 13.7c-7.4 0-13.5-6.3-13.5-13.7c0-7.6 6.1-13.6 13.5-13.6m-140.9 10.5c7.5 0 13.5 5.2 13.5 12.6s-6 13.7-13.5 13.7s-13.5-6.3-13.5-13.7s6-12.6 13.5-12.6m111.2 12.6c7.5 0 13.5 6.3 13.5 13.7s-6 13.7-13.5 13.7s-13.5-6.3-13.5-13.7s6-13.7 13.5-13.7m-76.1 7.4c7.5 0 13.6 6.3 13.6 13.7S226.5 451 219 451c-7.4 0-13.5-6.3-13.5-13.7s6.1-13.7 13.5-13.7m-32.7 14.8c7.5 0 13.5 5.2 13.5 12.6s-6 13.7-13.5 13.7c-7.4 0-13.5-6.3-13.5-13.7s6.1-12.6 13.5-12.6m134.7 2.1c7.5 0 13.5 6.3 13.5 13.7s-6 13.7-13.5 13.7s-13.5-6.3-13.5-13.7s6-13.7 13.5-13.7m-66.5 4.2c7.4 0 13.5 5.3 13.5 12.7c0 7.3-6.1 13.7-13.5 13.7c-7.5 0-13.5-6.4-13.5-13.7c0-7.4 6-12.7 13.5-12.7" strokeWidth="13" stroke="currentColor" />
    </svg>
);

const generateORNumber = () => String(Math.floor(Math.random() * 10000000) + 22253).padStart(10, '0');

const SalesOrder = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const [cashierName, setCashierName] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState<Category[]>(() => {
        const cached = localStorage.getItem('pos_menu_cache');
        return cached ? JSON.parse(cached) : [];
    });
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categorySize, setCategorySize] = useState<string | null>(null);
    const [loading, setLoading] = useState(!localStorage.getItem('pos_menu_cache'));
    const [submitting, setSubmitting] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    
    // --- MODAL STATES ---
    const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); 
    
    const [qty, setQty] = useState(1);
    const [remarks, setRemarks] = useState('');
    
    const [printTarget, setPrintTarget] = useState<'receipt' | 'stickers' | null>(null);

    const [orNumber, setOrNumber] = useState(generateORNumber());
    const [orderCharge, setOrderCharge] = useState<'grab' | 'panda' | null>(null);

    const [sugarLevel, setSugarLevel] = useState('100%');
    const [size, setSize] = useState('M');
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('lucky_boba_token');

        const fetchCashierName = async () => {
            if (!token) { setCashierName('Admin'); return; }
            try {
                const response = await fetch('http://localhost:8000/api/user', {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });
                if (response.ok) {
                    const user = await response.json();
                    const name = user?.name || user?.username || user?.full_name || user?.display_name;
                    setCashierName(name?.trim() || 'Admin');
                } else {
                    setCashierName('Admin');
                }
            } catch { setCashierName('Admin'); }
        };

        const fetchMenu = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/menu', {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });
                const data = await response.json();
                if (Array.isArray(data)) {
                    setCategories(data);
                    localStorage.setItem('pos_menu_cache', JSON.stringify(data));
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching menu:", error);
                setLoading(false);
            }
        };

        fetchCashierName();
        fetchMenu();
        const timer = setInterval(() => setCurrentDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const isDrink = selectedCategory?.type === 'drink';
    const isWings = selectedCategory?.name === "CHICKEN WINGS";
    const isOz = selectedCategory?.name === "HOT DRINKS" || selectedCategory?.name === "HOT COFFEE";

    const getAddOnsSinkers = () => categories.find(c => c.name === "Add Ons Sinkers")?.menu_items || [];
    
    const formattedDate = currentDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const handleNavClick = (label: string) => { if (label === 'Home') navigate('/dashboard'); };
    const handleCategoryClick = (cat: Category) => { setSelectedCategory(cat); setCategorySize(null); };
    const handleBack = () => {
        if ((isDrink || isWings || isOz) && categorySize) setCategorySize(null);
        else setSelectedCategory(null);
    };

    const handleItemClick = (item: MenuItem) => {
        setSelectedItem(item);
        setQty(1);
        setRemarks('');
        setSugarLevel('100%');
        setSize(isDrink && categorySize === 'L' ? 'L' : 'M');
        setSelectedOptions([]);
        setSelectedAddOns([]);
        setIsAddOnModalOpen(false);
    };

    const closeModal = () => { setSelectedItem(null); setIsAddOnModalOpen(false); };
    const adjustQty = (delta: number) => setQty(prev => Math.max(1, prev + delta));

    const toggleOrderCharge = (type: 'grab' | 'panda') => {
        const next = orderCharge === type ? null : type;
        setOrderCharge(next);
        setCart(prevCart => prevCart.map(item => {
            const hadCharge = item.charges.grab || item.charges.panda;
            const baseFinalPrice = hadCharge ? item.finalPrice - (10 * item.qty) : item.finalPrice;
            return {
                ...item,
                charges: { grab: next === 'grab', panda: next === 'panda' },
                finalPrice: next ? baseFinalPrice + (10 * item.qty) : baseFinalPrice,
            };
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

    const toggleAddOn = (addOnName: string) =>
        setSelectedAddOns(prev => prev.includes(addOnName) ? prev.filter(a => a !== addOnName) : [...prev, addOnName]);

    const addToOrder = () => {
        if (!selectedItem || !selectedCategory) return;
        let basePrice = Number(selectedItem.price);
        let extraCost = 0;
        if (orderCharge) extraCost += 10;
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
            charges: { grab: orderCharge === 'grab', panda: orderCharge === 'panda' },
            sugarLevel: isDrink ? sugarLevel : undefined, 
            size: isDrink ? size : undefined, 
            options: isDrink ? selectedOptions : undefined, 
            addOns: isDrink ? selectedAddOns : undefined, 
            finalPrice: (basePrice + extraCost) * qty 
        }]);
        closeModal();
        showToast(`${selectedItem.name} added to order`, 'success');
    };

    const removeFromCart = (index: number) => {
        const itemToRemove = cart[index];
        const newCart = cart.filter((_, i) => i !== index);
        setCart(newCart);
        if (newCart.length === 0) setOrderCharge(null);
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
                    charges: { grab: item.charges.grab, panda: item.charges.panda }
                })),
                subtotal: subtotal,
                total: subtotal,
                cashier_name: cashierName ?? 'Admin'
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
            if (!response.ok) throw new Error(result.message || 'Failed to create order');

            Promise.all([
                api.get('/dashboard/stats'),
                api.get('/inventory')
            ]).catch(e => console.error("Failed to fetch fresh data", e));

            setIsConfirmModalOpen(false);
            setIsSuccessModalOpen(true);
            showToast('Order saved successfully!', 'success');

        } catch (error) {
            console.error('Error creating order:', error);
            showToast(error instanceof Error ? error.message : 'Failed to create order. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // ── PRINT HANDLERS ──
    const handlePrintReceipt = () => {
        setPrintTarget('receipt');
        setTimeout(() => window.print(), 100);
    };

    const handlePrintStickers = () => {
        setPrintTarget('stickers');
        setTimeout(() => window.print(), 100);
    };

    const handleNewOrder = () => {
        setCart([]);
        setOrderCharge(null);
        setOrNumber(generateORNumber());
        setIsSuccessModalOpen(false);
        setPrintTarget(null);
    };

    const subtotal = cart.reduce((acc, item) => acc + item.finalPrice, 0);
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    const hasStickers = cart.some(item => item.sugarLevel !== undefined || item.size === 'M' || item.size === 'L');
    
    const vatableSales = subtotal / 1.12;
    const vatAmount = subtotal - vatableSales;

    const filteredCategories = categories.map(cat => ({
        ...cat,
        menu_items: cat.menu_items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    })).filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.menu_items.length > 0);
    
    const renderStickers = () => {
        const stickers: React.ReactNode[] = [];
        let drinkIndex = 1;

        const totalDrinks = cart.reduce((acc, item) => {
            const isStickerItem = item.sugarLevel !== undefined || item.size === 'M' || item.size === 'L';
            return acc + (isStickerItem ? item.qty : 0);
        }, 0);

        cart.forEach((item, cartIndex) => {
            const isStickerItem = item.sugarLevel !== undefined || item.size === 'M' || item.size === 'L';
            
            if (isStickerItem) {
                // 1. Count how many extra lines are going to be printed
                const extraCount = (item.options?.length || 0) + (item.addOns?.length || 0) + (item.remarks ? 1 : 0);
                
                // 2. Set dynamic layout conditions
                const isCrowded = extraCount >= 3;
                const isVeryCrowded = extraCount >= 5;

                // 3. Assign smaller Tailwind classes if there are too many add-ons
                const paddingClass = isVeryCrowded ? "p-0.5" : "p-1";
                const titleSize = isVeryCrowded ? "text-[10px]" : isCrowded ? "text-[11px]" : "text-[12px]";
                const nameSize = isVeryCrowded ? "text-[8.5px]" : isCrowded ? "text-[10px]" : "text-xs";
                const addOnSize = isVeryCrowded ? "text-[6px]" : isCrowded ? "text-[7px]" : "text-[9px]";
                const gapClass = isVeryCrowded ? "space-y-0 leading-none" : "space-y-0.5 leading-tight";
                const marginClass = isVeryCrowded ? "mb-0" : "mb-1";

                for (let i = 0; i < item.qty; i++) {
                    stickers.push(
                    <div 
                        key={`sticker-${cartIndex}-${i}`} 
                        className={`sticker-area page-break bg-white text-black flex flex-col justify-between items-center h-full w-full ${paddingClass}`} 
                        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
                    >
                        {/* TOP SECTION: BRAND, BRANCH & OR NUMBER */}
                        <div className="w-full text-center flex flex-col items-center">
                            <div className={`font-black uppercase leading-none ${titleSize}`}>
                                LUCKY BOBA
                            </div>
                            <div className={`font-bold uppercase leading-none opacity-80 tracking-widest ${isVeryCrowded ? 'text-[5px] mt-0.5' : 'text-[6.5px] mt-1'}`}>
                                Main Branch - QC
                            </div>
                            <div className={`w-full flex justify-between items-center font-bold border-b-[1.5px] border-black px-1 ${isVeryCrowded ? 'text-[6.5px] pb-0 mb-0.5 mt-0.5' : 'text-[7.5px] pb-0.5 mb-1 mt-1'}`}>
                                <span>OR: {orNumber}</span>
                                <span>{drinkIndex}/{totalDrinks}</span>
                            </div>
                        </div>
                        
                        {/* MIDDLE SECTION: DRINK NAME & ADD-ONS */}
                        <div className="w-full text-center flex-1 flex flex-col justify-center items-center px-1 overflow-hidden">
                            <div className={`w-full font-black uppercase leading-tight ${nameSize} ${marginClass}`}>
                                {item.name} {item.size ? `(${item.size})` : ''}
                            </div>
                            
                            <div className={`w-full text-center font-bold ${addOnSize} ${gapClass}`}>
                                {item.sugarLevel != null && <div>Sugar: {item.sugarLevel}</div>}
                                {item.options?.map(opt => <div key={opt}>{opt}</div>)}
                                {item.addOns?.map(a => <div key={a}>+ {a}</div>)}
                            </div>
                            
                            {item.remarks && (
                                <div className={`w-full text-center font-bold border-t border-dashed border-gray-400 ${isVeryCrowded ? 'mt-0.5 pt-0.5' : 'mt-1 pt-1'} ${addOnSize}`}>
                                    Note: {item.remarks}
                                </div>
                            )}
                        </div>
                        
                        {/* BOTTOM SECTION: DATE & TIME */}
                        <div className={`w-full font-semibold text-center border-t border-zinc-200 ${isVeryCrowded ? 'text-[5.5px] pt-0.5 mt-0.5' : 'text-[6.5px] pt-1 mt-1'}`}>
                            {formattedDate} {formattedTime}
                        </div>
                    </div>
                    );
                    drinkIndex++;
                }
            }
        });

        return stickers;
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center font-black text-[#3b2063]">
            LUCKY BOBA IS LOADING...
        </div>
    );

    return (
        <>
<style>
    {`
@media print {
    @page {
        size: 38.5mm 50.8mm; /* Fixed the 38.5.8mm typo! */
        margin: 0;
    }

    body * { visibility: hidden; }
    nav, header, aside, button, .print\\:hidden { display: none !important; }

    .printable-receipt-container, .printable-receipt-container * { 
        visibility: visible !important; 
    }

    .printable-receipt-container {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important; /* Set back to 0 so it aligns perfectly */
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
    }

    /* --- RECEIPT PRINTER STYLES (80mm) --- */
    .receipt-area {
        width: 72mm !important;
        max-width: 72mm !important;
        padding: 4mm !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        color: #000 !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 11px !important;
        line-height: 1.35 !important;
    }

    /* --- LABEL PRINTER STYLES --- */
    .sticker-area {
        width: 38.5mm !important;
        height: 50.8mm !important; 
        padding: 2mm !important; 
        margin: 0 !important;
        box-sizing: border-box !important;
        color: #000 !important;
        
        /* Flexbox modified to stretch content across the whole height */
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important; /* Pushes top to top, bottom to bottom */
        align-items: center !important;     
        text-align: center !important;      
        
        font-family: Arial, Helvetica, sans-serif !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
    }
}
    `}
</style>
            <div className="flex flex-col h-screen w-screen bg-[#f8f6ff] relative overflow-hidden font-sans print:hidden">
                {/* ── MODAL: ITEM SELECTION ── */}
                {selectedItem && !isAddOnModalOpen && !isConfirmModalOpen && !isSuccessModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="bg-[#3b2063] p-5 text-white text-center relative shrink-0">
                                <h2 className="text-lg font-black uppercase tracking-wider">{selectedItem.name}</h2>
                                <button onClick={closeModal} className="absolute top-5 right-6 text-white/50 hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                                        <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest block mb-1">Barcode</span>
                                        <span className="text-sm font-black text-[#3b2063]">{selectedItem.barcode}</span>
                                    </div>
                                    <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                                        <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest block mb-1">Total Unit Price</span>
                                        <span className="text-sm font-black text-[#3b2063]">
                                            ₱ {(Number(selectedItem.price) + (size === 'L' ? 20 : 0)).toFixed(2)}
                                        </span>
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
                                            <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Sugar Level</label>
                                            <div className="flex gap-2">
                                                {SUGAR_LEVELS.map((level) => (
                                                    <button key={level} onClick={() => setSugarLevel(level)}
                                                        className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${sugarLevel === level ? 'bg-[#3b2063] text-white shadow-md' : 'bg-zinc-50 text-zinc-900 border border-zinc-100 hover:bg-zinc-100'}`}>
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Extra</label>
                                            <button onClick={() => setIsAddOnModalOpen(true)}
                                                className="w-full py-4 rounded-xl border-2 border-dashed border-[#3b2063]/30 bg-[#f0ebff]/50 hover:bg-[#f0ebff] text-[#3b2063] font-black uppercase tracking-wider text-xs flex items-center justify-center transition-all group">
                                                <span className="mr-2">{selectedAddOns.length > 0 ? `${selectedAddOns.length} Add-on(s) Selected` : 'Select Add-ons'}</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                                            </button>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Options (Free)</label>
                                            <div className="flex flex-wrap gap-2">
                                                {EXTRA_OPTIONS.map((opt) => (
                                                    <button key={opt} onClick={() => toggleOption(opt)}
                                                        className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${selectedOptions.includes(opt) ? 'bg-[#3b2063] text-white shadow-md' : 'bg-zinc-50 text-zinc-900 border border-zinc-100 hover:bg-zinc-100'}`}>
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Charges (+10.00)</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button type="button" onClick={() => orderCharge !== 'panda' && toggleOrderCharge('grab')} disabled={orderCharge === 'panda'}
                                            className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${
                                                orderCharge === 'panda' ? 'border-zinc-100 bg-zinc-50 text-zinc-300 opacity-40' : orderCharge === 'grab' ? 'border-green-500 bg-green-50 text-green-700' : 'border-zinc-100 bg-zinc-50 text-zinc-400'
                                            }`}>
                                            <span className="font-bold text-xs uppercase">Grab Food</span>
                                        </button>
                                        <button type="button" onClick={() => orderCharge !== 'grab' && toggleOrderCharge('panda')} disabled={orderCharge === 'grab'}
                                            className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${
                                                orderCharge === 'grab' ? 'border-zinc-100 bg-zinc-50 text-zinc-300 opacity-40' : orderCharge === 'panda' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-zinc-100 bg-zinc-50 text-zinc-400'
                                            }`}>
                                            <span className="font-bold text-xs uppercase">Food Panda</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest ml-2 mb-2 block">Remarks</label>
                                    <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Additional notes..."
                                        className="w-full p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] resize-none h-16 outline-none transition-all" />
                                </div>

                                <button onClick={addToOrder} className="w-full bg-[#3b2063] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg hover:bg-[#2a1647]">
                                    Add Order
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── MODAL: ADD-ONS ── */}
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
                                        <button key={addon.id} onClick={() => toggleAddOn(addon.name)}
                                            className={`p-3 rounded-xl text-left border-2 transition-all h-24 flex flex-col justify-between ${selectedAddOns.includes(addon.name) ? 'bg-[#3b2063] border-[#3b2063] text-white' : 'bg-white border-zinc-100 text-zinc-500 hover:bg-zinc-50'}`}>
                                            <span className="text-[10px] font-black uppercase leading-tight">{addon.name}</span>
                                            <span className="text-xs font-bold">₱{Number(addon.price).toFixed(2)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 border-t border-zinc-100 bg-zinc-50 rounded-b-4xl">
                                <button onClick={() => setIsAddOnModalOpen(false)} className="w-full bg-[#3b2063] text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg">
                                    Confirm Selection ({selectedAddOns.length})
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── MODAL: CONFIRM ORDER ── */}
                {isConfirmModalOpen && (
                    <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
                            <div className="bg-[#3b2063] p-6 text-white text-center">
                                <h2 className="text-xl font-black uppercase tracking-widest">Confirm Order</h2>
                                <p className="text-white/60 text-xs mt-1 uppercase">{cashierName ?? 'Admin'}</p>
                            </div>
                            <div className="p-6 flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar bg-zinc-50">
                                {cart.length === 0 ? (
                                    <p className="text-center text-zinc-400 font-bold text-sm py-8">Cart is empty.</p>
                                ) : (
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
                                <button onClick={handleConfirmOrder} disabled={cart.length === 0 || submitting}
                                    className="w-full bg-[#3b2063] text-white py-4 rounded-xl font-black uppercase tracking-widest disabled:bg-zinc-300">
                                    {submitting ? 'Saving Order...' : 'Pay & Submit'}
                                </button>
                                <button onClick={() => setIsConfirmModalOpen(false)}
                                    className="w-full bg-white border-2 border-zinc-100 text-zinc-500 py-4 rounded-xl font-bold uppercase tracking-widest">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── MODAL: SUCCESS / PRINT OPTIONS ── */}
                {isSuccessModalOpen && (
                    <div className="fixed inset-0 z-130 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden text-center">
                            <div className="bg-green-500 p-8 text-white">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="#22c55e" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-widest">Saved!</h2>
                                <p className="text-white/80 font-bold mt-1 text-sm">OR: {orNumber}</p>
                            </div>
                            
                            <div className="p-6 space-y-3">
                                <button onClick={handlePrintReceipt}
                                    className="w-full bg-zinc-100 text-zinc-700 py-4 rounded-xl font-bold uppercase flex justify-center items-center gap-2 hover:bg-zinc-200 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0v3.398c0 .796.604 1.48 1.389 1.554a41.349 41.349 0 0 1 7.722 0c.785.074 1.389-.758 1.389-1.554V7.034Z" /></svg>
                                    Print Main Receipt
                                </button>

                                {hasStickers && (
                                    <button onClick={handlePrintStickers}
                                        className="w-full bg-[#f0ebff] text-[#3b2063] border border-[#3b2063]/20 py-4 rounded-xl font-black uppercase tracking-wider flex justify-center items-center gap-2 hover:bg-[#e4dbff] transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>
                                        Print Drink Stickers
                                    </button>
                                )}

                                <div className="border-t border-zinc-100 my-2 pt-3">
                                    <button onClick={handleNewOrder}
                                        className="w-full bg-[#3b2063] text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-[#2a1647] transition-colors">
                                        Start New Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* ── HEADER ── */}
                <div className="flex gap-4 p-4 border-b border-zinc-200 bg-white items-stretch h-24 shrink-0 shadow-sm z-20">
                    <div className="flex gap-2">
                        {['Home', 'Cat', 'Kit', 'Bar', 'Bill'].map((label) => (
                            <button key={label} onClick={() => handleNavClick(label)}
                                className="bg-[#3b2063] text-white w-20 h-full rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md hover:bg-[#2a1647] transition-all flex flex-col items-center justify-center gap-1">
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 bg-zinc-50 rounded-2xl p-2 flex gap-2 shadow-inner border border-zinc-200">
                        <input type="text" placeholder="Search Item..." value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent px-4 font-bold text-zinc-700 outline-none uppercase placeholder:text-zinc-300 text-sm" />
                    </div>
                    <div className="flex flex-col gap-2 w-56">
                        <div className="flex-1 bg-white border border-zinc-100 rounded-xl flex items-center justify-center text-[#3b2063] font-black uppercase text-[10px]">Main Branch - QC</div>
                        <div className="flex-1 bg-[#3b2063] rounded-xl flex items-center justify-center text-white text-center">
                            <div>
                                <div className="text-[10px] font-bold uppercase leading-none opacity-80">{formattedDate}</div>
                                <div className="text-sm font-black leading-none">{formattedTime}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── MAIN BODY ── */}
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
                                {(isDrink || isOz || isWings) && !categorySize ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-6">
                                        <h3 className="text-xl font-bold text-zinc-400 uppercase">{isWings ? "Select Quantity" : "Select Size/Qty"}</h3>
                                        {isWings ? (
                                            <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                                                {WINGS_QUANTITIES.map((qty) => (
                                                    <button key={qty} onClick={() => setCategorySize(qty)}
                                                        className="h-48 bg-white rounded-3xl shadow-lg border-2 border-transparent hover:border-[#3b2063] transition-all flex flex-col items-center justify-center group font-black uppercase text-[#3b2063] text-2xl">
                                                        {qty}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex gap-6 w-full max-w-lg">
                                                <button onClick={() => setCategorySize('M')} className="flex-1 h-56 bg-white rounded-3xl shadow-lg border-2 border-transparent hover:border-[#3b2063] transition-all flex flex-col items-center justify-center group font-black uppercase text-[#3b2063]">
                                                    <DrinkIcon className="w-16 h-16 mb-4 opacity-80" /><span>Medium / Sm</span>
                                                </button>
                                                <button onClick={() => setCategorySize('L')} className="flex-1 h-56 bg-white rounded-3xl shadow-xl border-2 border-transparent hover:border-[#3b2063] hover:scale-105 transition-all flex flex-col items-center justify-center group font-black uppercase text-[#3b2063]">
                                                    <DrinkIcon className="w-24 h-24 mb-4" /><span>Large / Lg</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-20">
                                        {selectedCategory.menu_items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                                            <button key={item.id} onClick={() => handleItemClick(item)} className="bg-white hover:bg-[#3b2063] hover:text-white text-[#3b2063] p-4 rounded-2xl shadow-sm border border-[#3b2063] h-24 text-xs uppercase font-bold text-center">
                                                {item.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-20 animate-in fade-in zoom-in duration-300">
                                {filteredCategories.map((cat) => (
                                    <button key={cat.id} onClick={() => handleCategoryClick(cat)} className="bg-white hover:bg-[#3b2063] hover:text-white text-[#3b2063] font-bold text-[15px] uppercase p-3 rounded-2xl h-24 shadow-sm border border-[#3b2063] transition-all">
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── SIDEBAR CART ── */}
                    <div className="w-96 bg-white border-l border-zinc-200 flex flex-col shrink-0 shadow-2xl z-30">
                        <div className="bg-zinc-50 border-b border-zinc-200 p-4 text-center">
                            <h2 className="text-[#3b2063] font-black uppercase text-xs">Current Order</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-white relative">
                            {cart.length === 0 ? (
                                <p className="text-center mt-20 text-zinc-200 font-black uppercase text-[10px]">No Items</p>
                            ) : (
                                <div className="space-y-2">
                                    {cart.map((item, index) => (
                                        <div key={index} className="flex justify-between items-start gap-2 bg-zinc-50 p-3 rounded-xl border border-zinc-100 group">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-xs text-[#3b2063]">{item.name}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {item.sugarLevel != null && <span className="bg-[#3b2063]/10 text-[#3b2063] text-[9px] px-1.5 py-0.5 rounded font-bold">Sugar {item.sugarLevel}</span>}
                                                    {item.options?.map(opt => <span key={opt} className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded font-bold">{opt}</span>)}
                                                    {item.addOns?.map(addon => <span key={addon} className="bg-yellow-100 text-yellow-700 text-[9px] px-1.5 py-0.5 rounded font-bold">{addon}</span>)}
                                                    {item.charges?.grab && <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded font-bold">🛵 GrabFood</span>}
                                                    {item.charges?.panda && <span className="bg-pink-100 text-pink-700 text-[9px] px-1.5 py-0.5 rounded font-bold">🐼 FoodPanda</span>}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <button type="button" onClick={() => removeFromCart(index)} className="p-2.5 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
                                <button onClick={() => setIsConfirmModalOpen(true)} disabled={cart.length === 0} className="text-xs font-bold uppercase bg-white text-[#3b2063] px-4 py-2 rounded-full disabled:opacity-50">
                                    Confirm Order
                                </button>
                                <div className="text-right">
                                    <span className="text-xs font-bold uppercase opacity-60">{cashierName ?? 'Admin'}</span>
                                    <span className="block text-[10px] opacity-40 uppercase">Items: {totalCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── PRINT TARGET 1: RECEIPT (80mm) ── */}
            {printTarget === 'receipt' && (
                <div className="printable-receipt-container hidden print:block">
                    <div className="receipt-area bg-white text-slate-800">
                        <div className="text-center">
                            <h1 className="uppercase leading-tight" style={{ fontWeight: 700, fontSize: '24px' }}>
                                LUCKY BOBA MILKTEA<br />FOOD AND BEVERAGE<br />TRADING
                            </h1>
                            <p style={{ fontWeight: 500, fontSize: '17px', margin: '4px 0 0 0' }}>Quezon City</p>
                            <h2 style={{ fontWeight: 800, fontSize: '17px', margin: '8px 0' }}>
                                OR # {orNumber}
                            </h2>
                            <p style={{ fontWeight: 500, fontSize: '13px', margin: '0 0 8px 0' }}>
                                {formattedDate} {formattedTime}
                            </p>
                        </div>
                        <div className="text-[12px] space-y-0.5 mb-2" style={{ fontWeight: 500 }}>
                            <div className="flex-between"><span># 1</span><span>Total Guests: 1</span></div>
                            <div className="flex-between"><span>Regular: 1</span><span>Senior: 0</span></div>
                            <div className="mt-1">Cashier: {cashierName ?? 'Admin'}</div>
                            {orderCharge && <div className="mt-1">Order Type: {orderCharge === 'grab' ? 'GRABFOOD' : 'FOODPANDA'}</div>}
                        </div>
                        <div className="mt-2 mb-2 text-[12px]" style={{ fontWeight: 500 }}>
                            {cart.map((item, i) => (
                                <div key={i} className="mb-1">
                                    <div className="uppercase" style={{ fontWeight: 600 }}>{item.name} {item.size ? `(${item.size})` : ''}</div>
                                    <div className="flex-between">
                                        <span>{item.qty} X {(item.finalPrice / item.qty).toFixed(2)}</span>
                                        <span>{item.finalPrice.toFixed(2)}</span>
                                    </div>
                                    {item.sugarLevel != null && <div className="pl-2 text-[10px] opacity-120">• Sugar {item.sugarLevel}</div>}
                                    {item.options?.map(o => <div key={o} className="pl-2 text-[10px] opacity-120">• {o}</div>)}
                                    {item.addOns?.map(a => <div key={a} className="pl-2 text-[10px] opacity-120">• + {a}</div>)}
                                </div>
                            ))}
                        </div>
                        <div className="text-[12px] space-y-0.5 border-t border-dashed border-black pt-2" style={{ fontWeight: 500 }}>
                            <div className="flex-between"><span>Total Items</span><span>{totalCount}</span></div>
                            <div className="flex-between"><span>Sub Total</span><span>{subtotal.toFixed(2)}</span></div>
                            <div className="flex-between text-[15px] mt-1" style={{ fontWeight: 800 }}>
                                <span>TOTAL</span><span>{subtotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="text-[12px] mt-2 space-y-0.5" style={{ fontWeight: 500 }}>
                            <div>Tendered:</div>
                            <div className="flex-between pl-2"><span>Amount</span><span>{subtotal.toFixed(2)}</span></div>
                            <div className="flex-between pl-2"><span>Type</span><span>CASH</span></div>
                        </div>
                        <div className="text-[11px] mt-2 space-y-0.5" style={{ fontWeight: 500 }}>
                            <div className="flex-between"><span>VATable Sales(V)</span><span>{vatableSales.toFixed(2)}</span></div>
                            <div className="flex-between"><span>VAT Amount</span><span>{vatAmount.toFixed(2)}</span></div>
                            <div className="flex-between"><span>VAT Exempt Sales(E)</span><span>0.00</span></div>
                            <div className="flex-between"><span>Zero-Rated Sales(Z)</span><span>0.00</span></div>
                        </div>
                        <div className="text-[12px] mt-4 space-y-1" style={{ fontWeight: 500 }}>
                            <div className="flex justify-between items-end"><span>Name:</span><span className="border-b border-black w-[70%]"></span></div>
                            <div className="flex justify-between items-end"><span>TIN/ID/SC:</span><span className="border-b border-black w-[70%]"></span></div>
                            <div className="flex justify-between items-end"><span>Address:</span><span className="border-b border-black w-[70%]"></span></div>
                            <div className="flex justify-between items-end"><span>Signature:</span><span className="border-b border-black w-[70%]"></span></div>
                        </div>
                        <div className="mt-6 text-center text-[12px] uppercase opacity-200" style={{ fontWeight: 500 }}>
                            FOR FRANCHISE<br />
                            EMAIL OR CONTACT US ON<br />
                            luckybobafranchising@gmail.com<br />
                            09260029894
                        </div>
                    </div>
                </div>
            )}

            {/* ── PRINT TARGET 2: STICKERS ── */}
            {printTarget === 'stickers' && (
                <div className="printable-receipt-container hidden print:block">
                    {renderStickers()}
                </div>
            )}
        </> 
    );
};

export default SalesOrder;