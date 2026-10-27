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
  computeMemberBalance,
  computeBalance,
  isEligibleForLoan,
  generateSchedule,
  formatReceiptNo,
  maskAadhaar,
} from '@sanchay/core';
import {
  ISanchayRepository,
  Announcement,
  Notification,
  SyncState,
  RegisterMemberParams,
  UserClaims,
} from './repository';
import {
  MOCK_GROUP_SETTINGS,
  MOCK_TRANSACTIONS,
  MOCK_RECEIPTS,
  MOCK_LOANS,
  MOCK_LOAN_REQUESTS,
  MOCK_ANNOUNCEMENTS,
  MOCK_NOTIFICATIONS,
  MOCK_GROUP_MEMBERS,
  MOCK_CONFLICTS,
  MOCK_GROUP_ID,
  MOCK_GROUP_CODE,
} from './mockData';

class MockSanchayRepository implements ISanchayRepository {
  private member: Member = {
    memberId: 'mem-user-001',
    groupId: MOCK_GROUP_ID,
    authUid: 'auth-user-001',
    name: 'Real User',
    phone: '',
    dob: '1990-01-01',
    address: '',
    aadhaarHash: '',
    aadhaarLast4: 'XXXX',
    status: 'active',
    role: 'member',
    createdAt: new Date().toISOString(),
    deviceId: 'dev-browser-client',
  };
  private membersList: Member[] = [...MOCK_GROUP_MEMBERS];
  private pendingMembersList: Member[] = [];
  private transactions: Transaction[] = [...MOCK_TRANSACTIONS];
  private receipts: Receipt[] = [...MOCK_RECEIPTS];
  private activeLoan: Loan | null = null;
  private loanRequests: LoanRequest[] = [...MOCK_LOAN_REQUESTS];
  private announcements: Announcement[] = [...MOCK_ANNOUNCEMENTS];
  private notifications: Notification[] = [...MOCK_NOTIFICATIONS];
  private conflicts: Conflict[] = [...MOCK_CONFLICTS];
  private groupSettings: GroupSettings = { ...MOCK_GROUP_SETTINGS };
  private syncState: SyncState = 'synced';
  private pendingQueueCount = 0;
  private activeRole: 'admin' | 'member' = 'member';
  private hasBothRoles = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof localStorage === 'undefined') return;

    const savedRole = localStorage.getItem('sanchay_mock_active_role');
    if (savedRole === 'admin' || savedRole === 'member') {
      this.activeRole = savedRole;
      this.member.role = savedRole;
    }

    const savedBoth = localStorage.getItem('sanchay_mock_has_both');
    if (savedBoth === 'true') {
      this.hasBothRoles = true;
    }

    const savedStatus = localStorage.getItem('sanchay_dev_member_status');
    if (savedStatus) {
      this.member.status = savedStatus as MemberStatus;
    }

    const savedPhone = localStorage.getItem('sanchay_user_phone');
    if (savedPhone) {
      this.member.phone = savedPhone;
    }

    const savedName = localStorage.getItem('sanchay_user_name');
    if (savedName) {
      this.member.name = savedName;
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

  async getUserClaims(): Promise<UserClaims> {
    const isLoggedOut = typeof localStorage !== 'undefined' && localStorage.getItem('sanchay_logged_out') === 'true';
    if (isLoggedOut) {
      return {};
    }

    const roles: ('admin' | 'member')[] = this.hasBothRoles
      ? ['admin', 'member']
      : [this.member.role];

    return {
      role: this.activeRole,
      roles,
      status: this.member.status,
      groupId: this.member.groupId,
      memberId: this.member.memberId,
      authUid: this.member.authUid,
    };
  }

  async setMemberStatus(status: MemberStatus): Promise<void> {
    this.member.status = status;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sanchay_dev_member_status', status);
    }
  }

  async sendPhoneOtp(phone: string): Promise<void> {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      throw new Error('Please enter a valid 10-digit phone number.');
    }
  }

  async loginWithPhone(
    phone: string,
    otp: string,
    preferredRole?: 'admin' | 'member'
  ): Promise<Member> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('sanchay_logged_out');
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone.slice(-10)}`;
    const role = preferredRole || 'member';

    // Find existing user in member lists
    const existing = this.membersList.find((m) => m.phone.endsWith(cleanPhone.slice(-10)))
      || this.pendingMembersList.find((m) => m.phone.endsWith(cleanPhone.slice(-10)));

    if (existing) {
      this.member = { ...existing };
      this.activeRole = existing.role;
    } else {
      // First-time real user sign-in
      const newMember: Member = {
        memberId: `mem-${cleanPhone.slice(-10)}`,
        groupId: MOCK_GROUP_ID,
        authUid: `auth-${cleanPhone.slice(-10)}`,
        name: role === 'admin' ? 'SHG Leader' : 'Real Member',
        phone: formattedPhone,
        dob: '1990-01-01',
        address: '',
        aadhaarHash: '',
        aadhaarLast4: 'XXXX',
        status: 'active',
        role,
        createdAt: new Date().toISOString(),
        deviceId: 'dev-browser-client',
      };
      this.membersList.push(newMember);
      this.member = newMember;
      this.activeRole = role;
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sanchay_user_phone', formattedPhone);
      localStorage.setItem('sanchay_user_name', this.member.name);
      localStorage.setItem('sanchay_mock_active_role', this.activeRole);
    }

    return { ...this.member };
  }

  async registerMember(params: RegisterMemberParams): Promise<Member> {
    if (params.phone.endsWith('8888')) {
      throw new Error('This phone number is already registered with another member.');
    }
    if (params.aadhaarLast4 === '0000') {
      throw new Error('Member with this Aadhaar is already registered in Pragati Bachat Gat.');
    }

    const newMemberId = `mem-${Date.now().toString(36)}`;
    const newMember: Member = {
      memberId: newMemberId,
      groupId: MOCK_GROUP_ID,
      authUid: `auth-${newMemberId}`,
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

    this.pendingMembersList.push(newMember);
    this.member = newMember;
    this.activeRole = 'member';
    this.hasBothRoles = false;

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sanchay_dev_member_status', 'pending');
      localStorage.setItem('sanchay_mock_user_type', 'member');
      localStorage.setItem('sanchay_mock_active_role', 'member');
      localStorage.removeItem('sanchay_mock_has_both');
      localStorage.removeItem('sanchay_logged_out');
    }

    return { ...this.member };
  }

  async logout(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sanchay_logged_out', 'true');
      localStorage.removeItem('sanchay_mock_active_role');
      localStorage.removeItem('sanchay_mock_has_both');
    }
  }

  // --- Multi-Role Methods ---
  getActiveRole(): 'admin' | 'member' {
    return this.activeRole;
  }

  setActiveRole(role: 'admin' | 'member'): void {
    this.activeRole = role;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sanchay_mock_active_role', role);
    }
  }

  async canSwitchRole(): Promise<boolean> {
    return this.hasBothRoles;
  }

  // --- Group Settings ---
  async getGroupSettings(): Promise<GroupSettings> {
    return { ...this.groupSettings };
  }

  async getGroupCode(): Promise<{ groupCode: string; groupId: string }> {
    return {
      groupCode: MOCK_GROUP_CODE,
      groupId: MOCK_GROUP_ID,
    };
  }

  async updateGroupSettings(settings: Partial<GroupSettings>): Promise<void> {
    this.groupSettings = { ...this.groupSettings, ...settings };
  }

  // --- Member Ledger & Balances ---
  async getTransactions(memberId?: string): Promise<Transaction[]> {
    const targetId = memberId || this.member.memberId;
    return this.transactions.filter((t) => t.memberId === targetId);
  }

  async getMemberBalance(memberId: string): Promise<MemberBalance> {
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

  // --- Member Loans ---
  async getActiveLoan(memberId: string): Promise<Loan | null> {
    if (this.activeLoan && this.activeLoan.memberId === memberId && this.activeLoan.status === 'active') {
      return { ...this.activeLoan };
    }
    return null;
  }

  async getLoanSchedule(loanId: string): Promise<any[]> {
    if (this.activeLoan && this.activeLoan.loanId === loanId) {
      return generateSchedule(
        this.activeLoan.principal,
        this.activeLoan.rate,
        this.activeLoan.method,
        this.activeLoan.installments,
        this.activeLoan.startDate
      );
    }
    return [];
  }

  async getPendingLoanRequest(memberId: string): Promise<LoanRequest | null> {
    const found = this.loanRequests.find((r) => r.memberId === memberId && r.status === 'pending');
    return found ? { ...found } : null;
  }

  async checkLoanEligibility(memberId: string): Promise<EligibilityResult> {
    const loans = this.activeLoan ? [this.activeLoan] : [];
    return isEligibleForLoan(
      this.member,
      this.transactions,
      loans,
      this.groupSettings,
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
    this.loanRequests.unshift(newReq);
    return { ...newReq };
  }

  // --- Alerts & Announcements ---
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

  // --- Admin Methods ---
  async getGroupMembers(): Promise<Member[]> {
    return [...this.membersList];
  }

  async getPendingMembers(): Promise<Member[]> {
    return [...this.pendingMembersList];
  }

  async approveMember(memberId: string): Promise<void> {
    const idx = this.pendingMembersList.findIndex((m) => m.memberId === memberId);
    if (idx !== -1) {
      const [approved] = this.pendingMembersList.splice(idx, 1);
      approved.status = 'active';
      this.membersList.push(approved);
      if (this.member.memberId === memberId) {
        this.member.status = 'active';
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('sanchay_dev_member_status', 'active');
        }
      }
    }
  }

  async removeMember(memberId: string): Promise<void> {
    this.membersList = this.membersList.filter((m) => m.memberId !== memberId);
    this.pendingMembersList = this.pendingMembersList.filter((m) => m.memberId !== memberId);
    if (this.member.memberId === memberId) {
      this.member.status = 'removed';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('sanchay_dev_member_status', 'removed');
      }
    }
  }

  async getGroupSummary(): Promise<GroupBalanceSummary> {
    return computeBalance(this.transactions);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return [...this.transactions];
  }

  async recordTransactionWithReceipt(params: {
    memberId: string;
    type: TransactionType;
    amountPaise: number;
    mode: PaymentMode;
    aadhaarLast4?: string;
    reason?: string;
  }): Promise<{ transaction: Transaction; receipt: Receipt }> {
    const timestamp = Date.now();
    const dateStr = new Date(timestamp).toISOString().slice(0, 10);
    const txId = `tx-${Date.now()}`;
    const receiptId = `rcpt-${Date.now()}`;
    const targetMember = this.membersList.find((m) => m.memberId === params.memberId);
    const last4 = params.aadhaarLast4 || targetMember?.aadhaarLast4 || '1234';

    const counter = this.receipts.length + 1;
    const receiptNo = formatReceiptNo(MOCK_GROUP_CODE, dateStr, 'DEV1', counter);

    const transaction: Transaction = {
      txId,
      groupId: MOCK_GROUP_ID,
      memberId: params.memberId,
      type: params.type,
      amountPaise: params.amountPaise,
      mode: params.mode,
      recordedBy: this.member.memberId,
      deviceId: 'dev-browser-client',
      clientTimestamp: timestamp,
      receivedAt: timestamp,
      reason: params.reason,
    };

    const receipt: Receipt = {
      receiptId,
      groupId: MOCK_GROUP_ID,
      txId,
      memberId: params.memberId,
      maskedId: maskAadhaar(last4),
      amountPaise: params.amountPaise,
      date: dateStr,
      mode: params.mode,
      status: 'APPROVED',
      receiptNo,
    };

    this.transactions.unshift(transaction);
    this.receipts.unshift(receipt);

    if (this.syncState === 'offline') {
      this.pendingQueueCount += 1;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('sanchay_dev_queue_count', String(this.pendingQueueCount));
      }
    }

    return { transaction, receipt };
  }

  async recordReversalAndCorrection(
    reversesTxId: string,
    reason: string,
    correctedData?: { amountPaise: number; type: TransactionType; mode: PaymentMode }
  ): Promise<{ reversal: Transaction; corrected?: Transaction; receipt?: Receipt }> {
    const original = this.transactions.find((t) => t.txId === reversesTxId);
    if (!original) throw new Error('Original transaction not found');

    const timestamp = Date.now();
    const reversalTxId = `tx-rev-${Date.now()}`;
    const reversal: Transaction = {
      txId: reversalTxId,
      groupId: original.groupId,
      memberId: original.memberId,
      type: 'reversal',
      amountPaise: original.amountPaise,
      mode: original.mode,
      recordedBy: this.member.memberId,
      deviceId: 'dev-browser-client',
      clientTimestamp: timestamp,
      receivedAt: timestamp,
      reversesId: original.txId,
      reason,
    };

    this.transactions.unshift(reversal);

    let corrected: Transaction | undefined;
    let receipt: Receipt | undefined;

    if (correctedData) {
      const dateStr = new Date(timestamp).toISOString().slice(0, 10);
      const corrTxId = `tx-corr-${Date.now()}`;
      const corrRcptId = `rcpt-corr-${Date.now()}`;
      const targetMember = this.membersList.find((m) => m.memberId === original.memberId);
      const last4 = targetMember?.aadhaarLast4 || '1234';

      corrected = {
        txId: corrTxId,
        groupId: original.groupId,
        memberId: original.memberId,
        type: correctedData.type,
        amountPaise: correctedData.amountPaise,
        mode: correctedData.mode,
        recordedBy: this.member.memberId,
        deviceId: 'dev-browser-client',
        clientTimestamp: timestamp + 10,
        receivedAt: timestamp + 10,
      };

      receipt = {
        receiptId: corrRcptId,
        groupId: original.groupId,
        txId: corrTxId,
        memberId: original.memberId,
        maskedId: maskAadhaar(last4),
        amountPaise: correctedData.amountPaise,
        date: dateStr,
        mode: correctedData.mode,
        status: 'APPROVED',
        receiptNo: formatReceiptNo(MOCK_GROUP_CODE, dateStr, 'DEV1', this.receipts.length + 1),
      };

      this.transactions.unshift(corrected);
      this.receipts.unshift(receipt);
    }

    return { reversal, corrected, receipt };
  }

  async getAllLoanRequests(): Promise<LoanRequest[]> {
    return [...this.loanRequests];
  }

  async decideLoan(
    requestId: string,
    decision: 'approved' | 'rejected',
    reason?: string
  ): Promise<void> {
    const req = this.loanRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Loan request not found');

    req.status = decision;
    if (decision === 'rejected') {
      req.rejectionReason = reason;
    } else {
      // Approve loan: create loan doc, schedule, and disbursement transaction
      const loanId = `loan-${Date.now()}`;
      const dateStr = new Date().toISOString().slice(0, 10);
      const newLoan: Loan = {
        loanId,
        groupId: req.groupId,
        memberId: req.memberId,
        principal: req.amountPaise,
        rate: this.groupSettings.interestRatePercent,
        method: this.groupSettings.interestMethod,
        installments: req.installments,
        startDate: dateStr,
        status: 'active',
      };
      this.activeLoan = newLoan;

      await this.recordTransactionWithReceipt({
        memberId: req.memberId,
        type: 'loan_disbursement',
        amountPaise: req.amountPaise,
        mode: 'cash',
        reason: `Loan disbursed #${loanId}`,
      });
    }
  }

  async createAnnouncement(title: string, body: string): Promise<Announcement> {
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      groupId: MOCK_GROUP_ID,
      title,
      body,
      createdBy: this.member.memberId,
      createdAt: Date.now(),
    };
    this.announcements.unshift(newAnn);
    return newAnn;
  }

  async getConflicts(): Promise<Conflict[]> {
    return [...this.conflicts];
  }

  async resolveConflict(conflictId: string, resolution: string): Promise<void> {
    this.conflicts = this.conflicts.map((c) =>
      c.id === conflictId
        ? {
            ...c,
            status: 'resolved',
            resolution,
            resolvedBy: this.member.memberId,
            resolvedAt: Date.now(),
          }
        : c
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
