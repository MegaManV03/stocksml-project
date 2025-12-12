// App.jsx - COMPLETE REWRITE WITH TOKEN MANAGEMENT
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Sectors from './pages/Sectors';
import Companies from './pages/Companies';
import Analyses from './pages/Analyses';
import Profile from './pages/Profile';
import SectorCompanies from './pages/SectorCompanies';
import CompanyAnalyses from './pages/CompanyAnalyses';
import Account from './pages/Account';
import AdminDashboard from './components/AdminDashboard';
import UsersManagement from './components/UsersManagement';
import CompaniesManagement from './components/CompaniesManagement';
import SectorsManagement from './components/SectorsManagement';
import AnalysesManagement from './components/AnalysesManagement';
import ProtectedRoute from './components/ProtectedRoute';
import { verifyTokenOnStart } from './services/auth';
import './App.css';

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    isLoading: true
  });

  // Check authentication on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await verifyTokenOnStart();
        if (user) {
          setAuthState({
            isAuthenticated: true,
            user,
            isLoading: false
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false
        });
      }
    };

    initializeAuth();

    // Listen for auth changes (login/logout)
    const handleAuthChange = () => {
      initializeAuth();
    };

    window.addEventListener('storage', handleAuthChange);
    return () => window.removeEventListener('storage', handleAuthChange);
  }, []);

  // Loading state
  if (authState.isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/sectors" element={<Sectors />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/analyses" element={<Analyses />} />
          <Route path="/sectors/:sectorId/companies" element={<SectorCompanies />} />
          <Route path="/sectors/:sectorId/companies/:companyId/analyses" element={<CompanyAnalyses />} />
          
          {/* Protected routes - require authentication */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute isAuthenticated={authState.isAuthenticated}>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/account" 
            element={
              <ProtectedRoute isAuthenticated={authState.isAuthenticated}>
                <Account user={authState.user} />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin-only routes */}
          <Route 
            path="/controlPanel" 
            element={
              <ProtectedRoute 
                isAuthenticated={authState.isAuthenticated}
                requiredRole="admin"
                user={authState.user}
              >
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/controlPanel/users" 
            element={
              <ProtectedRoute 
                isAuthenticated={authState.isAuthenticated}
                requiredRole="admin"
                user={authState.user}
              >
                <UsersManagement />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/controlPanel/companies" 
            element={
              <ProtectedRoute 
                isAuthenticated={authState.isAuthenticated}
                requiredRole="admin"
                user={authState.user}
              >
                <CompaniesManagement />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/controlPanel/sectors" 
            element={
              <ProtectedRoute 
                isAuthenticated={authState.isAuthenticated}
                requiredRole="admin"
                user={authState.user}
              >
                <SectorsManagement />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/controlPanel/analyses" 
            element={
              <ProtectedRoute 
                isAuthenticated={authState.isAuthenticated}
                requiredRole="admin"
                user={authState.user}
              >
                <AnalysesManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;