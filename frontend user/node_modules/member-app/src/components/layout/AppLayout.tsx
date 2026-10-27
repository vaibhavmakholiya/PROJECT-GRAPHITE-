import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { DevDrawer } from './DevDrawer';
import { useAuth } from '../../hooks/useAuth';
import { useSyncState } from '../../hooks/useSyncState';

export const AppLayout: React.FC = () => {
  const { member, updateStatus } = useAuth();
  const { syncState, queueCount, updateSyncState } = useSyncState();
  const [isDevDrawerOpen, setIsDevDrawerOpen] = useState(false);
  const location = useLocation();

  // Certain screens like Login, Register don't need the bottom bar
  const hideBottomNavRoutes = ['/login', '/register'];
  const shouldShowBottomNav = !hideBottomNavRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-blue-50 text-navy-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Responsive Full-Width Top Header */}
      <AppHeader
        member={member}
        syncState={syncState}
        queueCount={queueCount}
        onOpenDevDrawer={() => setIsDevDrawerOpen(true)}
      />

      {/* Main Content Area - Expansive Desktop Web Layout */}
      <main className={`flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${shouldShowBottomNav ? 'pb-24 md:pb-8' : ''}`}>
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile / Tablet Viewports */}
      {shouldShowBottomNav && (
        <div className="md:hidden">
          <BottomNav memberId={member?.memberId} />
        </div>
      )}

      {/* Development Drawer Simulator */}
      <DevDrawer
        isOpen={isDevDrawerOpen}
        onClose={() => setIsDevDrawerOpen(false)}
        syncState={syncState}
        queueCount={queueCount}
        onUpdateSyncState={updateSyncState}
        member={member}
        onUpdateMemberStatus={updateStatus}
      />
    </div>
  );
};

export default AppLayout;
