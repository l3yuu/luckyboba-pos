import { useState, useMemo, useEffect } from 'react';
import { CloseIcon, PAYMENT_METHODS, getItemSurcharge } from './shared';
import type { Discount } from './shared';

const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

interface OnlineOrderItem {
  id?: number;
  qty?: number;
  quantity?: number;
  price?: number;
  unit_price?: number;
  product_name?: string;
  name?: string;
  sugar_level?: string | null;
  cup_size_label?: string;
  size?: string;
  options?: string[];
  add_ons?: Array<{ name?: string; price?: number; addon_name?: string } | string>;
  remarks?: string;
  grab_price?: number;
  panda_price?: number;
}

interface OrderForPayment {
  id: number;
  total_amount?: number;
  total?: number;
  items?: OnlineOrderItem[];
  source?: string;
  branch_name?: string;
}

interface ItemPaxAssignments {
  [key: string]: ('none' | 'sc' | 'pwd')[];
}

interface PaymentModalProps {
  order: OrderForPayment | null;
  discounts?: Discount[];
  vatType?: 'vat' | 'non_vat';
  onClose: () => void;
  onConfirm: (data: {
    paymentMethod: string;
    cashTendered: number | '';
    referenceNumber: string;
    selectedDiscount: Discount | null;
    itemPaxAssignments: ItemPaxAssignments;
    seniorIds: string[];
    pwdIds: string[];
    discountRemarks: string;
    calculations: {
      vatableSales: number;
      vatAmount: number;
      vatExemptSales: number;
      lessVat: number;
      amtDue: number;
      totalDiscountDisplay: number;
    }
  }) => void;
}

export const OnlineOrderPaymentModal = ({ 
  order, 
  discounts = [], 
  vatType = 'vat', 
  onClose, 
  onConfirm 
}: PaymentModalProps) => {
  const [activeTab, setActiveTab] = useState<'payment' | 'discount' | 'pax'>('payment');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashTendered, setCashTendered] = useState<number | ''>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [itemPaxAssignments, setItemPaxAssignments] = useState<ItemPaxAssignments>({});
  const [seniorIds, setSeniorIds] = useState<string[]>([]);
  const [pwdIds, setPwdIds] = useState<string[]>([]);
  const [discountRemarks, setDiscountRemarks] = useState('');

  const isVat = vatType === 'vat';

  // ── Sync assignments when order changes ──────────────────────────────────
  useEffect(() => {
    if (!order) return;
    const initial: ItemPaxAssignments = {};
    (order.items || []).forEach((item, i) => {
      const qty = item.qty ?? item.quantity ?? 1;
      initial[String(i)] = Array(qty).fill('none');
    });
    setItemPaxAssignments(initial);
    // Reset other states
    setPaymentMethod('cash');
    setCashTendered('');
    setReferenceNumber('');
    setSelectedDiscount(null);
    setSeniorIds([]);
    setPwdIds([]);
    setDiscountRemarks('');
    setActiveTab('payment');
  }, [order]);

  // ── Calculations (Synced with SalesOrder.tsx) ─────────────────────────────
  const totals = useMemo(() => {
    if (!order) return null;
    const items = order.items || [];
    const isGrab = order.source === 'grab' || paymentMethod === 'grab';
    const isPanda = order.source === 'panda' || paymentMethod === 'food_panda';

    const cartItems = items.map(item => ({
      ...item,
      qty: item.qty ?? item.quantity ?? 1,
      price: item.unit_price ?? item.price ?? 0,
      charges: { grab: isGrab, panda: isPanda }
    }));

    const grossSubtotal = cartItems.reduce(
      (acc, item) => acc + (Number(item.price) * item.qty) + getItemSurcharge(item as any),
      0
    );

    const eligibleForPromo = cartItems.reduce(
      (acc, item) => acc + Number(item.price) * item.qty + getItemSurcharge(item as any),
      0
    );

    // PAX Discounts
    const scDiscount = discounts.find(d => d.name.toUpperCase().includes('SENIOR'));
    const pwdDiscount = discounts.find(d => d.name.toUpperCase().includes('PWD') || d.name.toUpperCase().includes('DIPLOMAT'));
    const scPct = scDiscount ? Number(scDiscount.amount) : 20;
    const pwdPct = pwdDiscount ? Number(pwdDiscount.amount) : 20;

    let totalPaxDiscount = 0;
    let totalVatExemptSales = 0;

    cartItems.forEach((item, cartIndex) => {
      const assignments = itemPaxAssignments[String(cartIndex)] ?? [];
      assignments.forEach(assignment => {
        if (assignment === 'none') return;
        const unitPrice = Number(item.price);
        const unitVatExcl = isVat ? unitPrice / 1.12 : unitPrice;
        const pct = assignment === 'sc' ? scPct : pwdPct;
        const discAmt = unitVatExcl * (pct / 100);
        totalPaxDiscount += discAmt;
        totalVatExemptSales += unitVatExcl;
      });
    });

    totalPaxDiscount = round(totalPaxDiscount);
    totalVatExemptSales = round(totalVatExemptSales);
    const hasPaxDiscount = totalPaxDiscount > 0;

    // Promo Discount
    const promoDiscount = selectedDiscount
      ? selectedDiscount.type.includes('Percent')
        ? eligibleForPromo * (Number(selectedDiscount.amount) / 100)
        : Number(selectedDiscount.amount)
      : 0;

    const vatExemptSales = isVat && hasPaxDiscount ? Math.max(0, round(totalVatExemptSales - totalPaxDiscount)) : 0;
    const vatableBase = isVat
      ? Math.max(0, round(grossSubtotal - totalVatExemptSales * 1.12 - promoDiscount))
      : 0;
    const vatableSales = isVat ? round(vatableBase / 1.12) : 0;
    const vatAmount = isVat ? round(vatableBase - vatableSales) : 0;
    const lessVat = isVat && hasPaxDiscount ? round(totalVatExemptSales * 0.12) : 0;

    const amtDue = isVat
      ? Math.max(0, round(vatableBase + vatExemptSales))
      : Math.max(0, round(grossSubtotal - promoDiscount));

    const totalDiscountDisplay = totalPaxDiscount + promoDiscount;

    return {
      grossSubtotal,
      vatableSales,
      vatAmount,
      vatExemptSales,
      lessVat,
      amtDue,
      totalDiscountDisplay,
      totalCount: cartItems.reduce((acc, i) => acc + i.qty, 0),
      hasPaxDiscount
    };
  }, [order, itemPaxAssignments, selectedDiscount, paymentMethod, discounts, isVat]);

  if (!order || !totals) return null;

  const { amtDue, totalDiscountDisplay, vatableSales, vatAmount, vatExemptSales, lessVat } = totals;
  const change = cashTendered === '' ? 0 : Math.max(0, Number(cashTendered) - amtDue);

  const totalScUnits = Object.values(itemPaxAssignments).flat().filter(a => a === 'sc').length;
  const totalPwdUnits = Object.values(itemPaxAssignments).flat().filter(a => a === 'pwd').length;
  const hasAnyAssignment = totalScUnits > 0 || totalPwdUnits > 0;

  const typeBadge = (type: 'none' | 'sc' | 'pwd') => {
    if (type === 'sc') return <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">SC</span>;
    if (type === 'pwd') return <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase">PWD</span>;
    return null;
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-6xl rounded-[0.625rem] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] relative text-black">
        
        {/* Header */}
        <div className="bg-[#6a12b8] p-5 text-white text-center shrink-0 shadow-sm z-10 flex justify-between items-center">
          <div className="w-1/3" />
          <div className="w-1/3">
            <h2 className="text-xl font-black uppercase tracking-widest">Payment Details</h2>
            <p className="text-white/60 text-xs mt-1 uppercase">Online / App Order</p>
          </div>
          <div className="w-1/3 text-right">
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <CloseIcon size={6} />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-[50vh] max-h-[85vh] overflow-hidden bg-zinc-50">
          
          {/* Left: Cart summary */}
          <div className="flex-1 flex flex-col bg-white border-r border-zinc-200 overflow-hidden">
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="font-black text-sm text-black uppercase mb-4 tracking-wider">Order Items</h3>
              <div className="space-y-4">
                {(() => {
                  const splitGroups: { cartIndex: number; item: OnlineOrderItem; discountType: 'none' | 'sc' | 'pwd'; count: number }[] = [];
                  (order.items || []).forEach((item, cartIndex) => {
                    const qty = item.qty ?? item.quantity ?? 1;
                    const assignments = itemPaxAssignments[String(cartIndex)] ?? Array(qty).fill('none');
                    const groups: Record<'none' | 'sc' | 'pwd', number> = { none: 0, sc: 0, pwd: 0 };
                    assignments.forEach(a => groups[a]++);
                    (['sc', 'pwd', 'none'] as const).forEach(type => {
                      if (groups[type] > 0) splitGroups.push({ cartIndex, item, discountType: type, count: groups[type] });
                    });
                  });

                  return splitGroups.map((group, gi) => {
                    const { item, discountType, count } = group;
                    const isDiscounted = discountType !== 'none';
                    const unitPrice = Number(item.unit_price ?? item.price ?? 0);
                    
                    let groupPrice: number;
                    if (isDiscounted && isVat) {
                      const vatExcl = unitPrice / 1.12;
                      const discAmt = vatExcl * 0.20;
                      groupPrice = (vatExcl - discAmt) * count;
                    } else {
                      groupPrice = unitPrice * count;
                    }

                    return (
                      <div key={gi} className="pb-3 border-b border-[#e9d5ff] last:border-0 mb-2 px-2 -mx-2 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-black text-sm text-black shrink-0 ml-2">
                              {count}x {item.product_name ?? item.name ?? 'Item'} {discountType !== 'none' && <span className="ml-1">{typeBadge(discountType)}</span>}
                            </p>
                            <div className="text-[10px] text-zinc-500 mt-1 ml-2">
                              {item.sugar_level && <p>• Sugar {item.sugar_level}</p>}
                              {(item.add_ons || []).map((add, ai) => (
                                <p key={ai}>• {typeof add === 'string' ? add : (add.name || add.addon_name)}</p>
                              ))}
                              {item.remarks && <p className="italic">• {item.remarks}</p>}
                            </div>
                          </div>
                          <p className="font-black text-sm text-black shrink-0 ml-2">
                            ₱ {groupPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Totals */}
            <div className="p-6 bg-[#f5f0ff] shrink-0 border-t border-[#e9d5ff]">
              <div className="space-y-1.5 text-[11px] font-bold text-zinc-600">
                <div className="flex justify-between"><span>Items Count</span><span>{totals.totalCount}</span></div>
                <div className="flex justify-between"><span>Gross Total</span><span>₱ {totals.grossSubtotal.toFixed(2)}</span></div>
                
                {isVat && (
                  <>
                    <div className="flex justify-between"><span>VATable Sales</span><span>₱ {vatableSales.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>VAT Amount (12%)</span><span>₱ {vatAmount.toFixed(2)}</span></div>
                    {vatExemptSales > 0 && <div className="flex justify-between"><span>VAT Exempt Sales</span><span>₱ {vatExemptSales.toFixed(2)}</span></div>}
                    {lessVat > 0 && <div className="flex justify-between text-yellow-600"><span>Less VAT</span><span>- ₱ {lessVat.toFixed(2)}</span></div>}
                  </>
                )}

                {totalDiscountDisplay > 0 && (
                  <div className="flex justify-between text-red-500 font-black">
                    <span>Total Discount</span>
                    <span>- ₱ {totalDiscountDisplay.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between font-black text-lg text-[#6a12b8] mt-2 pt-2 border-t border-[#e9d5ff]">
                  <span>Total Due</span>
                  <span>₱ {amtDue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Tabs & Payment */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="flex border-b border-[#e9d5ff] shrink-0 bg-[#f5f0ff] p-2 gap-2">
              {[
                { id: 'payment', label: 'Payment', dot: false },
                { id: 'discount', label: 'Promo', dot: !!selectedDiscount },
                { id: 'pax', label: 'Senior/PWD', dot: hasAnyAssignment },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-[0.625rem] transition-all border-2 relative
                    ${activeTab === tab.id ? 'bg-[#6a12b8] text-white border-[#6a12b8] shadow-md' : 'bg-white text-black border-[#e9d5ff] hover:border-[#6a12b8]/40 hover:bg-[#f5f0ff]'}`}>
                  {tab.label}
                  {tab.dot && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}
                </button>
              ))}
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-black text-sm text-black uppercase mb-3 tracking-wider">Payment Method</h3>
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {PAYMENT_METHODS.map(({ id, label }) => (
                        <button key={id} onClick={() => { setPaymentMethod(id); setReferenceNumber(''); setCashTendered(''); }}
                          className={`py-3 rounded-[0.625rem] font-black text-sm uppercase transition-all border-2 flex flex-col items-center gap-1 ${paymentMethod === id ? 'bg-[#6a12b8] text-white border-[#6a12b8] shadow-md' : 'bg-[#f5f0ff] text-black border-[#e9d5ff] hover:border-[#6a12b8]/40'}`}>
                          {label}
                        </button>
                      ))}
                    </div>

                    {paymentMethod === 'cash' ? (
                      <>
                        <h3 className="font-black text-[10px] text-zinc-400 tracking-widest uppercase mb-2">Cash Tendered</h3>
                        <div className="relative mb-3">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-2xl text-[#6a12b8]/30">₱</span>
                          <input type="number" value={cashTendered} onChange={e => setCashTendered(e.target.value ? Number(e.target.value) : '')}
                            className="w-full bg-[#f5f0ff] border-2 border-[#e9d5ff] rounded-[0.625rem] py-4 pl-12 pr-4 text-3xl font-black text-black outline-none focus:border-[#6a12b8] focus:bg-white transition-colors" placeholder="0.00" />
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                          <button onClick={() => setCashTendered(amtDue)} className="col-span-2 lg:col-span-4 bg-[#6a12b8] text-white py-2.5 rounded-[0.625rem] font-black text-sm uppercase tracking-widest shadow-md">
                            Exact Amount (₱ {amtDue.toFixed(2)})
                          </button>
                          {[100, 200, 500, 1000].map(amount => (
                            <button key={amount} onClick={() => setCashTendered(amount)}
                              className="bg-[#f5f0ff] hover:bg-[#6a12b8] hover:text-white text-black py-3 rounded-[0.625rem] font-black text-base transition-all border-2 border-[#e9d5ff]">
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
                        <h3 className="font-black text-[10px] text-zinc-400 tracking-widest uppercase">Reference Number</h3>
                        <input type="text" value={referenceNumber}
                          onChange={e => setReferenceNumber(e.target.value.replace(/\D/g, '').slice(0, 13))}
                          maxLength={13}
                          className="w-full bg-zinc-50 border-2 border-zinc-300 rounded-[0.625rem] py-4 px-5 text-xl font-black outline-none focus:border-[#6a12b8] focus:bg-white transition-colors"
                          placeholder="REF#" />
                        {['gcash', 'paymaya', 'credit', 'debit'].includes(paymentMethod) && referenceNumber.length < 13 && (
                          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">⚠ Must be 13 digits ({referenceNumber.length}/13)</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'discount' && (
                <div className="space-y-6">
                  <h3 className="font-black text-sm text-[#6a12b8] uppercase tracking-wider">Select Promo</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setSelectedDiscount(null)}
                      className={`p-3 rounded-[0.625rem] text-sm font-black uppercase transition-all border-2 ${!selectedDiscount ? 'bg-red-500 text-white border-red-500' : 'bg-zinc-50 text-red-500 border-red-100'}`}>
                      Remove Promo
                    </button>
                    {discounts.filter(d => !['SENIOR', 'PWD', 'DIPLOMAT'].some(x => d.name.toUpperCase().includes(x))).map(d => (
                      <button key={d.id} onClick={() => setSelectedDiscount(d)}
                        className={`p-3 rounded-[0.625rem] text-sm font-black uppercase transition-all border-2 ${selectedDiscount?.id === d.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-zinc-50 text-zinc-600 border-zinc-200'}`}>
                        {d.name} ({d.amount}{d.type.includes('Percent') ? '%' : ' OFF'})
                      </button>
                    ))}
                  </div>
                  <textarea value={discountRemarks} onChange={e => setDiscountRemarks(e.target.value)}
                    placeholder="Discount Remarks..."
                    className="w-full text-sm font-bold p-4 bg-zinc-50 border-2 border-zinc-200 rounded-[0.625rem] h-24 resize-none" />
                </div>
              )}

              {activeTab === 'pax' && (
                <div className="space-y-4">
                  {(totalScUnits > 0 || totalPwdUnits > 0) && (
                    <div className="space-y-4">
                      {totalScUnits > 0 && (
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Senior ID(s)</label>
                          {seniorIds.map((id, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                              <input type="text" value={id} onChange={e => { const n = [...seniorIds]; n[idx] = e.target.value; setSeniorIds(n); }}
                                className="flex-1 px-3 py-2 border-2 border-zinc-200 rounded-lg font-bold text-sm" placeholder={`ID ${idx+1}`} />
                            </div>
                          ))}
                          <button onClick={() => setSeniorIds([...seniorIds, ''])} className="text-[10px] font-black text-blue-600 uppercase">+ Add ID</button>
                        </div>
                      )}
                      {totalPwdUnits > 0 && (
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">PWD ID(s)</label>
                          {pwdIds.map((id, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                              <input type="text" value={id} onChange={e => { const n = [...pwdIds]; n[idx] = e.target.value; setPwdIds(n); }}
                                className="flex-1 px-3 py-2 border-2 border-zinc-200 rounded-lg font-bold text-sm" placeholder={`ID ${idx+1}`} />
                            </div>
                          ))}
                          <button onClick={() => setPwdIds([...pwdIds, ''])} className="text-[10px] font-black text-purple-600 uppercase">+ Add ID</button>
                        </div>
                      )}
                    </div>
                  )}

                  <h3 className="font-black text-sm text-[#6a12b8] uppercase tracking-wider">Assign Discount Per Item</h3>
                  {(order.items || []).map((item, cartIndex) => {
                    const qty = item.qty ?? item.quantity ?? 1;
                    const assignments = itemPaxAssignments[String(cartIndex)] ?? Array(qty).fill('none');
                    return (
                      <div key={cartIndex} className="border-2 rounded-xl overflow-hidden mb-3 border-zinc-200 bg-white">
                        <div className="px-4 py-2 bg-zinc-50 flex justify-between items-center">
                          <span className="font-black text-xs uppercase">{item.product_name ?? item.name}</span>
                          <span className="text-[10px] text-zinc-400">₱{Number(item.unit_price ?? item.price).toFixed(2)}/unit</span>
                        </div>
                        <div className="divide-y divide-zinc-100">
                          {Array.from({ length: qty }).map((_, unitIndex) => (
                            <div key={unitIndex} className="px-4 py-2 flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-600">Unit {unitIndex + 1}</span>
                              <div className="flex gap-1.5">
                                {(['none', 'sc', 'pwd'] as const).map(opt => (
                                  <button key={opt}
                                    onClick={() => {
                                      const n = { ...itemPaxAssignments };
                                      const curr = [...(n[String(cartIndex)] ?? Array(qty).fill('none'))];
                                      curr[unitIndex] = opt;
                                      n[String(cartIndex)] = curr;
                                      setItemPaxAssignments(n);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border-2 ${assignments[unitIndex] === opt ? 'bg-[#6a12b8] text-white border-[#6a12b8]' : 'bg-white text-zinc-400 border-zinc-200'}`}>
                                    {opt === 'none' ? '—' : opt.toUpperCase()}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-zinc-200 shrink-0">
              <button 
                onClick={() => onConfirm({ 
                  paymentMethod, cashTendered, referenceNumber, 
                  selectedDiscount, itemPaxAssignments, seniorIds, pwdIds, discountRemarks,
                  calculations: { vatableSales, vatAmount, vatExemptSales, lessVat, amtDue, totalDiscountDisplay }
                })}
                disabled={
                  (paymentMethod === 'cash' && (cashTendered === '' || cashTendered < amtDue)) ||
                  (['gcash', 'paymaya', 'credit', 'debit'].includes(paymentMethod) && referenceNumber.length < 13)
                }
                className="w-full bg-[#6a12b8] hover:bg-[#6a12b8] text-white py-4 rounded-[0.625rem] font-black uppercase tracking-widest shadow-lg disabled:bg-zinc-300 disabled:cursor-not-allowed">
                Confirm & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

