import { useState } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';

// ── Types ────────────────────────────────────────────────────────────────────

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  status: 'Active' | 'Inactive';
  totalOrders: number;
  lastOrderDate: string;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'Arabica Direct PH',
    contactPerson: 'Carlos Mendoza',
    email: 'carlos@arabicadirect.ph',
    phone: '+63 917 123 4567',
    address: '12 Brew St., Benguet, CAR',
    category: 'Beverages',
    status: 'Active',
    totalOrders: 48,
    lastOrderDate: '2024-06-01',
  },
  {
    id: 'SUP-002',
    name: 'PackRight Solutions',
    contactPerson: 'Maria Santos',
    email: 'maria@packright.com',
    phone: '+63 918 234 5678',
    address: '88 Packaging Ave., Caloocan, NCR',
    category: 'Packaging',
    status: 'Active',
    totalOrders: 32,
    lastOrderDate: '2024-05-28',
  },
  {
    id: 'SUP-003',
    name: 'SweetDrip Syrups Inc.',
    contactPerson: 'Leo Tan',
    email: 'leo@sweetdrip.com',
    phone: '+63 919 345 6789',
    address: '5 Flavor Lane, Quezon City, NCR',
    category: 'Syrups',
    status: 'Active',
    totalOrders: 21,
    lastOrderDate: '2024-06-03',
  },
  {
    id: 'SUP-004',
    name: 'OatFarm PH',
    contactPerson: 'Nina Reyes',
    email: 'nina@oatfarm.ph',
    phone: '+63 920 456 7890',
    address: '22 Dairy Rd., Nueva Ecija',
    category: 'Dairy Alt.',
    status: 'Inactive',
    totalOrders: 9,
    lastOrderDate: '2024-03-15',
  },
  {
    id: 'SUP-005',
    name: 'CleanCup Equipment',
    contactPerson: 'Rodel Cruz',
    email: 'rodel@cleancup.ph',
    phone: '+63 921 567 8901',
    address: '7 Industrial Blvd., Laguna',
    category: 'Equipment',
    status: 'Active',
    totalOrders: 6,
    lastOrderDate: '2024-05-10',
  },
  {
    id: 'SUP-006',
    name: 'FreshPulp Distributing',
    contactPerson: 'Anna Lim',
    email: 'anna@freshpulp.com',
    phone: '+63 922 678 9012',
    address: '33 Market St., Cebu City',
    category: 'Beverages',
    status: 'Inactive',
    totalOrders: 14,
    lastOrderDate: '2024-02-20',
  },
];

const CATEGORIES = ['All', 'Beverages', 'Packaging', 'Syrups', 'Dairy Alt.', 'Equipment'];

const EMPTY_FORM = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  category: 'Beverages',
  status: 'Active' as Supplier['status'],
};

// ── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: Supplier['status'] }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
    status === 'Active'
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-gray-100 text-gray-500 border-gray-200'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
    {status}
  </span>
);

// ── Modal ────────────────────────────────────────────────────────────────────

const SupplierModal = ({
  supplier,
  onClose,
  onSave,
}: {
  supplier: Partial<Supplier> | null;
  onClose: () => void;
  onSave: (data: typeof EMPTY_FORM) => void;
}) => {
  const [form, setForm] = useState(
    supplier
      ? {
          name: supplier.name ?? '',
          contactPerson: supplier.contactPerson ?? '',
          email: supplier.email ?? '',
          phone: supplier.phone ?? '',
          address: supplier.address ?? '',
          category: supplier.category ?? 'Beverages',
          status: (supplier.status ?? 'Active') as Supplier['status'],
        }
      : { ...EMPTY_FORM }
  );

  const isEdit = !!supplier?.id;

  const Field = ({
    label,
    field,
    type = 'text',
    placeholder,
  }: {
    label: string;
    field: keyof typeof form;
    type?: string;
    placeholder?: string;
  }) => (
    <div>
      <label className="block text-[11px] font-bold text-[#3b2063]/60 uppercase tracking-wider mb-1">
        {label}
      </label>
      <input
        type={type}
        value={form[field] as string}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-[#f9f8fc] border border-[#e5e0ef] rounded-lg px-3 py-2 text-sm text-[#3b2063] placeholder:text-[#3b2063]/30 focus:outline-none focus:ring-2 focus:ring-[#3b2063]/20"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl border border-[#e5e0ef] shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0ecf8]">
          <div>
            <p className="text-[10px] font-bold text-[#3b2063]/40 uppercase tracking-widest">Suppliers</p>
            <h2 className="text-base font-black text-[#3b2063] uppercase tracking-widest leading-none">
              {isEdit ? 'Edit Supplier' : 'Add Supplier'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f0ecf8] text-[#3b2063] font-black text-sm flex items-center justify-center hover:bg-[#e5e0ef] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <Field label="Supplier Name" field="name" placeholder="e.g. Arabica Direct PH" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact Person" field="contactPerson" placeholder="Full name" />
            <Field label="Phone" field="phone" type="tel" placeholder="+63 9XX XXX XXXX" />
          </div>
          <Field label="Email" field="email" type="email" placeholder="supplier@example.com" />
          <Field label="Address" field="address" placeholder="Street, City, Province" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#3b2063]/60 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-[#f9f8fc] border border-[#e5e0ef] rounded-lg px-3 py-2 text-sm font-semibold text-[#3b2063] focus:outline-none focus:ring-2 focus:ring-[#3b2063]/20"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#3b2063]/60 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as Supplier['status'] }))}
                className="w-full bg-[#f9f8fc] border border-[#e5e0ef] rounded-lg px-3 py-2 text-sm font-semibold text-[#3b2063] focus:outline-none focus:ring-2 focus:ring-[#3b2063]/20"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#f0ecf8] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold text-[#3b2063]/60 hover:text-[#3b2063] uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name.trim()}
            className="px-5 py-2 rounded-lg bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2e1a4e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEdit ? 'Save Changes' : 'Add Supplier'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Detail Drawer ─────────────────────────────────────────────────────────────

const SupplierDrawer = ({
  supplier,
  onClose,
  onEdit,
}: {
  supplier: Supplier;
  onClose: () => void;
  onEdit: () => void;
}) => (
  <div className="fixed inset-0 z-40 flex justify-end bg-black/20 backdrop-blur-sm" onClick={onClose}>
    <div
      className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col border-l border-[#e5e0ef]"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#f0ecf8] bg-[#3b2063]">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Supplier Profile</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 text-white font-black text-xs flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>
        <h2 className="text-lg font-black text-white leading-tight">{supplier.name}</h2>
        <p className="text-xs text-white/60 font-semibold mt-0.5">{supplier.id}</p>
        <div className="mt-3">
          <StatusBadge status={supplier.status} />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#f9f8fc] rounded-xl p-3 border border-[#e5e0ef]">
            <p className="text-[10px] font-bold text-[#3b2063]/50 uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-black text-[#3b2063]">{supplier.totalOrders}</p>
          </div>
          <div className="bg-[#f9f8fc] rounded-xl p-3 border border-[#e5e0ef]">
            <p className="text-[10px] font-bold text-[#3b2063]/50 uppercase tracking-wider">Last Order</p>
            <p className="text-sm font-black text-[#3b2063] leading-tight mt-1">{supplier.lastOrderDate}</p>
          </div>
        </div>

        {/* Details */}
        {[
          { label: 'Contact Person', value: supplier.contactPerson },
          { label: 'Email', value: supplier.email },
          { label: 'Phone', value: supplier.phone },
          { label: 'Category', value: supplier.category },
          { label: 'Address', value: supplier.address },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[10px] font-bold text-[#3b2063]/40 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-[#3b2063]">{value}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#f0ecf8]">
        <button
          onClick={onEdit}
          className="w-full bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl hover:bg-[#2e1a4e] transition-colors"
        >
          Edit Supplier
        </button>
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const BM_InventorySuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [drawerSupplier, setDrawerSupplier] = useState<Supplier | null>(null);

  const filtered = suppliers.filter(s => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || s.category === categoryFilter;
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const handleSave = (form: typeof EMPTY_FORM) => {
    if (editingSupplier) {
      setSuppliers(prev =>
        prev.map(s => s.id === editingSupplier.id ? { ...editingSupplier, ...form } : s)
      );
    } else {
      const newSupplier: Supplier = {
        ...form,
        id: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
        totalOrders: 0,
        lastOrderDate: '—',
      };
      setSuppliers(prev => [newSupplier, ...prev]);
    }
    setModalOpen(false);
    setEditingSupplier(null);
  };

  const openAdd = () => { setEditingSupplier(null); setModalOpen(true); };
  const openEdit = (s: Supplier) => { setEditingSupplier(s); setDrawerSupplier(null); setModalOpen(true); };

  const activeCount = suppliers.filter(s => s.status === 'Active').length;
  const inactiveCount = suppliers.filter(s => s.status === 'Inactive').length;

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">

          {/* ── Page Header ── */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold text-[#3b2063]/50 uppercase tracking-widest mb-0.5">Inventory</p>
              <h1 className="text-2xl font-black text-[#3b2063] uppercase tracking-widest leading-none">
                Suppliers
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Stat pills */}
              <div className="bg-white rounded-xl px-4 py-2 border border-[#e5e0ef] shadow-sm text-center">
                <p className="text-[10px] font-bold text-[#3b2063]/50 uppercase tracking-wider">Total</p>
                <p className="text-lg font-black text-[#3b2063]">{suppliers.length}</p>
              </div>
              <div className="bg-white rounded-xl px-4 py-2 border border-[#e5e0ef] shadow-sm text-center">
                <p className="text-[10px] font-bold text-[#3b2063]/50 uppercase tracking-wider">Active</p>
                <p className="text-lg font-black text-green-600">{activeCount}</p>
              </div>
              <div className="bg-white rounded-xl px-4 py-2 border border-[#e5e0ef] shadow-sm text-center">
                <p className="text-[10px] font-bold text-[#3b2063]/50 uppercase tracking-wider">Inactive</p>
                <p className="text-lg font-black text-gray-400">{inactiveCount}</p>
              </div>

              <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-[#3b2063] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#2e1a4e] transition-colors shadow-sm"
              >
                <span className="text-base leading-none">＋</span> Add Supplier
              </button>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="bg-white rounded-2xl border border-[#e5e0ef] shadow-sm px-5 py-4 mb-5 flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search by name, contact, or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-[#f9f8fc] border border-[#e5e0ef] rounded-lg px-3 py-2 text-xs text-[#3b2063] placeholder:text-[#3b2063]/30 focus:outline-none focus:ring-2 focus:ring-[#3b2063]/20 w-64"
            />

            {/* Category tabs */}
            <div className="flex gap-1 bg-[#f4f5f7] rounded-lg p-1">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                    categoryFilter === c
                      ? 'bg-white text-[#3b2063] shadow-sm'
                      : 'text-[#3b2063]/50 hover:text-[#3b2063]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Status toggle */}
            <div className="flex gap-1 bg-[#f4f5f7] rounded-lg p-1 ml-auto">
              {(['All', 'Active', 'Inactive'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                    statusFilter === s
                      ? 'bg-white text-[#3b2063] shadow-sm'
                      : 'text-[#3b2063]/50 hover:text-[#3b2063]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-white rounded-2xl border border-[#e5e0ef] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf9fd]">
                    {['Supplier ID', 'Name', 'Contact Person', 'Email', 'Phone', 'Category', 'Orders', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-[#3b2063]/50 uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center text-xs text-[#3b2063]/40 font-semibold">
                        No suppliers found.
                      </td>
                    </tr>
                  ) : filtered.map(supplier => (
                    <tr
                      key={supplier.id}
                      className="border-t border-[#f0ecf8] hover:bg-[#fdfcff] transition-colors cursor-pointer"
                      onClick={() => setDrawerSupplier(supplier)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-[#3b2063]/60">{supplier.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#3b2063] text-sm">{supplier.name}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#3b2063]/70 font-semibold whitespace-nowrap">
                        {supplier.contactPerson}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#3b2063]/60">{supplier.email}</td>
                      <td className="px-4 py-3 text-xs text-[#3b2063]/60 whitespace-nowrap">{supplier.phone}</td>
                      <td className="px-4 py-3">
                        <span className="bg-[#f0ecf8] text-[#3b2063] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {supplier.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-black text-sm text-[#3b2063]">{supplier.totalOrders}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={supplier.status} />
                      </td>
                      <td className="px-4 py-3" onClick={e => { e.stopPropagation(); openEdit(supplier); }}>
                        <button className="text-[10px] font-black text-[#3b2063]/40 hover:text-[#3b2063] uppercase tracking-wider transition-colors">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[#f0ecf8] flex items-center justify-between">
              <p className="text-[11px] text-[#3b2063]/40 font-semibold">
                Showing {filtered.length} of {suppliers.length} suppliers
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Modals / Drawers ── */}
      {modalOpen && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => { setModalOpen(false); setEditingSupplier(null); }}
          onSave={handleSave}
        />
      )}

      {drawerSupplier && !modalOpen && (
        <SupplierDrawer
          supplier={drawerSupplier}
          onClose={() => setDrawerSupplier(null)}
          onEdit={() => openEdit(drawerSupplier)}
        />
      )}
    </div>
  );
};

export default BM_InventorySuppliers;