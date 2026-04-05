import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  RiFireFill,
  RiCompassDiscoverFill,
  RiCoinFill,
  RiMenuLine,
  RiCloseLine,
  RiHomeLine,
  RiUserLine,
  RiBarChartLine,
  RiLogoutBoxLine,
  RiArrowRightLine,
  RiSparklingLine
} from "react-icons/ri";

import { usePoints } from "../context/PointsContext";
import { useStreak } from "../context/StreakContext";

const Navbar = ({ isDashboard, isSidebarOpen, setIsSidebarOpen }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading, logout, isAuthenticated } = useAuth();

  const { points } = usePoints();
  const { currentStreak } = useStreak();

  const handleLogin = () => navigate("/login");
  const handleSignup = () => navigate("/signup");

  const UserDropdown = () => (
    <AnimatePresence>
      {isDropdownOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.6, 1] }}
          className="absolute right-0 mt-3 w-56 bg-[#2a2a2a]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#3a3a3a]/50 overflow-hidden"
        >
          {/* User Info Header */}
          <div className="px-4 py-4 bg-gradient-to-r from-[#ff9d54]/10 to-[#ff8a30]/10 border-b border-[#3a3a3a]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff9d54] to-[#ff8a30] rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {user?.name || user?.email?.split("@")[0]}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {[
              { label: "Dashboard", path: "/dashboard", icon: RiHomeLine },
              { label: "Profile", path: "/profile", icon: RiUserLine },
              { label: "Progress", path: "/progress", icon: RiBarChartLine },
            ].map((item) => (
              <motion.button
                key={item.path}
                whileHover={{ x: 4, backgroundColor: "rgba(255, 157, 84, 0.1)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  navigate(item.path);
                  setIsDropdownOpen(false);
                }}
                className="w-full px-4 py-3 text-sm text-white hover:bg-[#ff9d54]/10 flex items-center gap-3 transition-colors duration-200"
              >
                <item.icon className="text-[#ff9d54] text-lg" />
                {item.label}
                <RiArrowRightLine className="ml-auto text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}
          </div>

          {/* Logout Button */}
          <div className="border-t border-[#3a3a3a]/50">
            <motion.button
              whileHover={{ x: 4, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                logout();
                setIsDropdownOpen(false);
              }}
              className="w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors duration-200"
            >
              <RiLogoutBoxLine className="text-lg" />
              Logout
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="bg-[#1c1b1b]/90 backdrop-blur-xl border-b border-[#3a3a3a]/50 px-4 sm:px-6 md:px-8 py-4
          flex justify-between items-center fixed top-0 w-full z-[999] shadow-2xl shadow-black/20"
      >
        <div className="flex items-center gap-3 md:gap-4">
          {isDashboard && (
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 157, 84, 0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-[#ff9d54]/10 rounded-xl transition-all duration-300 border border-transparent hover:border-[#ff9d54]/20"
            >
              {isSidebarOpen ? (
                <RiCloseLine className="w-6 h-6 text-[#ff9d54]" />
              ) : (
                <RiMenuLine className="w-6 h-6 text-[#ff9d54]" />
              )}
            </motion.button>
          )}

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 md:gap-3 cursor-pointer group"
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
          >
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#ff9d54] via-[#ff8a30] to-[#ff7a20] rounded-xl
                flex items-center justify-center shadow-lg shadow-[#ff9d54]/30 group-hover:shadow-[#ff9d54]/50 transition-all duration-300"
            >
              <RiCompassDiscoverFill className="text-white text-xl md:text-2xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
            </motion.div>

            <div className="flex flex-col">
              <motion.span
                className="text-lg md:text-xl font-bold bg-gradient-to-r from-[#ff9d54] via-[#ff8a30] to-[#ff9d54]
                bg-clip-text text-transparent bg-size-200 animate-gradient-x"
              >
                UniSkills
              </motion.span>
              <span className="text-xs text-gray-400 hidden md:block">AI Learning Platform</span>
            </div>
          </motion.div>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-2 md:gap-6">
            {/* Enhanced Streak Counter */}
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-[#ff9d54]/20 to-[#ff8a30]/20
                px-3 py-2 rounded-xl border border-[#ff9d54]/30 backdrop-blur-sm hover:border-[#ff9d54]/50 transition-all duration-300"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <RiFireFill className="text-[#ff9d54] text-lg" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm">
                  {currentStreak}
                </span>
                <span className="text-xs text-gray-400 hidden md:block">streak</span>
              </div>
            </motion.div>

            {/* Enhanced Points Display */}
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-[#ff8a30]/20 to-[#ff9d54]/20
                px-3 py-2 rounded-xl border border-[#ff8a30]/30 backdrop-blur-sm hover:border-[#ff8a30]/50 transition-all duration-300"
            >
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <RiCoinFill className="text-[#ff8a30] text-lg" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm">
                  {points}
                </span>
                <span className="text-xs text-gray-400 hidden md:block">points</span>
              </div>
            </motion.div>

            {/* Enhanced Desktop User Menu */}
            <div className="hidden md:block relative">
              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 cursor-pointer bg-[#2a2a2a]/60 backdrop-blur-sm px-4 py-2 rounded-xl
                hover:bg-[#3a3a3a]/60 border border-[#3a3a3a]/50 hover:border-[#ff9d54]/30 transition-all duration-300"
              >
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#ff9d54] via-[#ff8a30] to-[#ff7a20] rounded-full
                    flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#ff9d54]/30">
                    {user?.name?.[0]?.toUpperCase() ||
                      user?.email?.[0]?.toUpperCase() ||
                      "U"}
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1c1b1b]"></div>
                </div>

                <div className="flex flex-col">
                  <span className="text-white text-sm font-semibold">
                    {user?.name || user?.email?.split("@")[0] || "Loading..."}
                  </span>
                  <span className="text-xs text-gray-400">Online</span>
                </div>

                <motion.svg
                  animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-4 text-gray-400 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </motion.svg>
              </motion.div>
              <UserDropdown />
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="md:hidden p-2 bg-[#2a2a2a] text-[#ff9d54] rounded-lg"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="Menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isDropdownOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </motion.button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleLogin}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 text-white hover:text-[#ff9d54] transition-all duration-300 font-medium
              hover:bg-[#ff9d54]/10 rounded-lg border border-transparent hover:border-[#ff9d54]/20"
            >
              Login
            </motion.button>

            <motion.button
              onClick={handleSignup}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] text-white rounded-xl font-semibold
              shadow-lg shadow-[#ff9d54]/25 hover:shadow-[#ff9d54]/40 transition-all duration-300 flex items-center gap-2"
            >
              <RiSparklingLine className="w-4 h-4" />
              Sign Up
            </motion.button>
          </div>
        )}
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDropdownOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[998]"
            />

            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden fixed top-[60px] left-2 right-2 bg-[#1c1b1b] rounded-xl shadow-xl z-[999]
                border border-[#3a3a3a] overflow-hidden"
            >
              {isAuthenticated ? (
                <div className="divide-y divide-[#3a3a3a]">
                  <div className="p-4 bg-[#2a2a2a]/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-[#ff9d54]/30 rounded-full flex items-center justify-center text-white">
                        {user?.name?.[0]?.toUpperCase() || "👤"}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {user?.name || user?.email?.split("@")[0]}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Add Points and Streak in mobile menu */}
                    <div className="flex gap-4 mt-3">
                      <div className="flex gap-1 items-center bg-[#3a3a3a]/50 px-3 py-1.5 rounded-lg">
                        <RiFireFill className="text-[#ff9d54]" />
                        <span className="text-white">{currentStreak}</span>
                        <span className="text-xs text-gray-400">streak</span>
                      </div>
                      <div className="flex gap-1 items-center bg-[#3a3a3a]/50 px-3 py-1.5 rounded-lg">
                        <RiCoinFill className="text-[#ff9d54]" />
                        <span className="text-white">{points}</span>
                        <span className="text-xs text-gray-400">points</span>
                      </div>
                    </div>
                  </div>

                  {[
                    { label: "Dashboard", path: "/dashboard", icon: "🏠" },
                    { label: "Profile", path: "/profile", icon: "👤" },
                    { label: "Progress", path: "/progress", icon: "📊" },
                  ].map((item) => (
                    <motion.button
                      key={item.path}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        navigate(item.path);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full p-4 text-left text-white hover:bg-[#2a2a2a] flex items-center gap-3
                        active:bg-[#3a3a3a] transition-colors"
                    >
                      <span className="text-xl">{item.icon}</span>
                      {item.label}
                    </motion.button>
                  ))}

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      logout();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full p-4 text-left text-red-400 hover:bg-[#2a2a2a] flex items-center gap-3
                      active:bg-red-900/20 transition-colors"
                  >
                    <span className="text-xl">🚪</span>
                    Logout
                  </motion.button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  <button
                    onClick={() => {
                      handleLogin();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full p-3 bg-[#ff9d54] text-white rounded-lg text-center font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      handleSignup();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full p-3 border border-[#ff9d54] text-[#ff9d54] rounded-lg text-center font-medium"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
