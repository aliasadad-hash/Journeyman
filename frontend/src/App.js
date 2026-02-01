import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { OnlineStatusProvider } from "./context/OnlineStatusContext";
import {
  LandingPage,
  LoginPage,
  SignupPage,
  AuthCallback,
  OnboardingPage,
  DashboardPage,
  MatchesPage,
  ChatsPage,
  ChatPage,
  ProfileViewPage,
  SchedulesPage,
  MyProfilePage,
  NearbyPage,
  SettingsPage,
} from "./components/pages";

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// App routes
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  // Check if this is an OAuth callback (has session_id in hash)
  const isOAuthCallback = window.location.hash.includes('session_id=');

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />} />

      {/* OAuth callback and Dashboard share same route */}
      <Route path="/dashboard" element={
        isOAuthCallback ? <AuthCallback /> : 
        user ? <DashboardPage /> : 
        <Navigate to="/login" replace />
      } />

      {/* Protected routes */}
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route path="/nearby" element={<ProtectedRoute><NearbyPage /></ProtectedRoute>} />
      <Route path="/matches" element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />
      <Route path="/chats" element={<ProtectedRoute><ChatsPage /></ProtectedRoute>} />
      <Route path="/chat/:userId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/profile/:profileId" element={<ProtectedRoute><ProfileViewPage /></ProtectedRoute>} />
      <Route path="/schedules" element={<ProtectedRoute><SchedulesPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OnlineStatusProvider>
          <AppRoutes />
        </OnlineStatusProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
