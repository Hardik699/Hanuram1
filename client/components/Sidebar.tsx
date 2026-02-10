import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Package,
  List,
  Menu,
  X,
  Users,
  Calculator,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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

  const managementItems = [
    { label: "Category", path: "/create-category" },
    { label: "Unit", path: "/create-unit" },
    { label: "Sub Category", path: "/create-subcategory" },
    { label: "Vendor", path: "/create-vendor" },
  ];

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
          label: "Master Data Management",
          path: null,
          icon: Package,
          submenu: managementItems,
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

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
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
        {/* Logo/Brand Section */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              HF
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Company
              </p>
              <h2 className="text-sm font-bold text-gray-900">Hanuram Foods</h2>
            </div>
          </div>
        </div>

        {/* MENU Label */}
        <div className="px-4 py-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Menu
          </p>
        </div>

        {/* Menu Items */}
        <nav className="px-4 space-y-0">
          {menuItems
            .filter((item) => checkAccess(item))
            .map((item, index) => {
              const itemActive = isActive(item.path || "");
              
              return (
                <div key={index}>
                  {item.submenu ? (
                    <div>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all rounded-lg ${
                          expandedMenu === item.label
                            ? "text-blue-600 bg-blue-50"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon && (
                            <item.icon
                              className={`w-5 h-5 transition-colors ${
                                expandedMenu === item.label
                                  ? "text-blue-600"
                                  : "text-gray-500"
                              }`}
                            />
                          )}
                          <div className="text-left">
                            {item.label === "Master Data Management" && (
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Master Data
                              </p>
                            )}
                            <span className={item.label === "Master Data Management" ? "text-sm font-bold text-gray-900" : ""}>
                              {item.label === "Master Data Management" ? "Management" : item.label}
                            </span>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedMenu === item.label ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {expandedMenu === item.label && (
                        <div className="mt-0 ml-2 pl-4 border-l-2 border-gray-200 space-y-0">
                          {item.submenu.map((subitem: any, subindex: number) => (
                            <Link
                              key={subindex}
                              to={subitem.path}
                              onClick={() => setIsOpen(false)}
                              className={`block px-4 py-2.5 text-sm font-medium transition-all rounded-lg ${
                                isActive(subitem.path)
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                              }`}
                            >
                              {subitem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.path!}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-lg ${
                        itemActive
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {item.icon && (
                        <item.icon
                          className={`w-5 h-5 transition-colors ${
                            itemActive
                              ? "text-blue-600"
                              : "text-gray-500"
                          }`}
                        />
                      )}
                      <span>{item.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
        </nav>
      </aside>

      {/* Main content wrapper - offset from sidebar */}
      <div className="hidden md:block md:ml-64" />
    </>
  );
}
