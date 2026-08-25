import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../hooks/useAccessibility';

export const CommonDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, highContrast, toggleTheme, toggleHighContrast } = useAccessibility();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text transition-colors duration-200">
      
      {/* Header bar */}
      <header className="border-b border-border bg-cardBg py-4 px-6 md:px-8 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight">
              Sign<span className="text-primary font-extrabold">Bridge</span>
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              Common Workspace
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            
            {/* Quick accessibility settings */}
            <div className="flex items-center gap-2" aria-label="Accessibility Settings">
              <button
                onClick={toggleTheme}
                className="px-3 py-1.5 bg-bg border border-border rounded-lg text-xs font-semibold hover:bg-primary hover:text-bg focus:outline-none"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
              </button>
              <button
                onClick={toggleHighContrast}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold focus:outline-none ${
                  highContrast
                    ? 'bg-yellow-400 text-black border-black'
                    : 'bg-bg border-border hover:bg-primary hover:text-bg'
                }`}
                aria-label="Toggle high contrast"
              >
                👁️ HC
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="btn-secondary py-2 text-sm min-h-[40px] flex items-center justify-center font-bold"
              aria-label="Sign out of your account"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 md:px-8 py-10 flex flex-col gap-8">
        
        {/* User Welcome Widget */}
        <section className="card flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-8">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">Welcome back, {user?.name}</h1>
            <p className="text-sm opacity-80">{user?.email}</p>
          </div>
          <div className="flex gap-3">
            <button 
              disabled 
              className="btn-primary opacity-60 cursor-not-allowed text-sm min-h-[44px] flex items-center justify-center"
              aria-describedby="comm-cap"
            >
              🎥 Start Video Call
            </button>
          </div>
        </section>

        {/* Dashboard Grid Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Panel 1: Recent Activity */}
          <section className="card flex flex-col gap-4 lg:col-span-2" aria-labelledby="chats-title">
            <h2 id="chats-title" className="text-xl font-bold border-b border-border pb-2">
              Recent Conversations
            </h2>
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-bg/50">
              <span className="text-3xl mb-2" aria-hidden="true">💬</span>
              <p className="text-sm font-semibold opacity-75">No active conversations found.</p>
              <p className="text-xs opacity-60 mt-1">Direct messaging features will be configured in a future release.</p>
            </div>
          </section>

          {/* Panel 2: Quick Tools & Contacts */}
          <div className="flex flex-col gap-8">
            
            {/* Contacts list */}
            <section className="card flex flex-col gap-4" aria-labelledby="contacts-title">
              <h2 id="contacts-title" className="text-xl font-bold border-b border-border pb-2">
                Contacts
              </h2>
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-lg bg-bg/50">
                <span className="text-2xl mb-2" aria-hidden="true">👥</span>
                <p className="text-sm font-semibold opacity-75">Your contact list is empty.</p>
              </div>
            </section>

            {/* Profile Info */}
            <section className="card flex flex-col gap-3" aria-labelledby="info-title">
              <h2 id="info-title" className="text-xl font-bold border-b border-border pb-2">
                Account Information
              </h2>
              <ul className="text-sm flex flex-col gap-2 opacity-90">
                <li><strong>Account Type:</strong> Common User</li>
                <li><strong>Security Status:</strong> SSL Cryptographic Session</li>
                <li><strong>Database Key:</strong> <code className="bg-bg px-1 rounded text-xs select-all">{user?.id}</code></li>
              </ul>
            </section>

          </div>

        </div>

        {/* Information badge indicating planned integration */}
        <div 
          id="comm-cap" 
          className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-xs md:text-sm font-medium"
        >
          💡 <strong>Workspace Notice:</strong> Real-time calling, captions, and sign-language translation adapters are planned for upcoming implementation phases. This panel currently operates as a layout placeholder.
        </div>
      </main>

      <footer className="border-t border-[#e0e3e5] dark:border-[#2d3133] bg-[#f1f4f6] dark:bg-[#0d121d] py-6 px-6 text-center text-xs text-[#45474c] dark:text-[#828796] transition-colors duration-200 mt-auto">
        <span>&copy; 2026 SAMBHAV. All rights reserved.</span>
      </footer>
    </div>
  );
};
export default CommonDashboard;
