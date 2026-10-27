import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserCheck, Users, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Reveal } from '../common/Reveal';

export const RoleTabsSection: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'admins' | 'members'>('admins');

  const adminFeatures = [
    { title: 'Record Monthly Collections', desc: 'Log cash deposits for every member during the village meeting in seconds.' },
    { title: 'Approve or Reject Loan Requests', desc: 'Evaluate member eligibility against savings balance limits before group disbursement.' },
    { title: 'Announce Meeting Dates & Agendas', desc: 'Broadcast village notices and payment reminders to all member devices.' },
    { title: 'Resolve Ledger Differences Transparently', desc: 'Review entries made on multiple phones without any silent database deletions.' },
  ];

  const memberFeatures = [
    { title: 'Always-Accessible Personal Passbook', desc: 'Inspect your full savings history and total group balance anytime, anywhere.' },
    { title: 'Download Official PDF Receipts', desc: 'Generate and save official proof of payment directly on your phone with zero fees.' },
    { title: 'Transparent Loan EMI Schedule', desc: 'View monthly principal, reducing interest, and exact remaining installment dates.' },
    { title: 'Instant Loan Application', desc: 'Submit borrowing requests based on guaranteed group multiples (up to 3x savings).' },
  ];

  const currentList = activeTab === 'admins' ? adminFeatures : memberFeatures;

  return (
    <section className="py-16 sm:py-24 bg-white border-y border-blue-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-12">
          <Reveal>
            <span className="text-xs uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shadow-subtle">
              Designed for the Whole Circle
            </span>
          </Reveal>

          <Reveal delayMs={100}>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-navy-900 tracking-tight">
              Built for Leaders and Every Member Alike
            </h2>
          </Reveal>

          <Reveal delayMs={180}>
            <p className="text-base text-slate-600 leading-relaxed font-medium">
              A balanced digital tool where leaders manage meetings transparently and members maintain complete autonomy over their savings.
            </p>
          </Reveal>
        </div>

        {/* Tab Toggle Switch */}
        <div className="flex justify-center mb-10">
          <div className="p-1.5 rounded-2xl bg-blue-50 border border-blue-200 inline-flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('admins')}
              className={`flex items-center gap-2 py-2.5 px-6 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'admins'
                  ? 'bg-blue-600 text-white shadow-subtle'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>For Admins & Leaders</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 py-2.5 px-6 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'members'
                  ? 'bg-blue-600 text-white shadow-subtle'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>For General Members</span>
            </button>
          </div>
        </div>

        {/* Tab Content Cross-Fade Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {currentList.map((item, idx) => (
            <div
              key={item.title}
              className="p-6 rounded-3xl bg-blue-50 border border-blue-200 hover:border-blue-300 transition-all duration-200 shadow-subtle animate-fade-in flex items-start gap-4"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-base text-navy-900">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Launch Portal CTA */}
        <div className="mt-10 text-center">
          {activeTab === 'admins' ? (
            <Link
              to="/login?role=admin"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-navy-900 hover:bg-navy-800 text-white font-heading font-bold text-sm shadow-card hover:shadow-elevated transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-blue-300" />
              <span>Launch Admin Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/login?role=member"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-sm shadow-card hover:shadow-elevated transition-all"
            >
              <span>Open Member Passbook</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};
