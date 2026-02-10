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
  // When fullScreen is true, show as a centered modal with dark overlay
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes pulse-ring {
            0% {
              transform: scale(0.8);
              opacity: 1;
            }
            100% {
              transform: scale(2.2);
              opacity: 0;
            }
          }
          @keyframes dot-bounce {
            0%, 80%, 100% { opacity: 0.4; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          .animate-pulse-ring {
            animation: pulse-ring 2s ease-out infinite;
          }
          .animate-dot-1 {
            animation: dot-bounce 1.4s infinite;
          }
          .animate-dot-2 {
            animation: dot-bounce 1.4s infinite;
            animation-delay: 0.2s;
          }
          .animate-dot-3 {
            animation: dot-bounce 1.4s infinite;
            animation-delay: 0.4s;
          }
        `}</style>

        {/* Modal Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-12 max-w-sm mx-4">
          <div className="text-center">
            {/* Animated Loader - Elegant Pulsing Circles */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 opacity-20 animate-pulse-ring"></div>

              {/* Main animated circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-16 h-16">
                  {/* Center glowing core */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse shadow-lg shadow-blue-400/50 dark:shadow-blue-500/30"></div>

                  {/* Rotating gradient ring */}
                  <div
                    className="absolute inset-1 rounded-full border-2 border-transparent border-t-blue-400 border-r-indigo-400 animate-spin"
                    style={{ animationDuration: '2s' }}
                  ></div>
                </div>
              </div>

              {/* Floating animation wrapper */}
              <div className="absolute inset-0 animate-float"></div>
            </div>

            {/* Message with animated dots */}
            <div className="space-y-3">
              <p className="text-blue-700 dark:text-blue-300 font-semibold text-lg">
                {message}
              </p>
              
              {/* Animated loading dots */}
              <div className="flex justify-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-dot-1"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-dot-2"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-dot-3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // When fullScreen is false, show inline
  return (
    <div className="flex items-center justify-center py-8 sm:py-12">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { opacity: 0.4; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s ease-out infinite;
        }
        .animate-dot-1 {
          animation: dot-bounce 1.4s infinite;
        }
        .animate-dot-2 {
          animation: dot-bounce 1.4s infinite;
          animation-delay: 0.2s;
        }
        .animate-dot-3 {
          animation: dot-bounce 1.4s infinite;
          animation-delay: 0.4s;
        }
      `}</style>
      
      <div className="text-center">
        {/* Animated Loader - Elegant Pulsing Circles */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 opacity-20 animate-pulse-ring"></div>

          {/* Main animated circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-16 h-16">
              {/* Center glowing core */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse shadow-lg shadow-blue-400/50 dark:shadow-blue-500/30"></div>

              {/* Rotating gradient ring */}
              <div
                className="absolute inset-1 rounded-full border-2 border-transparent border-t-blue-400 border-r-indigo-400 animate-spin"
                style={{ animationDuration: '2s' }}
              ></div>
            </div>
          </div>

          {/* Floating animation wrapper */}
          <div className="absolute inset-0 animate-float"></div>
        </div>

        {/* Message with animated dots */}
        <div className="space-y-3">
          <p className="text-blue-700 dark:text-blue-300 font-semibold text-lg">
            {message}
          </p>
          
          {/* Animated loading dots */}
          <div className="flex justify-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-dot-1"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-dot-2"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-dot-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
