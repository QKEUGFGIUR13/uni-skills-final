import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateFlashcards, generateAINudges } from "../config/llm";
import { updateUserProgress } from "../config/database";
import { useAuth } from "../context/AuthContext";
import { getLearningPaths } from "../config/database"; // Import this too if not already
import NudgeCard from "../components/NudgeCard";

const CustomCard = ({ card, isFlipped, onClick }) => (
  <div className="relative w-full h-[400px] cursor-pointer" onClick={onClick}>
    <motion.div
      className="absolute w-full h-full"
      initial={false}
      animate={{ rotateX: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6 }}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
    >
      {/* Front of card */}
      <div
        className={`absolute w-full h-full bg-[#2a2a2a] rounded-2xl p-8 shadow-xl border border-[#3a3a3a]
          ${isFlipped ? "backface-hidden" : ""} flex flex-col justify-between`}
      >
        <div className="text-sm text-[#ff9d54] font-semibold">
          Question {card.id}
        </div>
        <div className="text-2xl font-medium text-center text-white">{card.frontHTML}</div>
        <div className="text-sm text-gray-400 text-center">Click to flip ↓</div>
      </div>

      {/* Back of card */}
      <div
        className={`absolute w-full h-full bg-[#1c1b1b] rounded-2xl p-8 shadow-xl border border-[#3a3a3a]
          ${!isFlipped ? "backface-hidden" : ""} flex flex-col justify-between`}
        style={{ transform: "rotateX(180deg)" }}
      >
        <div className="text-sm text-[#ff9d54] font-semibold">Answer</div>
        <div className="text-base md:text-lg text-center text-white">{card.backHTML}</div>
        <div className="text-sm text-gray-400 text-center">Click to flip ↑</div>
      </div>
    </motion.div>
  </div>
);

const Flashcards = () => {
  const [topic, setTopic] = useState("");
  const [numCards, setNumCards] = useState(5);
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [paths, setPaths] = useState([]);
  const [selectedPathId, setSelectedPathId] = useState("");
  const [selectedPath, setSelectedPath] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("all");
  const [flashcardNudges, setFlashcardNudges] = useState([]);

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const response = await getLearningPaths(user?.$id);
        const processed = response.documents.map(path => {
          let modules = [];
          if (typeof path.modules === "string") {
            try {
              modules = JSON.parse(path.modules).map((m, idx) => ({
                title: typeof m === "string" ? m.split(":").pop().trim() : m.title || `Module ${idx + 1}`
              }));
            } catch {
              modules = [];
            }
          } else if (Array.isArray(path.modules)) {
            modules = path.modules.map((m, idx) => ({
              title: typeof m === "string" ? m.split(":").pop().trim() : m.title || `Module ${idx + 1}`
            }));
          }

          return { ...path, modules };
        });

        setPaths(processed);
      } catch (err) {
        console.error("Failed to fetch paths:", err);
      }
    };

    if (user?.$id) fetchPaths();
  }, [user]);

  const handlePathChange = (e) => {
    const id = e.target.value;
    setSelectedPathId(id);
    const path = paths.find(p => p.$id === id);
    setSelectedPath(path || null);
    setModules(path?.modules || []);
    setSelectedModule("all");
    setTopic("");
  };

  const handleModuleChange = (e) => {
    const index = e.target.value;
    setSelectedModule(index);

    if (index === "all" || !modules[index]) {
      setTopic(selectedPath?.careerName || "");
    } else {
      setTopic(modules[index].title || "");
    }
  };


  const fetchFlashcards = async () => {
    if (!topic.trim() || numCards < 1) {
      return alert("Please enter a valid topic and number of flashcards!");
    }

    setLoading(true);
    setError(null);
    setCurrentCardIndex(0);
    setIsFlipped(false);

    try {
      const generatedCards = await generateFlashcards(topic, numCards);
      setCards(generatedCards);
      
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load flashcards. Try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentCardIndex < cards.length - 1) {
      setIsFlipped(false);
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setIsFlipped(false);
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  // Add new animation variants
  const cardVariants = {
    front: {
      rotateY: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    back: {
      rotateY: 180,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const controlsVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  useEffect(() => {
    const generateFlashcardNudges = async () => {
      if (user && selectedPath && cards.length > 0) {
        try {
          const nudges = await generateAINudges(
            user,
            [], // No assessment data for flashcards
            {
              ...selectedPath,
              flashcardCount: cards.length,
              activity: "flashcards"
            }
          );
          setFlashcardNudges(nudges);
        } catch (error) {
          console.error("Error generating flashcard nudges:", error);
        }
      }
    };

    generateFlashcardNudges();
  }, [cards, user, selectedPath]);

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-gradient-to-br from-[#1c1b1b] via-[#252525] to-[#1c1b1b] p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Enhanced Header Section */}
        <motion.div
          className="space-y-4 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-[#ff9d54]/10 to-[#ff8a30]/10 text-[#ff9d54]">
            <span className="w-2 h-2 bg-[#ff9d54] rounded-full animate-pulse"></span>
            AI-Powered Flashcards
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] bg-clip-text text-transparent">
            Interactive Flashcards
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Generate personalized AI-powered flashcards to enhance your learning experience
          </p>
        </motion.div>

        {paths.length === 0 && (
          <div className="bg-red-900/20 border border-red-900/30 text-red-400 px-4 py-3 rounded-xl flex items-start gap-3 mb-6">
            <svg
              className="w-5 h-5 mt-1 flex-shrink-0 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 
                1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 
                0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="font-medium text-red-400">No Learning Path Found</p>
              <p className="text-sm text-red-400/80">
                Please create a learning path first to generate flashcards for a topic.
              </p>
            </div>
          </div>
        )}


        {/* Enhanced Input Section */}
        <motion.div
          className="bg-[#2a2a2a]/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#3a3a3a] p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,auto] gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#ff9d54] rounded-full"></span>
                Topic
              </label>
              {/* Select Path */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Select Learning Path</label>
                <select
                  value={selectedPathId}
                  onChange={handlePathChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#3a3a3a] bg-[#1c1b1b] text-white focus:ring-2 focus:ring-[#ff9d54] outline-none"
                >
                  <option value="">-- Select Learning Path --</option>
                  {paths.map((path) => (
                    <option key={path.$id} value={path.$id}>
                      {path.careerName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Module */}
              {modules.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Select Module</label>
                  <select
                    value={selectedModule}
                    onChange={handleModuleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#3a3a3a] bg-[#1c1b1b] text-white focus:ring-2 focus:ring-[#ff9d54] outline-none"
                  >
                    <option value="all">All Modules</option>
                    {modules.map((mod, idx) => (
                      <option key={idx} value={idx.toString()}>
                        Module {idx + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Topic (auto-filled) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Flashcard Topic</label>
                <input
                  type="text"
                  value={topic}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl bg-[#1c1b1b] border-2 border-[#3a3a3a] text-white focus:ring-2 focus:ring-[#ff9d54] outline-none"
                  placeholder="Select a module to auto-fill"
                />
              </div>

            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#ff9d54] rounded-full"></span>
                Cards
              </label>
              <div className="relative flex items-center">
                <button 
                  onClick={() => setNumCards(prev => Math.max(1, prev - 1))}
                  className="absolute left-0 w-10 h-full flex items-center justify-center text-white bg-[#3a3a3a] rounded-l-xl border-r border-[#1c1b1b] hover:bg-[#444] transition-colors"
                >
                  <span className="text-xl font-bold">−</span>
                </button>
                <input
                  type="number"
                  value={numCards}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= 20) {
                      setNumCards(value);
                    } else if (e.target.value === '') {
                      setNumCards(1);
                    }
                  }}
                  min="1"
                  max="20"
                  className="w-full px-12 py-3 text-center rounded-xl bg-[#1c1b1b] border-2 border-[#3a3a3a] text-white focus:border-[#ff9d54] focus:ring-4 focus:ring-[#ff9d54]/20 transition-all outline-none"
                />
                <button 
                  onClick={() => setNumCards(prev => Math.min(20, prev + 1))}
                  className="absolute right-0 w-10 h-full flex items-center justify-center text-white bg-[#3a3a3a] rounded-r-xl border-l border-[#1c1b1b] hover:bg-[#444] transition-colors"
                >
                  <span className="text-xl font-bold">+</span>
                </button>
                <div className="absolute right-14 text-xs text-[#ff9d54]">
                  1-20 cards
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <motion.button
                onClick={fetchFlashcards}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full md:w-auto px-6 py-3 rounded-xl font-medium text-white shadow-lg transition-all
                  ${loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] hover:shadow-[#ff9d54]/20'
                  }`}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    Generate Cards
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </span>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Flashcard Display */}
        {cards.length > 0 && !loading && (
          <motion.div
            className="w-full flex flex-col items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-full max-w-2xl mx-auto">
              <div className="relative flex flex-col items-center">
                <CustomCard
                  card={cards[currentCardIndex]}
                  isFlipped={isFlipped}
                  onClick={() => setIsFlipped(!isFlipped)}
                />

                {/* Navigation Controls */}
                <div className="flex justify-between items-center w-full mt-8 px-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrev}
                    disabled={currentCardIndex === 0}
                    className="px-6 py-3 bg-[#3a3a3a] text-white rounded-xl disabled:opacity-50 
                      hover:bg-[#444444] transition-colors"
                  >
                    Previous
                  </motion.button>
                  <div className="text-[#ff9d54] font-medium bg-[#3a3a3a] px-4 py-2 rounded-lg">
                    {currentCardIndex + 1} / {cards.length}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    disabled={currentCardIndex === cards.length - 1}
                    className="px-6 py-3 bg-[#3a3a3a] text-white rounded-xl disabled:opacity-50 
                      hover:bg-[#444444] transition-colors"
                  >
                    Next
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Add nudges section after the cards are displayed */}
        {cards.length > 0 && !loading && flashcardNudges.length > 0 && (
          <motion.div
            className="w-full max-w-2xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="col-span-full text-lg font-medium text-[#ff9d54] mb-2">Learning Insights</h3>
            {flashcardNudges.map((nudge, index) => (
              <NudgeCard
                key={index}
                text={nudge.text}
                type={nudge.type}
                icon={nudge.icon}
                elevated={true}
              />
            ))}
          </motion.div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-900/20 border border-red-900/30 text-red-400 px-4 py-3 rounded-xl text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Add this to your global CSS
const styles = `
.backface-hidden {
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
`;

export default Flashcards;
