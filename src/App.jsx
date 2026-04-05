import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import "./App.css";
import { useAuth } from './context/AuthContext';
import { testCareerPathCreation } from './testCareerPath';

const App = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const showSidebar = isAuthenticated && ![
    "/login",
    "/signup",
    "/",
    "/home",
    "/reset-password",
  ].includes(location.pathname);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar starts closed

  // Make test function available in console
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.testCareerPathCreation = testCareerPathCreation;
      console.log('🛠️ Debug tool loaded! Run "testCareerPathCreation()" in console to test Appwrite setup');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#1c1b1b] overflow-x-hidden">
      {/* Navbar */}
      <Navbar
        isDashboard={showSidebar}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="flex flex-1 pt-16 relative">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        )}

        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            showSidebar && isSidebarOpen ? "md:ml-64" : ""
          }`}
        >
          <div className="flex-1 p-6">{children}</div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default App;
