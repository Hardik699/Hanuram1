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
    if (item.module) {
      return canAccess(item.module);
    }
    if (item.permission) {
      return hasPermission(item.permission);
    }
    return true;
  };

  const isProductionUser = user?.role_id === 7;

  const menuItems = isProductionUser
    ? [
        {
          label: "Raw Material",
          path: "/raw-materials",
          icon: Package,
        },
        {
          label: "Recipe",
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

  const renderSubmenu = (submenu: any[], parentLabel?: string) => {
    const filteredSubmenu = submenu.filter((item) => checkAccess(item));

    if (filteredSubmenu.length === 0) return null;

    return (
      <div className="space-y-2">
        {filteredSubmenu.map((subitem, subindex) => {
          const hasNested =
            Array.isArray(subitem.submenu) && subitem.submenu.length;

          if (hasNested) {
            const open = expandedMenu === subitem.label;
            return (
              <div key={subindex}>
                <button
                  onClick={() => toggleMenu(subitem.label)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all border-2 ${
                    isActive(subitem.submenu[0]?.path || "")
                      ? "text-blue-600 bg-blue-50 border-blue-200"
                      : "text-gray-700 bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  <span>{subitem.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {open && (
                  <div className="ml-4 pl-3 border-l border-gray-300 space-y-2">
                    {renderSubmenu(subitem.submenu, subitem.label)}
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
                setIsOpen(false);
                if (parentLabel) setExpandedMenu(parentLabel);
              }}
              className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-all border-2 ${
                isActive(subitem.path)
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "text-gray-700 bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50"
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
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-blue-600 text-white p-2 rounded-lg"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto z-40 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "260px" }}
      >
        {/* Logo/Brand */}
        <div className="px-4 py-4 border-b border-gray-200 flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">HF</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 font-bold text-sm">Hanuram</span>
            <span className="text-blue-600 text-xs font-semibold">Foods</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="ml-auto md:hidden"
          >
            <ChevronDown className="w-5 h-5 text-gray-400 rotate-90" />
          </button>
        </div>

        {/* Management Navigation */}
        <div className="px-3 py-3 border-b border-gray-200">
          <ManagementNav />
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems
            .filter((item) => checkAccess(item))
            .map((item, index) => (
              <div key={index}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all border-2 ${
                        isActive(item.submenu[0]?.path || "")
                          ? "text-blue-600 bg-blue-50 border-blue-200"
                          : "text-gray-700 bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon && (
                          <item.icon className="w-5 h-5" />
                        )}
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedMenu === item.label ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {expandedMenu === item.label && (
                      <div className="mt-2 ml-4 pl-3 border-l border-gray-300 space-y-2">
                        {renderSubmenu(item.submenu)}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path!}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all border-2 ${
                      isActive(item.path!)
                        ? "text-blue-600 bg-blue-50 border-blue-200"
                        : "text-gray-700 bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                    }`}
                  >
                    {item.icon && (
                      <item.icon className="w-5 h-5" />
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
