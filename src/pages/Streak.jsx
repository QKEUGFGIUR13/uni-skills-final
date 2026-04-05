import React, { useState, useEffect } from "react";
import {
  format,
  parseISO,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { RiFireFill, RiTrophyLine } from "react-icons/ri";
import { motion } from "framer-motion";
import { getStreakData } from "../config/database";
import { useAuth } from "../context/AuthContext";
import CustomCalendar from "../components/CustomerCalendar";
import { useStreak } from "../context/StreakContext";

const QuizStreak = ({ quizScores }) => {
  const [quizDates, setQuizDates] = useState(new Set());
  // const [currentStreak, setCurrentStreak] = useState(0);
  // const [longestStreak, setLongestStreak] = useState(0);
  const { currentStreak, longestStreak } = useStreak();

  const { user } = useAuth();
  const [streakDates, setStreakDates] = useState(new Set());

  useEffect(() => {
    const fetchStreak = async () => {
      const data = await getStreakData(user.$id);

      setStreakDates(data); // ✅ send array directly
    };
    fetchStreak();
  }, [user]);

  // const calculateStreaks = (dates) => {
  //   if (!dates || dates.length === 0) {
  //     setCurrentStreak(0);
  //     setLongestStreak(0);
  //     return;
  //   }

  //   // Sort and ensure unique dates
  //   const sorted = [...new Set(dates)].sort();
  //   const today = format(new Date(), "yyyy-MM-dd");

  //   let longest = 1;
  //   let current = 0;
  //   let temp = 1;

  //   for (let i = 1; i < sorted.length; i++) {
  //     const prev = parseISO(sorted[i - 1]);
  //     const curr = parseISO(sorted[i]);
  //     const diff = differenceInDays(curr, prev);

  //     if (diff === 1) {
  //       temp++;
  //     } else if (diff > 1) {
  //       longest = Math.max(longest, temp);
  //       temp = 1;
  //     }
  //   }
  //   longest = Math.max(longest, temp); // final check

  //   // Calculate current streak ending at today
  //   let currStreak = 0;
  //   for (let i = sorted.length - 1; i >= 0; i--) {
  //     const day = parseISO(sorted[i]);
  //     const diff = differenceInDays(new Date(today), day);

  //     if (diff === currStreak) {
  //       currStreak++;
  //     } else {
  //       break;
  //     }
  //   }

  //   setCurrentStreak(currStreak);
  //   setLongestStreak(longest);
  // };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#ff9d54]/10  rounded-2xl p-4 md:p-8 shadow-xl border border-orange-300/45 relative overflow-hidden"
    >
      <div className="relative">
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
            Learning Streak
          </h2>
          <p className="text-orange-400 text-sm md:text-base">
            Track your daily learning progress
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-zinc-900 p-4 rounded-xl border border-zinc-600"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-200 rounded-lg">
                <RiFireFill className="text-2xl text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-orange-400 font-medium">
                  Current Streak
                </p>
                <p className="text-2xl font-bold text-orange-400">
                  {currentStreak} Days
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="bg-zinc-900 p-4 rounded-xl border border-zinc-600"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-200 rounded-lg">
                <RiTrophyLine className="text-2xl text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-orange-400 font-medium">
                  Best Streak
                </p>
                <p className="text-2xl font-bold text-orange-400">
                  {longestStreak} Days
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <CustomCalendar streakDates={streakDates} />
      </div>
    </motion.div>
  );
};

export default QuizStreak;
