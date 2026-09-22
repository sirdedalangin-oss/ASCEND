import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Upload = lazy(() => import('@/pages/Upload'));
const Innovations = lazy(() => import('@/pages/Innovations'));
const InnovationDetail = lazy(() => import('@/pages/InnovationDetail'));
const ScalableLibrary = lazy(() => import('@/pages/ScalableLibrary'));
const StrategyMap = lazy(() => import('@/pages/StrategyMap'));
const Criteria = lazy(() => import('@/pages/Criteria'));
const Evaluations = lazy(() => import('@/pages/Evaluations'));
const ChangePassword = lazy(() => import('@/pages/ChangePassword'));
const AdminUsers = lazy(() => import('@/pages/AdminUsers'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background" role="status" aria-live="polite">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    <span className="sr-only">Loading page</span>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/change-password" element={<ChangePassword />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/innovations" element={<Innovations />} />
          <Route path="/innovations/:id" element={<InnovationDetail />} />
          <Route path="/scalable-library" element={<ScalableLibrary />} />
          <Route path="/strategy-map" element={<StrategyMap />} />
          <Route path="/criteria" element={<Criteria />} />
          <Route path="/evaluations" element={<Evaluations />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
