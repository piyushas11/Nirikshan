import React from "react";
import { motion } from "framer-motion";

const Timeline = ({ steps }) => {
  return (
    <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0 max-w-5xl mx-auto px-4">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          {/* Step Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
            className="relative flex flex-col items-center z-10 w-full"
          >
            {/* Circle with Gradient Glow */}
            <div className="relative group">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-lg group-hover:bg-blue-500/40 transition-all duration-500" />
              <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-blue-600 text-black font-black text-lg shadow-xl border-4 border-gray-900">
                {index + 1}
              </div>
            </div>

            {/* Label */}
            <p className="text-sm md:text-base font-semibold mt-4 text-gray-200 tracking-wide">
              {step}
            </p>
          </motion.div>

          {/* Connecting Line (Only show between steps) */}
          {index !== steps.length - 1 && (
            <div className="hidden md:block w-full h-[2px] bg-gray-800 relative -mt-10">
              <motion.div 
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ delay: (index * 0.2) + 0.3, duration: 0.8 }}
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Timeline;