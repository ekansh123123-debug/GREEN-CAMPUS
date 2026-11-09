import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RoleBanner from './components/layout/RoleBanner';
import Navbar from './components/layout/Navbar';
import MobileBottomNav from './components/layout/MobileBottomNav';
import Footer from './components/layout/Footer';

// Code-split feature views for optimal page performance
const StudentDashboard = lazy(() => import('./features/dashboard/StudentDashboard'));
const IssueListPage = lazy(() => import('./features/issues/IssueListPage'));
const IssueReportForm = lazy(() => import('./features/issues/IssueReportForm'));
const IssueDetailPage = lazy(() => import('./features/issues/IssueDetailPage'));
const MyIssuesPage = lazy(() => import('./features/issues/MyIssuesPage'));
const MarketplaceListPage = lazy(() => import('./features/marketplace/MarketplaceListPage'));
const CreateListingPage = lazy(() => import('./features/marketplace/CreateListingPage'));
const MarketplaceDetailPage = lazy(() => import('./features/marketplace/MarketplaceDetailPage'));
const StaffTaskPortal = lazy(() => import('./features/staff/StaffTaskPortal'));
const AnalyticsDashboard = lazy(() => import('./features/analytics/AnalyticsDashboard'));
const AdminOverviewPage = lazy(() => import('./features/admin/AdminOverviewPage'));
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage'));

function RoleBasedHome() {
  const { role } = useAuth();
  if (role === 'staff') {
    return <StaffTaskPortal />;
  }
  if (role === 'admin') {
    return <AnalyticsDashboard />;
  }
  return <StudentDashboard />;
}

function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Evaluator Persona Switcher */}
      <RoleBanner />
      {/* Navigation */}
      <Navbar />
      {/* Content */}
      <main className="flex-1 pb-20 md:pb-8">
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
              Loading campus resources...
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      {/* Academic Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<RoleBasedHome />} />
            {/* Issues */}
            <Route path="/issues" element={<IssueListPage />} />
            <Route path="/issues/report" element={<IssueReportForm />} />
            <Route path="/issues/my" element={<MyIssuesPage />} />
            <Route path="/issues/:id" element={<IssueDetailPage />} />
            {/* Marketplace */}
            <Route path="/marketplace" element={<MarketplaceListPage />} />
            <Route path="/marketplace/create" element={<CreateListingPage />} />
            <Route path="/marketplace/:id" element={<MarketplaceDetailPage />} />
            {/* Staff Work Portal */}
            <Route path="/staff" element={<StaffTaskPortal />} />
            {/* Administrator Overview & Verification */}
            <Route path="/admin" element={<AdminOverviewPage />} />
            {/* Sustainability Analytics */}
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}
