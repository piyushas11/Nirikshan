import React from "react";
import { motion } from "framer-motion";

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col justify-center items-center gap-4">
      <div className="relative flex items-center justify-center w-16 h-16">
        
        {/* Outer Rotating Gradient Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-t-2 border-r-2 border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)]"
        />

        {/* Inner Pulsing Core */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5] 
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-6 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full"
        />

        {/* Secondary Orbiting Dot */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute w-full h-full"
        >
          <div className="w-2 h-2 bg-blue-400 rounded-full absolute top-0 left-1/2 -translate-x-1/2" />
        </motion.div>
      </div>

      {/* Loading Text */}
      <motion.p
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase"
      >
        Syncing 360 Data...
      </motion.p>
    </div>
  );
};

export default LoadingSpinner;