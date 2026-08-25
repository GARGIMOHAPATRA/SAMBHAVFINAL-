import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const PlaceholderPage: React.FC = () => {
  const location = useLocation();

  // Map route to human readable titles
  const getPageInfo = (path: string) => {
    switch (path) {
      case '/login':
        return { name: 'Sign In', phase: 'Phase 2 (User Authentication)' };
      case '/register':
        return { name: 'Register Account', phase: 'Phase 2 (User Authentication)' };
      case '/dashboard':
        return { name: 'Workspace Dashboard', phase: 'Phase 4 (Live Streams) & Phase 5 (ISL Translation)' };
      case '/accessibility':
        return { name: 'Accessibility Policy & Configuration', phase: 'Phase 1 (Basic Controls) & Phase 6 (Compliance Auditing)' };
      case '/admin':
        return { name: 'Administration Console', phase: 'Phase 6 (Admin Panels & Audits)' };
      default:
        return { name: 'Platform Service', phase: 'a future release phase' };
    }
  };

  const pageInfo = getPageInfo(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-border bg-cardBg py-4 px-6 shadow-sm sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight hover:opacity-85 focus:outline-none"
            aria-label="SignBridge Home"
          >
            <span className="text-primary font-extrabold">Sign</span>
            <span>Bridge</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="font-medium hover:text-primary transition-colors focus:outline-none"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-16 flex flex-col items-center justify-center text-center">
        <div className="card max-w-lg w-full p-8 md:p-12">
          <div
            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl mb-6 mx-auto"
            aria-hidden="true"
          >
            🚧
          </div>

          <h1 className="text-3xl font-extrabold mb-4">{pageInfo.name}</h1>

          <p className="text-base opacity-90 leading-relaxed mb-8">
            This module is an architectural boundary established in Phase 1. 
            The full capability is scheduled to be implemented in <strong>{pageInfo.phase}</strong>.
          </p>

          <div className="bg-bg p-4 rounded-lg border border-border text-left mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-primary mb-2">Technical Status</h2>
            <ul className="text-xs space-y-1.5 opacity-90">
              <li>Package boundary initialized: <code className="bg-cardBg px-1 rounded">com.accessibleconnect.backend</code></li>
              <li>Frontend route registered: <code className="bg-cardBg px-1 rounded">{location.pathname}</code></li>
              <li>Mock functionality status: <strong>None (No fake operations loaded)</strong></li>
            </ul>
          </div>

          <Link
            to="/"
            className="btn-primary w-full inline-block text-center focus:outline-none"
          >
            Return to Home Screen
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-cardBg py-6 px-6 text-center text-xs opacity-75 mt-auto transition-colors duration-200">
        <span>&copy; 2026 SignBridge. Incremental Phase 1 MVP</span>
      </footer>
    </div>
  );
};
export default PlaceholderPage;
