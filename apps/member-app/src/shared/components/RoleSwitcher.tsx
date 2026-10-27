import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, ArrowLeftRight, UserCheck } from 'lucide-react';
import { getRepository } from '../data';

export const RoleSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const location = useLocation();
  const repo = getRepository();

  const [canSwitch, setCanSwitch] = useState(false);
  const [activeRole, setActiveRoleState] = useState<'admin' | 'member'>('member');

  useEffect(() => {
    let mounted = true;
    repo.canSwitchRole().then((allowed) => {
      if (mounted) {
        setCanSwitch(allowed);
        setActiveRoleState(repo.getActiveRole());
      }
    });
    return () => {
      mounted = false;
    };
  }, [repo, location.pathname]);

  if (!canSwitch) return null;

  const isAdminArea = location.pathname.startsWith('/admin');

  const handleSwitch = () => {
    if (isAdminArea) {
      repo.setActiveRole('member');
      setActiveRoleState('member');
      navigate('/app');
    } else {
      repo.setActiveRole('admin');
      setActiveRoleState('admin');
      navigate('/admin');
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleSwitch}
        title={isAdminArea ? t('common:switchToMember') : t('common:switchToAdmin')}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
      >
        <ArrowLeftRight className="w-3.5 h-3.5" />
        <span>{isAdminArea ? 'Member View' : 'Admin View'}</span>
      </button>
    );
  }

  return (
    <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {isAdminArea ? (
          <ShieldAlert className="w-5 h-5 text-blue-700" />
        ) : (
          <UserCheck className="w-5 h-5 text-blue-700" />
        )}
        <div className="text-left">
          <p className="text-xs font-bold text-navy-900">
            {isAdminArea ? t('common:roleAdmin') : t('common:roleMember')}
          </p>
          <p className="text-[10px] text-slate-600">Dual Access Enabled</p>
        </div>
      </div>
      <button
        onClick={handleSwitch}
        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm"
      >
        <ArrowLeftRight className="w-3.5 h-3.5" />
        {isAdminArea ? t('common:switchToMember') : t('common:switchToAdmin')}
      </button>
    </div>
  );
};
