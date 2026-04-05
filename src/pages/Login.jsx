import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendPasswordRecovery } from '../config/appwrite';
import {
  RiEyeLine,
  RiEyeOffLine,
  RiMailLine,
  RiLockLine,
  RiArrowRightLine,
  RiSparklingLine,
  RiShieldCheckLine
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

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState('');

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User already authenticated, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log("Login form submitted:", formData.email);
      await login(formData.email, formData.password);
      console.log("Login component received successful login response");

      // Force redirect in case navigation from auth context didn't work
      setTimeout(() => {
        if (window.location.pathname !== '/dashboard') {
          console.log("Forcing dashboard navigation from Login component");
          navigate('/dashboard', { replace: true });
        }
      }, 500);
    } catch (err) {
      console.error("Login error in component:", err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResetStatus('');

    try {
      await sendPasswordRecovery(resetEmail);
      setResetStatus('Password reset link sent to your email!');
      setShowForgotPassword(false);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated, don't render login page
  if (isAuthenticated && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1c1b1b] via-[#252525] to-[#1c1b1b] relative overflow-hidden">
      {/* Particle Background */}
      <AuthParticleBackground />

      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#ff9d54]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#ff8a30]/5 rounded-full blur-3xl"></div>
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
            {showForgotPassword ? 'Password Recovery' : 'Welcome Back'}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold bg-gradient-to-r from-[#ff9d54] via-[#ff8a30] to-[#ff9d54] bg-clip-text text-transparent mb-2"
          >
            {showForgotPassword ? 'Reset Your Password' : 'Sign In to SkillCompass'}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-sm"
          >
            {showForgotPassword
              ? 'Enter your email to receive a reset link'
              : 'Continue your learning journey'
            }
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {showForgotPassword ? (
            <motion.form
              key="forgot-password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleForgotPassword}
              className="space-y-6"
            >
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
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
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
              </motion.div>

              {/* Error/Success Messages */}
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
                {resetStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
                  >
                    {resetStatus}
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
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <RiArrowRightLine className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              {/* Back to Login */}
              <div className="text-center">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForgotPassword(false)}
                  className="text-[#ff9d54] hover:text-[#ff8a30] font-medium text-sm transition-colors duration-300"
                >
                  ← Back to Login
                </motion.button>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
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
                transition={{ delay: 0.2 }}
              >
                <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <RiLockLine className="h-5 w-5 text-[#ff9d54]/60" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-[#3a3a3a] focus:ring-2 focus:ring-[#ff9d54]/50 focus:border-[#ff9d54]
                    bg-[#1c1b1b]/50 text-white placeholder-gray-500 shadow-lg backdrop-blur-sm
                    hover:border-[#ff9d54]/30 transition-all duration-300"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

              {/* Forgot Password */}
              <div className="flex justify-end">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-[#ff9d54] hover:text-[#ff8a30] font-medium transition-colors duration-300"
                >
                  Forgot Password?
                </motion.button>
              </div>

              {/* Error/Success Messages */}
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
                {resetStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
                  >
                    {resetStatus}
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
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <RiArrowRightLine className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              {/* Sign Up Link */}
              <div className="text-center pt-4 border-t border-[#3a3a3a]/50">
                <p className="text-gray-400 text-sm mb-2">Don't have an account?</p>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/signup')}
                  className="text-[#ff9d54] hover:text-[#ff8a30] font-semibold transition-colors duration-300 flex items-center justify-center gap-1 mx-auto"
                >
                  <RiShieldCheckLine className="w-4 h-4" />
                  Create Account
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>

  );
};

export default Login;
