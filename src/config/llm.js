import axios from "axios";
import JSON5 from "json5";

// Debugging flag - set to true to enable verbose logging
const DEBUG_MODE = true;

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Helper function for consistent debug logging
const debugLog = (message, data = null) => {
  if (!DEBUG_MODE) return;
  
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
};

// Log API requests for debugging
const logApiRequest = (model, success = true, error = null) => {
  if (!DEBUG_MODE) return;
  
  const requestLog = {
    timestamp: new Date().toISOString(),
    model,
    success,
    error: error ? {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    } : null
  };
  
  debugLog(`API Request: ${model} - ${success ? 'SUCCESS' : 'FAILED'}`, requestLog);
};

// Updated list of GROQ models - only verified working models
const GROQ_MODELS = [
  "llama-3.3-70b-versatile", // Latest high-performance model
  "llama-3.1-8b-instant", // Fast and reliable
];

// Model capabilities and use cases - for automatic selection
const MODEL_CAPABILITIES = {
  "llama-3.3-70b-versatile": {
    contextWindow: 128000,
    capability: "high",
    speed: "fast",
    useCase: ["complex", "technical", "creative", "detailed"]
  },
  "llama-3.1-8b-instant": {
    contextWindow: 128000,
    capability: "medium",
    speed: "very-fast",
    useCase: ["simple", "interactive", "chat"]
  },
};

// Enhanced retry and backoff strategy
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 3000; // 3 seconds - increased for rate limits
const MAX_RETRY_DELAY = 30000; // Maximum 30 seconds
const RATE_LIMIT_STATUS_CODES = [429, 500, 502, 503, 504];
const RATE_LIMIT_DELAY = 10000; // 10 second delay when hitting rate limits
const BETWEEN_REQUEST_DELAY = 2000; // 2 second delay between all requests

// Track API usage to prevent rate limit issues
let apiRequestLog = {
  timestamp: Date.now(),
  count: 0,
  resetInterval: 60000, // 1 minute
  maxRequestsPerInterval: 25, // Adjust based on actual rate limits
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Reset request counter periodically
setInterval(() => {
  apiRequestLog = {
    ...apiRequestLog,
    timestamp: Date.now(),
    count: 0
  };
}, apiRequestLog.resetInterval);

// Check if we're approaching rate limits
const shouldThrottle = () => {
  const now = Date.now();
  const elapsed = now - apiRequestLog.timestamp;
  
  // If we're still in the same interval and approaching limit
  if (elapsed < apiRequestLog.resetInterval && 
      apiRequestLog.count >= apiRequestLog.maxRequestsPerInterval * 0.9) {
    return true;
  }
  return false;
};

// Adaptive throttling based on current usage
const throttleIfNeeded = async () => {
  if (shouldThrottle()) {
    const remainingTime = apiRequestLog.resetInterval - (Date.now() - apiRequestLog.timestamp);
    console.log(`Approaching rate limit, throttling for ${remainingTime}ms`);
    await sleep(remainingTime > 0 ? remainingTime : 1000);
  }
};

const validateModuleContent = (content) => {
  if (!content?.title || !Array.isArray(content?.sections)) return false;
  if (content.sections.length === 0) return false;

  // Validate each section has required fields
  return content.sections.every(
    (section) =>
      section.title &&
      typeof section.content === "string" &&
      section.content.length > 50
  );
};

const cleanCodeExample = (codeExample) => {
  if (!codeExample) return null;
  try {
    // Clean any markdown code blocks from the code
    const cleanCode = codeExample.code
      ?.replace(/```[\w]*\n?/g, "") // Remove code block markers
      ?.replace(/```$/gm, "") // Remove ending markers
      ?.replace(/^\/\/ /gm, "") // Clean comments
      ?.trim();

    return {
      language: codeExample.language || "javascript",
      code: cleanCode || "",
      explanation: codeExample.explanation || "",
    };
  } catch (error) {
    console.error("Code cleaning error:", error);
    return null;
  }
};

const sanitizeContent = (text) => {
  try {
    // Remove markdown code blocks and other problematic characters
    return text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .replace(/`/g, "")
      .replace(/\\n/g, "\n")
      .replace(/\\\\/g, "\\")
      .trim();
  } catch (error) {
    console.error("Content sanitization error:", error);
    return text;
  }
};

const sanitizeJSON = (text) => {
  try {
    // First, remove markdown code block markers
    let cleanedText = text.replace(/```(?:json)?/g, "").trim();

    // Extract JSON object/array from response
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) return text;

    // More aggressive cleaning for problematic characters
    let jsonText = jsonMatch[0]
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .replace(/\\(?!["\\/bfnrtu])/g, "\\\\") // Fix invalid escapes
      .replace(/\\n/g, " ") // Replace newlines with spaces
      .replace(/\r?\n|\r/g, " ") // Replace carriage returns
      .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
      .replace(/([^\\])\\"/g, '$1\\\\"') // Fix double quote escaping
      .replace(/([^\\])\\/g, '$1\\\\') // Fix backslash escaping
      .replace(/"\s+"/g, '" "') // Fix spaces between quotes
      .replace(/"\s*:\s*"/g, '":"') // Fix spaces in key-value pairs
      .trim();

    try {
      // First try with JSON5
      return JSON5.parse(jsonText);
    } catch (json5Error) {
      console.warn("JSON5 parse failed, trying fallback cleaning:", json5Error.message);
      
      // More aggressive cleaning if JSON5 fails
      jsonText = jsonText
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":') // Ensure property names are quoted
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/\\"/g, '\\"') // Fix escaped quotes
        .replace(/\\\\/g, '\\') // Fix double backslashes
        .replace(/,\s*}/g, "}") // Remove trailing commas in objects
        .replace(/,\s*\]/g, "]"); // Remove trailing commas in arrays
      
      // Try to manually fix the JSON structure
      try {
        return JSON5.parse(jsonText);
      } catch (finalError) {
        console.error("Final JSON5 parse attempt failed:", finalError);
        
        // Last resort: try to create a valid JSON structure manually
        if (text.includes("frontHTML") && text.includes("backHTML")) {
          // This is likely a flashcard response
          const cards = [];
          const cardMatches = text.match(/\{\s*"id"\s*:\s*\d+[\s\S]*?(?=\}\s*,\s*\{|\}\s*\]|\}$)/g);
          
          if (cardMatches) {
            cardMatches.forEach((cardText, index) => {
              cards.push({
                id: index + 1,
                frontHTML: extractValue(cardText, "frontHTML") || `Question ${index + 1}`,
                backHTML: extractValue(cardText, "backHTML") || `Answer ${index + 1}`
              });
            });
            
            if (cards.length > 0) {
              return cards;
            }
          }
        }
        
        // If we can't extract structured data, return the cleaned text for manual parsing
        return text;
      }
    }
  } catch (error) {
    console.error("JSON sanitization error", error);
    return text; // Return original text if all attempts fail
  }
};

// Helper function to extract values from malformed JSON
const extractValue = (text, key) => {
  const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]*(?:\\\\.[^"]*)*)"`);
  const match = text.match(regex);
  return match ? match[1].replace(/\\"/g, '"') : null;
};

const isCodeRelatedTopic = (topic) => {
  const techKeywords = {
    programming: [
      "javascript",
      "python",
      "java",
      "coding",
      "programming",
      "typescript",
    ],
    web: [
      "html",
      "css",
      "react",
      "angular",
      "vue",
      "frontend",
      "backend",
      "fullstack",
    ],
    database: ["sql", "database", "mongodb", "postgres"],
    software: ["api", "development", "software", "git", "devops", "algorithms"],
    tech: ["computer science", "data structures", "networking", "cloud"],
  };

  const lowerTopic = topic.toLowerCase();
  return Object.values(techKeywords).some((category) =>
    category.some((keyword) => lowerTopic.includes(keyword))
  );
};

// Function to automatically select the best model for the task
const selectBestModel = (task, contentType, complexity = "medium", isInteractive = false) => {
  // Match task requirements with model capabilities
  if (isInteractive && complexity !== "high") {
    // For interactive tasks where speed matters but not high complexity
    return "llama-3.1-8b-instant";
  }
  
  if (complexity === "high" && (contentType === "technical" || contentType === "code")) {
    // For complex technical content or code generation
    return "llama-3.3-70b-versatile";
  }
  
  if (complexity === "medium" && contentType !== "technical") {
    // For medium complexity non-technical content
    return "llama3-8b-8192";
  }
  
  // Default to the most capable model for other cases
  return "llama-3.3-70b-versatile";
};

// Calculate exponential backoff with jitter for more effective retries
const calculateBackoff = (attempt) => {
  const exponentialDelay = BASE_RETRY_DELAY * Math.pow(2, attempt - 1);
  const jitter = Math.random() * BASE_RETRY_DELAY;
  return Math.min(exponentialDelay + jitter, MAX_RETRY_DELAY);
};

// Enhanced completion function with better error handling and rate limiting
const llmCompletion = async (prompt, preferredModel = "llama-3.1-8b-instant") => {
  // Always add delay between requests to avoid rate limits
  await sleep(BETWEEN_REQUEST_DELAY);
  
  // Start with preferred model, then fall back to others if needed
  const modelsToTry = [
    preferredModel,
    ...GROQ_MODELS.filter((model) => model !== preferredModel),
  ];

  let lastError = null;
  let statusCode = null;

  // Implement throttling to prevent rate limit issues
  await throttleIfNeeded();
  apiRequestLog.count++;

  // First attempt - try with the preferred model
  try {
    debugLog(`Initial attempt with preferred model: ${preferredModel}`);
    const response = await callGroqApi(prompt, preferredModel);
    return response;
  } catch (initialError) {
    lastError = initialError;
    statusCode = initialError.status || initialError.response?.status;
    debugLog(`Preferred model ${preferredModel} failed (${statusCode}), switching to fallbacks`);
    
    // If rate limited, wait longer before trying fallbacks
    if (statusCode === 429) {
      debugLog(`Rate limited, waiting ${RATE_LIMIT_DELAY}ms before fallback`);
      await sleep(RATE_LIMIT_DELAY);
    }
  }

  // Fallback logic - try each remaining model in turn
  const remainingModels = modelsToTry.filter(model => model !== preferredModel);
  
  for (let i = 0; i < remainingModels.length; i++) {
    const model = remainingModels[i];
    
    try {
      debugLog(`Trying fallback model ${i + 1}/${remainingModels.length}: ${model}`);
      
      // Add delay between fallback attempts
      if (i > 0) {
        await sleep(2000);
      }
      
      const response = await callGroqApi(prompt, model);
      debugLog(`✅ Successfully generated content with fallback model: ${model}`);
      return response;
    } catch (fallbackError) {
      lastError = fallbackError;
      const errorStatus = fallbackError.status || fallbackError.response?.status;
      debugLog(`❌ Fallback model ${model} failed (${errorStatus})`);
      
      // If rate limited on fallback, wait even longer
      if (errorStatus === 429 && i < remainingModels.length - 1) {
        debugLog(`Rate limited on fallback, waiting ${RATE_LIMIT_DELAY}ms`);
        await sleep(RATE_LIMIT_DELAY);
      }
    }
  }

  // If we get here, all models failed
  const errorMessage = lastError?.response?.data?.error?.message || lastError?.message || "Unknown error";
  debugLog(`❌ All models failed after trying ${modelsToTry.length} models: ${errorMessage}`);
  throw new Error(`All GROQ models failed: ${errorMessage}`);
};

// Helper function to make the actual API call - separated for cleaner error handling
const callGroqApi = async (prompt, model) => {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 4096,
        top_p: 0.95,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        timeout: 30000,
      }
    );
    
    logApiRequest(model, true);
    return response.data.choices[0].message.content;
  } catch (error) {
    logApiRequest(model, false, error);
    
    // Enhance the error with more context
    const enhancedError = new Error(`GROQ API call failed with model ${model}: ${error.message}`);
    enhancedError.status = error.response?.status;
    enhancedError.originalError = error;
    enhancedError.model = model;
    
    throw enhancedError;
  }
};

// Updated module content generation function with newer models
export const generateModuleContent = async (
  moduleName,
  options = { detailed: false }
) => {
  if (!moduleName || typeof moduleName !== "string") {
    throw new Error("Invalid module name provided");
  }

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const isTechTopic = isCodeRelatedTopic(moduleName);
      const contentComplexity = options.detailed ? "high" : "medium";

      // Enhanced prompt for content generation
      const prompt = `Generate factual educational content about: "${moduleName}"

      IMPORTANT CONSTRAINTS:
      - ONLY include FACTUAL content that you are CERTAIN about
      - If you don't know something, provide general, established information instead of specifics
      - Do NOT include any subjective opinions or unverified information
      - Focus only on core concepts that are well-established in this field
      - AVOID mentioning specific products, companies, or people unless absolutely central to the topic
      - DO NOT reference ANY current events, trends, or statistics
      - DO NOT reference your capabilities or limitations

      CONTENT TYPE: ${
        isTechTopic ? "Technical/Programming" : "General Education"
      }
      LEVEL: ${options.detailed ? "Advanced" : "Basic"}
      
      CONTENT STRUCTURE:
      - Begin with fundamental concepts that have remained stable for years
      - Use factual, precise language without speculation
      - Focus on explaining core principles and concepts
      - Include practical examples that illustrate key points
      - For code examples, use standard syntax and common patterns
      ${
        isTechTopic
          ? "- Include code that follows standard conventions and works correctly"
          : ""
      }
      
      FORMAT:
      Return a JSON object with this EXACT structure:
      {
        "title": "Clear title for ${moduleName}",
        "type": "${isTechTopic ? "technical" : "general"}",
        "sections": [
          {
            "title": "Core Concept Name",
            "content": "Factual explanation with concrete examples",
            "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
            ${
              isTechTopic
                ? `"codeExample": {
              "language": "${getAppropriateLanguage(moduleName)}",
              "code": "// Standard, executable code example\\nfunction example() {\\n  // implementation\\n}",
              "explanation": "Explanation of how the code works"
            }`
                : '"codeExample": null'
            }
          }
        ]
      }
      
      Create ${
        options.detailed ? "4" : "3"
      } focused sections that cover essential aspects of the topic.
      Keep all content factual and verifiable.
      
      ONLY RETURN VALID JSON WITHOUT ANY EXPLANATION OR INTRODUCTION.`;

      // Select the best model for this task
      const preferredModel = selectBestModel(
        "content-generation", 
        isTechTopic ? "technical" : "general", 
        contentComplexity
      );

      const text = await llmCompletion(prompt, preferredModel);
      const result = sanitizeJSON(text);
      const content = typeof result === 'string' ? JSON5.parse(result) : result;

      if (!validateModuleContent(content)) {
        throw new Error("Invalid content structure from LLM");
      }

      // Process and clean content
      content.sections = content.sections.map((section) => ({
        ...section,
        content: sanitizeContent(section.content),
        codeExample: section.codeExample
          ? cleanCodeExample(section.codeExample)
          : null,
      }));

      return content;
    } catch (error) {
      lastError = error;
      console.error(`Module content generation attempt ${attempt} failed:`, error.message);
      
      if (attempt < MAX_RETRIES) {
        const backoffTime = calculateBackoff(attempt);
        await sleep(backoffTime); // Exponential backoff
      }
    }
  }

  throw lastError || new Error("Failed to generate content after multiple attempts");
};

// Add helper function to determine appropriate language
const getAppropriateLanguage = (topic) => {
  const topicLower = topic.toLowerCase();
  const languageMap = {
    javascript: ["javascript", "js", "node", "react", "vue", "angular"],
    python: ["python", "django", "flask"],
    java: ["java", "spring"],
    html: ["html", "markup"],
    css: ["css", "styling", "scss"],
    sql: ["sql", "database", "mysql", "postgresql"],
    typescript: ["typescript", "ts"],
  };

  for (const [lang, keywords] of Object.entries(languageMap)) {
    if (keywords.some((keyword) => topicLower.includes(keyword))) {
      return lang;
    }
  }
  return "javascript"; // default language
};

export const generateFlashcards = async (topic, numCards = 5) => {
  if (!topic || typeof topic !== "string") {
    throw new Error("Invalid topic provided");
  }

  try {
    const prompt = `Generate ${numCards} educational flashcards on "${topic}" with increasing difficulty.
    
    **Requirements:**
    - The **front side (question)** must be **short and clear**.
    - The **back side (answer)** must be **detailed (3-4 sentences) and informative**.
    - Ensure **difficulty increases from Flashcard 1 to ${numCards}**:
      - Start with **basic concepts**.
      - Progress to **intermediate details**.
      - End with **advanced questions requiring deeper understanding**.
    - Format the response **strictly** as a JSON array:

    [
      { "id": 1, "frontHTML": "Basic question?", "backHTML": "Detailed easy explanation." },
      { "id": 2, "frontHTML": "Intermediate question?", "backHTML": "Detailed intermediate explanation." },
      { "id": ${numCards}, "frontHTML": "Advanced question?", "backHTML": "Detailed advanced explanation." }
    ]`;

    // Using our automatic model selection for flashcards (simple, interactive content)
    const selectedModel = selectBestModel("flashcards", "educational", "medium", true);
    const text = await llmCompletion(prompt, selectedModel);
    
    try {
      const result = sanitizeJSON(text);
      
      // Check if sanitizeJSON returned an already parsed object
      const flashcards = typeof result === 'string' ? JSON5.parse(result) : result;

      if (!Array.isArray(flashcards) || flashcards.length === 0) {
        throw new Error("Invalid flashcard format");
      }

      // Normalize the flashcard count
      const normalizedFlashcards = flashcards.slice(0, numCards);
      while (normalizedFlashcards.length < numCards) {
        normalizedFlashcards.push({
          id: normalizedFlashcards.length + 1,
          frontHTML: `Question about ${topic} ${normalizedFlashcards.length + 1}?`,
          backHTML: `Answer about ${topic} ${normalizedFlashcards.length + 1}.`
        });
      }

      return normalizedFlashcards;
    } catch (error) {
      console.error("Flashcard parsing error:", error);
      return Array.from({ length: numCards }, (_, i) => ({
        id: i + 1,
        frontHTML: `Basic to advanced ${topic} question ${i + 1}?`,
        backHTML: `Detailed answer explaining ${topic} at difficulty level ${
          i + 1
        }.`,
      }));
    }
  } catch (error) {
    throw new Error(`Failed to generate flashcards: ${error.message}`);
  }
};

export const generateQuizData = async (
  topic,
  numQuestions,
  moduleContent = ""
) => {
  try {
    // Check if we have valid content to work with
    const hasContent = moduleContent && moduleContent.trim().length > 50;

    // Extract the topic title from formats like "Module 1: Introduction to React"
    let cleanTopic = topic;
    if (topic.includes(":")) {
      cleanTopic = topic.split(":")[1].trim();
    } else if (topic.match(/Module\s+\d+/i)) {
      // If topic only contains "Module X", extract from moduleContent
      if (hasContent) {
        const firstLine = moduleContent.split("\n")[0];
        if (firstLine && firstLine.includes(":")) {
          cleanTopic = firstLine.split(":")[1].trim();
        }
      }
    }

    const prompt = `
      Create a quiz about "${cleanTopic}" with exactly ${numQuestions} questions.
      ${
        hasContent
          ? "Use the following content to create relevant questions:\n" +
            moduleContent.substring(0, 5000)
          : ""
      }
      
      Each question should be directly relevant to the topic "${cleanTopic}" and ${
      hasContent
        ? "based on the provided content."
        : "a typical course on this subject."
    }
      
      Each question should have:
      - A clear and challenging question
      - 4 answer options (A, B, C, D)
      - The correct answer(s)
      - A brief explanation of why the answer is correct
      - A point value (10 points by default)
      - A question type (either "single" for single-choice or "multiple" for multiple-choice)

      Return the quiz in this exact JSON format:
      {
        "topic": "${cleanTopic}",
        "questions": [
          {
            "question": "Question text goes here?",
            "answers": ["Answer A", "Answer B", "Answer C", "Answer D"],
            "correctAnswer": ["Answer A"], 
            "explanation": "Explanation of correct answer",
            "point": 10,
            "questionType": "single"
          },
          ...more questions...
        ]
      }
      
      For multiple-choice questions where more than one answer is correct, use the format:
      "correctAnswer": ["Answer A", "Answer C"]
      and set questionType to "multiple".
      
      Make sure all JSON is valid and question counts match exactly ${numQuestions}.
      If you cannot generate content on this specific topic, focus on generating questions about ${cleanTopic
        .split(" ")
        .slice(0, 3)
        .join(" ")}.
    `;

    // Determine complexity based on whether we have content and number of questions
    const complexity = hasContent && numQuestions > 5 ? "high" : "medium";
    const isTechTopic = isCodeRelatedTopic(cleanTopic);
    
    // Select appropriate model based on task requirements
    const selectedModel = selectBestModel(
      "quiz-generation",
      isTechTopic ? "technical" : "educational",
      complexity
    );
    
    const resultText = await llmCompletion(prompt, selectedModel);

    // Extract JSON from the response
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format");
    }

    const result = sanitizeJSON(jsonMatch[0]);
    
    // Check if sanitizeJSON returned an already parsed object
    const quizData = typeof result === 'string' ? JSON5.parse(result) : result;

    // Ensure the topic is properly set in the response
    if (
      !quizData.topic ||
      quizData.topic === "${topic}" ||
      quizData.topic === cleanTopic
    ) {
      quizData.topic = topic; // Use original topic for display purposes
    }

    return quizData;
  } catch (error) {
    console.error("Error generating quiz:", error);

    // Create a fallback quiz with the original topic
    return {
      topic: topic,
      questions: Array.from({ length: numQuestions }, (_, i) => ({
        question: `Question ${i + 1} about ${topic}?`,
        answers: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: ["Option A"],
        explanation: `This is the correct answer for question ${
          i + 1
        } about ${topic}.`,
        point: 10,
        questionType: "single",
      })),
    };
  }
};

export const generateChatResponse = async (message, context) => {
  try {
    // Create context-aware prompt
    const contextPrompt = `
      Context:
      Topic: ${
        context["What topic would you like to discuss today?"] || "General"
      }
      Level: ${
        context[
          "What's your current knowledge level in this topic? (Beginner/Intermediate/Advanced)"
        ] || "Intermediate"
      }
      Focus: ${
        context["What specific aspects would you like to focus on?"] ||
        "General understanding"
      }
      
      Be concise and helpful. Answer the following: ${message}
    `;

    // Interactive chat responses should be fast, use the instant model
    const selectedModel = selectBestModel("chat", "general", "medium", true);
    return await llmCompletion(contextPrompt, selectedModel);
  } catch (error) {
    console.error("Chat generation error:", error);
    throw new Error("Failed to generate response");
  }
};

export const generateQuiz = async (moduleName, numQuestions) => {
  if (!moduleName || typeof moduleName !== "string") {
    throw new Error("Invalid module name provided");
  }

  try {
    const prompt = `Generate a ${numQuestions} quiz for the topic: "${moduleName}" with 4 options each and the correct answer marked.
    
    **Requirements:**
    - Each question should test understanding of ${moduleName} concepts
    - Include a mix of difficulty levels (basic to advanced)
    - Provide 4 answer options for each question (a, b, c, d format)
    - Clearly mark the correct answer
    - Format as a JSON object:

    {
      "questions": [
        {
          "question": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": 0,
          "explanation": "Brief explanation of why this is correct"
        },
        // 4 more questions following the same format
      ]
    }`;

    // Use fast model for quiz generation to avoid rate limits
    const selectedModel = "llama-3.1-8b-instant";
    
    const text = await llmCompletion(prompt, selectedModel);

    try {
      const result = sanitizeJSON(text);
      
      // Check if sanitizeJSON returned an already parsed object
      const quizData = typeof result === 'string' ? JSON5.parse(result) : result;

      if (
        !quizData.questions ||
        !Array.isArray(quizData.questions) ||
        quizData.questions.length === 0
      ) {
        throw new Error("Invalid quiz format");
      }

      return quizData;
    } catch (error) {
      console.error("Quiz parsing error:", error);
      // Fallback quiz if parsing fails
      return {
        questions: [
          {
            question: `What is the main focus of ${moduleName}?`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctIndex: 0,
            explanation:
              "This is the correct answer based on the module content.",
          },
          {
            question: `Which of these is NOT related to ${moduleName}?`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctIndex: 1,
            explanation: "This option is unrelated to the topic.",
          },
          {
            question: `What is a key principle in ${moduleName}?`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctIndex: 2,
            explanation:
              "This principle is fundamental to understanding the topic.",
          },
          {
            question: `How does ${moduleName} apply to real-world scenarios?`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctIndex: 3,
            explanation:
              "This reflects the practical application of the concept.",
          },
          {
            question: `What advanced technique is associated with ${moduleName}?`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctIndex: 0,
            explanation: "This is an advanced technique in this field.",
          },
        ],
      };
    }
  } catch (error) {
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
};

// Enhanced retry function with improved backoff strategy
const retry = async (fn, retries = MAX_RETRIES, delay = BASE_RETRY_DELAY) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      const backoffTime = calculateBackoff(retries);
      console.log(`Retrying... Attempts left: ${retries - 1}, waiting ${backoffTime}ms`);
      await sleep(backoffTime);
      return retry(fn, retries - 1, delay);
    }
    throw error;
  }
};

// Consolidated function that handles both topic-based and career-based learning paths
export const generateLearningPath = async (
  goal,
  options = { type: "topic", detailed: false }
) => {
  if (!goal || typeof goal !== "string") {
    throw new Error("Invalid goal/topic provided");
  }

  // Determine if we're generating a simple topic path or a detailed career path
  const isCareerPath = options.type === "career";

  try {
    let prompt;

    if (isCareerPath) {
      prompt = `Create a structured learning path for someone who wants to learn about "${goal}". 
      Design a series of modules (between 5-7) that progressively build knowledge from basics to advanced concepts.
      
      Return the result as a JSON array with this structure:
      [
        {
          "title": "Module title",
          "description": "Brief description of what will be covered in this module",
          "estimatedTime": "Estimated time to complete (e.g., '2-3 hours')",
          "content": "Detailed content overview with key points to learn"
        }
      ]
      
      Make sure the content is comprehensive, accurate, and follows a logical progression from fundamentals to more complex topics.`;
    } else {
      prompt = `Generate a comprehensive learning path for: "${goal}"
      Requirements:
      - Create exactly 5 progressive modules
      - Each module should build upon previous knowledge
      - Focus on practical, hands-on learning
      - Include both theoretical and practical aspects
      
      Return ONLY a JSON array with exactly 5 strings in this format:
      ["Module 1: [Clear Title]", "Module 2: [Clear Title]", "Module 3: [Clear Title]", "Module 4: [Clear Title]", "Module 5: [Clear Title]"]
      `;
    }

    // Determine complexity and choose appropriate model
    const complexity = isCareerPath ? "high" : "medium";
    const isTechTopic = isCodeRelatedTopic(goal);
    
    // Select best model based on requirements
    const selectedModel = selectBestModel(
      "learning-path", 
      isTechTopic ? "technical" : "educational", 
      complexity
    );
    
    // Use retry pattern for all path generation
    const text = await retry(() => llmCompletion(prompt, selectedModel));

    try {
      // Extract JSON from the response
      const cleanText = sanitizeJSON(text);

      if (isCareerPath) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          const result = sanitizeJSON(jsonString);
          const modulesData = typeof result === 'string' ? JSON5.parse(result) : result;

          // Validate and clean the data
          const cleanedModules = modulesData.map((module) => ({
            title: module.title || `Learning ${goal}`,
            description: module.description || `Learn about ${goal}`,
            estimatedTime: module.estimatedTime || "1-2 hours",
            content:
              module.content || `This module will teach you about ${goal}`,
          }));

          return cleanedModules;
        } else {
          throw new Error("Failed to parse JSON");
        }
      } else {
        const result = cleanText;
        const modules = typeof result === 'string' ? JSON5.parse(result) : result;
        if (!Array.isArray(modules) || modules.length !== 5) {
          throw new Error("Invalid response format");
        }
        return modules;
      }
    } catch (error) {
      console.error("Parsing error:", error);

      if (isCareerPath) {
        // Return a fallback career learning path
        return [
          {
            title: `Introduction to ${goal}`,
            description: `Learn the fundamentals of ${goal}`,
            estimatedTime: "1-2 hours",
            content: `This module introduces the basic concepts of ${goal}.`,
          },
          {
            title: `${goal} Fundamentals`,
            description: `Understand the core principles of ${goal}`,
            estimatedTime: "2-3 hours",
            content: `Build a solid foundation in ${goal} by mastering the essential concepts.`,
          },
          {
            title: `Practical ${goal}`,
            description: `Apply your knowledge through practical exercises`,
            estimatedTime: "3-4 hours",
            content: `Practice makes perfect. In this module, you'll apply your theoretical knowledge.`,
          },
          {
            title: `Advanced ${goal}`,
            description: `Dive deeper into advanced concepts`,
            estimatedTime: "3-4 hours",
            content: `Take your skills to the next level with advanced techniques and methodologies.`,
          },
          {
            title: `${goal} in the Real World`,
            description: `Learn how to apply your skills in real-world scenarios`,
            estimatedTime: "2-3 hours",
            content: `Discover how professionals use these skills in industry settings.`,
          },
        ];
      } else {
        // Return a fallback simple learning path
        return [
          `Module 1: Introduction to ${goal}`,
          `Module 2: Core Concepts of ${goal}`,
          `Module 3: Intermediate ${goal} Techniques`,
          `Module 4: Advanced ${goal} Applications`,
          `Module 5: Real-world ${goal} Projects`,
        ];
      }
    }
  } catch (error) {
    console.error("Error generating learning path:", error);

    if (isCareerPath) {
      // Return a fallback career learning path
      return [
        {
          title: `Introduction to ${goal}`,
          description: `Learn the fundamentals of ${goal}`,
          estimatedTime: "1-2 hours",
          content: `This module introduces the basic concepts of ${goal}.`,
        },
        {
          title: `${goal} Fundamentals`,
          description: `Understand the core principles of ${goal}`,
          estimatedTime: "2-3 hours",
          content: `Build a solid foundation in ${goal} by mastering the essential concepts.`,
        },
        {
          title: `Practical ${goal}`,
          description: `Apply your knowledge through practical exercises`,
          estimatedTime: "3-4 hours",
          content: `Practice makes perfect. In this module, you'll apply your theoretical knowledge.`,
        },
        {
          title: `Advanced ${goal}`,
          description: `Dive deeper into advanced concepts`,
          estimatedTime: "3-4 hours",
          content: `Take your skills to the next level with advanced techniques and methodologies.`,
        },
        {
          title: `${goal} in the Real World`,
          description: `Learn how to apply your skills in real-world scenarios`,
          estimatedTime: "2-3 hours",
          content: `Discover how professionals use these skills in industry settings.`,
        },
      ];
    } else {
      // Return a fallback simple learning path
      return [
        `Module 1: Introduction to ${goal}`,
        `Module 2: Core Concepts of ${goal}`,
        `Module 3: Intermediate ${goal} Techniques`,
        `Module 4: Advanced ${goal} Applications`,
        `Module 5: Real-world ${goal} Projects`,
      ];
    }
  }
};

export const generatePersonalizedCareerPaths = async (userData) => {
  if (!userData || typeof userData !== "object") {
    throw new Error("Invalid user data provided");
  }

  try {
    // Analyze quiz answers to determine career interests
    const quizAnalysis = analyzeQuizAnswers(userData.quizAnswers || {});

    const prompt = `
    Create 4 highly personalized career/learning paths for a user with the following profile:
    
    Name: ${userData.name || "Anonymous"}
    Age: ${userData.age || "Unknown"}
    Career Goal: "${userData.careerGoal || "Improve technical skills"}"
    Current Skills: ${JSON.stringify(userData.skills || [])}
    Interests: ${JSON.stringify(userData.interests || [])}
    
    --- Quiz Analysis ---
    ${
      quizAnalysis
        ? `Career Interest Areas:
    Technical Interest: ${quizAnalysis.technical}%
    Creative Interest: ${quizAnalysis.creative}%
    Business Interest: ${quizAnalysis.business}%
    Performance Interest: ${quizAnalysis.performance}%
    Service Interest: ${quizAnalysis.service}%`
        : "No quiz data provided"
    }
    -------------------
    
    For each career path:
    1. Give it a specific, personalized name that aligns with their career goal, interests, and quiz results
    2. Create exactly 5 focused modules for each path
    3. Make each module build logically on the previous ones
    4. Tailor the content to leverage their existing skills and knowledge
    5. Each career path should have a clear end goal that helps them progress toward their stated career objective
    
    Return EXACTLY 4 career paths in this JSON format:
    [
      {
        "pathName": "Personalized path name based on their profile",
        "description": "A brief description of this career path and how it helps them achieve their goal",
        "difficulty": "beginner|intermediate|advanced",
        "estimatedTimeToComplete": "X months",
        "relevanceScore": 95, // How relevant this path is to their profile (0-100)
        "modules": [
          {
            "title": "Module 1: Module Title",
            "description": "Brief description of what this module covers",
            "estimatedHours": 8, // Vary based on topic complexity
            "keySkills": ["skill1", "skill2"]
          },
          // More modules...
        ]
      },
      // 3 more paths...
    ]
    
    Make sure the career paths are varied but all relevant to their profile. Paths should leverage their existing skills but push them toward their stated career goal.
    STRICTLY use 5 modules per path for consistency. Be concise and practical in the module descriptions.
    `;

    // Use Promise.race with a timeout to handle potentially slow responses
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), 45000) // Increased timeout
    );

    // Use fast model first to avoid rate limits, will fallback to better models if needed
    const selectedModel = "llama-3.1-8b-instant";
    
    // Use the retry mechanism with our improved LLM completion function
    const resultPromise = retry(() => llmCompletion(prompt, selectedModel));
    const text = await Promise.race([resultPromise, timeoutPromise]);

    try {
      const result = sanitizeJSON(text);
      const careerPaths = typeof result === 'string' ? JSON5.parse(result) : result;

      if (!Array.isArray(careerPaths) || careerPaths.length === 0) {
        throw new Error("Invalid career paths format");
      }

      // Normalize to exactly 4 paths
      const normalizedPaths = careerPaths.slice(0, 4);
      while (normalizedPaths.length < 4) {
        // Clone and modify an existing path if we need more
        const basePath = { ...normalizedPaths[0] };
        basePath.pathName = `Alternative ${basePath.pathName}`;
        basePath.relevanceScore = Math.max(
          1,
          (basePath.relevanceScore || 80) - 10
        );
        normalizedPaths.push(basePath);
      }

      // Validate and clean up each career path
      return normalizedPaths.map((path) => ({
        pathName: path.pathName || "Career Path",
        description:
          path.description || `A learning path toward ${userData.careerGoal}`,
        difficulty: ["beginner", "intermediate", "advanced"].includes(
          path.difficulty
        )
          ? path.difficulty
          : "intermediate",
        estimatedTimeToComplete: path.estimatedTimeToComplete || "3 months",
        relevanceScore:
          typeof path.relevanceScore === "number"
            ? Math.max(0, Math.min(100, path.relevanceScore))
            : 85,
        modules: Array.isArray(path.modules)
          ? path.modules.slice(0, 5).map((module, idx) => ({
              title: module.title || `Module ${idx + 1}`,
              description:
                module.description || "Learn important skills in this area",
              estimatedHours:
                typeof module.estimatedHours === "number"
                  ? module.estimatedHours
                  : 8,
              keySkills: Array.isArray(module.keySkills)
                ? module.keySkills
                : [],
            }))
          : generateDefaultModules(path.pathName || "Career Path", 5),
      }));
    } catch (error) {
      console.error("Career path parsing error:", error);

      // Generate fallback career paths based on quiz analysis and user data
      return generateFallbackCareerPaths(userData, quizAnalysis);
    }
  } catch (error) {
    console.error("Error generating personalized career paths:", error);
    // Attempt fallback with even simpler approach
    return simpleFallbackCareerPaths(userData);
  }
};

// Helper function to analyze quiz answers
const analyzeQuizAnswers = (quizAnswers) => {
  if (!quizAnswers || Object.keys(quizAnswers).length === 0) {
    return null;
  }

  // Initialize interest area counters
  const interests = {
    technical: 0, // A answers
    creative: 0, // B answers
    business: 0, // C answers
    performance: 0, // D answers
    service: 0, // E answers
  };

  // Count answers by type
  Object.values(quizAnswers).forEach((answer) => {
    if (answer === "A") interests.technical++;
    else if (answer === "B") interests.creative++;
    else if (answer === "C") interests.business++;
    else if (answer === "D") interests.performance++;
    else if (answer === "E") interests.service++;
  });

  // Calculate percentages
  const totalAnswers = Object.keys(quizAnswers).length;

  return {
    technical: Math.round((interests.technical / totalAnswers) * 100),
    creative: Math.round((interests.creative / totalAnswers) * 100),
    business: Math.round((interests.business / totalAnswers) * 100),
    performance: Math.round((interests.performance / totalAnswers) * 100),
    service: Math.round((interests.service / totalAnswers) * 100),
  };
};

// Generate fallback career paths using quiz data
const generateFallbackCareerPaths = (userData, quizAnalysis) => {
  const goal = userData.careerGoal || "tech career";
  const interests = userData.interests || ["programming", "technology"];
  const skills = userData.skills || ["basic coding"];

  // Use quiz analysis if available to improve fallback paths
  if (quizAnalysis) {
    // Find the top two interest areas
    const interestAreas = Object.entries(quizAnalysis)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map((entry) => entry[0]);

    const pathThemes = {
      technical: {
        name: "Technical Development",
        description: "Building technical skills through hands-on projects",
        modules: [
          "Module 1: Core Technical Foundations",
          "Module 2: Programming Fundamentals",
          "Module 3: Building Your First Project",
          "Module 4: Advanced Technical Skills",
          "Module 5: Technical Portfolio Development",
        ],
      },
      creative: {
        name: "Creative Expression",
        description: "Combining creativity with technical skills",
        modules: [
          "Module 1: Creative Thinking Principles",
          "Module 2: Design and Expression Fundamentals",
          "Module 3: Creative Tools Mastery",
          "Module 4: Building a Creative Portfolio",
          "Module 5: Launching Your Creative Project",
        ],
      },
      business: {
        name: "Business and Entrepreneurship",
        description: "Developing business acumen and leadership skills",
        modules: [
          "Module 1: Business Fundamentals",
          "Module 2: Market Analysis and Strategy",
          "Module 3: Financial Planning and Management",
          "Module 4: Leadership and Team Building",
          "Module 5: Business Plan Development",
        ],
      },
      performance: {
        name: "Performance and Presentation",
        description: "Mastering presentation and performance skills",
        modules: [
          "Module 1: Communication Fundamentals",
          "Module 2: Presentation Skills Development",
          "Module 3: Audience Engagement Techniques",
          "Module 4: Performance Optimization",
          "Module 5: Capstone Performance Project",
        ],
      },
      service: {
        name: "Community Impact and Service",
        description: "Making a positive impact through service and leadership",
        modules: [
          "Module 1: Understanding Community Needs",
          "Module 2: Service Leadership Principles",
          "Module 3: Project Planning for Impact",
          "Module 4: Building Sustainable Solutions",
          "Module 5: Measuring and Scaling Impact",
        ],
      },
    };

    // Create paths based on top interests from quiz
    return [
      {
        pathName: `${goal} through ${pathThemes[interestAreas[0]].name}`,
        description: `Achieve your goal in ${goal} by focusing on ${
          pathThemes[interestAreas[0]].description
        }`,
        difficulty: "beginner",
        estimatedTimeToComplete: "3 months",
        relevanceScore: 90,
        modules: pathThemes[interestAreas[0]].modules.map((title, i) => ({
          title,
          description: `Step ${i + 1} in mastering ${
            interestAreas[0]
          } skills related to ${goal}`,
          estimatedHours: 8,
          keySkills: [...skills.slice(0, 2), `${interestAreas[0]} skills`],
        })),
      },
      {
        pathName: `${interestAreas[1]} Approach to ${goal}`,
        description: `A ${interestAreas[1]}-focused pathway to achieving your ${goal}`,
        difficulty: "intermediate",
        estimatedTimeToComplete: "4 months",
        relevanceScore: 85,
        modules: pathThemes[interestAreas[1]].modules.map((title, i) => ({
          title,
          description: `Step ${i + 1} in developing ${
            interestAreas[1]
          } expertise for your ${goal}`,
          estimatedHours: 10,
          keySkills: [...skills.slice(0, 2), `${interestAreas[1]} skills`],
        })),
      },
      {
        pathName: `${interests[0] || "Core"} Specialization`,
        description: `Deepen your knowledge in ${
          interests[0] || "your area of interest"
        } to excel in ${goal}`,
        difficulty: "intermediate",
        estimatedTimeToComplete: "3 months",
        relevanceScore: 80,
        modules: generateDefaultModules(
          `${interests[0] || "Core"} Specialization`,
          5
        ),
      },
      {
        pathName: `Practical ${goal} Projects`,
        description: `Hands-on project work to build real-world experience in ${goal}`,
        difficulty: "advanced",
        estimatedTimeToComplete: "4 months",
        relevanceScore: 75,
        modules: [
          {
            title: "Module 1: Project Planning and Requirements",
            description:
              "Learn how to plan and scope your projects effectively",
            estimatedHours: 8,
            keySkills: ["Planning", "Requirements analysis"],
          },
          {
            title: "Module 2: Design and Architecture",
            description: "Develop the architecture for your projects",
            estimatedHours: 12,
            keySkills: ["Design thinking", "Architecture"],
          },
          {
            title: "Module 3: Implementation and Development",
            description: "Build your projects using best practices",
            estimatedHours: 15,
            keySkills: ["Development", "Testing"],
          },
          {
            title: "Module 4: Testing and Quality Assurance",
            description: "Ensure your projects meet quality standards",
            estimatedHours: 10,
            keySkills: ["Quality assurance", "Testing methodologies"],
          },
          {
            title: "Module 5: Deployment and Presentation",
            description: "Launch your projects and present your work",
            estimatedHours: 8,
            keySkills: ["Deployment", "Presentation"],
          },
        ],
      },
    ];
  } else {
    // Return the original fallback paths if no quiz data
    return generateDefaultFallbackPaths(userData);
  }
};

// Simplified fallback for extreme cases
const simpleFallbackCareerPaths = (userData) => {
  const goal = userData.careerGoal || "Career Development";

  return [
    {
      pathName: `Getting Started with ${goal}`,
      description: `Fundamental path to begin your journey in ${goal}`,
      difficulty: "beginner",
      estimatedTimeToComplete: "2 months",
      relevanceScore: 95,
      modules: [
        {
          title: "Module 1: Understanding the Basics",
          description: "Learn core concepts and terminology",
          estimatedHours: 6,
          keySkills: ["Fundamentals", "Terminology"],
        },
        {
          title: "Module 2: Essential Skills Development",
          description: "Build the must-have skills for this field",
          estimatedHours: 8,
          keySkills: ["Core skills", "Practical basics"],
        },
        {
          title: "Module 3: Your First Project",
          description: "Apply what you've learned in a simple project",
          estimatedHours: 10,
          keySkills: ["Project work", "Application"],
        },
        {
          title: "Module 4: Problem-Solving Techniques",
          description: "Learn to overcome common challenges",
          estimatedHours: 8,
          keySkills: ["Problem solving", "Troubleshooting"],
        },
        {
          title: "Module 5: Next Steps and Growth",
          description: "Plan your continued learning journey",
          estimatedHours: 6,
          keySkills: ["Career planning", "Continuous learning"],
        },
      ],
    },
    // ...three more simplified paths with the same pattern but different focuses/titles
    {
      pathName: `Intermediate ${goal}`,
      description: `Build on your existing knowledge to advance in ${goal}`,
      difficulty: "intermediate",
      estimatedTimeToComplete: "3 months",
      relevanceScore: 85,
      modules: Array(5)
        .fill(null)
        .map((_, i) => ({
          title: `Module ${i + 1}: Intermediate Topic ${i + 1}`,
          description: `Deepen your understanding of important concepts`,
          estimatedHours: 8 + i,
          keySkills: ["Advanced understanding", "Implementation skills"],
        })),
    },
    {
      pathName: `${goal} Specialization`,
      description: `Focus on specialized areas within ${goal}`,
      difficulty: "advanced",
      estimatedTimeToComplete: "4 months",
      relevanceScore: 80,
      modules: Array(5)
        .fill(null)
        .map((_, i) => ({
          title: `Module ${i + 1}: Specialization Area ${i + 1}`,
          description: `Master specialized techniques and approaches`,
          estimatedHours: 10 + i,
          keySkills: ["Specialization", "Expert techniques"],
        })),
    },
    {
      pathName: `Practical ${goal} Applications`,
      description: `Apply your knowledge in real-world scenarios`,
      difficulty: "intermediate",
      estimatedTimeToComplete: "3 months",
      relevanceScore: 75,
      modules: Array(5)
        .fill(null)
        .map((_, i) => ({
          title: `Module ${i + 1}: Real-world Application ${i + 1}`,
          description: `Learn how to apply concepts in practical situations`,
          estimatedHours: 9 + i,
          keySkills: ["Practical application", "Real-world skills"],
        })),
    },
  ];
};

// Original fallback function renamed
const generateDefaultFallbackPaths = (userData) => {
  const goal = userData.careerGoal || "tech career";
  const interests = userData.interests || ["programming", "technology"];
  const skills = userData.skills || ["basic coding"];

  return [
    {
      pathName: `${goal} Fundamentals`,
      description: `Master the core concepts needed for a successful career in ${goal}`,
      difficulty: "beginner",
      estimatedTimeToComplete: "3 months",
      relevanceScore: 90,
      modules: generateDefaultModules(`${goal} Fundamentals`, 5),
    },
    {
      pathName: `Advanced ${interests[0] || "Tech"} Specialization`,
      description: `Deepen your knowledge in ${
        interests[0] || "technology"
      } to stand out in your career`,
      difficulty: "intermediate",
      estimatedTimeToComplete: "4 months",
      relevanceScore: 85,
      modules: generateDefaultModules(
        `${interests[0] || "Tech"} Specialization`,
        5
      ),
    },
    {
      pathName: `${skills[0] || "Coding"} Mastery`,
      description: `Build upon your existing ${
        skills[0] || "coding"
      } skills to reach expert level`,
      difficulty: "advanced",
      estimatedTimeToComplete: "5 months",
      relevanceScore: 80,
      modules: generateDefaultModules(`${skills[0] || "Coding"} Mastery`, 5),
    },
    {
      pathName: `Practical ${goal} Projects`,
      description: `Apply your knowledge through hands-on projects relevant to ${goal}`,
      difficulty: "intermediate",
      estimatedTimeToComplete: "3 months",
      relevanceScore: 88,
      modules: generateDefaultModules(`${goal} Projects`, 5),
    },
  ];
};

// Function to generate AI nudges
export const generateAINudges = async (
  userData,
  assessmentData = [],
  pathData = null
) => {
  if (!userData) {
    return [];
  }

  try {
    const prompt = `Generate 3 personalized learning nudges for a student with the following profile:
    
    Career Path: ${pathData?.careerName || "Learning journey"}
    Progress: ${pathData?.progress || 0}%
    Recent Assessments: ${
      assessmentData
        ?.map((a) => `Score: ${a.score}, Accuracy: ${a.accuracy}%`)
        .join("; ") || "No recent assessments"
    }
    Completed Modules: ${pathData?.completedModules?.length || 0}
    
    Return exactly 3 nudges as a JSON array with this structure:
    [
      {
        "type": "tip" | "recommendation" | "challenge",
        "text": "The motivational/insightful message",
        "actionText": "Optional call to action button text", 
        "icon": "bulb" | "rocket"
      }
    ]
    
    Make nudges specific to their progress and performance.
    Keep texts concise (max 150 characters).
    One nudge should be a "challenge" type.`;

    // Nudges are simple content, use a faster model
    const selectedModel = selectBestModel("nudges", "educational", "low", true);
    const response = await llmCompletion(prompt, selectedModel);
    const result = sanitizeJSON(response);
    
    // Check if sanitizeJSON returned an already parsed object
    return typeof result === 'string' ? JSON5.parse(result) : result;
  } catch (error) {
    console.error("Error generating nudges:", error);
    return [
      {
        type: "tip",
        text: "Keep learning consistently to maintain your progress!",
        icon: "bulb",
      },
      {
        type: "recommendation",
        text: "Review previous modules to reinforce your knowledge.",
        icon: "bulb",
      },
      {
        type: "challenge",
        text: "Try completing a quiz with 100% accuracy as your next goal.",
        icon: "rocket",
      },
    ];
  }
};

export const generateCareerSummary = async ({
  user,
  careerPath,
  assessments,
}) => {
  try {
    const prompt = `You are UniSkills – an AI career coach and motivational mentor for students on their learning journey.
    
    Generate a detailed, emotionally supportive, and strategic career summary report for the following user based on their current learning progress, completed modules, quiz feedback, career goal, and interests.
    
    ### Instructions:
    Write the output as a **personalized narrative**, not a list. Your tone should be **friendly, supportive, and motivating** – like a personal coach who believes in the student and wants them to grow.
    
    🔹 The report must include:
    
    1. A warm and uplifting **introduction** using the user's name
    2. A recap of their **progress so far** – modules completed, percentage progress, etc.
    3. A reflection on their **performance** – quiz scores and strengths you've noticed
    4. Clear guidance on **areas to improve or skills to focus on next**
    5. A **vision of their future** – if they keep working at this pace, what can they achieve? What should their next big goal be?
    6. Your **evaluation of job/internship readiness** – are they ready to apply? What roles suit them now?
    7. Recommended **next steps or strategies** to speed up progress – projects, certifications, habits, resources
    8. A strong **motivational message** affirming that they're on the right track and can achieve even more
    9. End with **3 AI-powered nudges** (short, sharp, practical tips for immediate action)
    
    ### User Profile:
    - Name: ${user.name}
    - Career Goal: ${careerPath.careerName}
    - Interests: ${user.interests.join(", ") || "Not specified"}
    - Skills: ${user.skills.join(", ") || "Not specified"}
    
    ### Learning Journey:
    - Total Modules: ${careerPath.modules.length}
    - Completed Modules: ${careerPath.completedModules.length}
    - Overall Progress: ${careerPath.progress}%
    - Recommended Skills: ${
      careerPath.recommendedSkills.join(", ") || "None listed"
    }
    
    ### Quiz Assessments:
    ${assessments
      .map((a) => `- ${a.moduleName}: Scored ${a.score}/10 – ${a.feedback}`)
      .join("\n")}
    
    ---
    
    Generate the report as if you're speaking directly to the user.
    
    Avoid bullet points in the final report. Make it natural, inspiring, and rich in value.`;

    // Use fast model first to avoid rate limits
    const selectedModel = "llama-3.1-8b-instant";
    return await llmCompletion(prompt, selectedModel);
  } catch (error) {
    console.error("❌ Career Summary Generation Error:", error);
    throw error;
  }
};

// Helper function to generate default modules for a path
const generateDefaultModules = (pathName, count) => {
  return Array.from({ length: count }, (_, index) => {
    const level = index === 0 ? "basic" : index === count - 1 ? "advanced" : "intermediate";
    return {
      title: `Module ${index + 1}: ${level.charAt(0).toUpperCase() + level.slice(1)} ${pathName}`,
      description: `Learn ${level} concepts and skills related to ${pathName}`,
      estimatedHours: 8 + index,
      keySkills: [`${level} understanding`, `${level} application`, `${level} skills`],
    };
  });
};

// Function to adjust content based on device type for responsive design
export const getResponsiveContent = (content, deviceType = "desktop") => {
  if (!content) return null;
  
  // Default sizing and formatting
  let responsiveContent = { ...content };
  
  // Adjust based on device type
  if (deviceType === "mobile") {
    // For mobile: simplify content, reduce verbosity
    if (responsiveContent.sections) {
      responsiveContent.sections = responsiveContent.sections.map(section => {
        // Shorten content for mobile if it's too long
        let mobileContent = section.content;
        if (section.content && section.content.length > 500) {
          mobileContent = section.content.substring(0, 500) + "...";
        }
        
        return {
          ...section,
          content: mobileContent,
          // If code examples exist, simplify them for mobile
          codeExample: section.codeExample ? {
            ...section.codeExample,
            code: section.codeExample.code.length > 300 
              ? section.codeExample.code.substring(0, 300) + "\n// ... more code ..." 
              : section.codeExample.code
          } : null
        };
      });
    }
  } else if (deviceType === "tablet") {
    // For tablets: moderate adjustments
    if (responsiveContent.sections) {
      responsiveContent.sections = responsiveContent.sections.map(section => {
        // Moderate content length for tablets
        let tabletContent = section.content;
        if (section.content && section.content.length > 1000) {
          tabletContent = section.content.substring(0, 1000) + "...";
        }
        
        return {
          ...section,
          content: tabletContent,
          // Slightly simplify code examples for tablets if needed
          codeExample: section.codeExample ? {
            ...section.codeExample,
            code: section.codeExample.code.length > 500
              ? section.codeExample.code.substring(0, 500) + "\n// ... more code ..."
              : section.codeExample.code
          } : null
        };
      });
    }
  }
  
  return responsiveContent;
};

// Function to detect device type from user agent or screen size
export const detectDeviceType = (userAgent, screenWidth = 1920) => {
  // First check based on user agent
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  if (isMobileDevice) {
    // If tablet-specific UA detected
    if (/iPad|Tablet/i.test(userAgent)) {
      return "tablet";
    }
    return "mobile";
  }
  
  // Fallback to screen width detection
  if (screenWidth < 768) {
    return "mobile";
  } else if (screenWidth < 1024) {
    return "tablet";
  }
  
  return "desktop";
};

// Function to determine if we can use the most advanced models for the user's connection
export const canUseAdvancedModels = async () => {
  try {
    const startTime = Date.now();
    // Perform a small test request to measure connection speed
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      method: "HEAD",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
    });
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    // If latency is less than 300ms, assume good connection
    return response.ok && latency < 300;
  } catch (error) {
    console.warn("Connection check failed, defaulting to moderate models", error);
    return false;
  }
};

// Function to elaborate on specific topics, with fallback handling
export const generateTopicElaboration = async (topic, moduleName, options = {}) => {
  if (!topic || typeof topic !== "string") {
    throw new Error("Invalid topic provided");
  }

  // Create full topic by combining module name and specific topic
  const fullTopic = moduleName ? `${moduleName}: ${topic}` : topic;
  
  try {
    // Set default options
    const elaborationOptions = {
      detailed: true,
      includeExamples: true,
      constrainToFacts: true,
      preventHallucination: true,
      ...options
    };

    // Determine if this is a code-related topic
    const isTechTopic = isCodeRelatedTopic(fullTopic);
    const isKeyPoints = fullTopic.toLowerCase().includes("key points");
    
    // Use fast model - fallback is handled automatically by llmCompletion
    const preferredModel = "llama-3.1-8b-instant";
    
    // Enhanced prompt specifically for elaborations
    const prompt = `
    Provide a detailed, educational elaboration on the topic: "${fullTopic}"
    
    Requirements:
    - Be factual, precise, and educational
    - Keep the tone academic but engaging
    - Focus on clarifying complex concepts
    - Include practical examples ${isTechTopic ? "and code samples" : ""}
    - Highlight key insights that aren't obvious
    - Match the visual theme: dark background with amber/orange highlight colors
    
    ${isKeyPoints ? "This topic is asking for key points, so organize content as concise, actionable insights" : ""}
    ${isTechTopic ? "Since this is a technical topic, include relevant code examples with explanations" : ""}
    
    Return your response in this exact JSON format:
    {
      "title": "Concise title for this elaboration",
      "sections": [
        {
          "title": "Section Heading",
          "content": "Detailed explanation with examples and clarifications",
          "keyPoints": ["Key insight 1", "Key insight 2", "Key insight 3"],
          ${isTechTopic ? `
          "codeExample": {
            "language": "appropriate language",
            "code": "// Code sample\\nfunction example() {\\n  // Implementation\\n}",
            "explanation": "How this code works"
          }` : '"codeExample": null'}
        }
      ],
      "modelUsed": "${preferredModel}"
    }`;

    // Track which model was used
    let modelUsed = "";
    let elaborationContent = null;

    // Try to generate elaboration - llmCompletion handles fallbacks automatically
    try {
      console.log(`Generating elaboration using ${preferredModel}`);
      const text = await llmCompletion(prompt, preferredModel);
      const result = sanitizeJSON(text);
      elaborationContent = typeof result === 'string' ? JSON5.parse(result) : result;
      
      // Add the model used if not included in response
      if (!elaborationContent.modelUsed) {
        elaborationContent.modelUsed = preferredModel;
      }
      
      modelUsed = elaborationContent.modelUsed;
      console.log(`Successfully generated content`);
    } catch (error) {
      console.error(`All models failed to generate elaboration: ${error.message}`);
      throw error;
    }
    
    // Ensure the content matches the theme of the site
    elaborationContent = themeElaborationContent(elaborationContent);
    
    return elaborationContent;
  } catch (error) {
    console.error("Elaboration generation error:", error);
    
    // Return a structured error response rather than throwing
    return {
      title: topic,
      modelUsed: "Fallback Content",
      error: "We couldn't generate the elaboration. Please try again.",
      sections: [
        {
          title: "Unable to Elaborate",
          content: `We're having trouble generating detailed content for "${topic}". This might be due to temporary issues with our AI service.`,
          keyPoints: [
            "Try again in a few moments",
            "Try a more specific topic",
            "Explore other sections of the module"
          ]
        }
      ]
    };
  }
};

// Helper function to ensure elaboration content matches site theme
const themeElaborationContent = (content) => {
  if (!content) return null;
  
  // Create a copy to avoid mutating the original
  const themedContent = { ...content };
  
  // Add theme-specific metadata to help UI components
  themedContent.theme = {
    primary: "#ff9d54", // Primary amber/orange color used in the UI
    secondary: "#3a3a3a", // Secondary dark color
    background: "#2a2a2a", // Background color
    text: "#ffffff", // Text color
    accent: "#ff8a30", // Accent color
    codeBackground: "#1e1e1e", // Code block background
  };
  
  // Add responsive display options
  themedContent.display = {
    showCodeExamples: true,
    collapsibleSections: true,
    animateEntrance: true,
  };
  
  return themedContent;
};

// Add this function at the end of the file to test fallback mechanism
export const testModelFallback = async () => {
  debugLog("Testing model fallback mechanism...");
  
  try {
    // Try with a prompt that should work on any model
    const result = await llmCompletion("Generate a simple greeting", "invalid-model-name");
    debugLog("Test completed with result", result.substring(0, 50) + "...");
    return { success: true, message: "Fallback mechanism working correctly" };
  } catch (error) {
    debugLog("Fallback test failed", error);
    return { success: false, message: error.message };
  }
};
