// ── layout.tsx ────────────────────────────────────────────────────────────────
// Header, MenuArea (category browser + item grid), and CartSidebar.

import { type Category, type MenuItem, type CartItem, WINGS_QUANTITIES } from '../../../types/index';
import { DrinkIcon, BASE_CARD, TYPE_BADGE } from './shared';

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────

interface HeaderProps {
  branchName: string;
  cashierName: string;
  formattedDate: string;
  formattedTime: string;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onHomeClick: () => void;
}

export const Header = ({
  branchName, formattedDate, formattedTime,
  searchQuery, onSearchChange, onHomeClick,
}: HeaderProps) => (
  <div className="flex gap-3 px-4 py-3 bg-white border-b border-[#e9d5ff] items-center h-20 shrink-0 shadow-sm z-20">
    <button
      onClick={onHomeClick}
      className="bg-[#a020f0] text-white h-full px-5 rounded-[0.625rem] font-black text-[11px] uppercase tracking-widest shadow-md hover:bg-[#6a12b8] transition-all flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
      Home
    </button>

    <div className="flex-1 bg-[#f5f0ff] rounded-[0.625rem] border-2 border-[#e9d5ff] flex items-center px-4 gap-2 h-full focus-within:border-[#a020f0] transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-zinc-400 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z" />
      </svg>
      <input
        type="text"
        placeholder="Search item..."
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        className="flex-1 bg-transparent font-bold text-black outline-none uppercase placeholder:text-[#a020f0]/30 text-sm"
      />
    </div>

    <div className="flex gap-2 h-full">
      <div className="bg-[#f5f0ff] border-2 border-[#e9d5ff] rounded-[0.625rem] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-[9px] font-black uppercase text-[#a020f0]/50 tracking-widest leading-none">Branch</div>
          <div className="text-[11px] font-black text-[#a020f0] uppercase leading-tight mt-0.5">{branchName}</div>
        </div>
      </div>
      <div className="bg-[#a020f0] rounded-[0.625rem] flex items-center justify-center px-4 min-w-22.5 shadow-md">
        <div className="text-center text-white">
          <div className="text-[9px] font-bold uppercase opacity-60 leading-none">{formattedDate}</div>
          <div className="text-[13px] font-black leading-tight mt-0.5">{formattedTime}</div>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MenuArea
// ─────────────────────────────────────────────────────────────────────────────

interface MenuAreaProps {
  menuAvailable: boolean;
  selectedCategory: Category | null;
  categorySize: string | null;
  searchQuery: string;
  filteredCategories: Category[];
  isWings: boolean;
  categoryHasOnlyOneSize: boolean;
  isDrink: boolean;
  getFilteredItems: (items: MenuItem[]) => MenuItem[];
  onCategoryClick: (cat: Category) => void;
  onItemClick: (item: MenuItem) => void;
  onSizeSelect: (size: string) => void;
  onBack: () => void;
}

export const MenuArea = ({
  menuAvailable, selectedCategory, categorySize, searchQuery,
  filteredCategories, isWings, 
  getFilteredItems, onCategoryClick, onItemClick, onSizeSelect, onBack,
}: MenuAreaProps) => {
  const SUB_LABEL: Record<string, string> = {
    SM: 'Medium', UM: 'Medium', PCM: 'Medium',
    SL: 'Large',  UL: 'Large',  PCL: 'Large',
    JR: 'Junior',
  };

  return (
    <div className={`flex-1 overflow-y-auto p-5 bg-[#f4f2fb] transition-all duration-500 ${!menuAvailable ? 'pointer-events-none select-none' : ''}`}>

      {/* Locked overlay */}
      {!menuAvailable && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f4f2fb]/80 backdrop-blur-sm">
          <div className="w-16 h-16 bg-[#a020f0]/10 rounded-[0.625rem] flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-[#a020f0]/40">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <p className="text-[#a020f0]/40 font-black uppercase text-xs tracking-widest">Complete cash in to unlock menu</p>
        </div>
      )}

      {selectedCategory ? (
        // ── Category drill-down view ──────────────────────────────────────
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Breadcrumb / back */}
          <div className="flex items-center gap-3 mb-5 sticky top-0 z-10 bg-[#f4f2fb] py-2">
            <button onClick={onBack} className="bg-white p-3 rounded-[0.625rem] shadow-sm border-2 border-[#e9d5ff] text-[#a020f0] hover:border-[#a020f0] hover:bg-[#f5f0ff] transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div>
              <div className="text-[10px] font-bold text-[#a020f0]/60 uppercase tracking-widest leading-none mb-0.5">Category</div>
              <h2 className="text-black font-black text-lg uppercase tracking-wide leading-none">
                {selectedCategory.name}
                {categorySize && <span className="ml-2 text-sm opacity-40 font-bold">• {categorySize}</span>}
              </h2>
            </div>
          </div>

          {categorySize ? (
            // Item grid
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-20">
              {getFilteredItems(
                selectedCategory.menu_items.filter(item =>
                  item.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
              ).map(item => (
                <button 
                  key={item.id} 
                  onClick={() => onItemClick(item)}
                  className={`${BASE_CARD} hover:border-[#a020f0] group flex-col py-3 px-2 justify-center`}
                >
                  <span className="text-sm font-black uppercase text-zinc-900 leading-tight line-clamp-3">{item.name}</span>
                </button>
              ))}
              {getFilteredItems(selectedCategory.menu_items).length === 0 && (
                <div className="col-span-full text-center text-[#a020f0]/60 font-bold text-sm py-12 uppercase tracking-widest">
                  No items found for this size.
                </div>
              )}
            </div>
          ) : (
            // Size / quantity selector
            <div className="flex flex-col items-center justify-center flex-1 gap-5">
              <div className="text-center">
                <div className="text-[10px] font-bold text-[#a020f0]/60 uppercase tracking-widest mb-1">Step</div>
                <h3 className="text-xl font-black text-[#a020f0] uppercase">{isWings ? 'Select Quantity' : 'Select Size'}</h3>
              </div>

              {isWings ? (
                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                  {WINGS_QUANTITIES.map((qty: string) => (
                    <button key={qty} onClick={() => onSizeSelect(qty)}
                      className="h-44 bg-white rounded-[0.625rem] shadow-md border-2 border-[#e9d5ff] hover:border-[#a020f0] hover:shadow-xl hover:scale-105 transition-all flex flex-col items-center justify-center font-black uppercase text-sm text-black">
                      {qty}
                    </button>
                  ))}
                </div>
              ) : selectedCategory.sub_categories && selectedCategory.sub_categories.length > 0 ? (
                <div className="flex gap-5 w-full max-w-md flex-wrap justify-center">
                  {selectedCategory.sub_categories.map(sub => (
                    <button key={sub.id} onClick={() => onSizeSelect(sub.name)}
                      className="flex-1 min-w-35 h-56 bg-white rounded-[0.625rem] shadow-md border-2 border-[#e9d5ff] hover:border-[#a020f0] hover:shadow-xl hover:scale-105 transition-all flex flex-col items-center justify-center font-black text-sm text-black">
                      <DrinkIcon className="w-14 h-14 mb-3 opacity-70" />
                      <span className="text-3xl font-black tracking-widest">{sub.name}</span>
                      <span className="mt-2 bg-[#a020f0]/10 text-[#a020f0] text-sm font-black px-3 py-1 rounded-full tracking-widest">
                        {SUB_LABEL[sub.name] ?? sub.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-5 w-full max-w-md">
                  {[
                    { key: selectedCategory.cup?.size_m || 'M', label: 'Medium', sizeClass: 'w-14 h-14' },
                    ...(selectedCategory.cup?.size_l ? [{ key: selectedCategory.cup.size_l, label: 'Large', sizeClass: 'w-20 h-20' }] : []),
                  ].map(({ key, label, sizeClass }) => (
                    <button key={key} onClick={() => onSizeSelect(key)}
                      className="flex-1 h-56 bg-white rounded-[0.625rem] shadow-md border-2 border-[#e9d5ff] hover:border-[#a020f0] hover:shadow-xl hover:scale-105 transition-all flex flex-col items-center justify-center font-black text-sm text-black">
                      <DrinkIcon className={`${sizeClass} mb-3 opacity-70`} />
                      <span className="text-3xl font-black tracking-widest">{key}</span>
                      <span className="mt-2 bg-[#a020f0]/10 text-black text-sm font-black px-3 py-1 rounded-full tracking-widest">{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      ) : searchQuery.trim() ? (
        // ── Search results: grouped by category, with size labels already enriched ──
        <div className="pb-20 animate-in fade-in zoom-in duration-300 space-y-6">
          {(() => {
            const totalCount = filteredCategories.reduce((sum, cat) => sum + cat.menu_items.length, 0);
            if (totalCount === 0) return (
              <div className="text-center text-[#a020f0]/60 font-bold text-sm py-12 uppercase tracking-widest">
                No items found for "{searchQuery}"
              </div>
            );
            return (
              <>
                <div className="flex items-center gap-3 mb-2 px-1">
                  <span className="bg-[#a020f0] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                    Search Results
                  </span>
                  <div className="flex-1 h-px bg-zinc-300/60" />
                  <span className="text-[11px] text-[#a020f0]/60 font-bold">{totalCount} item{totalCount !== 1 ? 's' : ''}</span>
                </div>

                {filteredCategories.map(cat => {
                  if (cat.menu_items.length === 0) return null;
                  return (
                    <div key={cat.id}>
                      {/* Category header */}
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#a020f0] bg-[#a020f0]/10 px-2.5 py-1 rounded-full">
                          {cat.name}
                        </span>
                        <div className="flex-1 h-px bg-zinc-200" />
                        <span className="text-[10px] text-zinc-400 font-bold">{cat.menu_items.length}</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {cat.menu_items.map(item => (
                          <button
                            key={`${item.id}-${cat.id}`}
                            onClick={() => onItemClick(item)}
                            className={`${BASE_CARD} hover:border-[#a020f0] group flex-col py-3 px-2 justify-center`}
                          >
                            <span className="text-sm font-black uppercase text-zinc-900 leading-tight line-clamp-3">{item.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>

      ) : (
        // ── Category grid ─────────────────────────────────────────────────
        <div className="pb-20 animate-in fade-in zoom-in duration-300 space-y-7">
          {[
            { label: 'Drinks',       types: ['drink'],                        colorKey: 'drink' },
            { label: 'Bundles',      types: ['bundle'],                       colorKey: 'drink' },
            { label: 'Food',         types: ['food', 'wings', 'waffle', 'combo'], colorKey: 'food' },
            { label: 'Mix & Match',  types: ['mix_and_match'],                colorKey: 'promo' },
            { label: 'Promo',        types: ['promo'],                        colorKey: 'promo' },
          ].map(({ label, types, colorKey }) => {
            const groupCats = filteredCategories.filter(cat => types.includes(cat.type));
            if (groupCats.length === 0) return null;
            const { pill, card } = TYPE_BADGE[colorKey as keyof typeof TYPE_BADGE];
            return (
              <div key={colorKey}>
                <div className="flex items-center gap-3 mb-3 px-1">
                  <span className={`${pill} text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm`}>{label}</span>
                  <div className="flex-1 h-px bg-zinc-300/60" />
                  <span className="text-[11px] text-[#a020f0]/60 font-bold">{groupCats.length} categories</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {groupCats.map(cat => (
                    <button key={cat.id} onClick={() => onCategoryClick(cat)} className={`${BASE_CARD} ${card}`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Other categories */}
          {(() => {
            const known  = ['food', 'wings', 'waffle', 'combo', 'drink', 'bundle', 'mix_and_match', 'promo'];
            const others = filteredCategories.filter(cat => !known.includes(cat.type));
            if (others.length === 0) return null;
            return (
              <div>
                <div className="flex items-center gap-3 mb-3 px-1">
                  <span className="bg-zinc-400 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">Other</span>
                  <div className="flex-1 h-px bg-zinc-300/60" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {others.map(cat => (
                    <button key={cat.id} onClick={() => onCategoryClick(cat)}
                      className={`${BASE_CARD} hover:bg-[#a020f0] hover:border-[#a020f0] hover:text-white`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CartSidebar
// ─────────────────────────────────────────────────────────────────────────────

interface CartSidebarProps {
  cart: CartItem[];
  cashierName: string;
  orNumber: string;
  terminalNumber: string;
  totalCount: number;
  subtotal: number;
  onEditItem: (index: number) => void;
  onConfirmOrder: () => void;
}


export const CartSidebar = ({
  cart, cashierName, orNumber, totalCount, subtotal, terminalNumber, onEditItem, onConfirmOrder,
}: CartSidebarProps) => (
  <div className="w-96 bg-white border-l-2 border-[#e9d5ff] flex flex-col shrink-0 shadow-2xl z-30">

{/* Cart header */}
<div className="bg-[#a020f0] p-4 text-white flex items-center justify-between shrink-0">
  <div>
    <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none">Cashier</div>
    <div className="text-[11px] font-black uppercase leading-tight mt-0.5">{cashierName ?? 'Admin'}</div>
  </div>
  <div className="text-center">
    <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none">Current Order</div>
    <div className="text-[11px] font-black uppercase leading-tight mt-0.5">{orNumber}</div>
  </div>
  <div className="text-center">
    <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none">Terminal</div>
    <div className="text-[11px] font-black uppercase leading-tight mt-0.5">{terminalNumber}</div>
  </div>
  <div className="text-right">
    <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none">Items</div>
    <div className="text-[15px] font-black leading-tight mt-0.5">{totalCount}</div>
  </div>
</div>

    {/* Cart items */}
    <div className="flex-1 overflow-y-auto p-4 bg-white">
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center gap-3">
          <DrinkIcon className="w-12 h-12 text-zinc-200" />
          <p className="text-zinc-300 font-black uppercase text-[10px] tracking-widest">No Items Yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cart.map((item, index) => (
            <div
              key={index}
              onClick={() => onEditItem(index)}
              className="flex justify-between items-start gap-2 bg-[#f5f0ff] p-3 rounded-[0.625rem] border-2 border-[#e9d5ff] hover:border-[#a020f0]/30 hover:bg-white transition-colors group cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <p className="font-black text-xs text-black leading-tight">
                  <span className="text-zinc-400 mr-1">×{item.qty}</span>
                  {item.name}
                  {item.cupSizeLabel && <span className="ml-1 opacity-50 font-bold">({item.cupSizeLabel})</span>}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {item.sugarLevel != null && <span className="bg-[#a020f0]/10 text-black text-[9px] px-1.5 py-0.5 rounded-lg font-bold">🍬 {item.sugarLevel}</span>}
                  {item.options?.map(opt    => <span key={opt}   className="bg-blue-100  text-blue-700  text-[9px] px-1.5 py-0.5 rounded-lg font-bold">{opt}</span>)}
                  {item.addOns?.map(addon   => <span key={addon} className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-lg font-bold">+{addon}</span>)}
                  {item.charges?.grab  && <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded-lg font-bold">🛵 Grab</span>}
                  {item.charges?.panda && <span className="bg-pink-100  text-pink-700  text-[9px] px-1.5 py-0.5 rounded-lg font-bold">🐼 Panda</span>}
                  {item.remarks && <span className="bg-zinc-200 text-zinc-600 text-[9px] px-1.5 py-0.5 rounded-lg font-bold italic">📝 {item.remarks}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="text-[#a020f0]/20 group-hover:text-[#a020f0]/60 transition-colors mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Cart footer */}
    <div className="bg-[#a020f0] text-white p-5 shrink-0">
      <div className="flex justify-between items-end mb-4 pb-4 border-b border-white/10">
        <div>
          <div className="text-[9px] font-bold uppercase opacity-60 tracking-widest leading-none">Subtotal</div>
          <div className="text-[10px] font-bold opacity-40 uppercase mt-0.5">{totalCount} item{totalCount !== 1 ? 's' : ''}</div>
        </div>
        <span className="text-3xl font-black">₱ {subtotal.toFixed(2)}</span>
      </div>
      <button
        onClick={onConfirmOrder}
        disabled={cart.length === 0}
        className="w-full py-4 bg-white text-[#a020f0] font-black uppercase tracking-widest text-sm rounded-[0.625rem] shadow-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f5f0ff] transition-colors"
      >
        {cart.length === 0 ? 'Add Items to Order' : 'Confirm Order →'}
      </button>
    </div>
  </div>
);
