import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protected Route Guard
interface ProtectedRouteProps {
  allowedTypes?: Array<'COMMON_USER' | 'ACCESSIBILITY_USER' | 'ADMIN'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedTypes }) => {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-bg text-text"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <span className="font-bold text-lg">Initializing secure session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedTypes && !allowedTypes.includes(user.accountType)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// Anonymous Only Guard (e.g. login, register)
export const UnauthenticatedRoute: React.FC = () => {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-bg text-text"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <span className="font-bold text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// Dashboard Director Route
export const DashboardRouteDirector: React.FC = () => {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-bg text-text"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <span className="font-bold text-lg">Redirecting...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.accountType === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  if (user.accountType === 'ACCESSIBILITY_USER') {
    return <Navigate to="/accessibility-dashboard" replace />;
  }

  return <Navigate to="/common-dashboard" replace />;
};
