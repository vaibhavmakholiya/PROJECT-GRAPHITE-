import {
  Member,
  Transaction,
  Receipt,
  Loan,
  LoanRequest,
  GroupSettings,
  MemberBalance,
  EligibilityResult,
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

export type SyncState = 'synced' | 'syncing' | 'offline' | 'waiting';

export interface RegisterMemberParams {
  name: string;
  phone: string;
  dob: string;
  address: string;
  aadhaarLast4: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  age?: number | null;
}

export interface ISanchayRepository {
  // Session & Member
  getCurrentMember(): Promise<Member | null>;
  setMemberStatus(status: Member['status']): Promise<void>;
  loginWithPhone(phone: string, otp: string): Promise<Member>;
  registerMember(params: RegisterMemberParams): Promise<Member>;
  logout(): Promise<void>;

  // Group
  getGroupSettings(): Promise<GroupSettings>;

  // Ledger & Balances
  getTransactions(memberId?: string): Promise<Transaction[]>;
  getMemberBalance(memberId: string): Promise<MemberBalance>;

  // Receipts
  getReceipts(memberId: string): Promise<Receipt[]>;
  getReceiptById(receiptId: string): Promise<Receipt | null>;

  // Loans
  getActiveLoan(memberId: string): Promise<Loan | null>;
  getLoanSchedule(loanId: string): Promise<any[]>;
  getPendingLoanRequest(memberId: string): Promise<LoanRequest | null>;
  checkLoanEligibility(memberId: string): Promise<EligibilityResult>;
  submitLoanRequest(data: {
    memberId: string;
    amountPaise: number;
    installments: number;
  }): Promise<LoanRequest>;

  // Alerts
  getAnnouncements(): Promise<Announcement[]>;
  getNotifications(memberId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;

  // Sync state
  getSyncState(): SyncState;
  getPendingSyncCount(): number;
  setSyncState(state: SyncState, queueCount?: number): void;
}
