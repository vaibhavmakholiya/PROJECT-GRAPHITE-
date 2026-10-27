import React from 'react';
import { Outlet } from 'react-router-dom';
import { MemberHeader } from './MemberHeader';
import { MemberBottomNav } from './MemberBottomNav';
import { useAuth } from '../../hooks/useAuth';

export const MemberLayout: React.FC = () => {
  const { member, logout } = useAuth();

  return (
    <div className="min-h-screen bg-blue-50 text-navy-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <MemberHeader member={member} onLogout={logout} />
      <main className="flex-1 max-w-5xl w-full mx-auto pb-24 md:pb-12 pt-4 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <MemberBottomNav memberId={member?.memberId} />
    </div>
  );
};

export default MemberLayout;
