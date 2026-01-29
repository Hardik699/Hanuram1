interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  message = "Loading...",
  fullScreen = false,
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const container = fullScreen
    ? "flex items-center justify-center min-h-screen"
    : "flex items-center justify-center py-8 sm:py-12";

  return (
    <div className={container}>
      <div className="text-center">
        <div
          className={`${sizeClasses[size]} border-4 border-teal-200 dark:border-teal-800 border-t-teal-500 dark:border-t-teal-400 rounded-full animate-spin mx-auto mb-4`}
        />
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}
