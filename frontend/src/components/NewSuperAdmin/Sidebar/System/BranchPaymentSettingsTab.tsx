import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  CreditCard, Upload, AlertCircle, Store, Save,
  XCircle, Smartphone as PhoneIcon, Search, LayoutGrid, MapPin,
  RefreshCw, ChevronRight, ImageIcon
} from "lucide-react";
import { useToast } from "../../../../hooks/useToast";
import { triggerSync } from "../../../../utils/sync";

// ── Types ──────────────────────────────────────────────────────────────────────
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type ColorKey = "violet" | "emerald" | "amber" | "blue" | "red";

interface PaymentSettings {
  branch_id?: number | string;
  branch_name?: string;
  gcash_name: string;
  gcash_number: string;
  gcash_qr: string | null;
  gcash_qr_url?: string | null;
  maya_name: string;
  maya_number: string;
  maya_qr: string | null;
  maya_qr_url?: string | null;
  image: string | null;
  image_url?: string | null;
}

interface Branch {
  id: number;
  name: string;
  payment_settings?: PaymentSettings;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

const getHeaders = (isMultipart = false): Record<string, string> => {
  const token = localStorage.getItem('auth_token') ?? localStorage.getItem('lucky_boba_token') ?? '';
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// ── Shared UI Components ──────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color?: ColorKey;
}> = ({ icon, label, value, sub, color = "violet" }) => {
  const colors = {
    violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600" },
    red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-600" },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm">
      <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-lg shadow-sm shrink-0`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 truncate">{label}</p>
        <p className="text-lg font-black text-[#1a0f2e] tabular-nums truncate leading-tight">{value}</p>
        {sub && <p className="text-[9px] text-zinc-400 font-bold truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const Btn: React.FC<{
  children: React.ReactNode; variant?: VariantKey;
  size?: "sm" | "md"; onClick?: () => void; className?: string; disabled?: boolean;
  type?: "button" | "submit";
}> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false, type = "button" }) => {
  const sizes = { sm: "px-3 py-1.5 text-[10px]", md: "px-4 py-2.5 text-xs" };
  const variants = {
    primary: "bg-[#3b2063] hover:bg-[#2a1647] text-white shadow-sm",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white",
    ghost: "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-black uppercase tracking-widest rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const ModalShell: React.FC<{
  onClose: () => void; icon: React.ReactNode; title: string; sub: string;
  children: React.ReactNode; footer: React.ReactNode; maxWidth?: string;
}> = ({ onClose, icon, title, sub, children, footer, maxWidth = "max-w-2xl" }) =>
    createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />
        <div className={`relative bg-white w-full ${maxWidth} border border-zinc-200 rounded-[1.25rem] shadow-2xl overflow-hidden flex flex-col`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
              <div>
                <p className="text-sm font-black text-[#1a0f2e] uppercase tracking-tight">{title}</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{sub}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400">
              <XCircle size={18} />
            </button>
          </div>
          <div className="px-8 py-8 flex flex-col gap-6 max-h-[80vh] overflow-y-auto sa-scroll bg-white">{children}</div>
          <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-zinc-100 bg-zinc-50/50 shadow-inner">{footer}</div>
        </div>
      </div>,
      document.body
    );

const Badge: React.FC<{ active: boolean; label?: string; success?: boolean }> = ({ active, label, success = true }) => (
  <div className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] rounded border inline-flex items-center gap-1.5 ${active ? (success ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100") : "bg-zinc-50 text-zinc-400 border-zinc-100"
    }`}>
    {active && <span className={`w-1 h-1 rounded-full ${success ? "bg-emerald-500" : "bg-blue-500"} animate-pulse`} />}
    {label || (active ? "Active" : "Inactive")}
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-xs font-bold text-zinc-700 bg-zinc-50/50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? "border-red-300 bg-red-50" : "border-zinc-200"}`;

// ── Main Component ─────────────────────────────────────────────────────────────
const BranchPaymentSettingsTab: React.FC = () => {
  const { showToast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Selected Branch Context
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [settings, setSettings] = useState<PaymentSettings>({
    gcash_name: "", gcash_number: "", gcash_qr: null,
    maya_name: "", maya_number: "", maya_qr: null,
    image: null,
  });

  // Upload previews
  const [gcashFile, setGcashFile] = useState<File | null>(null);
  const [mayaFile, setMayaFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [gcashPreview, setGcashPreview] = useState<string | null>(null);
  const [mayaPreview, setMayaPreview] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const gcashInputRef = useRef<HTMLInputElement>(null);
  const mayaInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/branches`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setBranches(data.data);
    } catch (err) {
      console.error("Failed to fetch branches", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const openManage = async (branch: Branch) => {
    setSelectedBranch(branch);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/branch/payment-settings?branch_id=${branch.id}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setGcashPreview(data.data.gcash_qr_url);
        setMayaPreview(data.data.maya_qr_url);
        setImagePreview(data.data.image_url);
      }
    } catch (_err) {
      showToast("Failed to load payment settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const closeManage = () => {
    setSelectedBranch(null);
    setGcashFile(null); setMayaFile(null); setImageFile(null);
    setGcashPreview(null); setMayaPreview(null); setImagePreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'gcash' | 'maya' | 'image') => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      if (type === 'gcash') { setGcashFile(file); setGcashPreview(preview); }
      else if (type === 'maya') { setMayaFile(file); setMayaPreview(preview); }
      else { setImageFile(file); setImagePreview(preview); }
    }
  };

  const handleSave = async () => {
    if (!selectedBranch) return;
    setSaving(true);

    const fd = new FormData();
    fd.append('branch_id', selectedBranch.id.toString());
    fd.append('gcash_name', settings.gcash_name);
    fd.append('gcash_number', settings.gcash_number);
    fd.append('maya_name', settings.maya_name);
    fd.append('maya_number', settings.maya_number);

    if (gcashFile) fd.append('gcash_qr', gcashFile);
    if (mayaFile) fd.append('maya_qr', mayaFile);
    if (imageFile) fd.append('image', imageFile);

    try {
      const res = await fetch(`${API_BASE}/branch/payment-settings`, {
        method: 'POST',
        headers: getHeaders(true),
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        triggerSync();
        showToast("Branch settings synchronized", "success");
        fetchBranches();
        closeManage();
      } else {
        showToast(data.message || "Failed to update settings", "error");
      }
    } catch (_err) {
      showToast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredBranches = branches.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
  const activePayments = branches.filter(b => b.payment_settings?.gcash_number || b.payment_settings?.maya_number).length;
  const brandedBranches = branches.filter(b => b.payment_settings?.image_url).length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col h-full fade-in sa-scroll">

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
        <StatCard icon={<LayoutGrid size={18} />} label="Total Branches" value={branches.length} color="violet" />
        <StatCard icon={<CreditCard size={18} />} label="Pay-Ready" value={activePayments} color="emerald" sub={`${Math.round((activePayments / branches.length) * 100 || 0)}% Coverage`} />
        <StatCard icon={<ImageIcon size={18} />} label="Mobile Branded" value={brandedBranches} color="blue" sub="Store cover photos uploaded" />
        <StatCard icon={<RefreshCw size={18} />} label="System Status" value="SYNCED" color="amber" sub="Real-time app connectivity" />
      </div>

      {/* Search Bar Under Metrics */}
      <div className="mb-6 shrink-0">
        <div className="relative group w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search branches..."
            className="bg-white border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-violet-400 transition-all w-full shadow-sm"
          />
        </div>
      </div>

      {/* Branch Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto sa-scroll pb-10">
        {loading && !branches.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-zinc-100 rounded-2xl border border-zinc-200" />
            ))}
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-zinc-100 shadow-sm">
            <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-200 mb-4"><MapPin size={32} /></div>
            <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">No branches found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map(branch => (
              <div key={branch.id} className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-violet-200 transition-all duration-300 flex flex-col">
                <div className="relative aspect-video bg-zinc-100 overflow-hidden">
                  {branch.payment_settings?.image_url ? (
                    <img src={branch.payment_settings.image_url} alt={branch.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-2">
                      <ImageIcon size={32} />
                      <span className="text-[10px] font-black uppercase tracking-widest">No Cover Photo</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <Badge active={!!branch.payment_settings?.image_url} label="Branding" success={false} />
                    <Badge active={!!(branch.payment_settings?.gcash_number || branch.payment_settings?.maya_number)} label="Payments" />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-black text-[#1a0f2e] uppercase tracking-tight truncate">{branch.name}</h3>
                      <span className="text-[10px] font-mono text-zinc-300">#{branch.id}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${branch.payment_settings?.gcash_number ? "bg-blue-500" : "bg-zinc-200"}`} />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">GCash</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${branch.payment_settings?.maya_number ? "bg-emerald-500" : "bg-zinc-200"}`} />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Maya</span>
                      </div>
                    </div>
                  </div>
                  <Btn onClick={() => openManage(branch)} variant="secondary" className="w-full justify-center group-hover:bg-[#3b2063] group-hover:text-white group-hover:border-transparent">
                    Manage Assets <ChevronRight size={14} />
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {selectedBranch && (
        <ModalShell
          onClose={closeManage}
          icon={<Store size={22} className="text-violet-600" />}
          title={selectedBranch.name}
          sub={`Configure global branding & payment endpoints`}
          footer={
            <>
              <Btn variant="ghost" onClick={closeManage} disabled={saving}>Discard</Btn>
              <Btn onClick={handleSave} disabled={saving} className="min-w-[160px] justify-center">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <><Save size={14} /> Save & Synchronize</>}
              </Btn>
            </>
          }
        >
          {/* Branch Cover */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1a0f2e] flex items-center gap-2">
              <ImageIcon size={14} /> App Cover Photo
            </h4>
            <div
              onClick={() => imageInputRef.current?.click()}
              className="relative aspect-video bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl overflow-hidden cursor-pointer hover:border-violet-400 transition-all flex flex-col items-center justify-center p-2"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl shadow-lg" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-300">
                  <Upload size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Upload 16:9 Landscape</span>
                </div>
              )}
              {imagePreview && (
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-white">
                    <Upload size={24} />
                    <span className="text-[10px] font-black uppercase">Change Image</span>
                  </div>
                </div>
              )}
              <input ref={imageInputRef} type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'image')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* GCash */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <div className="w-6 h-6 bg-[#007DFE] rounded flex items-center justify-center text-white"><PhoneIcon size={12} /></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1a0f2e]">GCash Endpoint</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase mb-1 block">Account Name</label>
                  <input value={settings.gcash_name} onChange={e => setSettings({ ...settings, gcash_name: e.target.value })} className={inputCls()} placeholder="e.g. Lucky Boba Main" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase mb-1 block">Number</label>
                  <input value={settings.gcash_number} onChange={e => setSettings({ ...settings, gcash_number: e.target.value })} className={inputCls()} placeholder="0917 XXX XXXX" />
                </div>
                <div
                  onClick={() => gcashInputRef.current?.click()}
                  className="relative aspect-square max-w-[140px] mx-auto bg-zinc-50 border-2 border-dashed border-zinc-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-all p-1"
                >
                  {gcashPreview ? (
                    <img src={gcashPreview} alt="QR" className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <div className="text-zinc-200 flex flex-col items-center gap-1.5"><Upload size={20} /><span className="text-[8px] font-black">Upload QR</span></div>
                  )}
                  <input ref={gcashInputRef} type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'gcash')} />
                </div>
              </div>
            </div>

            {/* Maya */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <div className="w-6 h-6 bg-[#00D084] rounded flex items-center justify-center text-white"><PhoneIcon size={12} /></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1a0f2e]">Maya Endpoint</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase mb-1 block">Account Name</label>
                  <input value={settings.maya_name} onChange={e => setSettings({ ...settings, maya_name: e.target.value })} className={inputCls()} placeholder="e.g. Lucky Boba Maya" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-400 uppercase mb-1 block">Number</label>
                  <input value={settings.maya_number} onChange={e => setSettings({ ...settings, maya_number: e.target.value })} className={inputCls()} placeholder="0917 XXX XXXX" />
                </div>
                <div
                  onClick={() => mayaInputRef.current?.click()}
                  className="relative aspect-square max-w-[140px] mx-auto bg-zinc-50 border-2 border-dashed border-zinc-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition-all p-1"
                >
                  {mayaPreview ? (
                    <img src={mayaPreview} alt="QR" className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <div className="text-zinc-200 flex flex-col items-center gap-1.5"><Upload size={20} /><span className="text-[8px] font-black">Upload QR</span></div>
                  )}
                  <input ref={mayaInputRef} type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'maya')} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
            <AlertCircle className="text-amber-500 shrink-0" size={16} />
            <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
              Updating these assets will instantly refresh the mobile app branding for this branch. Ensure the QR codes are correctly formatted for high-contrast scanning.
            </p>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

export default BranchPaymentSettingsTab;
