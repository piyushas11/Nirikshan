import React from "react";
import { motion } from "framer-motion";

const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const base = "relative px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden group";

  const styles = {
    primary:
      "bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_25px_rgba(34,197,94,0.4)]",
    outline:
      "border border-gray-700 hover:border-green-400/50 text-gray-300 hover:text-white bg-gray-900/50 backdrop-blur-sm",
    danger:
      "bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.1)]",
  };

  return (
    <motion.button
      // Tactile Feedback
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      
      className={`${base} ${styles[variant]} ${className}`}
      {...props}
    >
      {/* Subtle Shine Effect on Hover */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
      
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export default Button;