import React from 'react';
import { motion } from 'framer-motion';
import { RiLightbulbLine, RiRocketLine, RiAwardLine, RiStarLine } from 'react-icons/ri';

/**
 * Enhanced NudgeCard Component
 * 
 * A visually appealing card component to display AI suggestions/nudges to the user.
 * 
 * @param {Object} props
 * @param {string} props.text - The suggestion text to display
 * @param {string} props.type - Optional: Type of nudge ("tip", "recommendation", "challenge", defaults to "tip")
 * @param {string} props.icon - Optional: Icon type ("bulb", "rocket", "star", defaults based on type)
 * @param {function} props.onAction - Optional: Callback function when action button is clicked
 * @param {string} props.actionText - Optional: Text for the action button
 * @param {boolean} props.elevated - Optional: Whether to use elevated/enhanced styling
 */
const NudgeCard = ({ 
  text, 
  type = 'tip', 
  icon,
  onAction,
  actionText,
  elevated = false 
}) => {
  // Determine which icon to show based on type or explicit icon prop
  const getIcon = () => {
    if (icon === 'rocket') return <RiRocketLine className="text-xl sm:text-2xl" />;
    if (icon === 'bulb') return <RiLightbulbLine className="text-xl sm:text-2xl" />;
    if (icon === 'star') return <RiStarLine className="text-xl sm:text-2xl" />;
    
    // Default icons based on type
    if (type === 'challenge') return <RiRocketLine className="text-xl sm:text-2xl" />;
    if (type === 'recommendation') return <RiAwardLine className="text-xl sm:text-2xl" />;
    return <RiLightbulbLine className="text-xl sm:text-2xl" />;
  };

  // Get background gradient and text color based on type
  const getStyles = () => {
    switch(type) {
      case 'recommendation':
        return {
          gradient: 'from-[#ff9d54]/10 to-[#ff8a30]/10',
          iconBg: 'bg-[#ff9d54]/20',
          iconColor: 'text-[#ff9d54]',
          borderColor: 'border-l-[#ff9d54]',
          hoverBg: 'hover:bg-[#ff9d54]/5',
          buttonBg: 'bg-[#3a3a3a] hover:bg-[#ff9d54]/20',
          buttonText: 'text-[#ff9d54]'
        };
      case 'challenge':
        return {
          gradient: 'from-[#ff9d54]/10 to-[#ff8a30]/10',
          iconBg: 'bg-[#ff9d54]/20',
          iconColor: 'text-[#ff9d54]',
          borderColor: 'border-l-[#ff9d54]',
          hoverBg: 'hover:bg-[#ff9d54]/5',
          buttonBg: 'bg-[#3a3a3a] hover:bg-[#ff9d54]/20',
          buttonText: 'text-[#ff9d54]'
        };
      default:
        return {
          gradient: 'from-[#ff9d54]/10 to-[#ff8a30]/10',
          iconBg: 'bg-[#ff9d54]/20',
          iconColor: 'text-[#ff9d54]',
          borderColor: 'border-l-[#ff9d54]',
          hoverBg: 'hover:bg-[#ff9d54]/5',
          buttonBg: 'bg-[#3a3a3a] hover:bg-[#ff9d54]/20',
          buttonText: 'text-[#ff9d54]'
        };
    }
  };

  // Get title based on type
  const getTitle = () => {
    switch(type) {
      case 'recommendation': return 'Recommendation';
      case 'challenge': return 'Challenge';
      default: return 'AI Tip';
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      transition={{ duration: 0.2 }}
      className={`
        ${elevated 
          ? `bg-[#2a2a2a] shadow-md bg-gradient-to-br ${styles.gradient}` 
          : 'bg-[#2a2a2a]/80'
        } 
        p-4 rounded-xl 
        ${elevated 
          ? 'border border-[#3a3a3a]' 
          : `border-l-4 ${styles.borderColor}`
        }
        transition-all duration-200 ${styles.hoverBg}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`${styles.iconBg} p-2 sm:p-3 rounded-lg ${styles.iconColor} flex-shrink-0`}>
          {getIcon()}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center">
            <h3 className={`font-medium ${styles.iconColor}`}>{getTitle()}</h3>
            <motion.span 
              className={`ml-2 inline-block w-1.5 h-1.5 rounded-full ${styles.iconColor} opacity-75`}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          
          <p className="text-sm text-white">{text}</p>
          
          {onAction && actionText && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAction}
              className={`mt-2 text-sm py-1.5 px-3 ${styles.buttonBg} ${styles.buttonText} rounded-lg transition-all duration-200 flex items-center gap-1.5 font-medium`}
            >
              {actionText}
              <motion.span 
                animate={{ x: [0, 3, 0] }} 
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-xs"
              >
                →
              </motion.span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NudgeCard;