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
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Top Navbar */}
      {!hideHeader && (
        <header className="fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 md:ml-64">
          <div className="h-16 px-6 flex items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search or type command..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 border border-gray-200 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 ml-auto">
              {headerActions && (
                <div className="flex items-center gap-2">
                  {headerActions}
                </div>
              )}
              <UserMenu />
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="md:ml-64 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
