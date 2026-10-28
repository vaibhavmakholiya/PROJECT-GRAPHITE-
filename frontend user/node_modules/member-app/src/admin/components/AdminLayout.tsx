import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminBottomNav } from './AdminBottomNav';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F8FC] text-navy-900 flex font-sans selection:bg-blue-600 selection:text-white">
      {/* Desktop Sidebar (hidden on mobile) */}
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header (hidden on desktop) */}
        <AdminHeader />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-10">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation (hidden on desktop) */}
        <AdminBottomNav />
      </div>
    </div>
  );
};

export default AdminLayout;
