import {
  Member,
  Transaction,
  Receipt,
  Loan,
  LoanRequest,
  GroupSettings,
  MemberBalance,
  EligibilityResult,
  computeMemberBalance,
  isEligibleForLoan,
  generateSchedule,
} from '@sanchay/core';
import {
  ISanchayRepository,
  Announcement,
  Notification,
  SyncState,
  RegisterMemberParams,
} from './repository';
import {
  MOCK_LOGGED_IN_MEMBER,
  MOCK_GROUP_SETTINGS,
  MOCK_TRANSACTIONS,
  MOCK_ACTIVE_LOAN,
  MOCK_LOAN_SCHEDULE,
  MOCK_RECEIPTS,
  MOCK_PENDING_LOAN_REQUEST,
  MOCK_ANNOUNCEMENTS,
  MOCK_NOTIFICATIONS,
  MOCK_GROUP_ID,
} from './mockData';

class MockSanchayRepository implements ISanchayRepository {
  private member: Member = { ...MOCK_LOGGED_IN_MEMBER };
  private transactions: Transaction[] = [...MOCK_TRANSACTIONS];
  private receipts: Receipt[] = [...MOCK_RECEIPTS];
  private activeLoan: Loan | null = { ...MOCK_ACTIVE_LOAN };
  private pendingRequest: LoanRequest | null = { ...MOCK_PENDING_LOAN_REQUEST };
  private announcements: Announcement[] = [...MOCK_ANNOUNCEMENTS];
  private notifications: Notification[] = [...MOCK_NOTIFICATIONS];
  private syncState: SyncState = 'synced';
  private pendingQueueCount = 0;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    const savedStatus = localStorage.getItem('sanchay_dev_member_status');
    if (savedStatus) {
      this.member.status = savedStatus as Member['status'];
    }
    const savedSync = localStorage.getItem('sanchay_dev_sync_state');
    if (savedSync) {
      this.syncState = savedSync as SyncState;
    }
    const savedQueue = localStorage.getItem('sanchay_dev_queue_count');
    if (savedQueue) {
      this.pendingQueueCount = parseInt(savedQueue, 10);
    }
  }

  // --- Session & Member ---
  async getCurrentMember(): Promise<Member | null> {
    if (typeof localStorage !== 'undefined') {
      const isLoggedOut = localStorage.getItem('sanchay_logged_out') === 'true';
      if (isLoggedOut) return null;
    }
    return { ...this.member };
  }

  async setMemberStatus(status: Member['status']): Promise<void> {
    this.member.status = status;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sanchay_dev_member_status', status);
    }
  }

  async loginWithPhone(phone: string, otp: string): Promise<Member> {
    // Mock OTP verification (123456 or any 6 digits)
    if (otp !== '123456' && otp.length !== 6) {
      throw new Error('Invalid OTP code. Please use test code 123456.');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('sanchay_logged_out');
    }
    this.member.phone = phone.startsWith('+91') ? phone : `+91${phone}`;
    return { ...this.member };
  }

  async registerMember(params: RegisterMemberParams): Promise<Member> {
    // Check for simulated duplicate condition (e.g. phone ending in 9999 or last4 == '0000')
    if (params.phone.endsWith('9999')) {
      throw new Error('This phone number is already registered with another member.');
    }
    if (params.aadhaarLast4 === '0000') {
      throw new Error('Member with this Aadhaar is already registered in Pragati Bachat Gat.');
    }

    const newMemberId = `mem-${Date.now().toString(36)}`;
    const newMember: Member = {
      memberId: newMemberId,
      groupId: MOCK_GROUP_ID,
      name: params.name,
      phone: params.phone.startsWith('+91') ? params.phone : `+91${params.phone}`,
      dob: params.dob,
      address: params.address,
      aadhaarHash: `sha256_mock_hash_${params.aadhaarLast4}`,
      aadhaarLast4: params.aadhaarLast4,
      status: 'pending',
      role: 'member',
      createdAt: new Date().toISOString(),
      deviceId: 'dev-browser-client',
    };

    this.member = newMember;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sanchay_dev_member_status', 'pending');
      localStorage.removeItem('sanchay_logged_out');
    }

    return { ...this.member };
  }

  async logout(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sanchay_logged_out', 'true');
    }
  }

  // --- Group Settings ---
  async getGroupSettings(): Promise<GroupSettings> {
    return { ...MOCK_GROUP_SETTINGS };
  }

  // --- Ledger & Balances ---
  async getTransactions(memberId?: string): Promise<Transaction[]> {
    const targetId = memberId || this.member.memberId;
    return this.transactions.filter((t) => t.memberId === targetId);
  }

  async getMemberBalance(memberId: string): Promise<MemberBalance> {
    // Pure computation from active ledger transactions (Rule 2: Never store balances)
    return computeMemberBalance(memberId, this.transactions);
  }

  // --- Receipts ---
  async getReceipts(memberId: string): Promise<Receipt[]> {
    return this.receipts.filter((r) => r.memberId === memberId);
  }

  async getReceiptById(receiptId: string): Promise<Receipt | null> {
    const rcpt = this.receipts.find((r) => r.receiptId === receiptId);
    return rcpt ? { ...rcpt } : null;
  }

  // --- Loans ---
  async getActiveLoan(memberId: string): Promise<Loan | null> {
    if (this.activeLoan && this.activeLoan.memberId === memberId && this.activeLoan.status === 'active') {
      return { ...this.activeLoan };
    }
    return null;
  }

  async getLoanSchedule(loanId: string): Promise<any[]> {
    if (this.activeLoan && this.activeLoan.loanId === loanId) {
      return [...MOCK_LOAN_SCHEDULE];
    }
    return [];
  }

  async getPendingLoanRequest(memberId: string): Promise<LoanRequest | null> {
    if (this.pendingRequest && this.pendingRequest.memberId === memberId) {
      return { ...this.pendingRequest };
    }
    return null;
  }

  async checkLoanEligibility(memberId: string): Promise<EligibilityResult> {
    const loans = this.activeLoan ? [this.activeLoan] : [];
    return isEligibleForLoan(
      this.member,
      this.transactions,
      loans,
      MOCK_GROUP_SETTINGS,
      new Date('2026-10-27')
    );
  }

  async submitLoanRequest(data: {
    memberId: string;
    amountPaise: number;
    installments: number;
  }): Promise<LoanRequest> {
    const newReq: LoanRequest = {
      id: `req-${Date.now()}`,
      groupId: MOCK_GROUP_ID,
      memberId: data.memberId,
      amountPaise: data.amountPaise,
      installments: data.installments,
      createdAt: Date.now(),
      status: 'pending',
    };
    this.pendingRequest = newReq;
    return { ...newReq };
  }

  // --- Alerts ---
  async getAnnouncements(): Promise<Announcement[]> {
    return [...this.announcements];
  }

  async getNotifications(memberId: string): Promise<Notification[]> {
    return this.notifications.filter((n) => n.memberId === memberId);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
  }

  // --- Sync State ---
  getSyncState(): SyncState {
    return this.syncState;
  }

  getPendingSyncCount(): number {
    return this.pendingQueueCount;
  }

  setSyncState(state: SyncState, queueCount = 0): void {
    this.syncState = state;
    this.pendingQueueCount = queueCount;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sanchay_dev_sync_state', state);
      localStorage.setItem('sanchay_dev_queue_count', String(queueCount));
    }
  }
}

export const mockRepository = new MockSanchayRepository();
