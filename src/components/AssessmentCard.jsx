import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RiMedalLine, RiRefreshLine, RiTimeLine, RiLoaderLine } from 'react-icons/ri';
import { account } from "../config/appwrite";
import { databases } from "../config/database";
import { Query } from "appwrite";

/**
 * AssessmentCard Component
 * 
 * A reusable card component to display quiz assessment results.
 * Fetches assessment data from Appwrite based on moduleID.
 * 
 * @param {Object} props
 * @param {string} props.moduleID - The ID of the module to fetch assessment for
 * @param {number|null} props.score - Fallback score (null if not attempted)
 * @param {number} props.total - Fallback total score
 * @param {string} props.feedback - Fallback feedback on the assessment
 * @param {function} props.onRetry - Optional: Callback function when retry button is clicked
 * @param {string} props.title - Optional: Custom title for the card
 * @param {string} props.assessmentType - Optional: Type of assessment ("quiz", "test", "challenge")
 * @param {number} props.timeSpent - Optional: Time spent on assessment (in minutes)
 */
const AssessmentCard = ({
  moduleID,
  score: defaultScore = null,
  total: defaultTotal = 10,
  feedback: defaultFeedback = '',
  onRetry,
  title = 'Quiz Results',
  assessmentType = 'quiz',
  timeSpent: defaultTimeSpent,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [assessmentData, setAssessmentData] = useState({
    score: defaultScore,
    total: defaultTotal,
    feedback: defaultFeedback,
    timeSpent: defaultTimeSpent,
  });
  
  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const ASSESSMENTS_COLLECTION_ID = import.meta.env.VITE_ASSESSMENTS_COLLECTION_ID;

  useEffect(() => {
    // Only fetch if moduleID is provided
    if (moduleID) {
      fetchAssessment();
    } else {
      setIsLoading(false); // If no moduleID, just use the default values
    }
  }, [moduleID]);

  const fetchAssessment = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const user = await account.get();
      
      // Query assessments collection for this user and module
      const response = await databases.listDocuments(
        DATABASE_ID,
        ASSESSMENTS_COLLECTION_ID,
        [
          Query.equal("userID", user.$id),
          Query.equal("moduleID", moduleID)
        ]
      );
      
      if (response.documents.length > 0) {
        const assessment = response.documents[0];
        
        // Set assessment data from database
        setAssessmentData({
          score: assessment.quizScore,
          total: assessment.quizTotal || defaultTotal,
          feedback: assessment.feedback || defaultFeedback,
          timeSpent: assessment.timeSpent || defaultTimeSpent,
          completedAt: assessment.completedAt,
        });
      } else {
        // No assessment found - use default values, but mark as not attempted
        setAssessmentData({
          score: null,
          total: defaultTotal,
          feedback: 'Not attempted yet',
          timeSpent: null,
        });
      }
    } catch (error) {
      console.error("Error fetching assessment:", error);
      // Use default fallback values on error
      setAssessmentData({
        score: defaultScore,
        total: defaultTotal,
        feedback: 'Failed to load assessment data.',
        timeSpent: defaultTimeSpent,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate percentage for the progress circle
  const percentage = assessmentData.score !== null ? Math.round((assessmentData.score / assessmentData.total) * 100) : 0;
  
  // Determine color based on score percentage
  const getScoreColor = () => {
    if (assessmentData.score === null) return 'text-gray-400';
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-[#ff9d54]';
    if (percentage >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Circle radius and circumference for SVG progress circle
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#2a2a2a]/70 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-[#3a3a3a] flex items-center justify-center"
        style={{ minHeight: "200px" }}
      >
        <div className="flex flex-col items-center">
          <RiLoaderLine className="animate-spin text-[#ff9d54] text-4xl mb-2" />
          <p className="text-sm text-gray-400">Loading assessment data...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#2a2a2a]/70 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-[#3a3a3a]"
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Score Circle */}
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#3a3a3a"
                strokeWidth="8"
              />
              
              {/* Progress Circle - only show if attempted */}
              {assessmentData.score !== null && (
                <motion.circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={percentage >= 80 ? '#34D399' : percentage >= 60 ? '#ff9d54' : percentage >= 40 ? '#FBBF24' : '#F87171'}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              )}
              
              {/* Score Text in Center */}
              <text 
                x="50" 
                y="50" 
                textAnchor="middle" 
                dominantBaseline="middle"
                className={`${getScoreColor()} font-bold text-2xl`}
                fill="currentColor"
              >
                {assessmentData.score === null ? '?' : percentage}%
              </text>
            </svg>
          </div>
          
          {/* Score Fraction */}
          <div className="text-center mt-2">
            <span className={`${getScoreColor()} font-semibold`}>
              {assessmentData.score === null ? 'Not Attempted' : `${assessmentData.score}/${assessmentData.total} points`}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-[#ff9d54] flex items-center gap-2">
              <RiMedalLine className="text-[#ff9d54]" /> {title}
            </h3>
            
            {assessmentData.timeSpent && (
              <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                <RiTimeLine />
                <span>Completed in {assessmentData.timeSpent} minutes</span>
              </div>
            )}
            
            {assessmentData.completedAt && (
              <div className="text-xs text-gray-400 mt-1">
                Completed on {new Date(assessmentData.completedAt).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="bg-[#ff9d54]/10 p-4 rounded-xl border border-[#ff9d54]/30">
            <h4 className="text-[#ff9d54] font-medium mb-1">Feedback</h4>
            <p className="text-sm text-white">
              {assessmentData.score === null 
                ? 'Take this assessment to get personalized feedback.' 
                : assessmentData.feedback || 'Great effort! Keep practicing to improve your skills.'}
            </p>
          </div>

          {/* Retry Button */}
          {onRetry && (
            <motion.button
              onClick={onRetry}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-4 py-2 bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] text-white rounded-lg flex items-center gap-2"
            >
              <RiRefreshLine /> Retry {assessmentType}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AssessmentCard;