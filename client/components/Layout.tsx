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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Header (optional) */}
      {!hideHeader && (
        <header className="fixed top-0 left-0 right-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-elevation-2">
          <div className="relative">
            <div className="h-16 sm:h-20 ml-0 md:ml-64 px-4 sm:px-6 flex items-center justify-between gap-4">
              <div className="flex-1">
                {title && (
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent truncate">
                    {title}
                  </h3>
                )}
              </div>
              <div className="flex items-center gap-4">
                {headerActions && (
                  <div className="flex items-center gap-2 animate-fade-in-up">{headerActions}</div>
                )}
                <UserMenu />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="md:ml-64 pt-20 sm:pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto fade-in-up page-load">{children}</div>
      </main>
    </div>
  );
}
