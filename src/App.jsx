import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import CandidateDashboardPage from './pages/dashboards/CandidateDashboardPage';
import RecruiterDashboardPage from './pages/dashboards/RecruiterDashboardPage';
import AdminDashboardPage from './pages/dashboards/AdminDashboardPage';
import CeoDashboardPage from './pages/dashboards/CeoDashboardPage';
import InterviewerDashboardPage from './pages/dashboards/InterviewerDashboardPage';
import { RedirectIfAuth, RequireAuth } from '@/components/auth/RouteGuards';
import CreateJobPostPage from './pages/jobs/CreateJobPostPage';
import JobPostViewPage from './pages/jobs/JobPostViewPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<RedirectIfAuth><Landing /></RedirectIfAuth>} />
      <Route path="/auth/:role" element={<RedirectIfAuth><AuthPage /></RedirectIfAuth>} />
      <Route path="/dashboard/candidate" element={<RequireAuth allowRoles={['candidate']}><CandidateDashboardPage /></RequireAuth>} />
      <Route path="/dashboard/recruiter" element={<RequireAuth allowRoles={['recruiter']}><RecruiterDashboardPage /></RequireAuth>} />
      <Route path="/dashboard/interviewer" element={<RequireAuth allowRoles={['interviewer']}><InterviewerDashboardPage /></RequireAuth>} />
      <Route path="/dashboard/recruiter/jobs/new" element={<RequireAuth allowRoles={['recruiter']}><CreateJobPostPage /></RequireAuth>} />
      <Route path="/dashboard/recruiter/jobs/:id" element={<RequireAuth allowRoles={['recruiter']}><JobPostViewPage /></RequireAuth>} />
      <Route path="/jobs/:id" element={<RequireAuth allowRoles={['candidate', 'recruiter']}><JobPostViewPage /></RequireAuth>} />
      <Route path="/dashboard/admin" element={<RequireAuth allowRoles={['admin']}><AdminDashboardPage /></RequireAuth>} />
      <Route path="/dashboard/ceo-chro" element={<RequireAuth allowRoles={['ceo_chro']}><CeoDashboardPage /></RequireAuth>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  const [globalLoading, setGlobalLoading] = useState(false);

  useEffect(() => {
    const handleLoaderEvent = (event) => {
      setGlobalLoading(Boolean(event?.detail?.isLoading));
    };
    window.addEventListener("global-api-loading", handleLoaderEvent);
    return () => window.removeEventListener("global-api-loading", handleLoaderEvent);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          {globalLoading ? (
            <div className="fixed inset-0 z-[2000] bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
          ) : null}
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App