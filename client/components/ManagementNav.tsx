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
        className="w-full bg-white rounded-2xl border-2 border-blue-200 px-4 py-3 flex items-center justify-between gap-3 hover:bg-blue-50 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Package className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Master Data
            </p>
            <p className="text-sm font-bold text-gray-900">
              {getCurrentLabel()}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-900 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 min-w-[280px]">
          <div className="p-2 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-blue-50"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-700"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                  </div>
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
