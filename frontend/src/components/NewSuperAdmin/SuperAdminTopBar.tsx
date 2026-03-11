import { useState, useEffect } from "react";
import { Bell, Menu } from "lucide-react";
import type { TabId } from "./SuperAdminSidebar";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SuperAdminTopBarProps {
  active:      TabId;
  onMenuClick: () => void;
}

// ── Page meta ─────────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<TabId, { label: string; desc: string }> = {
  // Navigation
  overview:  { label: "Dashboard Overview",     desc: "Real-time summary across all branches"    },
  branches:  { label: "Branch Management",      desc: "Full control over all branches"           },
  users:     { label: "User Management",        desc: "Staff accounts, roles & permissions"      },

  // Reports
  sales_report:         { label: "Sales Report",         desc: "Daily & periodic sales breakdown"         },
  analytics:            { label: "Analytics & Sales",    desc: "Revenue trends & performance data"        },
  items_report:         { label: "Items Report",         desc: "Per-item sales and movement data"         },
  cross_branch_reports: { label: "Cross-Branch Reports", desc: "Consolidated analytics across branches"   },
  x_reading:            { label: "X Reading",            desc: "Mid-day POS shift summary"                },
  z_reading:            { label: "Z Reading",            desc: "End-of-day POS closing report"            },

  // Menu Management
  menu_items:    { label: "Menu List",       desc: "All products & pricing"                    },
  categories:    { label: "Categories",      desc: "Top-level menu groupings"                  },
  subcategories: { label: "Sub-Categories",  desc: "Nested category structure"                 },

  // Inventory
  inv_overview:   { label: "Inventory Overview",  desc: "Stock summary across all branches"       },
  raw_materials:  { label: "Raw Materials",        desc: "Ingredients & packaging stock"           },
  usage_report:   { label: "Usage Report",         desc: "Material consumption & variance"         },
  recipes:        { label: "Recipes",              desc: "Ingredient composition per menu item"    },
  supplier:       { label: "Supplier",             desc: "Vendor records & contacts"               },
  item_checker:   { label: "Item Checker",         desc: "Verify item availability & details"      },
  item_serials:   { label: "Item Serials",         desc: "Serialized item tracking"                },
  purchase_order: { label: "Purchase Order",       desc: "Incoming stock orders"                   },
  stock_transfer: { label: "Stock Transfer",       desc: "Move stock between branches"             },

  // Expenses
  expenses: { label: "Expenses", desc: "Operational costs & expense tracking" },

  // System
  promotions: { label: "Promotions & Discounts", desc: "Active campaigns & vouchers"      },
  audit:      { label: "Audit Logs",             desc: "Complete system activity trail"   },
  settings:   { label: "System Settings",        desc: "Global configuration & preferences" },
};

// ── Component ─────────────────────────────────────────────────────────────────
const SuperAdminTopBar: React.FC<SuperAdminTopBarProps> = ({ active, onMenuClick }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const page = PAGE_TITLES[active];

  return (
    <div className="shrink-0 flex items-center justify-between px-6 md:px-8 py-4 bg-white border-b border-zinc-200 min-h-17">

      {/* Left — hamburger + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-[0.4rem] text-[#3b2063] hover:bg-[#f5f3ff] transition-colors"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-sm font-bold text-[#1a0f2e]">{page.label}</h1>
          <p className="text-[10px] text-zinc-400 font-medium">{page.desc}</p>
        </div>
      </div>

      {/* Right — clock · bell · live badge */}
      <div className="flex items-center gap-3">

        {/* Live clock */}
        <p className="hidden sm:block text-xs font-bold tabular-nums text-zinc-400">
          {time.toLocaleTimeString("en-US", {
            hour:   "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })}
        </p>

        {/* Bell */}
        <button className="relative p-2 hover:bg-zinc-100 rounded-[0.4rem] transition-colors">
          <Bell size={16} className="text-zinc-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>

        {/* Live badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Live</span>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminTopBar;