import React from 'react';
import { motion } from 'framer-motion';
import {
  RiCompassDiscoverFill
} from 'react-icons/ri';

const Footer = () => {

  return (
    <footer className="bg-[#1c1b1b]/90 backdrop-blur-xl border-t border-[#3a3a3a]/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
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
              className="w-8 h-8 bg-gradient-to-br from-[#ff9d54] via-[#ff8a30] to-[#ff7a20] rounded-xl
                flex items-center justify-center shadow-lg shadow-[#ff9d54]/30"
            >
              <RiCompassDiscoverFill className="text-white text-lg" />
            </motion.div>
            <div className="text-xl font-bold bg-gradient-to-r from-[#ff9d54] via-[#ff8a30] to-[#ff9d54] bg-clip-text text-transparent">
              UniSkills
            </div>
          </motion.div>

          {/* Copyright */}
          <motion.p
            className="text-center text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            © {new Date().getFullYear()} UniSkills. All rights reserved.
          </motion.p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
