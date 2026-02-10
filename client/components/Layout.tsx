import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";

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
          <div className="h-16 px-6 flex items-center justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
            </div>
            <div className="flex items-center gap-4">
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
      <main className="md:ml-64 pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
