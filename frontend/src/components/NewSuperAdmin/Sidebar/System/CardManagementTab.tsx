import { 
  Plus, Edit2, Trash2, CheckCircle, XCircle, Search, 
  CreditCard, Image as ImageIcon, Upload,
  AlertCircle, DollarSign, Activity
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CardItem {
  id: number;
  title: string;
  image_url: string;
  price: number;
  is_active: boolean;
  sort_order: number;
  available_months: string | null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── Shared UI Components ──────────────────────────────────────────────────────
const Badge: React.FC<{ status: boolean }> = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
    ${status ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}>
    {status ? "Active" : "Inactive"}
  </span>
);

const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color?: "violet" | "emerald" | "amber" | "blue";
}> = ({ icon, label, value, sub, color = "violet" }) => {
  const colors = {
    violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600" },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-4 shadow-sm">
      <div className={`w-11 h-11 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.5rem] shrink-0`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate">{label}</p>
        <p className="text-xl font-bold text-[#1a0f2e] tabular-nums truncate">{value}</p>
        {sub && <p className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const Btn: React.FC<{
  children: React.ReactNode; variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md"; onClick?: () => void; className?: string; disabled?: boolean;
  type?: "button" | "submit";
}> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false, type = "button" }) => {
  const sizes = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm" };
  const variants = {
    primary: "bg-[#6a12b8] hover:bg-[#2a1647] text-white shadow-sm",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white",
    ghost: "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const ModalShell: React.FC<{
  onClose: () => void; icon: React.ReactNode; title: string; sub: string;
  children: React.ReactNode; footer: React.ReactNode; maxWidth?: string;
}> = ({ onClose, icon, title, sub, children, footer, maxWidth = "max-w-md" }) =>
  createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative bg-white w-full ${maxWidth} border border-zinc-200 rounded-[1.25rem] shadow-2xl overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{title}</p>
              <p className="text-[10px] text-zinc-400 font-medium">{sub}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400">
            <XCircle size={18} />
          </button>
        </div>
        <div className="px-6 py-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto sa-scroll">{children}</div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">{footer}</div>
      </div>
    </div>,
    document.body
  );

const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div>
    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? "border-red-300 bg-red-50" : "border-zinc-200"}`;


const CardManagementTab = () => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardItem | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cards", {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setCards(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch cards", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleOpenModal = (card?: CardItem) => {
    setError(null);
    if (card) {
      setEditingCard(card);
      setTitle(card.title || "");
      setPrice(card.price ? card.price.toString() : "0");
      setIsActive(card.is_active ?? true);
      setSortOrder(card.sort_order ? card.sort_order.toString() : "0");
      
      let months: string[] = [];
      try {
        if (typeof card.available_months === 'string') {
          months = JSON.parse(card.available_months);
        } else if (Array.isArray(card.available_months)) {
          months = card.available_months;
        }
      } catch (e) {
        console.error("Failed to parse months", e);
      }
      setAvailableMonths(Array.isArray(months) ? months : []);
      
      setImagePreview(card.image_url || null);
      setImageFile(null);
    } else {
      setEditingCard(null);
      setTitle("");
      setPrice("300");
      setIsActive(true);
      setSortOrder("0");
      setAvailableMonths([...MONTHS]);
      setImagePreview(null);
      setImageFile(null);
    }
    setIsModalOpen(true);
  };

  const handleMonthToggle = (month: string) => {
    setAvailableMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!title || !price) {
      setError("Title and Price are required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("price", price);
    formData.append("is_active", isActive ? "1" : "0");
    formData.append("sort_order", sortOrder || "0");
    formData.append("available_months", JSON.stringify(availableMonths));
    
    if (imageFile) {
      formData.append("image", imageFile);
    }

    let url = "/api/admin/cards";
    if (editingCard) {
      url = `/api/admin/cards/${editingCard.id}`;
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        fetchCards();
        // Optional: you could add a local "Toast" success state here
      } else {
        setError(data.message || data.error || "Failed to save card template.");
      }
    } catch (_err) {
      setError("Network error: Could not reach the server.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this card?")) return;
    try {
      const res = await fetch(`/api/admin/cards/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
      });
      if (res.ok) fetchCards();
    } catch (_err) {
      console.error(_err);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/cards/${id}/toggle`, {
        method: "PATCH",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
      });
      if (res.ok) fetchCards();
    } catch (_err) {
      console.error(_err);
    }
  };

  const stats = useMemo(() => {
    return {
      total: cards.length,
      active: cards.filter(c => c.is_active).length,
      inactive: cards.filter(c => !c.is_active).length,
      avgPrice: cards.length ? cards.reduce((s, c) => s + Number(c.price), 0) / cards.length : 0
    };
  }, [cards]);

  const filteredCards = cards.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto flex flex-col h-full fade-in">
      
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<CreditCard size={20} />} label="Total Templates" value={stats.total} color="blue" />
        <StatCard icon={<CheckCircle size={20} />} label="Active Cards" value={stats.active} color="emerald" sub="Live on app" />
        <StatCard icon={<Activity size={20} />} label="Inactive Cards" value={stats.inactive} color="amber" sub="Hidden templates" />
        <StatCard icon={<DollarSign size={20} />} label="Avg. Card Price" value={`₱${stats.avgPrice.toFixed(0)}`} color="violet" />
      </div>

      {/* Main Container */}
      <div className="bg-white border border-zinc-200 rounded-[0.75rem] shadow-sm overflow-hidden flex flex-col flex-1">
        
        {/* Sub-header / Filters */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[240px] relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by card title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#6a12b8]/10 focus:border-[#6a12b8] transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Btn onClick={() => handleOpenModal()} size="md">
              <Plus size={16} />
              <span>New Card Type</span>
            </Btn>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/30">
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Card Template</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Price</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sort Order</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-zinc-50 animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-40 bg-zinc-100 rounded-lg" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-zinc-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-zinc-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-5 w-20 bg-zinc-100 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-8 w-24 ml-auto bg-zinc-100 rounded-lg" /></td>
                  </tr>
                ))
              ) : filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CreditCard size={28} className="text-zinc-300" />
                    </div>
                    <h3 className="text-sm font-bold text-[#1a0f2e]">No card templates found</h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">Create a new template to start offering personalized loyalty cards to your customers.</p>
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => (
                  <tr key={card.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                          {card.image_url ? (
                            <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-zinc-300" /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#1a0f2e] text-sm truncate">{card.title}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">#{card.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#6a12b8] tabular-nums text-sm">₱{Number(card.price).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 font-medium">
                      {card.sort_order}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleToggleActive(card.id)} className="cursor-pointer hover:opacity-80 transition-opacity">
                        <Badge status={card.is_active} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Btn onClick={() => handleOpenModal(card)} variant="secondary" className="h-8 w-8 !p-0 justify-center">
                          <Edit2 size={13} />
                        </Btn>
                        <Btn onClick={() => handleDelete(card.id)} variant="danger" className="h-8 w-8 !p-0 justify-center">
                          <Trash2 size={13} />
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Integration */}
      {isModalOpen && (
        <ModalShell
          onClose={() => setIsModalOpen(false)}
          icon={<CreditCard size={18} className="text-violet-600" />}
          title={editingCard ? "Edit Card Template" : "New Card Template"}
          sub={editingCard ? "Modify the existing loyalty card details" : "Create a new loyalty card template for the app"}
          maxWidth="max-w-2xl"
          footer={
            <>
              <Btn variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</Btn>
              <Btn onClick={handleSave} disabled={isSaving} className="min-w-32 justify-center">
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle size={15} />
                    <span>Save Template</span>
                  </>
                )}
              </Btn>
            </>
          }
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle size={15} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Field label="Card Title" required>
                <input
                  type="text"
                  placeholder="e.g. Classic Milktea Card"
                  className={inputCls()}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Price (₱)" required>
                  <input
                    type="number"
                    className={inputCls()}
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                  />
                </Field>
                <Field label="Sort Order">
                  <input
                    type="number"
                    className={inputCls()}
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                  />
                </Field>
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <div className={`relative w-10 h-5 flex items-center rounded-full transition-colors ${isActive ? "bg-[#6a12b8]" : "bg-zinc-200"}`}>
                    <div className={`absolute w-3.5 h-3.5 bg-white rounded-full transition-transform transform ${isActive ? "translate-x-5.5" : "translate-x-1"} shadow-sm`} />
                  </div>
                  <span className="text-xs font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors">Enabled & Active</span>
                </label>
              </div>
            </div>

            <div className="space-y-5">
              <Field label="Card Cover Image">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-200 bg-zinc-50 rounded-2xl cursor-pointer hover:bg-zinc-100 hover:border-violet-300 transition-all overflow-hidden relative group">
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="text-zinc-400 group-hover:text-violet-500 transition-colors" size={24} />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Upload Image</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </Field>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Available Months</label>
                  <button onClick={() => setAvailableMonths(availableMonths.length === 12 ? [] : [...MONTHS])} className="text-[10px] font-bold text-[#6a12b8] hover:underline">
                    {availableMonths.length === 12 ? "Reset" : "Select All"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {MONTHS.map(m => (
                    <button
                      key={m}
                      onClick={() => handleMonthToggle(m)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                        availableMonths.includes(m)
                          ? "bg-violet-50 text-violet-700 border-violet-200 shadow-sm"
                          : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

export default CardManagementTab;
