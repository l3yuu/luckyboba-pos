"use client"

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, Upload, Loader2, Download, 
  CheckCircle, AlertCircle, RotateCcw, X, ClipboardCheck, 
  FileWarning, History, Calendar 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { AxiosError } from 'axios';

// --- Interfaces ---
interface PreviewData {
  name: string;
  amount: string;
  status: string;
  type: string;
}

interface ExcelRow {
  name?: string;
  amount?: string | number;
  status?: string;
  type?: string;
}

interface SummaryData {
  success: number;
  failed: number;
  errorDetails: string[];
}

interface ImportHistory {
  id: number;
  action: string;
  created_at: string;
  ip_address: string;
}

const UploadData = ({ onBack }: { onBack: () => void }) => {
  const { showToast } = useToast();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');

  // Upload & Preview States
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // New: Track drag state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History State
  const [history, setHistory] = useState<ImportHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // --- Functions: History ---

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const response = await api.get('/system/import-history');
      setHistory(response.data);
    } catch {
      showToast("Could not load history", "error");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  // --- Functions: File Handling ---

  const processFile = (file: File) => {
    // Basic validation for file types
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      showToast("Invalid file type. Please use CSV or Excel.", "error");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

        const parsedData = jsonData.map((row) => ({
          name: row.name || 'N/A',
          amount: String(row.amount || '0'),
          status: row.status || 'ON',
          type: row.type || 'Global-Percent'
        }));

        setPreview(parsedData);
      } catch (error) {
        console.error("Parsing Error:", error);
        showToast("Failed to parse spreadsheet structure", "error");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // --- Drag and Drop Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedFile) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (selectedFile) return; // Prevent dropping if a file is already selected

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview([]);
    setSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast("Selection cleared", "warning");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);

    setIsUploading(true);
    try {
      const response = await api.post('/system/upload-discounts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSummary({
        success: response.data.success_count || 0,
        failed: response.data.error_count || 0,
        errorDetails: response.data.errors || []
      });
      
      setSelectedFile(null);
      setPreview([]);
      showToast("Import finished", "success");
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMsg = axiosError.response?.data?.message || "Critical upload failure";
      showToast(errorMsg, "error");
    } finally {
      setIsUploading(false);
    }
  };

  // --- Utils ---
  const downloadTemplate = () => {
    const headers = "name,amount,status,type\n";
    const sampleData = "WINTER_PROMO,10.00,ON,Global-Percent\nSUMMER_DEAL,5.00,OFF,Item-Amount";
    const blob = new Blob([headers + sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'discounts_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    showToast("Template downloaded", "success");
  };

  const downloadErrorLog = () => {
    if (!summary || summary.errorDetails.length === 0) return;
    const logContent = "Error Report - Discount Import\n" + summary.errorDetails.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error_log_${new Date().getTime()}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col font-sans overflow-hidden">
      <div className="px-6 pt-6 flex gap-4 border-b border-zinc-200 bg-white">
        <button 
          onClick={() => setActiveTab('upload')}
          className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'upload' ? 'border-b-2 border-[#3b2063] text-[#3b2063]' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Upload New
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'history' ? 'border-b-2 border-[#3b2063] text-[#3b2063]' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Import History
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6 overflow-y-auto">
        {activeTab === 'upload' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Bulk Import</h1>
              <button 
                onClick={downloadTemplate} 
                className="h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm flex items-center justify-center gap-2 px-6"
              >
                <Download size={14} /> Download Template
              </button>
            </div>
            
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              className={`bg-white p-12 rounded-[0.625rem] border-2 border-dashed transition-all duration-200 ${
                selectedFile 
                  ? 'border-emerald-400 bg-emerald-50/20' 
                  : isDragging 
                    ? 'border-blue-500 bg-blue-50 scale-[1.01] shadow-md' 
                    : 'border-zinc-200 hover:border-blue-400 cursor-pointer'
              } flex flex-col items-center gap-4`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".csv, .xlsx, .xls" 
              />
              
              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle size={40} className="text-emerald-500 animate-in zoom-in" />
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-700 uppercase">{selectedFile.name}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleClear(); }}
                      className="mt-3 text-[10px] font-black text-red-500 uppercase flex items-center gap-1 mx-auto hover:text-red-700"
                    >
                      <RotateCcw size={12} /> Remove file
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-zinc-50 text-zinc-300'}`}>
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">
                      {isDragging ? 'Drop file here' : 'Select or Drag Spreadsheet'}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter italic">Supports CSV, XLSX, and XLS</p>
                  </div>
                </>
              )}
            </div>

            {preview.length > 0 && (
              <div className="bg-white rounded-[0.625rem] border border-zinc-200 overflow-hidden shadow-sm animate-in zoom-in-95">
                <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-orange-500" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Preview ({preview.length} rows)</span>
                  </div>
                  <button onClick={handleClear} className="text-[9px] font-black text-zinc-400 hover:text-red-500 uppercase transition-colors">Clear All</button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white shadow-sm">
                      <tr className="border-b border-zinc-100">
                        <th className="px-4 py-2 text-[9px] font-black text-zinc-400 uppercase">Name</th>
                        <th className="px-4 py-2 text-[9px] font-black text-zinc-400 uppercase">Amt</th>
                        <th className="px-4 py-2 text-[9px] font-black text-zinc-400 uppercase">Status</th>
                        <th className="px-4 py-2 text-[9px] font-black text-zinc-400 uppercase text-right">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {preview.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50">
                          <td className="px-4 py-2 text-[10px] font-bold text-[#3b2063] uppercase tracking-tighter">{row.name}</td>
                          <td className="px-4 py-2 text-[10px] font-bold text-slate-600">{row.amount}</td>
                          <td className={`px-4 py-2 text-[10px] font-black uppercase ${row.status === 'ON' ? 'text-emerald-600' : 'text-red-500'}`}>{row.status}</td>
                          <td className="px-4 py-2 text-[10px] font-bold text-zinc-400 italic text-right">{row.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest flex items-center gap-2">
              <History size={20} /> System Import Logs
            </h1>

            <div className="bg-white rounded-[0.625rem] border border-zinc-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date & Time</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Activity</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {isLoadingHistory ? (
                      <tr><td colSpan={3} className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-[#3b2063]" /></td></tr>
                    ) : history.length > 0 ? history.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-2 text-[11px] font-bold text-slate-500">
                          <Calendar size={12} /> {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-[11px] font-black text-[#3b2063] uppercase tracking-tighter">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-zinc-400 text-right italic">
                          {log.ip_address}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="p-12 text-center text-xs font-bold text-zinc-400 uppercase">No import records found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-zinc-100">
          {activeTab === 'upload' && (
            <button 
              onClick={handleUpload} 
              disabled={isUploading || !selectedFile} 
              className="h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm flex items-center justify-center gap-2 px-6 disabled:opacity-50"
            >
              {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {isUploading ? 'Importing...' : 'Confirm & Process'}
            </button>
          )}
          <button onClick={onBack} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm flex items-center justify-center gap-2 px-6">
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>

      {summary && (
        <div className="fixed inset-0 z-150 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[0.625rem] shadow-2xl overflow-hidden">
            <div className="bg-[#3b2063] p-4 flex justify-between items-center text-white">
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <ClipboardCheck size={14} /> Import Summary
              </span>
              <button onClick={() => setSummary(null)}><X size={18} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-[0.625rem] border border-emerald-100 text-center">
                  <p className="text-2xl font-black text-emerald-600">{summary.success}</p>
                  <p className="text-[9px] font-black text-emerald-400 uppercase">Successful</p>
                </div>
                <div className="bg-red-50 p-4 rounded-[0.625rem] border border-red-100 text-center">
                  <p className="text-2xl font-black text-red-600">{summary.failed}</p>
                  <p className="text-[9px] font-black text-red-400 uppercase">Failed</p>
                </div>
              </div>

              {summary.errorDetails.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Error Logs</p>
                    <button 
                      onClick={downloadErrorLog}
                      className="text-[9px] font-black text-blue-600 uppercase hover:underline flex items-center gap-1"
                    >
                      <FileWarning size={10} /> Download Log
                    </button>
                  </div>
                  <div className="max-h-32 overflow-y-auto bg-zinc-50 rounded-[0.625rem] p-3 border border-zinc-200">
                    {summary.errorDetails.map((err, i) => (
                      <p key={i} className="text-[10px] font-bold text-red-500 mb-1 leading-tight">• {err}</p>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={() => setSummary(null)}
                className="w-full h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm flex items-center justify-center gap-2"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadData;
