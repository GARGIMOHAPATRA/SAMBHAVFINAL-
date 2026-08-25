import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../hooks/useAccessibility';

export const AppLayout: React.FC = () => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useAccessibility();
  
  // Sidebar expanded / mini (collapsed to icons only) state
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: 'dashboard',
    },
    {
      name: 'Communicate',
      path: '/communicate',
      icon: 'forum',
    },
    {
      name: 'Translate',
      path: '/translate',
      icon: 'translate',
    },
    {
      name: 'News',
      path: '/news',
      icon: 'newspaper',
    },
    {
      name: 'Learn ISL',
      path: '/learn-isl',
      icon: 'sign_language',
    },
    {
      name: 'Explore',
      path: '/explore',
      icon: 'explore',
    },
    {
      name: 'History',
      path: '/history',
      icon: 'history',
    },
    {
      name: 'Profile & Settings',
      path: '/profile',
      icon: 'settings',
    },
    {
      name: 'Help',
      path: '/help',
      icon: 'help',
    },
  ];

  if (user?.accountType === 'ADMIN') {
    navItems.push({
      name: 'Admin Console',
      path: '/admin',
      icon: 'shield_person',
    });
  }

  const userName = user?.name || 'User';

  return (
    <div className="min-h-screen flex bg-[#f7fafc] dark:bg-[#030813] text-[#181c1e] dark:text-[#f7fafc] font-['Inter',sans-serif] selection:bg-[#fe9832] selection:text-[#683700] transition-colors duration-200">
      
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#f1f4f6] dark:bg-[#0d121d] border-b border-[#e0e3e5] dark:border-[#2d3133] px-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTg0HBcA_4tr0W91LDkwqOnVSfSNqNLfncEA1PPwyGzu5JLTBXpp_wsXkZjo9tzLvf4KFNyaXk060fIQSGUovqRqh34LlLcrxxAUa5VojHfDfu4jRQJGk6QxnzQbHigwRz16MDMj2DwoCRu_i77QAzKuRLVJ8e2mLUwC7-UvMJ_JB5sui2SpIRfZM5c9yAP4gD3yTYgJBzlXm_PtIyr70gHi3MkHGC95pbUZ_Mid5Kj_my4OpeXflK15WPybnDecsYaov545CM4kLxeQ"
            alt="SAMBHAV Logo"
            className="h-8 w-8 rounded-full object-cover"
          />
          <span className="text-xl font-bold tracking-tight text-[#030813] dark:text-white">
            SAM<span className="text-[#fe9832] font-extrabold">BHAV</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-[#e0e3e5] dark:border-[#2d3133] bg-white dark:bg-[#1a202c] text-[#181c1e] dark:text-white"
            title="Toggle theme"
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border border-[#e0e3e5] dark:border-[#2d3133] bg-white dark:bg-[#1a202c] text-[#181c1e] dark:text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-[#f1f4f6] dark:bg-[#0d121d] z-40 p-4 flex flex-col gap-2 overflow-y-auto">
          {/* User profile info */}
          <div className="flex items-center gap-3 p-3 bg-[#e0e3e5] dark:bg-[#1a202c] rounded-xl mb-2">
            {user?.avatarUrl ? (
              <img
                className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-white/20 shadow-sm shrink-0"
                src={user.avatarUrl}
                alt={userName}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fe9832] via-[#e8872b] to-[#012700] text-white flex items-center justify-center font-bold text-sm border-2 border-white dark:border-white/20 shadow-sm shrink-0 select-none">
                {(userName || 'U').trim().charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold text-sm text-[#030813] dark:text-white">{userName}</p>
              <p className="text-xs text-[#45474c] dark:text-[#828796]">{user?.accountType || 'User Profile'}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-[#fe9832] text-[#683700] font-bold shadow-sm'
                      : 'text-[#45474c] dark:text-[#c1c6d7] hover:bg-[#e0e3e5] dark:hover:bg-[#1a202c]'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-[#e0e3e5] dark:border-[#2d3133] flex flex-col gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop SideNavBar (Expandable / Collapsible to icons only) */}
      <aside
        className={`bg-[#f1f4f6] dark:bg-[#0d121d] text-[#030813] dark:text-white docked left-0 h-full shadow-sm flex-col p-3 gap-2 fixed hidden md:flex overflow-y-auto z-30 border-r border-[#e0e3e5] dark:border-[#2d3133] transition-all duration-300 ${
          sidebarExpanded ? 'w-64' : 'w-20'
        }`}
      >
        {/* Brand Header with 3-Lines (Hamburger) Toggle */}
        <div className={`flex items-center py-2 mb-2 ${sidebarExpanded ? 'justify-between px-2' : 'flex-col gap-3 items-center px-0'}`}>
          {sidebarExpanded ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTg0HBcA_4tr0W91LDkwqOnVSfSNqNLfncEA1PPwyGzu5JLTBXpp_wsXkZjo9tzLvf4KFNyaXk060fIQSGUovqRqh34LlLcrxxAUa5VojHfDfu4jRQJGk6QxnzQbHigwRz16MDMj2DwoCRu_i77QAzKuRLVJ8e2mLUwC7-UvMJ_JB5sui2SpIRfZM5c9yAP4gD3yTYgJBzlXm_PtIyr70gHi3MkHGC95pbUZ_Mid5Kj_my4OpeXflK15WPybnDecsYaov545CM4kLxeQ"
                alt="SAMBHAV Logo"
                className="h-9 w-9 rounded-full object-cover shadow-sm shrink-0"
              />
              <span className="font-bold text-xl tracking-tight text-[#030813] dark:text-white truncate">
                SAM<span className="text-[#fe9832] font-extrabold">BHAV</span>
              </span>
            </div>
          ) : (
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTg0HBcA_4tr0W91LDkwqOnVSfSNqNLfncEA1PPwyGzu5JLTBXpp_wsXkZjo9tzLvf4KFNyaXk060fIQSGUovqRqh34LlLcrxxAUa5VojHfDfu4jRQJGk6QxnzQbHigwRz16MDMj2DwoCRu_i77QAzKuRLVJ8e2mLUwC7-UvMJ_JB5sui2SpIRfZM5c9yAP4gD3yTYgJBzlXm_PtIyr70gHi3MkHGC95pbUZ_Mid5Kj_my4OpeXflK15WPybnDecsYaov545CM4kLxeQ"
              alt="SAMBHAV Logo"
              className="h-9 w-9 rounded-full object-cover shadow-sm shrink-0"
            />
          )}

          {/* 3-Lines Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className={`flex items-center justify-center rounded-xl bg-white dark:bg-[#1a202c] border border-[#e0e3e5] dark:border-[#2d3133] hover:border-[#fe9832] text-[#030813] dark:text-white hover:text-[#fe9832] transition-all shadow-sm focus:outline-none ${
              sidebarExpanded ? 'w-9 h-9' : 'w-11 h-11'
            }`}
            title={sidebarExpanded ? 'Collapse to Icons (More screen space)' : 'Expand Sidebar (Show all options)'}
            aria-label="Toggle navigation view"
          >
            <span className="material-symbols-outlined text-[24px]">
              {sidebarExpanded ? 'menu_open' : 'menu'}
            </span>
          </button>
        </div>

        {/* User Card (Rendered in expanded mode or collapsed mini avatar) */}
        {sidebarExpanded ? (
          <NavLink
            to="/profile"
            className="flex items-center gap-3 px-3 py-2.5 mb-3 bg-[#e0e3e5] dark:bg-[#1a202c] hover:bg-[#d6dadc] dark:hover:bg-[#252d3d] rounded-xl mx-1 shadow-sm transition-all group"
            title="Edit Profile & Avatar"
          >
            {user?.avatarUrl ? (
              <img
                className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-white/20 shadow-sm shrink-0 group-hover:ring-2 group-hover:ring-[#fe9832] transition-all"
                src={user.avatarUrl}
                alt={userName}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#fe9832] via-[#e8872b] to-[#012700] text-white flex items-center justify-center font-bold text-xs border-2 border-white dark:border-white/20 shadow-sm shrink-0 group-hover:ring-2 group-hover:ring-[#fe9832] transition-all select-none">
                {(userName || 'U').trim().charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col truncate flex-1">
              <p className="text-xs font-bold text-[#030813] dark:text-white truncate">{userName}</p>
              <p className="text-[10px] text-[#45474c] dark:text-[#828796] truncate">
                {user?.accountType === 'ADMIN' ? 'Administrator' : 'User Profile'}
              </p>
            </div>
            <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#fe9832] transition-colors">
              edit
            </span>
          </NavLink>
        ) : (
          <NavLink
            to="/profile"
            className="flex justify-center mb-3 group"
            title={`${userName} (Edit Profile)`}
          >
            {user?.avatarUrl ? (
              <img
                className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-white/20 shadow-sm group-hover:ring-2 group-hover:ring-[#fe9832] transition-all"
                src={user.avatarUrl}
                alt={userName}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#fe9832] via-[#e8872b] to-[#012700] text-white flex items-center justify-center font-bold text-xs border-2 border-white dark:border-white/20 shadow-sm group-hover:ring-2 group-hover:ring-[#fe9832] transition-all select-none">
                {(userName || 'U').trim().charAt(0).toUpperCase()}
              </div>
            )}
          </NavLink>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-1 px-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              title={!sidebarExpanded ? item.name : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-xs font-semibold transition-all duration-200 ${
                  sidebarExpanded ? 'gap-3 px-3.5 py-2.5 hover:translate-x-1' : 'justify-center py-3'
                } ${
                  isActive
                    ? 'bg-[#fe9832] text-[#683700] font-bold shadow-sm'
                    : 'text-[#45474c] dark:text-[#c1c6d7] hover:bg-[#e0e3e5] dark:hover:bg-[#1a202c]'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
              {sidebarExpanded && <span className="truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Footer Actions */}
        <div className="mt-auto px-1 pt-3 pb-2 border-t border-[#e0e3e5] dark:border-[#2d3133] flex flex-col gap-2">
          
          {/* Dark / Light Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`w-full py-2 bg-white dark:bg-[#1a202c] border border-[#e0e3e5] dark:border-[#2d3133] rounded-xl text-xs font-semibold text-[#45474c] dark:text-[#c1c6d7] hover:bg-[#e0e3e5] dark:hover:bg-[#2d3133] transition-all flex items-center justify-center gap-2 ${
              !sidebarExpanded && 'px-0'
            }`}
            title="Toggle Light / Dark Mode"
          >
            <span className="material-symbols-outlined text-[18px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            {sidebarExpanded && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center text-[#45474c] dark:text-[#c1c6d7] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors text-xs font-semibold ${
              sidebarExpanded ? 'gap-2 px-3.5 py-2.5' : 'justify-center py-2.5'
            }`}
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            {sidebarExpanded && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area (Dynamically adjusts margin when sidebar is expanded or collapsed) */}
      <main
        className={`flex-1 flex flex-col max-w-[1360px] mx-auto w-full px-4 sm:px-8 py-8 md:py-10 min-h-screen pt-20 md:pt-8 transition-all duration-300 ${
          sidebarExpanded ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'
        }`}
      >
        <Outlet />
      </main>

    </div>
  );
};

export default AppLayout;
