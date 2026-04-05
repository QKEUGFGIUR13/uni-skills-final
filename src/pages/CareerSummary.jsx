// /pages/CareerSummary.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RiArrowRightLine, RiDownloadLine, RiUserStarLine, RiCheckboxCircleFill, RiRefreshLine } from 'react-icons/ri';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { account } from "../config/appwrite";
import { databases } from "../config/database";
import { generateCareerSummary } from "../config/llm";
import { Query } from 'appwrite';
import { toast } from 'react-hot-toast';
import html2pdf from 'html2pdf.js';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = import.meta.env.VITE_USERS_COLLECTION_ID;
const CAREER_PATHS_COLLECTION_ID = import.meta.env.VITE_CAREER_PATHS_COLLECTION_ID;
const ASSESSMENTS_COLLECTION_ID = import.meta.env.VITE_ASSESSMENTS_COLLECTION_ID;

const normalizeCareerName = (name) => {
  return name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
};

const COLORS = ['#3b82f6', '#e5e7eb'];

const CareerSummary = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [careerPaths, setCareerPaths] = useState([]);
  const [careerSummaries, setCareerSummaries] = useState([]);
  const [userData, setUserData] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    fetchUserDataAndPaths();
  }, []);

  const fetchUserDataAndPaths = async () => {
    try {
      setLoading(true);
      const user = await account.get();

      const [userRes, pathsRes, assessmentsRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [Query.equal("userID", user.$id)]),
        databases.listDocuments(DATABASE_ID, CAREER_PATHS_COLLECTION_ID, [Query.equal("userID", user.$id)]),
        databases.listDocuments(DATABASE_ID, ASSESSMENTS_COLLECTION_ID, [Query.equal("userID", user.$id)])
      ]);

      const userDoc = userRes.documents[0];
      const assessmentData = assessmentsRes.documents.map((a) => ({
        moduleID: a.moduleID,
        moduleName: a.moduleName || `Module ${a.moduleID}`,
        score: a.score,
        feedback: a.feedback
      }));

      const parsedUser = {
        ...userDoc,
        interests: Array.isArray(userDoc.interests) ? userDoc.interests : [],
        skills: Array.isArray(userDoc.skills) ? userDoc.skills : []
      };

      const normalizedGoal = normalizeCareerName(userDoc.careerGoal);
      const nameMap = new Map();

      const paths = pathsRes.documents.map(path => ({
        ...path,
        modules: JSON.parse(path.modules || "[]"),
        completedModules: JSON.parse(path.completedModules || "[]"),
        recommendedSkills: JSON.parse(path.recommendedSkills || "[]"),
        aiNudges: JSON.parse(path.aiNudges || "[]")
      }));

      paths.forEach(path => {
        const name = normalizeCareerName(path.careerName);
        if (!name || name === normalizedGoal) return;

        if (!nameMap.has(name)) nameMap.set(name, path);
        else {
          const existing = nameMap.get(name);
          if ((path.modules?.length || 0) > (existing.modules?.length || 0) || path.progress > existing.progress) {
            nameMap.set(name, path);
          }
        }
      });

      const keptPaths = Array.from(nameMap.values());
      
      setUserData(parsedUser);
      setAssessments(assessmentData);
      setCareerPaths(keptPaths);
    } catch (err) {
      toast.error("Failed to load career paths");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateSummaries = async () => {
    if (!userData || careerPaths.length === 0) {
      toast.error("No career paths available to generate summaries");
      return;
    }

    try {
      setGeneratingSummary(true);
      const loadingToast = toast.loading("Generating career summaries... This may take a few minutes.");

      // Process summaries SEQUENTIALLY to avoid rate limits
      const allSummaries = [];
      
      for (let i = 0; i < careerPaths.length; i++) {
        const career = careerPaths[i];
        
        try {
          toast.loading(`Generating summary ${i + 1}/${careerPaths.length} for ${career.careerName}...`, { id: loadingToast });
          
          const summary = await generateCareerSummary({
            user: userData,
            careerPath: career,
            assessments
          });

          allSummaries.push({
            ref: React.createRef(),
            data: {
              name: userData.name,
              goal: career.careerName,
              progress: career.progress,
              completed: career.completedModules.length,
              total: career.modules.length
            },
            summaryText: summary
          });
          
          // Add delay between summaries to avoid rate limits
          if (i < careerPaths.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
          }
        } catch (error) {
          console.error(`Failed to generate summary for ${career.careerName}:`, error);
          // Continue with other summaries even if one fails
          allSummaries.push({
            ref: React.createRef(),
            data: {
              name: userData.name,
              goal: career.careerName,
              progress: career.progress,
              completed: career.completedModules.length,
              total: career.modules.length
            },
            summaryText: `Unable to generate summary for ${career.careerName}. Please try again later.`
          });
        }
      }

      refs.current = allSummaries.map((s) => s.ref);
      setCareerSummaries(allSummaries);
      toast.dismiss(loadingToast);
      toast.success(`Successfully generated ${allSummaries.length} career summaries!`);
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to generate summaries");
      console.error("Error generating summaries:", err);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleDownload = async (ref, fileName) => {
    if (!ref.current) return toast.error("Nothing to download!");
    try {
      toast.loading("Preparing PDF...");
      await html2pdf().set({
        margin: 0.5,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      }).from(ref.current).save();
      toast.dismiss();
      toast.success("PDF downloaded!");
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to generate PDF");
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-[#ff9d54] bg-[#1c1b1b]">Loading career paths...</div>;
  }

  return (
    <div className="md:p-6 min-h-screen bg-gradient-to-br from-[#1c1b1b] to-[#252525] space-y-10">
      {/* Generate Summary Button */}
      {careerSummaries.length === 0 && (
        <motion.div
          className="max-w-xl mx-auto bg-[#2a2a2a]/70 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-[#3a3a3a] text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-[#ff9d54] mb-4">Career Summary</h1>
          <p className="text-gray-300 mb-6">
            Generate detailed summaries of your progress in each career path. 
            This may take a moment as our AI analyzes your learning journey.
          </p>
          <button
            onClick={generateSummaries}
            disabled={generatingSummary || careerPaths.length === 0}
            className={`px-6 py-3 bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] text-white rounded-lg flex items-center gap-2 mx-auto ${
              generatingSummary || careerPaths.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:from-[#ff8a30] hover:to-[#ff9d54]'
            }`}
          >
            {generatingSummary ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Summaries...
              </>
            ) : (
              <>
                <RiRefreshLine className="text-xl" /> Generate Career Summaries
              </>
            )}
          </button>
          {careerPaths.length === 0 && !loading && (
            <p className="text-red-400 mt-4">
              No career paths found. Please create learning paths first.
            </p>
          )}
          <div className="mt-6">
            <button
              className="px-5 py-2 bg-[#3a3a3a] text-[#ff9d54] rounded-lg flex gap-2 items-center hover:bg-[#444] transition-colors mx-auto"
              onClick={() => navigate("/dashboard")}
            >
              <RiArrowRightLine className="rotate-180" /> Back to Dashboard
            </button>
          </div>
        </motion.div>
      )}

      {/* Career Summaries */}
      {careerSummaries.map((summary, index) => {
        const pieData = [
          { name: 'Completed', value: summary.data.completed },
          { name: 'Remaining', value: summary.data.total - summary.data.completed }
        ];

        return (
          <motion.div
            key={index}
            className="min-w-xs max-w-full mx-auto bg-[#2a2a2a]/70 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-5 md:p-6 lg:p-8 space-y-6 border border-[#3a3a3a]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-[#ff9d54] flex items-center gap-2">
                <RiUserStarLine /> Career Summary for {summary.data.goal}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-white">
                <span className="flex items-center gap-1"><RiCheckboxCircleFill className="text-[#ff9d54]" /> Modules: {summary.data.completed}/{summary.data.total}</span>
                <span className="flex items-center gap-1">🚀 Progress: {summary.data.progress}%</span>
              </div>
            </div>

            {/* PDF Content */}
            <div
              ref={summary.ref}
              className="summary-container bg-gradient-to-br from-[#1c1b1b] to-[#252525] text-white p-8 rounded-xl border border-[#3a3a3a] shadow-lg"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ff9d54] to-[#ff8a30] rounded-lg flex items-center justify-center">
                  <RiUserStarLine className="text-white text-xl" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] bg-clip-text text-transparent">
                  Career Summary Report for {summary.data.name}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#2a2a2a]/70 p-4 rounded-lg border border-[#3a3a3a]">
                  <p className="text-gray-400 text-sm">Career Goal</p>
                  <p className="text-white font-semibold">{summary.data.goal}</p>
                </div>
                <div className="bg-[#2a2a2a]/70 p-4 rounded-lg border border-[#3a3a3a]">
                  <p className="text-gray-400 text-sm">Modules Completed</p>
                  <p className="text-white font-semibold">{summary.data.completed}/{summary.data.total}</p>
                </div>
                <div className="bg-[#2a2a2a]/70 p-4 rounded-lg border border-[#3a3a3a]">
                  <p className="text-gray-400 text-sm">Overall Progress</p>
                  <p className="text-white font-semibold">{summary.data.progress}%</p>
                </div>
              </div>

              <div className="bg-[#2a2a2a]/70 p-6 rounded-xl border border-[#3a3a3a] mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="w-full md:w-1/2 flex flex-col items-center mb-4 md:mb-0">
                    <div style={{ width: '200px', height: '200px' }}>
                      <PieChart width={200} height={200}>
                        <Pie 
                          data={pieData} 
                          dataKey="value" 
                          cx="50%" 
                          cy="50%" 
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={2}
                          label
                        >
                          {pieData.map((entry, i) => (
                            <Cell 
                              key={i} 
                              fill={i === 0 ? '#ff9d54' : '#3a3a3a'} 
                              stroke={i === 0 ? '#ff8a30' : '#444444'} 
                              strokeWidth={1}
                            />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#2a2a2a', borderColor: '#3a3a3a', color: 'white' }} />
                      </PieChart>
                    </div>
                  </div>

                  <div className="w-full md:w-1/2">
                    <h3 className="text-xl font-semibold text-[#ff9d54] mb-4">Learning Progress</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-300 text-sm">Completed Modules</span>
                          <span className="text-[#ff9d54] font-medium">{summary.data.completed}</span>
                        </div>
                        <div className="w-full bg-[#3a3a3a] rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] h-2 rounded-full"
                            style={{ width: `${summary.data.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-300 text-sm">Remaining Modules</span>
                          <span className="text-gray-400 font-medium">{summary.data.total - summary.data.completed}</span>
                        </div>
                        <div className="w-full bg-[#3a3a3a] rounded-full h-2">
                          <div 
                            className="bg-[#444444] h-2 rounded-full"
                            style={{ width: `${100 - summary.data.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-[#ff9d54] to-[#ff8a30]"></div>
                          <span className="text-xs text-gray-300">Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-[#3a3a3a]"></div>
                          <span className="text-xs text-gray-300">Remaining</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#2a2a2a]/70 p-6 rounded-xl border border-[#3a3a3a]">
                <h3 className="text-xl font-semibold text-[#ff9d54] mb-4">AI Career Analysis</h3>
                <div className="space-y-4 text-gray-300">
                  {summary.summaryText.split("\n\n").map((block, idx) => {
                    const formatted = block
                      .replace(/\*\*(.*?)\*\*/g, "<span class='text-[#ff9d54] font-semibold'>$1</span>")
                      .replace(/\n/g, "<br/>");

                    return (
                      <div key={idx} className="mb-3" dangerouslySetInnerHTML={{ __html: formatted }} />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 justify-center">
              <button
                className="px-5 py-2 bg-[#3a3a3a] text-[#ff9d54] rounded-lg flex gap-2 items-center hover:bg-[#ff9d54]/20 transition-colors"
                onClick={() => handleDownload(summary.ref, `${summary.data.goal.replace(/\s/g, "_")}_Summary.pdf`)}
              >
                <RiDownloadLine /> Download PDF
              </button>
              <button
                className="px-5 py-2 bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] text-white rounded-lg flex gap-2 items-center"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard <RiArrowRightLine />
              </button>
            </div>
          </motion.div>
        );
      })}

      {/* Generate More Button */}
      {careerSummaries.length > 0 && (
        <div className="flex justify-center pb-10">
          <button
            onClick={generateSummaries}
            disabled={generatingSummary}
            className={`px-5 py-2 bg-[#3a3a3a] text-[#ff9d54] rounded-lg flex gap-2 items-center hover:bg-[#444] transition-colors ${
              generatingSummary ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {generatingSummary ? (
              <>
                <div className="w-4 h-4 border-2 border-[#ff9d54] border-t-transparent rounded-full animate-spin"></div>
                Regenerating...
              </>
            ) : (
              <>
                <RiRefreshLine /> Regenerate Summaries
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CareerSummary;
