// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { verifyTokenOnStart } from '../services/auth';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    isLoading: true,
    userRole: null
  });

  useEffect(() => {
    const checkAuth = async () => {
      const user = await verifyTokenOnStart();
      if (user) {
        setAuth({
          isAuthenticated: true,
          isLoading: false,
          userRole: user.role
        });
      } else {
        setAuth({
          isAuthenticated: false,
          isLoading: false,
          userRole: null
        });
      }
    };
    
    checkAuth();
  }, []);

  if (auth.isLoading) {
    return <div>Loading...</div>; // Or a spinner
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && auth.userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;