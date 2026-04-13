import React, { useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const Card = ({ children, className = "" }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out the mouse movement for the spotlight
  const mouseXSpring = useSpring(mouseX, { stiffness: 500, damping: 50 });
  const mouseYSpring = useSpring(mouseY, { stiffness: 500, damping: 50 });

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className={`
        relative group overflow-hidden 
        bg-gray-900/40 backdrop-blur-xl 
        border border-gray-800 hover:border-green-500/50 
        rounded-3xl p-8 transition-colors duration-500 
        ${className}
      `}
    >
      {/* Animated Spotlight Gradient */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mouseXSpring}px ${mouseYSpring}px, rgba(34, 197, 94, 0.1), transparent 40%)`,
        }}
      />

      {/* Subtle Corner Accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Content Container */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default Card;