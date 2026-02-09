import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, Package, Layers, Boxes, Users } from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export function ManagementNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      label: "Category",
      path: "/create-category",
      icon: <Package className="w-5 h-5" />,
    },
    {
      label: "Unit",
      path: "/create-unit",
      icon: <Boxes className="w-5 h-5" />,
    },
    {
      label: "Sub Category",
      path: "/create-subcategory",
      icon: <Layers className="w-5 h-5" />,
    },
    {
      label: "Vendor",
      path: "/create-vendor",
      icon: <Users className="w-5 h-5" />,
    },
  ];

  const getCurrentLabel = () => {
    const currentItem = navItems.find(
      (item) => location.pathname === item.path,
    );
    return currentItem?.label || "Management";
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto bg-white dark:bg-slate-800 rounded-xl border-2 border-blue-200 dark:border-blue-900/50 px-4 py-3 flex items-center justify-between gap-3 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-all shadow-md hover:shadow-lg group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center text-white shadow-md">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Master Data
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {getCurrentLabel()}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 sm:right-auto mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 min-w-[280px] animate-in fade-in slide-in-from-top-2">
          <div className="p-2 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 ${
                      isActive
                        ? "text-white"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.label}</p>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
