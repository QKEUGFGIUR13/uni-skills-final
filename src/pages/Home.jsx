import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  RiArrowRightLine,
  RiPlayCircleLine,
  RiBrainLine,
  RiRocketLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiGlobalLine,
  RiAwardLine,
  RiUserLine,
  RiQuoteText,
  RiCheckLine,
  RiSparklingLine,
  RiStarLine,
} from "react-icons/ri";
import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import { useAuth } from "../context/AuthContext";

// Add CSS for smooth animations
const animationStyles = `
  @keyframes pulse {
    0%, 100% {
      transform: translate3d(0,0,0) scale(1);
      opacity: var(--base-opacity, 0.3);
    }
    50% {
      transform: translate3d(0,0,0) scale(1.1);
      opacity: calc(var(--base-opacity, 0.3) * 1.4);
    }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(5deg); }
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
`;

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('particle-styles')) {
  const styleSheet = document.createElement("style");
  styleSheet.id = 'particle-styles';
  styleSheet.innerText = animationStyles;
  document.head.appendChild(styleSheet);
}

// Enhanced Particle Background Component
const ParticleBackground = () => {
  const [particles, setParticles] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    // Further reduced particle count for ultra-smooth performance
    const particleCount = 25;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 1.2 + 1,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
      opacity: Math.random() * 0.25 + 0.2,
      color: Math.random() > 0.5 ? '#ff9d54' : '#ff8a30',
    }));
    setParticles(newParticles);

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    let animationId;
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const animateParticles = (currentTime) => {
      if (currentTime - lastTime >= frameInterval) {
        setParticles(prev => {
          const newParticles = prev.map(particle => {
            let newX = particle.x + particle.speedX;
            let newY = particle.y + particle.speedY;

            // Optimized edge bouncing
            if (newX <= 0 || newX >= window.innerWidth) {
              particle.speedX *= -0.8;
              newX = Math.max(0, Math.min(window.innerWidth, newX));
            }
            if (newY <= 0 || newY >= window.innerHeight) {
              particle.speedY *= -0.8;
              newY = Math.max(0, Math.min(window.innerHeight, newY));
            }

            // Simplified mouse interaction for better performance
            const dx = mousePosition.x - newX;
            const dy = mousePosition.y - newY;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared < 10000) { // 100px radius squared
              const distance = Math.sqrt(distanceSquared);
              const force = (100 - distance) / 100;
              newX -= dx * force * 0.004;
              newY -= dy * force * 0.004;
            }

            // Reduced drift calculation
            particle.speedX += (Math.random() - 0.5) * 0.0005;
            particle.speedY += (Math.random() - 0.5) * 0.0005;

            // Speed limiting
            const maxSpeed = 0.4;
            particle.speedX = Math.max(-maxSpeed, Math.min(maxSpeed, particle.speedX));
            particle.speedY = Math.max(-maxSpeed, Math.min(maxSpeed, particle.speedY));

            return {
              ...particle,
              x: newX,
              y: newY,
            };
          });

          // Ultra-optimized connections with minimal calculations
          const newConnections = [];
          const maxConnections = 8; // Further reduced for performance
          let connectionCount = 0;

          // Only check every other particle for connections
          for (let i = 0; i < newParticles.length && connectionCount < maxConnections; i += 2) {
            for (let j = i + 2; j < newParticles.length && connectionCount < maxConnections; j += 2) {
              const dx = newParticles[i].x - newParticles[j].x;
              const dy = newParticles[i].y - newParticles[j].y;
              const distanceSquared = dx * dx + dy * dy;

              if (distanceSquared < 6400) { // 80px radius squared
                const opacity = (6400 - distanceSquared) / 6400 * 0.12;
                newConnections.push({
                  x1: newParticles[i].x,
                  y1: newParticles[i].y,
                  x2: newParticles[j].x,
                  y2: newParticles[j].y,
                  opacity: opacity,
                });
                connectionCount++;
              }
            }
          }
          setConnections(newConnections);

          return newParticles;
        });

        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(animateParticles);
    };

    animationId = requestAnimationFrame(animateParticles);
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [mousePosition]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full">
        {connections.map((connection, index) => (
          <motion.line
            key={index}
            x1={connection.x1}
            y1={connection.y1}
            x2={connection.x2}
            y2={connection.y2}
            stroke="#ff9d54"
            strokeWidth="1"
            opacity={connection.opacity}
            initial={{ opacity: 0 }}
            animate={{ opacity: connection.opacity }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </svg>

      {/* Ultra-Optimized Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full will-change-transform"
          style={{
            '--base-opacity': particle.opacity,
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 1.5}px ${particle.color}20`,
            transform: 'translate3d(0,0,0)',
            animation: `pulse ${10 + Math.random() * 5}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
};

// Animated Counter Component
const AnimatedCounter = ({ target, duration = 3000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const rawNumber = parseInt(target.replace(/\D/g, ""), 10);
    const hasK = target.includes("K");
    const end = hasK ? rawNumber * 1000 : rawNumber;

    const totalSteps = Math.floor(duration / 50);
    const step = Math.max(1, Math.floor(end / totalSteps));

    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  const display = target.includes("K")
    ? `${Math.floor(count / 1000)}K+`
    : target.includes("+")
    ? `${count}+`
    : target.includes("%")
    ? `${count}%`
    : count;

  return <span ref={ref}>{display}</span>;
};

// Enhanced FAQ Component
const FaqItem = ({ question, answer, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-[#2a2a2a]/80 backdrop-blur-sm border border-[#3a3a3a] rounded-xl p-5 transition-all cursor-pointer hover:bg-[#333333]/80 hover:border-[#ff9d54] hover:shadow-lg hover:shadow-[#ff9d54]/20"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex justify-between items-center text-white font-medium">
        <span className="text-base">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="text-[#ff9d54] text-lg"
        >
          ▼
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="text-gray-300 text-sm leading-relaxed"
          >
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Optimized Floating Elements Component with CSS animations
const FloatingElements = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Floating geometric shapes with orange theme - using CSS animations */}
      <div
        className="absolute top-20 left-10 w-16 h-16 border-2 border-[#ff9d54]/25 rounded-full animate-float"
        style={{
          animationDelay: '0s',
          animationDuration: '15s'
        }}
      />
      <div
        className="absolute top-32 right-16 w-12 h-12 bg-gradient-to-br from-[#ff9d54]/15 to-[#ff8a30]/15 rounded-lg animate-float"
        style={{
          animationDelay: '2s',
          animationDuration: '14s'
        }}
      />
      <div
        className="absolute bottom-32 left-16 w-10 h-10 border-2 border-[#ff8a30]/30 rounded-full animate-float"
        style={{
          animationDelay: '4s',
          animationDuration: '10s'
        }}
      />
      <div
        className="absolute top-1/2 right-8 w-8 h-8 bg-[#ff9d54]/20 rounded-full animate-float"
        style={{
          animationDelay: '1s',
          animationDuration: '8s'
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-6 h-6 border border-[#ff8a30]/25 rounded-lg animate-float"
        style={{
          animationDelay: '3s',
          animationDuration: '16s'
        }}
      />
    </div>
  );
};

// Modern Data Structures with Orange Theme
const features = [
  {
    icon: <RiBrainLine className="text-2xl text-white" />,
    title: "AI-Powered Intelligence",
    description: "Advanced machine learning algorithms create personalized learning experiences that adapt to your unique style and pace.",
    gradient: "from-[#ff9d54] to-[#ff8a30]",
    delay: 0.1,
  },
  {
    icon: <RiRocketLine className="text-2xl text-white" />,
    title: "Accelerated Growth",
    description: "Boost your learning speed with interactive modules, real-time feedback, and gamified progress tracking.",
    gradient: "from-[#ff8a30] to-[#ff9d54]",
    delay: 0.2,
  },
  {
    icon: <RiShieldCheckLine className="text-2xl text-white" />,
    title: "Proven Results",
    description: "Join thousands of successful learners who've achieved their goals with our scientifically-backed methodology.",
    gradient: "from-[#ff9d54] to-[#ff7a20]",
    delay: 0.3,
  },
  {
    icon: <RiGlobalLine className="text-2xl text-white" />,
    title: "Global Community",
    description: "Connect with learners worldwide, share knowledge, and grow together in our supportive learning ecosystem.",
    gradient: "from-[#ff8a30] to-[#ff9d54]",
    delay: 0.4,
  },
  {
    icon: <RiAwardLine className="text-2xl text-white" />,
    title: "Industry Recognition",
    description: "Earn certificates and badges recognized by top companies and institutions worldwide.",
    gradient: "from-[#ff9d54] to-[#ff8a30]",
    delay: 0.5,
  },
  {
    icon: <RiTimeLine className="text-2xl text-white" />,
    title: "24/7 Availability",
    description: "Learn anytime, anywhere with our cloud-based platform that syncs across all your devices.",
    gradient: "from-[#ff7a20] to-[#ff9d54]",
    delay: 0.6,
  },
];

const stats = [
  { number: "50K+", label: "Active Learners", icon: <RiUserLine /> },
  { number: "200+", label: "Learning Paths", icon: <RiRocketLine /> },
  { number: "98%", label: "Success Rate", icon: <RiAwardLine /> },
  { number: "24/7", label: "AI Support", icon: <RiBrainLine /> },
];

const testimonials = [
  {
    name: "Alexandra Chen",
    role: "Senior Software Engineer",
    company: "Google",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    quote: "UniSkills's AI-driven approach revolutionized my learning journey. The personalized paths helped me master complex concepts faster than ever before.",
    rating: 5,
  },
  {
    name: "Marcus Rodriguez",
    role: "Data Scientist",
    company: "Microsoft",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    quote: "The interactive modules and real-time feedback system are game-changers. I've never experienced such engaging and effective learning.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Product Manager",
    company: "Meta",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    quote: "From beginner to expert in just months! The adaptive learning technology truly understands how I learn best.",
    rating: 5,
  },
];

const faqs = [
  {
    q: "How does UniSkills's AI personalization work?",
    a: "Our advanced AI analyzes your learning patterns, performance metrics, and preferences to create a unique learning path. It continuously adapts based on your progress, ensuring optimal challenge levels and content delivery.",
  },
  {
    q: "Is UniSkills suitable for complete beginners?",
    a: "Absolutely! Our platform is designed for learners at all levels. The AI assessment identifies your current knowledge and creates a customized starting point, whether you're a complete beginner or looking to advance existing skills.",
  },
  {
    q: "What makes UniSkills different from other learning platforms?",
    a: "UniSkills combines cutting-edge AI technology with proven educational methodologies. Our unique features include real-time adaptation, interactive simulations, peer collaboration tools, and industry-recognized certifications.",
  },
  {
    q: "Can I learn at my own pace?",
    a: "Yes! UniSkills is completely self-paced. You can pause, resume, or revisit any content anytime. The AI adjusts to your schedule and learning speed, ensuring you never feel rushed or held back.",
  },
  {
    q: "What kind of support is available?",
    a: "We offer 24/7 AI-powered assistance, community forums, expert mentorship programs, and dedicated support teams. You'll never feel alone in your learning journey.",
  },
  {
    q: "Are the certificates recognized by employers?",
    a: "Yes! Our certificates are recognized by leading companies worldwide including Google, Microsoft, Amazon, and many others. We maintain partnerships with industry leaders to ensure our credentials hold real value.",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartLearning = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="w-full bg-[#1c1b1b] text-white relative overflow-hidden">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Hero Section - Completely Redesigned */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1c1b1b] via-[#252525] to-[#1c1b1b] overflow-hidden">
        <FloatingElements />

        {/* Grid Pattern Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-[#ff9d54]/10 via-transparent to-transparent"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
          <div className="text-center space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center px-6 py-3 rounded-full bg-[#2a2a2a]/80 backdrop-blur-sm border border-[#ff9d54]/30 text-[#ff9d54] font-medium"
            >
              <RiSparklingLine className="mr-2 text-lg" />
              Next-Generation AI Learning Platform
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight"
            >
              <span className="block text-white mb-3">Transform Your</span>
              <span className="block bg-gradient-to-r from-[#ff9d54] via-[#ff8a30] to-[#ff9d54] bg-clip-text text-transparent animate-gradient-x">
                Learning Journey
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-3xl mx-auto text-base sm:text-lg lg:text-xl text-gray-300 leading-relaxed"
            >
              Unlock your potential with AI-powered personalized learning paths,
              interactive content, and real-time progress tracking.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row justify-center gap-4 mt-8"
            >
              <motion.button
                onClick={handleStartLearning}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="group px-8 py-3 bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] text-white text-base font-semibold rounded-xl
                shadow-xl shadow-[#ff9d54]/25 hover:shadow-[#ff9d54]/40
                transition-all duration-500 flex items-center justify-center gap-2"
              >
                Start Learning Free
                <RiArrowRightLine className="text-lg group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="group px-8 py-3 bg-[#2a2a2a]/80 backdrop-blur-sm border-2 border-[#3a3a3a] text-white text-base font-semibold rounded-xl
                hover:border-[#ff9d54] hover:bg-[#333333]/80 transition-all duration-500 flex items-center justify-center gap-2"
              >
                Watch Demo
                <RiPlayCircleLine className="text-lg text-[#ff9d54] group-hover:scale-110 transition-transform duration-300" />
              </motion.button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap justify-center items-center gap-6 mt-12 text-gray-400 text-sm"
            >
              <div className="flex items-center gap-2">
                <RiStarLine className="text-[#ff9d54] text-sm" />
                <span>Trusted by 50K+ learners</span>
              </div>
              <div className="flex items-center gap-2">
                <RiShieldCheckLine className="text-[#ff9d54] text-sm" />
                <span>Industry certified</span>
              </div>
              <div className="flex items-center gap-2">
                <RiAwardLine className="text-[#ff9d54] text-sm" />
                <span>98% success rate</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Revolutionary Features Section */}
      <section className="relative py-32 bg-gradient-to-b from-[#252525] to-[#1c1b1b] overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#ff9d54]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#ff8a30]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4"
            >
              <span className="bg-gradient-to-r from-[#ff9d54] via-[#ff8a30] to-[#ff9d54] bg-clip-text text-transparent">
                Revolutionary Features
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-base text-gray-300 max-w-2xl mx-auto"
            >
              Discover cutting-edge technology that adapts to your learning style and accelerates your growth
            </motion.p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: feature.delay, duration: 0.6 }}
                whileHover={{ y: -5, scale: 1.01 }}
                className="group relative bg-[#2a2a2a]/50 backdrop-blur-sm rounded-2xl p-6 border border-[#3a3a3a] hover:border-[#ff9d54]/50 transition-all duration-500 overflow-hidden"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-8 transition-opacity duration-500 rounded-2xl`}></div>

                {/* Icon */}
                <div className="relative z-10 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-[#ff9d54] transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative Element */}
                <div className="absolute top-3 right-3 w-16 h-16 border border-[#ff9d54]/15 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="relative py-20 bg-gradient-to-br from-[#1c1b1b] via-[#2a2a2a] to-[#1c1b1b] overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-[#ff9d54]/8 to-transparent rounded-full"></div>
          <motion.div
            className="absolute inset-0 opacity-10"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,157,84,0.15) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-[#ff9d54] via-[#ff8a30] to-[#ff9d54] bg-clip-text text-transparent">
                Trusted by Learners Worldwide
              </span>
            </h2>
            <p className="text-base text-gray-300 max-w-2xl mx-auto">
              Join our growing community of successful learners and transform your career
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                whileHover={{ scale: 1.03, y: -3 }}
                className="text-center group"
              >
                <div className="bg-[#2a2a2a]/60 backdrop-blur-sm rounded-2xl p-6 border border-[#3a3a3a] hover:border-[#ff9d54]/40 hover:bg-[#333333]/60 transition-all duration-500">
                  <div className="text-[#ff9d54] text-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {stat.icon}
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                    <AnimatedCounter target={stat.number} />
                  </div>
                  <div className="text-gray-300 text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Testimonials Section */}
      <section className="relative py-24 bg-gradient-to-b from-[#1c1b1b] to-[#252525] overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-32 left-16 w-48 h-48 bg-[#ff9d54]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 right-16 w-64 h-64 bg-[#ff8a30]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#ff9d54] via-[#ff8a30] to-[#ff9d54] bg-clip-text text-transparent">
                Success Stories
              </span>
            </h2>
            <p className="text-base text-gray-300 max-w-2xl mx-auto">
              Hear from professionals who transformed their careers with UniSkills
            </p>
          </motion.div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                whileHover={{ y: -5, scale: 1.01 }}
                className="group relative bg-[#2a2a2a]/50 backdrop-blur-sm rounded-2xl p-6 border border-[#3a3a3a] hover:border-[#ff9d54]/50 transition-all duration-500"
              >
                {/* Quote Icon */}
                <div className="absolute top-4 right-4 text-[#ff9d54]/25 text-2xl">
                  <RiQuoteText />
                </div>

                {/* Rating Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <RiStarLine key={i} className="text-[#ff9d54] text-sm" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-gray-300 text-sm leading-relaxed mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full border-2 border-[#ff9d54]/30 group-hover:border-[#ff9d54] transition-colors duration-300"
                  />
                  <div>
                    <h4 className="text-white font-semibold text-sm">
                      {testimonial.name}
                    </h4>
                    <p className="text-[#ff9d54] font-medium text-xs">
                      {testimonial.role}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {testimonial.company}
                    </p>
                  </div>
                </div>

                {/* Decorative Element */}
                <div className="absolute bottom-3 right-3 w-12 h-12 border border-[#ff9d54]/15 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced FAQ Section */}
      <section className="relative py-24 bg-gradient-to-b from-[#252525] to-[#1c1b1b] overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-16 right-16 w-56 h-56 bg-[#ff9d54]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-16 left-16 w-72 h-72 bg-[#ff8a30]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#ff9d54] via-[#ff8a30] to-[#ff9d54] bg-clip-text text-transparent">
                Got Questions?
              </span>
            </h2>
            <p className="text-base text-gray-300 max-w-2xl mx-auto">
              Find answers to the most common questions about UniSkills
            </p>
          </motion.div>

          {/* FAQ Items */}
          <div className="space-y-6">
            {faqs.map((item, index) => (
              <FaqItem key={index} question={item.q} answer={item.a} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Ultimate CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-[#1c1b1b] via-[#2a2a2a] to-[#1c1b1b] overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-[#ff9d54]/8 to-transparent rounded-full"></div>
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,157,84,0.08) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Main Heading */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              <span className="block text-white mb-3">Ready to</span>
              <span className="block bg-gradient-to-r from-[#ff9d54] via-[#ff8a30] to-[#ff9d54] bg-clip-text text-transparent">
                Transform Your Future?
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Join 50,000+ learners who've already started their journey to success.
              Your future self will thank you.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <motion.button
                onClick={handleStartLearning}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="group px-10 py-4 bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] text-white text-lg font-bold rounded-xl
                shadow-xl shadow-[#ff9d54]/30 hover:shadow-[#ff9d54]/50
                transition-all duration-500 flex items-center justify-center gap-2"
              >
                Start Your Journey Free
                <RiRocketLine className="text-xl group-hover:translate-x-1 group-hover:scale-105 transition-all duration-300" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="group px-10 py-4 bg-[#2a2a2a]/80 backdrop-blur-sm border-2 border-[#3a3a3a] text-white text-lg font-bold rounded-xl
                hover:border-[#ff9d54] hover:bg-[#333333]/80 transition-all duration-500 flex items-center justify-center gap-2"
              >
                Book a Demo
                <RiPlayCircleLine className="text-xl text-[#ff9d54] group-hover:scale-105 transition-transform duration-300" />
              </motion.button>
            </div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center items-center gap-6 mt-12 text-gray-400 text-sm"
            >
              <div className="flex items-center gap-2">
                <RiCheckLine className="text-[#ff9d54] text-sm" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <RiCheckLine className="text-[#ff9d54] text-sm" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <RiCheckLine className="text-[#ff9d54] text-sm" />
                <span>30-day money back guarantee</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced CSS Styles */}
      <style jsx>{`
        .animate-gradient-x {
          background-size: 400% 400%;
          animation: gradient-x 8s ease infinite;
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .bg-grid-pattern {
          background-image: linear-gradient(
              to right,
              rgba(255, 157, 84, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(to bottom, rgba(255, 157, 84, 0.1) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .bg-gradient-radial {
          background-image: radial-gradient(
            circle at center,
            var(--tw-gradient-from) 0%,
            var(--tw-gradient-via) 50%,
            var(--tw-gradient-to) 100%
          );
        }

        /* Custom scrollbar for better UX */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #1c1b1b;
        }

        ::-webkit-scrollbar-thumb {
          background: #ff9d54;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #ff8a30;
        }

        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }

        /* Enhanced backdrop blur support */
        @supports (backdrop-filter: blur(10px)) {
          .backdrop-blur-sm {
            backdrop-filter: blur(4px);
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
