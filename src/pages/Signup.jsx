import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { account } from '../config/appwrite';
import { ID } from 'appwrite';
import {
  RiEyeLine,
  RiEyeOffLine,
  RiMailLine,
  RiLockLine,
  RiUserLine,
  RiArrowRightLine,
  RiSparklingLine,
  RiShieldCheckLine,
  RiCheckLine
} from 'react-icons/ri';

// Enhanced Particle Background for Auth Pages
const AuthParticleBackground = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const particleCount = 30;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.3 + 0.1,
      color: Math.random() > 0.5 ? '#ff9d54' : '#ff8a30',
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    let animationId;

    const animateParticles = () => {
      setParticles(prev => prev.map(particle => {
        let newX = particle.x + particle.speedX;
        let newY = particle.y + particle.speedY;

        if (newX <= 0 || newX >= window.innerWidth) particle.speedX *= -1;
        if (newY <= 0 || newY >= window.innerHeight) particle.speedY *= -1;

        return {
          ...particle,
          x: Math.max(0, Math.min(window.innerWidth, newX)),
          y: Math.max(0, Math.min(window.innerHeight, newY)),
        };
      }));

      animationId = requestAnimationFrame(animateParticles);
    };

    animationId = requestAnimationFrame(animateParticles);
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full will-change-transform"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 4}px ${particle.color}60`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [particle.opacity * 0.5, particle.opacity * 1.5, particle.opacity * 0.5],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
            delay: Math.random() * 4,
          }}
        />
      ))}
    </div>
  );
};

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Memoized password strength calculation
  const passwordAnalysis = useMemo(() => {
    const password = formData.password;
    if (!password) return { checks: {}, score: 0, strength: '' };

    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    
    let strength = '';
    if (score <= 2) strength = 'Weak';
    else if (score === 3 || score === 4) strength = 'Moderate';
    else strength = 'Strong';

    return { checks, score, strength };
  }, [formData.password]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create account
      const account_response = await account.create(
        ID.unique(),
        formData.email,
        formData.password,
        formData.name
      );

      if (account_response.$id) {
        await account.createEmailPasswordSession(formData.email, formData.password);
        window.location.href = '/dashboard';  // Use full page redirect
      }
    } catch (error) {
      console.error("Signup error:", error);
      if (error.code === 409) {
        setError('Email already exists. Please login instead.');
      } else if (error.code === 400) {
        setError('Invalid email or password format.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1c1b1b] via-[#252525] to-[#1c1b1b] relative overflow-hidden">
      {/* Particle Background */}
      <AuthParticleBackground />

      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-[#ff9d54]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#ff8a30]/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
        className="relative z-10 bg-[#2a2a2a]/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-md w-full border border-[#3a3a3a]/50 hover:border-[#ff9d54]/30 transition-all duration-500"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-[#ff9d54]/10 border border-[#ff9d54]/20 text-[#ff9d54] text-sm font-medium mb-4"
          >
            <RiSparklingLine className="mr-2" />
            Join SkillCompass
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold bg-gradient-to-r from-[#ff9d54] via-[#ff8a30] to-[#ff9d54] bg-clip-text text-transparent mb-2"
          >
            Create Your Account
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-sm"
          >
            Start your learning journey today
          </motion.p>
        </div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onSubmit={handleSignup}
          className="space-y-6"
        >
          {/* Name Field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-gray-300 text-sm font-medium mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiUserLine className="h-5 w-5 text-[#ff9d54]/60" />
              </div>
              <input
                type="text"
                required
                placeholder="Enter your full name"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#3a3a3a] focus:ring-2 focus:ring-[#ff9d54]/50 focus:border-[#ff9d54]
                bg-[#1c1b1b]/50 text-white placeholder-gray-500 shadow-lg backdrop-blur-sm
                hover:border-[#ff9d54]/30 transition-all duration-300"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </motion.div>

          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-gray-300 text-sm font-medium mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiMailLine className="h-5 w-5 text-[#ff9d54]/60" />
              </div>
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#3a3a3a] focus:ring-2 focus:ring-[#ff9d54]/50 focus:border-[#ff9d54]
                bg-[#1c1b1b]/50 text-white placeholder-gray-500 shadow-lg backdrop-blur-sm
                hover:border-[#ff9d54]/30 transition-all duration-300"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiLockLine className="h-5 w-5 text-[#ff9d54]/60" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Create a strong password"
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-[#3a3a3a] focus:ring-2 focus:ring-[#ff9d54]/50 focus:border-[#ff9d54]
                bg-[#1c1b1b]/50 text-white placeholder-gray-500 shadow-lg backdrop-blur-sm
                hover:border-[#ff9d54]/30 transition-all duration-300"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                }}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <RiEyeOffLine className="h-5 w-5 text-gray-400 hover:text-[#ff9d54] transition-colors" />
                ) : (
                  <RiEyeLine className="h-5 w-5 text-gray-400 hover:text-[#ff9d54] transition-colors" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Password Strength Indicator */}
          <AnimatePresence>
            {formData.password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {/* Strength Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Password Strength</span>
                    <span className={`text-xs font-medium ${
                      passwordAnalysis.strength === 'Weak' ? 'text-red-400' :
                      passwordAnalysis.strength === 'Moderate' ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {passwordAnalysis.strength}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#3a3a3a] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(passwordAnalysis.score / 5) * 100}%` }}
                      transition={{ duration: 0.5, ease: [0.4, 0, 0.6, 1] }}
                      className={`h-full transition-colors duration-300 ${
                        passwordAnalysis.strength === 'Weak' ? 'bg-red-500' :
                        passwordAnalysis.strength === 'Moderate' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(passwordAnalysis.checks).map(([key, met]) => (
                    <div key={key} className={`flex items-center gap-1 ${met ? 'text-green-400' : 'text-gray-500'}`}>
                      <RiCheckLine className={`w-3 h-3 ${met ? 'text-green-400' : 'text-gray-500'}`} />
                      <span>
                        {key === 'length' ? '8+ chars' :
                         key === 'lowercase' ? 'Lowercase' :
                         key === 'uppercase' ? 'Uppercase' :
                         key === 'number' ? 'Number' : 'Special char'}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#ff9d54] to-[#ff8a30] text-white rounded-xl font-semibold
            shadow-xl shadow-[#ff9d54]/25 hover:shadow-[#ff9d54]/40 disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-500 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <RiArrowRightLine className="w-4 h-4" />
              </>
            )}
          </motion.button>

          {/* Login Link */}
          <div className="text-center pt-4 border-t border-[#3a3a3a]/50">
            <p className="text-gray-400 text-sm mb-2">Already have an account?</p>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="text-[#ff9d54] hover:text-[#ff8a30] font-semibold transition-colors duration-300 flex items-center justify-center gap-1 mx-auto"
            >
              <RiShieldCheckLine className="w-4 h-4" />
              Sign In Instead
            </motion.button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );

};

export default Signup;
