// components/NewSuperAdmin/Tabs/SettingsTab.tsx
import { useState } from "react";
import { Database, Mail, Phone, MapPin, Star } from "lucide-react";

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

const SettingsTab: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [autoReports,   setAutoReports]   = useState(true);
  const [twoFactor,     setTwoFactor]     = useState(false);

  const Toggle: React.FC<ToggleProps> = ({ on, toggle }) => (
    <button onClick={toggle} className={`relative w-10 h-5 rounded-full transition-colors ${on ? "toggle-on" : "toggle-off"}`}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <div className="p-6 md:p-8 fade-in">
      <SectionHeader title="System Settings" desc="Global configuration for all branches" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <p className="text-sm font-bold text-[#1a0f2e] mb-4">General Settings</p>
            <div className="flex flex-col gap-4">
              {[
                { label: "Business Name", val: "Lucky Boba",             icon: <Star   size={14} /> },
                { label: "Contact Email", val: "admin@luckyboba.com",    icon: <Mail   size={14} /> },
                { label: "Contact Phone", val: "+63 912 345 6789",       icon: <Phone  size={14} /> },
                { label: "Address",       val: "Cebu City, Philippines", icon: <MapPin size={14} /> },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-50 border border-zinc-200 rounded-[0.4rem] flex items-center justify-center text-zinc-400 shrink-0">{f.icon}</div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">{f.label}</p>
                    <input defaultValue={f.val} className="w-full text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-[0.4rem] px-3 py-1.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4"><Btn onClick={() => {}}>Save Changes</Btn></div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <p className="text-sm font-bold text-[#1a0f2e] mb-4">Tax & Receipt Settings</p>
            <div className="flex flex-col gap-4">
              {[
                { label: "VAT Rate",       val: "12%",                                placeholder: "e.g. 12%"       },
                { label: "Receipt Footer", val: "Thank you for visiting Lucky Boba!", placeholder: "Receipt footer" },
                { label: "Currency",       val: "PHP – Philippine Peso",              placeholder: "Currency"       },
              ].map((f, i) => (
                <div key={i}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">{f.label}</p>
                  <input defaultValue={f.val} placeholder={f.placeholder}
                    className="w-full text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-[0.4rem] px-3 py-1.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all" />
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4"><Btn onClick={() => {}}>Save Changes</Btn></div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <p className="text-sm font-bold text-[#1a0f2e] mb-4">Preferences</p>
            <div className="flex flex-col gap-4">
              {[
                { label: "Email Notifications", desc: "Daily summary reports",      on: notifications, toggle: () => setNotifications(v => !v) },
                { label: "Auto Reports",        desc: "Generate Z-reading nightly", on: autoReports,   toggle: () => setAutoReports(v => !v)   },
                { label: "Two-Factor Auth",     desc: "Require 2FA for superadmin", on: twoFactor,     toggle: () => setTwoFactor(v => !v)     },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-zinc-700">{p.label}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{p.desc}</p>
                  </div>
                  <Toggle on={p.on} toggle={p.toggle} />
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