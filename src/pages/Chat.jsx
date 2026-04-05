import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateChatResponse } from '../config/llm';
import { 
  RiSendPlaneFill, 
  RiUserLine, 
  RiRobot2Line, 
  RiDeleteBin6Line,
  RiRefreshLine,
  RiLightbulbLine,
  RiTimeLine,
  RiChat1Line,
  RiSettings4Line,
  RiFileCopyLine,
  RiCheckLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiStarLine
} from 'react-icons/ri';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import Portal from '../components/Portal';
import rehypeRaw from 'rehype-raw';
import { databases } from '../config/database';
import { useAuth } from '../context/AuthContext';
import { Query } from 'appwrite';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const chatEndRef = useRef(null);
  const { user } = useAuth();
  const [pathsData, setPathsData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [animateInput, setAnimateInput] = useState(false);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ 
        role: 'assistant', 
        content: "👋 Hi! I'm your AI learning assistant. I have access to your learning paths and can help you with specific topics or general guidance. What would you like to discuss?" 
      }]);
    }
  }, []);

  const preprocessGeminiResponse = (content) => {
    // Ensure code blocks are properly formatted
    return content.replace(/```([\s\S]*?)```/g, (match, code) => {
      const lines = code.trim().split('\n');
      let language = 'plaintext';
      
      // Check if first line contains language specification
      if (lines[0] && !lines[0].includes('=') && !lines[0].includes('{')) {
        language = lines[0].trim();
        lines.shift();
      }
      
      return `\`\`\`${language}\n${lines.join('\n')}\`\`\``;
    });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setIsTyping(true);
    setAnimateInput(true);
    setTimeout(() => setAnimateInput(false), 300);

    try {
      // Create enhanced context with learning paths
      const context = {
        paths: pathsData?.map(path => ({
          name: path.careerName,
          modules: JSON.parse(path.modules),
          progress: path.progress,
          completedModules: JSON.parse(path.completedModules)
        })) || [],
        currentGoals: pathsData?.[0]?.careerName || "career development",
      };

      const response = await generateChatResponse(input, context);
      const formattedResponse = preprocessGeminiResponse(response);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: formattedResponse 
      }]);
      
      // Generate new suggestions based on the conversation
      generateSuggestions(pathsData);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    fetchLearningPaths();
  }, [user]);

  const fetchLearningPaths = async () => {
    if (!user) return;
    
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_CAREER_PATHS_COLLECTION_ID,
        [Query.equal("userID", user.$id)]
      );
      
      setPathsData(response.documents);
      generateSuggestions(response.documents);
    } catch (error) {
      console.error("Error fetching learning paths:", error);
    }
  };

  const generateSuggestions = (paths) => {
    if (!paths) return;
    
    const suggestions = [
      "Help me understand advanced concepts in " + (paths[0]?.careerName || "my career path"),
      "What should I focus on next in my learning journey?",
      "Can you explain " + (paths[0]?.modules ? JSON.parse(paths[0].modules)[0] : "the fundamentals"),
      "Give me practice exercises for " + (paths[0]?.careerName || "my current module"),
    ];
    
    setSuggestions(suggestions);
  };

  const handlePurgeChat = () => {
    const confirmPurge = window.confirm("Are you sure you want to clear the chat history?");
    if (confirmPurge) {
      setMessages([{ role: 'assistant', content: "👋 Hi! I'm your AI learning assistant. I have access to your learning paths and can help you with specific topics or general guidance. What would you like to discuss?" }]);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatMessage = (content) => {
    return (
      <div className={`prose prose-sm sm:prose-base max-w-none break-words ${
        messages.find(m => m.content === content)?.role === 'user' 
          ? 'prose-invert' 
          : ''
      }`}>
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          components={{
            code({ node, inline, children, ...props }) {
              const match = /language-(\w+)/.exec(props.className || '');
              const code = String(children).replace(/\n$/, '');
              
              return !inline && match ? (
                <div className="my-2 sm:my-4 rounded-lg overflow-hidden bg-gray-800 border border-[#3a3a3a]">
                  <div className="px-2 sm:px-4 py-1.5 sm:py-2 flex justify-between items-center border-b border-gray-700 bg-[#1c1b1b]">
                    <span className="text-[10px] sm:text-xs text-[#ff9d54] uppercase">{match[1]}</span>
                    <button
                      onClick={() => handleCopyCode(code)}
                      className="text-gray-400 hover:text-[#ff9d54] transition-colors text-xs sm:text-sm flex items-center gap-1"
                    >
                      {copiedCode === code ? (
                        <>
                          <RiCheckLine className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Copied!</span>
                        </>
                      ) : (
                        <>
                          <RiFileCopyLine className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      customStyle={{
                        margin: 0,
                        padding: '0.75rem',
                        background: '#1e1e1e',
                        fontSize: '0.85rem',
                        lineHeight: '1.4'
                      }}
                      wrapLines={true}
                      wrapLongLines={true}
                    >
                      {code}
                    </SyntaxHighlighter>
                  </div>
                </div>
              ) : (
                <code className="px-1.5 py-0.5 text-sm rounded bg-[#3a3a3a] text-[#ff9d54] break-all" {...props}>
                  {children}
                </code>
              );
            },
            p: ({ children }) => <p className="mb-2 sm:mb-4 last:mb-0 text-sm sm:text-base">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-4 mb-2 sm:mb-4 last:mb-0 text-sm sm:text-base">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 sm:mb-4 last:mb-0 text-sm sm:text-base">{children}</ol>,
            li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
            pre: ({ children }) => <pre className="overflow-x-auto max-w-full">{children}</pre>,
            h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-[#ff9d54]">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-bold mb-2 text-[#ff9d54]">{children}</h2>,
            h3: ({ children }) => <h3 className="text-md font-bold mb-2 text-[#ff9d54]">{children}</h3>,
            a: ({ children, href }) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noreferrer" 
                className="text-[#ff9d54] underline hover:text-[#ff8a30] transition-colors"
              >
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-[#ff9d54] pl-4 italic text-gray-300 my-2">
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  const renderSuggestions = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex flex-wrap gap-2 px-4 py-3 bg-[#1c1b1b] border-t border-[#3a3a3a]"
    >
      <div className="w-full flex justify-between items-center mb-2">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <RiLightbulbLine className="text-[#ff9d54]" /> Suggestions
        </span>
        <button 
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="text-xs text-gray-400 hover:text-[#ff9d54] flex items-center gap-1"
        >
          {showSuggestions ? (
            <>Hide <RiArrowUpSLine className="w-3 h-3" /></>
          ) : (
            <>Show <RiArrowDownSLine className="w-3 h-3" /></>
          )}
        </button>
      </div>
      
      {showSuggestions && (
        <div className="w-full flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#ff9d54]/20 text-[#ff9d54] rounded-full text-sm transition-colors border border-[#3a3a3a] flex items-center gap-1"
              onClick={() => {
                setInput(suggestion);
                // Automatically send after a short delay
                setTimeout(() => handleSend(), 100);
              }}
            >
              <RiLightbulbLine className="w-3 h-3 text-[#ff9d54]" />
              {suggestion}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1c1b1b] to-[#252525] p-0 sm:p-6">
      <div className="h-[100dvh] sm:h-auto max-w-4xl mx-auto bg-[#2a2a2a]/80 backdrop-blur-sm rounded-none sm:rounded-2xl shadow-xl border-0 sm:border border-[#3a3a3a] overflow-hidden flex flex-col">
        {/* Enhanced Header */}
        <div className="p-4 sm:p-6 border-b border-[#3a3a3a] bg-[#1c1b1b]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="p-2 sm:p-3 bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] rounded-xl"
                >
                  <RiRobot2Line className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </motion.div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2a2a2a]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] bg-clip-text text-transparent">
                  AI Learning Assistant
                </h1>
                {pathsData && (
                  <p className="text-sm text-gray-400 mt-1">
                    Supporting your journey in {pathsData[0]?.careerName || "learning"}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePurgeChat}
                className="p-2 bg-[#3a3a3a] hover:bg-[#444] text-red-400 hover:text-red-500 rounded-lg transition-colors flex items-center gap-1"
                title="Clear chat"
              >
                <RiDeleteBin6Line className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">Clear</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Enhanced Chat Messages */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1c1b1b] to-[#252525]">
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 ${message.role === 'user' ? 'mt-1' : ''}`}>
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className={`p-2 rounded-lg shadow-md ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-br from-[#ff9d54] to-[#ff8a30]' 
                          : 'bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a]'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <RiUserLine className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      ) : (
                        <RiRobot2Line className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff9d54]" />
                      )}
                    </motion.div>
                  </div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-5 rounded-2xl shadow-md ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] text-white ml-auto rounded-tr-none'
                        : 'bg-[#2a2a2a] text-white rounded-tl-none border border-[#3a3a3a]'
                    }`}
                  >
                    {formatMessage(message.content)}
                    
                    {/* Timestamp for messages */}
                    <div className={`text-[10px] mt-2 flex justify-end ${
                      message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a]">
                    <RiRobot2Line className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff9d54]" />
                  </div>
                </div>
                <div className="bg-[#2a2a2a] p-4 rounded-2xl rounded-tl-none border border-[#3a3a3a] shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <motion.div
                        animate={{ scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 bg-[#ff9d54] rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1, delay: 0.2, repeat: Infinity }}
                        className="w-2 h-2 bg-[#ff9d54] rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1, delay: 0.4, repeat: Infinity }}
                        className="w-2 h-2 bg-[#ff9d54] rounded-full"
                      />
                    </div>
                    <span className="text-sm text-gray-400">Generating response...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Show suggestions above input */}
        {!isTyping && suggestions.length > 0 && renderSuggestions()}

        {/* Enhanced Input Area */}
        <div className="border-t border-[#3a3a3a] bg-[#1c1b1b] p-4">
          <motion.div 
            animate={animateInput ? { scale: [1, 0.98, 1] } : {}}
            transition={{ duration: 0.3 }}
            className="flex items-end gap-3 max-w-4xl mx-auto"
          >
            <div className="flex-1 bg-[#2a2a2a] rounded-xl shadow-md border border-[#3a3a3a] focus-within:border-[#ff9d54] focus-within:ring-2 focus-within:ring-[#ff9d54]/20 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your learning journey..."
                className="w-full p-3 rounded-xl border-none focus:ring-0 outline-none resize-none bg-transparent text-white"
                rows="1"
                style={{
                  minHeight: '44px',
                  maxHeight: '120px',
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="p-3 bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] text-white rounded-xl disabled:opacity-50 shadow-lg hover:shadow-[#ff9d54]/20 disabled:cursor-not-allowed"
            >
              <RiSendPlaneFill className="w-5 h-5" />
            </motion.button>
          </motion.div>
          
          {/* Keyboard shortcuts hint */}
          <div className="mt-2 text-center text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
