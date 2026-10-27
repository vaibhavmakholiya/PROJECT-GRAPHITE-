import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleGuard } from './routes/RoleGuard';
import { DashboardSkeleton } from './components/common/SkeletonLoader';

// Public Lazy Routes
const LandingView = lazy(() => import('./public/LandingView'));
const LoginView = lazy(() => import('./public/LoginView'));
const RegisterView = lazy(() => import('./public/RegisterView'));
const PendingView = lazy(() => import('./public/PendingView'));

// Member App Shell & Lazy Routes (Code-split for members)
const MemberLayout = lazy(() => import('./member/components/MemberLayout'));
const MemberDashboardView = lazy(() => import('./member/routes/DashboardView'));
const MemberTransactionsView = lazy(() => import('./member/routes/TransactionsView'));
const MemberReceiptsListView = lazy(() => import('./member/routes/ReceiptsListView'));
const MemberReceiptDetailView = lazy(() => import('./member/routes/ReceiptDetailView'));
const MemberLoansView = lazy(() => import('./member/routes/LoansView'));
const MemberApplyLoanView = lazy(() => import('./member/routes/ApplyLoanView'));
const MemberAlertsView = lazy(() => import('./member/routes/AlertsView'));
const MemberProfileView = lazy(() => import('./member/routes/ProfileView'));

// Admin App Shell & Lazy Routes (Code-split into separate admin chunk)
const AdminLayout = lazy(() => import('./admin/components/AdminLayout'));
const AdminDashboardView = lazy(() => import('./admin/routes/AdminDashboardView'));
const AdminMembersView = lazy(() => import('./admin/routes/AdminMembersView'));
const AdminAddTransactionView = lazy(() => import('./admin/routes/AdminAddTransactionView'));
const AdminLoansView = lazy(() => import('./admin/routes/AdminLoansView'));
const AdminHistoryView = lazy(() => import('./admin/routes/AdminHistoryView'));
const AdminAnnouncementsView = lazy(() => import('./admin/routes/AdminAnnouncementsView'));
const AdminConflictsView = lazy(() => import('./admin/routes/AdminConflictsView'));
const AdminSettingsView = lazy(() => import('./admin/routes/AdminSettingsView'));
const AdminSyncStatusView = lazy(() => import('./admin/routes/AdminSyncStatusView'));

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<DashboardSkeleton />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingView />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />
          <Route path="/pending" element={<PendingView />} />

          {/* Member Area: Protected by RoleGuard(member) */}
          <Route element={<RoleGuard requiredRole="member" />}>
            <Route path="/app" element={<MemberLayout />}>
              <Route index element={<MemberDashboardView />} />
              <Route path="transactions" element={<MemberTransactionsView />} />
              <Route path="receipts" element={<MemberReceiptsListView />} />
              <Route path="receipts/:receiptId" element={<MemberReceiptDetailView />} />
              <Route path="loans" element={<MemberLoansView />} />
              <Route path="loans/apply" element={<MemberApplyLoanView />} />
              <Route path="alerts" element={<MemberAlertsView />} />
              <Route path="profile" element={<MemberProfileView />} />
            </Route>
          </Route>

          {/* Admin Area: Protected by RoleGuard(admin) */}
          <Route element={<RoleGuard requiredRole="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardView />} />
              <Route path="members" element={<AdminMembersView />} />
              <Route path="add" element={<AdminAddTransactionView />} />
              <Route path="loans" element={<AdminLoansView />} />
              <Route path="history" element={<AdminHistoryView />} />
              <Route path="withdraw" element={<AdminAddTransactionView />} />
              <Route path="loan" element={<AdminLoansView />} />
              <Route path="announcements" element={<AdminAnnouncementsView />} />
              <Route path="conflicts" element={<AdminConflictsView />} />
              <Route path="settings" element={<AdminSettingsView />} />
              <Route path="sync" element={<AdminSyncStatusView />} />
            </Route>
          </Route>

          {/* Legacy & Shortcut Redirects */}
          <Route path="/dashboard" element={<Navigate to="/app" replace />} />
          <Route path="/transactions" element={<Navigate to="/app/transactions" replace />} />
          <Route path="/receipts" element={<Navigate to="/app/receipts" replace />} />
          <Route path="/receipts/:receiptId" element={<Navigate to="/app/receipts/:receiptId" replace />} />
          <Route path="/receipt/:receiptId" element={<Navigate to="/app/receipts/:receiptId" replace />} />
          <Route path="/loans" element={<Navigate to="/app/loans" replace />} />
          <Route path="/loans/apply" element={<Navigate to="/app/loans/apply" replace />} />
          <Route path="/alerts" element={<Navigate to="/app/alerts" replace />} />
          <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
          <Route path="/home" element={<Navigate to="/admin" replace />} />
          <Route path="/admin-login" element={<Navigate to="/login?role=admin" replace />} />
          <Route path="/member-login" element={<Navigate to="/login?role=member" replace />} />
          <Route path="/group" element={<Navigate to="/admin/members" replace />} />
          <Route path="/history" element={<Navigate to="/admin/history" replace />} />
          <Route path="/add" element={<Navigate to="/admin/add" replace />} />
          <Route path="/withdraw" element={<Navigate to="/admin/add?type=withdrawal" replace />} />
          <Route path="/loan" element={<Navigate to="/admin/loans" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
