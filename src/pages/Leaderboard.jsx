import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiMedalFill,
  RiTrophyFill,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCoinFill,
} from "react-icons/ri";
import { useAuth } from "../context/AuthContext";
import { databases } from "../config/database";
import { usePoints } from "../context/PointsContext";
import { Query } from "appwrite";

const Leaderboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const { loading } = useAuth();
  const { points } = usePoints();

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const res = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_USERS_COLLECTION_ID,
          [Query.limit(100)] // 🚀 Fetch up to 100 users
        );

        const sorted = res.documents
          .filter((u) => u.points !== undefined)
          .sort((a, b) => b.points - a.points)
          .map((u, i) => ({ ...u, rank: i + 1 }));
        setUsers(sorted);
        const currentUser = sorted.find((u) => u.userID === user?.$id);
        setCurrentUserRank(currentUser?.rank ?? null);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading && user?.$id) {
      fetchUsers();
    }
  }, [user, loading]);

  const paginatedUsers = users.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const totalPages = Math.ceil(users.length / itemsPerPage);

  console.log("Current User Rank:", currentUserRank);

  // Medal icons for top 3 positions
  const getMedalIcon = (rank) => {
    switch (rank) {
      case 1:
        return <RiTrophyFill className="text-yellow-400" />;
      case 2:
        return <RiMedalFill className="text-gray-300" />;
      case 3:
        return <RiMedalFill className="text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 max-w-4xl mx-auto text-white pb-16"
    >
      {/* Header Section */}
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="mb-8 text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] bg-clip-text text-transparent flex items-center justify-center gap-2">
          <RiTrophyFill className="text-3xl text-[#ff9d54]" />
          Leaderboard
        </h2>
        <p className="text-sm text-zinc-400 mt-2">
          Compete with other learners and rise to the top!
        </p>
      </motion.div>

      {/* Current User Rank Card - Always Visible */}
      {currentUserRank && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 bg-gradient-to-r from-[#2a2a2a] to-[#1f1f1f] rounded-xl overflow-hidden shadow-lg border border-[#ff9d54]/30"
        >
          <div className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-[#ff9d54]/20 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-xl font-bold text-[#ff9d54]">
                  #{currentUserRank}
                </span>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Your Rank</p>
                <h3 className="font-bold text-white">
                  {user?.name || user?.email?.split("@")[0]}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-[#ff9d54]/10 px-3 py-1.5 rounded-full">
              <RiCoinFill className="text-[#ff9d54]" />
              <span className="font-bold">{points}</span>
              <span className="text-xs text-zinc-400 hidden sm:inline">
                points
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard Table */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1c1c1c] border border-zinc-800 rounded-xl overflow-hidden shadow-xl"
      >
        {/* Header Row */}
        <div className="grid grid-cols-12 bg-[#2a2a2a] px-4 py-3 text-sm text-zinc-400 font-medium">
          <div className="col-span-2 sm:col-span-1 text-center">#</div>
          <div className="col-span-6 sm:col-span-7">Player</div>
          <div className="col-span-4 sm:col-span-4 text-right sm:text-center">
            Points
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-12 text-center text-zinc-500">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="inline-block w-6 h-6 border-2 border-[#ff9d54] border-t-transparent rounded-full mb-2"
            />
            <p>Loading leaderboard...</p>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {paginatedUsers.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <p>No users found on the leaderboard yet.</p>
              </div>
            ) : (
              <>
                {/* User Rows */}
                <AnimatePresence>
                  {paginatedUsers.map((u, index) => (
                    <motion.div
                      key={u.$id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: index * 0.05 }}
                      className={`grid grid-cols-12 px-4 py-3 border-b border-zinc-800/50 ${
                        u.$id === user?.$id
                          ? "bg-gradient-to-r from-[#ff9d54]/15 to-transparent"
                          : "hover:bg-zinc-800/30"
                      } transition-colors`}
                    >
                      {/* Rank Column */}
                      <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
                        {getMedalIcon(u.rank) ? (
                          <span className="text-lg">
                            {getMedalIcon(u.rank)}
                          </span>
                        ) : (
                          <span
                            className={`text-sm font-mono ${
                              u.$id === user?.$id
                                ? "text-[#ff9d54]"
                                : "text-zinc-500"
                            }`}
                          >
                            {u.rank}
                          </span>
                        )}
                      </div>

                      {/* Name Column */}
                      <div
                        className={`col-span-6 sm:col-span-7 flex items-center ${
                          u.$id === user?.$id
                            ? "font-medium text-[#ff9d54]"
                            : "text-zinc-300"
                        }`}
                      >
                        <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs mr-2 overflow-hidden">
                          {u.name?.[0]?.toUpperCase() ||
                            u.email?.[0]?.toUpperCase() ||
                            "?"}
                        </div>
                        <span className="truncate">
                          {u.name || u.email.split("@")[0]}
                          {u.$id === user?.$id && (
                            <span className="ml-2 text-xs bg-[#ff9d54]/20 text-[#ff9d54] px-1.5 py-0.5 rounded-sm hidden sm:inline-block">
                              You
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Points Column */}
                      <div
                        className={`col-span-4 sm:col-span-4 text-right sm:text-center flex items-center justify-end sm:justify-center ${
                          u.$id === user?.$id
                            ? "text-[#ff9d54] font-medium"
                            : ""
                        }`}
                      >
                        <RiCoinFill
                          className={`mr-1 ${
                            u.$id === user?.$id
                              ? "text-[#ff9d54]"
                              : "text-yellow-500"
                          }`}
                        />
                        <span>{(u.points || 0).toLocaleString()}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </>
            )}
          </>
        )}
      </motion.div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-xs text-zinc-500">
          {users.length > 0 && (
            <>
              Showing {currentPage * itemsPerPage + 1}-
              {Math.min((currentPage + 1) * itemsPerPage, users.length)} of{" "}
              {users.length}
            </>
          )}
        </div>

        <div className="flex gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RiArrowLeftSLine />
          </motion.button>

          {totalPages > 0 && (
            <div className="flex items-center px-2 text-sm text-zinc-400">
              {currentPage + 1} / {totalPages}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={(currentPage + 1) * itemsPerPage >= users.length}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RiArrowRightSLine />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Leaderboard;
