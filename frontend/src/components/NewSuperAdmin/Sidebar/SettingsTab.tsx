// components/NewSuperAdmin/Tabs/SettingsTab.tsx
import { useState, useEffect } from "react";
import { Database, Mail, Phone, MapPin, Star } from "lucide-react";
import { useToast } from "../../../hooks/useToast";

type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

interface SectionHeaderProps {
  title:   string;
  desc?:   string;
  action?: React.ReactNode;
}
interface BtnProps {
  children:   React.ReactNode;
  variant?:   VariantKey;
  size?:      SizeKey;
  onClick?:   () => void;
  className?: string;
  disabled?:  boolean;
  type?:      "button" | "submit" | "reset";
}
interface ToggleProps { on: boolean; toggle: () => void; }

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, desc, action }) => (
  <div className="flex items-center justify-between mb-5">
    <div>
      <h2 className="text-base font-bold text-[#1a0f2e]">{title}</h2>
      {desc && <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>}
    </div>
    {action}
  </div>
);

const Btn: React.FC<BtnProps> = ({
  children, variant = "primary", size = "sm",
  onClick, className = "", disabled = false, type = "button",
}) => {
  const sizes:    Record<SizeKey,    string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary:   "bg-[#3b2063] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger:    "bg-red-600 hover:bg-red-700 text-white",
    ghost:     "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

type PosFooterKey =
  | 'pos_supplier' | 'pos_address' | 'pos_tin'
  | 'pos_accred_no' | 'pos_date_issued' | 'pos_valid_until'
  | 'pos_ptu' | 'pos_ptu_date';

const POS_FOOTER_FIELDS: { label: string; key: PosFooterKey; placeholder: string }[] = [
  { label: "POS Supplier",      key: "pos_supplier",    placeholder: "e.g. ACME POS Solutions" },
  { label: "Address",           key: "pos_address",     placeholder: "e.g. 123 Tech St., Cebu City" },
  { label: "TIN",               key: "pos_tin",         placeholder: "e.g. 000-000-000-000" },
  { label: "Accred No.",        key: "pos_accred_no",   placeholder: "e.g. FP082024-000000" },
  { label: "Date Issued",       key: "pos_date_issued", placeholder: "e.g. 08/01/2024" },
  { label: "Valid Until",       key: "pos_valid_until", placeholder: "e.g. 07/31/2029" },
  { label: "PTU No.",           key: "pos_ptu",         placeholder: "e.g. FP082024-000000" },
  { label: "PTU Date Issued",   key: "pos_ptu_date",    placeholder: "e.g. 08/01/2024" },
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
  const [autoReports,   setAutoReports]   = useState(true);
  const [twoFactor,     setTwoFactor]     = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingTax,     setSavingTax]     = useState(false);
  const [savingPos,     setSavingPos]     = useState(false);
  const [savingPrefs,   setSavingPrefs]   = useState(false);
  const [loadError,     setLoadError]     = useState<string | null>(null);
  const { showToast } = useToast();

  // ── General settings state ───────────────────────────────────────────────
  const [generalFields, setGeneralFields] = useState({
    business_name:  'Lucky Boba',
    contact_email:  'admin@luckyboba.com',
    contact_phone:  '+63 912 345 6789',
    address:        'Cebu City, Philippines',
  });

  // ── Tax & Receipt settings state ─────────────────────────────────────────
  const [taxFields, setTaxFields] = useState({
    vat_rate:       '12%',
    receipt_footer: 'Thank you for visiting Lucky Boba!',
    currency:       'PHP – Philippine Peso',
  });

  // ── POS Supplier footer state ─────────────────────────────────────────────
  const [posFooter, setPosFooter] = useState<Record<PosFooterKey, string>>({
    pos_supplier:    '',
    pos_address:     '',
    pos_tin:         '',
    pos_accred_no:   '',
    pos_date_issued: '',
    pos_valid_until: '',
    pos_ptu:         '',
    pos_ptu_date:    '',
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
          business_name:  data.business_name  ?? '',
          contact_email:  data.contact_email  ?? '',
          contact_phone:  data.contact_phone  ?? '',
          address:        data.address        ?? '',
        });
        setTaxFields({
          vat_rate:       data.vat_rate       ?? '',
          receipt_footer: data.receipt_footer ?? '',
          currency:       data.currency       ?? '',
        });
        setPosFooter({
          pos_supplier:    data.pos_supplier    ?? '',
          pos_address:     data.pos_address     ?? '',
          pos_tin:         data.pos_tin         ?? '',
          pos_accred_no:   data.pos_accred_no   ?? '',
          pos_date_issued: data.pos_date_issued ?? '',
          pos_valid_until: data.pos_valid_until ?? '',
          pos_ptu:         data.pos_ptu         ?? '',
          pos_ptu_date:    data.pos_ptu_date    ?? '',
        });
        // FIX #11 — load toggle preferences from API response
        if (data.notifications !== undefined) setNotifications(data.notifications === 'true');
        if (data.auto_reports   !== undefined) setAutoReports(data.auto_reports     === 'true');
        if (data.two_factor     !== undefined) setTwoFactor(data.two_factor         === 'true');
      })
      .catch((err: Error) => {
        console.error('Failed to load settings:', err);
        showToast('Could not load settings. Check your connection or log in again.', 'error');
        setLoadError('Could not load settings. Check your connection or log in again.');
      });
  }, [showToast]);

  // FIX #10 — use PATCH (partial update)
  const saveSection = async (
    payload: Record<string, string>,
    setSaving: (v: boolean) => void
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method:  'PATCH',
        headers: getHeaders(),
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      showToast('Settings saved successfully!', 'success');
    } catch (e) {
      console.error('Save failed:', e);
      showToast('Save failed — please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // FIX #11 — save toggle preferences
  const savePreferences = async (prefs: { notifications: boolean; auto_reports: boolean; two_factor: boolean }) => {
    setSavingPrefs(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method:  'PATCH',
        headers: getHeaders(),
        body:    JSON.stringify({
          notifications: String(prefs.notifications),
          auto_reports:  String(prefs.auto_reports),
          two_factor:    String(prefs.two_factor),
        }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      // Success is silent for toggles usually, but we could add a toast if requested.
    } catch (e) {
      console.error('Preference save failed:', e);
      showToast('Failed to save preferences', 'error');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleToggle = (key: 'notifications' | 'auto_reports' | 'two_factor') => {
    const next = {
      notifications,
      auto_reports: autoReports,
      two_factor:   twoFactor,
    };
    if (key === 'notifications') { next.notifications = !notifications; setNotifications((v: boolean) => !v); }
    if (key === 'auto_reports')  { next.auto_reports   = !autoReports;  setAutoReports((v: boolean) => !v); }
    if (key === 'two_factor')    { next.two_factor      = !twoFactor;   setTwoFactor((v: boolean) => !v); }
    savePreferences(next);
  };

  const Toggle: React.FC<ToggleProps> = ({ on, toggle }) => (
    <button
      onClick={toggle}
      disabled={savingPrefs}
      className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-60 ${on ? "toggle-on" : "toggle-off"}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <div className="p-6 md:p-8 fade-in">
      {/* FIX #12 — visible error banner when settings fail to load */}
      {loadError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold">
          {loadError}
        </div>
      )}

      <SectionHeader title="System Settings" desc="Global configuration for all branches" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* General Settings */}
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <p className="text-sm font-bold text-[#1a0f2e] mb-4">General Settings</p>
            <div className="flex flex-col gap-4">
              {[
                { label: "Business Name", key: "business_name" as const, icon: <Star   size={14} /> },
                { label: "Contact Email", key: "contact_email" as const, icon: <Mail   size={14} /> },
                { label: "Contact Phone", key: "contact_phone" as const, icon: <Phone  size={14} /> },
                { label: "Address",       key: "address"       as const, icon: <MapPin size={14} /> },
              ].map((f) => (
                <div key={f.key} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-50 border border-zinc-200 rounded-[0.4rem] flex items-center justify-center text-zinc-400 shrink-0">{f.icon}</div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">{f.label}</p>
                    <input
                      value={generalFields[f.key]}
                      onChange={e => setGeneralFields((v: typeof generalFields) => ({ ...v, [f.key]: e.target.value }))}
                      className="w-full text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-[0.4rem] px-3 py-1.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Btn onClick={() => saveSection(generalFields, setSavingGeneral)} disabled={savingGeneral}>
                {savingGeneral ? 'Saving...' : 'Save Changes'}
              </Btn>
            </div>
          </div>

          {/* Tax & Receipt Settings */}
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <p className="text-sm font-bold text-[#1a0f2e] mb-4">Tax & Receipt Settings</p>
            <div className="flex flex-col gap-4">
              {[
                { label: "VAT Rate",       key: "vat_rate"       as const, placeholder: "e.g. 12%"       },
                { label: "Receipt Footer", key: "receipt_footer" as const, placeholder: "Receipt footer" },
                { label: "Currency",       key: "currency"       as const, placeholder: "Currency"       },
              ].map((f) => (
                <div key={f.key}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">{f.label}</p>
                  <input
                    value={taxFields[f.key]}
                    onChange={e => setTaxFields((v: typeof taxFields) => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-[0.4rem] px-3 py-1.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Btn onClick={() => saveSection(taxFields, setSavingTax)} disabled={savingTax}>
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
                    onChange={e => setPosFooter((v: typeof posFooter) => ({ ...v, [f.key]: e.target.value }))}
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
                  {posFooter.pos_supplier    && <div className="font-bold uppercase">{posFooter.pos_supplier}</div>}
                  {posFooter.pos_address     && <div>{posFooter.pos_address}</div>}
                  {posFooter.pos_tin         && <div>TIN: {posFooter.pos_tin}</div>}
                  {posFooter.pos_accred_no   && <div>Accred No: {posFooter.pos_accred_no}</div>}
                  {posFooter.pos_date_issued && <div>Date Issued: {posFooter.pos_date_issued}</div>}
                  {posFooter.pos_valid_until && <div>Valid Until: {posFooter.pos_valid_until}</div>}
                  {posFooter.pos_ptu         && <div>PTU No: {posFooter.pos_ptu}</div>}
                  {posFooter.pos_ptu_date    && <div>PTU Date Issued: {posFooter.pos_ptu_date}</div>}
                </div>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Btn onClick={() => saveSection(posFooter, setSavingPos)} disabled={savingPos}>
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
                { label: "Email Notifications", desc: "Daily summary reports",      on: notifications, key: 'notifications' as const },
                { label: "Auto Reports",        desc: "Generate Z-reading nightly", on: autoReports,   key: 'auto_reports'  as const },
                { label: "Two-Factor Auth",     desc: "Require 2FA for superadmin", on: twoFactor,     key: 'two_factor'    as const },
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
                <Btn variant="danger" size="sm" onClick={() => {}}>Clear Logs</Btn>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs font-bold text-red-700 mb-1">Reset System</p>
                <p className="text-[10px] text-red-400 mb-2">Resets all settings to defaults.</p>
                <Btn variant="danger" size="sm" onClick={() => {}}>Reset</Btn>
              </div>
            </div>
          </div>

          <div className="bg-[#1e0f3c] rounded-[0.625rem] p-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Database size={14} className="text-violet-300" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-300">System Info</p>
              </div>
              {[
                { label: "Version",     val: "v2.4.1"        },
                { label: "DB Status",   val: "Connected"      },
                { label: "Uptime",      val: "14d 6h 22m"     },
                { label: "Last Backup", val: "Today 03:00 AM" },
              ].map((r, i) => (
                <div key={i} className="flex justify-between mb-1.5">
                  <span className="text-[10px] text-zinc-500">{r.label}</span>
                  <span className="text-[10px] font-bold text-zinc-300">{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsTab;