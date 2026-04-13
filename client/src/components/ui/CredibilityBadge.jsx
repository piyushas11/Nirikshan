import React from "react";
import { motion } from "framer-motion";

const CredibilityBadge = ({ score = 0 }) => {
  // Determine color based on score
  const getColors = (s) => {
    if (s >= 75) return { text: "text-green-400", stroke: "#4ade80", bg: "bg-green-500/10" };
    if (s >= 50) return { text: "text-yellow-400", stroke: "#facc15", bg: "bg-yellow-500/10" };
    return { text: "text-red-400", stroke: "#f87171", bg: "bg-red-500/10" };
  };

  const { text, stroke, bg } = getColors(score);
  
  // SVG Circle Math
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-full border border-gray-800 ${bg} w-fit`}>
      <div className="relative flex items-center justify-center w-10 h-10">
        {/* Background Circle (Track) */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-gray-800"
          />
          {/* Animated Progress Circle */}
          <motion.circle
            cx="20"
            cy="20"
            r={radius}
            stroke={stroke}
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Shield Icon or Dot in center */}
        <div className={`absolute text-[10px] font-black ${text}`}>
          {score}
        </div>
      </div>

      <div className="flex flex-col">
        <span className={`text-xs font-black uppercase tracking-tighter ${text}`}>
          Trust Score
        </span>
        <span className="text-[10px] text-gray-500 font-medium -mt-1">
          Verified 360
        </span>
      </div>
    </div>
  );
};

export default CredibilityBadge;