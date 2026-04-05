import { useEffect } from "react";
import { RiCoinFill, RiFireFill, RiStarLine } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";

const PointToast = ({ points = 5, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose(); // Auto-close after 1s
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  // Reduced number of confetti particles
  const confetti = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 30 - 15,
    size: Math.random() * 6 + 3,
    opacity: Math.random() * 0.5 + 0.5,
    color: i % 2 === 0 ? "#ff9d54" : "#FBBF24",
  }));

  // Simpler emoji selection
  const emoji = ["🔥", "✨", "🚀"][Math.floor(Math.random() * 3)];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 p-8 
            bg-[#1a1a1a] border-[3px] border-[#ff9d54] rounded-3xl 
            shadow-[0_0_20px_rgba(255,157,84,0.3)] text-center text-white 
            flex flex-col items-center max-w-xs sm:max-w-sm w-full"
        >
          {/* Simplified confetti animation */}
          <div className="absolute inset-0 overflow-hidden">
            {confetti.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ 
                  x: `${particle.x}%`, 
                  y: "-10%", 
                  opacity: 0
                }}
                animate={{ 
                  y: `${particle.y + 80}%`,
                  opacity: [0, particle.opacity, 0]
                }}
                transition={{ 
                  duration: 0.8,
                  ease: "easeOut"
                }}
                className="absolute"
                style={{
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  borderRadius: "50%",
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Top stars */}
            <div className="absolute -top-5 -left-4">
              <RiStarLine className="text-[#FBBF24] text-lg" />
            </div>
            <div className="absolute -top-6 right-0">
              <RiStarLine className="text-[#ff9d54] text-xl" />
            </div>

            {/* Coin icon with pulse */}
            <div className="relative mb-4">
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] 
                  flex items-center justify-center shadow-lg shadow-[#ff9d54]/20"
              >
                <RiCoinFill className="text-white text-4xl" />
              </motion.div>
              
              {/* Simplified pulse effect */}
              <motion.div
                initial={{ opacity: 0.5, scale: 0.9 }}
                animate={{ 
                  opacity: 0,
                  scale: 1.3
                }}
                transition={{ 
                  duration: 1,
                  repeat: 1
                }}
                className="absolute inset-0 rounded-full bg-[#ff9d54]/30"
              />
            </div>

            <div className="space-y-3 w-full">
              {/* Points display */}
              <div className="flex items-center justify-center gap-2">
                <motion.h3 
                  className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff9d54] to-[#ff8a30]"
                >
                  +{points}
                </motion.h3>
                <span className="text-xl font-medium text-white">Points!</span>
                <span className="text-2xl ml-0.5">{emoji}</span>
              </div>

              {/* Divider */}
              <div className="w-2/3 h-[2px] bg-gradient-to-r from-transparent via-[#ff9d54]/30 to-transparent mx-auto my-2"></div>

              {/* Motivational message */}
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[#ff9d54]/10 rounded-xl">
                <RiFireFill className="text-[#ff9d54] text-xl" />
                <p className="text-base font-medium text-gray-200">
                  Keep up the great work!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PointToast;
