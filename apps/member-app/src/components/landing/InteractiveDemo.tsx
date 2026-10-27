import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  WifiOff,
  Wifi,
  PlusCircle,
  RefreshCw,
  GitMerge,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Reveal } from '../common/Reveal';

interface DemoEntry {
  id: string;
  name: string;
  amount: number;
  type: 'deposit' | 'reversal';
  status: 'synced' | 'waiting' | 'conflict';
  sourcePhone?: string;
  timestamp: string;
}

const INITIAL_ENTRIES: DemoEntry[] = [
  { id: 'tx-01', name: 'Sunita Sharma', amount: 500, type: 'deposit', status: 'synced', timestamp: '10:00 AM' },
  { id: 'tx-02', name: 'Kavita Devi', amount: 500, type: 'deposit', status: 'synced', timestamp: '10:05 AM' },
  { id: 'tx-03', name: 'Meena Kumari', amount: 500, type: 'deposit', status: 'synced', timestamp: '10:10 AM' },
];

export const InteractiveDemo: React.FC = () => {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(false);
  const [entries, setEntries] = useState<DemoEntry[]>(INITIAL_ENTRIES);
  const [conflictActive, setConflictActive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Calculate ledger balance from active deposits minus reversals
  const totalBalance = entries.reduce((acc, curr) => {
    return curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount;
  }, 0);

  const waitingCount = entries.filter((e) => e.status === 'waiting').length;

  // Action: Add ₹500 Deposit
  const handleAddDeposit = () => {
    const newEntry: DemoEntry = {
      id: `tx-${Date.now().toString(36)}`,
      name: 'Aarti Deshmukh',
      amount: 500,
      type: 'deposit',
      status: isOffline ? 'waiting' : 'synced',
      sourcePhone: 'Leader Phone #1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setEntries((prev) => [newEntry, ...prev]);
  };

  // Action: Reconnect & Sync
  const handleReconnect = () => {
    setIsOffline(false);
    setIsSyncing(true);
    setTimeout(() => {
      setEntries((prev) =>
        prev.map((e) => (e.status === 'waiting' ? { ...e, status: 'synced' } : e))
      );
      setIsSyncing(false);
    }, 900);
  };

  // Action: Two phones, same deposit conflict
  const handleCreateConflict = () => {
    setIsOffline(true);
    setConflictActive(true);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const phone1Entry: DemoEntry = {
      id: `conf-1-${Date.now()}`,
      name: 'Pooja Patil',
      amount: 500,
      type: 'deposit',
      status: 'waiting',
      sourcePhone: 'Phone A (President)',
      timestamp: time,
    };
    const phone2Entry: DemoEntry = {
      id: `conf-2-${Date.now()}`,
      name: 'Pooja Patil',
      amount: 500,
      type: 'deposit',
      status: 'waiting',
      sourcePhone: 'Phone B (Secretary)',
      timestamp: time,
    };
    setEntries((prev) => [phone1Entry, phone2Entry, ...prev]);
  };

  // Resolve conflict: Mark duplicate via explicit reversal entry (Rule 3)
  const handleResolveDuplicate = () => {
    const reversalEntry: DemoEntry = {
      id: `rev-${Date.now()}`,
      name: 'Pooja Patil (Duplicate Reversal)',
      amount: 500,
      type: 'reversal',
      status: isOffline ? 'waiting' : 'synced',
      sourcePhone: 'Meeting Decision',
      timestamp: 'Meeting Agreed',
    };
    setEntries((prev) => [reversalEntry, ...prev]);
    setConflictActive(false);
  };

  const handleKeepBoth = () => {
    setConflictActive(false);
  };

  const handleReset = () => {
    setIsOffline(false);
    setEntries(INITIAL_ENTRIES);
    setConflictActive(false);
    setIsSyncing(false);
  };

  return (
    <section id="demo" className="py-16 sm:py-24 bg-white border-y border-blue-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
          <Reveal>
            <span className="text-xs uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shadow-subtle">
              Interactive Sandbox
            </span>
          </Reveal>

          <Reveal delayMs={100}>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-navy-900 tracking-tight">
              Try It Yourself: The Offline Ledger Demo
            </h2>
          </Reveal>

          <Reveal delayMs={180}>
            <p className="text-base text-slate-600 leading-relaxed font-medium">
              Click the controls below to experience how Sanchay seamlessly handles zero signal, queues deposits, and resolves conflicts transparently without overwriting.
            </p>
          </Reveal>
        </div>

        {/* Interactive Layout: Controls on Left, Live Mock Phone on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-blue-50 border border-blue-200 space-y-4 shadow-subtle">
              <h3 className="font-heading font-bold text-sm text-navy-900 uppercase tracking-wider">
                Simulate Conditions
              </h3>

              {/* 1. Offline/Online Toggle */}
              <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-blue-200">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-navy-900">
                  {isOffline ? (
                    <WifiOff className="w-4 h-4 text-status-amber" />
                  ) : (
                    <Wifi className="w-4 h-4 text-status-success" />
                  )}
                  <span>Network: {isOffline ? 'No Internet (Village)' : 'Connected (Signal OK)'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOffline(!isOffline)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isOffline
                      ? 'bg-status-amber-bg text-status-amber border border-status-amber-border'
                      : 'bg-status-success-bg text-status-success border border-status-success-border'
                  }`}
                >
                  {isOffline ? 'Go Online' : 'Go Offline'}
                </button>
              </div>

              {/* 2. Add ₹500 Deposit (Fix 1: min-h-[48px], blue-600 primary) */}
              <button
                type="button"
                onClick={handleAddDeposit}
                className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-subtle hover:shadow-card transition-all cursor-pointer focus:outline-none focus:ring-3 focus:ring-blue-300"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add ₹500 Deposit</span>
              </button>

              {/* 3. Reconnect & Sync (Fix 1: min-h-[48px]) */}
              <button
                type="button"
                disabled={!isOffline && waitingCount === 0}
                onClick={handleReconnect}
                className={`w-full min-h-[48px] py-3 px-4 rounded-2xl border font-heading font-bold text-xs flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-3 focus:ring-blue-300 ${
                  isOffline || waitingCount > 0
                    ? 'bg-white border-blue-200 text-blue-600 hover:bg-blue-100/50 cursor-pointer shadow-subtle'
                    : 'bg-blue-100/40 border-blue-200 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing Queue...' : 'Reconnect & Sync'}</span>
              </button>

              {/* 4. Conflict Button: Two phones, same deposit */}
              <button
                type="button"
                onClick={handleCreateConflict}
                className="w-full min-h-[48px] py-2.5 px-4 rounded-2xl bg-white border border-blue-200 hover:border-blue-300 text-navy-900 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-subtle hover:bg-blue-100/30"
              >
                <GitMerge className="w-4 h-4 text-status-amber" />
                <span>Simulate Conflict (2 Phones)</span>
              </button>

              {/* Reset Button */}
              <div className="pt-2 border-t border-blue-200 text-right">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-600 hover:text-navy-900 flex items-center gap-1.5 ml-auto cursor-pointer font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo</span>
                </button>
              </div>
            </div>

            {/* Explanation Note */}
            <div className="p-4 rounded-2xl bg-blue-100/60 border border-blue-200 text-xs text-navy-900 space-y-1.5">
              <p className="font-bold text-blue-600">Core Sanchay Invariant:</p>
              <p className="text-slate-600 leading-relaxed">
                Notice that when duplicates or errors happen, Sanchay <em>never deletes or overwrites</em> an entry. A visible <strong>reversal entry</strong> is appended so every rupee is accounted for.
              </p>
            </div>
          </div>

          {/* Live Mobile Frame Display */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-[380px] bg-white rounded-[36px] border-4 border-navy-900 p-4 shadow-elevated flex flex-col min-h-[500px]">
              {/* Phone Header */}
              <div className="flex items-center justify-between pb-3 border-b border-blue-200 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    S
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-xs text-navy-900 leading-tight">
                      Pragati Bachat Gat
                    </h4>
                    <span className="text-[10px] text-slate-600">Village Passbook</span>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    isOffline
                      ? 'bg-status-amber-bg text-status-amber border border-status-amber-border'
                      : 'bg-status-success-bg text-status-success border border-status-success-border'
                  }`}
                >
                  {isOffline ? (
                    <>
                      <WifiOff className="w-3 h-3" />
                      Offline ({waitingCount} waiting)
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Synced
                    </>
                  )}
                </span>
              </div>

              {/* Running Balance Banner */}
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 mb-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-600">Total Group Savings</span>
                  <p className="font-heading font-extrabold text-xl text-blue-600">
                    ₹{totalBalance.toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-blue-700 bg-white px-2 py-1 rounded-full border border-blue-200">
                  {entries.length} Active Entries
                </span>
              </div>

              {/* Conflict Alert Banner if active */}
              {conflictActive && (
                <div className="p-3 rounded-2xl bg-status-amber-bg border border-status-amber-border text-xs text-status-amber space-y-2 mb-3 animate-fade-in">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Difference detected between two leaders</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Pooja Patil recorded twice on separate phones. Choose action:
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleResolveDuplicate}
                      className="flex-1 min-h-[40px] py-1.5 px-2 rounded-xl bg-status-amber text-white font-bold text-[11px] hover:opacity-90 cursor-pointer shadow-subtle"
                    >
                      Mark Duplicate (Add Reversal)
                    </button>
                    <button
                      type="button"
                      onClick={handleKeepBoth}
                      className="min-h-[40px] py-1.5 px-2.5 rounded-xl bg-white border border-status-amber-border text-status-amber font-semibold text-[11px] hover:bg-status-amber-bg cursor-pointer"
                    >
                      Keep Both
                    </button>
                  </div>
                </div>
              )}

              {/* Ledger Entries List */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[260px] pr-1">
                {entries.map((entry) => {
                  const isReversal = entry.type === 'reversal';
                  return (
                    <div
                      key={entry.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                        isReversal
                          ? 'bg-status-error-bg border-status-error-border'
                          : entry.status === 'waiting'
                          ? 'bg-status-amber-bg border-status-amber-border'
                          : 'bg-white border-blue-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className={`font-semibold ${isReversal ? 'text-status-error line-through' : 'text-navy-900'}`}>
                          {entry.name}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-600">
                          <span>{entry.timestamp}</span>
                          {entry.sourcePhone && (
                            <span className="font-mono text-slate-500">· {entry.sourcePhone}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span
                          className={`font-mono font-bold ${
                            isReversal ? 'text-status-error' : 'text-blue-600'
                          }`}
                        >
                          {isReversal ? `-₹${entry.amount}` : `+₹${entry.amount}`}
                        </span>

                        <div>
                          {entry.status === 'waiting' ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-amber-bg text-status-amber border border-status-amber-border">
                              waiting sync
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-success-bg text-status-success border border-status-success-border">
                              synced
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
