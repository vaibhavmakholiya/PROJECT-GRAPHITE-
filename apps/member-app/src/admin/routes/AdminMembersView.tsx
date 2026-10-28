import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  UserCheck,
  UserX,
  Check,
  Trash2,
  Clock,
  ShieldCheck,
  Search,
  AlertCircle,
} from 'lucide-react';
import { getRepository } from '../../shared/data';
import { Member } from '@sanchay/core';
import { formatDate } from '../../shared/utils/date';

export const AdminMembersView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const repo = getRepository();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') === 'pending' ? 'pending' : 'active';
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>(initialTab);
  const [activeMembers, setActiveMembers] = useState<Member[]>([]);
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Sync tab with URL search parameter if changed externally
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'pending' || tabParam === 'active') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Detail Modal State
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<Member | null>(null);
  const [memberBalance, setMemberBalance] = useState<any>(null);
  const [memberActiveLoan, setMemberActiveLoan] = useState<any>(null);
  const [memberTransactions, setMemberTransactions] = useState<any[]>([]);

  const handleSelectMember = async (member: Member) => {
    setSelectedMemberDetail(member);
    try {
      const [bal, loan, txs] = await Promise.all([
        repo.getMemberBalance(member.memberId),
        repo.getActiveLoan(member.memberId),
        repo.getTransactions(member.memberId),
      ]);
      setMemberBalance(bal);
      setMemberActiveLoan(loan);
      setMemberTransactions(txs);
    } catch (err) {
      console.warn('Error loading member detail:', err);
    }
  };

  const loadMembers = async () => {
    try {
      const [members, pending] = await Promise.all([
        repo.getGroupMembers(),
        repo.getPendingMembers(),
      ]);
      setActiveMembers(members);
      setPendingMembers(pending);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    const interval = setInterval(loadMembers, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (memberId: string, name: string) => {
    await repo.approveMember(memberId);
    setActionSuccess(`Member ${name} approved successfully!`);
    loadMembers();
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (confirm(`Are you sure you want to remove member ${name}?`)) {
      await repo.removeMember(memberId);
      setActionSuccess(`Member ${name} removed.`);
      loadMembers();
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const filteredActive = activeMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search) ||
      m.aadhaarLast4.includes(search)
  );

  const filteredPending = pendingMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search) ||
      m.aadhaarLast4.includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-navy-900 tracking-tight">
            {t('admin:members.title')}
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Manage registrations, membership status, and committee approvals
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member or Aadhaar..."
            className="pl-9 pr-3 py-2 rounded-xl border border-blue-200 bg-white text-xs text-navy-900 placeholder:text-slate-400 outline-none focus:border-blue-600 w-full sm:w-64"
          />
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-2xl bg-status-success-bg border border-status-success-border text-status-success text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Pending Member Registration Request Alert */}
      {pendingMembers.length > 0 && activeTab === 'active' && (
        <div
          onClick={() => {
            setActiveTab('pending');
            setSearchParams({ tab: 'pending' });
          }}
          className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium flex items-center justify-between cursor-pointer hover:bg-amber-100/90 transition shadow-xs animate-fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center font-bold shrink-0">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-amber-950">
                {pendingMembers.length} New Member Registration {pendingMembers.length === 1 ? 'Request' : 'Requests'} Generated
              </span>
              <p className="text-[11px] text-amber-700">
                Aadhaar OCR verified applicant{pendingMembers.length > 1 ? 's' : ''} awaiting committee review and approval
              </p>
            </div>
          </div>
          <span className="font-bold text-amber-800 text-[11px] hover:underline shrink-0">
            Review Requests →
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-blue-200 pb-2">
        <button
          onClick={() => {
            setActiveTab('active');
            setSearchParams({});
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'active'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-navy-900 hover:bg-blue-100/60'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{t('admin:members.activeTab', { count: activeMembers.length })}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('pending');
            setSearchParams({ tab: 'pending' });
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-navy-900 hover:bg-blue-100/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approval</span>
          {pendingMembers.length > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-navy-900 animate-pulse">
              {pendingMembers.length}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-normal">(0)</span>
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'active' ? (
        <div className="bg-white rounded-3xl border border-blue-200 p-4 sm:p-6 shadow-subtle">
          <div className="divide-y divide-blue-100">
            {filteredActive.map((member) => (
              <div
                key={member.memberId}
                onClick={() => handleSelectMember(member)}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-blue-50/70 px-3 rounded-2xl transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-navy-900 text-sm font-semibold">{member.name}</b>
                      {member.role === 'admin' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                          Group Leader
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Phone: {member.phone} • Aadhaar: XXXX-XXXX-{member.aadhaarLast4}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Joined: {formatDate(member.createdAt)}
                  </span>
                  <span className="text-[11px] font-bold text-blue-600 group-hover:underline">
                    View Details →
                  </span>
                  {member.role !== 'admin' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(member.memberId, member.name);
                      }}
                      className="p-2 text-slate-400 hover:text-status-error hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-blue-200 p-4 sm:p-6 shadow-subtle">
          {filteredPending.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              <ShieldCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p>{t('admin:members.noPending')}</p>
            </div>
          ) : (
            <div className="divide-y divide-blue-100">
              {filteredPending.map((member) => (
                <div
                  key={member.memberId}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-blue-50/40 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <b className="text-navy-900 text-sm font-semibold">{member.name}</b>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Phone: {member.phone} • Aadhaar: XXXX-XXXX-{member.aadhaarLast4}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Address: {member.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(member.memberId, member.name)}
                      className="px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('admin:members.approve')}</span>
                    </button>
                    <button
                      onClick={() => handleRemove(member.memberId, member.name)}
                      className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs transition cursor-pointer"
                    >
                      {t('admin:members.remove')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Member Detail Slide-over / Modal */}
      {selectedMemberDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-modal border border-blue-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading font-extrabold text-base text-navy-900">
                  {selectedMemberDetail.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Member ID: {selectedMemberDetail.memberId} • Phone: {selectedMemberDetail.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedMemberDetail(null)}
                className="p-1.5 text-slate-400 hover:text-navy-900 rounded-xl hover:bg-blue-50 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-2xl">
                <span className="text-[11px] text-slate-500 font-medium">Net Savings</span>
                <p className="text-sm font-bold text-navy-900 mt-0.5">
                  ₹{memberBalance ? (memberBalance.netSavingsPaise / 100).toLocaleString('en-IN') : '0'}
                </p>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-2xl">
                <span className="text-[11px] text-slate-500 font-medium">Active Loan</span>
                <p className="text-sm font-bold text-navy-900 mt-0.5">
                  {memberActiveLoan ? `₹${(memberActiveLoan.principal / 100).toLocaleString('en-IN')}` : 'None'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-blue-100">
              <h4 className="font-heading font-bold text-xs text-navy-900 mb-2">
                Recent Passbook Entries ({memberTransactions.length})
              </h4>
              {memberTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No transactions recorded yet</p>
              ) : (
                <div className="divide-y divide-blue-50 max-h-48 overflow-y-auto pr-1">
                  {memberTransactions.slice(0, 5).map((tx) => (
                    <div key={tx.txId} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-navy-900 capitalize">
                          {tx.type.replace('_', ' ')}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {new Date(tx.clientTimestamp).toLocaleDateString('en-IN')} • {tx.mode.toUpperCase()}
                        </p>
                      </div>
                      <span className="font-bold text-navy-900">
                        ₹{(tx.amountPaise / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedMemberDetail(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMembersView;
