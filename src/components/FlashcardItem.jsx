import React from 'react';
import { motion } from 'framer-motion';
import { RiArrowLeftRightLine, RiLightbulbLine, RiCheckLine } from 'react-icons/ri';

const FlashcardItem = ({ card, isFlipped, onClick, onMark, isMarked }) => {
  return (
    <motion.div
      className="perspective-1000 w-full h-[400px] cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="relative w-full h-full transition-transform duration-500 transform-style-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Front of card */}
        <div className={`absolute w-full h-full backface-hidden
          ${isFlipped ? 'pointer-events-none' : ''}
          bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 sm:p-8
          shadow-lg border border-blue-100/30 flex flex-col justify-between`}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-sm text-blue-600 font-medium px-3 py-1 bg-blue-100/50 rounded-full">
                Question {card.id}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onMark(card.id);
                }}
                className={`p-2 rounded-full transition-colors ${
                  isMarked 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                }`}
              >
                {isMarked ? <RiCheckLine /> : <RiLightbulbLine />}
              </motion.button>
            </div>
            <div className="text-xl sm:text-2xl font-medium text-center text-gray-800">
              {card.frontHTML}
            </div>
          </div>
          
          <div className="flex justify-center">
            <motion.div
              className="flex items-center gap-2 text-sm text-gray-500"
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <RiArrowLeftRightLine />
              <span>Tap to flip</span>
            </motion.div>
          </div>
        </div>

        {/* Back of card */}
        <div className={`absolute w-full h-full backface-hidden rotate-y-180
          ${!isFlipped ? 'pointer-events-none' : ''}
          bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8
          shadow-lg border border-blue-100/30 flex flex-col justify-between`}
        >
          <div className="space-y-4">
            <span className="text-sm text-blue-600 font-medium px-3 py-1 bg-blue-100/50 rounded-full">
              Answer
            </span>
            <div className="text-base sm:text-lg text-center text-gray-800 prose prose-blue max-w-none">
              {card.backHTML}
            </div>
          </div>

          <div className="flex justify-center">
            <motion.div
              className="flex items-center gap-2 text-sm text-gray-500"
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <RiArrowLeftRightLine />
              <span>Tap to flip back</span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FlashcardItem;
