import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { RiArrowRightLine, RiLightbulbLine, RiUserLine, RiCalendarLine, RiFlag2Line, RiHeartLine, RiToolsLine, RiQuestionLine } from "react-icons/ri";
// Import Appwrite SDK
import { account } from "../config/appwrite";
import { databases } from "../config/database";
import { ID, Query } from "appwrite";
import { toast } from "react-hot-toast";
import { generateLearningPath, generatePersonalizedCareerPaths } from "../config/llm";
import { useAuth } from "../context/AuthContext";

const ProfileForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    careerGoal: "",
    interests: [],
    skills: [],
    quizAnswers: {} // Add quiz answers to track user selections
  });
  const [currentInterest, setCurrentInterest] = useState("");
  const [currentSkill, setCurrentSkill] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading your profile..."); // Add dynamic loading message
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const loadingQuotes = [
    "Great things take time. We're crafting your personalized learning journey...",
    "Success is built one step at a time. Analyzing your interests...",
    "Your dedication to learning inspires us. Creating optimal paths...",
    "The best investments are in yourself. Designing your roadmap...",
    "Every expert was once a beginner. Tailoring content for your growth...",
    "Learning is a journey, not a destination. Almost there...",
    "Your future self will thank you for this. Final touches...",
  ];

  // Rotate quotes every 3 seconds during loading
  useEffect(() => {
    if (isSubmitting) {
      const interval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % loadingQuotes.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isSubmitting]);
  
  // Get environment variables for Appwrite database and collections
  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const USERS_COLLECTION_ID = import.meta.env.VITE_USERS_COLLECTION_ID;
  const CAREER_PATHS_COLLECTION_ID = import.meta.env.VITE_CAREER_PATHS_COLLECTION_ID;

  // Career interest quiz questions
  const careerQuiz = [
    {
      id: 1,
      question: "Which task would you enjoy doing the most?",
      options: [
        "A. Designing a robot to solve a problem",
        "B. Writing a short story or directing a video",
        "C. Running a mock business or analyzing stocks",
        "D. Practicing a musical or dance performance",
        "E. Organizing a community clean-up drive"
      ]
    },
    {
      id: 2,
      question: "What's your go-to YouTube/Instagram content?",
      options: [
        "A. Science experiments, tech reviews",
        "B. Poetry, creative reels, history facts",
        "C. Finance tips, startup journeys",
        "D. Music covers, dance routines",
        "E. Mental health awareness, social causes"
      ]
    },
    {
      id: 3,
      question: "Which school project would excite you the most?",
      options: [
        "A. Making a working model (like a volcano or sensor)",
        "B. Creating a documentary or a comic strip",
        "C. Planning a business fair or budgeting event",
        "D. Performing a skit or choreographing a routine",
        "E. Starting a social awareness campaign"
      ]
    },
    {
      id: 4,
      question: "What do your friends often compliment you for?",
      options: [
        "A. Problem-solving or logic",
        "B. Creativity or expression",
        "C. Leadership or money sense",
        "D. Energy or stage presence",
        "E. Kindness or listening skills"
      ]
    },
    {
      id: 5,
      question: "Imagine you're asked to lead a group—what role would you prefer?",
      options: [
        "A. Technical lead – building the solution",
        "B. Content/design head – bringing ideas to life",
        "C. Business lead – organizing and pitching",
        "D. Performer – delivering the impact",
        "E. Community coordinator – making it meaningful"
      ]
    },
    {
      id: 6,
      question: "Which of these books/movies do you enjoy most?",
      options: [
        "A. Sci-fi (e.g., Interstellar, The Martian)",
        "B. Biopics / Historical fiction (e.g., Hidden Figures)",
        "C. Entrepreneurial / Strategic (e.g., Shark Tank, The Social Network)",
        "D. Musical / Dance films (e.g., La La Land, Step Up)",
        "E. Real-life impact stories (e.g., The Pursuit of Happyness)"
      ]
    },
    {
      id: 7,
      question: "You're given a full day off to explore a new topic. You'd pick:",
      options: [
        "A. Coding / space / how things work",
        "B. Drawing / writing / psychology",
        "C. Stocks / brands / startups",
        "D. Music / film / acting",
        "E. Healthcare / teaching / environment"
      ]
    },
    {
      id: 8,
      question: "How do you express yourself best?",
      options: [
        "A. Through logic or innovation",
        "B. Through words, colors, or emotions",
        "C. Through numbers, ideas, or business plans",
        "D. Through rhythm, body, or voice",
        "E. Through care, empathy, or advice"
      ]
    },
    {
      id: 9,
      question: "Pick a school subject you'd choose as an elective:",
      options: [
        "A. Computer Science / Physics",
        "B. Art / Literature / History",
        "C. Accountancy / Economics",
        "D. Music / Dance / Theatre",
        "E. Biology / Psychology / Civics"
      ]
    },
    {
      id: 10,
      question: "What type of feedback makes you happiest?",
      options: [
        "A. \"You're really smart at solving problems.\"",
        "B. \"Your ideas are so original and expressive.\"",
        "C. \"You're a born leader or entrepreneur.\"",
        "D. \"You totally rocked that performance!\"",
        "E. \"You're a great helper and listener.\""
      ]
    }
  ];

  // Handle quiz answer selection
  const handleQuizAnswer = (questionId, option) => {
    setFormData({
      ...formData,
      quizAnswers: {
        ...formData.quizAnswers,
        [questionId]: option.charAt(0) // Store just the letter (A, B, C, D, E)
      }
    });
  };

  // Check if user profile already exists
  useEffect(() => {
    if (user) {
      checkUserProfile();
    }
  }, [user]);

  const checkUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal("userID", user.$id)]
      );
      
      if (response.documents.length > 0) {
        const userProfile = response.documents[0];
        setFormData({
          name: userProfile.name || "",
          age: userProfile.age?.toString() || "",
          careerGoal: userProfile.careerGoal || "",
          interests: Array.isArray(userProfile.interests) ? userProfile.interests : [],
          skills: Array.isArray(userProfile.skills) ? userProfile.skills : [],
          quizAnswers: {} // Initialize empty quiz answers for existing profiles
        });
        setProfileExists(true);
        
        // Check if user already has career paths - only for informational purposes
        const pathsResponse = await databases.listDocuments(
          DATABASE_ID,
          CAREER_PATHS_COLLECTION_ID,
          [Query.equal("userID", user.$id)]
        );
        
        // We no longer redirect regardless of paths existing or not
        // This way users can always view and update their profile
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
      toast.error("Error loading your profile data");
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.5 
      }
    },
    exit: { 
      opacity: 0,
      y: 20,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Interest suggestions (dummy data)
  const interestSuggestions = [
    "Web Development", "Data Science", "Mobile Apps", 
    "Machine Learning", "Cybersecurity", "Cloud Computing",
    "UI/UX Design", "Game Development", "DevOps", "Blockchain"
  ];

  // Skill suggestions (dummy data)
  const skillSuggestions = [
    "JavaScript", "Python", "React", "Node.js", "SQL", 
    "Java", "AWS", "Docker", "HTML/CSS", "TypeScript"
  ];

  const handleAddInterest = (interest) => {
    if (interest && !formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest],
      });
      setCurrentInterest("");
    }
  };

  const handleAddSkill = (skill) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill],
      });
      setCurrentSkill("");
    }
  };

  const handleRemoveInterest = (interest) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((i) => i !== interest),
    });
  };

  const handleRemoveSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const generateCareerPaths = async (userID) => {
    console.log('🚀 Starting career path generation for user:', userID);
    console.log('📊 Form data:', formData);
    
    // If no interests, create a default path immediately
    if (!formData.interests || formData.interests.length === 0) {
      console.log('⚠️ No interests provided, creating default path');
      try {
        const defaultPath = {
          userID: userID,
          careerName: formData.careerGoal || "General Learning",
          modules: JSON.stringify([
            "Introduction and Fundamentals",
            "Core Concepts",
            "Practical Applications",
            "Advanced Topics",
            "Real-world Projects"
          ]),
          progress: 0,
          completedModules: JSON.stringify([]),
          recommendedSkills: JSON.stringify(formData.skills || []),
          aiNudges: JSON.stringify([]),
          summaryGenerated: false,
          timestamp: []
        };
        
        await databases.createDocument(
          DATABASE_ID,
          CAREER_PATHS_COLLECTION_ID,
          ID.unique(),
          defaultPath
        );
        console.log('✅ Created default path');
        return 1;
      } catch (err) {
        console.error('❌ Failed to create default path:', err);
        throw err;
      }
    }
    
    try {
      
      // Generate personalized career paths using the complete user profile data
      const userData = {
        name: formData.name,
        age: formData.age,
        careerGoal: formData.careerGoal,
        interests: formData.interests,
        skills: formData.skills,
        quizAnswers: formData.quizAnswers // Add quiz answers to the data sent to Gemini
      };
      
      console.log('📊 User data for AI:', userData);
      setLoadingMessage("AI is analyzing your interests and generating personalized learning paths..."); // Update loading message
      
      // Get personalized career paths
      const personalizedPaths = await generatePersonalizedCareerPaths(userData);
      console.log(`✅ Generated ${personalizedPaths.length} personalized paths`);
      
      let successCount = 0;
      
      // Create career path documents in Appwrite
      for (const path of personalizedPaths) {
        // Skip if the path name matches the career goal exactly
        if (path.pathName === formData.careerGoal) {
          console.log(`⏭️ Skipping path that matches career goal: ${path.pathName}`);
          continue;
        }
        
        // Ensure module titles are proper topics, not just numbered versions of the path
        let moduleTitles = [];
        try {
          // Make sure path.modules exists and is an array before mapping
          if (Array.isArray(path.modules)) {
            moduleTitles = path.modules.map(m => {
              // Safely extract title
              if (!m || !m.title) return "Module";
              
              // Extract and clean module title
              let title = m.title || '';
              
              // Remove any numbering like "Path Name 1: " or "1. "
              title = title.replace(/^\d+[\.:]\s*/, '');
              // Use a safer regex that won't throw errors
              try {
                title = title.replace(new RegExp(`^${path.pathName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+\\d+[\\.:]?\\s*`, 'i'), '');
              } catch (e) {
                // If regex fails, just keep the title as is
                console.log('Regex error:', e);
              }
              
              // If after cleaning, the title is too short or identical to path name,
              // replace with the topic's actual content description
              if (!title || title.length < 5 || title === path.pathName) {
                return m.description ? m.description.split('.')[0] : 'Module';
              }
              
              return title;
            }).filter(title => title && title.trim() !== '');
          }
        } catch (moduleError) {
          console.error("Error processing module titles:", moduleError);
          // Provide a fallback set of module titles
          moduleTitles = ['Fundamentals', 'Core Concepts', 'Advanced Topics', 'Practical Application'];
        }
        
        // Ensure we have at least some modules
        if (moduleTitles.length === 0) {
          moduleTitles = ['Fundamentals', 'Core Concepts', 'Advanced Topics', 'Practical Application'];
        }
        
        try {
          await databases.createDocument(
            DATABASE_ID,
            CAREER_PATHS_COLLECTION_ID,
            ID.unique(),
            {
              userID: userID,
              modules: JSON.stringify(moduleTitles),
              progress: 0,
              careerName: path.pathName || "Learning Path",
              completedModules: JSON.stringify([]),
              recommendedSkills: JSON.stringify(formData.skills.slice(0, 5)),
              aiNudges: JSON.stringify([]),
              summaryGenerated: false,
              timestamp: []
            }
          );
          successCount++;
          console.log(`✅ Created career path: ${path.pathName}`);
        } catch (docError) {
          console.error(`❌ Failed to create career path ${path.pathName}:`, docError);
          toast.error(`Failed to create path: ${path.pathName}`);
          // Continue with other paths even if one fails
        }
      }

      console.log(`🎉 Successfully created ${successCount} career paths`);
      return successCount;
    } catch (error) {
      console.error("❌ Error generating career paths:", error);
      toast.error(`Career path generation failed: ${error.message}`);
      
      // Fallback to the original simple method if the personalized approach fails
      try {
        console.log('🔄 Attempting fallback career path generation...');
        const careerPaths = [];

        // Generate career paths based on top interests (max 3)
        for (const interest of formData.interests.slice(0, 3)) {
          // Skip if the interest matches the career goal exactly
          if (interest === formData.careerGoal) {
            continue;
          }
          
          // Generate proper topic-oriented modules
          const interestModules = await generateLearningPath(interest);
          
          // Clean up module names to ensure they're proper topics
          const cleanedModules = interestModules.map(module => {
            // Remove any numbering or prefixes like "Interest Name 1: "
            let cleanedName = module;
            cleanedName = cleanedName.replace(/^\d+[\.:]\s*/, '');
            cleanedName = cleanedName.replace(new RegExp(`^${interest}\\s+\\d+[\\.:]?\\s*`, 'i'), '');
            return cleanedName;
          }).filter(module => module.length > 3); // Filter out any too short modules
          
          careerPaths.push({
            userID: userID,
            modules: JSON.stringify(cleanedModules),
            progress: 0,
            careerName: interest,
            completedModules: JSON.stringify([]),
            recommendedSkills: JSON.stringify(formData.skills.slice(0, 5)),
            aiNudges: JSON.stringify([]),
            summaryGenerated: false
          });
        }

        // Create career path documents in Appwrite
        let fallbackSuccessCount = 0;
        for (const careerPath of careerPaths) {
          try {
            await databases.createDocument(
              DATABASE_ID,
              CAREER_PATHS_COLLECTION_ID,
              ID.unique(),
              {
                ...careerPath,
                timestamp: []
              }
            );
            fallbackSuccessCount++;
            console.log(`✅ Created fallback career path: ${careerPath.careerName}`);
          } catch (docError) {
            console.error(`❌ Failed to create fallback career path:`, docError);
          }
        }

        return fallbackSuccessCount;
      } catch (fallbackError) {
        console.error("Even fallback path generation failed:", fallbackError);
        toast.error('AI generation failed, creating simple learning paths...');
        
        // Last resort: create simple default paths WITHOUT AI
        console.log('⚠️ Using simple default career paths (no AI)');
        try {
          const simplePaths = [];
          
          // Create one path for each interest (max 3)
          const interestsToUse = formData.interests.slice(0, 3);
          
          for (const interest of interestsToUse) {
            if (interest === formData.careerGoal) continue;
            
            simplePaths.push({
              userID: userID,
              careerName: interest,
              modules: JSON.stringify([
                `Introduction to ${interest}`,
                `${interest} Fundamentals`,
                `Intermediate ${interest}`,
                `Advanced ${interest}`,
                `${interest} Projects`
              ]),
              progress: 0,
              completedModules: JSON.stringify([]),
              recommendedSkills: JSON.stringify(formData.skills.slice(0, 5)),
              aiNudges: JSON.stringify([]),
              summaryGenerated: false,
              timestamp: []
            });
          }
          
          // If no paths created from interests, create a generic one
          if (simplePaths.length === 0) {
            simplePaths.push({
              userID: userID,
              careerName: formData.careerGoal || "General Learning",
              modules: JSON.stringify([
                "Introduction and Fundamentals",
                "Core Concepts",
                "Practical Applications",
                "Advanced Topics",
                "Real-world Projects"
              ]),
              progress: 0,
              completedModules: JSON.stringify([]),
              recommendedSkills: JSON.stringify(formData.skills.slice(0, 5)),
              aiNudges: JSON.stringify([]),
              summaryGenerated: false,
              timestamp: []
            });
          }
          
          let simpleSuccessCount = 0;
          for (const path of simplePaths) {
            try {
              await databases.createDocument(
                DATABASE_ID,
                CAREER_PATHS_COLLECTION_ID,
                ID.unique(),
                path
              );
              simpleSuccessCount++;
              console.log(`✅ Created simple path: ${path.careerName}`);
            } catch (err) {
              console.error('❌ Failed to create simple path:', err);
              console.error('Error details:', {
                message: err.message,
                code: err.code,
                type: err.type
              });
            }
          }
          
          if (simpleSuccessCount === 0) {
            throw new Error('Failed to create any learning paths. Please check your Appwrite collection setup.');
          }
          
          return simpleSuccessCount;
        } catch (lastResortError) {
          console.error('❌ All path generation methods failed:', lastResortError);
          throw new Error('Unable to create any career paths. Please check your Appwrite collection setup.');
        }
      }
    }
  };

  // New function to update existing career paths or create new ones based on updated profile
  const updateCareerPaths = async (userID) => {
    try {
      // Get existing career paths
      const existingPathsResponse = await databases.listDocuments(
        DATABASE_ID,
        CAREER_PATHS_COLLECTION_ID,
        [Query.equal("userID", userID)]
      );
      
      // Extract existing career path names
      const existingPaths = existingPathsResponse.documents.map(doc => ({
        id: doc.$id,
        name: doc.careerName
      }));
      
      // Generate fresh personalized paths based on updated profile
      const userData = {
        name: formData.name,
        age: formData.age,
        careerGoal: formData.careerGoal,
        interests: formData.interests,
        skills: formData.skills,
        quizAnswers: formData.quizAnswers // Add quiz answers to the data sent to Gemini
      };
      
      // Check if there are any existing paths before accessing the first one
      const shouldRegenerateAllPaths = existingPathsResponse.documents.length > 0 &&
        formData.careerGoal !== existingPathsResponse.documents[0]?.careerGoal;
      
      if (shouldRegenerateAllPaths) {
        setLoadingMessage("Your career goal has changed. Generating new personalized paths..."); 
        toast.loading("Your career goal has changed. Generating new personalized paths...", { duration: 4000 });
        
        // Delete existing paths
        for (const path of existingPathsResponse.documents) {
          await databases.deleteDocument(
            DATABASE_ID,
            CAREER_PATHS_COLLECTION_ID,
            path.$id
          );
        }
        
        // Get new personalized paths
        const personalizedPaths = await generatePersonalizedCareerPaths(userData);
        
        // Create new path documents
        for (const path of personalizedPaths) {
          // Skip if the path name matches the career goal exactly
          if (path.pathName === formData.careerGoal) {
            continue;
          }
          
          // Ensure module titles are proper topics, not just numbered versions of the path
          let moduleTitles = [];
          try {
            // Make sure path.modules exists and is an array before mapping
            if (Array.isArray(path.modules)) {
              moduleTitles = path.modules.map(m => {
                // Safely extract title
                if (!m || !m.title) return "Module";
                
                // Extract and clean module title
                let title = m.title || '';
                
                // Remove any numbering like "Path Name 1: " or "1. "
                title = title.replace(/^\d+[\.:]\s*/, '');
                // Use a safer regex that won't throw errors
                try {
                  title = title.replace(new RegExp(`^${path.pathName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+\\d+[\\.:]?\\s*`, 'i'), '');
                } catch (e) {
                  // If regex fails, just keep the title as is
                  console.log('Regex error:', e);
                }
                
                // If after cleaning, the title is too short or identical to path name,
                // replace with the topic's actual content description
                if (!title || title.length < 5 || title === path.pathName) {
                  return m.description ? m.description.split('.')[0] : 'Module';
                }
                
                return title;
              }).filter(title => title && title.trim() !== '');
            }
          } catch (moduleError) {
            console.error("Error processing module titles:", moduleError);
            // Provide a fallback set of module titles
            moduleTitles = ['Fundamentals', 'Core Concepts', 'Advanced Topics', 'Practical Application'];
          }
          
          // Ensure we have at least some modules
          if (moduleTitles.length === 0) {
            moduleTitles = ['Fundamentals', 'Core Concepts', 'Advanced Topics', 'Practical Application'];
          }
          
          try {
            await databases.createDocument(
              DATABASE_ID,
              CAREER_PATHS_COLLECTION_ID,
              ID.unique(),
              {
                userID: userID,
                modules: JSON.stringify(moduleTitles),
                progress: 0,
                careerName: path.pathName || "Learning Path",
                completedModules: JSON.stringify([]),
                recommendedSkills: JSON.stringify(formData.skills.slice(0, 5)),
                aiNudges: JSON.stringify([]),
                summaryGenerated: false,
                timestamp: []
              }
            );
            console.log(`✅ Created career path: ${path.pathName}`);
          } catch (docError) {
            console.error(`❌ Failed to create career path ${path.pathName}:`, docError);
            // Continue with other paths even if one fails
          }
        }
        
        return personalizedPaths.filter(path => path.pathName !== formData.careerGoal).length;
      } else {
        // Just update existing paths with new skills info
        for (const path of existingPathsResponse.documents) {
          // Skip updating if the path name matches the career goal (though this shouldn't happen now)
          if (path.careerName === formData.careerGoal) {
            // Delete this path as it shouldn't exist
            await databases.deleteDocument(
              DATABASE_ID,
              CAREER_PATHS_COLLECTION_ID,
              path.$id
            );
            continue;
          }
          
          await databases.updateDocument(
            DATABASE_ID,
            CAREER_PATHS_COLLECTION_ID,
            path.$id,
            {
              recommendedSkills: JSON.stringify(formData.skills.slice(0, 5))
            }
          );
        }
        
        // Filter out any paths that match the career goal
        return existingPathsResponse.documents.filter(
          doc => doc.careerName !== formData.careerGoal
        ).length;
      }
    } catch (error) {
      console.error("Error updating career paths:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🎯 SUBMIT BUTTON CLICKED!');
    console.log('📋 Current form data:', formData);
    console.log('👤 Profile exists:', profileExists);
    console.log('⏳ Is submitting:', isSubmitting);
    
    if (isSubmitting) {
      console.log('⚠️ Already submitting, ignoring click');
      return;
    }
    
    setIsSubmitting(true);
    setLoadingMessage("Saving your profile..."); // Set initial loading message
    
    try {
      // Get the current user's information
      const currentUser = await account.get();
      
      // Format the data for Appwrite
      const userData = {
        userID: currentUser.$id,
        name: formData.name,
        age: parseInt(formData.age),
        careerGoal: formData.careerGoal,
        interests: formData.interests, // Send as array, not JSON string
        skills: formData.skills // Send as array, not JSON string
      };
      
      if (profileExists) {
        // Update existing profile
        const response = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          [Query.equal("userID", currentUser.$id)]
        );
        
        if (response.documents.length > 0) {
          await databases.updateDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            response.documents[0].$id,
            userData
          );
          
          // Update existing career paths or add new ones based on updated profile
          setLoadingMessage("Updating your personalized learning paths..."); // Update loading message
          const totalPaths = await updateCareerPaths(currentUser.$id);
          
          toast.success(`Profile and ${totalPaths} learning paths updated!`);
        }
      } else {
        // Create a new profile
        await databases.createDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          ID.unique(),
          userData
        );
        
        // Generate career paths based on user profile
        setLoadingMessage("Creating your personalized career paths..."); // Update loading message
        const pathsCount = await generateCareerPaths(currentUser.$id);
        
        // Show success message
        if (pathsCount > 0) {
          toast.success(`Profile created with ${pathsCount} career paths!`);
        } else {
          toast.error('Profile created but no career paths were generated. Please check console for errors.');
        }
      }
      
      // Redirect to dashboard
      navigate("/learning-path");
    } catch (error) {
      console.error("❌ Error creating/updating user profile:", error);
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Show specific error message
      if (error.message.includes('Appwrite')) {
        toast.error("Database error: " + error.message);
      } else if (error.message.includes('API')) {
        toast.error("AI service error: " + error.message);
      } else {
        toast.error("Failed to save profile: " + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const isStepValid = () => {
    switch(step) {
      case 1:
        return formData.name.trim() !== "" && formData.age !== "";
      case 2:
        // Require career goal and at least 5 quiz answers
        return formData.careerGoal.trim() !== "" && 
               Object.keys(formData.quizAnswers).length >= 5;
      case 3:
        return formData.interests.length > 0;
      case 4:
        return true; // Skills are optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1c1b1b] to-[#252525] py-12 px-4">
      <motion.div
        className="max-w-xl mx-auto bg-[#2a2a2a] rounded-2xl shadow-lg p-6 md:p-8 border border-[#3a3a3a]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {isLoading || isSubmitting ? (
          <div className="flex flex-col justify-center items-center py-16">
            {/* Loading Animation */}
            <div className="relative">
              <motion.div
                className="w-16 h-16 border-4 border-[#3a3a3a] rounded-full"
                animate={{
                  rotate: 360,
                  borderColor: ["#3a3a3a", "#ff9d54", "#ff8a30", "#3a3a3a"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <motion.div
                className="w-16 h-16 border-4 border-transparent border-t-[#ff9d54] rounded-full absolute top-0"
                animate={{
                  rotate: -360,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>
            
            {/* Brain Animation */}
            <motion.div
              className="mt-8 text-4xl text-[#ff9d54]"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              🧠
            </motion.div>

            {/* Loading Message */}
            <div className="mt-6 text-center">
              <motion.h3
                className="text-lg font-semibold text-[#ff9d54] mb-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {loadingMessage}
              </motion.h3>
              
              {/* Animated Quote */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentQuoteIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-sm text-gray-400 max-w-sm mx-auto"
                >
                  {loadingQuotes[currentQuoteIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Progress Dots */}
            <div className="flex gap-2 mt-6">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-[#ff9d54] rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {profileExists && (
              <motion.div 
                className="mb-6 p-4 bg-[#1c1b1b] border-l-4 border-[#ff9d54] rounded-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-[#ff9d54] font-medium mb-1">Profile Data Loaded</h3>
                <p className="text-gray-400 text-sm">
                  Your existing profile data has been loaded. You can review and update it as needed.
                </p>
              </motion.div>
            )}
          
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {[1, 2, 3, 4].map((s) => (
                  <motion.span
                    key={s}
                    className={`text-xs font-medium ${
                      s <= step ? "text-[#ff9d54]" : "text-gray-500"
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: s * 0.1 }}
                  >
                    Step {s}
                  </motion.span>
                ))}
              </div>
              <div className="h-2 bg-[#3a3a3a] rounded-full">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(step / 4) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Form Steps */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <motion.h2 
                    variants={itemVariants}
                    className="text-2xl font-bold text-[#ff9d54]"
                  >
                    Tell us about yourself
                  </motion.h2>

                  <motion.div variants={itemVariants} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                        <RiUserLine className="text-[#ff9d54]" /> Your Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-[#1c1b1b] border border-[#3a3a3a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9d54]"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                        <RiCalendarLine className="text-[#ff9d54]" /> Your Age
                      </label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="w-full px-4 py-2 bg-[#1c1b1b] border border-[#3a3a3a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9d54]"
                        placeholder="25"
                        min="1"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="bg-[#1c1b1b] p-4 rounded-xl border-l-4 border-[#ff9d54]"
                  >
                    <div className="flex items-center gap-2 text-white font-medium">
                      <RiLightbulbLine className="text-xl text-[#ff9d54]" /> Tip
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Providing accurate information helps us personalize your learning experience.
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {/* Step 2: Career Goals with Quiz */}
              {step === 2 && (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <motion.h2 
                    variants={itemVariants}
                    className="text-2xl font-bold text-[#ff9d54]"
                  >
                    What are your career goals?
                  </motion.h2>

                  <motion.div variants={itemVariants} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                        <RiFlag2Line className="text-[#ff9d54]" /> Career Goal
                      </label>
                      <textarea
                        value={formData.careerGoal}
                        onChange={(e) => setFormData({ ...formData, careerGoal: e.target.value })}
                        className="w-full px-4 py-2 bg-[#1c1b1b] border border-[#3a3a3a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9d54] min-h-[100px]"
                        placeholder="I want to become a full-stack developer in 6 months..."
                      />
                    </div>
                  </motion.div>

                  {/* Career Assessment Quiz */}
                  <motion.div
                    variants={itemVariants}
                    className="space-y-4 mt-6"
                  >
                    <div className="flex items-center gap-2 text-white font-medium">
                      <RiQuestionLine className="text-xl text-[#ff9d54]" /> Career Interest Assessment
                    </div>
                    <p className="text-sm text-gray-300">
                      Please answer at least 5 questions to help us personalize your learning paths.
                      <span className="ml-1 font-medium text-[#ff9d54]">({Object.keys(formData.quizAnswers).length}/10 answered)</span>
                    </p>

                    <div className="space-y-8 max-h-[400px] overflow-y-auto pr-2 py-2">
                      {careerQuiz.map((question) => (
                        <div key={question.id} className="bg-[#1c1b1b] p-4 rounded-xl">
                          <p className="font-medium text-white mb-3">
                            Q{question.id}. {question.question}
                          </p>
                          <div className="space-y-2">
                            {question.options.map((option, index) => (
                              <div key={index} 
                                onClick={() => handleQuizAnswer(question.id, option)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                  formData.quizAnswers[question.id] === option.charAt(0)
                                    ? "bg-[#ff9d54]/20 border-2 border-[#ff9d54]"
                                    : "bg-[#2a2a2a] hover:bg-[#3a3a3a]"
                                }`}
                              >
                                <p className="text-sm text-gray-300">{option}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="bg-[#1c1b1b] p-4 rounded-xl border-l-4 border-[#ff9d54]"
                  >
                    <div className="flex items-center gap-2 text-white font-medium">
                      <RiLightbulbLine className="text-xl text-[#ff9d54]" /> Tip
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Be specific about your career goals and answer the quiz questions to help us recommend the right learning paths for you.
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {/* Step 3: Interests */}
              {step === 3 && (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <motion.h2 
                    variants={itemVariants}
                    className="text-2xl font-bold text-[#ff9d54]"
                  >
                    What are your interests?
                  </motion.h2>

                  <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentInterest}
                        onChange={(e) => setCurrentInterest(e.target.value)}
                        className="flex-1 px-4 py-2 bg-[#1c1b1b] border border-[#3a3a3a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9d54]"
                        placeholder="Add an interest"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddInterest(currentInterest)}
                        disabled={!currentInterest}
                        className="px-4 py-2 bg-[#ff9d54] text-white rounded-lg disabled:opacity-50 hover:bg-[#ff8a30]"
                      >
                        Add
                      </button>
                    </div>

                    {/* Interests tags */}
                    <div className="flex flex-wrap gap-2">
                      {formData.interests.map((interest, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-[#ff9d54]/20 text-[#ff9d54] px-3 py-1 rounded-full flex items-center gap-2"
                        >
                          <span>{interest}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveInterest(interest)}
                            className="text-[#ff9d54] hover:text-white"
                          >
                            &times;
                          </button>
                        </motion.div>
                      ))}
                    </div>

                    {/* Suggestions */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Suggestions:</p>
                      <div className="flex flex-wrap gap-2">
                        {interestSuggestions.map((interest, i) => (
                          <motion.button
                            key={i}
                            type="button"
                            onClick={() => handleAddInterest(interest)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1 bg-[#3a3a3a] hover:bg-[#ff9d54]/20 text-gray-300 rounded-full text-sm transition-colors"
                          >
                            + {interest}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="bg-[#1c1b1b] p-4 rounded-xl border-l-4 border-[#ff9d54]"
                  >
                    <div className="flex items-center gap-2 text-white font-medium">
                      <RiHeartLine className="text-xl text-[#ff9d54]" /> Tip
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Select interests that genuinely excite you. We'll use these to recommend relevant learning paths.
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {/* Step 4: Skills */}
              {step === 4 && (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <motion.h2 
                    variants={itemVariants}
                    className="text-2xl font-bold text-[#ff9d54]"
                  >
                    What skills do you already have?
                  </motion.h2>

                  <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        className="flex-1 px-4 py-2 bg-[#1c1b1b] border border-[#3a3a3a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9d54]"
                        placeholder="Add a skill"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSkill(currentSkill)}
                        disabled={!currentSkill}
                        className="px-4 py-2 bg-[#ff9d54] text-white rounded-lg disabled:opacity-50 hover:bg-[#ff8a30]"
                      >
                        Add
                      </button>
                    </div>

                    {/* Skills tags */}
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-[#ff9d54]/20 text-[#ff9d54] px-3 py-1 rounded-full flex items-center gap-2"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-[#ff9d54] hover:text-white"
                          >
                            &times;
                          </button>
                        </motion.div>
                      ))}
                    </div>

                    {/* Suggestions */}
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Suggestions:</p>
                      <div className="flex flex-wrap gap-2">
                        {skillSuggestions.map((skill, i) => (
                          <motion.button
                            key={i}
                            type="button"
                            onClick={() => handleAddSkill(skill)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1 bg-[#3a3a3a] hover:bg-[#ff9d54]/20 text-gray-300 rounded-full text-sm transition-colors"
                          >
                            + {skill}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="bg-[#1c1b1b] p-4 rounded-xl border-l-4 border-[#ff9d54]"
                  >
                    <div className="flex items-center gap-2 text-white font-medium">
                      <RiToolsLine className="text-xl text-[#ff9d54]" /> Tip
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Don't worry if you're a beginner. This helps us understand your current level and tailor content accordingly.
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <motion.div
                className="flex justify-between mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {step > 1 && (
                  <motion.button
                    type="button"
                    onClick={handlePrevStep}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 bg-[#3a3a3a] text-gray-300 rounded-lg hover:bg-[#333333]"
                    disabled={isSubmitting}
                  >
                    Back
                  </motion.button>
                )}
                {step < 4 ? (
                  <motion.button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!isStepValid() || isSubmitting}
                    whileHover={{ scale: isStepValid() && !isSubmitting ? 1.05 : 1 }}
                    whileTap={{ scale: isStepValid() && !isSubmitting ? 0.95 : 1 }}
                    className="ml-auto px-6 py-2 bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    Continue <RiArrowRightLine />
                  </motion.button>
                ) : (
                  <div className="ml-auto flex gap-3">
                    {profileExists && (
                      <motion.button
                        type="button"
                        onClick={() => navigate("/learning-path")}
                        whileHover={{ scale: !isSubmitting ? 1.05 : 1 }}
                        whileTap={{ scale: !isSubmitting ? 0.95 : 1 }}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-[#3a3a3a] hover:bg-[#333333] text-gray-300 rounded-lg flex items-center gap-2"
                      >
                        Skip to Dashboard
                      </motion.button>
                    )}
                    <motion.button
                      type="submit"
                      onClick={(e) => {
                        console.log('👆 Button clicked directly!');
                        if (!isSubmitting) {
                          handleSubmit(e);
                        }
                      }}
                      whileHover={{ scale: !isSubmitting ? 1.05 : 1 }}
                      whileTap={{ scale: !isSubmitting ? 0.95 : 1 }}
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] text-white rounded-lg flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {loadingMessage}
                        </>
                      ) : profileExists ? (
                        <>Update Profile <RiArrowRightLine /></>
                      ) : (
                        <>Complete Profile <RiArrowRightLine /></>
                      )}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ProfileForm;