// ── print.tsx ─────────────────────────────────────────────────────────────────
// Printable receipt, kitchen order ticket, and drink sticker templates.
// All three are rendered off-screen and revealed only during window.print().

import React from 'react';
import logo from '../../../assets/logo.png';
import { type CartItem, type BundleComponentCustomization } from '../../../types/index';

// ─────────────────────────────────────────────────────────────────────────────
// ReceiptPrint
// ─────────────────────────────────────────────────────────────────────────────

interface ReceiptPrintProps {
  cart: CartItem[];
  branchName: string;
  ownerName?: string;
  brand?: string;
  companyName?: string;
  storeAddress?: string;
  vatRegTin?: string;
  minNumber?: string;
  serialNumber?: string;
  businessName?: string;
  contactEmail?: string;
  contactPhone?: string;
  generalAddress?: string;
  orNumber: string;
  queueNumber: string;
  terminalNumber?: string;
  cashierName: string;
  formattedDate: string;
  formattedTime: string;
  orderCharge: 'grab' | 'panda' | null;
  totalCount: number;
  subtotal: number;
  amtDue: number;
  vatableSales: number;
  vatAmount: number;
  vatExemptSales?: number;
  change: number;
  cashTendered: number | '';
  referenceNumber: string;
  paymentMethod: string;
  selectedDiscount: { id?: number; name: string; amount?: number; type?: string } | null;
  selectedDiscounts?: { id: number; name: string; amount: number; type: string }[];
  totalDiscountDisplay: number;
  itemDiscountTotal: number;
  promoDiscount: number;
  addOnsData?: { id: number; name: string; price: number; grab_price?: number; panda_price?: number }[];
  showDoubleQueueStub?: boolean;
  isReprint?: boolean;
  vatType?: 'vat' | 'non_vat';
  customerName: string;
  orderType: 'dine-in' | 'take-out' | 'delivery';
  paxSenior?: number;
  paxPwd?: number;
  // FIX #3 — accept string[] to match SalesOrder state (joined to comma-string for display)
  seniorIds?: string[];
  pwdIds?: string[];
  sc_discount_amount?: number;
  pwd_discount_amount?: number;
  itemPaxAssignments?: Record<string, ('none' | 'sc' | 'pwd')[]>;
  posFooter?: {
    pos_supplier?: string;
    pos_address?: string;
    pos_tin?: string;
    pos_accred_no?: string;
    pos_date_issued?: string;
    pos_valid_until?: string;
    pos_ptu?: string;
    pos_ptu_date?: string;
    contact_email?: string;
    contact_phone?: string;
  };
}

export const ReceiptPrint = ({
  cart, branchName, brand, companyName, storeAddress, vatRegTin, minNumber, serialNumber, ownerName,
  orNumber, queueNumber, terminalNumber, cashierName,
  formattedDate, formattedTime, orderCharge, totalCount,
  subtotal, amtDue, vatableSales, vatAmount, vatExemptSales = 0, change, cashTendered,
  referenceNumber, paymentMethod, selectedDiscount,
  selectedDiscounts = [],
  orderType,
  customerName,
  totalDiscountDisplay, itemDiscountTotal, promoDiscount, addOnsData = [], showDoubleQueueStub = true,
  isReprint: _isReprint = false,
  vatType = 'vat',
  paxSenior = 0,
  paxPwd = 0,
  // FIX #3 — renamed from seniorId/pwdId (singular string) to seniorIds/pwdIds (string[])
  seniorIds = [],
  pwdIds = [],
  sc_discount_amount = 0,
  pwd_discount_amount = 0,
  itemPaxAssignments = {},
  posFooter = {},
  contactEmail,
  contactPhone,
  onScreen = false,
}: ReceiptPrintProps & { onScreen?: boolean }) => {

  // FIX #6 + #7 — removed dead coveredUnitMap / itemCoverageMap computation that
  // was never read and had incorrect sorted-index logic. The split-groups block
  // below uses itemPaxAssignments directly, which is the correct source of truth.

  const isVat = vatType === 'vat';
  const safeSubtotal = Number(subtotal ?? 0);
  const safeAmtDue = Number(amtDue ?? 0);
  const safeVatableSales = Number(vatableSales ?? 0);
  const safeVatAmount = Number(vatAmount ?? 0);
  const safeVatExemptSales = Number(vatExemptSales ?? 0);
  const safeItemDiscountTotal = Number(itemDiscountTotal ?? 0);
  const safePromoDiscount = Number(promoDiscount ?? 0);
  const safeTotalDiscountDisplay = Number(totalDiscountDisplay ?? 0);
  const safeChange = Number(change ?? 0);
  const receiptNetOfVat = isVat ? (safeSubtotal / 1.12) : safeSubtotal;

  // 1. Lifted splitGroups calculation
  const getDiscountInfo = (type: 'sc' | 'pwd' | 'none') => {
    if (type === 'none') return { label: '', pct: 0 };
    const d = selectedDiscounts.find(x =>
      (type === 'sc' && x.name.toUpperCase().includes('SENIOR')) ||
      (type === 'pwd' && (x.name.toUpperCase().includes('PWD') || x.name.toUpperCase().includes('DIPLOMAT')))
    );
    return {
      label: type === 'sc' ? 'SC' : 'PWD',
      pct: d ? (d.type?.includes('Percent') ? Number(d.amount) : 20) : 20,
    };
  };

  const splitGroups: {
    cartIndex: number;
    item: CartItem;
    discountType: 'none' | 'sc' | 'pwd';
    discountLabel: string;
    discountPct: number;
    count: number;
  }[] = [];

  cart.forEach((item, cartIndex) => {
    const assignments = itemPaxAssignments[String(cartIndex)] ?? Array(item.qty).fill('none');
    const groups: Record<'none' | 'sc' | 'pwd', number> = { none: 0, sc: 0, pwd: 0 };
    assignments.forEach((a: 'none' | 'sc' | 'pwd') => groups[a]++);

    (['sc', 'pwd', 'none'] as const).forEach(discountType => {
      const count = groups[discountType];
      if (count === 0) return;
      const info = getDiscountInfo(discountType);
      splitGroups.push({
        cartIndex,
        item,
        discountType,
        discountLabel: info.label,
        discountPct: info.pct,
        count,
      });
    });
  });



  const addOnUnitPrice = (item: CartItem, addonName: string): number => {
    const a = addOnsData.find(x => x.name.toLowerCase() === addonName.toLowerCase());
    if (!a) return 0;
    return item.charges?.grab && Number(a.grab_price ?? 0) > 0
      ? Number(a.grab_price)
      : item.charges?.panda && Number(a.panda_price ?? 0) > 0
        ? Number(a.panda_price)
        : Number(a.price);
  };

  return (
    <div className={`${onScreen ? 'block shadow-2xl rounded-sm ring-1 ring-black/5' : 'hidden print:block'} w-[72mm] mx-auto`}>
      <style>{`
        @media print {
          .receipt-area {
            width: 66mm !important;
            margin: 0 auto !important;
            padding: 1mm 0 !important;
            box-sizing: border-box !important;
            color: #000 !important;
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
            font-size: 11px !important;
            line-height: 1.1 !important;
            font-weight: 500 !important;
            text-rendering: geometricPrecision !important;
            -webkit-font-smoothing: none !important;
            font-smooth: never !important;
            letter-spacing: 0 !important;
            font-kerning: none !important;
            font-variant-ligatures: none !important;
            text-shadow: none !important;
            transform: none !important;
            zoom: 1 !important;
          }
          .receipt-area * {
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
            text-rendering: inherit !important;
            -webkit-font-smoothing: inherit !important;
            font-smooth: inherit !important;
            letter-spacing: inherit !important;
            font-kerning: inherit !important;
            font-variant-ligatures: inherit !important;
            text-shadow: none !important;
            transform: none !important;
            color: #000 !important;
          }
          .receipt-area strong,
          .receipt-area b,
          .receipt-area .font-semibold,
          .receipt-area .font-bold,
          .receipt-area .font-black {
            font-weight: 700 !important;
          }
          /* Compact spacing */
          .receipt-area .mb-4 { margin-bottom: 0.5rem !important; }
          .receipt-area .mb-3 { margin-bottom: 0.35rem !important; }
          .receipt-area .mt-6 { margin-top: 0.6rem !important; }
          .receipt-area .mt-5 { margin-top: 0.5rem !important; }
          .receipt-area .mt-3 { margin-top: 0.35rem !important; }
          .receipt-area .mt-2 { margin-top: 0.25rem !important; }
          .receipt-area .py-4 { padding-top: 0.4rem !important; padding-bottom: 0.4rem !important; }
          .receipt-area .pb-3 { padding-bottom: 0.35rem !important; }
          .receipt-area .pt-3 { padding-top: 0.35rem !important; }
        }
      `}</style>
      <div className="receipt-area bg-white text-black">

        {/* Store header */}
        <div className="text-center mb-4 border-b border-black pb-3">
          <img src={logo} alt="Lucky Boba Logo" className="w-48 h-auto mx-auto mb-2 grayscale" style={{ filter: 'grayscale(100%) contrast(1.2)' }} />
          <h1 className="uppercase leading-tight font-bold text-xl">{brand || 'LUCKY BOBA MILKTEA'}</h1>
          {ownerName && (
            <div className="text-center text-[10px] leading-tight">
              <span>Owned and Operated By:</span>
              <br />
              <span className="font-bold">{ownerName}</span>
            </div>
          )}
          {companyName && <p className="text-xs mt-0.5 font-bold">{companyName}</p>}
          <p className="text-base mt-1 font-bold">{branchName}</p>
          {storeAddress && <p className="text-xs mt-0.5">{storeAddress}</p>}
          {vatRegTin && <p className="text-xs mt-0.5">VAT Reg TIN: {vatRegTin}</p>}
          {minNumber && <p className="text-xs mt-0.5">MIN: {minNumber}</p>}
          {serialNumber && <p className="text-xs mt-0.5">SN: {serialNumber}</p>}
          <h2 className="text-sm mt-2 font-bold">{orNumber}</h2>
          {terminalNumber && <p className="text-[10px] uppercase font-bold">Terminal: {terminalNumber}</p>}
          <p className="text-sm mt-1">{formattedDate} {formattedTime}</p>
        </div>

        {/* Guest info */}
        <div className="text-xs space-y-1 mb-3">
          <div className="mt-1">Cashier: {cashierName ?? 'Admin'}</div>
          <div className="mt-1">
            Order Mode: {orderType === 'dine-in' ? 'DINE IN' : orderType === 'delivery' ? 'DELIVERY' : 'TAKE OUT'}
          </div>
          {orderCharge && (
            <div className="mt-1">
              Order Type: {orderCharge === 'grab' ? 'GRABFOOD' : 'FOODPANDA'}
            </div>
          )}
        </div>

        {/* Discount Details */}
        {(paxSenior > 0 || paxPwd > 0) && (
          <div>
            {paxSenior > 0 && (
              <div className="flex justify-between text-xs">
                <span>Senior PAX</span>
                <span>{paxSenior}</span>
              </div>
            )}
            {paxPwd > 0 && (
              <div className="flex justify-between text-xs">
                <span>PWD PAX</span>
                <span>{paxPwd}</span>
              </div>
            )}
          </div>
        )}

        {/* Items - Split by discount type */}
        <div className="mt-3 mb-3 text-xs border-t border-dashed border-black pt-3">
          {(() => {
            const shownAddOns = new Set<number>();

            return splitGroups.map((group, gi) => {
              const { cartIndex, item, discountType, discountLabel, discountPct, count } = group;
              const hasPaxDiscount = discountType !== 'none' && isVat;
              const isFirstGroupForItem = splitGroups.findIndex(g => g.cartIndex === cartIndex) === gi;
              const showAddOns = !shownAddOns.has(cartIndex);
              if (showAddOns) shownAddOns.add(cartIndex);


              const perUnitSurcharge = item.charges?.grab
                ? Number(item.grab_price ?? 0)
                : item.charges?.panda
                  ? Number(item.panda_price ?? 0)
                  : 0;
              const unitGross = Number(item.price) + perUnitSurcharge;
              return (
                <div key={gi} className="mb-3">
                  {/* Item name + badge */}
                  <div className="uppercase flex items-center gap-1 flex-wrap">
                    <span>{item.name}{item.cupSizeLabel ? ` (${item.cupSizeLabel})` : ''}</span>
                    {hasPaxDiscount && (
                      <span className="text-[9px] border border-black px-0.5 font-bold leading-tight">
                        {discountLabel} {discountPct}%
                      </span>
                    )}
                  </div>

                  {/* Qty × unit price row */}
                  <div className="flex justify-between w-full mt-0.5">
                    <span>
                      {count} X {unitGross.toFixed(2)}
                    </span>
                    <span>
                      {(unitGross * count).toFixed(2)}
                    </span>
                  </div>

                  {/* Item-level discount label (e.g. BOGO, promo) */}
                  {isFirstGroupForItem && item.discountLabel && item.discountType && item.discountValue !== '' && Number(item.discountValue) !== 0 && (() => {
                    const unitPrice = Number(item.price ?? 0);
                    const discAmt = item.discountType === 'percent'
                      ? unitPrice * item.qty * (Number(item.discountValue) / 100)
                      : Math.min(Number(item.discountValue), unitPrice * item.qty);
                    return (
                      <div className="flex justify-between w-full text-[10px] italic text-gray-600">
                        <span>  • {item.discountLabel}</span>
                        <span>- {discAmt.toFixed(2)}</span>
                      </div>
                    );
                  })()}

                  {/* Sugar / options / remarks - only on first group per item */}
                  {isFirstGroupForItem && (
                    <div className="space-y-0.5 mt-0.5">
                      {item.sugarLevel != null && item.sugarLevel !== '' && (
                        <div className="pl-2 text-[10px] flex items-center gap-1">
                          <span className="text-gray-400">•</span>
                          <span>Sugar {item.sugarLevel}</span>
                        </div>
                      )}
                      {item.options?.map(o => (
                        <div key={o} className="pl-2 text-[10px] flex items-center gap-1">
                          <span className="text-gray-400">•</span>
                          <span>{o}</span>
                        </div>
                      ))}
                      {item.remarks && (
                        <div className="pl-2 text-[10px] italic flex items-center gap-1">
                          <span className="text-gray-400">•</span>
                          <span>{item.remarks}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add-ons as separate line items - only once per original item */}
                  {showAddOns && item.addOns && item.addOns.length > 0 && item.addOns.map((addonName, ai) => {
                    const price = addOnUnitPrice(item, addonName);
                    const addonTotal = price * item.qty;
                    return (
                      <div key={ai} className="mt-2 pt-1 border-t border-dashed border-gray-300">
                        <div className="uppercase font-medium">{addonName}</div>
                        <div className="flex justify-between w-full mt-0.5">
                          <span>{item.qty} X {price.toFixed(2)}</span>
                          <span>{addonTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            });
          })()}
        </div>

        {/* Totals */}
        <div className="text-xs space-y-1 border-t border-dashed border-black pt-2">
          <div className="flex justify-between"><span>Total Items</span><span>{totalCount}</span></div>
          <div className="flex justify-between"><span>Sub Total</span><span>{safeSubtotal.toFixed(2)}</span></div>
          {safeTotalDiscountDisplay > 0 && (
            <>
              {safeItemDiscountTotal > 0 && (
                <div className="flex justify-between">
                  <span>Item Discount(s)</span>
                  <span>- {safeItemDiscountTotal.toFixed(2)}</span>
                </div>
              )}
              {selectedDiscount && safePromoDiscount > 0 && (
                <div className="flex justify-between">
                  <span>
                    Promo: {selectedDiscount.name}
                    {(selectedDiscount as { name: string; amount?: number; type?: string }).type?.includes('Percent')
                      ? ` (${(selectedDiscount as { name: string; amount?: number; type?: string }).amount}%)`
                      : (selectedDiscount as { name: string; amount?: number; type?: string }).amount
                        ? ` (-₱${(selectedDiscount as { name: string; amount?: number; type?: string }).amount})`
                        : ''}
                  </span>
                  <span>- {safePromoDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-dashed border-black pt-1 mt-1">
                <span>Total Discount</span>
                <span>- {safeTotalDiscountDisplay.toFixed(2)}</span>
              </div>
            </>
          )}

          {/* PAX Discount Detailed Breakdown (Summary) */}
          {(() => {
            const paxGroups = (['sc', 'pwd'] as const).filter(t =>
              splitGroups.some(g => g.discountType === t)
            );

            if (paxGroups.length > 0) {
              return (
                <div className="space-y-2 border-t border-dashed border-black py-2">
                  {paxGroups.map(type => {
                    const groups = splitGroups.filter(g => g.discountType === type);
                    const discountTotal = groups.reduce((acc: number, g) => {
                      const unitGross = Number(g.item.price) + (g.item.addOns ?? []).reduce((sum: number, name: string) => {
                        const a = addOnsData.find(x => x.name.toLowerCase() === name.toLowerCase());
                        return sum + (a ? Number(a.price) : 0);
                      }, 0);
                      const unitVatExcl = isVat ? unitGross / 1.12 : unitGross;
                      return acc + (unitVatExcl * (g.discountPct / 100)) * g.count;
                    }, 0);
                    const groupNetSubtotal = groups.reduce((acc: number, g) => {
                      const unitGross = Number(g.item.price) + (g.item.addOns ?? []).reduce((sum: number, name: string) => {
                        const a = addOnsData.find(x => x.name.toLowerCase() === name.toLowerCase());
                        return sum + (a ? Number(a.price) : 0);
                      }, 0);
                      const unitVatExcl = isVat ? unitGross / 1.12 : unitGross;
                      const discAmt = unitVatExcl * (g.discountPct / 100);
                      return acc + (unitVatExcl - discAmt) * g.count;
                    }, 0);

                    const groupLessVat = groups.reduce((acc: number, g) => {
                      const unitGross = Number(g.item.price) + (g.item.addOns ?? []).reduce((sum: number, name: string) => {
                        const a = addOnsData.find(x => x.name === name);
                        return sum + (a ? Number(a.price) : 0);
                      }, 0);
                      const unitVatExcl = isVat ? unitGross / 1.12 : unitGross;
                      return acc + (unitGross - unitVatExcl) * g.count;
                    }, 0);

                    return (
                      <div key={type} className="space-y-0.5">
                        <div className="uppercase font-bold">{type === 'sc' ? 'Senior' : 'PWD'} PAX Summary</div>
                        <div className="flex justify-between font-normal">
                          <span>Discount ({groups[0].discountPct}%)</span>
                          <span>-₱{discountTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Less VAT</span>
                          <span>₱{groupLessVat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Net of VAT</span>
                          <span>₱{receiptNetOfVat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between italic">
                          <span>Net Price (VAT Exempt)</span>
                          <span>₱{groupNetSubtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            if (sc_discount_amount > 0 || pwd_discount_amount > 0) {
              const paxTypes = [];
              if (sc_discount_amount > 0) paxTypes.push({ type: 'sc', amt: sc_discount_amount, label: 'Senior' });
              if (pwd_discount_amount > 0) paxTypes.push({ type: 'pwd', amt: pwd_discount_amount, label: 'PWD' });
              return (
                <div className="space-y-2 border-t border-dashed border-black py-2">
                  {paxTypes.map(p => {
                    const preVatFull = (p.amt / 0.20);
                    const groupLessVat = preVatFull * 0.12;
                    const netVatExempt = preVatFull * 0.80;
                    return (
                      <div key={p.type} className="space-y-0.5">
                        <div className="uppercase font-bold">{p.label} PAX Summary</div>
                        <div className="flex justify-between font-normal">
                          <span>Discount (20%)</span>
                          <span>-₱{p.amt.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Less VAT</span>
                          <span>₱{groupLessVat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Net of VAT</span>
                          <span>₱{receiptNetOfVat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between italic text-[10px]">
                          <span>Net Price (VAT Exempt)</span>
                          <span>₱{netVatExempt.toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              );
            }
            return null;
          })()}


          <div className="flex justify-between text-base font-bold mt-1"><span>TOTAL DUE</span><span>{safeAmtDue.toFixed(2)}</span></div>
        </div>

        {/* Payment */}
        <div className="text-xs mt-2 space-y-1 border-b border-dashed border-black pb-3">
          <div className="flex justify-between"><span>Payment Method</span><span className="uppercase font-bold">{paymentMethod}</span></div>
          {paymentMethod === 'cash' && (
            <>
              <div className="flex justify-between"><span>Cash (Tendered)</span><span>{typeof cashTendered === 'number' ? cashTendered.toFixed(2) : safeAmtDue.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Change</span><span>{safeChange.toFixed(2)}</span></div>
            </>
          )}
          {referenceNumber && (
            <div className="flex justify-between"><span>Ref/Approval #</span><span className="font-bold">{referenceNumber}</span></div>
          )}
        </div>

        {/* VAT breakdown */}
        <div className="text-[11px] mt-3 space-y-1">
          {vatType === 'non_vat' ? (
            <>
              <div className="flex justify-between"><span>VATable Sales(V)</span><span>0.00</span></div>
              <div className="flex justify-between"><span>VAT Amount</span><span>0.00</span></div>
              <div className="flex justify-between"><span>VAT Exempt Sales(E)</span><span>{safeAmtDue.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Zero-Rated Sales(Z)</span><span>0.00</span></div>
            </>
          ) : (
            <>
              <div className="flex justify-between"><span>VATable Sales(V)</span><span>{safeVatableSales.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>VAT Amount</span><span>{safeVatAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>VAT Exempt Sales(E)</span><span>{safeVatExemptSales.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Zero-Rated Sales(Z)</span><span>0.00</span></div>
            </>
          )}
        </div>

        {/* Signature fields */}
        {(paxSenior > 0 || paxPwd > 0 || (seniorIds && seniorIds.length > 0) || (pwdIds && pwdIds.length > 0)) && (
          <div className="text-xs mt-5 space-y-2">
            {['Name:', 'TIN/ID/SC:', 'Address:', 'Signature'].map(label => (
              <div key={label} className="flex justify-between items-end w-full">
                <span>{label}</span>
                <span className="border-b border-black w-[70%] relative">
                  {label === 'Name:' && customerName && (
                    <span className="absolute left-1 bottom-0 text-[10px]">{customerName}</span>
                  )}
                  {/* FIX #3 — join arrays to a comma-separated string for display */}
                  {label === 'TIN/ID/SC:' && ((seniorIds && seniorIds.length > 0) || (pwdIds && pwdIds.length > 0)) && (
                    <span className="absolute left-1 bottom-0 text-[10px]">
                      {[...(seniorIds || []), ...(pwdIds || [])].join(', ')}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Franchise info */}
        <div className="mt-6 mb-4 text-center text-xs">
          FOR FRANCHISE<br />EMAIL OR CONTACT US ON<br />
          {contactEmail || posFooter.contact_email || 'luckyboba.franchise@gmail.com'}<br />
          {contactPhone || posFooter.contact_phone || '09171699894'}
        </div>

        {/* ── POS Supplier Footer ── */}
        {(posFooter.pos_supplier || posFooter.pos_tin) && (
          <div className="mt-2 mb-4 text-left text-[10px] border-t border-dashed border-black pt-3 space-y-0.5 leading-snug">
            {posFooter.pos_supplier && <div className="font-bold uppercase">POS SUPPLIER: {posFooter.pos_supplier}</div>}
            {posFooter.pos_address && <div>{posFooter.pos_address}</div>}
            {posFooter.pos_tin && <div>TIN: {posFooter.pos_tin}</div>}
            {posFooter.pos_accred_no && <div>Accred No: {posFooter.pos_accred_no}</div>}
            {posFooter.pos_date_issued && <div>Date Issued: {posFooter.pos_date_issued}</div>}
            {posFooter.pos_valid_until && <div>Valid Until: {posFooter.pos_valid_until}</div>}
            {posFooter.pos_ptu && <div>PTU No: {posFooter.pos_ptu}</div>}
            {posFooter.pos_ptu_date && <div>PTU Date Issued: {posFooter.pos_ptu_date}</div>}
          </div>
        )}

        {/* Queue number stub 1 */}
        <div className="mt-6 py-4 text-center" style={{ pageBreakAfter: 'always' }}>
          <p className="text-sm tracking-widest uppercase mb-1">Your Order Number Is:</p>
          <h2 className="font-black text-4xl">#{queueNumber}</h2>
          <p className="text-[10px] mt-2 uppercase text-gray-500">Please wait for your number to be called</p>
        </div>

        {/* Queue number stub 2 — on its own page */}
        {showDoubleQueueStub && (
          <div className="py-4 text-center queue-stub" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
            <p className="text-sm tracking-widest uppercase mb-1">Your Order Number Is:</p>
            <h2 className="font-black text-4xl">#{queueNumber}</h2>
            <p className="text-[10px] mt-2 uppercase text-gray-500">Please wait for your number to be called</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KioskTicketPrint
// ─────────────────────────────────────────────────────────────────────────────

interface KioskCartItem {
  name: string;
  qty: number;
  sellingPrice?: number;
  price?: number;
  finalPrice?: number;
  itemTotal?: number;
  cupSizeLabel?: string;
  sugarLevel?: string;
  options?: string[];
  selectedSugarLevel?: string;
  selectedAddOns?: { id: number; name: string; price: number }[];
}

interface KioskTicketPrintProps {
  cart: KioskCartItem[];
  branchName: string;
  orNumber: string;
  queueNumber: string;
  formattedDate: string;
  formattedTime: string;
  totalAmount: number;
}

export const KioskTicketPrint = ({
  cart, branchName, orNumber, queueNumber, formattedDate, formattedTime, totalAmount
}: KioskTicketPrintProps) => {
  return (
    <div className="printable-receipt-container hidden print:block" style={{ width: '80mm', maxWidth: '80mm' }}>
      <style>{`
        @page {
          margin: 0;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .printable-receipt-container {
            display: block !important;
            width: 80mm !important;
            padding: 0;
            background: white;
          }
          .receipt-area {
            width: 70mm !important;
            margin: 0 auto !important;
            padding: 1mm 0 !important;
            box-sizing: border-box !important;
            color: #000 !important;
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
            font-size: 10px !important;
            line-height: 1.1 !important;
            font-weight: 400 !important;
            text-rendering: geometricPrecision !important;
            -webkit-font-smoothing: none !important;
            font-smooth: never !important;
            letter-spacing: 0.1px !important;
          }
          .receipt-area * {
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
            color: #000 !important;
          }
          .receipt-area strong,
          .receipt-area b,
          .receipt-area .font-bold {
            font-weight: 700 !important;
          }
          .receipt-area .font-black {
            font-weight: 800 !important;
          }
          .border-minimal {
            border-bottom: 1px solid #000;
          }
        }
      `}</style>
      <div className="receipt-area bg-white text-black">
        {/* Store header */}
        <div className="text-center mb-2 pb-2 border-minimal">
          <img src={logo} alt="Lucky Boba Logo" className="w-12 h-auto mx-auto mb-1 grayscale" style={{ filter: 'grayscale(100%)', maxWidth: '25mm' }} />
          <h1 className="uppercase font-bold text-sm tracking-tight">LUCKY BOBA</h1>
          <p className="text-[9px] uppercase font-bold tracking-widest">{branchName}</p>
        </div>

        {/* Status indicator */}
        <div className="text-center mb-2 py-1 border border-black rounded-sm">
          <p className="text-[7px] font-bold uppercase tracking-[0.2em] mb-0.5">ORDER STATUS: PENDING</p>
          <h2 className="text-xs font-bold uppercase">PLEASE PAY AT CASHIER</h2>
        </div>

        {/* Queue Number */}
        <div className="text-center mb-2">
          <div className="inline-block px-3 py-1 border-y-2 border-black">
            <h2 className="font-black tracking-tighter" style={{ fontSize: '28pt', lineHeight: 1 }}>
              #{queueNumber}
            </h2>
          </div>
          <p className="text-[9px] font-bold mt-1.5">
            {formattedDate} • {formattedTime}
          </p>
        </div>

        {/* Items Table Header */}
        <div className="flex justify-between text-[8px] font-bold uppercase border-b border-black pb-0.5 mb-1.5">
          <span>PARTICULARS</span>
          <span>AMOUNT</span>
        </div>

        {/* Items List */}
        <div className="space-y-1 mb-2">
          {cart.map((item, i) => (
            <div key={i} className="flex flex-col border-b border-gray-100 pb-1">
              <div className="flex justify-between items-start">
                <div style={{ flex: 1, paddingRight: '2mm', minWidth: 0 }}>
                  <div className="flex items-start gap-1">
                    <span className="font-bold text-[10px] shrink-0">{item.qty}x</span>
                    <span className="uppercase font-bold text-[10px] leading-tight" style={{ wordBreak: 'break-word' }}>{item.name}</span>
                  </div>
                  {item.cupSizeLabel && <div className="pl-4 text-[8px] font-bold uppercase text-gray-600 italic mt-0.5">{item.cupSizeLabel} SIZE</div>}
                </div>
                <div className="font-bold text-[10px]" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                  ₱{((item.itemTotal || Number(item.sellingPrice || item.price || item.finalPrice)) * item.qty).toFixed(2)}
                </div>
              </div>

              {/* Add-ons/Options */}
              <div className="pl-4 space-y-0 mt-0.5">
                {(item.selectedSugarLevel || item.sugarLevel) && (
                  <div className="text-[8px] font-bold text-gray-600">
                    • Sugar {item.selectedSugarLevel || item.sugarLevel}
                  </div>
                )}
                {item.selectedAddOns?.map(ao => (
                  <div key={ao.id} className="text-[8px] font-bold text-gray-600 uppercase italic">• {ao.name}</div>
                ))}
                {item.options?.map((o: string) => (
                  <div key={o} className="text-[8px] font-bold text-gray-600">• {o}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Totals Section */}
        <div className="border-t border-black pt-1.5 mb-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-[9px] font-bold uppercase">TOTAL DUE</span>
            <div className="flex items-baseline gap-1 font-bold">
              <span className="text-[10px]">₱</span>
              <span className="tracking-tighter" style={{ fontSize: '14pt' }}>{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-1.5 border-t border-dashed border-gray-300 mt-1.5">
          <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5">
            NOT AN OFFICIAL RECEIPT. PRESENT TO COUNTER
          </p>
          <div className="bg-gray-100 p-0.5 text-[7px] font-bold uppercase tracking-tighter opacity-80" style={{ wordBreak: 'break-all' }}>
            {orNumber} | {formattedDate} {formattedTime}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KitchenPrint
// ─────────────────────────────────────────────────────────────────────────────

interface KitchenPrintProps {
  cart: CartItem[];
  branchName: string;
  orNumber: string;
  queueNumber: string;
  formattedDate: string;
  formattedTime: string;
  customerName: string;
  orderType: 'dine-in' | 'take-out' | 'delivery';
}

export const KitchenPrint = ({
  cart, branchName, orNumber, queueNumber, formattedDate, formattedTime, orderType,
  customerName, onScreen = false,
}: KitchenPrintProps & { onScreen?: boolean }) => (
  <div className={`${onScreen ? 'block shadow-2xl rounded-sm ring-1 ring-black/5' : 'hidden print:block'} w-[72mm] mx-auto`}>
    <style>{`
      @media print {
        .receipt-area {
          width: 66mm !important;
          margin: 0 auto !important;
          padding: 1mm 0 !important;
          box-sizing: border-box !important;
          color: #000 !important;
          font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
          font-size: 11px !important;
          line-height: 1.1 !important;
          font-weight: 500 !important;
          text-rendering: geometricPrecision !important;
          -webkit-font-smoothing: none !important;
          font-smooth: never !important;
          letter-spacing: 0 !important;
          font-kerning: none !important;
          font-variant-ligatures: none !important;
          text-shadow: none !important;
          transform: none !important;
          zoom: 1 !important;
        }
        .receipt-area * {
          font-family: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
          text-rendering: inherit !important;
          -webkit-font-smoothing: inherit !important;
          font-smooth: inherit !important;
          letter-spacing: inherit !important;
          font-kerning: inherit !important;
          font-variant-ligatures: inherit !important;
          text-shadow: none !important;
          transform: none !important;
          color: #000 !important;
        }
      }
    `}</style>
    <div className="receipt-area bg-white text-black">
      <div className="text-center mb-4 border-b-4 border-black pb-3">
        <h1 className="uppercase leading-tight font-black text-3xl mb-1">ORDER TICKET</h1>
        <h2 className="font-bold text-lg uppercase tracking-widest">{branchName}</h2>
        <div className="mt-2 text-sm uppercase">
          <div>Customer: {customerName || 'N/A'}</div>
          <div>Mode: {orderType === 'dine-in' ? 'DINE IN' : orderType === 'delivery' ? 'DELIVERY' : 'TAKE OUT'}</div>
        </div>
        <div className="py-3 my-3">
          <p className="text-sm tracking-widest uppercase">Queue</p>
          <h2 className="font-black text-4xl tracking-widest">#{queueNumber}</h2>
        </div>
        <h2 className="text-m">SI # {orNumber}</h2>
        <p className="text-sm mt-1">{formattedDate} {formattedTime}</p>
      </div>

      <div className="mt-2">
        {cart.map((item, i) => (
          <div key={i} className="mb-4 border-b-2 border-dashed border-gray-400 pb-3">
            <div className="flex items-start">
              <span className="font-bold text-m mr-3">{item.qty}x</span>
              <div className="flex-1">
                <div className="uppercase text-sm leading-tight mb-1">
                  {item.name} {item.cupSizeLabel ? `(${item.cupSizeLabel})` : ''}
                </div>

                {item.size === 'none' && item.sugarLevel != null ? (
                  <>
                    <div className="text-sm font-bold mt-1">• Classic Pearl</div>
                    <div className="text-sm pl-3">Sugar: {item.sugarLevel}</div>
                    {item.options && item.options.length > 0 && (
                      <div className="text-sm pl-3">Options: {item.options.join(', ')}</div>
                    )}
                    {item.addOns && item.addOns.length > 0 && item.addOns.map((a, ai) => (
                      <div key={ai} className="text-sm pl-3 font-bold">+ {a}</div>
                    ))}
                  </>
                ) : (
                  <>
                    {item.sugarLevel != null && item.sugarLevel !== '' && (
                      <div className="text-sm mt-1">Sugar: {item.sugarLevel}</div>
                    )}
                    {item.options && item.options.length > 0 && (
                      <div className="text-sm">Options: {item.options.join(', ')}</div>
                    )}
                    {item.addOns && item.addOns.length > 0 && (
                      <div className="mt-1 border-t border-dashed border-gray-300 pt-1">
                        {item.addOns.map((a, ai) => (
                          <div key={ai} className="text-sm font-bold">+ {a}</div>
                        ))}
                      </div>
                    )}
                    {item.remarks && (
                      <div className="text-sm italic mt-2 border-t border-gray-200 pt-1">
                        {item.remarks}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm mt-4 uppercase tracking-widest">--- END OF TICKET ---</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// StickerPrint
// ─────────────────────────────────────────────────────────────────────────────

interface StickerPrintProps {
  cart: CartItem[];
  branchName: string;
  orNumber: string;
  queueNumber: string;
  customerName: string;
  formattedDate: string;
  formattedTime: string;
  orderType: 'dine-in' | 'take-out' | 'delivery';
  isOnline?: boolean;
}

interface StickerClasses {
  paddingClass: string;
  titleSize: string;
  nameSize: string;
  addOnSize: string;
  gapClass: string;
  marginClass: string;
  isVeryCrowded: boolean;
}

const getStickerClasses = (extraCount: number, nameLength = 0): StickerClasses => {
  const isCrowded = extraCount >= 2;
  const isVeryCrowded = extraCount >= 4;
  const isUltraCrowded = extraCount >= 6;
  const isLongName = nameLength > 12;
  const isVeryLongName = nameLength > 18;
  const isUltraLongName = nameLength > 25;
  return {
    paddingClass: isUltraCrowded ? 'p-0' : isVeryCrowded ? 'p-0.5' : 'p-1',
    titleSize: isUltraCrowded ? 'text-[9px]' : isVeryCrowded ? 'text-[10px]' : isCrowded ? 'text-[11px]' : 'text-[12px]',
    nameSize: isUltraCrowded || isUltraLongName
      ? 'text-[8px]'
      : isVeryCrowded || isVeryLongName
        ? 'text-[9px]'
        : isCrowded || isLongName
          ? 'text-[10px]'
          : 'text-[12px]',
    addOnSize: isUltraCrowded ? 'text-[6.5px]' : isVeryCrowded ? 'text-[7.5px]' : isCrowded ? 'text-[8.5px]' : 'text-[9px]',
    gapClass: isUltraCrowded ? 'space-y-0 leading-none' : isVeryCrowded ? 'space-y-0 leading-tight' : 'space-y-0.5 leading-tight',
    marginClass: isUltraCrowded || isVeryCrowded ? 'mb-0' : 'mb-0.5',
    isVeryCrowded: isVeryCrowded || isUltraCrowded,
  };
};

const StickerHeader = ({
  branchName, orNumber, queueNumber, customerName, drinkIndex, totalDrinks, cls, orderType,
}: {
  branchName: string; orNumber: string; queueNumber: string;
  customerName: string; drinkIndex: number; totalDrinks: number;
  cls: StickerClasses;
  orderType: 'dine-in' | 'take-out' | 'delivery';
}) => (
  <div className="w-full text-center flex flex-col items-center">
    <div className={`font-black uppercase leading-none tracking-tight ${cls.isVeryCrowded ? 'text-[10px]' : 'text-[12px]'}`}>
      LUCKY BOBA
    </div>
    <div className={`font-bold uppercase leading-none tracking-widest ${cls.isVeryCrowded ? 'text-[6px] mt-0.5' : 'text-[7px] mt-1'}`}>
      {branchName.toUpperCase()}
    </div>
    <div className={`w-full flex justify-between items-center font-black border-b-[1.5px] border-black px-1 ${cls.isVeryCrowded ? 'text-[9px] pb-0 mb-0 mt-0.5' : 'text-[10px] pb-0.5 mb-0.5 mt-1'}`}>
      <span>Q:{queueNumber} SI:{orNumber.replace('SI-', '')}</span>
      <span>{drinkIndex}/{totalDrinks}</span>
    </div>
    {(customerName || orderType) && (
      <div className={`w-full text-center font-black uppercase px-1 leading-none ${cls.isVeryCrowded ? 'text-[8px] mt-0.5' : 'text-[9px] mt-1'}`}>
        {customerName && <div className="truncate mb-0.5">{customerName}</div>}
        <div className="text-[7px] font-bold opacity-80">{orderType === 'dine-in' ? 'DINE IN' : orderType === 'take-out' ? 'TAKE OUT' : 'DELIVERY'}</div>
      </div>
    )}
  </div>
);

const StickerFooter = ({ cls, formattedDate, formattedTime }: { cls: StickerClasses; formattedDate: string; formattedTime: string }) => (
  <>
    <div className="w-full text-center mt-auto px-1">
      <p className={`font-black uppercase tracking-tighter leading-tight ${cls.isVeryCrowded ? 'text-[5px]' : 'text-[7px]'}`}>
        Best consume within 30 minutes
      </p>
    </div>
    <div className={`w-full font-bold text-center border-t border-zinc-800 ${cls.isVeryCrowded ? 'text-[8px] pt-0 mt-0' : 'text-[9px] pt-0.5 mt-0.5'}`}>
      {formattedDate} {formattedTime}
    </div>
  </>
);

export const StickerPrint = ({
  cart, branchName, orNumber, queueNumber, customerName, formattedDate, formattedTime, orderType, isOnline, onScreen = false,
}: StickerPrintProps & { onScreen?: boolean }) => {
  const stickers: React.ReactNode[] = [];
  let drinkIndex = 1;

  const totalDrinks = cart.reduce((acc, item) => {
    if (item.isBundle) {
      return acc + (item.bundleComponents?.reduce((s, c) => s + c.quantity, 0) ?? 0) * item.qty;
    }

    const comboMatch = item.remarks?.match(/^(.+?) \[(.+)\]/);
    const isCombo = !!comboMatch && !item.remarks?.startsWith('[Drink:');
    if (isCombo) {
      return acc + (orderType !== 'dine-in' ? 2 : 1) * item.qty;
    }

    const isDrinkSticker = item.sugarLevel !== undefined || item.size === 'M' || item.size === 'L' || !!item.cupSizeLabel;
    if (isDrinkSticker) return acc + item.qty;

    const isMixMatch = item.remarks?.startsWith('[Drink:') ?? false;
    if (isMixMatch) return acc + item.qty;

    const waffleCount = (item.addOns?.filter(a => a.toLowerCase().includes('waffle combo')).length ?? 0) * item.qty;
    if (waffleCount > 0) return acc + waffleCount;

    if (orderType !== 'dine-in' || isOnline) return acc + item.qty;
    return acc;
  }, 0);

  const sharedProps = { branchName, orNumber, queueNumber, customerName, totalDrinks, formattedDate, formattedTime, orderType };

  cart.forEach((item, cartIndex) => {

    // ── Bundle stickers ───────────────────────────────────────────────────────
    if (item.isBundle && item.bundleComponents && item.bundleComponents.length > 0) {
      for (let q = 0; q < item.qty; q++) {
        item.bundleComponents.forEach((component: BundleComponentCustomization, compIdx: number) => {
          for (let cq = 0; cq < component.quantity; cq++) {
            const cls = getStickerClasses(component.options.length + component.addOns.length, component.name.length);
            stickers.push(
              <div
                key={`bundle-sticker-${cartIndex}-${q}-${compIdx}-${cq}`}
                className={`sticker-area page-break bg-white text-black flex flex-col justify-between items-center h-full w-full ${cls.paddingClass}`}
                style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
              >
                <StickerHeader {...sharedProps} drinkIndex={drinkIndex} cls={cls} />
                <div className="w-full text-center flex-1 flex flex-col justify-center items-center px-1 overflow-hidden">
                  <div className={`w-full font-black uppercase leading-tight ${cls.nameSize} ${cls.marginClass}`}>
                    {component.name} {component.size && component.size !== 'none' && `(${component.size})`}
                  </div>
                  <div className={`w-full text-center font-bold ${cls.addOnSize} ${cls.gapClass}`}>
                    {component.sugarLevel && component.sugarLevel.trim() !== '' && (
                      <div className="text-[#6a12b8]">Sugar: {component.sugarLevel}</div>
                    )}
                    {component.options.map(opt => <div key={opt}>{opt}</div>)}
                    {component.addOns.map(a => <div key={a}>+ {a}</div>)}
                  </div>
                </div>
                <StickerFooter cls={cls} formattedDate={formattedDate} formattedTime={formattedTime} />
              </div>
            );
            drinkIndex++;
          }
        });
      }
      return;
    }

    // ── Waffle combo add-on stickers ──────────────────────────────────────────
    const isDrinkSticker = item.sugarLevel !== undefined || item.size === 'M' || item.size === 'L' || !!item.cupSizeLabel;
    const waffleComboAddOns = item.addOns?.filter(a => a.toLowerCase().includes('waffle combo')) ?? [];

    if (!isDrinkSticker && waffleComboAddOns.length > 0) {
      for (let i = 0; i < item.qty; i++) {
        waffleComboAddOns.forEach(addonName => {
          const cls = getStickerClasses(0);
          stickers.push(
            <div
              key={`sticker-waffle-${cartIndex}-${i}-${addonName}`}
              className={`sticker-area page-break bg-white text-black flex flex-col justify-between items-center h-full w-full ${cls.paddingClass}`}
              style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
            >
              <StickerHeader {...sharedProps} drinkIndex={drinkIndex} cls={cls} />
              <div className="w-full text-center flex-1 flex flex-col justify-center items-center px-1 overflow-hidden">
                <div className="w-full font-black uppercase leading-tight text-sm mb-1">{addonName}</div>
                <div className="w-full text-center font-bold text-[11px]"><div>Waffle Combo</div></div>
              </div>
              <StickerFooter cls={cls} formattedDate={formattedDate} formattedTime={formattedTime} />
            </div>
          );
          drinkIndex++;
        });
      }
      return;
    }

    const isMixMatch = item.remarks?.startsWith('[Drink:') ?? false;

    if (!isDrinkSticker && isMixMatch) {
      for (let i = 0; i < item.qty; i++) {
        const remarksContent = item.remarks?.replace(/^\[|\]$/g, '') ?? '';
        const parts = remarksContent.split(' | ');
        const drinkName = parts.find(p => p.startsWith('Drink:'))?.replace('Drink: ', '') ?? '';
        const sugarPart = parts.find(p => p.startsWith('Sugar:'))?.replace('Sugar: ', '') ?? '';
        const options = parts.filter(p => !p.startsWith('Drink:') && !p.startsWith('Sugar:') && !p.startsWith('+'));
        const addOns = parts.filter(p => p.startsWith('+')).map(p => p.replace('+', '').trim());
        const extraCount = options.length + addOns.length;
        const cls = getStickerClasses(extraCount);

        stickers.push(
          <div
            key={`sticker-mixmatch-${cartIndex}-${i}`}
            className={`sticker-area page-break bg-white text-black flex flex-col justify-between items-center h-full w-full ${cls.paddingClass}`}
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            <StickerHeader {...sharedProps} drinkIndex={drinkIndex} cls={cls} />
            <div className="w-full text-center flex-1 flex flex-col justify-center items-center px-1 overflow-hidden">
              <div className="text-[9px] font-bold uppercase text-black leading-none mb-0.5 tracking-wider">
                {item.name}
              </div>
              <div className={`w-full font-black uppercase leading-tight ${cls.nameSize} ${cls.marginClass}`}>
                {drinkName}
              </div>
              <div className={`w-full text-center font-bold ${cls.addOnSize} ${cls.gapClass}`}>
                {sugarPart && <div>Sugar: {sugarPart}</div>}
                {options.map(opt => <div key={opt}>{opt}</div>)}
                {addOns.map(a => <div key={a}>+ {a}</div>)}
              </div>
            </div>
            <StickerFooter cls={cls} formattedDate={formattedDate} formattedTime={formattedTime} />
          </div>
        );
        drinkIndex++;
      }
      return;
    }

    // ── Combo meal stickers (Food + Drink split for take-out) ────────────────
    const comboMatch = item.remarks?.match(/^(.+?) \[(.+)\]/);
    const isCombo = !!comboMatch && !item.remarks?.startsWith('[Drink:');

    if (isCombo) {
      for (let i = 0; i < item.qty; i++) {
        const drinkName = comboMatch[1];
        const drinkDetailsStr = comboMatch[2];
        const parts = drinkDetailsStr.split(' | ');
        const sugarPart = parts.find(p => p.startsWith('Sugar:'))?.replace('Sugar: ', '') ?? '';
        const options = parts.filter(p => !p.startsWith('Sugar:') && !p.startsWith('+'));
        const addOns = parts.filter(p => p.startsWith('+')).map(p => p.replace('+', '').trim());
        const extraCount = options.length + addOns.length;
        const cls = getStickerClasses(extraCount);

        // 1. Food Sticker (only for take-out/delivery or online orders)
        if (orderType !== 'dine-in' || isOnline) {
          // Try to get food name by removing the drink part if it's "Pizza + Drink" style
          const foodName = item.name.replace(new RegExp(` \\+ ${drinkName}$`, 'i'), '').replace(/ \+ DRINK$/i, '').trim();
          const foodCls = getStickerClasses(0, foodName.length);
          stickers.push(
            <div
              key={`sticker-combo-food-${cartIndex}-${i}`}
              className={`sticker-area page-break bg-white text-black flex flex-col justify-between items-center h-full w-full ${foodCls.paddingClass}`}
              style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
            >
              <StickerHeader {...sharedProps} drinkIndex={drinkIndex} cls={foodCls} />
              <div className="w-full text-center flex-1 flex flex-col justify-center items-center px-1 overflow-hidden">
                <div className="text-[9px] font-bold uppercase text-black leading-none mb-0.5 tracking-wider">
                  Combo — Food Part
                </div>
                <div className={`w-full font-black uppercase leading-tight ${foodCls.nameSize} ${foodCls.marginClass}`}>
                  {foodName}
                </div>
              </div>
              <StickerFooter cls={foodCls} formattedDate={formattedDate} formattedTime={formattedTime} />
            </div>
          );
          drinkIndex++;
        }

        // 2. Drink Sticker
        stickers.push(
          <div
            key={`sticker-combo-drink-${cartIndex}-${i}`}
            className={`sticker-area page-break bg-white text-black flex flex-col justify-between items-center h-full w-full ${cls.paddingClass}`}
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            <StickerHeader {...sharedProps} drinkIndex={drinkIndex} cls={cls} />
            <div className="w-full text-center flex-1 flex flex-col justify-center items-center px-1 overflow-hidden">
              <div className="text-[9px] font-bold uppercase text-black leading-none mb-0.5 tracking-wider">
                Combo Drink — {item.name}
              </div>
              <div className={`w-full font-black uppercase leading-tight ${cls.nameSize} ${cls.marginClass}`}>
                {drinkName}
              </div>
              <div className={`w-full text-center font-bold ${cls.addOnSize} ${cls.gapClass}`}>
                {sugarPart && <div>Sugar: {sugarPart}</div>}
                {options.map(opt => <div key={opt}>{opt}</div>)}
                {addOns.map(a => <div key={a}>+ {a}</div>)}
              </div>
            </div>
            <StickerFooter cls={cls} formattedDate={formattedDate} formattedTime={formattedTime} />
          </div>
        );
        drinkIndex++;
      }
      return;
    }

    // ── Non-drink food stickers (take-out / delivery / online) ───────────────
    if (!isDrinkSticker) {
      if (orderType === 'dine-in' && !isOnline) return;

      const cls = getStickerClasses(0, item.name.length);
      for (let i = 0; i < item.qty; i++) {
        stickers.push(
          <div
            key={`sticker-food-${cartIndex}-${i}`}
            className={`sticker-area page-break bg-white text-black flex flex-col justify-between items-center h-full w-full ${cls.paddingClass}`}
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            <StickerHeader {...sharedProps} drinkIndex={drinkIndex} cls={cls} />
            <div className="w-full text-center flex-1 flex flex-col justify-center items-center px-1 overflow-hidden">
              {item.cupSizeLabel && (
                <div className="text-[9px] font-bold uppercase text-black leading-none mb-0.5 tracking-wider">
                  {item.cupSizeLabel}
                </div>
              )}
              <div className={`w-full font-black uppercase leading-tight ${cls.nameSize} ${cls.marginClass}`}>
                {item.name}
              </div>
              {item.remarks && (
                <div className={`w-full text-center font-bold italic ${cls.addOnSize} mt-0.5`}>
                  {item.remarks}
                </div>
              )}
            </div>
            <StickerFooter cls={cls} formattedDate={formattedDate} formattedTime={formattedTime} />
          </div>
        );
        drinkIndex++;
      }
      return;
    }

    // ── Standard drink stickers ───────────────────────────────────────────────
    for (let i = 0; i < item.qty; i++) {
      const extraCount = (item.options?.length ?? 0) + (item.addOns?.length ?? 0);
      const cls = getStickerClasses(extraCount, item.name.length);

      stickers.push(
        <div
          key={`sticker-drink-${cartIndex}-${i}`}
          className={`sticker-area page-break bg-white text-black flex flex-col justify-between items-center h-full w-full ${cls.paddingClass}`}
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          <StickerHeader {...sharedProps} drinkIndex={drinkIndex} cls={cls} />
          <div className="w-full text-center flex-1 flex flex-col justify-center items-center px-1 overflow-hidden">
            {item.cupSizeLabel && (
              <div className="text-[9px] font-bold uppercase text-black leading-none mb-0.5 tracking-wider">
                {item.cupSizeLabel}
              </div>
            )}
            <div className={`w-full font-black uppercase leading-tight ${cls.nameSize} ${cls.marginClass}`}>
              {item.name}
            </div>
            <div className={`w-full text-center font-bold ${cls.addOnSize} ${cls.gapClass}`}>
              {item.sugarLevel && item.sugarLevel.trim() !== '' && <div>Sugar: {item.sugarLevel}</div>}
              {item.options?.map(opt => <div key={opt}>{opt}</div>)}
              {item.addOns?.map(a => <div key={a}>+ {a}</div>)}
              {item.remarks && <div className="italic">{item.remarks}</div>}
            </div>
          </div>
          <StickerFooter cls={cls} formattedDate={formattedDate} formattedTime={formattedTime} />
        </div>
      );
      drinkIndex++;
    }
  });

  return (
    <div className={`printable-receipt-container sticker-mode ${onScreen ? 'block' : 'hidden print:block'}`}>
      <style>{`
        @page {
          size: 38.5mm 50.8mm;
          margin: 0;
        }
        @media print {
          html, body {
            width: 38.5mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .printable-receipt-container.sticker-mode {
            width: 38.5mm !important;
            height: auto !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .sticker-area {
            width: 38.5mm !important;
            height: 50.8mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            box-sizing: border-box !important;
          }
          .sticker-area:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>
      {stickers.length > 0 ? stickers : (
        <div className="text-center py-20 text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
          No items eligible for stickers
        </div>
      )}
    </div>
  );
};
