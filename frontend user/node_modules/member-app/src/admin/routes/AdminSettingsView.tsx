import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Copy,
  Check,
  Share2,
  Save,
  CheckCircle2,
  Shield,
  KeyRound,
} from 'lucide-react';
import { getRepository } from '../../shared/data';
import { GroupSettings } from '@sanchay/core';
import { rupeesToPaise, paiseToRupees } from '../../shared/utils/currency';

export const AdminSettingsView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const repo = getRepository();

  const [groupCode, setGroupCode] = useState('PRAG');
  const [groupId, setGroupId] = useState('group-pragati-001');
  const [monthlyContributionRupees, setMonthlyContributionRupees] = useState('500');
  const [interestRate, setInterestRate] = useState('12');
  const [interestMethod, setInterestMethod] = useState<'reducing' | 'flat'>('reducing');
  const [dueDay, setDueDay] = useState('5');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    repo.getGroupCode().then((res) => {
      setGroupCode(res.groupCode);
      setGroupId(res.groupId);
    });

    repo.getGroupSettings().then((settings) => {
      setMonthlyContributionRupees(String(paiseToRupees(settings.monthlyContributionPaise)));
      setInterestRate(String(settings.interestRatePercent));
      setInterestMethod(settings.interestMethod);
      setDueDay(String(settings.dueDayOfMonth));
    });
  }, [repo]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(groupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareCode = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Pragati Mahila Bachat Gat on Sanchay',
        text: `Use our group join code ${groupCode} during Sanchay registration to join our circle.`,
      }).catch(() => {});
    } else {
      handleCopyCode();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await repo.updateGroupSettings({
        monthlyContributionPaise: rupeesToPaise(Number(monthlyContributionRupees)),
        interestRatePercent: Number(interestRate),
        interestMethod,
        dueDayOfMonth: Number(dueDay),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-navy-900 tracking-tight">
          {t('admin:settings.title')}
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          Configure group parameters, join code, and monthly loan rules
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-status-success-bg border border-status-success-border text-status-success text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Group settings updated successfully!</span>
        </div>
      )}

      {/* Group Join Code Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
            {t('admin:settings.groupCode')}
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono">
            {groupId}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-white">
              {groupCode}
            </div>
            <p className="text-xs text-blue-100 mt-1">
              Give this code to new members to enter during registration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleShareCode}
              className="p-2.5 rounded-xl bg-white/20 text-white hover:bg-white/30 transition"
              title="Share Join Code"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl border border-blue-200 p-6 shadow-subtle space-y-5 text-xs"
      >
        <h3 className="font-heading font-bold text-sm text-navy-900 border-b border-blue-100 pb-2">
          Financial & Governance Parameters
        </h3>

        {/* Monthly Contribution */}
        <div>
          <label className="block font-semibold text-navy-900 mb-1.5">
            {t('admin:settings.monthlyContribution')} (₹)
          </label>
          <input
            type="number"
            min="50"
            step="10"
            value={monthlyContributionRupees}
            onChange={(e) => setMonthlyContributionRupees(e.target.value)}
            className="w-full sm:w-60 py-2.5 px-3 rounded-xl border border-blue-200 text-navy-900 font-bold text-sm focus:border-blue-600 outline-none"
            required
          />
        </div>

        {/* Interest Rate & Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-navy-900 mb-1.5">
              {t('admin:settings.interestRate')}
            </label>
            <input
              type="number"
              min="1"
              max="36"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-blue-200 text-navy-900 font-bold text-sm focus:border-blue-600 outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1.5">
              {t('admin:settings.interestMethod')}
            </label>
            <select
              value={interestMethod}
              onChange={(e) => setInterestMethod(e.target.value as any)}
              className="w-full py-2.5 px-3 rounded-xl border border-blue-200 text-navy-900 font-medium focus:border-blue-600 outline-none"
            >
              <option value="reducing">Reducing Balance (Standard)</option>
              <option value="flat">Flat Interest</option>
            </select>
          </div>
        </div>

        {/* Due Day */}
        <div>
          <label className="block font-semibold text-navy-900 mb-1.5">
            {t('admin:settings.dueDay')}
          </label>
          <input
            type="number"
            min="1"
            max="28"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            className="w-full sm:w-40 py-2.5 px-3 rounded-xl border border-blue-200 text-navy-900 font-bold focus:border-blue-600 outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary flex items-center justify-center gap-2 pt-2"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </form>
    </div>
  );
};

export default AdminSettingsView;
