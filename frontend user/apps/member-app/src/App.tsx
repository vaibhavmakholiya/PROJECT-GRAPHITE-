import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardSkeleton } from './components/common/SkeletonLoader';

// Lazy-load every route for optimal bundle performance
const LandingView = lazy(() => import('./routes/LandingView'));
const LoginView = lazy(() => import('./routes/LoginView'));
const RegisterView = lazy(() => import('./routes/RegisterView'));
const DashboardView = lazy(() => import('./routes/DashboardView'));
const TransactionsView = lazy(() => import('./routes/TransactionsView'));
const ReceiptsListView = lazy(() => import('./routes/ReceiptsListView'));
const ReceiptDetailView = lazy(() => import('./routes/ReceiptDetailView'));
const LoansView = lazy(() => import('./routes/LoansView'));
const ApplyLoanView = lazy(() => import('./routes/ApplyLoanView'));
const AlertsView = lazy(() => import('./routes/AlertsView'));
const ProfileView = lazy(() => import('./routes/ProfileView'));

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<DashboardSkeleton />}>
        <Routes>
          {/* Public Landing Page at root "/" */}
          <Route path="/" element={<LandingView />} />

          {/* Member App Shell */}
          <Route element={<AppLayout />}>
            <Route path="/login" element={<LoginView />} />
            <Route path="/register" element={<RegisterView />} />
            <Route path="/app" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/transactions" element={<TransactionsView />} />
            <Route path="/receipts" element={<ReceiptsListView />} />
            <Route path="/receipts/:receiptId" element={<ReceiptDetailView />} />
            <Route path="/loans" element={<LoansView />} />
            <Route path="/loans/apply" element={<ApplyLoanView />} />
            <Route path="/alerts" element={<AlertsView />} />
            <Route path="/profile" element={<ProfileView />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
