import React from "react";
import { motion } from "framer-motion";

const StatCard = ({ title, value, description }) => {
  return (
    <motion.div
      // Entrance animation when scrolled into view
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      
      // Hover interaction
      whileHover={{ 
        y: -5, 
        borderColor: "rgba(34, 197, 94, 0.4)", // Subtle green glow on border
        backgroundColor: "rgba(17, 24, 39, 0.8)" 
      }}
      
      className="relative overflow-hidden bg-gray-900/50 p-6 rounded-2xl border border-gray-800 backdrop-blur-sm transition-colors group"
    >
      {/* Background Decorative Gradient (Visible on hover) */}
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors" />

      <h3 className="text-gray-400 text-sm font-medium mb-1 tracking-wide uppercase">
        {title}
      </h3>
      
      <motion.p 
        initial={{ scale: 0.9 }}
        whileInView={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="text-4xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"
      >
        {value}
      </motion.p>

      {description && (
        <p className="text-gray-500 text-xs mt-2 italic">
          {description}
        </p>
      )}
    </motion.div>
  );
};

export default StatCard;