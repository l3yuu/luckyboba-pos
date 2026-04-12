"use client"

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Upload, 
  Smartphone, Camera 
} from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../SharedUI';

interface PaymentData {
  gcash_name: string;
  gcash_number: string;
  gcash_qr: string | null;
  maya_name: string;
  maya_number: string;
  maya_qr: string | null;
}

const BM_PaymentSettings = ({ onBack }: { onBack: () => void }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<PaymentData>({
    gcash_name: '',
    gcash_number: '',
    gcash_qr: null,
    maya_name: '',
    maya_number: '',
    maya_qr: null,
  });

  // Local state for image previews (blobs)
  const [gcashPreview, setGcashPreview] = useState<string | null>(null);
  const [mayaPreview, setMayaPreview] = useState<string | null>(null);
  
  // Files to upload
  const [gcashFile, setGcashFile] = useState<File | null>(null);
  const [mayaFile, setMayaFile] = useState<File | null>(null);

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/branch/payment-settings');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (_error) {
      showToast('Internal error fetching payment settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'gcash' | 'maya') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File too large (Max 5MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'gcash') {
        setGcashPreview(reader.result as string);
        setGcashFile(file);
      } else {
        setMayaPreview(reader.result as string);
        setMayaFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('gcash_name', data.gcash_name);
      formData.append('gcash_number', data.gcash_number);
      formData.append('maya_name', data.maya_name);
      formData.append('maya_number', data.maya_number);

      if (gcashFile) formData.append('gcash_qr', gcashFile);
      if (mayaFile) formData.append('maya_qr', mayaFile);

      const res = await api.post('/branch/payment-settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setData(res.data.data);
        setGcashFile(null);
        setMayaFile(null);
        setGcashPreview(null);
        setMayaPreview(null);
        showToast('Payment settings updated successfully', 'success');
      }
    } catch (_error) {
      showToast('Failed to update payment settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
        <div className="w-12 h-12 border-4 border-[#3b2063] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-[#3b2063]">Syncing Branch Config...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#fafafa] overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 bg-white border-b border-zinc-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-xl hover:bg-zinc-50 border border-zinc-100 flex items-center justify-center transition-all text-zinc-400 hover:text-zinc-900">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg font-black text-[#1a0f2e]">Payment & QR Settings</h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Digital Wallet Integration</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl h-11 px-8 gap-2 bg-[#3b2063] shadow-lg shadow-violet-100">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
          Save Configuration
        </Button>
      </div>

      <div className="p-8 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
        
        {/* GCash Section */}
        <div className="bg-white border border-zinc-200 rounded-[1.5rem] p-8 flex flex-col gap-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 border-b border-zinc-50 pb-6">
            <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <Smartphone size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1a0f2e]">GCash</h3>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Primary Digital Wallet</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Account Name</label>
              <input 
                type="text" 
                value={data.gcash_name || ''} 
                onChange={e => setData({...data, gcash_name: e.target.value})}
                placeholder="e.g. Lucky Boba Sangandaan"
                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:border-blue-400 focus:bg-white transition-all font-bold text-[#1a0f2e]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Mobile Number</label>
              <input 
                type="text" 
                value={data.gcash_number || ''} 
                onChange={e => setData({...data, gcash_number: e.target.value})}
                placeholder="09XX XXX XXXX"
                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:border-blue-400 focus:bg-white transition-all font-bold text-[#1a0f2e] tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">GCash QR Code</p>
            <div className="relative aspect-square w-full max-w-[200px] mx-auto bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-3 group hover:border-blue-400 transition-all">
              {gcashPreview || data.gcash_qr ? (
                <>
                  <img src={gcashPreview || data.gcash_qr!} alt="GCash QR" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="p-3 bg-white rounded-2xl cursor-pointer hover:scale-110 transition-transform">
                      <Camera size={20} className="text-blue-600" />
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'gcash')} />
                    </label>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-all border border-zinc-100">
                    <Upload size={20} className="text-zinc-400 group-hover:text-blue-600" />
                  </div>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Upload QR Image</span>
                  <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'gcash')} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Maya Section */}
        <div className="bg-white border border-zinc-200 rounded-[1.5rem] p-8 flex flex-col gap-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 border-b border-zinc-50 pb-6">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <Smartphone size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1a0f2e]">Maya</h3>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Secondary Digital Wallet</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Account Name</label>
              <input 
                type="text" 
                value={data.maya_name || ''} 
                onChange={e => setData({...data, maya_name: e.target.value})}
                placeholder="e.g. Lucky Boba Sangandaan"
                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:border-emerald-400 focus:bg-white transition-all font-bold text-[#1a0f2e]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Mobile Number</label>
              <input 
                type="text" 
                value={data.maya_number || ''} 
                onChange={e => setData({...data, maya_number: e.target.value})}
                placeholder="09XX XXX XXXX"
                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:border-emerald-400 focus:bg-white transition-all font-bold text-[#1a0f2e] tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Maya QR Code</p>
            <div className="relative aspect-square w-full max-w-[200px] mx-auto bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-3 group hover:border-emerald-400 transition-all">
              {mayaPreview || data.maya_qr ? (
                <>
                  <img src={mayaPreview || data.maya_qr!} alt="Maya QR" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="p-3 bg-white rounded-2xl cursor-pointer hover:scale-110 transition-transform">
                      <Camera size={20} className="text-emerald-600" />
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'maya')} />
                    </label>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-all border border-zinc-100">
                    <Upload size={20} className="text-zinc-400 group-hover:text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Upload QR Image</span>
                  <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'maya')} />
                </label>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BM_PaymentSettings;
