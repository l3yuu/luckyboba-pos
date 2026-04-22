"use client"

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Mail, Phone, MapPin,
  ShieldCheck, AlertCircle, Activity,
  ChevronRight, Settings as SettingsIcon,
  X, Star
} from "lucide-react";
import api from "../../../services/api";
import BM_SalesSettings from "./BM_SalesSettings";
import BM_AddCustomers from "./BM_AddCustomers";
import BM_DiscountSettings from "./BM_DiscountSettings";
import BM_ExportData from "./BM_ExportData";
import BM_AddVouchers from "./BM_AddVouchers";
import { useToast } from "../../../hooks/useToast";

// ── Role-Specific UI Components (Mirrored from SuperAdmin) ──────────────

type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey = "sm" | "md" | "lg";

interface SectionHeaderProps {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, desc, action }) => (
  <div className="flex items-center justify-between mb-5">
    <div>
      <h2 className="text-base font-bold text-[#1a0f2e]">{title}</h2>
      {desc && <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>}
    </div>
    {action}
  </div>
);

interface BtnProps {
  children: React.ReactNode;
  variant?: VariantKey;
  size?: SizeKey;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const Btn: React.FC<BtnProps> = ({
  children, variant = "primary", size = "sm",
  onClick, className = "", disabled = false, type = "button",
}) => {
  const sizes: Record<SizeKey, string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary: "bg-[#6a12b8] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const ConfirmModal: React.FC<{
  title: string;
  desc: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}> = ({ title, desc, onConfirm, onCancel, isDanger }) => {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
          <div className={`w-14 h-14 border rounded-full flex items-center justify-center mb-4 ${isDanger ? 'bg-red-50 border-red-100 text-red-500' : 'bg-violet-50 border-violet-100 text-violet-500'}`}>
            <AlertCircle size={24} />
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">{title}</p>
          <p className="text-xs text-zinc-500 mt-3 leading-relaxed">{desc}</p>
        </div>
        <div className="flex items-center gap-2 px-6 pb-6 mt-2">
          <Btn variant="secondary" className="flex-1 justify-center" onClick={onCancel}>Cancel</Btn>
          <Btn variant={isDanger ? "danger" : "primary"} className="flex-1 justify-center" onClick={onConfirm}>
            {isDanger ? "Proceed" : "Confirm"}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface ActivityLog {
  action: string;
  created_at: string;
  user?: { name: string };
}

// ── Main BM_Settings Component ──────────────────────────────────────────

const BM_Settings = () => {
  const [activeSubView, setActiveSubView] = useState<string | null>(null);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; desc: string; isDanger?: boolean; onConfirm: () => void } | null>(null);
  const { showToast } = useToast();

  const [branchInfo, setBranchInfo] = useState({
    id: null as number | null,
    name: "Loading...",
    location: "Loading...",
    email: "N/A",
    phone: "N/A",
    kiosk_pin: "1234",
    kiosk_password: "luckyboba"
  });
  const [kioskPinInput, setKioskPinInput] = useState("1234");
  const [kioskPasswordInput, setKioskPasswordInput] = useState("luckyboba");
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [notifications, setNotifications] = useState(true);
  const [autoReports, setAutoReports] = useState(true);
  const [auditStats, setAuditStats] = useState({
    total_events: 0,
    today_count: 0,
    voids_today: 0
  });

  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);

  // ── Data Fetching ────────────────────────────────────────────────────────

  const fetchSettings = useCallback(async () => {
    try {
      const [userRes, auditRes] = await Promise.all([
        api.get('/user'),
        api.get('/branch/audit-logs')
      ]);

      if (userRes.data) {
        const branchData = userRes.data.branch;
        setBranchInfo({
          id: branchData?.id || null,
          name: branchData?.name || "Lucky Boba Branch",
          location: branchData?.location || "Unknown Location",
          email: userRes.data.email,
          phone: branchData?.contact ?? "N/A",
          kiosk_pin: branchData?.kiosk_pin || "1234",
          kiosk_password: branchData?.kiosk_password || "luckyboba"
        });
        setKioskPinInput(branchData?.kiosk_pin || "1234");
        setKioskPasswordInput(branchData?.kiosk_password || "luckyboba");
      }

      if (auditRes.data.success) {
        setAuditStats(auditRes.data.stats);
        setRecentLogs(auditRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load BM settings context:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = (key: 'notifications' | 'auto_reports') => {
    if (key === 'notifications') setNotifications(!notifications);
    if (key === 'auto_reports') setAutoReports(!autoReports);
    showToast('Preferences updated!');
  };

  const closeSubView = () => setActiveSubView(null);

  const saveKioskPin = async () => {
    if (!branchInfo.id) return showToast('Error: Branch ID missing', 'error');
    setIsUpdatingPin(true);
    try {
      await api.put(`/branches/${branchInfo.id}`, { kiosk_pin: kioskPinInput });
      showToast('Kiosk PIN updated successfully!');
      setBranchInfo(prev => ({ ...prev, kiosk_pin: kioskPinInput }));
    } catch (_err) {
      showToast('Failed to update Kiosk PIN. Check your connection.', 'error');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const saveKioskPassword = async () => {
    if (!branchInfo.id) return showToast('Error: Branch ID missing', 'error');
    setIsUpdatingPassword(true);
    try {
      await api.put(`/branches/${branchInfo.id}`, { kiosk_password: kioskPasswordInput });
      showToast('Kiosk Access Password updated!');
      setBranchInfo(prev => ({ ...prev, kiosk_password: kioskPasswordInput }));
    } catch (_err) {
      showToast('Failed to update Kiosk Password.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // ── Render Logic ─────────────────────────────────────────────────────────

  if (activeSubView === 'sales-settings') return <BM_SalesSettings isOpen={true} onClose={closeSubView} />;
  if (activeSubView === 'add-customers') return <BM_AddCustomers onBack={closeSubView} />;
  if (activeSubView === 'discount') return <BM_DiscountSettings onBack={closeSubView} />;
  if (activeSubView === 'export-data') return <BM_ExportData onBack={closeSubView} />;
  if (activeSubView === 'add-vouchers') return <BM_AddVouchers onBack={closeSubView} />;
  
  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4" />
        <p className="text-xs text-zinc-400 font-medium">Loading branch configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 fade-in">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
      `}</style>

      <SectionHeader title="Branch Configuration" desc="Manage local settings and diagnostic health" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column (2 spans) ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Branch General Info */}
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6 shadow-sm">
            <p className="text-sm font-bold text-[#1a0f2e] mb-4">Branch Information</p>
            <div className="flex flex-col gap-4">
              {[
                { label: "Branch Name", value: branchInfo.name, icon: <Star size={14} /> },
                { label: "Location", value: branchInfo.location, icon: <MapPin size={14} /> },
                { label: "Email", value: branchInfo.email, icon: <Mail size={14} /> },
                { label: "Contact", value: branchInfo.phone, icon: <Phone size={14} /> },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-50 border border-zinc-200 rounded-[0.4rem] flex items-center justify-center text-zinc-400 shrink-0">
                    {f.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">{f.label}</p>
                    <input
                      readOnly
                      value={f.value}
                      className="w-full text-sm font-medium text-zinc-400 bg-zinc-50 border border-zinc-100 rounded-[0.4rem] px-3 py-1.5 outline-none cursor-default"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-violet-50/50 border border-violet-100 rounded-lg">
              <p className="text-[10px] text-violet-600 font-bold uppercase tracking-wider">Note to Manager</p>
              <p className="text-[10px] text-violet-400 mt-1">To update branch profile details, please contact the SuperAdmin.</p>
            </div>

            {/* Kiosk Security Settings */}
            <div className="mt-6 pt-6 border-t border-zinc-100 flex flex-col gap-6">
              <div>
                <p className="text-sm font-bold text-[#1a0f2e] mb-1">Local Kiosk Settings PIN</p>
                <p className="text-xs text-zinc-400 mb-4">Set the 4 to 10-digit PIN required to access Kiosk settings.</p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Kiosk Admin PIN</p>
                    <input
                      type="password"
                      value={kioskPinInput}
                      onChange={e => setKioskPinInput(e.target.value)}
                      placeholder="Enter new PIN"
                      className="w-full text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-[0.4rem] px-3 py-1.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
                    />
                  </div>
                  <Btn 
                    onClick={saveKioskPin}
                    disabled={isUpdatingPin || kioskPinInput === branchInfo.kiosk_pin || kioskPinInput.length < 4}
                  >
                    {isUpdatingPin ? 'Saving...' : 'Update PIN'}
                  </Btn>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100">
                <p className="text-sm font-bold text-[#1a0f2e] mb-1">Kiosk Access Password</p>
                <p className="text-xs text-zinc-400 mb-4">Set the password required to unlock the Kiosk for customer use.</p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Access Password</p>
                    <input
                      type="password"
                      value={kioskPasswordInput}
                      onChange={e => setKioskPasswordInput(e.target.value)}
                      placeholder="Enter access password"
                      className="w-full text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-[0.4rem] px-3 py-1.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
                    />
                  </div>
                  <Btn 
                    onClick={saveKioskPassword}
                    disabled={isUpdatingPassword || kioskPasswordInput === branchInfo.kiosk_password || kioskPasswordInput.length < 4}
                  >
                    {isUpdatingPassword ? 'Saving...' : 'Update Password'}
                  </Btn>
                </div>
              </div>
            </div>
          </div>

          {/* Module Quick Actions */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6 flex flex-col justify-between hover:border-violet-200 transition-all group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-4 group-hover:scale-110 transition-transform">
                  <SettingsIcon size={20} />
                </div>
                <h3 className="text-sm font-bold text-[#1a0f2e]">Sales Config</h3>
                <p className="text-xs text-zinc-400 mt-1">System policies and operational toggles.</p>
              </div>
              <Btn variant="secondary" className="mt-6 w-full justify-center" onClick={() => setActiveSubView('sales-settings')}>
                Open Config <ChevronRight size={12} />
              </Btn>
            </div>
          </div>

          {/* Local Activity Summary */}
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-[#1a0f2e]">Recent Internal Activity</p>
              <Btn variant="ghost" size="sm" onClick={() => setIsLogOpen(true)}>View All Logs</Btn>
            </div>
            <div className="space-y-3">
              {recentLogs.slice(0, 3).map((log, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                  <Activity size={12} className="text-violet-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#1a0f2e] truncate">{log.action}</p>
                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest">{new Date(log.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              {recentLogs.length === 0 && (
                <p className="text-xs text-zinc-400 text-center py-4 italic">No recent activity detected.</p>
              )}
            </div>
          </div>

        </div>

        {/* ── Right Column ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Local Preferences */}
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <p className="text-sm font-bold text-[#1a0f2e] mb-4">Branch Preferences</p>
            <div className="flex flex-col gap-4">
              {[
                { label: "Email Notifications", desc: "Branch summary reports", on: notifications, key: 'notifications' as const },
                { label: "Auto Reports", desc: "Local Z-reading nightly", on: autoReports, key: 'auto_reports' as const },
              ].map((p) => (
                <div key={p.key} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-zinc-700">{p.label}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{p.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(p.key)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${p.on ? "bg-violet-500" : "bg-zinc-300"}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${p.on ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Branch Health Card (Mirrored from SuperAdmin) */}
          <div className="bg-gradient-to-br from-[#3b1774] via-[#1e0f3c] to-[#0d0620] rounded-[0.625rem] p-6 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/5 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full blur-[40px] -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-[40px] translate-y-10 -translate-x-10" />
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/5 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <ShieldCheck size={14} className="text-violet-200" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-white/90">Branch Health</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Status", val: "Connected", color: "text-emerald-400" },
                  { label: "Logs (Today)", val: auditStats.today_count },
                  { label: "Voids", val: auditStats.voids_today, color: auditStats.voids_today > 0 ? "text-rose-400" : "text-zinc-300" },
                  { label: "Software", val: "v2.6.0-stable" },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{r.label}</span>
                    <span className={`text-[10px] font-black ${r.color || "text-zinc-300"}`}>{r.val}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-zinc-500 font-black uppercase">Local IP Address</span>
                    <span className="text-[10px] text-violet-200 font-mono font-bold">192.168.1.101</span>
                  </div>
                  <Activity size={14} className="text-emerald-500 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {isLogOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[1.5rem] border border-zinc-200 shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center shadow-sm">
                  <Activity size={20} className="text-[#6a12b8]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1a0f2e]">Activity Log</h3>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Internal Branch History</p>
                </div>
              </div>
              <button onClick={() => setIsLogOpen(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400 hover:text-zinc-900">
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {recentLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-[1rem] bg-zinc-50/50 border border-zinc-100 hover:border-violet-200 transition-all group">
                  <Activity size={14} className="text-zinc-400 group-hover:text-violet-600" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#6a12b8]">{log.user?.name}</p>
                      <span className="text-[10px] font-bold text-zinc-400">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm font-bold text-[#1a0f2e]">{log.action}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-8 py-5 border-t border-zinc-100 bg-zinc-50/30 flex justify-end">
              <Btn onClick={() => setIsLogOpen(false)} className="rounded-xl px-8 h-11">Close</Btn>
            </div>
          </div>
        </div>
      )}

      {confirmConfig && (
        <ConfirmModal
          {...confirmConfig}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
};

export default BM_Settings;
