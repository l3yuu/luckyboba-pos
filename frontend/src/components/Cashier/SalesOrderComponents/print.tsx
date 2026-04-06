// ── print.tsx ─────────────────────────────────────────────────────────────────
// Printable receipt, kitchen order ticket, and drink sticker templates.
// All three are rendered off-screen and revealed only during window.print().

import React from 'react';
import logo from '../../../assets/logo.png';
import { type CartItem, type BundleComponentCustomization } from '../../../types/index';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PosFooterData {
  pos_supplier?:    string;
  pos_address?:     string;
  pos_tin?:         string;
  pos_accred_no?:   string;
  pos_date_issued?: string;
  pos_valid_until?: string;
  pos_ptu?:         string;
  pos_ptu_date?:    string;
  business_name?:   string;
}

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
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  orNumber: string;
  queueNumber: string;
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
  itemPaxAssignments?: Record<string, ('none' | 'sc' | 'pwd')[]>;
  posFooter?: PosFooterData;
  receiptFooter?: string;
}

export const ReceiptPrint = ({
  cart, branchName, brand, companyName, storeAddress, vatRegTin, minNumber, serialNumber, ownerName,
  businessName, businessEmail, businessPhone, businessAddress,
  orNumber, queueNumber, cashierName,
  formattedDate, formattedTime, orderCharge, totalCount,
  subtotal, amtDue, vatableSales, vatAmount, vatExemptSales = 0, change, cashTendered,
  referenceNumber, paymentMethod, selectedDiscount,
  selectedDiscounts = [],
  orderType,
  customerName,
  totalDiscountDisplay, itemDiscountTotal, promoDiscount, addOnsData = [], showDoubleQueueStub = true,
  isReprint = false,
  vatType = 'vat',
  paxSenior = 0,
  paxPwd = 0,
  // FIX #3 — renamed from seniorId/pwdId (singular string) to seniorIds/pwdIds (string[])
  seniorIds = [],
  pwdIds = [],
  itemPaxAssignments = {},
  posFooter = {},
  receiptFooter = '',
}: ReceiptPrintProps) => {

  // FIX #6 + #7 — removed dead coveredUnitMap / itemCoverageMap computation that
  // was never read and had incorrect sorted-index logic. The split-groups block
  // below uses itemPaxAssignments directly, which is the correct source of truth.

  const isVat = vatType === 'vat';

  return (
    <div className="printable-receipt-container hidden print:block">
      <div className="receipt-area bg-white text-black">

        {/* Store header */}
        <div className="text-center mb-4 border-b border-black pb-3">
          <img src={logo} alt="Lucky Boba Logo" className="w-48 h-auto mx-auto mb-2 grayscale" style={{ filter: 'grayscale(100%) contrast(1.2)' }} />
          <h1 className="uppercase leading-tight font-bold text-xl">{businessName || posFooter.business_name || brand || 'LUCKY BOBA'}</h1>
          {isReprint && (
            <div className="absolute top-2 right-2 border-2 border-black px-2 py-1 font-bold text-xs rotate-12 opacity-50">REPRINT</div>
          )}
          {ownerName && (
            <div className="text-center text-[10px] leading-tight">
              <span>Owned and Operated By:</span>
              <br />
              <span className="font-bold">{ownerName}</span>
            </div>
          )}
          {companyName && <p className="text-xs mt-0.5 font-semibold">{companyName}</p>}
          <p className="text-base mt-1">{branchName}</p>
          {storeAddress && <p className="text-xs mt-0.5">{storeAddress}</p>}
          {vatRegTin && <p className="text-xs mt-0.5">VAT Reg TIN: {vatRegTin}</p>}
          {minNumber && <p className="text-xs mt-0.5">MIN: {minNumber}</p>}
          {serialNumber && <p className="text-xs mt-0.5">SN: {serialNumber}</p>}
          <h2 className="text-sm mt-2">{orNumber}</h2>
          <p className="text-sm mt-1">{formattedDate} {formattedTime}</p>
        </div>

        {/* Guest info */}
        <div className="text-xs space-y-1 mb-3">
          <div className="mt-1">Cashier: {cashierName ?? 'Admin'}</div>
          <div className="mt-1">
            Order Mode: {orderType === 'dine-in' ? 'DINE IN' : 'TAKE OUT'}
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
            const splitGroups: {
              cartIndex: number;
              item: CartItem;
              discountType: 'none' | 'sc' | 'pwd';
              discountLabel: string;
              discountPct: number;
              count: number;
            }[] = [];

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

            const shownAddOns = new Set<number>();

            return splitGroups.map((group, gi) => {
              const { cartIndex, item, discountType, discountLabel, discountPct, count } = group;
              const hasPaxDiscount = discountType !== 'none' && isVat;
              const isFirstGroupForItem = splitGroups.findIndex(g => g.cartIndex === cartIndex) === gi;
              const showAddOns = !shownAddOns.has(cartIndex);
              if (showAddOns) shownAddOns.add(cartIndex);

              // FIX #8 — for Grab/Panda orders item.price already IS the surcharge price
              // (the menu stores grab_price / panda_price as the full item price in those modes).
              // surchargePerUnit is only used as a display delta for the "X qty × unit" label —
              // do NOT add it again to unitGross, which would double-count it.
              const addOnUnitPrice = (addonName: string): number => {
                const a = addOnsData.find(x => x.name === addonName);
                if (!a) return 0;
                return item.charges?.grab && Number(a.grab_price ?? 0) > 0
                  ? Number(a.grab_price)
                  : item.charges?.panda && Number(a.panda_price ?? 0) > 0
                  ? Number(a.panda_price)
                  : Number(a.price);
              };

              const addOnCostPerUnit = (item.addOns ?? []).reduce(
                (sum, name) => sum + addOnUnitPrice(name),
                0
              );

              // item.price already reflects the correct Grab/Panda/base price —
              // unitGross is simply the per-unit base price plus any add-on cost.
              const unitGross = Number(item.price) + addOnCostPerUnit;
              const unitVatExcl = isVat ? unitGross / 1.12 : unitGross;
              const discountAmt = hasPaxDiscount ? unitVatExcl * (discountPct / 100) : 0;
              const netPrice = hasPaxDiscount ? unitVatExcl - discountAmt : unitGross;

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
                      {count} X {Number(item.price).toFixed(2)}
                    </span>
                    <span>
                      {(unitGross * count).toFixed(2)}
                    </span>
                  </div>

                  {/* ── Per-item SC/PWD VAT breakdown ── */}
                  {hasPaxDiscount && (
                    <div className="mt-1 pl-1 text-[10px] border-t border-dashed border-gray-400 pt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>{discountLabel} Discount ({discountPct}%)</span>
                        <span>-₱{(discountAmt * count).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-dashed border-gray-400 pt-0.5">
                        <span>Net Price (VAT Exempt)</span>
                        <span>₱{(netPrice * count).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

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
                    <>
                      {item.size === 'none' && item.sugarLevel != null ? (
                        <>
                          <div className="pl-2 text-[10px]">• Classic Pearl</div>
                          <div className="pl-4 text-[10px]">• Sugar {item.sugarLevel}</div>
                          {item.options?.map(o => <div key={o} className="pl-4 text-[10px]">• {o}</div>)}
                        </>
                      ) : (
                        <>
                          {item.sugarLevel != null && item.sugarLevel !== '' && <div className="pl-2 text-[10px]">• Sugar {item.sugarLevel}</div>}
                          {item.options?.map(o => <div key={o} className="pl-2 text-[10px]">• {o}</div>)}
                          {item.remarks && <div className="pl-2 text-[10px] italic">• {item.remarks}</div>}
                        </>
                      )}
                    </>
                  )}

                  {/* Add-ons as separate line items - only once per original item */}
                  {showAddOns && item.addOns && item.addOns.length > 0 && item.addOns.map((addonName, ai) => {
                    const addonUnitPrice = addOnUnitPrice(addonName);
                    const addonTotal = addonUnitPrice * item.qty;
                    return (
                      <div key={ai} className="mt-2 pt-1 border-t border-dashed border-gray-300">
                        <div className="uppercase font-medium">{addonName}</div>
                        <div className="flex justify-between w-full mt-0.5">
                          <span>{item.qty} X {addonUnitPrice.toFixed(2)}</span>
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
          <div className="flex justify-between"><span>Sub Total</span><span>{subtotal.toFixed(2)}</span></div>
          {totalDiscountDisplay > 0 && (
            <>
              {itemDiscountTotal > 0 && (
                <div className="flex justify-between">
                  <span>Item Discount(s)</span>
                  <span>- {itemDiscountTotal.toFixed(2)}</span>
                </div>
              )}
              {selectedDiscount && promoDiscount > 0 && (
                <div className="flex justify-between">
                  <span>
                    Promo: {selectedDiscount.name}
                    {(selectedDiscount as { name: string; amount?: number; type?: string }).type?.includes('Percent')
                      ? ` (${(selectedDiscount as { name: string; amount?: number; type?: string }).amount}%)`
                      : (selectedDiscount as { name: string; amount?: number; type?: string }).amount
                      ? ` (-₱${(selectedDiscount as { name: string; amount?: number; type?: string }).amount})`
                      : ''}
                  </span>
                  <span>- {promoDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-dashed border-black pt-1 mt-1">
                <span>Total Discount</span>
                <span>- {totalDiscountDisplay.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-base font-bold mt-1"><span>TOTAL DUE</span><span>{amtDue.toFixed(2)}</span></div>
        </div>

        {/* Payment */}
        <div className="text-xs mt-2 space-y-1 border-b border-dashed border-black pb-3">
          <div className="flex justify-between"><span>Payment Method</span><span className="uppercase font-bold">{paymentMethod}</span></div>
          {paymentMethod === 'cash' && (
            <>
              <div className="flex justify-between"><span>Cash (Tendered)</span><span>{typeof cashTendered === 'number' ? cashTendered.toFixed(2) : amtDue.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Change</span><span>{change.toFixed(2)}</span></div>
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
              <div className="flex justify-between"><span>VAT Exempt Sales(E)</span><span>{Number(amtDue || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Zero-Rated Sales(Z)</span><span>0.00</span></div>
            </>
          ) : (
            <>
              <div className="flex justify-between"><span>VATable Sales(V)</span><span>{Number(vatableSales || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>VAT Amount</span><span>{Number(vatAmount || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>VAT Exempt Sales(E)</span><span>{Number(vatExemptSales || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Zero-Rated Sales(Z)</span><span>0.00</span></div>
            </>
          )}
        </div>

        {/* Signature fields */}
        <div className="text-xs mt-5 space-y-2">
          {['Name:', 'TIN/ID/SC:', 'Address:', 'Signature:'].map(label => (
            <div key={label} className="flex justify-between items-end w-full">
              <span>{label}</span>
              <span className="border-b border-black w-[70%] relative">
                {label === 'Name:' && customerName && (
                  <span className="absolute left-1 bottom-0 text-[10px]">{customerName}</span>
                )}
                {/* FIX #3 — join arrays to a comma-separated string for display */}
                {label === 'TIN/ID/SC:' && (seniorIds.length > 0 || pwdIds.length > 0) && (
                  <span className="absolute left-1 bottom-0 text-[10px]">
                    {[...seniorIds, ...pwdIds].join(', ')}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 mb-4 text-center text-xs">
          {(businessEmail || businessPhone || businessAddress) && (
            <>
              FOR FRANCHISE<br />
              EMAIL OR CONTACT US ON<br />
              {businessEmail || 'luckyboba.franchise@gmail.com'}<br />
              {businessPhone || '09171699894'}<br />
              {businessAddress && <div className="mt-1 normal-case">{businessAddress}</div>}
            </>
          )}
          {!businessName && !businessEmail && !businessPhone && !businessAddress && (
            <>
              FOR FRANCHISE<br />
              EMAIL OR CONTACT US ON<br />
              luckyboba.franchise@gmail.com<br />
              09171699894
            </>
          )}
        </div>

        {receiptFooter && (
          <div className="text-center text-xs whitespace-pre-wrap font-bold mb-4 uppercase px-4 leading-relaxed">
            {receiptFooter}
          </div>
        )}

        {/* ── POS Supplier Footer ── */}
        {(posFooter.pos_supplier || posFooter.pos_tin) && (
          <div className="mt-2 mb-4 text-left text-[10px] border-t border-dashed border-black pt-3 space-y-0.5 leading-snug">
            {posFooter.pos_supplier    && <div className="font-bold uppercase">POS SUPPLIER: {posFooter.pos_supplier}</div>}
            {posFooter.pos_address     && <div>{posFooter.pos_address}</div>}
            {posFooter.pos_tin         && <div>TIN: {posFooter.pos_tin}</div>}
            {posFooter.pos_accred_no   && <div>Accred No: {posFooter.pos_accred_no}</div>}
            {posFooter.pos_date_issued && <div>Date Issued: {posFooter.pos_date_issued}</div>}
            {posFooter.pos_valid_until && <div>Valid Until: {posFooter.pos_valid_until}</div>}
            {posFooter.pos_ptu         && <div>PTU No: {posFooter.pos_ptu}</div>}
            {posFooter.pos_ptu_date    && <div>PTU Date Issued: {posFooter.pos_ptu_date}</div>}
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
// KitchenPrint
// ─────────────────────────────────────────────────────────────────────────────

interface KitchenPrintProps {
  cart: CartItem[];
  branchName: string;
  brand?: string;
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  orNumber: string;
  queueNumber: string;
  cashierName: string;
  formattedDate: string;
  formattedTime: string;
  customerName: string;
  orderType: 'dine-in' | 'take-out' | 'delivery';
  isReprint?: boolean;
  posFooter?: any;
}

export const KitchenPrint = ({
  cart, branchName, brand, businessName, businessEmail, businessPhone, businessAddress,
  orNumber, queueNumber, cashierName,
  formattedDate, formattedTime, orderType,
  customerName,
  isReprint = false,
  posFooter = {},
}: KitchenPrintProps) => (
  <div className="printable-receipt-container hidden print:block">
    <div className="receipt-area bg-white text-black">
      <div className="text-center mb-4 border-b-4 border-black pb-3">
        <h1 className="uppercase leading-tight font-black text-2xl mb-1">{businessName || posFooter.business_name || brand || 'LUCKY BOBA'}</h1>
        {isReprint && (
          <div className="text-sm font-bold border-2 border-black inline-block px-2 mt-1">REPRINT</div>
        )}
        <h2 className="font-bold text-lg uppercase tracking-widest">{branchName}</h2>
        <div className="mt-2 text-sm uppercase font-bold">
          <div>ORDER TICKET</div>
          <div>Customer: {customerName || 'N/A'}</div>
          <div>Mode: {orderType === 'dine-in' ? 'DINE IN' : 'TAKE OUT'}</div>
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

                {item.size === 'none' ? (
  <>
    <div className="pl-2 text-[10px]">• Classic Pearl</div>
    {item.sugarLevel != null && (
      <div className="pl-4 text-[10px]">• Sugar {item.sugarLevel}</div>
    )}
    {item.options?.map(o => <div key={o} className="pl-4 text-[10px]">• {o}</div>)}
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
      
      <div className="mt-4 pt-2 border-t border-black text-center text-[8px] uppercase">
        {cashierName && <div>Cashier: {cashierName}</div>}
        {businessEmail && <div>{businessEmail}</div>}
        {businessPhone && <div>{businessPhone}</div>}
        {businessAddress && <div className="normal-case">{businessAddress}</div>}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// StickerPrint
// ─────────────────────────────────────────────────────────────────────────────

interface StickerPrintProps {
  cart: CartItem[];
  branchName: string;
  brand?: string;
  businessName?: string;
  orNumber: string;
  queueNumber: string;
  customerName: string;
  formattedDate: string;
  formattedTime: string;
  orderType: 'dine-in' | 'take-out' | 'delivery';
  posFooter?: any;
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
  const isCrowded       = extraCount >= 2;
  const isVeryCrowded   = extraCount >= 4;
  const isUltraCrowded  = extraCount >= 6;
  const isLongName      = nameLength > 12;
  const isVeryLongName  = nameLength > 18;
  const isUltraLongName = nameLength > 25;
  return {
    paddingClass:  isUltraCrowded ? 'p-0' : isVeryCrowded ? 'p-0.5' : 'p-1',
    titleSize:     isUltraCrowded ? 'text-[8px]' : isVeryCrowded ? 'text-[9px]' : isCrowded ? 'text-[10px]' : 'text-[11px]',
    nameSize:      isUltraCrowded || isUltraLongName
                     ? 'text-[7px]'
                     : isVeryCrowded || isVeryLongName
                     ? 'text-[8px]'
                     : isCrowded || isLongName
                     ? 'text-[9px]'
                     : 'text-[11px]',
    addOnSize:     isUltraCrowded ? 'text-[5.5px]' : isVeryCrowded ? 'text-[6px]' : isCrowded ? 'text-[7px]' : 'text-[8px]',
    gapClass:      isUltraCrowded ? 'space-y-0 leading-none' : isVeryCrowded ? 'space-y-0 leading-tight' : 'space-y-0.5 leading-tight',
    marginClass:   isUltraCrowded || isVeryCrowded ? 'mb-0' : 'mb-0.5',
    isVeryCrowded: isVeryCrowded || isUltraCrowded,
  };
};

const StickerHeader = ({
  branchName, orNumber, queueNumber, customerName, drinkIndex, totalDrinks, cls, orderType,
  businessName, brand, posFooter = {},
}: {
  branchName: string; orNumber: string; queueNumber: string;
  customerName: string; drinkIndex: number; totalDrinks: number;
  cls: StickerClasses;
  orderType: 'dine-in' | 'take-out' | 'delivery';
  businessName?: string;
  brand?: string;
  posFooter?: any;
}) => (
  <div className="w-full text-center flex flex-col items-center">
    <div className={`font-black uppercase leading-none ${cls.isVeryCrowded ? 'text-[9px]' : 'text-[11px]'}`}>
      {businessName || posFooter.business_name || brand || 'LUCKY BOBA'}
    </div>
    <div className={`font-bold uppercase leading-none tracking-widest ${cls.isVeryCrowded ? 'text-[4.5px] mt-0' : 'text-[6px] mt-0.5'}`}>
      {branchName.toUpperCase()}
    </div>
    <div className={`w-full flex justify-between items-center font-bold border-b-[1.5px] border-black px-1 ${cls.isVeryCrowded ? 'text-[8px] pb-0 mb-0 mt-0' : 'text-[9px] pb-0.5 mb-0 mt-0.5'}`}>
      <span>Q:{queueNumber} SI:{orNumber.slice(-5)}</span>
      <span>{drinkIndex}/{totalDrinks}</span>
    </div>
    {(customerName || orderType) && (
      <div className={`w-full text-center font-black uppercase px-1 leading-none ${cls.isVeryCrowded ? 'text-[7px] mt-0' : 'text-[8px] mt-0.5'}`}>
        {customerName && <div className="truncate">{customerName}</div>}
        <div>{orderType === 'dine-in' ? 'DINE IN' : 'TAKE OUT'}</div>
      </div>
    )}
  </div>
);

const StickerFooter = ({ cls, formattedDate, formattedTime }: { cls: StickerClasses; formattedDate: string; formattedTime: string }) => (
  <>
    <div className="w-full text-center mt-auto">
      <p className={`font-black uppercase whitespace-nowrap tracking-tighter ${cls.isVeryCrowded ? 'text-[4.5px]' : 'text-[6px]'}`}>
        Best consume within 30 minutes
      </p>
    </div>
    <div className={`w-full font-bold text-center border-t border-zinc-800 ${cls.isVeryCrowded ? 'text-[7px] pt-0 mt-0' : 'text-[8px] pt-0.5 mt-0.5'}`}>
      {formattedDate} {formattedTime}
    </div>
  </>
);

export const StickerPrint = ({
  cart, branchName, brand, businessName,
  orNumber, queueNumber, customerName, formattedDate, formattedTime, orderType,
  posFooter = {},
}: StickerPrintProps) => {
  const stickers: React.ReactNode[] = [];
  let drinkIndex = 1;

  const totalDrinks = cart.reduce((acc, item) => {
    if (item.isBundle) {
      return acc + (item.bundleComponents?.reduce((s, c) => s + c.quantity, 0) ?? 0) * item.qty;
    }
    const isSticker   = item.sugarLevel !== undefined || item.size === 'M' || item.size === 'L';
    const isMixMatch  = item.remarks?.startsWith('[Drink:') ?? false;
    const waffleCount = (item.addOns?.filter(a => a.toLowerCase().includes('waffle combo')).length ?? 0) * item.qty;
    return acc + (isSticker ? item.qty : 0) + (!isSticker && isMixMatch ? item.qty : 0) + (!isSticker ? waffleCount : 0);
  }, 0);

  const sharedProps = { branchName, orNumber, queueNumber, customerName, totalDrinks, formattedDate, formattedTime, orderType, businessName, brand, posFooter };

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
                  <div className="text-[7px] font-bold uppercase text-zinc-400 leading-none mb-0.5 tracking-wider">{item.name}</div>
                  <div className={`w-full font-black uppercase leading-tight ${cls.nameSize} ${cls.marginClass}`}>{component.name}</div>
                  <div className={`w-full text-center font-bold ${cls.addOnSize} ${cls.gapClass}`}>
                    {component.sugarLevel && component.sugarLevel.trim() !== '' && (
                      <div>Sugar: {component.sugarLevel}</div>
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
    const isSticker         = item.sugarLevel !== undefined || item.size === 'M' || item.size === 'L';
    const waffleComboAddOns = item.addOns?.filter(a => a.toLowerCase().includes('waffle combo')) ?? [];

    if (!isSticker && waffleComboAddOns.length > 0) {
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
                <div className="w-full font-black uppercase leading-tight text-xs mb-1">{addonName}</div>
                <div className="w-full text-center font-bold text-[9px]"><div>Waffle Combo</div></div>
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

    if (!isSticker && isMixMatch) {
      for (let i = 0; i < item.qty; i++) {
        const remarksContent = item.remarks?.replace(/^\[|\]$/g, '') ?? '';
        const parts      = remarksContent.split(' | ');
        const drinkName  = parts.find(p => p.startsWith('Drink:'))?.replace('Drink: ', '') ?? '';
        const sugarPart  = parts.find(p => p.startsWith('Sugar:'))?.replace('Sugar: ', '') ?? '';
        const options    = parts.filter(p => !p.startsWith('Drink:') && !p.startsWith('Sugar:') && !p.startsWith('+'));
        const addOns     = parts.filter(p => p.startsWith('+')).map(p => p.replace('+', '').trim());
        const extraCount = options.length + addOns.length;
        const cls        = getStickerClasses(extraCount);

        stickers.push(
          <div
            key={`sticker-mixmatch-${cartIndex}-${i}`}
            className={`sticker-area page-break bg-white text-black flex flex-col justify-between items-center h-full w-full ${cls.paddingClass}`}
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            <StickerHeader {...sharedProps} drinkIndex={drinkIndex} cls={cls} />
            <div className="w-full text-center flex-1 flex flex-col justify-center items-center px-1 overflow-hidden">
              <div className="text-[7px] font-bold uppercase text-zinc-400 leading-none mb-0.5 tracking-wider">
                Mix & Match — {item.name}
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

    // ── Non-drink food stickers (take-out / delivery only) ────────────────────
    if (!isSticker) {
      if (orderType === 'dine-in') return;

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
                <div className="text-[7px] font-bold uppercase text-zinc-400 leading-none mb-0.5 tracking-wider">
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
      const cls        = getStickerClasses(extraCount, item.name.length);

      stickers.push(
        <div
          key={`sticker-drink-${cartIndex}-${i}`}
          className={`sticker-area page-break bg-white text-black flex flex-col justify-between items-center h-full w-full ${cls.paddingClass}`}
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          <StickerHeader {...sharedProps} drinkIndex={drinkIndex} cls={cls} />
          <div className="w-full text-center flex-1 flex flex-col justify-center items-center px-1 overflow-hidden">
            {item.cupSizeLabel && (
              <div className="text-[7px] font-bold uppercase text-zinc-400 leading-none mb-0.5 tracking-wider">
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
    <div className="printable-receipt-container hidden print:block">
      {stickers}
    </div>
  );
};