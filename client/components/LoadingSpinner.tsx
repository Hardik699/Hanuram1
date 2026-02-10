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
          @keyframes shimmer-flash {
            0%, 100% { 
              box-shadow: 0 0 0px rgba(59, 130, 246, 0), 
                          0 0 0px rgba(99, 102, 241, 0),
                          0 0 0px rgba(139, 92, 246, 0);
              transform: scale(1);
            }
            25% { 
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.6),
                          0 0 40px rgba(99, 102, 241, 0.4),
                          0 0 60px rgba(139, 92, 246, 0.2);
              transform: scale(1.05);
            }
            50% { 
              box-shadow: 0 0 30px rgba(59, 130, 246, 0.8),
                          0 0 50px rgba(99, 102, 241, 0.6),
                          0 0 70px rgba(139, 92, 246, 0.3);
              transform: scale(1.1);
            }
            75% { 
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.6),
                          0 0 40px rgba(99, 102, 241, 0.4),
                          0 0 60px rgba(139, 92, 246, 0.2);
              transform: scale(1.05);
            }
          }
          
          @keyframes orbit-spin {
            0% { transform: rotate(0deg) }
            100% { transform: rotate(360deg) }
          }
          
          @keyframes particle-float {
            0%, 100% { 
              opacity: 0;
              transform: translateY(0px) scale(0);
            }
            50% { 
              opacity: 1;
              transform: translateY(-30px) scale(1);
            }
          }
          
          @keyframes pulse-intense {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
          
          .shimmer-core {
            animation: shimmer-flash 2s ease-in-out infinite;
          }
          
          .orbit-ring {
            animation: orbit-spin 3s linear infinite;
          }
          
          .particle-1 {
            animation: particle-float 2s ease-in-out infinite;
            animation-delay: 0s;
          }
          
          .particle-2 {
            animation: particle-float 2s ease-in-out infinite;
            animation-delay: 0.3s;
          }
          
          .particle-3 {
            animation: particle-float 2s ease-in-out infinite;
            animation-delay: 0.6s;
          }
          
          .particle-4 {
            animation: particle-float 2s ease-in-out infinite;
            animation-delay: 0.9s;
          }
          
          .pulse-dot {
            animation: pulse-intense 1.5s ease-in-out infinite;
          }
        `}</style>

        {/* Modal Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-12 max-w-sm mx-4">
          <div className="text-center">
            {/* Dynamic Tadakta Fadakta Loading Animation */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              {/* Main Shimmering Core */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-24 h-24">
                  {/* Sparkling Core */}
                  <div className="shimmer-core absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-500 shadow-lg"></div>
                  
                  {/* Orbiting Ring */}
                  <div className="orbit-ring absolute inset-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-300 rounded-full" style={{ boxShadow: '0 8px 0 rgba(59, 130, 246, 0.8)' }}></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-300 rounded-full" style={{ boxShadow: '0 -8px 0 rgba(99, 102, 241, 0.8)' }}></div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-purple-300 rounded-full" style={{ boxShadow: '8px 0 0 rgba(139, 92, 246, 0.8)' }}></div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-blue-300 rounded-full" style={{ boxShadow: '-8px 0 0 rgba(59, 130, 246, 0.8)' }}></div>
                  </div>
                </div>
              </div>

              {/* Floating Particles */}
              <div className="particle-1 absolute top-0 left-1/4 w-2 h-2 bg-blue-400 rounded-full blur-sm"></div>
              <div className="particle-2 absolute top-1/4 right-1/4 w-2 h-2 bg-indigo-400 rounded-full blur-sm"></div>
              <div className="particle-3 absolute bottom-1/4 left-1/3 w-2 h-2 bg-purple-400 rounded-full blur-sm"></div>
              <div className="particle-4 absolute top-1/2 right-1/3 w-2 h-2 bg-blue-300 rounded-full blur-sm"></div>
            </div>

            {/* Message with Pulsing Dots */}
            <div className="space-y-4">
              <p className="text-blue-700 dark:text-blue-300 font-bold text-lg">
                {message}
              </p>
              
              {/* Pulsing Indicator Dots */}
              <div className="flex justify-center gap-2">
                <div className="pulse-dot w-3 h-3 rounded-full bg-blue-500"></div>
                <div className="pulse-dot w-3 h-3 rounded-full bg-indigo-500" style={{ animationDelay: '0.3s' }}></div>
                <div className="pulse-dot w-3 h-3 rounded-full bg-purple-500" style={{ animationDelay: '0.6s' }}></div>
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
        @keyframes shimmer-flash {
          0%, 100% { 
            box-shadow: 0 0 0px rgba(59, 130, 246, 0), 
                        0 0 0px rgba(99, 102, 241, 0),
                        0 0 0px rgba(139, 92, 246, 0);
            transform: scale(1);
          }
          25% { 
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6),
                        0 0 40px rgba(99, 102, 241, 0.4),
                        0 0 60px rgba(139, 92, 246, 0.2);
            transform: scale(1.05);
          }
          50% { 
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.8),
                        0 0 50px rgba(99, 102, 241, 0.6),
                        0 0 70px rgba(139, 92, 246, 0.3);
            transform: scale(1.1);
          }
          75% { 
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6),
                        0 0 40px rgba(99, 102, 241, 0.4),
                        0 0 60px rgba(139, 92, 246, 0.2);
            transform: scale(1.05);
          }
        }
        
        @keyframes orbit-spin {
          0% { transform: rotate(0deg) }
          100% { transform: rotate(360deg) }
        }
        
        @keyframes particle-float {
          0%, 100% { 
            opacity: 0;
            transform: translateY(0px) scale(0);
          }
          50% { 
            opacity: 1;
            transform: translateY(-30px) scale(1);
          }
        }
        
        @keyframes pulse-intense {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        
        .shimmer-core {
          animation: shimmer-flash 2s ease-in-out infinite;
        }
        
        .orbit-ring {
          animation: orbit-spin 3s linear infinite;
        }
        
        .particle-1 {
          animation: particle-float 2s ease-in-out infinite;
          animation-delay: 0s;
        }
        
        .particle-2 {
          animation: particle-float 2s ease-in-out infinite;
          animation-delay: 0.3s;
        }
        
        .particle-3 {
          animation: particle-float 2s ease-in-out infinite;
          animation-delay: 0.6s;
        }
        
        .particle-4 {
          animation: particle-float 2s ease-in-out infinite;
          animation-delay: 0.9s;
        }
        
        .pulse-dot {
          animation: pulse-intense 1.5s ease-in-out infinite;
        }
      `}</style>
      
      <div className="text-center">
        {/* Dynamic Tadakta Fadakta Loading Animation */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Main Shimmering Core */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-24 h-24">
              {/* Sparkling Core */}
              <div className="shimmer-core absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-500 shadow-lg"></div>
              
              {/* Orbiting Ring */}
              <div className="orbit-ring absolute inset-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-300 rounded-full" style={{ boxShadow: '0 8px 0 rgba(59, 130, 246, 0.8)' }}></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-300 rounded-full" style={{ boxShadow: '0 -8px 0 rgba(99, 102, 241, 0.8)' }}></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-purple-300 rounded-full" style={{ boxShadow: '8px 0 0 rgba(139, 92, 246, 0.8)' }}></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-blue-300 rounded-full" style={{ boxShadow: '-8px 0 0 rgba(59, 130, 246, 0.8)' }}></div>
              </div>
            </div>
          </div>

          {/* Floating Particles */}
          <div className="particle-1 absolute top-0 left-1/4 w-2 h-2 bg-blue-400 rounded-full blur-sm"></div>
          <div className="particle-2 absolute top-1/4 right-1/4 w-2 h-2 bg-indigo-400 rounded-full blur-sm"></div>
          <div className="particle-3 absolute bottom-1/4 left-1/3 w-2 h-2 bg-purple-400 rounded-full blur-sm"></div>
          <div className="particle-4 absolute top-1/2 right-1/3 w-2 h-2 bg-blue-300 rounded-full blur-sm"></div>
        </div>

        {/* Message with Pulsing Dots */}
        <div className="space-y-4">
          <p className="text-blue-700 dark:text-blue-300 font-bold text-lg">
            {message}
          </p>
          
          {/* Pulsing Indicator Dots */}
          <div className="flex justify-center gap-2">
            <div className="pulse-dot w-3 h-3 rounded-full bg-blue-500"></div>
            <div className="pulse-dot w-3 h-3 rounded-full bg-indigo-500" style={{ animationDelay: '0.3s' }}></div>
            <div className="pulse-dot w-3 h-3 rounded-full bg-purple-500" style={{ animationDelay: '0.6s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
