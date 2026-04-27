import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LogoLoader } from './LogoLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'admin' | 'worker' | 'user';
}

export const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
  const { user, profile, loading, isAdmin, isWorker } = useAuth();

  if (loading) {
    return <LogoLoader />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role === 'admin' && !isAdmin) {
    return <Navigate to="/" />;
  }

  if (role === 'worker' && !isWorker) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};
