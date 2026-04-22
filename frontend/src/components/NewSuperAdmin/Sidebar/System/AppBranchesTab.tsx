import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Edit3, Eye, EyeOff, LayoutGrid, Upload,
  Image as ImageIcon, GitBranch, RefreshCw, CheckCircle2,
  XCircle, Search, MapPin, Store
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type VariantKey = "primary" | "secondary" | "danger" | "ghost";

interface Branch {
  id: number;
  name: string;
  location: string;
  status: string;
  ownership_type: string;
  vat_type: string;
  owner_name: string | null;
  store_address: string | null;
  latitude: string | null;
  longitude: string | null;
  image: string | null;
  manager_name: string;
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
    primary: "bg-[#a020f0] hover:bg-[#2a1647] text-white shadow-sm",
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
            <button onClick={onClose} type="button" className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400">
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
    {label || (active ? "Open" : "Closed")}
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? "border-red-300 bg-red-50" : "border-zinc-200"}`;

// ── Main Component ─────────────────────────────────────────────────────────────
const AppBranchesTab = () => {
  const [items, setItems] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [status, setStatus] = useState("active");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const resp = await api("/branches");
      if (resp.success) {
        setItems(resp.data);
      }
    } catch { /* fail silently */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setName(""); setLocation(""); setStoreAddress(""); 
    setLatitude(""); setLongitude(""); setOwnerName(""); 
    setStatus("active");
    setImageFile(null); setPreview(null); setEditing(null); setShowForm(false);
  };

  const openEdit = (item: Branch) => {
    setEditing(item);
    setName(item.name);
    setLocation(item.location);
    setStoreAddress(item.store_address || "");
    setLatitude(item.latitude || "");
    setLongitude(item.longitude || "");
    setOwnerName(item.owner_name || "");
    setStatus(item.status);
    
    // For preview, we should compute the full URL if it's a relative path from API
    // Actually the app stores it without trailing things, let's just use it directly if possible
    setPreview(item.image ? `/storage/${item.image}` : null);
    setImageFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("location", location);
      fd.append("store_address", storeAddress);
      fd.append("latitude", latitude);
      fd.append("longitude", longitude);
      fd.append("owner_name", ownerName);
      fd.append("status", status);
      if (imageFile) fd.append("image", imageFile);

      if (editing) {
        fd.append("_method", "PUT");
        await api(`/branches/${editing.id}`, { method: "POST", body: fd });
      } else {
        await api("/branches", { method: "POST", body: fd });
      }
      resetForm();
      fetchItems();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleToggle = async (branch: Branch) => {
    try {
      const newStatus = branch.status === "active" ? "inactive" : "active";
      const fd = new FormData();
      fd.append("_method", "PUT");
      fd.append("status", newStatus);
      await api(`/branches/${branch.id}`, { method: "POST", body: fd });
      fetchItems();
    } catch (err) { console.error(err); }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const activeCount = items.filter(i => i.status === "active").length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col h-full fade-in sa-scroll">

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 mb-4 min-h-0">
        <div className="px-4 py-2.5 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-y-3 gap-x-6 bg-zinc-50/10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-[11px] font-black text-[#1a0f2e] uppercase tracking-tight flex items-center gap-2 shrink-0">
              <MapPin size={14} className="text-violet-600" />
              App Branches
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100 text-[8px] font-black uppercase tracking-widest leading-none">
                <Eye size={10} /> {activeCount} Open
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
                placeholder="Find a branch..."
                className={`${inputCls()} pl-9 h-8 text-xs rounded-lg`}
              />
            </div>
            <Btn onClick={() => { resetForm(); setShowForm(true); }} size="sm" className="h-8 py-0 px-3 shadow-sm shrink-0">
              <Plus size={14} /> Add App Store
            </Btn>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 sa-scroll">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400 w-16">ID</th>
                <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400">Cover Photo</th>
                <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400">Store Detail</th>
                <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400">Coordinates</th>
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
                      <Store size={40} />
                    </div>
                    <p className="text-zinc-400 font-black uppercase tracking-widest text-sm">No branches found</p>
                    <p className="text-xs text-zinc-400 mt-2 max-w-xs mx-auto">Create a store representation for your mobile app.</p>
                  </td>
                </tr>
              ) : items.map((item) => (
                <tr key={item.id} className={`hover:bg-violet-50/20 transition-colors group ${item.status === "inactive" && "opacity-60 grayscale-[0.3]"}`}>
                  <td className="px-4 py-1.5">
                    <div className="flex items-center gap-2">
                       <span className="font-mono text-[10px] font-black text-zinc-400">#{item.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-1.5">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 flex items-center justify-center relative">
                      {item.image ? (
                        <img src={`/storage/${item.image}`} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={16} className="text-zinc-300" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-1.5">
                    <div>
                      <p className="font-black text-[#1a0f2e] text-[12px] group-hover:text-violet-600 transition-colors">{item.name}</p>
                      <p className="text-[10px] text-zinc-400 font-medium truncate max-w-[200px]">{item.store_address || item.location}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                          Manager: <span className="text-violet-600">{item.manager_name}</span>
                        </span>
                        {item.owner_name && (
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                            Owner: <span className="text-emerald-600">{item.owner_name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-1.5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-zinc-500">Lat: {item.latitude || '—'}</span>
                      <span className="text-[10px] font-mono text-zinc-500">Lng: {item.longitude || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-1.5 text-center">
                    <Badge active={item.status === "active"} />
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleToggle(item)} className="w-7 h-7 bg-white border border-zinc-200 text-zinc-400 hover:text-violet-600 hover:border-violet-200 rounded-md flex items-center justify-center transition-all shadow-sm" title="Toggle Status">
                        {item.status === "active" ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                      <button onClick={() => openEdit(item)} className="w-7 h-7 bg-white border border-zinc-200 text-zinc-400 hover:text-blue-600 hover:border-blue-200 rounded-md flex items-center justify-center transition-all shadow-sm" title="Edit Store">
                        <Edit3 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <ModalShell
          onClose={resetForm}
          icon={<GitBranch size={22} className="text-violet-600" />}
          title={editing ? "Update App Store" : "Add App Store"}
          sub={editing ? `Modifying settings for ${editing.name}` : "Register a new branch for the mobile platform"}
          maxWidth="max-w-xl"
          footer={
            <>
              <Btn variant="ghost" onClick={resetForm} disabled={saving}>Cancel</Btn>
              <Btn type="submit" onClick={() => (document.getElementById('branchAppForm') as HTMLFormElement)?.requestSubmit()} disabled={saving} className="min-w-[140px] justify-center">
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> {editing ? "Save Changes" : "Create Branch"}</>}
              </Btn>
            </>
          }
        >
          <form id="branchAppForm" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">Store Cover Photo</label>
              <label className={`relative flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${preview ? "border-violet-200" : "border-zinc-200 hover:border-violet-300 bg-zinc-50"
                }`}>
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={24} className="text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Replace Photo</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-zinc-100 flex items-center justify-center text-zinc-400">
                      <ImageIcon size={24} />
                    </div>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Upload Store Front (Optional)</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Store Name" required>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lucky Boba Main" className={inputCls()} required />
              </Field>

              <Field label="City / Region" required>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Manila" className={inputCls()} required />
              </Field>
            </div>

            <Field label="Full Store Address">
              <input value={storeAddress} onChange={e => setStoreAddress(e.target.value)} placeholder="e.g. 123 Boba St, Manila" className={inputCls()} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Latitude (Map Coordinates)">
                <input value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="e.g. 14.599512" className={inputCls()} />
              </Field>

              <Field label="Longitude (Map Coordinates)">
                <input value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="e.g. 120.984222" className={inputCls()} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Owner Name">
                <input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="e.g. Juan De La Cruz" className={inputCls()} />
              </Field>

              <Field label="Status" required>
                <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls()} required>
                  <option value="active">Open (Active)</option>
                  <option value="inactive">Closed (Inactive)</option>
                </select>
              </Field>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
};

export default AppBranchesTab;
