import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Package,
  List,
  Menu,
  X,
  Users,
  LayoutGrid,
  Calculator,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ManagementNav } from "./ManagementNav";

export function Sidebar() {
  const location = useLocation();
  const { hasPermission, canAccess, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const toggleMenu = (menuName: string) => {
    setExpandedMenu(expandedMenu === menuName ? null : menuName);
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const checkAccess = (item: any) => {
    // If item has a module field, check module access
    if (item.module) {
      return canAccess(item.module);
    }
    // Otherwise check permission
    if (item.permission) {
      return hasPermission(item.permission);
    }
    // No restriction
    return true;
  };

  // Production user (role_id: 7) sees only these items
  const isProductionUser = user?.role_id === 7;

  const menuItems = isProductionUser
    ? [
        {
          label: "Raw Material",
          path: "/raw-materials",
          icon: Package,
        },
        {
          label: "Production Labour Cost",
          path: "/rmc",
          icon: List,
        },
      ]
    : [
        {
          label: "Dashboard",
          path: "/dashboard",
          icon: LayoutGrid,
        },
        {
          label: "Category",
          path: "/create-category",
          icon: Package,
        },
        {
          label: "Sub Category",
          path: "/create-subcategory",
          icon: Package,
        },
        {
          label: "Unit",
          path: "/create-unit",
          icon: Package,
        },
        {
          label: "Vendor",
          path: "/create-vendor",
          icon: Package,
        },
        {
          label: "Raw Material",
          path: "/raw-materials",
          icon: Package,
        },
        {
          label: "Labour",
          path: "/labour",
          icon: Users,
        },
        {
          label: "Raw Material Costing",
          path: "/rmc",
          icon: List,
        },
        {
          label: "OP Cost Management",
          path: "/op-cost",
          icon: Calculator,
        },
      ];

  const renderSubmenu = (submenu: any[], level = 0, parentLabel?: string) => {
    // Filter items by permission/module
    const filteredSubmenu = submenu.filter((item) => checkAccess(item));

    if (filteredSubmenu.length === 0) return null;

    return (
      <div className={`space-y-1.5`}>
        {filteredSubmenu.map((subitem, subindex) => {
          const hasNested =
            Array.isArray(subitem.submenu) && subitem.submenu.length;
          if (hasNested) {
            const open = expandedMenu === subitem.label;
            return (
              <div key={subindex}>
                <button
                  onClick={() => toggleMenu(subitem.label)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group ${
                    isActive(subitem.submenu[0]?.path || "")
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                  }`}
                >
                  <span>{subitem.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="ml-4 border-l-2 border-blue-300 dark:border-blue-900/40 pl-4 space-y-1.5 animate-slide-in-left">
                    {renderSubmenu(subitem.submenu, level + 1, subitem.label)}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={subindex}
              to={subitem.path}
              onClick={() => {
                // Close mobile sidebar, but keep the parent submenu expanded so it remains open when returning
                setIsOpen(false);
                if (parentLabel) setExpandedMenu(parentLabel);
              }}
              className={`block px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group ${
                isActive(subitem.path)
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-3 border-blue-600 pl-5"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/30 hover:translate-x-0.5"
              }`}
            >
              {subitem.label}
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Mobile menu button - Professional Design */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 sm:top-5 left-4 z-50 md:hidden bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-3 rounded-xl shadow-elevation-4 dark:shadow-elevation-8 hover:shadow-elevation-8 dark:hover:shadow-elevation-12 transition-all text-white hover:scale-110 transform hover:-translate-y-0.5"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden backdrop-blur-md animate-fade-in-up"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Professional Design */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto z-40 transition-transform duration-300 md:translate-x-0 shadow-elevation-4 dark:shadow-elevation-8 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo/Brand */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 mb-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-slate-800 dark:to-slate-700/50">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-elevation-2 transform hover:scale-110 transition-transform">
            <span className="text-white font-bold text-sm">HF</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-900 dark:text-white font-bold text-base">
              Hanuram
            </span>
            <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
              Foods
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="ml-auto md:hidden"
          >
            <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500 rotate-90 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
          </button>
        </div>

        {/* Management Navigation */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <ManagementNav />
        </div>

        <nav className="p-4 space-y-1.5">
          {menuItems
            .filter((item) => checkAccess(item))
            .map((item, index) => (
              <div key={index}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 group ${
                        isActive(item.submenu[0]?.path || "")
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-elevation-3 dark:from-blue-700 dark:to-blue-800"
                          : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon && (
                          <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                        )}
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          expandedMenu === item.label ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {expandedMenu === item.label && (
                      <div className="mt-2 ml-4 border-l-2 border-blue-300 dark:border-blue-900/50 pl-4 space-y-1.5 animate-slide-in-left">
                        {renderSubmenu(item.submenu)}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path!}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 group ${
                      isActive(item.path!)
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-elevation-3 dark:from-blue-700 dark:to-blue-800"
                        : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/40"
                    }`}
                  >
                    {item.icon && (
                      <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    )}
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
        </nav>
      </aside>

      {/* Main content wrapper - offset from sidebar */}
      <div className="hidden md:block md:ml-64" />
    </>
  );
}
