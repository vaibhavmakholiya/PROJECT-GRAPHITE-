import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, CheckCircle2, ShieldCheck, RefreshCw, LogOut } from 'lucide-react';
import { onSnapshot, doc, collection, query, where, Unsubscribe } from 'firebase/firestore';
import { getRepository } from '../shared/data';
import { db, auth } from '../shared/firebase/firebase';
import logo from '../assets/sanchay-logo.png';

export const PendingView: React.FC = () => {
  const { t } = useTranslation(['public', 'common']);
  const navigate = useNavigate();
  const repo = getRepository();

  const [checking, setChecking] = useState(false);
  const [member, setMember] = useState<any>(null);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const current = await repo.getCurrentMember();
      setMember(current);
      if (current && current.status === 'active') {
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
        }
        navigate('/app', { replace: true });
      }
    } catch (err) {
      console.error('Error checking status:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();

    let unsubscribeSnapshot: Unsubscribe | null = null;

    // Realtime Firestore listener if running in Firebase mode
    if (import.meta.env.VITE_DATA === 'firebase' && auth.currentUser) {
      const user = auth.currentUser;
      const groupId = localStorage.getItem('sanchay_group_id') || 'group-pragati-001';

      try {
        // Query own member document by authUid
        const membersQuery = query(
          collection(db, 'groups', groupId, 'members'),
          where('authUid', '==', user.uid)
        );

        unsubscribeSnapshot = onSnapshot(membersQuery, async (snapshot) => {
          if (!snapshot.empty) {
            const memberDoc = snapshot.docs[0];
            const data = memberDoc.data();
            setMember({ memberId: memberDoc.id, ...data });

            if (data.status === 'active') {
              console.info('[PendingView] Approval detected! Refreshing custom claims...');
              await user.getIdToken(true);
              navigate('/app', { replace: true });
            }
          }
        });
      } catch (err) {
        console.warn('[PendingView] Firestore listener fallback to polling:', err);
      }
    }

    // Polling fallback every 3 seconds
    const interval = setInterval(checkStatus, 3000);

    return () => {
      clearInterval(interval);
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [navigate]);

  const simulateApproval = async () => {
    await repo.setMemberStatus('active');
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    }
    navigate('/app', { replace: true });
  };

  const handleLogout = async () => {
    await repo.logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-md w-full mx-auto my-auto bg-white rounded-2xl shadow-card border border-blue-200 p-6 sm:p-8 text-center animate-fade-in">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <img
              src={logo}
              alt="Sanchay"
              className="w-16 h-16 rounded-2xl p-1 bg-blue-50 border border-blue-200"
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full border-2 border-white">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-navy-900 mb-2">
          {t('public:pending.title')}
        </h1>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-amber-bg text-status-amber border border-status-amber-border text-xs font-bold mb-4">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          <span>{t('public:pending.status')}</span>
        </div>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {t('public:pending.description')}
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mb-6 space-y-2">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-navy-900 font-medium">
              {t('public:pending.contactLeader')}
            </p>
          </div>
          {member && (
            <div className="text-[11px] text-slate-600 pt-2 border-t border-blue-200/60 flex justify-between">
              <span>Member ID: {member.memberId}</span>
              <span>Aadhaar: XXXX-XXXX-{member.aadhaarLast4 || 'XXXX'}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={checkStatus}
            disabled={checking}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{t('public:pending.refresh')}</span>
          </button>

          {/* Quick simulation helper for emulator/mock testing */}
          <button
            onClick={simulateApproval}
            className="w-full py-2.5 px-4 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-bold hover:bg-green-100 transition flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simulate Admin Approval (Dev Helper)</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:text-navy-900 flex items-center justify-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('public:pending.backToLogin')}</span>
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 py-2">
        Sanchay Ledger • Offline-First Self-Help Group Technology
      </div>
    </div>
  );
};

export default PendingView;
