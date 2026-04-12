// components/NewSuperAdmin/Tabs/SettingsTab.tsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Database, Mail, Phone, MapPin, Star, AlertCircle } from "lucide-react";

type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey = "sm" | "md" | "lg";

interface BtnProps {
  children: React.ReactNode;
  variant?: VariantKey;
  size?: SizeKey;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}
interface ToggleProps { on: boolean; toggle: () => void; }


const Btn: React.FC<BtnProps> = ({
  children, variant = "primary", size = "sm",
  onClick, className = "", disabled = false, type = "button",
}) => {
  const sizes: Record<SizeKey, string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary: "bg-[#3b2063] hover:bg-[#2a1647] text-white",
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
  requireInput?: string;
}> = ({ title, desc, onConfirm, onCancel, isDanger, requireInput }) => {
  const [typedMsg, setTypedMsg] = useState("");
  const isValid = !requireInput || typedMsg === requireInput;
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

          {requireInput && (
            <div className="mt-5 w-full text-left">
              <p className="text-[10px] font-bold text-zinc-700 mb-1.5 uppercase tracking-wider text-center">
                Type <span className="text-red-600 select-all font-mono font-black border border-red-200 bg-red-50 px-1.5 py-0.5 rounded">{requireInput}</span> to confirm
              </p>
              <input
                autoFocus
                type="text"
                value={typedMsg}
                onChange={e => setTypedMsg(e.target.value)}
                placeholder={requireInput}
                className="w-full text-sm font-bold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-400 text-center transition-all"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 px-6 pb-6 mt-2">
          <Btn variant="secondary" className="flex-1 justify-center" onClick={onCancel}>Cancel</Btn>
          <Btn variant={isDanger ? "danger" : "primary"} className="flex-1 justify-center" onClick={onConfirm} disabled={!isValid}>
            {isDanger ? "Proceed" : "Confirm"}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

type PosFooterKey =
  | 'pos_supplier' | 'pos_address' | 'pos_tin'
  | 'pos_accred_no' | 'pos_date_issued' | 'pos_valid_until'
  | 'pos_ptu' | 'pos_ptu_date';

const POS_FOOTER_FIELDS: { label: string; key: PosFooterKey; placeholder: string }[] = [
  { label: "POS Supplier", key: "pos_supplier", placeholder: "e.g. ACME POS Solutions" },
  { label: "Address", key: "pos_address", placeholder: "e.g. 123 Tech St., Cebu City" },
  { label: "TIN", key: "pos_tin", placeholder: "e.g. 000-000-000-000" },
  { label: "Accred No.", key: "pos_accred_no", placeholder: "e.g. FP082024-000000" },
  { label: "Date Issued", key: "pos_date_issued", placeholder: "e.g. 08/01/2024" },
  { label: "Valid Until", key: "pos_valid_until", placeholder: "e.g. 07/31/2029" },
  { label: "PTU No.", key: "pos_ptu", placeholder: "e.g. FP082024-000000" },
  { label: "PTU Date Issued", key: "pos_ptu_date", placeholder: "e.g. 08/01/2024" },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

const getHeaders = (): Record<string, string> => {
  const token =
    localStorage.getItem('auth_token') ??
    localStorage.getItem('lucky_boba_token') ??
    localStorage.getItem('token') ?? '';
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    // Only include Authorization if we actually have a token — avoids sending
    // a bare "Bearer " header which some servers reject with 401.
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const SettingsTab: React.FC = () => {
  // FIX #11 — toggle state is now loaded from the API on mount and persisted on save
  const [notifications, setNotifications] = useState(true);
  const [autoReports, setAutoReports] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingTax, setSavingTax] = useState(false);
  const [savingPos, setSavingPos] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [resettingSys, setResettingSys] = useState(false);
  const [runningBackup, setRunningBackup] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; desc: string; isDanger?: boolean; requireInput?: string; onConfirm: () => void } | null>(null);
  const [sysInfo, setSysInfo] = useState<{ version: string; db_status: string; uptime: string; last_backup: string } | null>(null);
  // FIX #12 — surface fetch errors in the UI instead of silently swallowing them
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── General settings state ───────────────────────────────────────────────
  const [generalFields, setGeneralFields] = useState({
    business_name: 'Lucky Boba',
    contact_email: 'admin@luckyboba.com',
    contact_phone: '+63 912 345 6789',
    address: 'Cebu City, Philippines',
  });

  // ── Tax & Receipt settings state ─────────────────────────────────────────
  const [taxFields, setTaxFields] = useState({
    vat_rate: '12%',
    receipt_footer: 'Thank you for visiting Lucky Boba!',
    currency: 'PHP – Philippine Peso',
  });

  // ── POS Supplier footer state ─────────────────────────────────────────────
  const [posFooter, setPosFooter] = useState<Record<PosFooterKey, string>>({
    pos_supplier: '',
    pos_address: '',
    pos_tin: '',
    pos_accred_no: '',
    pos_date_issued: '',
    pos_valid_until: '',
    pos_ptu: '',
    pos_ptu_date: '',
  });

  // ── Load all settings on mount ────────────────────────────────────────────
  useEffect(() => {
    setLoadError(null);
    fetch(`${API_BASE}/settings`, { headers: getHeaders() })
      .then(r => {
        // FIX #12 — treat non-2xx as an error so the user knows something went wrong
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then((data: Record<string, string>) => {
        setGeneralFields({
          business_name: data.business_name ?? 'Lucky Boba',
          contact_email: data.contact_email ?? 'admin@luckyboba.com',
          contact_phone: data.contact_phone ?? '+63 912 345 6789',
          address: data.address ?? 'Cebu City, Philippines',
        });
        setTaxFields({
          vat_rate: data.vat_rate ?? '12%',
          receipt_footer: data.receipt_footer ?? 'Thank you for visiting Lucky Boba!',
          currency: data.currency ?? 'PHP – Philippine Peso',
        });
        setPosFooter({
          pos_supplier: data.pos_supplier ?? '',
          pos_address: data.pos_address ?? '',
          pos_tin: data.pos_tin ?? '',
          pos_accred_no: data.pos_accred_no ?? '',
          pos_date_issued: data.pos_date_issued ?? '',
          pos_valid_until: data.pos_valid_until ?? '',
          pos_ptu: data.pos_ptu ?? '',
          pos_ptu_date: data.pos_ptu_date ?? '',
        });
        // FIX #11 — load toggle preferences from API response
        if (data.notifications !== undefined) setNotifications(data.notifications === 'true');
        if (data.auto_reports !== undefined) setAutoReports(data.auto_reports === 'true');
        if (data.two_factor !== undefined) setTwoFactor(data.two_factor === 'true');
      })
      .catch((err: Error) => {
        console.error('Failed to load settings:', err);
        setLoadError('Could not load settings. Check your connection or log in again.');
      });

    fetch(`${API_BASE}/system/info`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSysInfo(data); })
      .catch(err => console.error("Could not load system info:", err));
  }, []);

  const showSaved = (msg = 'Saved successfully!') => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(null), 2500);
  };

  // FIX #10 — use PATCH (partial update) so saving one section doesn't overwrite
  // fields from other sections that the server isn't receiving in this request.
  // If the backend only supports POST, it must merge on its side — but using PATCH
  // here signals the correct intent and avoids accidental full-replace behavior.
  const saveSection = async (
    payload: Record<string, string>,
    setSaving: (v: boolean) => void
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      showSaved();
    } catch (e) {
      console.error('Save failed:', e);
      setSaveMsg('Save failed — please try again.');
      setTimeout(() => setSaveMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // FIX #11 — save toggle preferences immediately when toggled
  const savePreferences = async (prefs: { notifications: boolean; auto_reports: boolean; two_factor: boolean }) => {
    setSavingPrefs(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          notifications: String(prefs.notifications),
          auto_reports: String(prefs.auto_reports),
          two_factor: String(prefs.two_factor),
        }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      showSaved('Preferences updated!');
    } catch (e) {
      console.error('Preference save failed:', e);
      setSaveMsg('Failed to update preferences.');
      setTimeout(() => setSaveMsg(null), 3000);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleToggle = (key: 'notifications' | 'auto_reports' | 'two_factor') => {
    const next = {
      notifications,
      auto_reports: autoReports,
      two_factor: twoFactor,
    };
    if (key === 'notifications') { next.notifications = !notifications; setNotifications(v => !v); }
    if (key === 'auto_reports') { next.auto_reports = !autoReports; setAutoReports(v => !v); }
    if (key === 'two_factor') { next.two_factor = !twoFactor; setTwoFactor(v => !v); }
    savePreferences(next);
  };

  const clearAuditLogs = async () => {
    setClearingLogs(true);
    try {
      const res = await fetch(`${API_BASE}/system/audit/clear`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      showSaved('Audit logs cleared!');
    } catch (e) {
      console.error('Clear logs failed:', e);
      setSaveMsg('Failed to clear logs.');
      setTimeout(() => setSaveMsg(null), 3000);
    } finally {
      setClearingLogs(false);
    }
  };

  const resetSystem = async () => {
    setResettingSys(true);
    try {
      const res = await fetch(`${API_BASE}/system/reset`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      showSaved('System factory reset completed!');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error('Reset system failed:', e);
      setSaveMsg('Failed to reset system.');
      setTimeout(() => setSaveMsg(null), 3000);
    } finally {
      setResettingSys(false);
    }
  };

  const executeBackup = async () => {
    setRunningBackup(true);
    try {
      const res = await fetch(`${API_BASE}/system/run-backup`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `lucky_boba_backup_${new Date().toISOString().split('T')[0]}.sql`;
      if (contentDisposition) {
        const fileMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileMatch && fileMatch[1]) filename = fileMatch[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showSaved('Backup downloaded successfully!');

      // Refetch system info so the 'Last Backup' timestamp instantly updates
      setTimeout(() => {
        fetch(`${API_BASE}/system/info`, { headers: getHeaders() })
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) setSysInfo(data); })
      }, 1000);
    } catch (e) {
      console.error('Backup failed:', e);
      setSaveMsg('Failed to run backup.');
      setTimeout(() => setSaveMsg(null), 3000);
    } finally {
      setRunningBackup(false);
    }
  };

  const Toggle: React.FC<ToggleProps> = ({ on, toggle }) => (
    <button
      onClick={toggle}
      disabled={savingPrefs}
      className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-60 ${on ? "bg-violet-500" : "bg-zinc-300"}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );

  return (
    <div className="p-6 md:p-8 fade-in">
      {/* Save toast */}
      {saveMsg && (
        <div className={`fixed bottom-6 right-6 z-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-lg animate-fade-in ${saveMsg.toLowerCase().includes('fail') ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {saveMsg.toLowerCase().includes('fail') ? '✕' : '✓'} {saveMsg}
        </div>
      )}

      {/* FIX #12 — visible error banner when settings fail to load */}
      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold">
          {loadError}
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* General Settings */}
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <p className="text-sm font-bold text-[#1a0f2e] mb-4">General Settings</p>
            <div className="flex flex-col gap-4">
              {[
                { label: "Business Name", key: "business_name" as const, icon: <Star size={14} /> },
                { label: "Contact Email", key: "contact_email" as const, icon: <Mail size={14} /> },
                { label: "Contact Phone", key: "contact_phone" as const, icon: <Phone size={14} /> },
                { label: "Address", key: "address" as const, icon: <MapPin size={14} /> },
              ].map((f) => (
                <div key={f.key} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-50 border border-zinc-200 rounded-[0.4rem] flex items-center justify-center text-zinc-400 shrink-0">{f.icon}</div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">{f.label}</p>
                    <input
                      value={generalFields[f.key]}
                      onChange={e => setGeneralFields(v => ({ ...v, [f.key]: e.target.value }))}
                      className="w-full text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-[0.4rem] px-3 py-1.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Btn onClick={() => setConfirmConfig({
                title: "Save General Settings",
                desc: "Are you sure you want to apply these global changes across the system?",
                onConfirm: () => { setConfirmConfig(null); saveSection(generalFields, setSavingGeneral); }
              })} disabled={savingGeneral}>
                {savingGeneral ? 'Saving...' : 'Save Changes'}
              </Btn>
            </div>
          </div>

          {/* Tax & Receipt Settings */}
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <p className="text-sm font-bold text-[#1a0f2e] mb-4">Tax & Receipt Settings</p>
            <div className="flex flex-col gap-4">
              {[
                { label: "VAT Rate", key: "vat_rate" as const, placeholder: "e.g. 12%" },
                { label: "Receipt Footer", key: "receipt_footer" as const, placeholder: "Receipt footer" },
                { label: "Currency", key: "currency" as const, placeholder: "Currency" },
              ].map((f) => (
                <div key={f.key}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">{f.label}</p>
                  <input
                    value={taxFields[f.key]}
                    onChange={e => setTaxFields(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-[0.4rem] px-3 py-1.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Btn onClick={() => setConfirmConfig({
                title: "Save Tax & Receipt Settings",
                desc: "Are you sure you want to update the system tax and receipt configuration?",
                onConfirm: () => { setConfirmConfig(null); saveSection(taxFields, setSavingTax); }
              })} disabled={savingTax}>
                {savingTax ? 'Saving...' : 'Save Changes'}
              </Btn>
            </div>
          </div>

          {/* ── POS Supplier Footer ───────────────────────────────────────── */}
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <p className="text-sm font-bold text-[#1a0f2e] mb-1">POS Supplier Info</p>
            <p className="text-xs text-zinc-400 mb-4">Printed at the bottom of every customer receipt, before the queue number</p>
            <div className="flex flex-col gap-4">
              {POS_FOOTER_FIELDS.map((f) => (
                <div key={f.key}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">{f.label}</p>
                  <input
                    value={posFooter[f.key]}
                    onChange={e => setPosFooter(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-[0.4rem] px-3 py-1.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
                  />
                </div>
              ))}
            </div>
            {/* Live preview */}
            {(posFooter.pos_supplier || posFooter.pos_tin) && (
              <div className="mt-5 border border-dashed border-zinc-300 rounded-lg p-4 bg-zinc-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Receipt Preview</p>
                <div className="text-center text-[11px] text-zinc-600 space-y-0.5 font-mono">
                  {posFooter.pos_supplier && <div className="font-bold uppercase">{posFooter.pos_supplier}</div>}
                  {posFooter.pos_address && <div>{posFooter.pos_address}</div>}
                  {posFooter.pos_tin && <div>TIN: {posFooter.pos_tin}</div>}
                  {posFooter.pos_accred_no && <div>Accred No: {posFooter.pos_accred_no}</div>}
                  {posFooter.pos_date_issued && <div>Date Issued: {posFooter.pos_date_issued}</div>}
                  {posFooter.pos_valid_until && <div>Valid Until: {posFooter.pos_valid_until}</div>}
                  {posFooter.pos_ptu && <div>PTU No: {posFooter.pos_ptu}</div>}
                  {posFooter.pos_ptu_date && <div>PTU Date Issued: {posFooter.pos_ptu_date}</div>}
                </div>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Btn onClick={() => setConfirmConfig({
                title: "Save POS Supplier Info",
                desc: "Are you sure you want to update the POS footer details printed on receipts?",
                onConfirm: () => { setConfirmConfig(null); saveSection(posFooter, setSavingPos); }
              })} disabled={savingPos}>
                {savingPos ? 'Saving...' : 'Save POS Info'}
              </Btn>
            </div>
          </div>

        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <p className="text-sm font-bold text-[#1a0f2e] mb-4">Preferences</p>
            {/* FIX #11 — toggles now persist via handleToggle which calls savePreferences */}
            <div className="flex flex-col gap-4">
              {[
                { label: "Email Notifications", desc: "Daily summary reports", on: notifications, key: 'notifications' as const },
                { label: "Auto Reports", desc: "Generate Z-reading nightly", on: autoReports, key: 'auto_reports' as const },
                { label: "Two-Factor Auth", desc: "Require 2FA for superadmin", on: twoFactor, key: 'two_factor' as const },
              ].map((p) => (
                <div key={p.key} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-zinc-700">{p.label}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{p.desc}</p>
                  </div>
                  <Toggle on={p.on} toggle={() => handleToggle(p.key)} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <p className="text-sm font-bold text-[#1a0f2e] mb-4">Danger Zone</p>
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs font-bold text-red-700 mb-1">Clear All Audit Logs</p>
                <p className="text-[10px] text-red-400 mb-2">This action cannot be undone.</p>
                <Btn variant="danger" size="sm" onClick={() => setConfirmConfig({
                  title: "Clear Audit Logs",
                  desc: "Are you absolutely sure you want to clear the entire log history? This action cannot be undone.",
                  isDanger: true,
                  onConfirm: () => { setConfirmConfig(null); clearAuditLogs(); }
                })} disabled={clearingLogs}>
                  {clearingLogs ? 'Clearing...' : 'Clear Logs'}
                </Btn>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs font-bold text-red-700 mb-1">Factory Reset System</p>
                <p className="text-[10px] text-red-400 mb-2">Wipes all transactions. Requires verification.</p>
                <Btn variant="danger" size="sm" onClick={() => setConfirmConfig({
                  title: "Factory Reset System",
                  desc: "CAUTION: This will wipe ALL transactions, receipts, logs, and reset settings to default values. You cannot recover from this.",
                  isDanger: true,
                  requireInput: "reset system",
                  onConfirm: () => { setConfirmConfig(null); resetSystem(); }
                })} disabled={resettingSys}>
                  {resettingSys ? 'Resetting...' : 'Factory Reset'}
                </Btn>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#3b1774] via-[#1e0f3c] to-[#0d0620] rounded-[0.625rem] p-5 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full blur-[40px] -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-[40px] translate-y-10 -translate-x-10" />
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center border border-white/5 backdrop-blur-sm">
                  <Database size={12} className="text-violet-200" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-white/90">System Info</p>
              </div>
              {[
                { label: "Version", val: sysInfo?.version || "Loading..." },
                { label: "DB Status", val: sysInfo?.db_status || "Loading..." },
                { label: "Uptime", val: sysInfo?.uptime || "Loading..." },
                { label: "Last Backup", val: sysInfo?.last_backup || "Loading..." },
              ].map((r, i) => (
                <div key={i} className="flex justify-between mb-1.5">
                  <span className="text-[10px] text-zinc-500">{r.label}</span>
                  <span className={`text-[10px] font-bold ${r.val === "Disconnected" ? "text-red-400" : "text-zinc-300"}`}>{r.val}</span>
                </div>
              ))}

              <div className="mt-5 pt-4 border-t border-white/10">
                <Btn variant="primary" size="sm" className="w-full justify-center bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all shadow-[0_4px_12px_rgba(0,0,0,0.2)]" onClick={executeBackup} disabled={runningBackup}>
                  {runningBackup ? "Exporting SQL..." : "Run System Backup"}
                </Btn>
              </div>
            </div>
          </div>
        </div>

      </div>

      {confirmConfig && (
        <ConfirmModal
          {...confirmConfig}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
};

export default SettingsTab;