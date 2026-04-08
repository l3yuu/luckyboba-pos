"use client"

import { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  Upload, 
  ChevronLeft, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../SharedUI';
import { BranchService, type BranchPaymentSettings } from '../../../services/BranchService';

interface BM_PaymentSettingsProps {
  onBack: () => void;
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bm-ps-root, .bm-ps-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-ps-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #a1a1aa; display: block; margin-bottom: 0.5rem; }
  .bm-ps-input { 
    width: 100%; border: 1px solid #e4e4e7; border-radius: 0.6rem; padding: 0.75rem 1rem; 
    font-size: 0.9rem; font-weight: 500; color: #1a0f2e; transition: all 0.15s ease;
  }
  .bm-ps-input:focus { outline: none; border-color: #3b2063; box-shadow: 0 0 0 3px rgba(59,32,99,0.1); }
  .bm-ps-card { background: #ffffff; border: 1px solid #e4e4e7; border-radius: 0.875rem; transition: all 0.15s ease; }
  .bm-ps-card:hover { border-color: #ddd6f7; box-shadow: 0 8px 32px rgba(59,32,99,0.08); }
  .qr-preview { width: 100%; height: 200px; border-radius: 0.6rem; object-fit: contain; background: #f8f8fa; border: 1px dashed #e4e4e7; }
  .qr-placeholder { width: 100%; height: 200px; border-radius: 0.6rem; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8f8fa; border: 2px dashed #e4e4e7; color: #a1a1aa; transition: all 0.15s ease; }
  .qr-placeholder:hover { border-color: #3b2063; color: #3b2063; background: #f5f3ff; }
`;

const BM_PaymentSettings: React.FC<BM_PaymentSettingsProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [settings, setSettings] = useState<Partial<BranchPaymentSettings>>({
    gcash_name: '',
    gcash_number: '',
    gcash_qr: null,
    maya_name: '',
    maya_number: '',
    maya_qr: null,
  });

  const [previews, setPreviews] = useState<{ gcash: string | null, maya: string | null }>({
    gcash: null,
    maya: null,
  });

  const gcashFileRef = useRef<HTMLInputElement>(null);
  const mayaFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await BranchService.getPaymentSettings();
      setSettings(data);
      setPreviews({
        gcash: data.gcash_qr,
        maya: data.maya_qr,
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setStatus({ type: 'error', message: 'Failed to load payment settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (type: 'gcash' | 'maya', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
      setSettings(prev => ({ ...prev, [`${type}_qr_file`]: file }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append('gcash_name', settings.gcash_name || '');
      formData.append('gcash_number', settings.gcash_number || '');
      formData.append('maya_name', settings.maya_name || '');
      formData.append('maya_number', settings.maya_number || '');

      const gcashFile = (settings as { gcash_qr_file?: File }).gcash_qr_file;
      const mayaFile = (settings as { maya_qr_file?: File }).maya_qr_file;

      if (gcashFile) formData.append('gcash_qr', gcashFile);
      if (mayaFile) formData.append('maya_qr', mayaFile);

      const updated = await BranchService.updatePaymentSettings(formData);
      setSettings(updated);
      setPreviews({
        gcash: updated.gcash_qr,
        maya: updated.maya_qr,
      });
      setStatus({ type: 'success', message: 'Payment settings saved successfully!' });
      
      // Clear file inputs
      if (gcashFileRef.current) gcashFileRef.current.value = '';
      if (mayaFileRef.current) mayaFileRef.current.value = '';
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      setStatus({ type: 'error', message: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b2063]"></div>
      </div>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="bm-ps-root flex-1 overflow-y-auto px-5 md:px-8 pb-8 pt-5 flex flex-col gap-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200 bg-white">
              <ChevronLeft size={18} className="text-zinc-600" />
            </button>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.02em', margin: 0 }}>Payment Settings</h2>
              <p className="bm-ps-label" style={{ marginTop: 3, marginBottom: 0 }}>Configure GCash & Maya for this branch</p>
            </div>
          </div>
          <Button 
            onClick={() => { void handleSubmit(); }} 
            disabled={saving}
            className="bg-[#3b2063] text-white hover:bg-[#2a1747] transition-all px-6"
          >
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Save size={16} className="mr-2" />}
            Save Settings
          </Button>
        </div>

        {status && (
          <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${status.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <p className="text-sm font-semibold">{status.message}</p>
            <button onClick={() => setStatus(null)} className="ml-auto p-1 hover:bg-zinc-200/50 rounded-lg transition-colors">
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* GCash Section */}
          <div className="bm-ps-card p-6 bg-white flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-200 text-blue-600">
                <Smartphone size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a0f2e', margin: 0 }}>GCash Details</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Mobile Wallet 1</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="bm-ps-label">Account Name</label>
                <input 
                  type="text" 
                  name="gcash_name" 
                  value={settings.gcash_name || ''} 
                  onChange={handleInputChange} 
                  className="bm-ps-input" 
                  placeholder="e.g. Lucky Boba Main"
                />
              </div>
              <div>
                <label className="bm-ps-label">GCash Number</label>
                <input 
                  type="text" 
                  name="gcash_number" 
                  value={settings.gcash_number || ''} 
                  onChange={handleInputChange} 
                  className="bm-ps-input" 
                  placeholder="e.g. 09123456789"
                />
              </div>
              <div>
                <label className="bm-ps-label">Payment QR Code</label>
                <input 
                  type="file" 
                  ref={gcashFileRef}
                  onChange={(e) => handleFileChange('gcash', e)} 
                  className="hidden" 
                  accept="image/*"
                />
                <button 
                  type="button"
                  onClick={() => gcashFileRef.current?.click()}
                  className="w-full"
                >
                  {previews.gcash ? (
                    <div className="relative group">
                      <img src={previews.gcash} alt="GCash QR" className="qr-preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[0.6rem] flex items-center justify-center text-white text-sm font-bold">
                        <Upload size={20} className="mr-2" /> Change Image
                      </div>
                    </div>
                  ) : (
                    <div className="qr-placeholder">
                      <ImageIcon size={32} className="mb-2 opacity-50" />
                      <span className="text-xs font-bold uppercase tracking-widest">Upload QR Code</span>
                      <span className="text-[10px] mt-1 opacity-60">JPEG, PNG up to 5MB</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Maya Section */}
          <div className="bm-ps-card p-6 bg-white flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-200 text-emerald-600">
                <Smartphone size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a0f2e', margin: 0 }}>Maya Details</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Mobile Wallet 2</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="bm-ps-label">Account Name</label>
                <input 
                  type="text" 
                  name="maya_name" 
                  value={settings.maya_name || ''} 
                  onChange={handleInputChange} 
                  className="bm-ps-input" 
                  placeholder="e.g. Lucky Boba Main"
                />
              </div>
              <div>
                <label className="bm-ps-label">Maya Number</label>
                <input 
                  type="text" 
                  name="maya_number" 
                  value={settings.maya_number || ''} 
                  onChange={handleInputChange} 
                  className="bm-ps-input" 
                  placeholder="e.g. 09123456789"
                />
              </div>
              <div>
                <label className="bm-ps-label">Payment QR Code</label>
                <input 
                  type="file" 
                  ref={mayaFileRef}
                  onChange={(e) => handleFileChange('maya', e)} 
                  className="hidden" 
                  accept="image/*"
                />
                <button 
                  type="button"
                  onClick={() => mayaFileRef.current?.click()}
                  className="w-full"
                >
                  {previews.maya ? (
                    <div className="relative group">
                      <img src={previews.maya} alt="Maya QR" className="qr-preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[0.6rem] flex items-center justify-center text-white text-sm font-bold">
                        <Upload size={20} className="mr-2" /> Change Image
                      </div>
                    </div>
                  ) : (
                    <div className="qr-placeholder">
                      <ImageIcon size={32} className="mb-2 opacity-50" />
                      <span className="text-xs font-bold uppercase tracking-widest">Upload QR Code</span>
                      <span className="text-[10px] mt-1 opacity-60">JPEG, PNG up to 5MB</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

        </form>

        <div className="bm-ps-card p-6 bg-violet-50/50 border-violet-100 text-violet-900 flex items-start gap-4">
          <AlertCircle size={20} className="shrink-0 mt-0.5 text-violet-600" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Branch Specific Payments</h4>
            <p className="text-xs leading-relaxed opacity-80">
              The details you set here will be shown to customers when they select this branch (<b>{settings.account_name || 'this branch'}</b>) in the mobile app. 
              Make sure the QR codes are clear and account numbers are correct to avoid payment issues.
            </p>
          </div>
        </div>

      </div>
    </>
  );
};

export default BM_PaymentSettings;
