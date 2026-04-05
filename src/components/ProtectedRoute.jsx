import React, { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Extra safety for navigation
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log("ProtectedRoute - Not authenticated, redirecting to login");
      navigate("/login", { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, loading, location, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1c1b1b]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute render - Not authenticated, returning Navigate component");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("ProtectedRoute - Authenticated user:", user?.$id);
  return children;
};

export default ProtectedRoute;
