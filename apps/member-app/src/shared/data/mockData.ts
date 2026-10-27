import {
  Member,
  Transaction,
  Receipt,
  Loan,
  LoanRequest,
  GroupSettings,
  Conflict,
} from '@sanchay/core';
import { Announcement, Notification } from './repository';

export const MOCK_GROUP_ID = 'group-pragati-001';
export const MOCK_GROUP_NAME = 'Pragati Mahila Bachat Gat';
export const MOCK_GROUP_CODE = 'PRAG24';
export const MOCK_ADMIN_ID = 'admin-leader-001';

export const MOCK_GROUP_SETTINGS: GroupSettings = {
  monthlyContributionPaise: 50000, // ₹500
  interestRatePercent: 12, // 12% annual reducing
  interestMethod: 'reducing',
  maxLoanMultiple: 3, // 3x net savings
  maxLoanAmountPaise: 10000000, // ₹1,00,000 (1 Lakh)
  maxInstallments: 36, // up to 36 months
  dueDayOfMonth: 5,
};

// Initial clean state with zero fake data - populated strictly by real user activity
export const MOCK_GROUP_MEMBERS: Member[] = [];
export const MOCK_TRANSACTIONS: Transaction[] = [];
export const MOCK_RECEIPTS: Receipt[] = [];
export const MOCK_LOANS: Loan[] = [];
export const MOCK_LOAN_REQUESTS: LoanRequest[] = [];
export const MOCK_CONFLICTS: Conflict[] = [];
export const MOCK_ANNOUNCEMENTS: Announcement[] = [];
export const MOCK_NOTIFICATIONS: Notification[] = [];
