'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const PageTransition = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Listen for route changes
  useEffect(() => {
    const handleRouteChangeStart = () => setIsLoading(true);
    const handleRouteChangeComplete = () => {
      setTimeout(() => setIsLoading(false), 500); // Small delay to ensure smooth transition
    };

    // Create a URL string from the pathname and search params to track changes
    const url = pathname + searchParams.toString();

    // Setup route change detection
    let currentUrl = url;
    
    // This effect will track URL changes
    setIsLoading(true);
    const timeoutId = setTimeout(() => setIsLoading(false), 800);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname, searchParams]);

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Outer circle */}
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-opacity-20"></div>
              
              {/* Inner spinning gradient circle */}
              <motion.div
                className="absolute top-0 left-0 w-16 h-16 rounded-full border-t-4 border-l-4 border-indigo-500"
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 1.2,
                  ease: "linear",
                  repeat: Infinity
                }}
              ></motion.div>
              
              {/* Small dot */}
              <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              </div>
            </div>
            <p className="mt-4 text-white font-medium">Loading...</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageTransition; 