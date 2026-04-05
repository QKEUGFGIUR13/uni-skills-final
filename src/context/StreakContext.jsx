// src/context/StreakContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { getStreakData } from "../config/database";
import { format, parseISO, differenceInDays } from "date-fns";
import { useAuth } from "./AuthContext";

const StreakContext = createContext();

export const StreakProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  const calculateStreaks = (dates) => {
    if (!Array.isArray(dates) || dates.length === 0) {
      setCurrentStreak(0);
      setLongestStreak(0);
      return;
    }

    const sorted = [...new Set(dates)].sort();
    const today = format(new Date(), "yyyy-MM-dd");

    let longest = 1;
    let temp = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prev = parseISO(sorted[i - 1]);
      const curr = parseISO(sorted[i]);
      const diff = differenceInDays(curr, prev);

      if (diff === 1) {
        temp++;
      } else if (diff > 1) {
        longest = Math.max(longest, temp);
        temp = 1;
      }
    }
    longest = Math.max(longest, temp);

    // Current streak
    let currStreak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const date = parseISO(sorted[i]);
      const diff = differenceInDays(new Date(today), date);

      if (diff === currStreak) {
        currStreak++;
      } else {
        break;
      }
    }

    setCurrentStreak(currStreak);
    setLongestStreak(longest);
  };

  const refreshStreak = async () => {
    if (user?.$id) {
      const dates = await getStreakData(user.$id);
      calculateStreaks(dates);
    }
  };

  useEffect(() => {
    refreshStreak();
  }, [user]);

  return (
    <StreakContext.Provider
      value={{ currentStreak, longestStreak, refreshStreak }}
    >
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = () => useContext(StreakContext);
