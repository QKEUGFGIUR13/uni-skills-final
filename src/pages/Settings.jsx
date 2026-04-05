import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  RiUserLine,
  RiMailLine,
  RiSaveLine,
  RiEditLine,
  RiMedalLine,
  RiTimeLine,
  RiFireLine,
} from "react-icons/ri";
import { account } from "../config/appwrite";
import QuizStreak from "./Streak";
import { getUserProgress } from "../config/database";
import { getStreakData } from "../config/database";
import { databases } from "../config/database";
import { Query } from "appwrite";

const getAssessmentCount = async (userId) => {
  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const ASSESSMENTS_COLLECTION_ID = import.meta.env
    .VITE_ASSESSMENTS_COLLECTION_ID;

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      ASSESSMENTS_COLLECTION_ID,
      [Query.equal("userID", userId)]
    );

    return response.total; // ✅ Return number of documents
  } catch (error) {
    console.error("❌ Failed to fetch assessment count:", error);
    return 0; // Return 0 if any error
  }
};

const Settings = () => {
  const { user, loading, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [quizScores, setQuizScores] = useState([]);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [updateStatus, setUpdateStatus] = useState({ type: "", message: "" });
  const [streakDates, setStreakDates] = useState(new Set());
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      if (user?.$id) {
        const result = await getAssessmentCount(user.$id);
        setCount(result);
      }
    };
    fetchCount();
  }, [user]);

  useEffect(() => {
    const fetchStreak = async () => {
      const data = await getStreakData(user.$id);
      console.log("Fetched streak data:", data);
      setStreakDates(data); // ✅ send array directly
    };
    fetchStreak();
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserProgress();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateStatus({ type: "loading", message: "Updating profile..." });

    try {
      if (formData.name !== user.name) {
        await account.updateName(formData.name);
        // Get updated user data
        const updatedUser = await account.get();
        updateUser(updatedUser);
        setIsEditing(false);

        setUpdateStatus({
          type: "success",
          message: "Profile updated successfully!",
        });
      }

      setTimeout(() => setUpdateStatus({ type: "", message: "" }), 3000);
    } catch (error) {
      console.error("Update error:", error);
      setUpdateStatus({
        type: "error",
        message: error.message || "Failed to update profile",
      });
    }
  };

  const fetchUserProgress = async () => {
    try {
      const progress = await getUserProgress(user.$id);

      // Ensure quizScores is safely parsed
      let parsedQuizScores = [];
      if (progress.quizScores) {
        try {
          parsedQuizScores = Array.isArray(progress.quizScores)
            ? progress.quizScores // If already an array, use it
            : JSON.parse(progress.quizScores); // Otherwise, parse it
        } catch (error) {
          console.error("Error parsing quizScores JSON:", error);
        }
      }

      setQuizScores(parsedQuizScores);
    } catch (error) {
      console.error("Error fetching user progress:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 md:pb-16 rounded-2xl bg-gradient-to-br from-[#1c1b1b] to-[#252525] p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-8"
      >
        {/* Profile Card */}
        <motion.div className="bg-[#2a2a2a]/70 backdrop-blur-sm rounded-2xl p-3.5 md:p-8 shadow-xl border border-[#3a3a3a]">
          <div className="flex items-center justify-between mb-8 ">
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 flex items-center gap-2 text-[#ff9d54] hover:bg-[#3a3a3a] rounded-lg transition-colors"
            >
              <RiEditLine />
              {isEditing ? "Cancel" : "Edit Profile"}
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#ff9d54] to-[#ff8a30] text-white flex items-center justify-center text-3xl font-bold rounded-2xl">
                {formData.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400">Member since</p>
                <p className="text-white">
                  {new Date(user?.$createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                  <RiUserLine />
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isEditing
                      ? "border-[#3a3a3a]"
                      : "border-transparent bg-[#1c1b1b]"
                  } focus:border-[#ff9d54] focus:ring-2 focus:ring-[#ff9d54]/20 outline-none transition-all bg-[#2a2a2a] text-white`}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                  <RiMailLine />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 rounded-xl bg-[#1c1b1b] border border-transparent text-gray-400"
                />
              </div>
            </div>

            {/* Status Message */}
            <AnimatePresence>
              {updateStatus.message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-xl ${
                    updateStatus.type === "error"
                      ? "bg-red-900/20 text-red-400"
                      : updateStatus.type === "success"
                      ? "bg-green-900/20 text-green-400"
                      : "bg-[#ff9d54]/10 text-[#ff9d54]"
                  }`}
                >
                  {updateStatus.message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save Button */}
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] text-white rounded-xl shadow-lg hover:shadow-[#ff9d54]/20 transition-all flex items-center justify-center gap-2"
                  >
                    <RiSaveLine />
                    Save Changes
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mt-8 space-y-6"
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-[#2a2a2a]/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-[#3a3a3a]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#ff9d54]/20 rounded-lg">
                <RiMedalLine className="text-[#ff9d54] text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Quizzes given</p>
                <p className="text-xl font-bold text-[#ff9d54]">{count}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="bg-[#2a2a2a]/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-[#3a3a3a]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#ff9d54]/20 rounded-lg">
                <RiFireLine className="text-[#ff9d54] text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Streak</p>
                <p className="text-xl font-bold text-[#ff9d54]">
                  {streakDates.length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Streak Calendar Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-[#2a2a2a]/70 backdrop-blur-sm rounded-2xl p-3 md:p-8 shadow-xl border border-[#3a3a3a]"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="md:text-3xl text-xl font-bold bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] bg-clip-text text-transparent">
              Your Learning Streak
            </h2>
            <div className="flex items-center gap-2 text-sm md:text-2xl text-[#ff9d54] bg-[#ff9d54]/10 px-1 md:px-3 py-1 md:py-2 rounded-md md:rounded-full">
              <RiFireLine className="text-orange-500" />
              <span>Keep it up!</span>
            </div>
          </div>
          <div className="flex justify-center mb-3 md:mb-8">
            <QuizStreak quizScores={quizScores} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Settings;
