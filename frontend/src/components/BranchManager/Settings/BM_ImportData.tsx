import { useState } from 'react';
import { ArrowLeft, FileDown, Database, Upload, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// ─── Design tokens (matching BranchManagerDashboard) ─────────────────────────
// bg:       #f5f4f8   card: white + border-gray-100 + rounded-2xl
// primary:  #6a12b8   primary-dark: #2a1647
// text:     #1a0f2e   muted: #71717a   label: #a1a1aa
// accent:   #ede9fe   accent-border: #ddd6f7
// font:     DM Sans

// ─── Shared primitives ────────────────────────────────────────────────────────

const PageWrap = ({ children }: { children: React.ReactNode }) => (
  <div className="flex-1 bg-[#f5f4f8] h-full flex flex-col overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {children}
      </div>
    </div>
  </div>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm p-8 ${className}`}>
    {children}
  </div>
);

const PageHeader = ({ onBack, title, subtitle }: { onBack: () => void; title: string; subtitle: string }) => (
  <div className="flex items-center gap-4">
    <button
      onClick={onBack}
      className="h-10 px-4 bg-white border border-gray-100 hover:border-[#ddd6f7] hover:bg-[#ede9fe]/30 text-zinc-500 font-bold text-[10px] uppercase tracking-widest transition-all rounded-xl shadow-sm flex items-center justify-center gap-2"
    >
      <ArrowLeft size={15} strokeWidth={2.5} />
    </button>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-[#6a12b8] rounded-xl flex items-center justify-center shadow-sm shrink-0">
        <FileDown size={17} className="text-white" strokeWidth={2.5} />
      </div>
      <div>
        <h1 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0 }}>{title}</h1>
        <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#a1a1aa', marginTop: 2 }}>{subtitle}</p>
      </div>
    </div>
  </div>
);

const DropZone = ({ label = 'Click to Add File' }: { label?: string }) => (
  <div className="border-2 border-dashed border-gray-200 bg-[#f5f4f8] rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3 hover:border-[#6a12b8] hover:bg-[#ede9fe]/20 transition-all cursor-pointer group">
    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
      <Upload size={22} className="text-zinc-400 group-hover:text-[#6a12b8]" />
    </div>
    <div>
      <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1a0f2e', textTransform: 'uppercase', letterSpacing: '0.14em' }}>{label}</p>
      <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4 }}>Supported: .CSV · .XLSX</p>
    </div>
  </div>
);

const TipHeader = ({ label = 'Important Tips: Sample Format CSV' }: { label?: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <AlertCircle size={13} className="text-[#6a12b8] shrink-0" />
    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#6a12b8', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{label}</span>
  </div>
);

const InfoBox = ({ items }: { items: string[] }) => (
  <div className="bg-[#ede9fe]/40 border border-[#ddd6f7] rounded-xl p-4 flex gap-3">
    <Info size={15} className="text-[#6a12b8] shrink-0 mt-0.5" />
    <div style={{ fontSize: '0.7rem', color: '#6a12b8', fontWeight: 500 }} className="space-y-1">
      {items.map((t, i) => <p key={i}>{t}</p>)}
    </div>
  </div>
);

const WarnBox = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
    <AlertTriangle size={13} className="text-red-500 shrink-0" />
    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{text}</p>
  </div>
);

const SampleTable = ({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) => (
  <div className="border border-gray-100 rounded-xl overflow-x-auto">
    <table className="w-full text-left whitespace-nowrap">
      {headers.length > 0 && (
        <thead>
          <tr className="bg-[#f5f4f8] border-b border-gray-100">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5" style={{ fontSize: '0.6rem', fontWeight: 800, color: '#6a12b8', textTransform: 'uppercase', letterSpacing: '0.16em', textAlign: 'center' }}>{h}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody className="divide-y divide-gray-50 bg-white">
        {rows.map((row, i) => (
          <tr key={i} className="hover:bg-[#f5f4f8]/60 transition-colors">
            {row.map((cell, j) => (
              <td key={j} className="px-4 py-2" style={{ fontSize: '0.72rem', fontWeight: 600, color: '#71717a', textAlign: 'center', textTransform: 'uppercase' }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ActionRow = ({ onBack, importLabel = 'Import' }: { onBack: () => void; importLabel?: string }) => (
  <div className="flex gap-3">
    <button className="h-11 px-6 bg-[#6a12b8] hover:bg-[#2a1647] text-white font-bold text-[10px] uppercase tracking-[0.18em] transition-all rounded-xl shadow-sm flex items-center gap-2 active:scale-[0.98]">
      <FileDown size={14} strokeWidth={2.5} /> {importLabel}
    </button>
    <button onClick={onBack} className="h-11 px-6 bg-white border border-gray-100 hover:border-[#ddd6f7] hover:bg-[#ede9fe]/20 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.18em] transition-all rounded-xl shadow-sm active:scale-[0.98]">
      Back
    </button>
  </div>
);

// ─── Sub-views ────────────────────────────────────────────────────────────────

const ViewCategory = ({ onBack }: { onBack: () => void }) => (
  <PageWrap>
    <PageHeader onBack={onBack} title="Import Category" subtitle="Upload CSV Data" />
    <Card><DropZone /></Card>
    <Card>
      <TipHeader />
      <SampleTable headers={[]} rows={[['Sample Format CSV'],['NAME'],['SNACKS'],['DRINK'],['CAN GOODS']]} />
    </Card>
    <ActionRow onBack={onBack} />
  </PageWrap>
);

const ViewSubCategory = ({ onBack }: { onBack: () => void }) => (
  <PageWrap>
    <PageHeader onBack={onBack} title="Import Sub Category" subtitle="Upload CSV Data" />
    <Card><DropZone /></Card>
    <Card>
      <TipHeader />
      <SampleTable headers={[]} rows={[['Sample Format CSV'],['NAME'],['SNACKS'],['DRINK'],['CAN GOODS']]} />
    </Card>
    <ActionRow onBack={onBack} />
  </PageWrap>
);

const ViewInventory = ({ onBack }: { onBack: () => void }) => (
  <PageWrap>
    <PageHeader onBack={onBack} title="Import Inventory Items" subtitle="Bulk Inventory Management" />
    <Card className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[['Items with VAT', ['VATABLE','NOT-VATABLE']], ['Items Active', ['ACTIVE','NOT-ACTIVE']], ['Nonstock', ['YES','NO']]].map(([lbl, opts], i) => (
          <div key={i} className="space-y-1.5">
            <label style={{ fontSize: '0.62rem', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.16em' }}>{lbl as string}</label>
            <select className="w-full px-4 py-3 bg-[#f5f4f8] border border-gray-100 rounded-xl text-xs font-bold text-[#1a0f2e] outline-none focus:border-[#6a12b8] cursor-pointer transition-colors">
              {(opts as string[]).map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
      <DropZone label="Click to Upload Inventory File" />
      <InfoBox items={['1. Create CATEGORY first (if category is not yet exist)','2. IMPORT INVENTORY will create new ITEM if not EXIST','3. IMPORT INVENTORY will update existing ITEMS and QTY','4. NO SINGLE and DOUBLE QUOTES in the item name']} />
      <div>
        <TipHeader />
        <SampleTable headers={['BARCODE','NAME','CATEGORY','UOM','COST','SRP','STORE QTY','WAREHOUSE QTY']} rows={[['1234567','PRODUCT ITEM','BOOKS','PC','30','100','50','70']]} />
      </div>
    </Card>
    <ActionRow onBack={onBack} />
  </PageWrap>
);

const ViewFoodItems = ({ onBack }: { onBack: () => void }) => (
  <PageWrap>
    <PageHeader onBack={onBack} title="Import Food Items" subtitle="Bulk Food & Menu Management" />
    <Card className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[['Items with VAT', ['VATABLE','NOT-VATABLE']], ['Items Active', ['ACTIVE','NOT-ACTIVE']]].map(([lbl, opts], i) => (
          <div key={i} className="space-y-1.5">
            <label style={{ fontSize: '0.62rem', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.16em' }}>{lbl as string}</label>
            <select className="w-full px-4 py-3 bg-[#f5f4f8] border border-gray-100 rounded-xl text-xs font-bold text-[#1a0f2e] outline-none focus:border-[#6a12b8] cursor-pointer transition-colors">
              {(opts as string[]).map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
      <DropZone label="Click to Upload Food Items File" />
      <InfoBox items={['1. Create CATEGORY first (if category is not yet exist)','2. IMPORT FOOD ITEMS will create new ITEM if not EXIST','3. IMPORT FOOD ITEMS will update existing ITEMS and QTY','4. NO SINGLE and DOUBLE QUOTES in the item name']} />
      <div>
        <TipHeader />
        <SampleTable
          headers={['BARCODE','NAME','CATEGORY','SUB CATEGORY','UOM','COST','SRP','GRAB','FOODPANDA','CLASS']}
          rows={[
            ['1234567','PRODUCT ITEM','BREAKFAST','SOLO','PC','30','100','20','25','KITCHEN'],
            ['555423','PRODUCT ITEM','DRINKS','CAN','PC','200','30','35','-','BAR'],
          ]}
        />
      </div>
    </Card>
    <ActionRow onBack={onBack} />
  </PageWrap>
);

const ViewQuantity = ({ onBack }: { onBack: () => void }) => (
  <PageWrap>
    <PageHeader onBack={onBack} title="Import Quantity" subtitle="Update Stock Levels" />
    <Card className="flex flex-col gap-6">
      <DropZone />
      <WarnBox text="Make sure that the ITEMS BARCODE has no DUPLICATE" />
      <div>
        <TipHeader />
        <SampleTable headers={['BARCODE','QTY']} rows={[['1234567','50'],['2333435','10'],['8887688','25']]} />
      </div>
    </Card>
    <ActionRow onBack={onBack} />
  </PageWrap>
);

const ViewItemKits = ({ onBack }: { onBack: () => void }) => (
  <PageWrap>
    <PageHeader onBack={onBack} title="Import Item Kits" subtitle="Bundle & Kit Configuration" />
    <Card className="flex flex-col gap-6">
      <DropZone />
      <div>
        <TipHeader />
        <SampleTable headers={['BARCODE','QTY','BARCODE MAIN']} rows={[['1234567','5','98012345'],['5435543','12','98012346']]} />
      </div>
    </Card>
    <ActionRow onBack={onBack} />
  </PageWrap>
);

const ViewUpdate = ({ onBack }: { onBack: () => void }) => (
  <PageWrap>
    <PageHeader onBack={onBack} title="Import Update" subtitle="Stock Adjustment & Corrections" />
    <Card className="flex flex-col gap-6">
      <DropZone />
      <InfoBox items={['1. Make sure that the ITEMS BARCODE has NO DUPLICATE','2. Import QTY for minus must used negative sign example -2','3. Import QTY for current negative will auto minus and add QTY','Example: Current QOH -2 imported update is 5 the QOH will be 3']} />
      <div>
        <TipHeader />
        <SampleTable headers={['BARCODE','QTY']} rows={[['1234567','50'],['2333435','10'],['8887688','25']]} />
      </div>
    </Card>
    <ActionRow onBack={onBack} />
  </PageWrap>
);

const ViewUpdatePrice = ({ onBack }: { onBack: () => void }) => (
  <PageWrap>
    <PageHeader onBack={onBack} title="Import Update Price" subtitle="Pricing Adjustments" />
    <Card className="flex flex-col gap-6">
      <DropZone />
      <InfoBox items={['REQUIREMENTS FOR IMPORTING:','1. IMPORT INVENTORY ITEMS will update EXISTING UNIT','2. Make sure the Barcode or items exist.']} />
      <div>
        <TipHeader label="Import Tips: Sample Format CSV" />
        <SampleTable headers={['BARCODE','COST','SELLING PRICE']} rows={[['1234567','50','75'],['938238','40','80']]} />
      </div>
    </Card>
    <ActionRow onBack={onBack} />
  </PageWrap>
);

const ViewCustomers = ({ onBack }: { onBack: () => void }) => (
  <PageWrap>
    <PageHeader onBack={onBack} title="Import Customers" subtitle="Customer Database Management" />
    <Card className="flex flex-col gap-6">
      <DropZone />
      <InfoBox items={['REQUIREMENTS FOR IMPORTING:','TYPE OPTIONS','RECORD, WALLET, POINTS, MEMBER, NON-MEMBER']} />
      <div>
        <TipHeader label="Import Tips: Sample Format CSV" />
        <SampleTable
          headers={['CODE','NAME','ADDRESS','CONTACT','TYPE']}
          rows={[['KDE0123','KINTOZ POS','MANDL','1234567','RECORD'],['GDE0145','JUAN','CAINTA','4324556','WALLET']]}
        />
      </div>
    </Card>
    <ActionRow onBack={onBack} />
  </PageWrap>
);

const ViewCustomersWallet = ({ onBack }: { onBack: () => void }) => (
  <PageWrap>
    <PageHeader onBack={onBack} title="Import Customers Wallet" subtitle="Loyalty Points & Balance" />
    <Card className="flex flex-col gap-6">
      <DropZone />
      <div>
        <TipHeader label="Important Tips: Sample Format CSV" />
        <SampleTable headers={['CODE','POINTS']} rows={[['KDE0123','1000'],['JDE0456','1500']]} />
      </div>
    </Card>
    <ActionRow onBack={onBack} />
  </PageWrap>
);

// ─── Main menu grid ───────────────────────────────────────────────────────────

type ViewKey = 'CATEGORY'|'SUB_CATEGORY'|'INVENTORY'|'FOOD_ITEMS'|'QUANTITY'|'ITEM_KITS'|'UPDATE'|'UPDATE_PRICE'|'CUSTOMERS'|'CUSTOMERS_WALLET';

const MENU_ITEMS: { label: string; view: ViewKey; sub: string }[] = [
  { label:'Import Category',        view:'CATEGORY',          sub:'Add new categories' },
  { label:'Import Sub Category',    view:'SUB_CATEGORY',      sub:'Add sub-categories' },
  { label:'Import Inventory Items', view:'INVENTORY',         sub:'Bulk inventory upload' },
  { label:'Import Food Items',      view:'FOOD_ITEMS',        sub:'Bulk food menu upload' },
  { label:'Import Quantity',        view:'QUANTITY',          sub:'Update stock levels' },
  { label:'Import Item Kits',       view:'ITEM_KITS',         sub:'Bundle configuration' },
  { label:'Import Update',          view:'UPDATE',            sub:'Stock adjustments' },
  { label:'Import Update Price',    view:'UPDATE_PRICE',      sub:'Pricing adjustments' },
  { label:'Import Customers',       view:'CUSTOMERS',         sub:'Customer database' },
  { label:'Customers Wallet',       view:'CUSTOMERS_WALLET',  sub:'Loyalty & balance' },
];

const ImportData = ({ onBack }: { onBack: () => void }) => {
  const [activeView, setActiveView] = useState<ViewKey | null>(null);
  const back = () => setActiveView(null);

  if (activeView === 'CATEGORY')         return <ViewCategory         onBack={back} />;
  if (activeView === 'SUB_CATEGORY')     return <ViewSubCategory      onBack={back} />;
  if (activeView === 'INVENTORY')        return <ViewInventory        onBack={back} />;
  if (activeView === 'FOOD_ITEMS')       return <ViewFoodItems        onBack={back} />;
  if (activeView === 'QUANTITY')         return <ViewQuantity         onBack={back} />;
  if (activeView === 'ITEM_KITS')        return <ViewItemKits         onBack={back} />;
  if (activeView === 'UPDATE')           return <ViewUpdate           onBack={back} />;
  if (activeView === 'UPDATE_PRICE')     return <ViewUpdatePrice      onBack={back} />;
  if (activeView === 'CUSTOMERS')        return <ViewCustomers        onBack={back} />;
  if (activeView === 'CUSTOMERS_WALLET') return <ViewCustomersWallet  onBack={back} />;

  return (
    <div className="flex-1 bg-[#f5f4f8] h-full flex flex-col overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="h-10 px-4 bg-white border border-gray-100 hover:border-[#ddd6f7] hover:bg-[#ede9fe]/30 text-zinc-500 font-bold text-[10px] uppercase tracking-widest transition-all rounded-xl shadow-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft size={15} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6a12b8] rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <FileDown size={17} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0 }}>Import Data</h1>
                <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#a1a1aa', marginTop: 2 }}>External Data Synchronization</p>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {MENU_ITEMS.map((item, i) => (
              <button
                key={i}
                onClick={() => setActiveView(item.view)}
                className="bg-white border border-gray-100 hover:border-[#ddd6f7] hover:shadow-md text-left p-5 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#f5f4f8] group-hover:bg-[#ede9fe]/60 rounded-xl flex items-center justify-center transition-colors shrink-0">
                    <Upload size={15} className="text-[#6a12b8]" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1a0f2e', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.3 }}>{item.label}</p>
                    <p style={{ fontSize: '0.6rem', fontWeight: 500, color: '#a1a1aa', marginTop: 2 }}>{item.sub}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer note */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 bg-[#f5f4f8] rounded-xl flex items-center justify-center shrink-0">
              <Database size={14} className="text-[#6a12b8]" strokeWidth={2.5} />
            </div>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Ensure files are in .CSV or .XLSX format before importing.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ImportData;
