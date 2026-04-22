import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Trash2, Edit3, Eye, EyeOff, GripVertical, Upload,
  Image as ImageIcon, Sparkles, RefreshCw, CheckCircle2,
  XCircle, Info, Search, LayoutGrid
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type VariantKey = "primary" | "secondary" | "danger" | "ghost";

interface FeaturedDrink {
  id: number;
  title: string;
  subtitle: string | null;
  image: string | null;
  image_url: string | null;
  cta_text: string;
  is_active: boolean;
  sort_order: number;
}

// ── Auth & API helpers ─────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";

const api = async (path: string, opts: RequestInit = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (!(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`/api${path}`, { ...opts, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ── Shared UI Components ──────────────────────────────────────────────────────
const Btn: React.FC<{
  children: React.ReactNode; variant?: VariantKey;
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

const Badge: React.FC<{ active: boolean; label?: string }> = ({ active, label }) => (
  <div className={`px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] rounded border inline-flex items-center gap-1.5 ${active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-zinc-50 text-zinc-400 border-zinc-100"
    }`}>
    {active && <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />}
    {label || (active ? "Live" : "Inactive")}
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? "border-red-300 bg-red-50" : "border-zinc-200"}`;

// ── Main Component ─────────────────────────────────────────────────────────────
const FeaturedDrinksTab = () => {
  const [items, setItems] = useState<FeaturedDrink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FeaturedDrink | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [ctaText, setCtaText] = useState("ORDER NOW");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const data = await api("/featured-drinks");
      setItems(data);
    } catch { /* fail silently */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setTitle(""); setSubtitle(""); setCtaText("ORDER NOW");
    setImageFile(null); setPreview(null); setEditing(null); setShowForm(false);
  };

  const openEdit = (item: FeaturedDrink) => {
    setEditing(item);
    setTitle(item.title);
    setSubtitle(item.subtitle || "");
    setCtaText(item.cta_text);
    setPreview(item.image_url);
    setImageFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("subtitle", subtitle);
      fd.append("cta_text", ctaText);
      if (imageFile) fd.append("image", imageFile);
      fd.append("is_active", "1");
      fd.append("sort_order", String(items.length));

      if (editing) {
        await api(`/featured-drinks/${editing.id}`, { method: "POST", body: fd });
      } else {
        await api("/featured-drinks", { method: "POST", body: fd });
      }
      resetForm();
      fetchItems();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this featured banner?")) return;
    setDeleting(id);
    try {
      await api(`/featured-drinks/${id}`, { method: "DELETE" });
      fetchItems();
    } catch (err) { console.error(err); }
    finally { setDeleting(null); }
  };

  const handleToggle = async (id: number) => {
    try {
      await api(`/featured-drinks/${id}/toggle`, { method: "PATCH" });
      fetchItems();
    } catch (err) { console.error(err); }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const activeCount = items.filter(i => i.is_active).length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col h-full fade-in sa-scroll">

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 mb-4 min-h-0">
        <div className="px-4 py-2.5 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-y-3 gap-x-6 bg-zinc-50/10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-[11px] font-black text-[#1a0f2e] uppercase tracking-tight flex items-center gap-2 shrink-0">
              <Sparkles size={14} className="text-violet-600" />
              Promo Media
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100 text-[8px] font-black uppercase tracking-widest leading-none">
                <Eye size={10} /> {activeCount} Live
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded border border-violet-100 text-[8px] font-black uppercase tracking-widest leading-none">
                <LayoutGrid size={10} /> {items.length} Total
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="relative group w-full max-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <input
                type="text"
                placeholder="Quick search..."
                className={`${inputCls()} pl-9 h-8 text-xs rounded-lg`}
              />
            </div>
            <Btn onClick={() => { resetForm(); setShowForm(true); }} size="sm" className="h-8 py-0 px-3 shadow-sm shrink-0">
              <Plus size={14} /> New Creative
            </Btn>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 sa-scroll">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400 w-12">Pos</th>
                <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center">Creative</th>
                <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400">Details</th>
                <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400">Action</th>
                <th className="px-4 py-2 text-center text-[8px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-4 py-2 text-right text-[8px] font-black uppercase tracking-widest text-zinc-400">Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-8"><div className="h-12 bg-zinc-50 rounded-2xl w-full" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-zinc-200">
                      <ImageIcon size={40} />
                    </div>
                    <p className="text-zinc-400 font-black uppercase tracking-widest text-sm">No promo media found</p>
                    <p className="text-xs text-zinc-400 mt-2 max-w-xs mx-auto">Create eye-catching banners to engage your mobile users.</p>
                  </td>
                </tr>
              ) : items.map((item, idx) => (
                <tr key={item.id} className={`hover:bg-violet-50/20 transition-colors group ${!item.is_active && "opacity-60 grayscale-[0.5]"}`}>
                  <td className="px-4 py-1.5">
                    <div className="flex items-center gap-2">
                      <GripVertical size={11} className="text-zinc-300 group-hover:text-violet-400 transition-colors cursor-grab" />
                      <span className="font-mono text-[10px] font-black text-zinc-300">{idx + 1}</span>
                    </div>
                  </td>
                  <td className="px-4 py-1.5 flex justify-center">
                    <div className="w-16 h-8 rounded-md overflow-hidden bg-zinc-50 border border-zinc-100 shadow-sm relative transition-all">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon size={14} className="text-zinc-200" /></div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-1.5">
                    <div>
                      <p className="font-black text-[#1a0f2e] text-[11px] group-hover:text-violet-600 transition-colors truncate max-w-[120px]">{item.title}</p>
                    </div>
                  </td>
                  <td className="px-4 py-1.5">
                    <div className="inline-flex items-center gap-1.5 px-1.5 py-0.5 bg-zinc-50 border border-zinc-100 rounded-md">
                      <span className="text-[8px] font-bold text-violet-600 uppercase tracking-wider">{item.cta_text}</span>
                    </div>
                  </td>
                  <td className="px-4 py-1.5 text-center">
                    <Badge active={item.is_active} />
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleToggle(item.id)} className="w-7 h-7 bg-white border border-zinc-200 text-zinc-400 hover:text-violet-600 hover:border-violet-200 rounded-md flex items-center justify-center transition-all shadow-sm">
                        {item.is_active ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                      <button onClick={() => openEdit(item)} className="w-7 h-7 bg-white border border-zinc-200 text-zinc-400 hover:text-violet-600 hover:border-violet-200 rounded-md flex items-center justify-center transition-all shadow-sm">
                        <Edit3 size={11} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id} className="w-7 h-7 bg-white border border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-100 rounded-md flex items-center justify-center transition-all shadow-sm">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tip Section - Collapsed for space */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-lg shrink-0 mb-4">
        <Info size={12} className="text-zinc-400" />
        <p className="text-[9px] text-zinc-500 font-medium">
          <span className="font-bold text-zinc-700 uppercase tracking-tighter">Tip:</span> Use 16:9 banners (800x450px) for optimal display. Drag rows to manage mobile app priority.
        </p>
      </div>

      {/* Form Modal */}
      {showForm && (
        <ModalShell
          onClose={resetForm}
          icon={<Sparkles size={22} className="text-violet-600" />}
          title={editing ? "Modify Banner Config" : "Deploy New Creative"}
          sub={editing ? `Updating "${editing.title}" collection` : "Design a new hero banner for mobile players"}
          maxWidth="max-w-xl"
          footer={
            <>
              <Btn variant="ghost" onClick={resetForm} disabled={saving}>Cancel</Btn>
              <Btn type="submit" onClick={() => (document.getElementById('bannerForm') as HTMLFormElement)?.requestSubmit()} disabled={saving} className="min-w-[140px] justify-center">
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> {editing ? "Save Changes" : "Confirm & Push"}</>}
              </Btn>
            </>
          }
        >
          <form id="bannerForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">Banner Creative *</label>
              <label className={`relative flex flex-col items-center justify-center w-full h-44 rounded-[1.25rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden ${preview ? "border-violet-200" : "border-zinc-200 hover:border-violet-300 bg-zinc-50"
                }`}>
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={24} className="text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Replace Design</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-zinc-100 flex items-center justify-center text-zinc-400">
                      <ImageIcon size={24} />
                    </div>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Click to upload 16:9 banner</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
              </label>
            </div>

            <Field label="Hero Title" required>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Wintermelon Series" className={inputCls()} required />
            </Field>

            <Field label="Supportive Subtitle (Optional)">
              <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="e.g. Try our new limited collection" className={inputCls()} />
            </Field>

            <Field label="Call-To-Action Label">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px] uppercase tracking-widest group-focus-within:text-violet-500 transition-colors">Label:</div>
                <input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="ORDER NOW" className={`${inputCls()} pl-16 font-black uppercase text-violet-600`} />
              </div>
            </Field>
          </form>
        </ModalShell>
      )}
    </div>
  );
};

export default FeaturedDrinksTab;
