import { Sidebar } from "./Sidebar";

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
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Header (optional) */}
      {!hideHeader && (
        <header className="fixed top-0 left-0 right-0 z-20 bg-white border-b border-slate-100 shadow-sm">
          <div className="relative">
            <div className="h-14 sm:h-16 md:h-20 ml-0 md:ml-64 px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2 sm:gap-4">
              {title && (
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent truncate flex-1">
                  {title}
                </h3>
              )}
              {headerActions && (
                <div className="flex items-center gap-1 sm:gap-2 md:gap-3 animate-fade-in-up flex-shrink-0">{headerActions}</div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="md:ml-64 pt-14 sm:pt-16 md:pt-20 pb-8 sm:pb-12 px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto fade-in-up page-load">{children}</div>
      </main>
    </div>
  );
}
