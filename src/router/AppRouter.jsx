import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/Loader';

// Pages
import Home from '../pages/Home';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import Dashboard from '../pages/Dashboard';
import ReviewsPage from '../pages/ReviewsPage';
import StatisticsPage from '../pages/StatisticsPage';
import ProfilePage from '../pages/ProfilePage';
import CommunityPage from '../pages/CommunityPage';
import CatalogPage from '../pages/CatalogPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <Loader size="large" message="Cargando..." />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

const AppContent = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomeRoute = location.pathname === '/';

  const handleLogout = async () => {
    await logout();
    // Redirect to public home after logging out
    navigate('/', { replace: true });
  };

  return (
    <div className="app">
      <Header
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        currentUser={currentUser}
        onProfileClick={() => navigate('/profile')}
      />

      <main className={`main-content ${isHomeRoute ? 'home-main' : ''}`}>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <Home />
              </PublicRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/community" 
            element={<CommunityPage />}
          />
          <Route path="/catalog" element={<CatalogPage />} />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reviews" 
            element={
              <ProtectedRoute>
                <ReviewsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/stats" 
            element={
              <ProtectedRoute>
                <StatisticsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />

          {/* Catch all - redirect to appropriate home */}
          <Route 
            path="*" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/" replace />
            } 
          />
        </Routes>
      </main>
    </div>
  );
};

const AppRouter = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

  export default AppRouter;
// End of AppRouter.jsx

