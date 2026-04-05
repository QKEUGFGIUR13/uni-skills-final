import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { account } from "../config/appwrite";
import { databases } from "../config/database";
import { Query } from "appwrite";
import { useNavigate } from "react-router-dom";
import { 
  RiCodeBoxLine, 
  RiDatabase2Line, 
  RiTerminalBoxLine, 
  RiReactjsLine, 
  RiHtml5Line,
  RiCss3Line,
  RiCodeSSlashLine,
  RiGitBranchLine,
  RiCommandLine,
  RiRobot2Line,
  RiStackLine,
  RiBrainLine,
  RiSearch2Line,
  RiAiGenerate,
  RiDeleteBin5Line,
  RiCloseLine
} from 'react-icons/ri';
import { generateAINudges } from "../config/llm";
// Lazy load the NudgeCard component
const NudgeCard = lazy(() => import("../components/NudgeCard"));
import { toast } from 'react-hot-toast';

const LearningPath = () => {
  const [careerPaths, setCareerPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  // New state for delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pathToDelete, setPathToDelete] = useState(null);
  const [deletingPath, setDeletingPath] = useState(false);
  // Add state for path nudges
  const [pathNudges, setPathNudges] = useState([]);
  
  const navigate = useNavigate();

  // Database constants
  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const CAREER_PATHS_COLLECTION_ID = import.meta.env.VITE_CAREER_PATHS_COLLECTION_ID;
  const USERS_COLLECTION_ID = import.meta.env.VITE_USERS_COLLECTION_ID;

  // Function to normalize career names for comparison
  const normalizeCareerName = (name) => {
    return name.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ')    // Replace multiple spaces with one
      .trim();
  };

  // Enhanced function with less strict validation and better debugging
  const processCareerPaths = (paths, userCareerGoal, userInterests) => {
    if (!paths || paths.length === 0) return [];
    
    // Create a map of normalized names to find potential duplicates
    const nameMap = new Map();
    
    // Normalize the user's career goal for comparison
    const normalizedCareerGoal = userCareerGoal ? normalizeCareerName(userCareerGoal) : '';
    
    for (const path of paths) {
      if (!path.careerName) continue;
      
      const normalizedName = normalizeCareerName(path.careerName);
      
      // Skip paths that match the user's career goal
      if (normalizedCareerGoal && normalizedName === normalizedCareerGoal) continue;

      // Check if this path has any modules at all
      const hasModules = Array.isArray(path.modules) && path.modules.length > 0;
      if (!hasModules) continue;
      
      if (nameMap.has(normalizedName)) {
        // If this is a duplicate, keep the one that's more complete
        const existing = nameMap.get(normalizedName);
        // Choose the one with more modules or more progress as the primary
        if ((path.modules?.length || 0) > (existing.modules?.length || 0) || 
            path.progress > existing.progress) {
          nameMap.set(normalizedName, path);
        }
      } else {
        nameMap.set(normalizedName, path);
      }
    }
    
    // Return only unique paths
    return Array.from(nameMap.values());
  };

  useEffect(() => {
    fetchUserProfileAndPaths();
  }, []);

  const fetchUserProfileAndPaths = async () => {
    try {
      setLoading(true);
      const user = await account.get();
      console.log("Current user:", user.$id);
      
      // Use Promise.all to fetch user profile and paths in parallel
      const [profileResponse, pathsResponse] = await Promise.all([
        databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          [Query.equal("userID", user.$id)]
        ),
        databases.listDocuments(
          DATABASE_ID,
          CAREER_PATHS_COLLECTION_ID,
          [Query.equal("userID", user.$id)]
        )
      ]);
      
      let userCareerGoal = '';
      let userInterests = [];
      
      if (profileResponse.documents.length > 0) {
        const profile = profileResponse.documents[0];
        setUserProfile(profile);
        userCareerGoal = profile.careerGoal || '';
        userInterests = Array.isArray(profile.interests) ? profile.interests : [];
        console.log("User profile loaded:", { userCareerGoal, interests: userInterests });
      } else {
        console.log("No user profile found");
      }
      
      // Parse JSON fields for each career path with better error handling
      const parsedPaths = pathsResponse.documents.map(path => {
        try {
          return {
            ...path,
            modules: typeof path.modules === 'string' ? JSON.parse(path.modules || "[]") : (path.modules || []),
            completedModules: typeof path.completedModules === 'string' ? JSON.parse(path.completedModules || "[]") : (path.completedModules || []),
            aiNudges: typeof path.aiNudges === 'string' ? JSON.parse(path.aiNudges || "[]") : (path.aiNudges || [])
          };
        } catch (e) {
          console.error("Error parsing path JSON for", path.careerName, e);
          return {
            ...path, 
            modules: [], 
            completedModules: [],
            aiNudges: []
          };
        }
      });
      
      // Process paths with less filtering
      const processedPaths = processCareerPaths(parsedPaths, userCareerGoal, userInterests);
      
      setCareerPaths(processedPaths);
      setError("");
      
      // Only generate nudges if needed and not on initial load
      if (processedPaths.length > 0 && !sessionStorage.getItem('nudgesGenerated')) {
        sessionStorage.setItem('nudgesGenerated', 'true');
        // Use the first path's existing nudges if available instead of generating new ones
        if (processedPaths[0].aiNudges && processedPaths[0].aiNudges.length > 0) {
          setPathNudges(processedPaths[0].aiNudges.slice(0, 3));
        } else {
          // Generate nudges as a non-blocking operation
          generatePathNudges(processedPaths).catch(console.error);
        }
      }
      
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load learning paths. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Optimize the generatePathNudges function
  const generatePathNudges = async (paths) => {
    if (paths.length === 0) return;
    
    try {
      const userData = await account.get();
      // Use a timeout to make this non-blocking
      setTimeout(async () => {
        const nudges = await generateAINudges(
          userData,
          [], // No assessment data needed for path-specific nudges
          paths[0]
        );
        setPathNudges(nudges);
      }, 100);
    } catch (error) {
      console.error("Error generating path nudges:", error);
    }
  };

  // New function to handle path deletion
  const handleDeletePath = async () => {
    if (!pathToDelete) return;
    
    setDeletingPath(true);
    try {
      // Delete the path from Appwrite
      await databases.deleteDocument(
        DATABASE_ID,
        CAREER_PATHS_COLLECTION_ID,
        pathToDelete.$id
      );
      
      // Update local state to remove the deleted path
      setCareerPaths(careerPaths.filter(path => path.$id !== pathToDelete.$id));
      
      // Show success message
      toast.success(`Successfully deleted "${pathToDelete.careerName}" learning path`);
      
      // Close the modal
      setDeleteModalOpen(false);
      setPathToDelete(null);
    } catch (error) {
      console.error("Error deleting path:", error);
      toast.error("Failed to delete learning path. Please try again.");
    } finally {
      setDeletingPath(false);
    }
  };

  // Function to open delete confirmation modal
  const confirmDelete = (path, e) => {
    e.stopPropagation(); // Prevent navigating to path details
    setPathToDelete(path);
    setDeleteModalOpen(true);
  };

  const getCareerIcon = (careerName) => {
    const career = careerName.toLowerCase();
    if (career.includes('javascript') || career.includes('frontend')) return <RiCodeBoxLine className="w-6 h-6 text-yellow-400" />;
    if (career.includes('react')) return <RiReactjsLine className="w-6 h-6 text-cyan-400" />;
    if (career.includes('python') || career.includes('backend')) return <RiCodeSSlashLine className="w-6 h-6 text-blue-400" />;
    if (career.includes('fullstack')) return <RiStackLine className="w-6 h-6 text-indigo-500" />;
    if (career.includes('database')) return <RiDatabase2Line className="w-6 h-6 text-green-500" />;
    if (career.includes('devops')) return <RiGitBranchLine className="w-6 h-6 text-orange-600" />;
    if (career.includes('ai') || career.includes('machine learning')) return <RiRobot2Line className="w-6 h-6 text-purple-500" />;
    if (career.includes('data science')) return <RiBrainLine className="w-6 h-6 text-blue-500" />;
    return <RiCodeSSlashLine className="w-6 h-6 text-blue-500" />; // default icon
  };

  // Filter career paths based on search term - memoized to avoid recalculating on every render
  const filteredCareerPaths = useMemo(() => {
    return careerPaths.filter(path => 
      path.careerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [careerPaths, searchTerm]);

  // Memoize animations to prevent unnecessary recalculations
  const container = useMemo(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }), []);

  const item = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }), []);

  // Check if there are any career paths for the current user on initial load
  useEffect(() => {
    if (careerPaths.length === 0 && !loading && !error) {
      console.log("No paths were loaded. Showing empty state.");
    }
  }, [careerPaths, loading, error]);

  // Add a simple loading fallback for lazy-loaded components
  const LoadingFallback = () => (
    <div className="bg-[#2a2a2a]/70 backdrop-blur-sm p-4 rounded-xl border border-[#3a3a3a] animate-pulse">
      <div className="h-24 w-full"></div>
    </div>
  );

  return (
    <div className="min-h-screen rounded-2xl bg-gradient-to-br from-[#1c1b1b] to-[#252525] p-6 relative overflow-hidden">
      {/* Animated Background Blobs - simplified for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-[#ff9d54] rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
        <div className="absolute top-40 -right-4 w-96 h-96 bg-[#ff8a30] rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-[#ff9d54] rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#2a2a2a] rounded-xl shadow-xl max-w-md w-full p-6 border border-[#3a3a3a]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Delete Learning Path</h3>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="text-gray-400 hover:text-white rounded-full p-1 hover:bg-[#3a3a3a]"
                >
                  <RiCloseLine size={24} />
                </button>
              </div>
              
              <div className="py-4">
                <p className="text-gray-300">
                  Are you sure you want to delete "<span className="font-medium text-white">{pathToDelete?.careerName}</span>"? 
                  This action cannot be undone.
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 bg-[#3a3a3a] hover:bg-[#444444] text-gray-300 rounded-lg"
                  disabled={deletingPath}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePath}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                  disabled={deletingPath}
                >
                  {deletingPath ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <RiDeleteBin5Line />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="max-w-6xl mx-auto space-y-8 relative z-10"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Enhanced Header Section with AI mention */}
        <motion.div
          variants={item}
          className="bg-[#2a2a2a]/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-[#3a3a3a] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#1c1b1b] to-[#252525] opacity-50" />
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#3a3a3a]/50 rounded-full text-[#ff9d54] text-sm font-medium">
                <span className="w-2 h-2 bg-[#ff9d54] rounded-full animate-pulse"></span>
                AI-Generated Learning Paths
              </div>
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] bg-clip-text text-transparent">
                Your Personalized Learning
              </h1>
              <p className="text-gray-400">
                Explore AI-crafted learning content based on your interests and preferences
              </p>
            </div>
            <div className="relative w-full md:w-auto">
              <input 
                type="text" 
                placeholder="Search your learning paths"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 px-4 py-2 pl-10 border border-[#3a3a3a] bg-[#1c1b1b] text-white rounded-xl focus:ring-2 focus:ring-[#ff9d54] focus:border-[#ff9d54] outline-none"
              />
              <RiSearch2Line className="absolute left-3 top-3 text-[#ff9d54]" />
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border-4 border-[#3a3a3a] border-t-[#ff9d54] rounded-full"
            />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div 
            variants={item}
            className="bg-red-900/20 border border-red-900/30 text-red-400 rounded-xl p-6 text-center"
          >
            <p>{error}</p>
            <button 
              onClick={fetchUserProfileAndPaths}
              className="mt-2 px-4 py-2 bg-red-900/30 rounded-lg hover:bg-red-900/50 transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && careerPaths.length === 0 && (
          <motion.div 
            variants={item}
            className="bg-[#2a2a2a]/70 backdrop-blur-sm rounded-2xl p-8 text-center border border-[#3a3a3a] shadow-lg"
          >
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto">
                <RiBrainLine className="w-8 h-8 text-[#ff9d54]" />
              </div>
              <h3 className="text-xl font-semibold text-white">No learning paths found</h3>
              <p className="text-gray-400">
                We couldn't find any AI-generated learning content yet. Update your profile to add more interests.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate("/profile?update=true")}
                  className="w-full px-6 py-2 bg-[#ff9d54] text-white rounded-lg hover:bg-[#ff8a30] transition-colors"
                >
                  Update Profile
                </button>
                <button 
                  onClick={fetchUserProfileAndPaths}
                  className="w-full px-6 py-2 bg-[#3a3a3a] text-[#ff9d54] rounded-lg hover:bg-[#444444] transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI-Generated Learning Paths Grid - Optimized rendering */}
        {!loading && !error && filteredCareerPaths.length > 0 && (
          <motion.div
            variants={item}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredCareerPaths.map((path, index) => (
              <motion.div
                key={path.$id || index}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="group relative bg-[#2a2a2a]/70 backdrop-blur-sm p-6 rounded-2xl border border-[#3a3a3a] shadow-lg hover:shadow-xl overflow-hidden"
                onClick={() => navigate(`/learning-path/${path.$id}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#ff9d54]/10 to-[#ff8a30]/10 opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                
                {/* Header section with badge and delete button */}
                <div className="flex justify-between items-center mb-4">
                  {/* AI-generated badge */}
                  <div className="px-2 py-1 bg-[#ff9d54]/10 rounded-full text-xs text-[#ff9d54] font-medium flex items-center gap-1">
                    <RiBrainLine className="w-3 h-3" />
                    AI Generated
                  </div>
                  
                  {/* Delete button - visible on hover */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(path, e);
                    }}
                    className="p-1.5 bg-red-900/20 rounded-full text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-900/30 transition-all transform group-hover:scale-110"
                    aria-label="Delete learning path"
                  >
                    <RiDeleteBin5Line className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Path content section */}
                <div className="relative space-y-4">
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#3a3a3a] to-[#444444] rounded-xl flex items-center justify-center transform transition-transform group-hover:scale-110">
                      {getCareerIcon(path.careerName)}
                    </div>
                    <h2 className="text-xl font-semibold bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] bg-clip-text text-transparent">
                      {path.careerName}
                    </h2>
                  </div>

                  <p className="text-gray-400 text-sm">
                    {path.modules?.length || 0} modules • {path.completedModules?.length || 0} completed
                  </p>

                  <div className="space-y-3">
                    <div className="w-full bg-[#3a3a3a] rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] h-2 rounded-full"
                        style={{ width: `${path.progress || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[#ff9d54] font-medium text-sm">
                        {path.progress || 0}% Complete
                      </p>
                      <span className="text-[#ff9d54]">→</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Explanation of AI-generated content */}
        {!loading && !error && filteredCareerPaths.length > 0 && (
          <motion.div variants={item} className="bg-[#1c1b1b] p-6 rounded-xl border border-[#3a3a3a]">
            <h3 className="text-[#ff9d54] font-semibold mb-2">About Your Learning Paths</h3>
            <p className="text-gray-400 text-sm">
              These learning paths were uniquely created by our AI based on your interests. Each path 
              includes customized modules and content to help you progress on your learning journey.
            </p>
          </motion.div>
        )}

        {/* AI Nudges Section */}
        {!loading && careerPaths.length > 0 && careerPaths[0].aiNudges && careerPaths[0].aiNudges.length > 0 && (
          <motion.div variants={item} className="mt-12">
            <h2 className="text-xl font-semibold mb-4 text-white">AI Learning Nudges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {careerPaths[0].aiNudges.slice(0, 2).map((nudge, index) => (
                <Suspense key={index} fallback={<LoadingFallback />}>
                  <NudgeCard 
                    title={nudge.title || "Learning Recommendation"}
                    content={nudge.content}
                    type={nudge.type || "tip"}
                  />
                </Suspense>
              ))}
            </div>
          </motion.div>
        )}

        {/* Add the nudges section after paths grid */}
        {!loading && pathNudges.length > 0 && (
          <motion.div
            variants={item}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {pathNudges.map((nudge, index) => (
              <Suspense key={index} fallback={<LoadingFallback />}>
                <NudgeCard
                  key={index}
                  text={nudge.text}
                  type={nudge.type}
                  icon={nudge.icon}
                  elevated={true}
                />
              </Suspense>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Debug section in development mode */}
      {import.meta.env.DEV && careerPaths.length === 0 && !loading && (
        <div className="mt-8 p-4 bg-[#1c1b1b] rounded-lg text-xs overflow-auto max-h-64 border border-[#3a3a3a]">
          <h4 className="font-bold mb-2 text-gray-300">Debug Info:</h4>
          <p className="text-gray-400">User ID: {userProfile?.userID || 'Not loaded'}</p>
          <p className="text-gray-400">Career Goal: {userProfile?.careerGoal || 'None'}</p>
          <p className="text-gray-400">Interests: {Array.isArray(userProfile?.interests) ? userProfile.interests.join(', ') : 'None'}</p>
          <p className="mt-2 font-semibold text-gray-300">Check console for more debugging information</p>
        </div>
      )}
    </div>
  );
};

// Add these to your global CSS
const additionalStyles = `
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
`;

export default LearningPath;
