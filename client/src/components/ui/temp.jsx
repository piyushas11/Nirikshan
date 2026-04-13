import React from "react";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* Brand Logo */}
        <div className="cursor-pointer">
          <h1 className="text-2xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent tracking-tight">
            Nirikshan 360
          </h1>
        </div>

        {/* Navigation Links - Hidden on small screens */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-green-400 transition-colors">Features</a>
          <a href="#solutions" className="hover:text-green-400 transition-colors">Solutions</a>
          <a href="#pricing" className="hover:text-green-400 transition-colors">Pricing</a>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          {/* Login - Subtle Ghost Button */}
          <button className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 transition-colors">
            Log in
          </button>

          {/* Sign Up - High Contrast Button */}
          <button className="text-sm font-bold text-black bg-white hover:bg-green-400 px-5 py-2.5 rounded-lg transition-all active:scale-95 shadow-lg shadow-white/5">
            Sign Up
          </button>
          
          {/* Mobile Menu (Visible only on mobile) */}
          <button className="md:hidden ml-2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;