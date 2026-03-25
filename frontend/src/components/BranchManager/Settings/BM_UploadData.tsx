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

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bm-root, .bm-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
`;

interface PreviewData  { name: string; amount: string; status: string; type: string; }
interface ExcelRow     { name?: string; amount?: string | number; status?: string; type?: string; }
interface SummaryData  { success: number; failed: number; errorDetails: string[]; }
interface ImportHistory { id: number; action: string; created_at: string; ip_address: string; }

const BM_UploadData = ({ onBack }: { onBack: () => void }) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab]       = useState<'upload' | 'history'>('upload');
  const [isUploading, setIsUploading]   = useState(false);
  const [isDragging, setIsDragging]     = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview]           = useState<PreviewData[]>([]);
  const [summary, setSummary]           = useState<SummaryData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory]               = useState<ImportHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const response = await api.get('/system/import-history');
      setHistory(response.data);
    } catch {
      showToast('Could not load history', 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchHistory]);

  const processFile = (file: File) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    if (!validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      showToast('Invalid file type. Please use CSV or Excel.', 'error');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook  = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData  = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);
        setPreview(jsonData.map(row => ({
          name:   row.name   || 'N/A',
          amount: String(row.amount || '0'),
          status: row.status || 'ON',
          type:   row.type   || 'Global-Percent',
        })));
      } catch (error) {
        console.error('Parsing Error:', error);
        showToast('Failed to parse spreadsheet structure', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange  = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) processFile(f); };
  const handleDragOver    = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!selectedFile) setIsDragging(true); };
  const handleDragLeave   = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop        = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (selectedFile) return;
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const handleClear = () => {
    setSelectedFile(null); setPreview([]); setSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Selection cleared', 'warning');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    setIsUploading(true);
    try {
      const response = await api.post('/system/upload-discounts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSummary({
        success:      response.data.success_count || 0,
        failed:       response.data.error_count   || 0,
        errorDetails: response.data.errors        || [],
      });
      setSelectedFile(null); setPreview([]);
      showToast('Import finished', 'success');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      showToast(axiosError.response?.data?.message || 'Critical upload failure', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob(
      ["name,amount,status,type\nWINTER_PROMO,10.00,ON,Global-Percent\nSUMMER_DEAL,5.00,OFF,Item-Amount"],
      { type: 'text/csv' }
    );
    const url = window.URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = 'discounts_template.csv'; a.click();
    window.URL.revokeObjectURL(url);
    showToast('Template downloaded', 'success');
  };

  const downloadErrorLog = () => {
    if (!summary || summary.errorDetails.length === 0) return;
    const blob = new Blob(["Error Report - Discount Import\n" + summary.errorDetails.join('\n')], { type: 'text/plain' });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `error_log_${Date.now()}.txt`; a.click();
    window.URL.revokeObjectURL(url);
  };

  const btnPrimary = {
    cls:   'flex items-center gap-2 h-9 px-5 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all rounded-xl active:scale-[0.98] disabled:opacity-50 shadow-sm',
    style: { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' } as React.CSSProperties,
  };
  const btnOutline = {
    cls:   'flex items-center gap-2 h-9 px-5 bg-white border border-gray-100 hover:border-[#ddd6f7] text-[#3b2063] transition-all rounded-xl active:scale-[0.98]',
    style: { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' } as React.CSSProperties,
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="bm-root flex-1 bg-[#f5f4f8] h-full flex flex-col overflow-hidden">

        {/* ── Tab bar ── */}
        <div className="px-5 md:px-8 pt-5 flex gap-1 bg-[#f5f4f8]">
          {(['upload', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2.5 rounded-t-xl transition-all"
              style={{
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                background: activeTab === tab ? '#fff' : 'transparent',
                color:      activeTab === tab ? '#1a0f2e' : '#a1a1aa',
                borderBottom: activeTab === tab ? '2px solid #3b2063' : '2px solid transparent',
              }}
            >
              {tab === 'upload' ? 'Upload New' : 'Import History'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 flex flex-col gap-5">

          {activeTab === 'upload' ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">

              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Settings</p>
                  <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0, marginTop: 2 }}>
                    Bulk Import
                  </h1>
                </div>
                <button onClick={downloadTemplate} className={btnPrimary.cls} style={btnPrimary.style}>
                  <Download size={13} strokeWidth={2.5} /> Download Template
                </button>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                className={`bg-white border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 transition-all duration-200 ${
                  selectedFile
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : isDragging
                      ? 'border-[#3b2063] bg-[#faf9ff] scale-[1.01] shadow-md'
                      : 'border-gray-200 hover:border-[#ddd6f7] cursor-pointer'
                }`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv, .xlsx, .xls" />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <CheckCircle size={24} className="text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a0f2e' }}>{selectedFile.name}</p>
                      <button
                        onClick={e => { e.stopPropagation(); handleClear(); }}
                        className="mt-2 flex items-center gap-1 mx-auto text-red-400 hover:text-red-600 transition-colors"
                        style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}
                      >
                        <RotateCcw size={11} strokeWidth={2.5} /> Remove file
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                      isDragging ? 'bg-[#ede9fe] text-[#3b2063]' : 'bg-gray-50 text-gray-300'
                    }`}>
                      <Upload size={28} strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: isDragging ? '#3b2063' : '#71717a' }}>
                        {isDragging ? 'Drop file here' : 'Select or drag a spreadsheet'}
                      </p>
                      <p className="bm-label mt-1" style={{ color: '#d4d4d8' }}>Supports CSV, XLSX, XLS</p>
                    </div>
                  </>
                )}
              </div>

              {/* Preview table */}
              {preview.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm animate-in zoom-in-95 duration-200">
                  <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={13} strokeWidth={2.5} className="text-amber-400" />
                      <span className="bm-label" style={{ color: '#a1a1aa' }}>Preview — {preview.length} rows</span>
                    </div>
                    <button onClick={handleClear}
                      className="bm-label hover:text-red-500 transition-colors" style={{ color: '#d4d4d8' }}>
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-white border-b border-gray-100">
                        <tr>
                          {['Name', 'Amount', 'Status', 'Type'].map((h, i) => (
                            <th key={h} className={`px-5 py-2.5 ${i === 3 ? 'text-right' : ''}`}>
                              <span className="bm-label" style={{ color: '#a1a1aa' }}>{h}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, idx) => (
                          <tr key={idx} className="border-t border-gray-50 hover:bg-[#faf9ff] transition-colors">
                            <td className="px-5 py-2.5" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3b2063' }}>{row.name}</td>
                            <td className="px-5 py-2.5" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a0f2e' }}>{row.amount}</td>
                            <td className="px-5 py-2.5">
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border"
                                style={{
                                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                                  background:   row.status === 'ON' ? '#f0fdf4' : '#fef2f2',
                                  color:        row.status === 'ON' ? '#16a34a' : '#dc2626',
                                  borderColor:  row.status === 'ON' ? '#bbf7d0' : '#fecaca',
                                }}>
                                <span className={`w-1 h-1 rounded-full ${row.status === 'ON' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                {row.status}
                              </span>
                            </td>
                            <td className="px-5 py-2.5 text-right" style={{ fontSize: '0.78rem', fontWeight: 500, color: '#a1a1aa' }}>{row.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <p className="bm-label" style={{ color: '#a1a1aa' }}>Settings</p>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0, marginTop: 2 }}>
                  Import History
                </h1>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-3.5 border-b border-gray-50 flex items-center gap-2">
                  <History size={13} strokeWidth={2.5} className="text-[#3b2063]" />
                  <span className="bm-label" style={{ color: '#a1a1aa' }}>System Import Logs</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-gray-100">
                    <tr>
                      {['Date & Time', 'Activity', 'IP Address'].map((h, i) => (
                        <th key={h} className={`px-6 py-3.5 ${i === 2 ? 'text-right' : ''}`}>
                          <span className="bm-label" style={{ color: '#a1a1aa' }}>{h}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingHistory ? (
                      <tr>
                        <td colSpan={3} className="p-12 text-center">
                          <Loader2 className="animate-spin mx-auto text-[#3b2063]" size={24} />
                        </td>
                      </tr>
                    ) : history.length > 0 ? history.map(log => (
                      <tr key={log.id} className="border-t border-gray-50 hover:bg-[#faf9ff] transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <Calendar size={12} strokeWidth={2} className="text-zinc-300 shrink-0" />
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#71717a' }}>
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a0f2e' }}>
                          {log.action}
                        </td>
                        <td className="px-6 py-3.5 text-right" style={{ fontSize: '0.78rem', fontWeight: 500, color: '#a1a1aa', fontFamily: 'monospace' }}>
                          {log.ip_address}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                              <History size={18} strokeWidth={1.5} className="text-gray-300" />
                            </div>
                            <p className="bm-label" style={{ color: '#d4d4d8' }}>No import records found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Action bar ── */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            {activeTab === 'upload' && (
              <button
                onClick={handleUpload}
                disabled={isUploading || !selectedFile}
                className={btnPrimary.cls}
                style={btnPrimary.style}
              >
                {isUploading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={13} strokeWidth={2.5} />}
                {isUploading ? 'Importing…' : 'Confirm & Process'}
              </button>
            )}
            <button onClick={onBack} className={btnOutline.cls} style={btnOutline.style}>
              <ArrowLeft size={13} strokeWidth={2.5} /> Back
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Modal ── */}
      {summary && (
        <div className="fixed inset-0 z-150 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={15} strokeWidth={2.5} className="text-[#3b2063]" />
                <div>
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Settings</p>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0, marginTop: 2 }}>
                    Import Summary
                  </h2>
                </div>
              </div>
              <button onClick={() => setSummary(null)}
                className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={14} />
              </button>
            </div>

            <div className="p-7 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: '#16a34a', letterSpacing: '-0.04em', lineHeight: 1 }}>{summary.success}</p>
                  <p className="bm-label mt-2" style={{ color: '#86efac' }}>Successful</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: '#dc2626', letterSpacing: '-0.04em', lineHeight: 1 }}>{summary.failed}</p>
                  <p className="bm-label mt-2" style={{ color: '#fca5a5' }}>Failed</p>
                </div>
              </div>

              {summary.errorDetails.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Error Logs</p>
                    <button onClick={downloadErrorLog}
                      className="flex items-center gap-1 text-[#3b2063] hover:underline transition-colors"
                      style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      <FileWarning size={11} strokeWidth={2.5} /> Download Log
                    </button>
                  </div>
                  <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1">
                    {summary.errorDetails.map((err, i) => (
                      <p key={i} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', lineHeight: 1.4 }}>• {err}</p>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setSummary(null)}
                className="w-full h-10 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all rounded-xl active:scale-[0.98]"
                style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BM_UploadData;