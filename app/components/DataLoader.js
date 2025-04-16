'use client';

import { motion } from 'framer-motion';

const DataLoader = ({ message = 'Loading data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-24 h-24">
        {/* Gradient spinner */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-16 h-16 border-4 border-l-indigo-500 border-r-indigo-300 border-t-indigo-400 border-b-indigo-200 rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              ease: "linear",
              repeat: Infinity
            }}
          />
        </div>
        
        {/* Pulse effect */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.7, 0.9, 0.7] 
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity
          }}
        >
          <div className="w-10 h-10 bg-gray-800 rounded-full" />
        </motion.div>
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-indigo-500 rounded-full" />
        </div>
      </div>
      
      <motion.p 
        className="mt-6 text-gray-300 text-lg font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {message}
      </motion.p>
    </div>
  );
};

export default DataLoader; 