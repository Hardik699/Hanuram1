import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";
import { Search } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  hideHeader?: boolean;
  headerActions?: React.ReactNode;
}

export function Layout({
  children,
  title,
  hideHeader,
  headerActions,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Top Navbar - Modern SaaS Style */}
      {!hideHeader && (
        <header className="fixed top-0 left-0 right-0 z-20 bg-white md:ml-64 border-b transition-all duration-200"
          style={{ borderColor: "#e2e8f0" }}
        >
          <div className="h-16 px-6 flex items-center justify-between gap-6">
            {/* Search Bar - Centered with Icon */}
            <div className="flex-1 max-w-lg">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search materials, vendors..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-slate-50 border text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                  style={{ borderColor: "#e2e8f0" }}
                />
              </div>
            </div>

            {/* Right Actions - Organized */}
            <div className="flex items-center gap-3 ml-auto">
              {headerActions && (
                <div className="flex items-center gap-2 border-r pr-3"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  {headerActions}
                </div>
              )}
              <UserMenu />
            </div>
          </div>
        </header>
      )}

      {/* Main Content - Improved Spacing */}
      <main className="md:ml-64 pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {title && (
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 mt-1">Manage and track all your raw materials and pricing</p>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
