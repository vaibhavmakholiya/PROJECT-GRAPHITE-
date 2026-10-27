/**
 * Sanchay Domain Types & Core Interfaces
 * Rule 1: Money is an integer in paise. Never use floats or decimals.
 * Rule 2: Pure TypeScript shared logic, zero Firebase imports.
 */

export type AmountPaise = number;

export type UserRole = 'admin' | 'member';

export type MemberStatus = 'pending' | 'active' | 'removed';

export type TransactionType =
  | 'contribution'
  | 'withdrawal'
  | 'loan_disbursement'
  | 'loan_repayment'
  | 'reversal';

export type PaymentMode = 'cash' | 'upi' | 'bank';

export type InterestMethod = 'flat' | 'reducing';

export type LoanRequestStatus = 'pending' | 'auto_rejected' | 'approved' | 'rejected';

export type LoanStatus = 'active' | 'closed' | 'defaulted';

export type ConflictType =
  | 'possible_duplicate'
  | 'negative_balance'
  | 'duplicate_member';

export type ConflictStatus = 'open' | 'resolved';

export interface GroupSettings {
  monthlyContributionPaise: AmountPaise;
  interestRatePercent: number; // e.g., 12 for 12% annual
  interestMethod: InterestMethod;
  maxLoanMultiple: number; // e.g., 3 means 3x member balance
  maxInstallments: number; // e.g., 12 months
  dueDayOfMonth: number; // e.g., 5th of each month
  maxLoanAmountPaise?: AmountPaise; // e.g. 10000000 (₹1,00,000 / 1 Lakh)
}

export interface Member {
  memberId: string;
  groupId: string;
  authUid?: string;
  name: string;
  phone: string; // E.164 (+919876543210)
  dob: string; // YYYY-MM-DD
  address: string;
  aadhaarHash: string; // HMAC-SHA256
  aadhaarLast4: string; // 4 digits
  status: MemberStatus;
  role: UserRole;
  createdAt: string; // ISO 8601 string or epoch ms string
  deviceId: string;
}

export interface Transaction {
  txId: string;
  groupId: string;
  memberId: string;
  type: TransactionType;
  amountPaise: AmountPaise;
  mode: PaymentMode;
  recordedBy: string; // memberId of recorder (admin)
  deviceId: string;
  clientTimestamp: number; // epoch ms
  receivedAt?: number; // server epoch ms
  reversesId?: string; // required if type === 'reversal'
  reason?: string; // required if type === 'reversal'
  loanId?: string; // required if type === 'loan_disbursement' or 'loan_repayment'
}

export interface Receipt {
  receiptId: string;
  groupId: string;
  txId: string;
  memberId: string;
  maskedId: string; // e.g., "XXXX-XXXX-1234"
  amountPaise: AmountPaise;
  date: string; // YYYY-MM-DD
  mode: PaymentMode;
  status: 'APPROVED';
  receiptNo: string; // {groupCode}-{yyyymm}-{deviceShort}-{perDeviceCounter}
}

export interface LoanRequest {
  id: string;
  groupId: string;
  memberId: string;
  amountPaise: AmountPaise;
  installments: number;
  createdAt: number;
  eligibilitySnapshot?: {
    eligible: boolean;
    reasons: string[];
    computedBalancePaise: AmountPaise;
    maxAllowedPaise: AmountPaise;
  };
  status: LoanRequestStatus;
  rejectionReason?: string;
}

export interface LoanScheduleInstallment {
  installmentNumber: number;
  dueDate: string; // YYYY-MM-DD
  amountPaise: AmountPaise;
  principalPaise: AmountPaise;
  interestPaise: AmountPaise;
}

export interface Loan {
  loanId: string;
  groupId: string;
  memberId: string;
  principal: AmountPaise;
  rate: number;
  method: InterestMethod;
  installments: number;
  startDate: string; // YYYY-MM-DD
  status: LoanStatus;
}

export interface Conflict {
  id: string;
  groupId: string;
  type: ConflictType;
  refIds: string[];
  detectedAt: number;
  status: ConflictStatus;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: number;
}

export interface MemberBalance {
  memberId: string;
  contributionPaise: AmountPaise;
  withdrawalPaise: AmountPaise;
  netSavingsPaise: AmountPaise;
  repaymentPaise: AmountPaise;
  disbursementPaise: AmountPaise;
}

export interface GroupBalanceSummary {
  totalSavingsPaise: AmountPaise;
  totalContributionsPaise: AmountPaise;
  totalWithdrawalsPaise: AmountPaise;
  totalLoansDisbursedPaise: AmountPaise;
  totalRepaymentsPaise: AmountPaise;
  memberBalances: Record<string, MemberBalance>;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}
