import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import LearningPath from "./pages/LearningPath";
import Quiz from "./pages/Quiz";
import Flashcards from "./pages/Flashcards";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import LearningPathDetails from "./pages/LearningPathDetails";
import ModuleDetails from "./pages/ModuleDetails";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import { AuthProvider } from "./context/AuthContext";
import Chat from "./pages/Chat";
import ResetPassword from "./pages/ResetPassword";
import ProfileForm from "./pages/ProfileForm";
import CareerSummary from "./pages/CareerSummary";
import Leaderboard from "./pages/Leaderboard";
import { PointsProvider } from "./context/PointsContext";
import { StreakProvider } from "./context/StreakContext";
// Removed Streak import

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <StreakProvider>
          <PointsProvider>
            <App>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/profile" element={<ProfileForm />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/learning-path"
                  element={
                    <ProtectedRoute>
                      <LearningPath />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/learning-path/:id"
                  element={
                    <ProtectedRoute>
                      <LearningPathDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/quiz"
                  element={
                    <ProtectedRoute>
                      <Quiz />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/flashcards"
                  element={
                    <ProtectedRoute>
                      <Flashcards />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/progress"
                  element={
                    <ProtectedRoute>
                      <Progress />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/learning-path/:pathId/module/:moduleIndex"
                  element={
                    <ProtectedRoute>
                      <ModuleDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/career-summary"
                  element={
                    <ProtectedRoute>
                      <CareerSummary />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <Leaderboard />
                    </ProtectedRoute>
                  }
                />
                {/* Removed Streak route */}
              </Routes>
            </App>
          </PointsProvider>
        </StreakProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
