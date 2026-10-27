import {
  Member,
  Transaction,
  Receipt,
  Loan,
  LoanRequest,
  GroupSettings,
  generateSchedule,
  formatReceiptNo,
  maskAadhaar,
} from '@sanchay/core';
import { Announcement, Notification } from './repository';

export const MOCK_GROUP_ID = 'group-pragati-001';
export const MOCK_GROUP_NAME = 'Pragati Mahila Bachat Gat';
export const MOCK_GROUP_CODE = 'PRAG';
export const MOCK_ADMIN_ID = 'admin-sunita-001';

export const MOCK_GROUP_SETTINGS: GroupSettings = {
  monthlyContributionPaise: 50000, // ₹500
  interestRatePercent: 12, // 12% annual reducing
  interestMethod: 'reducing',
  maxLoanMultiple: 3, // 3x net savings
  maxLoanAmountPaise: 10000000, // ₹1,00,000 (1 Lakh)
  maxInstallments: 36, // up to 36 months
  dueDayOfMonth: 5,
};

export const MOCK_LOGGED_IN_MEMBER: Member = {
  memberId: 'mem-meena-004',
  groupId: MOCK_GROUP_ID,
  authUid: 'auth-mem-meena-004',
  name: 'Meena Kumari',
  phone: '+919800000014',
  dob: '1988-08-20',
  address: 'Ward 3, Village Pragati, Pune Dist',
  aadhaarHash: 'fake-hash-meena-1234',
  aadhaarLast4: '1234',
  status: 'active',
  role: 'member',
  createdAt: '2026-05-01T00:00:00.000Z',
  deviceId: 'device-mobile-meena',
};

// 6 months of contributions (May 2026 - October 2026)
// June has a 3-entry correction chain: original error (tx-err-01), reversal (tx-rev-01), and corrected entry (tx-corr-01)
// August is missed (no transaction recorded)
export const MOCK_TRANSACTIONS: Transaction[] = [
  // 1. May 2026 Contribution
  {
    txId: 'tx-contrib-202605',
    groupId: MOCK_GROUP_ID,
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    type: 'contribution',
    amountPaise: 50000, // ₹500
    mode: 'cash',
    recordedBy: MOCK_ADMIN_ID,
    deviceId: 'dev-agent-01',
    clientTimestamp: new Date('2026-05-05T10:00:00Z').getTime(),
    receivedAt: new Date('2026-05-05T10:00:00Z').getTime(),
  },
  // 2. June 2026: Accidental entry of ₹600 instead of ₹500
  {
    txId: 'tx-err-01',
    groupId: MOCK_GROUP_ID,
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    type: 'contribution',
    amountPaise: 60000, // ₹600 error
    mode: 'cash',
    recordedBy: MOCK_ADMIN_ID,
    deviceId: 'dev-agent-01',
    clientTimestamp: new Date('2026-06-05T10:00:00Z').getTime(),
    receivedAt: new Date('2026-06-05T10:00:00Z').getTime(),
  },
  // 3. June 2026: Reversal of accidental ₹600 entry
  {
    txId: 'tx-rev-01',
    groupId: MOCK_GROUP_ID,
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    type: 'reversal',
    amountPaise: 60000,
    mode: 'cash',
    recordedBy: MOCK_ADMIN_ID,
    deviceId: 'dev-agent-01',
    clientTimestamp: new Date('2026-06-05T11:00:00Z').getTime(),
    receivedAt: new Date('2026-06-05T11:00:00Z').getTime(),
    reversesId: 'tx-err-01',
    reason: 'Admin data-entry overcharge correction',
  },
  // 4. June 2026: Corrected entry of ₹500
  {
    txId: 'tx-corr-01',
    groupId: MOCK_GROUP_ID,
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    type: 'contribution',
    amountPaise: 50000, // ₹500 corrected
    mode: 'cash',
    recordedBy: MOCK_ADMIN_ID,
    deviceId: 'dev-agent-01',
    clientTimestamp: new Date('2026-06-05T11:05:00Z').getTime(),
    receivedAt: new Date('2026-06-05T11:05:00Z').getTime(),
  },
  // 5. July 2026 Contribution
  {
    txId: 'tx-contrib-202607',
    groupId: MOCK_GROUP_ID,
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    type: 'contribution',
    amountPaise: 50000, // ₹500
    mode: 'cash',
    recordedBy: MOCK_ADMIN_ID,
    deviceId: 'dev-agent-01',
    clientTimestamp: new Date('2026-07-05T10:00:00Z').getTime(),
    receivedAt: new Date('2026-07-05T10:00:00Z').getTime(),
  },
  // Note: August 2026 is intentionally MISSED (shortfall)

  // 6. September 2026: Loan Disbursement (₹3,000)
  {
    txId: 'tx-disb-loan-001',
    groupId: MOCK_GROUP_ID,
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    type: 'loan_disbursement',
    amountPaise: 300000, // ₹3,000
    mode: 'bank',
    recordedBy: MOCK_ADMIN_ID,
    deviceId: 'dev-agent-01',
    clientTimestamp: new Date('2026-09-05T12:00:00Z').getTime(),
    receivedAt: new Date('2026-09-05T12:00:00Z').getTime(),
    loanId: 'loan-meena-001',
  },
  // 7. September 2026 Contribution
  {
    txId: 'tx-contrib-202609',
    groupId: MOCK_GROUP_ID,
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    type: 'contribution',
    amountPaise: 50000, // ₹500
    mode: 'cash',
    recordedBy: MOCK_ADMIN_ID,
    deviceId: 'dev-agent-01',
    clientTimestamp: new Date('2026-09-05T10:00:00Z').getTime(),
    receivedAt: new Date('2026-09-05T10:00:00Z').getTime(),
  },
  // 8. October 2026 Contribution
  {
    txId: 'tx-contrib-202610',
    groupId: MOCK_GROUP_ID,
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    type: 'contribution',
    amountPaise: 50000, // ₹500
    mode: 'cash',
    recordedBy: MOCK_ADMIN_ID,
    deviceId: 'dev-agent-01',
    clientTimestamp: new Date('2026-10-05T10:00:00Z').getTime(),
    receivedAt: new Date('2026-10-05T10:00:00Z').getTime(),
  },
  // 9. October 2026: Loan Repayment 1 (₹518)
  {
    txId: 'tx-rep-loan-001-01',
    groupId: MOCK_GROUP_ID,
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    type: 'loan_repayment',
    amountPaise: 51800, // ₹518 installment 1
    mode: 'cash',
    recordedBy: MOCK_ADMIN_ID,
    deviceId: 'dev-agent-01',
    clientTimestamp: new Date('2026-10-05T14:00:00Z').getTime(),
    receivedAt: new Date('2026-10-05T14:00:00Z').getTime(),
    loanId: 'loan-meena-001',
  },
];

// Active Loan for Meena Kumari
export const MOCK_ACTIVE_LOAN: Loan = {
  loanId: 'loan-meena-001',
  groupId: MOCK_GROUP_ID,
  memberId: MOCK_LOGGED_IN_MEMBER.memberId,
  principal: 300000, // ₹3,000 in paise
  rate: 12, // 12% reducing
  method: 'reducing',
  installments: 6,
  startDate: '2026-09-05',
  status: 'active',
};

export const MOCK_LOAN_SCHEDULE = generateSchedule(
  MOCK_ACTIVE_LOAN.principal,
  MOCK_ACTIVE_LOAN.rate,
  MOCK_ACTIVE_LOAN.method,
  MOCK_ACTIVE_LOAN.installments,
  MOCK_ACTIVE_LOAN.startDate
);

// Receipts for approved transactions
export const MOCK_RECEIPTS: Receipt[] = [
  {
    receiptId: 'rcpt-contrib-202605',
    groupId: MOCK_GROUP_ID,
    txId: 'tx-contrib-202605',
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    maskedId: maskAadhaar(MOCK_LOGGED_IN_MEMBER.aadhaarLast4),
    amountPaise: 50000,
    date: '2026-05-05',
    mode: 'cash',
    status: 'APPROVED',
    receiptNo: formatReceiptNo(MOCK_GROUP_CODE, '2026-05-05', 'DEV1', 1),
  },
  {
    receiptId: 'rcpt-corr-01',
    groupId: MOCK_GROUP_ID,
    txId: 'tx-corr-01',
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    maskedId: maskAadhaar(MOCK_LOGGED_IN_MEMBER.aadhaarLast4),
    amountPaise: 50000,
    date: '2026-06-05',
    mode: 'cash',
    status: 'APPROVED',
    receiptNo: formatReceiptNo(MOCK_GROUP_CODE, '2026-06-05', 'DEV1', 2),
  },
  {
    receiptId: 'rcpt-contrib-202607',
    groupId: MOCK_GROUP_ID,
    txId: 'tx-contrib-202607',
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    maskedId: maskAadhaar(MOCK_LOGGED_IN_MEMBER.aadhaarLast4),
    amountPaise: 50000,
    date: '2026-07-05',
    mode: 'cash',
    status: 'APPROVED',
    receiptNo: formatReceiptNo(MOCK_GROUP_CODE, '2026-07-05', 'DEV1', 3),
  },
  {
    receiptId: 'rcpt-disb-loan-001',
    groupId: MOCK_GROUP_ID,
    txId: 'tx-disb-loan-001',
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    maskedId: maskAadhaar(MOCK_LOGGED_IN_MEMBER.aadhaarLast4),
    amountPaise: 300000,
    date: '2026-09-05',
    mode: 'bank',
    status: 'APPROVED',
    receiptNo: formatReceiptNo(MOCK_GROUP_CODE, '2026-09-05', 'DEV1', 4),
  },
  {
    receiptId: 'rcpt-contrib-202609',
    groupId: MOCK_GROUP_ID,
    txId: 'tx-contrib-202609',
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    maskedId: maskAadhaar(MOCK_LOGGED_IN_MEMBER.aadhaarLast4),
    amountPaise: 50000,
    date: '2026-09-05',
    mode: 'cash',
    status: 'APPROVED',
    receiptNo: formatReceiptNo(MOCK_GROUP_CODE, '2026-09-05', 'DEV1', 5),
  },
  {
    receiptId: 'rcpt-contrib-202610',
    groupId: MOCK_GROUP_ID,
    txId: 'tx-contrib-202610',
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    maskedId: maskAadhaar(MOCK_LOGGED_IN_MEMBER.aadhaarLast4),
    amountPaise: 50000,
    date: '2026-10-05',
    mode: 'cash',
    status: 'APPROVED',
    receiptNo: formatReceiptNo(MOCK_GROUP_CODE, '2026-10-05', 'DEV1', 6),
  },
  {
    receiptId: 'rcpt-rep-loan-001-01',
    groupId: MOCK_GROUP_ID,
    txId: 'tx-rep-loan-001-01',
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    maskedId: maskAadhaar(MOCK_LOGGED_IN_MEMBER.aadhaarLast4),
    amountPaise: 51800,
    date: '2026-10-05',
    mode: 'cash',
    status: 'APPROVED',
    receiptNo: formatReceiptNo(MOCK_GROUP_CODE, '2026-10-05', 'DEV1', 7),
  },
];

// One Pending Loan Request for review
export const MOCK_PENDING_LOAN_REQUEST: LoanRequest = {
  id: 'req-meena-002',
  groupId: MOCK_GROUP_ID,
  memberId: MOCK_LOGGED_IN_MEMBER.memberId,
  amountPaise: 150000, // ₹1,500
  installments: 3,
  createdAt: new Date('2026-10-20T14:30:00Z').getTime(),
  status: 'pending',
  eligibilitySnapshot: {
    eligible: false,
    reasons: ['Member has an active loan with outstanding balance.'],
    computedBalancePaise: 250000,
    maxAllowedPaise: 750000,
  },
};

// Announcements
export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-01',
    groupId: MOCK_GROUP_ID,
    title: 'Monthly Gram Panchayat SHG Meeting on 5th Nov',
    body: 'All members are requested to attend the regular monthly savings circle at Sunita Sharma Ji’s courtyard at 3:00 PM. Please bring your passbook.',
    createdBy: MOCK_ADMIN_ID,
    createdAt: new Date('2026-10-25T09:00:00Z').getTime(),
  },
  {
    id: 'ann-02',
    groupId: MOCK_GROUP_ID,
    title: 'Diwali Special Small Loan Window Announced',
    body: 'Emergency festival loans up to ₹3,000 are now available with standard 12% reducing interest for eligible members with zero pending dues.',
    createdBy: MOCK_ADMIN_ID,
    createdAt: new Date('2026-10-15T11:00:00Z').getTime(),
  },
];

// 4 Personal Notifications
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-01',
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    title: 'October Contribution Receipt Issued',
    body: 'Your monthly contribution of ₹500 has been verified. Official receipt #PRAG-202610-DEV1-0006 is ready for download.',
    read: false,
    createdAt: new Date('2026-10-05T10:15:00Z').getTime(),
    refId: 'rcpt-contrib-202610',
    type: 'receipt',
  },
  {
    id: 'notif-02',
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    title: 'Loan Installment #1 Recorded',
    body: 'Your loan repayment of ₹518 for October has been credited against loan #loan-meena-001.',
    read: false,
    createdAt: new Date('2026-10-05T14:05:00Z').getTime(),
    refId: 'rcpt-rep-loan-001-01',
    type: 'receipt',
  },
  {
    id: 'notif-03',
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    title: 'Loan Request #req-meena-002 Received',
    body: 'Your loan application for ₹1,500 has been forwarded to the committee for consideration in the upcoming meeting.',
    read: true,
    createdAt: new Date('2026-10-20T14:35:00Z').getTime(),
    type: 'loan_status',
  },
  {
    id: 'notif-04',
    memberId: MOCK_LOGGED_IN_MEMBER.memberId,
    title: 'August Contribution Pending',
    body: 'Notice: Your August monthly contribution of ₹500 is recorded as unpaid. Please clear the pending due at the next meeting.',
    read: true,
    createdAt: new Date('2026-08-10T10:00:00Z').getTime(),
    type: 'general',
  },
];
