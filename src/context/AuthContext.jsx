import React, { createContext, useContext, useState, useEffect } from 'react';
import { account } from '../config/appwrite';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session when component mounts
  useEffect(() => {
    const checkInitialSession = async () => {
      setLoading(true);
      try {
        const session = await account.getSession('current');
        if (session) {
          const userData = await account.get();
          console.log("Session found, user authenticated:", userData.$id);
          setUser(userData);
        } else {
          console.log("No session found");
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkInitialSession();
  }, []);

  const checkUser = async () => {
    try {
      const session = await account.getSession('current');
      if (session) {
        const userData = await account.get();
        setUser(userData);
        return userData;
      }
      setUser(null);
      return null;
    } catch (error) {
      console.error('Session error:', error);
      setUser(null);
      return null;
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      console.log("Attempting login for:", email);
      await account.createEmailPasswordSession(email, password);
      const userData = await account.get();
      console.log("Login successful, user:", userData.$id);
      setUser(userData);
      console.log("Navigating to dashboard");
      navigate('/dashboard', { replace: true });
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name) => {
    setLoading(true);
    try {
      const user = await account.create('unique()', email, password, name);
      console.log("User created:", user.$id);
      return login(email, password);
    } catch (error) {
      setLoading(false);
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await account.deleteSession('current');
      setUser(null);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
  };

  // Add periodic session check
  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (user) {
        try {
          const userData = await checkUser();
          if (!userData) {
            console.log("Session expired, redirecting to login");
            navigate('/login', { replace: true });
          }
        } catch (error) {
          console.error("Session check error:", error);
          navigate('/login', { replace: true });
        }
      }
    }, 300000); // Check every 5 minutes

    return () => clearInterval(intervalId);
  }, [user, navigate]);

  const contextValue = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
