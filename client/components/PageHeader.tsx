import { ChevronRight, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Breadcrumb {
  label: string;
  path?: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  icon,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-6 sm:mb-8 animate-material-fade-in">
      {/* Breadcrumbs - Material Design */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground dark:hover:text-sidebar-foreground transition-colors duration-200"
            title="Home"
          >
            <Home className="w-4 h-4" />
          </button>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              {crumb.path || crumb.href ? (
                <button
                  onClick={() => navigate(crumb.path || crumb.href || "/")}
                  className="text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors duration-200"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-foreground font-medium">
                  {crumb.label}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Header Content - Material Design */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 shadow-elevation-2 transform hover:scale-110 transition-transform">
              <div className="text-white">{icon}</div>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-light text-foreground dark:text-white">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 font-normal">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions - Material Design Buttons */}
        {actions && (
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
