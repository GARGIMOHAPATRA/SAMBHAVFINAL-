import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AccessibilityProvider } from './hooks/useAccessibility';
import { AuthProvider } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { ProtectedRoute, UnauthenticatedRoute, DashboardRouteDirector } from './components/RouteGuards';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { CommunicatePage } from './pages/CommunicatePage';
import { OfflineSessionPage } from './pages/OfflineSessionPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { SignAssetCatalog } from './components/accessibility/SignAssetCatalog';

import { AdminLoginPage } from './pages/AdminLoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { TranslatePage } from './pages/TranslatePage';
import { LearnISLPage } from './pages/LearnISLPage';
import { ExplorePage } from './pages/ExplorePage';
import { HelpPage } from './pages/HelpPage';
import { NewsPage } from './pages/NewsPage';

const OnlineSessionPage = lazy(() => import('./pages/OnlineSessionPage'));

const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/accessibility" element={<PlaceholderPage />} />

            {/* Anonymous Only Routes */}
            <Route element={<UnauthenticatedRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin-login" element={<AdminLoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Authenticated Protected Routes with AppLayout Shell */}
            <Route element={<ProtectedRoute />}>
              
              {/* Director route (no sidebar wrapper as it redirects instantly) */}
              <Route path="/dashboard" element={<DashboardRouteDirector />} />
              
              {/* Layout Routes */}
              <Route element={<AppLayout />}>
                
                {/* Dashboards map to the unified Dashboard component */}
                <Route path="/common-dashboard" element={<Dashboard />} />
                <Route path="/accessibility-dashboard" element={<Dashboard />} />
                
                {/* Communication flows */}
                <Route path="/communicate" element={<CommunicatePage />} />
                <Route 
                  path="/communicate/online/:sessionId" 
                  element={
                    <Suspense fallback={
                      <div className="flex items-center justify-center p-8 min-h-[40vh]" role="status">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mr-3" aria-hidden="true" />
                        <span className="font-bold">Loading secure call workspace...</span>
                      </div>
                    }>
                      <OnlineSessionPage />
                    </Suspense>
                  } 
                />
                <Route path="/communicate/offline/:sessionId" element={<OfflineSessionPage />} />
                
                {/* Core Navigation Routes */}
                <Route path="/translate" element={<TranslatePage />} />
                <Route path="/learn-isl" element={<LearnISLPage />} />
                <Route path="/learn" element={<Navigate to="/learn-isl" replace />} />
                <Route path="/learning" element={<Navigate to="/learn-isl" replace />} />
                <Route path="/isl-learn" element={<Navigate to="/learn-isl" replace />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/news" element={<NewsPage />} />
                
                {/* Session log & Profiles */}
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<ProfilePage />} />

                <Route element={<ProtectedRoute allowedTypes={['ADMIN']} />}>
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin/assets" element={<SignAssetCatalog />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AccessibilityProvider>
  );
};

export default App;
