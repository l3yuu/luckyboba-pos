import { useState } from 'react';
import { CloseIcon, PAYMENT_METHODS } from './shared';

interface OnlineOrderItem {
  qty?: number;
  quantity?: number;
  price?: number;
  product_name?: string;
  sugar_level?: string | null;
  add_ons?: Array<{ name?: string; price?: number } | string>;
}

interface OrderForPayment {
  total_amount?: number;
  total?: number;
  items?: OnlineOrderItem[];
}

interface PaymentModalProps {
  order: OrderForPayment | null;
  onClose: () => void;
  onConfirm: (paymentMethod: string, cashTendered: number | '', referenceNumber: string) => void;
}

export const OnlineOrderPaymentModal = ({ order, onClose, onConfirm }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashTendered, setCashTendered] = useState<number | ''>('');
  const [referenceNumber, setReferenceNumber] = useState('');

  if (!order) return null;

  const amtDue = Number(order.total_amount ?? order.total ?? 0);
  const change = cashTendered === '' ? 0 : Math.max(0, Number(cashTendered) - amtDue);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-6xl rounded-[0.625rem] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] relative">
        
        {/* Header */}
        <div className="bg-[#a020f0] p-5 text-white text-center shrink-0 shadow-sm z-10 flex justify-between items-center">
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
          
          {/* Left: Cart summary (Derived from OnlineOrder items) */}
          <div className="flex-1 flex flex-col bg-white border-r border-zinc-200 overflow-hidden">
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="font-black text-sm text-black uppercase mb-4 tracking-wider">Order Items</h3>
              <div className="space-y-4">
                {(order.items || []).map((item: OnlineOrderItem, i: number) => {
                  const qty = item.qty ?? item.quantity ?? 1;
                  const price = Number(item.price ?? 0);
                  const total = price * qty;
                  const addOns = Array.isArray(item.add_ons) ? item.add_ons : [];
                  const sugarLevel = item.sugar_level;

                  return (
                    <div key={i} className="pb-3 border-b border-[#e9d5ff] last:border-0 mb-2 rounded-lg px-2 -mx-2 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-sm text-black shrink-0 ml-2">
                            {qty}x {item.product_name ?? 'Item'}
                          </p>
                          {(sugarLevel != null || addOns.length > 0) && (
                            <div className="text-[10px] text-zinc-500 mt-1 ml-2">
                              {sugarLevel != null && <p>• Sugar {sugarLevel}</p>}
                              {addOns.map((add: { name?: string; price?: number } | string, ai: number) => (
                                <p key={ai}>• {typeof add === 'string' ? add : add.name} {typeof add !== 'string' && add.price ? `(₱${Number(add.price).toFixed(2)})` : ''}</p>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="font-black text-sm text-black shrink-0 ml-2">
                          ₱ {total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals */}
            <div className="p-6 bg-[#f5f0ff] shrink-0 border-t border-[#e9d5ff]">
              <div className="space-y-1.5 text-[11px] font-bold text-zinc-600">
                <div className="flex justify-between"><span>Items Count</span><span>{order.items?.length ?? 0}</span></div>
                <div className="flex justify-between font-black text-lg text-[#a020f0] mt-2 pt-2 border-t border-[#e9d5ff]">
                  <span>Total Due</span>
                  <span>₱ {amtDue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Tabs & Payment */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="flex border-b border-[#e9d5ff] shrink-0 bg-[#f5f0ff] p-2 gap-2">
              <button className="flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-[0.625rem] transition-all border-2 relative bg-[#a020f0] text-white border-[#a020f0] shadow-md">
                Payment
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h3 className="font-black text-sm text-black uppercase mb-3 tracking-wider">Payment Method</h3>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {PAYMENT_METHODS.map(({ id, label }) => {
                      // Optionally disable delivery logic if required in online orders context
                      const isLocked = false; 
                      return (
                        <button key={id} onClick={() => { if (!isLocked) { setPaymentMethod(id); setReferenceNumber(''); setCashTendered(''); }}} disabled={isLocked}
                          className={`py-3 rounded-[0.625rem] font-black text-sm uppercase transition-all border-2 flex flex-col items-center gap-1 ${isLocked ? 'bg-zinc-100 text-zinc-300 border-zinc-100 cursor-not-allowed opacity-40' : paymentMethod === id ? 'bg-[#a020f0] text-white border-[#a020f0] shadow-md' : 'bg-[#f5f0ff] text-black border-[#e9d5ff] hover:border-[#a020f0]/40'}`}>
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {paymentMethod === 'cash' ? (
                    <>
                      <h3 className="font-black text-[10px] text-zinc-400 tracking-widest uppercase mb-2">Cash Tendered</h3>
                      <div className="relative mb-3">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-2xl text-[#a020f0]/30">₱</span>
                        <input type="number" value={cashTendered} onChange={e => setCashTendered(e.target.value ? Number(e.target.value) : '')}
                          className="w-full bg-[#f5f0ff] border-2 border-[#e9d5ff] rounded-[0.625rem] py-4 pl-12 pr-4 text-3xl font-black text-black outline-none focus:border-[#a020f0] focus:bg-white transition-colors" placeholder="0.00" />
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                        <button onClick={() => setCashTendered(amtDue)} className="col-span-2 lg:col-span-4 bg-[#a020f0] hover:bg-[#6a12b8] text-white py-2.5 rounded-[0.625rem] font-black text-sm uppercase tracking-widest transition-all shadow-md border-2 border-[#a020f0]">
                          Exact Amount (₱ {amtDue.toFixed(2)})
                        </button>
                        {[100, 200, 500, 1000].map(amount => (
                          <button key={amount} onClick={() => setCashTendered(amount)}
                            className="bg-[#f5f0ff] hover:bg-[#a020f0] hover:text-white text-black py-3 rounded-[0.625rem] font-black text-base transition-all border-2 border-[#e9d5ff] hover:border-[#a020f0]">
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
                      <div className="space-y-2">
                        <h3 className="font-black text-[10px] text-zinc-400 tracking-widest uppercase">
                          Reference Number
                        </h3>
                        <input type="text" value={referenceNumber}
                          onChange={e => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 13);
                            setReferenceNumber(v);
                          }}
                          maxLength={13}
                          className="w-full bg-zinc-50 border-2 border-zinc-300 rounded-[0.625rem] py-4 px-5 text-xl font-black outline-none focus:border-[#a020f0] focus:bg-white transition-colors uppercase"
                          placeholder="REF#" />

                        {['gcash', 'paymaya', 'credit', 'debit'].includes(paymentMethod) && referenceNumber.length < 13 && (
                          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1 ml-1">
                            ⚠ Reference number must be 13 digits ({referenceNumber.length}/13)
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-zinc-200 shrink-0 mt-auto">
              <button 
                onClick={() => onConfirm(paymentMethod, cashTendered, referenceNumber)}
                disabled={
                  (paymentMethod === 'cash' && (cashTendered === '' || cashTendered < amtDue)) ||
                  (['gcash', 'paymaya', 'credit', 'debit'].includes(paymentMethod) && referenceNumber.length < 13)
                }
                className="w-full bg-[#a020f0] hover:bg-[#6a12b8] transition-colors text-white py-4 rounded-[0.625rem] font-black uppercase tracking-widest shadow-lg disabled:bg-zinc-300 disabled:cursor-not-allowed">
                Next: Capture Name
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
