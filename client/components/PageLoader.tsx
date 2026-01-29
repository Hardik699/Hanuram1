import { useEffect, useState } from "react";

export function PageLoader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show loader for minimum 300ms for smooth transition
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100 z-50 flex items-center justify-center pointer-events-none">
      {/* Animated loader background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>

      {/* Loader content */}
      <div className="relative z-10 text-center">
        {/* Spinning circle */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-400 animate-spin"></div>

          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Loading text */}
        <p className="mt-6 text-sm font-semibold text-slate-600 uppercase tracking-widest">
          Loading
          <span className="inline-flex gap-1 ml-1">
            <span className="animate-bounce" style={{ animationDelay: "0s" }}>
              .
            </span>
            <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>
              .
            </span>
            <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
              .
            </span>
          </span>
        </p>
      </div>

      {/* Fade out animation */}
      <style>{`
        @keyframes fadeOut {
          to {
            opacity: 0;
          }
        }
        .page-loader {
          animation: fadeOut 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export function usePageLoader() {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return { isLoading, startLoading, stopLoading };
}
