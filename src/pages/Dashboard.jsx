import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { account } from "../config/appwrite";
import { databases } from "../config/database";
import { Query } from "appwrite";
import { toast } from "react-hot-toast";
import { generateAINudges } from "../config/llm";
import NudgeCard from "../components/NudgeCard";
import { useStreak } from "../context/StreakContext";

const getAverageAccuracy = async (userId) => {
  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const ASSESSMENTS_COLLECTION_ID = import.meta.env
    .VITE_ASSESSMENTS_COLLECTION_ID;

  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      ASSESSMENTS_COLLECTION_ID,
      [Query.equal("userID", userId)]
    );

    const assessments = res.documents || [];

    const accuracies = assessments
      .map((doc) => {
        const match = doc.feedback?.match(/Accuracy:\s*([\d.]+)%/);
        return match ? parseFloat(match[1]) : null;
      })
      .filter((a) => a !== null);

    if (accuracies.length === 0) return 0;

    const total = accuracies.reduce((sum, acc) => sum + acc, 0);
    const average = total / accuracies.length;

    return Number(average.toFixed(2));
  } catch (error) {
    console.error("❌ Failed to get average accuracy:", error);
    return 0;
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paths, setPaths] = useState([]);
  const [flashcardCount, setFlashcardCount] = useState(0);
  const [quizScores, setQuizScores] = useState([]);
  const { currentStreak } = useStreak();
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [userStats, setUserStats] = useState({
    completedPaths: 0,
    totalModulesCompleted: 0,
    avgQuizScore: 0,
  });
  const [aiNudges, setAiNudges] = useState([]);
  const [averageAccuracy, setAverageAccuracy] = useState(null);

  // Get environment variables for Appwrite database and collections
  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const CAREER_COLLECTION_ID = import.meta.env.VITE_CAREER_PATHS_COLLECTION_ID;
  const ASSESSMENTS_COLLECTION_ID = import.meta.env
    .VITE_ASSESSMENTS_COLLECTION_ID;

  useEffect(() => {
    const fetchAllUserData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchUserProgress(),
          fetchPaths(),
          fetchRecentActivity(),
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllUserData();
  }, []);

  useEffect(() => {
    const fetchAccuracy = async () => {
      if (!user?.$id) return;

      try {
        const avg = await getAverageAccuracy(user.$id);
        console.log("Average Accuracy:", avg);
        setAverageAccuracy(avg);
      } catch (err) {
        console.error("❌ Failed to fetch accuracy:", err);
        setAverageAccuracy(0); // fallback
      }
    };

    fetchAccuracy();
  }, [user]);

  useEffect(() => {
    const fetchNudges = async () => {
      if (user && paths.length > 0 && recentActivity.length > 0) {
        try {
          const nudges = await generateAINudges(user, recentActivity, paths[0]);
          setAiNudges(nudges);
        } catch (error) {
          console.error("Error fetching nudges:", error);
        }
      }
    };

    fetchNudges();
  }, [user, paths, recentActivity]);

  const fetchRecentActivity = async () => {
    try {
      const user = await account.get();

      const assessmentsResponse = await databases.listDocuments(
        DATABASE_ID,
        ASSESSMENTS_COLLECTION_ID,
        [
          Query.equal("userID", user.$id),
          Query.orderDesc("timestamp"),
          Query.limit(5),
        ]
      );

      const activities = assessmentsResponse.documents
        .filter((assessment) => assessment.feedback?.includes("Accuracy")) // ✅ Keep only quizzes
        .map((assessment) => {
          const accuracyMatch = assessment.feedback?.match(
            /Accuracy:\s*(\d+(?:\.\d+)?)%/
          );
          const accuracy = accuracyMatch ? parseFloat(accuracyMatch[1]) : null;

          return {
            type: "quiz",
            moduleID: assessment.moduleID,
            moduleName:
              assessment.moduleName ||
              (assessment.moduleID !== "all"
                ? `Module ${parseInt(assessment.moduleID) + 1}`
                : "All Modules"),
            date: assessment.timestamp,
            score: assessment.score,
            total: 10,
            accuracy,
            feedback: assessment.feedback || null,
          };
        });

      setRecentActivity(activities);

      setRecentActivity(activities);
    } catch (error) {
      console.error("❌ Error fetching recent activity:", error);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const user = await account.get(); // Get logged-in user

      // Fetch assessments for this user
      const assessmentsResponse = await databases.listDocuments(
        DATABASE_ID,
        ASSESSMENTS_COLLECTION_ID,
        [Query.equal("userID", user.$id)]
      );

      // Calculate flashcard count from assessments
      let totalFlashcardsMastered = 0;
      let quizScoresData = [];
      let totalQuizScore = 0;
      let totalQuizCount = 0;

      // Process assessments data
      assessmentsResponse.documents.forEach((assessment) => {
        if (assessment.flashcardsMastered) {
          totalFlashcardsMastered += parseInt(assessment.flashcardsMastered);
        }

        if (assessment.quizScore) {
          const score = parseInt(assessment.quizScore);
          const total = parseInt(assessment.quizTotal || 10);

          // Add quiz data with date and score
          quizScoresData.push({
            moduleID: assessment.moduleID,
            moduleName: assessment.moduleName || "Module",
            score: score,
            total: total,
            accuracy: ((score / total) * 100).toFixed(1),
            date: assessment.completedAt || new Date().toISOString(),
          });

          totalQuizScore += score;
          totalQuizCount += 1;
        }
      });

      setFlashcardCount(totalFlashcardsMastered);
      setQuizScores(quizScoresData);

      // Update user stats
      setUserStats((prev) => ({
        ...prev,
        avgQuizScore:
          totalQuizCount > 0 ? (totalQuizScore / totalQuizCount).toFixed(1) : 0,
      }));
    } catch (error) {
      console.error("Error fetching user progress:", error);
      toast.error("Failed to load user progress");
    }
  };

  const fetchPaths = async () => {
    try {
      const user = await account.get();

      // Query career paths collection for this user
      const response = await databases.listDocuments(
        DATABASE_ID,
        CAREER_COLLECTION_ID,
        [Query.equal("userID", user.$id)]
      );

      if (response.documents.length > 0) {
        // Process the paths data
        const processedPaths = response.documents.map((path) => {
          return {
            ...path,
            modules: path.modules ? JSON.parse(path.modules) : [],
            aiNudges: path.aiNudges ? JSON.parse(path.aiNudges) : [],
            completedModules: path.completedModules
              ? JSON.parse(path.completedModules)
              : [],
          };
        });

        // Filtering paths where progress is less than 100
        const incompletePaths = processedPaths.filter(
          (path) => path.progress < 100
        );

        const completedPaths = processedPaths.filter(
          (path) => path.progress >= 100
        );

        setPaths(incompletePaths);

        // Calculate total completed modules
        const totalModulesCompleted = processedPaths.reduce((total, path) => {
          return total + (path.completedModules?.length || 0);
        }, 0);

        // Update user stats
        setUserStats((prev) => ({
          ...prev,
          completedPaths: completedPaths.length,
          totalModulesCompleted,
        }));
      } else {
        // If no paths found
        setPaths([]);
      }
    } catch (error) {
      console.error("Error fetching paths:", error);
      toast.error("Failed to load learning paths");
    }
  };

  const calculateSuccessRate = () => {
    if (!quizScores.length) return 0; // Avoid division by zero

    const totalAccuracy = quizScores.reduce(
      (sum, score) => sum + parseFloat(score.accuracy),
      0
    );

    return (totalAccuracy / quizScores.length).toFixed(1); // Average accuracy
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Function for card skeletons
  const CardSkeleton = () => (
    <div className="bg-[#2a2a2a]/60 backdrop-blur-sm p-6 rounded-2xl border border-[#3a3a3a] shadow-lg animate-pulse">
      <div className="h-8 w-8 bg-[#3a3a3a] rounded mb-4"></div>
      <div className="h-6 w-3/4 bg-[#3a3a3a] rounded mb-2"></div>
      <div className="h-4 w-1/2 bg-[#3a3a3a] rounded mb-4"></div>
      <div className="h-5 w-1/3 bg-[#3a3a3a] rounded"></div>
    </div>
  );

  const cards = [
    {
      title: "Continue Learning",
      description: "Pick up where you left off",
      icon: "📚",
      gradient: "from-[#ff9d54] to-[#ff8a30]",
      path: "/learning-path",
      stats: `${paths.length} ${
        paths.length === 1 ? "path" : "paths"
      } in progress`,
    },
    {
      title: "Flashcards",
      description: "Review and memorize concepts",
      icon: "🗂️",
      gradient: "from-[#ff9d54] to-[#ff8a30]",
      path: "/flashcards",
      stats: `${flashcardCount} ${
        flashcardCount === 1 ? "card" : "cards"
      } mastered`,
    },
    {
      title: "Quiz Performance",
      description: "Test your knowledge",
      icon: "📊",
      gradient: "from-[#ff9d54] to-[#ff8a30]",
      path: "/quiz",
      stats: `${averageAccuracy}% success rate`,
    },
  ];

  const quickActions = [
    {
      icon: "🎯",
      label: "New Path",
      description: "Start a learning journey",
      path: "/learning-path",
      gradient: "from-[#ff9d54] to-[#ff8a30]",
    },
    {
      icon: "🗂️",
      label: "Flashcards",
      description: "Create study cards",
      path: "/flashcards",
      gradient: "from-[#ff9d54] to-[#ff8a30]",
    },
    {
      icon: "📝",
      label: "Quiz",
      description: "Test your knowledge",
      path: "/quiz",
      gradient: "from-[#ff9d54] to-[#ff8a30]",
    },
    {
      icon: "📈",
      label: "Progress",
      description: "Track your growth",
      path: "/progress",
      gradient: "from-[#ff9d54] to-[#ff8a30]",
    },
  ];

  return (
    <div className="flex-1 max-w-full p-4 md:p-6 overflow-x-hidden bg-gradient-to-br from-[#1c1b1b] to-[#252525] min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Enhanced Welcome Section with Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-[#2a2a2a]/30 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-lg border border-[#3a3a3a]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff9d54]/10 to-[#ff8a30]/10" />
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] bg-clip-text text-transparent">
                  Welcome back, {user?.name?.split(" ")[0] || "Learner"}! 👋
                </h1>
                <p className="text-gray-400">
                  Your learning journey continues today
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="px-4 py-2 bg-[#3a3a3a] text-[#ff9d54] rounded-xl flex items-center gap-2">
                  <span className="text-xl">🔥</span> {currentStreak} day streak
                </div>
                {isLoading ? (
                  <div className="px-4 py-2 bg-[#3a3a3a] rounded-xl w-24 h-9 animate-pulse"></div>
                ) : (
                  <div className="px-4 py-2 bg-[#3a3a3a] text-[#ff9d54] rounded-xl">
                    Avg Quiz: {averageAccuracy}%
                  </div>
                )}
              </div>
            </motion.div>
            {/* Stats cards */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="bg-[#2a2a2a] p-4 rounded-xl shadow-sm">
                <p className="text-gray-400 text-sm">Paths Progress</p>
                <p className="text-2xl font-semibold text-white">
                  {paths.length}
                </p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-xl shadow-sm">
                <p className="text-gray-400 text-sm">Paths Completed</p>
                <p className="text-2xl font-semibold text-white">
                  {userStats.completedPaths}
                </p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-xl shadow-sm">
                <p className="text-gray-400 text-sm">Modules Completed</p>
                <p className="text-2xl font-semibold text-white">
                  {userStats.totalModulesCompleted}
                </p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-xl shadow-sm">
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className="text-2xl font-semibold text-white">
                  {averageAccuracy}%
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              onClick={() => navigate(action.path)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden bg-[#2a2a2a]/60 backdrop-blur-sm p-5 rounded-2xl border border-[#3a3a3a] shadow transition-all duration-300"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
              />
              <div className="relative space-y-3">
                <span className="text-3xl block mb-2">{action.icon}</span>
                <div>
                  <h3 className="font-semibold text-white">{action.label}</h3>
                  <p className="text-sm text-gray-400">{action.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Main content area with conditional loading */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Add nudges section */}
            {!isLoading && aiNudges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {aiNudges.map((nudge, index) => (
                  <NudgeCard
                    key={index}
                    text={nudge.text}
                    type={nudge.type}
                    icon={nudge.icon}
                    actionText={nudge.actionText}
                    onAction={() => navigate("/learning-path")}
                  />
                ))}
              </motion.div>
            )}

            {/* Two-column layout for Paths and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Learning Paths Column */}
              <div className="lg:col-span-3">
                {paths.length > 0 ? (
                  <div className="bg-[#2a2a2a]/70 backdrop-blur-sm p-6 rounded-2xl border border-[#3a3a3a] shadow">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
                      <span className="text-[#ff9d54]">📚</span> Your Learning
                      Paths
                    </h2>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {paths.map((path, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 * index }}
                          className="bg-[#1c1b1b]/70 p-4 rounded-xl hover:bg-[#333333] transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-white">
                              {path.careerName}
                            </h3>
                            <span className="text-sm bg-[#3a3a3a] text-[#ff9d54] px-2.5 py-0.5 rounded-full">
                              {path.progress}%
                            </span>
                          </div>
                          <div className="mt-3 h-2.5 bg-[#3a3a3a] rounded-full">
                            <div
                              className="h-2.5 bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] rounded-full"
                              style={{ width: `${path.progress}%` }}
                            ></div>
                          </div>
                          <div className="mt-4 flex justify-between items-center">
                            <span className="text-xs text-gray-400">
                              {path.completedModules?.length || 0}/
                              {path.modules?.length || 0} modules
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/learning-path/${path.$id}`);
                              }}
                              className="text-sm bg-[#ff9d54] hover:bg-[#ff8a30] text-white px-4 py-1.5 rounded-lg transition-colors"
                            >
                              Continue
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    {paths.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-400">
                          No paths in progress yet
                        </p>
                        <button
                          onClick={() => navigate("/learning-path")}
                          className="mt-4 bg-[#ff9d54] hover:bg-[#ff8a30] text-white px-6 py-2 rounded-lg transition-colors"
                        >
                          Create a Learning Path
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#2a2a2a]/70 backdrop-blur-sm p-6 rounded-2xl border border-[#3a3a3a] shadow text-center py-12">
                    <div className="text-5xl mb-4">🎯</div>
                    <h3 className="text-xl font-medium mb-2 text-white">
                      Start Your Learning Journey
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Create your first learning path and begin your journey to
                      success
                    </p>
                    <button
                      onClick={() => navigate("/learning-path")}
                      className="bg-[#ff9d54] hover:bg-[#ff8a30] text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Create Path
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Activity Column */}
              <div className="lg:col-span-2">
                <div className="bg-[#2a2a2a]/70 backdrop-blur-sm p-6 rounded-2xl border border-[#3a3a3a] shadow">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
                    <span className="text-[#ff9d54]">📊</span> Recent Quiz
                    Activity
                  </h2>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-[#ff9d54] pl-4 py-1"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-white">
                                {activity.type === "quiz"
                                  ? "📝 Quiz"
                                  : "🗂️ Flashcards"}
                              </p>
                              <p className="text-sm text-gray-400">
                                {activity.moduleName || "Untitled Module"}
                              </p>
                            </div>

                            {activity.type === "quiz" && (
                              <div className="flex flex-col items-end text-right">
                                <span className="bg-[#3a3a3a] text-center text-[#ff9d54] text-xs px-2.5 py-1 rounded-full break-words max-w-[120px]">
                                  {activity.feedback || "No feedback"}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(activity.date)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400">
                          No activity recorded yet
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                          Complete quizzes to see your progress
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #333333;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ff9d54;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ff8a30;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
