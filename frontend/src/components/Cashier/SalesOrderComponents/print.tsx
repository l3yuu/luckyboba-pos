// ── print.tsx ─────────────────────────────────────────────────────────────────
// Printable receipt, kitchen order ticket, and drink sticker templates.
// All three are rendered off-screen and revealed only during window.print().

import React from 'react';
import logo from '../../../assets/logo.png';
import { type CartItem, type BundleComponentCustomization } from '../../../types/index';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────



// ─────────────────────────────────────────────────────────────────────────────
// ReceiptPrint
// ─────────────────────────────────────────────────────────────────────────────

interface ReceiptPrintProps {
  cart: CartItem[];
  branchName: string;
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
  change: number;
  cashTendered: number | '';
  referenceNumber: string;
  paymentMethod: string;
  selectedDiscount: { name: string } | null;
  totalDiscountDisplay: number;
  itemDiscountTotal: number;
  promoDiscount: number;
}

export const ReceiptPrint = ({
  cart, branchName, orNumber, queueNumber, cashierName,
  formattedDate, formattedTime, orderCharge, totalCount,
  subtotal, amtDue, vatableSales, vatAmount, change, cashTendered,
  referenceNumber, paymentMethod, selectedDiscount,
  totalDiscountDisplay, itemDiscountTotal, promoDiscount,
}: ReceiptPrintProps) => {

  return (
    <div className="printable-receipt-container hidden print:block">
      <div className="receipt-area bg-white text-black">

        {/* Store header */}
        <div className="text-center mb-4 border-b border-black pb-3">
          <img src={logo} alt="Lucky Boba Logo" className="w-48 h-auto mx-auto mb-2 grayscale" style={{ filter: 'grayscale(100%) contrast(1.2)' }} />
          <h1 className="uppercase leading-tight font-bold text-xl">LUCKY BOBA MILKTEA</h1>
          <p className="text-base mt-1">{branchName}</p>
          <h2 className="text-sm mt-2">{orNumber}</h2>
          <p className="text-sm mt-1">{formattedDate} {formattedTime}</p>
        </div>

        {/* Guest info */}
        <div className="text-xs space-y-1 mb-3">
          <div className="mt-1">Cashier: {cashierName ?? 'Admin'}</div>
          {orderCharge && <div className="mt-1">Order Type: {orderCharge === 'grab' ? 'GRABFOOD' : 'FOODPANDA'}</div>}
        </div>
{/* Items */}
<div className="mt-3 mb-3 text-xs border-t border-dashed border-black pt-3">
  {cart.map((item, i) => (
    <div key={i} className="mb-2">
      <div className="uppercase">{item.name} {item.cupSizeLabel ? `(${item.cupSizeLabel})` : ''}</div>
      <div className="flex justify-between w-full mt-0.5">
  <span>
    {item.qty} X {((item.finalPrice + (item.charges?.grab ? Number(item.grab_price ?? 0) : item.charges?.panda ? Number(item.panda_price ?? 0) : 0)) / item.qty).toFixed(2)}
  </span>
  <span>
    {(item.finalPrice + (item.charges?.grab ? Number(item.grab_price ?? 0) * item.qty : item.charges?.panda ? Number(item.panda_price ?? 0) * item.qty : 0)).toFixed(2)}
  </span>
</div>
      {item.discountLabel && (
        <div className="flex justify-between w-full text-[10px] italic">
          <span>  • Discount: {item.discountLabel}</span>
        </div>
      )}
      {item.size === 'none' && item.sugarLevel != null ? (
        <>
          <div className="pl-2 text-[10px]">• Classic Pearl</div>
          <div className="pl-4 text-[10px]">• Sugar {item.sugarLevel}</div>
          {item.options?.map(o => <div key={o} className="pl-4 text-[10px]">• {o}</div>)}
          {item.addOns?.map(a  => <div key={a} className="pl-4 text-[10px]">• + {a}</div>)}
        </>
      ) : (
        <>
          {item.sugarLevel != null && <div className="pl-2 text-[10px]">• Sugar {item.sugarLevel}</div>}
          {item.options?.map(o => <div key={o} className="pl-2 text-[10px]">• {o}</div>)}
          {item.addOns?.map(a  => <div key={a} className="pl-2 text-[10px]">• + {a}</div>)}
          {item.remarks && <div className="pl-2 text-[10px] italic">• {item.remarks}</div>}
        </>
      )}
    </div>
  ))}
</div>

        {/* Totals */}
        <div className="text-xs space-y-1 border-t border-dashed border-black pt-2">
          <div className="flex justify-between"><span>Total Items</span><span>{totalCount}</span></div>
          <div className="flex justify-between"><span>Sub Total</span><span>{subtotal.toFixed(2)}</span></div>
          {totalDiscountDisplay > 0 && (
            <>
              {itemDiscountTotal > 0 && (
                <div className="flex justify-between"><span>Item Discounts</span><span>- {itemDiscountTotal.toFixed(2)}</span></div>
              )}
              {selectedDiscount && (
                <div className="flex justify-between w-full font-bold"><span>Promo: {selectedDiscount.name}</span><span>- {promoDiscount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between font-bold border-t border-dashed border-black pt-1 mt-1">
                <span>Total Discount</span><span>- {totalDiscountDisplay.toFixed(2)}</span>
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
          <div className="flex justify-between"><span>VATable Sales(V)</span><span>{Number(vatableSales || 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>VAT Amount</span><span>{Number(vatAmount || 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>VAT Exempt Sales(E)</span><span>0.00</span></div>
          <div className="flex justify-between"><span>Zero-Rated Sales(Z)</span><span>0.00</span></div>
        </div>

        {/* Signature fields */}
        <div className="text-xs mt-5 space-y-2">
          {['Name:', 'TIN/ID/SC:', 'Address:', 'Signature:'].map(label => (
            <div key={label} className="flex justify-between items-end w-full">
              <span>{label}</span><span className="border-b border-black w-[70%]" />
            </div>
          ))}
        </div>

        {/* Franchise info */}
        <div className="mt-6 mb-4 text-center text-xs">
          FOR FRANCHISE<br />EMAIL OR CONTACT US ON<br />luckyboba.franchise@gmail.com<br />0917199894
        </div>

        {/* Queue number stub 1 — cut after */}
        <div className="mt-6 py-4 text-center" style={{ pageBreakAfter: 'always' }}>
          <p className="text-sm tracking-widest uppercase mb-1">Your Order Number Is:</p>
          <h2 className="font-black text-4xl">#{queueNumber}</h2>
          <p className="text-[10px] mt-2 uppercase text-gray-500">Please wait for your number to be called</p>
        </div>

        {/* Queue number stub 2 — cut after */}
        <div className="py-4 text-center" style={{ pageBreakAfter: 'always' }}>
          <p className="text-sm tracking-widest uppercase mb-1">Your Order Number Is:</p>
          <h2 className="font-black text-4xl">#{queueNumber}</h2>
          <p className="text-[10px] mt-2 uppercase text-gray-500">Please wait for your number to be called</p>
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
}

export const KitchenPrint = ({
  cart, branchName, orNumber, queueNumber, formattedDate, formattedTime,
}: KitchenPrintProps) => (
  <div className="printable-receipt-container hidden print:block">
    <div className="receipt-area bg-white text-black">
      <div className="text-center mb-4 border-b-4 border-black pb-3">
        <h1 className="uppercase leading-tight font-black text-3xl mb-1">ORDER TICKET</h1>
        <h2 className="font-bold text-lg uppercase tracking-widest">{branchName}</h2>
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
                <div className="uppercase text-sm leading-tight mb-1">{item.name} {item.cupSizeLabel ? `(${item.cupSizeLabel})` : ''}</div>
                {item.size === 'none' && item.sugarLevel != null ? (
                  <>
                    <div className="text-sm font-bold mt-1">• Classic Pearl</div>
                    <div className="text-sm pl-3">Sugar: {item.sugarLevel}</div>
                    {item.options && item.options.length > 0 && <div className="text-sm pl-3">Options: {item.options.join(', ')}</div>}
                    {item.addOns  && item.addOns.length  > 0 && <div className="text-sm pl-3">Add: {item.addOns.join(', ')}</div>}
                  </>
                ) : (
                  <>
                    {item.sugarLevel != null && <div className="text-sm mt-1">Sugar: {item.sugarLevel}</div>}
                    {item.options && item.options.length > 0 && <div className="text-sm">Options: {item.options.join(', ')}</div>}
                    {item.addOns  && item.addOns.length  > 0 && <div className="text-sm">Add: {item.addOns.join(', ')}</div>}
                    {item.remarks && <div className="text-sm italic mt-2 border-t border-gray-200 pt-1">{item.remarks}</div>}
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

const getStickerClasses = (extraCount: number): StickerClasses => {
  const isCrowded     = extraCount >= 3;
  const isVeryCrowded = extraCount >= 5;
  return {
    paddingClass:  isVeryCrowded ? 'p-0.5' : 'p-1',
    titleSize:     isVeryCrowded ? 'text-[10px]' : isCrowded ? 'text-[11px]' : 'text-[12px]',
    nameSize:      isVeryCrowded ? 'text-[8.5px]' : isCrowded ? 'text-[10px]' : 'text-xs',
    addOnSize:     isVeryCrowded ? 'text-[6px]' : isCrowded ? 'text-[7px]' : 'text-[9px]',
    gapClass:      isVeryCrowded ? 'space-y-0 leading-none' : 'space-y-0.5 leading-tight',
    marginClass:   isVeryCrowded ? 'mb-0' : 'mb-1',
    isVeryCrowded,
  };
};

const StickerHeader = ({
  branchName, orNumber, queueNumber, customerName, drinkIndex, totalDrinks, cls,
}: {
  branchName: string; orNumber: string; queueNumber: string;
  customerName: string; drinkIndex: number; totalDrinks: number;
  cls: StickerClasses;
}) => (
  <div className="w-full text-center flex flex-col items-center">
    <div className={`font-black uppercase leading-none ${cls.titleSize}`}>LUCKY BOBA</div>
    <div className={`font-bold uppercase leading-none tracking-widest ${cls.isVeryCrowded ? 'text-[5px] mt-0.5' : 'text-[6.5px] mt-1'}`}>
      {branchName.toUpperCase()}
    </div>
    <div className={`w-full flex justify-between items-center font-bold border-b-[1.5px] border-black px-1 ${cls.isVeryCrowded ? 'text-[10px] pb-0 mb-0 mt-0.5' : 'text-[10px] pb-0.5 mb-0 mt-1'}`}>
      <span>Q: {queueNumber} | SI: {orNumber.slice(-6)}</span>
      <span>{drinkIndex}/{totalDrinks}</span>
    </div>
    {customerName && (
      <div className={`w-full text-center font-black uppercase px-1 ${cls.isVeryCrowded ? 'text-[9px] pb-0 mb-0.5 mt-0' : 'text-[10px] pb-0.5 mb-1 mt-0'}`}>
        {customerName}
      </div>
    )}
  </div>
);

const StickerFooter = ({ cls, formattedDate, formattedTime }: { cls: StickerClasses; formattedDate: string; formattedTime: string }) => (
  <>
    <div className="w-full text-center mt-auto mb-0.5">
      <p className={`font-black uppercase whitespace-nowrap tracking-tighter ${cls.isVeryCrowded ? 'text-[5.5px]' : 'text-[7px]'}`}>
        Best consume within 30 minutes
      </p>
    </div>
    <div className={`w-full font-bold text-center border-t border-zinc-800 ${cls.isVeryCrowded ? 'text-[8.5px] pt-0.5 mt-0.5' : 'text-[8.5px] pt-1 mt-1'}`}>
      {formattedDate} {formattedTime}
    </div>
  </>
);

export const StickerPrint = ({
  cart, branchName, orNumber, queueNumber, customerName, formattedDate, formattedTime,
}: StickerPrintProps) => {
  const stickers: React.ReactNode[] = [];
  let drinkIndex = 1;

  const totalDrinks = cart.reduce((acc, item) => {
    if (item.isBundle) {
      return acc + (item.bundleComponents?.reduce((s, c) => s + c.quantity, 0) ?? 0) * item.qty;
    }
    const isSticker   = item.sugarLevel !== undefined || item.size === 'M' || item.size === 'L';
    const waffleCount = (item.addOns?.filter(a => a.toLowerCase().includes('waffle combo')).length ?? 0) * item.qty;
    return acc + (isSticker ? item.qty : 0) + (!isSticker ? waffleCount : 0);
  }, 0);

  const sharedProps = { branchName, orNumber, queueNumber, customerName, totalDrinks, formattedDate, formattedTime };

  cart.forEach((item, cartIndex) => {

    // ── Bundle stickers ─────────────────────────────────────────────────────
    if (item.isBundle && item.bundleComponents && item.bundleComponents.length > 0) {
      for (let q = 0; q < item.qty; q++) {
        item.bundleComponents.forEach((component: BundleComponentCustomization, compIdx: number) => {
          for (let cq = 0; cq < component.quantity; cq++) {
            const cls = getStickerClasses(component.options.length + component.addOns.length);
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
                    <div>Sugar: {component.sugarLevel}</div>
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

    // ── Waffle combo add-on stickers ─────────────────────────────────────────
    const isSticker       = item.sugarLevel !== undefined || item.size === 'M' || item.size === 'L';
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

    if (!isSticker) return;

    // ── Regular drink stickers ───────────────────────────────────────────────
    const cls      = getStickerClasses((item.options?.length || 0) + (item.addOns?.length || 0) + (item.remarks ? 1 : 0));
    const sizeLabel = item.cupSizeLabel ? `(${item.cupSizeLabel})` : '';

    for (let i = 0; i < item.qty; i++) {
      stickers.push(
        <div
          key={`sticker-${cartIndex}-${i}`}
          className={`sticker-area page-break bg-white text-black flex flex-col justify-between items-center h-full w-full ${cls.paddingClass}`}
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          <StickerHeader {...sharedProps} drinkIndex={drinkIndex} cls={cls} />
          <div className="w-full text-center flex-1 flex flex-col justify-center items-center px-1 overflow-hidden">
            <div className={`w-full font-black uppercase leading-tight ${cls.nameSize} ${cls.marginClass}`}>
              {item.size === 'none' && item.sugarLevel != null ? 'CLASSIC PEARL' : `${item.name} ${sizeLabel}`}
            </div>
            <div className={`w-full text-center font-bold ${cls.addOnSize} ${cls.gapClass}`}>
              {item.sugarLevel != null && <div>Sugar: {item.sugarLevel}</div>}
              {item.options?.map(opt => <div key={opt}>{opt}</div>)}
              {item.addOns?.map(a => <div key={a}>+ {a}</div>)}
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