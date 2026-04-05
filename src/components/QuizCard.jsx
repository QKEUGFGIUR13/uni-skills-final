import React from "react";
import { motion } from "framer-motion";
import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiInformationLine,
} from "react-icons/ri";

const QuizCard = ({
  question,
  answers,
  selectedAnswers,
  onAnswerSelect,
  questionType,
  showResults,
  correctAnswer,
  userAnswers,
  explanation,
}) => {
  // Convert correctAnswer to array if it's not already
  const correctAnswerArray = Array.isArray(correctAnswer)
    ? correctAnswer
    : [correctAnswer];

  const isAnswerCorrect = (answerIndex) => {
    if (!showResults) return false;
    return correctAnswerArray.includes(answerIndex);
  };

  const isAnswerSelected = (answerIndex) => {
    return selectedAnswers.includes(answerIndex);
  };

  const getAnswerClass = (answerIndex) => {
    if (!showResults) {
      return isAnswerSelected(answerIndex)
        ? "bg-[#ff9d54]/20 border-[#ff9d54] text-white"
        : "bg-[#2a2a2a] border-[#3a3a3a] text-white hover:bg-[#3a3a3a]";
    } else {
      if (isAnswerCorrect(answerIndex) && isAnswerSelected(answerIndex)) {
        return "bg-green-900/20 border-green-900/30 text-green-400";
      } else if (isAnswerCorrect(answerIndex)) {
        return "bg-green-900/20 border-green-900/30 text-green-400";
      } else if (isAnswerSelected(answerIndex)) {
        return "bg-red-900/20 border-red-900/30 text-red-400";
      } else {
        return "bg-[#2a2a2a] border-[#3a3a3a] text-gray-400";
      }
    }
  };

  const handleAnswerClick = (answerIndex) => {
    if (showResults) return;

    if (questionType === "multiple_answer") {
      // ✅ Allow toggling multiple selections
      const newSelectedAnswers = selectedAnswers.includes(answerIndex)
        ? selectedAnswers.filter((index) => index !== answerIndex)
        : [...selectedAnswers, answerIndex];
      onAnswerSelect(answerIndex); // just pass the clicked index
    } else {
      // ✅ Only one answer allowed
      onAnswerSelect(answerIndex); // just pass the clicked index
    }
  };

  return (
    <motion.div
      className="bg-[#2a2a2a] rounded-2xl shadow-lg p-4 sm:p-6 border border-[#3a3a3a]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-4">
        <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
          {question}
        </h3>
        <p className="text-xs sm:text-sm text-[#ff9d54]">
          {questionType === "multiple_choice"
            ? "Select one answer"
            : "Select all that apply"}
        </p>
      </div>

      <div className="space-y-3">
        {answers.map((answer, index) => (
          <motion.div
            key={index}
            className={`p-3 sm:p-4 border rounded-xl cursor-pointer transition-all ${getAnswerClass(
              index
            )}`}
            onClick={() => handleAnswerClick(index)}
            whileHover={!showResults ? { scale: 1.01 } : {}}
            whileTap={!showResults ? { scale: 0.99 } : {}}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm border ${
                  isAnswerSelected(index)
                    ? "border-[#ff9d54] bg-[#ff9d54]/20"
                    : "border-[#3a3a3a] bg-[#1c1b1b]"
                }`}
              >
                {showResults && isAnswerCorrect(index) ? (
                  <RiCheckboxCircleLine className="text-green-400" />
                ) : showResults && isAnswerSelected(index) ? (
                  <RiCloseCircleLine className="text-red-400" />
                ) : (
                  <span className="text-xs">
                    {String.fromCharCode(65 + index)}
                  </span>
                )}
              </div>
              <span className="text-sm sm:text-base">{answer}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {showResults && explanation && (
        <motion.div
          className="mt-4 p-3 sm:p-4 bg-[#1c1b1b] border border-[#3a3a3a] rounded-xl"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start gap-2">
            <RiInformationLine className="text-[#ff9d54] text-lg flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-medium text-[#ff9d54] mb-1">
                Explanation
              </h4>
              <p className="text-sm text-gray-300">{explanation}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default QuizCard;
