import { useState, useEffect, useRef } from "react";
import { 
  CreditCard, Smartphone, Upload, 
  CheckCircle2, AlertCircle, Store, Save,
  ArrowRight
} from "lucide-react";
import { useToast } from "../../../../hooks/useToast";

interface PaymentSettings {
  branch_id?: number;
  branch_name?: string;
  gcash_name: string;
  gcash_number: string;
  gcash_qr: string | null;
  maya_name: string;
  maya_number: string;
  maya_qr: string | null;
  image: string | null;
  image_url?: string | null;
}

interface Branch {
  id: number;
  name: string;
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

const BranchPaymentSettingsTab: React.FC = () => {
  const { showToast } = useToast();
  const [user, setUser] = useState<{ role: string; branch_id: number | null } | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [settings, setSettings] = useState<PaymentSettings>({
    gcash_name: "",
    gcash_number: "",
    gcash_qr: null,
    maya_name: "",
    maya_number: "",
    maya_qr: null,
    image: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gcashFile, setGcashFile] = useState<File | null>(null);
  const [mayaFile, setMayaFile] = useState<File | null>(null);
  const [gcashPreview, setGcashPreview] = useState<string | null>(null);
  const [mayaPreview, setMayaPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const gcashInputRef = useRef<HTMLInputElement>(null);
  const mayaInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setSelectedBranchId(parsed.branch_id);
    }
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      fetchSettings(selectedBranchId);
    }
  }, [selectedBranchId]);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${API_BASE}/branches`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setBranches(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch branches", err);
    }
  };

  const fetchSettings = async (branchId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/branch/payment-settings?branch_id=${branchId}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setGcashPreview(data.data.gcash_qr_url);
        setMayaPreview(data.data.maya_qr_url);
        setImagePreview(data.data.image_url);
      }
    } catch (err) {
      showToast("Failed to load payment settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'gcash' | 'maya' | 'image') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'gcash') {
        setGcashFile(file);
        setGcashPreview(URL.createObjectURL(file));
      } else if (type === 'maya') {
        setMayaFile(file);
        setMayaPreview(URL.createObjectURL(file));
      } else {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSave = async () => {
    if (!selectedBranchId) return;
    setSaving(true);

    const formData = new FormData();
    formData.append('branch_id', selectedBranchId.toString());
    formData.append('gcash_name', settings.gcash_name);
    formData.append('gcash_number', settings.gcash_number);
    formData.append('maya_name', settings.maya_name);
    formData.append('maya_number', settings.maya_number);
    
    if (gcashFile) formData.append('gcash_qr', gcashFile);
    if (mayaFile) formData.append('maya_qr', mayaFile);
    if (imageFile) formData.append('image', imageFile);

    try {
      const res = await fetch(`${API_BASE}/branch/payment-settings`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        showToast("Payment settings updated successfully", "success");
        setGcashFile(null);
        setMayaFile(null);
        setImageFile(null);
      } else {
        showToast(data.message || "Failed to update settings", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !branches.length) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin" />
          <p className="text-sm font-bold text-zinc-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
              <CreditCard className="text-white" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-[#1a0f2e]">Payment Settings</h1>
          </div>
          <p className="text-zinc-500 text-sm">Configure branch-specific QR codes and payment details for Gcash and Maya.</p>
        </div>

        {user?.role === 'superadmin' && (
          <div className="bg-white border border-zinc-200 rounded-xl p-1.5 flex items-center gap-2 shadow-sm">
            <div className="pl-3 py-1 border-r border-zinc-100 mr-1">
              <Store size={14} className="text-zinc-400" />
            </div>
            <select
              value={selectedBranchId || ""}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-[#1a0f2e] outline-none pr-8 py-1.5 appearance-none cursor-pointer"
            >
              <option value="" disabled>Select Branch</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GCash Section */}
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-[#007DFE] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Smartphone size={18} className="text-[#007DFE]" />
              </div>
              <h3 className="font-bold text-white">GCash Details</h3>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Main Payment</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">GCash Name</label>
                <input
                  type="text"
                  value={settings.gcash_name}
                  onChange={(e) => setSettings({ ...settings, gcash_name: e.target.value })}
                  placeholder="e.g. LUCKY BOBA TEA"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1a0f2e] placeholder:text-zinc-300 focus:ring-2 focus:ring-[#007DFE]/20 focus:border-[#007DFE] outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">GCash Number</label>
                <input
                  type="text"
                  value={settings.gcash_number}
                  onChange={(e) => setSettings({ ...settings, gcash_number: e.target.value })}
                  placeholder="e.g. 0917 XXX XXXX"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1a0f2e] placeholder:text-zinc-300 focus:ring-2 focus:ring-[#007DFE]/20 focus:border-[#007DFE] outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">GCash QR Code</label>
              <div 
                onClick={() => gcashInputRef.current?.click()}
                className="relative group cursor-pointer"
              >
                {gcashPreview ? (
                  <div className="relative aspect-square max-w-[200px] mx-auto bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 p-2 overflow-hidden hover:border-[#007DFE] transition-colors">
                    <img 
                      src={gcashPreview} 
                      alt="GCash QR" 
                      className="w-full h-full object-contain rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                      <div className="flex flex-col items-center gap-1.5">
                        <Upload size={24} className="text-white" />
                        <span className="text-[10px] font-black uppercase text-white">Change Image</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square max-w-[200px] mx-auto bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-3 hover:border-[#007DFE] hover:bg-[#007DFE]/5 transition-all">
                    <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center">
                      <Upload size={20} className="text-zinc-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-zinc-700">Click to Upload</p>
                      <p className="text-[9px] text-zinc-400 mt-0.5 uppercase tracking-widest font-black">PNG, JPG or WebP</p>
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={gcashInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'gcash')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Maya Section */}
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-[#00D084] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Smartphone size={18} className="text-[#00D084]" />
              </div>
              <h3 className="font-bold text-white">Maya Details</h3>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Secondary</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Maya Name</label>
                <input
                  type="text"
                  value={settings.maya_name}
                  onChange={(e) => setSettings({ ...settings, maya_name: e.target.value })}
                  placeholder="e.g. LUCKY BOBA TEA"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1a0f2e] placeholder:text-zinc-300 focus:ring-2 focus:ring-[#00D084]/20 focus:border-[#00D084] outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Maya Number</label>
                <input
                  type="text"
                  value={settings.maya_number}
                  onChange={(e) => setSettings({ ...settings, maya_number: e.target.value })}
                  placeholder="e.g. 0917 XXX XXXX"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1a0f2e] placeholder:text-zinc-300 focus:ring-2 focus:ring-[#00D084]/20 focus:border-[#00D084] outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Maya QR Code</label>
              <div 
                onClick={() => mayaInputRef.current?.click()}
                className="relative group cursor-pointer"
              >
                {mayaPreview ? (
                  <div className="relative aspect-square max-w-[200px] mx-auto bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 p-2 overflow-hidden hover:border-[#00D084] transition-colors">
                    <img 
                      src={mayaPreview} 
                      alt="Maya QR" 
                      className="w-full h-full object-contain rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                      <div className="flex flex-col items-center gap-1.5">
                        <Upload size={24} className="text-white" />
                        <span className="text-[10px] font-black uppercase text-white">Change Image</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square max-w-[200px] mx-auto bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-3 hover:border-[#00D084] hover:bg-[#00D084]/5 transition-all">
                    <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center">
                      <Upload size={20} className="text-zinc-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-zinc-700">Click to Upload</p>
                      <p className="text-[9px] text-zinc-400 mt-0.5 uppercase tracking-widest font-black">PNG, JPG or WebP</p>
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={mayaInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'maya')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Display Section */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="bg-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Store size={18} className="text-white" />
            </div>
            <h3 className="font-bold text-white">Store Display Image</h3>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">App Branding</p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div 
              onClick={() => imageInputRef.current?.click()}
              className="relative group cursor-pointer w-full md:w-64 aspect-video bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center overflow-hidden hover:border-violet-400 transition-all"
            >
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Store Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={20} className="text-zinc-300" />
                  <span className="text-[10px] font-bold text-zinc-400">Click to Upload</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <div className="flex flex-col items-center gap-1.5">
                  <Upload size={20} className="text-white" />
                  <span className="text-[10px] font-black uppercase text-white">Change Cover</span>
                </div>
              </div>
              <input 
                type="file" 
                ref={imageInputRef}
                className="hidden" 
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'image')}
              />
            </div>

            <div className="flex-1 space-y-3">
              <h4 className="text-sm font-bold text-[#1a0f2e]">Store Cover Photo</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                This image will be displayed on the store locator cards in the mobile app. 
                Recommended aspect ratio: <b>16:9</b> (Landscape). 
                Supported formats: PNG, JPG, WebP. Max size: 2MB.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg w-fit">
                <CheckCircle2 size={12} />
                <span>Automatically Optimized for Mobile</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end pt-4 border-t border-zinc-100">
        <button
          onClick={handleSave}
          disabled={saving || !selectedBranchId}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-lg shadow-violet-200 active:scale-[0.98] transition-all"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          <span>{saving ? 'Syncing Settings...' : 'Save & Publish to App'}</span>
          {!saving && <ArrowRight size={16} className="opacity-60" />}
        </button>
      </div>

      {/* Warning Alert */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-amber-100">
          <AlertCircle className="text-amber-500" size={20} />
        </div>
        <div>
          <p className="text-xs font-bold text-amber-800">Operational Notice</p>
          <p className="text-[11px] text-amber-700/80 mt-1 leading-relaxed">
            Changes made to payment names, numbers, or QR codes will be applied <b>instantly</b> to the mobile application for the selected branch. Please ensure the information is accurate to avoid payment friction during customer checkouts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BranchPaymentSettingsTab;
