import {
  Member,
  Transaction,
  Receipt,
  Loan,
  LoanRequest,
  GroupSettings,
  MemberBalance,
  EligibilityResult,
  GroupBalanceSummary,
  Conflict,
  TransactionType,
  PaymentMode,
  MemberStatus,
  UserRole,
} from '@sanchay/core';

export interface Announcement {
  id: string;
  groupId: string;
  title: string;
  body: string;
  createdBy: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  memberId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
  refId?: string;
  type?: 'receipt' | 'loan_due' | 'loan_status' | 'general';
}

export type SyncState = 'synced' | 'syncing' | 'offline' | 'waiting' | 'needs_review';

export interface RegisterMemberParams {
  name: string;
  phone: string;
  dob: string;
  address: string;
  aadhaarLast4: string;
  aadhaarNumber?: string;
  groupCode?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  age?: number | null;
}

export interface UserClaims {
  role?: 'admin' | 'member';
  roles?: ('admin' | 'member')[];
  status?: MemberStatus;
  groupId?: string;
  memberId?: string;
  authUid?: string;
}

export interface ISanchayRepository {
  // Session & Authentication
  getCurrentMember(): Promise<Member | null>;
  getUserClaims(): Promise<UserClaims>;
  sendPhoneOtp(phone: string): Promise<void>;
  loginWithPhone(phone: string, otp: string, preferredRole?: 'admin' | 'member'): Promise<Member>;
  registerMember(params: RegisterMemberParams): Promise<Member>;
  logout(): Promise<void>;
  setMemberStatus(status: MemberStatus): Promise<void>;

  // Multi-Role Support
  getActiveRole(): 'admin' | 'member';
  setActiveRole(role: 'admin' | 'member'): void;
  canSwitchRole(): Promise<boolean>;

  // Group Settings & Information
  getGroupSettings(): Promise<GroupSettings>;
  getGroupCode(): Promise<{ groupCode: string; groupId: string }>;
  updateGroupSettings(settings: Partial<GroupSettings>): Promise<void>;

  // Member Domain Methods
  getTransactions(memberId?: string): Promise<Transaction[]>;
  getMemberBalance(memberId: string): Promise<MemberBalance>;
  getReceipts(memberId: string): Promise<Receipt[]>;
  getReceiptById(receiptId: string): Promise<Receipt | null>;
  getActiveLoan(memberId: string): Promise<Loan | null>;
  getLoanSchedule(loanId: string): Promise<any[]>;
  getPendingLoanRequest(memberId: string): Promise<LoanRequest | null>;
  checkLoanEligibility(memberId: string): Promise<EligibilityResult>;
  submitLoanRequest(data: {
    memberId: string;
    amountPaise: number;
    installments: number;
  }): Promise<LoanRequest>;

  // Alerts & Notifications
  getAnnouncements(): Promise<Announcement[]>;
  getNotifications(memberId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;

  // Admin Domain Methods
  getGroupMembers(): Promise<Member[]>;
  getPendingMembers(): Promise<Member[]>;
  approveMember(memberId: string): Promise<void>;
  removeMember(memberId: string): Promise<void>;
  getGroupSummary(): Promise<GroupBalanceSummary>;
  getAllTransactions(): Promise<Transaction[]>;
  recordTransactionWithReceipt(params: {
    memberId: string;
    type: TransactionType;
    amountPaise: number;
    mode: PaymentMode;
    aadhaarLast4?: string;
    reason?: string;
  }): Promise<{ transaction: Transaction; receipt: Receipt }>;
  recordReversalAndCorrection(
    reversesTxId: string,
    reason: string,
    correctedData?: { amountPaise: number; type: TransactionType; mode: PaymentMode }
  ): Promise<{ reversal: Transaction; corrected?: Transaction; receipt?: Receipt }>;
  getAllLoanRequests(): Promise<LoanRequest[]>;
  decideLoan(requestId: string, decision: 'approved' | 'rejected', reason?: string): Promise<void>;
  createAnnouncement(title: string, body: string): Promise<Announcement>;
  getConflicts(): Promise<Conflict[]>;
  resolveConflict(conflictId: string, resolution: string): Promise<void>;

  // Sync Diagnostics & State
  getSyncState(): SyncState;
  getPendingSyncCount(): number;
  setSyncState(state: SyncState, queueCount?: number): void;
}
