import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { generateQuiz, generateAINudges } from "../config/llm";
import QuizCard from "../components/QuizCard";
import NudgeCard from "../components/NudgeCard";
import { useAuth } from "../context/AuthContext";
import { updateUserProgress, getLearningPaths } from "../config/database";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { useParams, useLocation } from "react-router-dom";
import { saveQuizScore } from "../config/database";
import { updatePoints } from "../config/database";
import PointToast from "../components/PointToast";
import { usePoints } from "../context/PointsContext";
import { useStreak } from "../context/StreakContext";

const Quiz = () => {
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizData, setQuizData] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paths, setPaths] = useState([]);
  const [selectedPathId, setSelectedPathId] = useState("");
  const [selectedPath, setSelectedPath] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(""); // "" instead of "all"
  const [quizContent, setQuizContent] = useState("");
  const { user } = useAuth();
  const [performanceNudges, setPerformanceNudges] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const { refreshStreak } = useStreak();
  const { setPoints } = usePoints();

  // Get parameters from URL if they exist
  const { pathId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const moduleIndex = queryParams.get("module");

  useEffect(() => {
    if (user) {
      fetchPaths();
    }
  }, [user]);

  // Handle URL parameters for direct quiz generation
  useEffect(() => {
    if (pathId && paths.length > 0) {
      setSelectedPathId(pathId);
      const path = paths.find((p) => p.$id === pathId);
      if (path) {
        handlePathChange(path);

        // If module is specified, select it
        if (moduleIndex !== null) {
          const moduleIdx = parseInt(moduleIndex);
          if (
            !isNaN(moduleIdx) &&
            moduleIdx >= 0 &&
            path.modules &&
            path.modules.length > moduleIdx
          ) {
            // Make sure we have valid data before accessing
            if (path.modules[moduleIdx]) {
              setSelectedModule(moduleIdx.toString());

              // Extract the actual module content for the topic
              const module = path.modules[moduleIdx];
              // Use the exact module title as the quiz topic (without any "Module X:" prefix)
              const moduleTitle = module.title || `Module ${moduleIdx + 1}`;
              const cleanTitle = moduleTitle.replace(
                /^Module\s+\d+\s*:\s*/i,
                ""
              );

              // Set the clean title as topic
              setTopic(cleanTitle || path.careerName || "Learning Path");
            }
          }
        }
      }
    }
  }, [pathId, moduleIndex, paths]);

  const fetchPaths = async () => {
    try {
      setLoading(true);
      const response = await getLearningPaths(user.$id);
      console.log("Fetched paths:", response);

      if (response.documents.length > 0) {
        const validatedPaths = response.documents.map((path) => {
          let modules = [];

          try {
            if (Array.isArray(path.modules)) {
              modules = path.modules;
            } else if (typeof path.modules === "string") {
              modules = JSON.parse(path.modules);
            }

            modules = modules.map((module, idx) => {
              if (typeof module === "string") {
                const match = module.match(/Module\s*\d+\s*:\s*(.+)/i);
                const cleanTitle = match ? match[1].trim() : module.trim();
                return {
                  title: cleanTitle,
                  description: `Learn more about ${cleanTitle}`,
                  estimatedTime: "20–30 minutes",
                  content: `This module introduces ${cleanTitle}`,
                };
              } else {
                return {
                  ...module,
                  title: module.title || `Module ${idx + 1}`,
                };
              }
            });
          } catch (e) {
            console.error(
              "Error parsing modules for path:",
              path.careerName,
              e
            );
            modules = [];
          }

          return {
            ...path,
            modules,
            careerName: path.careerName || "Unnamed Path",
          };
        });

        setPaths(validatedPaths);

        if (!pathId && validatedPaths.length > 0) {
          setSelectedPathId(validatedPaths[0].$id);
          handlePathChange(validatedPaths[0]);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching paths:", error);
      setLoading(false);
    }
  };

  const handlePathChange = (path) => {
    if (!path) return;

    setSelectedPath(path);

    let parsedModules = [];
    try {
      if (Array.isArray(path.modules)) {
        parsedModules = path.modules;
      } else if (typeof path.modules === "string") {
        parsedModules = JSON.parse(path.modules);
      }

      parsedModules = parsedModules.map((mod, index) => {
        if (typeof mod === "string") {
          const titleMatch = mod.match(/Module\s*\d+\s*:\s*(.+)/i);
          const title = titleMatch ? titleMatch[1].trim() : mod.trim();
          return { title };
        }
        return {
          ...mod,
          title: mod.title || `Module ${index + 1}`,
        };
      });

      setModules(parsedModules);
      setSelectedModule(""); // Reset on path change
      setTopic(""); // Clear topic until module selected

      const allContent = parsedModules
        .map((module) => {
          const moduleTitle = module.title || "Unnamed Module";
          let content = `${moduleTitle}:\n${module.description || ""}`;

          if (Array.isArray(module.sections)) {
            content +=
              "\n" +
              module.sections
                .map((s) => `${s?.title || ""}: ${s?.content || ""}`)
                .filter(Boolean)
                .join("\n\n");
          } else if (Array.isArray(module.lessons)) {
            content +=
              "\n" +
              module.lessons
                .map((l) => `${l?.title || ""}: ${l?.content || ""}`)
                .filter(Boolean)
                .join("\n\n");
          } else if (module.content) {
            content += "\n" + module.content;
          }

          return content;
        })
        .join("\n\n");

      setQuizContent(allContent);
    } catch (err) {
      console.error("Error parsing modules", err);
      setModules([]);
      setQuizContent("");
      setTopic("");
    }
  };

  const handleModuleChange = (e) => {
    const value = e.target.value;
    setSelectedModule(value);

    if (!selectedPath || !modules.length) return;

    if (value === "") {
      setTopic(""); // reset topic
      return;
    }

    try {
      const index = parseInt(value);
      const module = modules[index];
      if (!module) return;

      const rawTitle = module.title || `Module ${index + 1}`;
      const cleanTitle = rawTitle.replace(/^Module\s+\d+\s*:\s*/i, "");

      setTopic(cleanTitle); // ✅ show just the topic, not whole module title

      // Optionally update quiz content as well
      let content = `${cleanTitle}:\n${module.description || ""}`;
      if (Array.isArray(module.sections)) {
        content +=
          "\n" +
          module.sections
            .map((s) => `${s?.title || ""}: ${s?.content || ""}`)
            .filter(Boolean)
            .join("\n\n");
      } else if (Array.isArray(module.lessons)) {
        content +=
          "\n" +
          module.lessons
            .map((l) => `${l?.title || ""}: ${l?.content || ""}`)
            .filter(Boolean)
            .join("\n\n");
      } else if (module.content) {
        content += "\n" + module.content;
      }

      setQuizContent(content);
    } catch (err) {
      console.error("Failed to process module selection:", err);
      setTopic("");
    }
  };

  const handlePathSelect = (e) => {
    const pathId = e.target.value;
    setSelectedPathId(pathId);

    // Find the selected path object
    const path = paths.find((p) => p.$id === pathId);
    if (path) {
      handlePathChange(path);
    } else {
      setSelectedPath(null);
      setModules([]);
      setQuizContent("");
    }

    // Reset module selection
    setSelectedModule("all");
  };

  const handleGenerateQuiz = async () => {
    if (!topic || numQuestions < 1) {
      alert("Please enter a valid topic and number of questions.");
      return;
    }

    if (!selectedPathId) {
      alert("Please select a learning path to associate with this quiz.");
      return;
    }

    setLoading(true);
    try {
      const quizData = await generateQuiz(topic, numQuestions);

      // Format quizData if needed to match your structure
      const formattedData = {
        topic,
        questions: quizData.questions.map((q) => ({
          question: q.question,
          answers: q.options,
          correctAnswer: [q.correctIndex],

          explanation: q.explanation,
          point: 10,
          questionType: "single",
        })),
      };

      setQuizData(formattedData);
      setUserAnswers({});
      setShowResults(false);
      setScore(0);
      setAccuracy(0);
      setCurrentIndex(0);
      setError(null); // ✅ Clear any previous error
    } catch (error) {
      console.error("Error generating quiz:", error);
      setError("Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    setUserAnswers((prev) => {
      const question = quizData.questions[currentIndex];

      if (
        question.questionType === "single" ||
        question.questionType === "multiple_choice"
      ) {
        return { ...prev, [currentIndex]: [answer] }; // wrap in array
      }

      const updatedAnswers = prev[currentIndex]
        ? prev[currentIndex].includes(answer)
          ? prev[currentIndex].filter((a) => a !== answer)
          : [...prev[currentIndex], answer]
        : [answer];

      return { ...prev, [currentIndex]: updatedAnswers };
    });
  };

  useEffect(() => {
    if (showResults && quizData && user?.$id && selectedPathId) {
      let totalScore = 0;
      let correctCount = 0;

      quizData.questions.forEach((q, index) => {
        const correctAnswer = Array.isArray(q.correctAnswer)
          ? [...q.correctAnswer].sort()
          : [q.correctAnswer];
        const userAnswer = (userAnswers[index] || []).sort();

        if (JSON.stringify(correctAnswer) === JSON.stringify(userAnswer)) {
          totalScore += q.point || 10;
          correctCount++;
        }
      });

      setScore(totalScore);
      const accuracyValue = (
        (correctCount / quizData.questions.length) *
        100
      ).toFixed(2);
      setAccuracy(accuracyValue);

      // ✅ Module title
      const moduleIndex = parseInt(selectedModule);
      const moduleTitle =
        selectedModule === "all"
          ? "All Modules"
          : modules[moduleIndex]?.title || `Untitled Module`;

      // ✅ Career path title
      const selectedPathObj = paths.find((p) => p.$id === selectedPathId);
      const careerName = selectedPathObj?.careerName || "Unknown Career";

      // ✅ Final combined title: e.g. "Frontend Developer - Module 2: HTML Basics"
      const finalModuleName =
        selectedModule === "all"
          ? `${careerName} - All Modules`
          : `${careerName} - Module ${moduleIndex + 1}: ${moduleTitle}`;

      // Save to assessments
      const payload = {
        userID: user.$id,
        pathID: selectedPathId,
        moduleID: selectedModule || "all",
        moduleName: finalModuleName,
        score: totalScore,
        feedback: `Accuracy: ${accuracyValue}%`,
        timestamp: new Date().toISOString(),
      };

      saveQuizScore(payload)
        .then(() => console.log("✅ Quiz score saved!"))
        .catch((err) => console.error("❌ Error saving quiz result:", err));
    }
  }, [
    showResults,
    quizData,
    userAnswers,
    user,
    selectedPathId,
    selectedModule,
    modules,
    paths,
  ]);

  useEffect(() => {
    const generatePerformanceNudges = async () => {
      if (showResults && quizData && user) {
        try {
          const nudges = await generateAINudges(
            user,
            [{ score: score, accuracy: accuracy }],
            selectedPath
          );
          setPerformanceNudges(nudges);
        } catch (error) {
          console.error("Error generating performance nudges:", error);
        }
      }
    };

    generatePerformanceNudges();
  }, [showResults, score, accuracy, user, selectedPath, quizData]);

  const handleShowResults = async () => {
    setShowResults(true);

    const totalScore = score;
    console.log("Total Score:", totalScore);

    console.log("selected module", selectedModule);
    // 🧠 Call only after quiz is finished and results are ready
    try {
      // Calculate accuracy directly here to ensure it's available
      let correctCount = 0;
      quizData.questions.forEach((q, index) => {
        const correctAnswer = Array.isArray(q.correctAnswer)
          ? [...q.correctAnswer].sort()
          : [q.correctAnswer];
        const userAnswer = (userAnswers[index] || []).sort();

        if (JSON.stringify(correctAnswer) === JSON.stringify(userAnswer)) {
          correctCount++;
        }
      });

      const calculatedAccuracy = (
        (correctCount / quizData.questions.length) *
        100
      ).toFixed(2);

      const userScore = correctCount * 10; // Assuming each question is worth 10 points

      // 🟧 Award 10 points for quiz submission (or use any logic you prefer)
      const numericAccuracy = parseFloat(calculatedAccuracy);
      const earned = numericAccuracy === 0 ? 10 : numericAccuracy;

      // Update in Appwrite
      await updatePoints(user.$id, earned);

      // Reflect in frontend instantly
      setPoints((prev) => prev + earned);
      setPointsEarned(earned);
      console.log("Points earned:", earned);
      setShowToast(true);

      await saveQuizScore({
        userID: user.$id,
        pathID: selectedPathId,
        moduleID: selectedModule, // ✅ keep it as index (string/number)
        moduleName:
          modules[selectedModule]?.title ||
          `Module ${parseInt(selectedModule) + 1} `,
        score: userScore,
        feedback: `Accuracy: ${calculatedAccuracy}%`,
        timestamp: new Date().toISOString(),
      });

      refreshStreak();
      console.log("✅ Quiz score saved!");
    } catch (err) {
      console.error("❌ Error saving quiz result:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4 bg-[#1c1b1b]">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-[#3a3a3a] border-t-[#ff9d54] rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-lg font-semibold text-[#ff9d54]">
            Generating Quiz...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-[#1c1b1b] via-[#252525] to-[#1c1b1b] p-4 sm:p-8">
        <motion.div
          className="max-w-2xl mx-auto bg-[#2a2a2a] rounded-2xl shadow-lg p-4 sm:p-8 border border-[#3a3a3a]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] bg-clip-text text-transparent">
            AI-Powered Learning Path Quiz
          </h1>
          <div className="space-y-4">
            {paths.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Learning Path
                </label>
                <select
                  value={selectedPathId}
                  onChange={handlePathSelect}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#3a3a3a] bg-[#1c1b1b] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff9d54] focus:border-transparent text-sm sm:text-base"
                >
                  <option value="">-- Select Learning Path --</option>
                  {paths.map((path) => (
                    <option key={path.$id} value={path.$id}>
                      {path.careerName || "Unnamed Path"}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-red-900/20 p-4 rounded-xl border border-red-900/30">
                <p className="text-red-400 text-sm">
                  You don't have any learning paths yet. Create a learning path
                  first.
                </p>
              </div>
            )}

            {/* Module Selector */}
            {modules.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Module
                </label>
                <select
                  value={selectedModule}
                  onChange={handleModuleChange}
                  className="w-full px-4 py-3 border-2 border-[#3a3a3a] bg-[#1c1b1b] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff9d54] focus:border-transparent text-sm sm:text-base"
                >
                  <option value="">-- Select Module --</option>
                  {modules.map((module, index) => (
                    <option key={index} value={index}>
                      Module {index + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quiz Topic */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quiz Topic
              </label>
              <input
                type="text"
                value={topic}
                readOnly
                className="w-full px-4 py-3 border-2 border-[#3a3a3a] bg-[#1c1b1b] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff9d54] focus:border-transparent text-sm sm:text-base"
                placeholder={
                  !selectedModule
                    ? "Select a module to load topic"
                    : "Auto-filled from selected module"
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Questions
              </label>
              <input
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                min="1"
                max="10"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#3a3a3a] bg-[#1c1b1b] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff9d54] focus:border-transparent text-sm sm:text-base"
              />
            </div>
            <motion.button
              onClick={handleGenerateQuiz}
              disabled={!selectedPathId || !topic}
              className={`w-full py-3 ${
                !selectedPathId || !topic
                  ? "bg-[#3a3a3a] cursor-not-allowed text-gray-500"
                  : "bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] text-white"
              } rounded-xl font-medium shadow-lg text-sm sm:text-base`}
              whileHover={{ scale: selectedPathId && topic ? 1.02 : 1 }}
              whileTap={{ scale: selectedPathId && topic ? 0.98 : 1 }}
            >
              Generate Quiz
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentIndex];
  const userAnswer = userAnswers[currentIndex] || [];
  const correctAnswer = Array.isArray(currentQuestion.correctAnswer)
    ? currentQuestion.correctAnswer
    : [currentQuestion.correctAnswer];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-[#1c1b1b] via-[#252525] to-[#1c1b1b] p-4 sm:p-8">
      <PointToast
        points={pointsEarned}
        show={showToast}
        onClose={() => setShowToast(false)}
      />

      {!showResults ? (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {topic} Quiz
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-2">
              <span className="text-xs sm:text-sm font-medium text-[#ff9d54] bg-[#ff9d54]/10 px-3 py-1 rounded-full">
                Question {currentIndex + 1} of {quizData.questions.length}
              </span>
              <span className="text-xs sm:text-sm font-medium text-[#ff9d54] bg-[#ff9d54]/10 px-3 py-1 rounded-full">
                Points: {currentQuestion.point}
              </span>
            </div>
          </div>

          <QuizCard
            question={currentQuestion.question}
            answers={currentQuestion.answers}
            selectedAnswers={userAnswers[currentIndex] || []}
            onAnswerSelect={handleAnswerSelect}
            questionType={currentQuestion.questionType}
            showResults={false}
          />

          <div className="flex justify-between mt-6">
            <motion.button
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              className={`flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full ${
                currentIndex === 0
                  ? "bg-[#3a3a3a]/50 text-gray-500 cursor-not-allowed"
                  : "bg-[#ff9d54] text-white"
              }`}
              disabled={currentIndex === 0}
              whileHover={{ scale: currentIndex === 0 ? 1 : 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <AiOutlineLeft className="text-base sm:text-lg" />
            </motion.button>

            {/* Next Button */}
            <motion.button
              onClick={() =>
                setCurrentIndex((prev) =>
                  Math.min(prev + 1, quizData.questions.length - 1)
                )
              }
              className={`flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full ${
                currentIndex === quizData.questions.length - 1
                  ? "bg-[#3a3a3a]/50 text-gray-500 cursor-not-allowed"
                  : "bg-[#ff9d54] text-white"
              }`}
              disabled={currentIndex === quizData.questions.length - 1}
              whileHover={{
                scale: currentIndex === quizData.questions.length - 1 ? 1 : 1.1,
              }}
              whileTap={{ scale: 0.9 }}
            >
              <AiOutlineRight className="text-base sm:text-lg" />
            </motion.button>
          </div>

          {currentIndex === quizData.questions.length - 1 && (
            <div className="flex justify-center mt-6">
              <motion.button
                onClick={handleShowResults}
                className="bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] text-white text-lg sm:text-2xl px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg w-full sm:w-auto"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0px 4px 10px rgba(255, 157, 84, 0.5)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                Submit
              </motion.button>
            </div>
          )}
        </div>
      ) : (
        <motion.div
          className="max-w-4xl mx-auto space-y-6 sm:space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Results Summary */}
          <div className="bg-[#2a2a2a] rounded-2xl shadow-lg p-4 sm:p-8 border border-[#3a3a3a]">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] bg-clip-text text-transparent mb-4">
              Quiz Results
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#1c1b1b] p-4 rounded-xl border border-[#3a3a3a]">
                <p className="text-xs sm:text-sm text-[#ff9d54]">Total Score</p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {score} / {quizData.questions.length * 10}
                </p>
              </div>
              <div className="bg-[#1c1b1b] p-4 rounded-xl border border-[#3a3a3a]">
                <p className="text-xs sm:text-sm text-[#ff9d54]">Accuracy</p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {accuracy}%
                </p>
              </div>
              <div className="bg-[#1c1b1b] p-4 rounded-xl border border-[#3a3a3a]">
                <p className="text-xs sm:text-sm text-[#ff9d54]">Questions</p>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {quizData.questions.length}
                </p>
              </div>
            </div>
          </div>

          {/* Performance Nudges */}
          {showResults && performanceNudges.length > 0 && (
            <motion.div
              className="max-w-4xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {performanceNudges.map((nudge, index) => (
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

          {/* Detailed Review */}
          <div className="space-y-4 sm:space-y-6">
            {quizData.questions.map((q, index) => (
              <QuizCard
                key={index}
                question={q.question}
                answers={q.answers}
                selectedAnswers={userAnswers[index] || []}
                onAnswerSelect={() => {}}
                questionType={q.questionType}
                showResults={true}
                correctAnswer={q.correctAnswer}
                explanation={q.explanation}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pb-8">
            <motion.button
              onClick={() => setQuizData(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] text-white rounded-xl font-medium shadow-lg text-sm sm:text-base w-full sm:w-auto"
            >
              Start New Quiz
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Quiz;
