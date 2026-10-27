/**
 * Sanchay Domain Types & Core Interfaces
 * Rule 1: Money is an integer in paise. Never use floats or decimals.
 * Rule 2: Pure TypeScript shared logic, zero Firebase imports.
 */
export type AmountPaise = number;
export type UserRole = 'admin' | 'member';
export type MemberStatus = 'pending' | 'active' | 'removed';
export type TransactionType = 'contribution' | 'withdrawal' | 'loan_disbursement' | 'loan_repayment' | 'reversal';
export type PaymentMode = 'cash' | 'upi' | 'bank';
export type InterestMethod = 'flat' | 'reducing';
export type LoanRequestStatus = 'pending' | 'auto_rejected' | 'approved' | 'rejected';
export type LoanStatus = 'active' | 'closed' | 'defaulted';
export type ConflictType = 'possible_duplicate' | 'negative_balance' | 'duplicate_member';
export type ConflictStatus = 'open' | 'resolved';
export interface GroupSettings {
    monthlyContributionPaise: AmountPaise;
    interestRatePercent: number;
    interestMethod: InterestMethod;
    maxLoanMultiple: number;
    maxInstallments: number;
    dueDayOfMonth: number;
    maxLoanAmountPaise?: AmountPaise;
}
export interface Member {
    memberId: string;
    groupId: string;
    authUid?: string;
    name: string;
    phone: string;
    dob: string;
    address: string;
    aadhaarHash: string;
    aadhaarLast4: string;
    status: MemberStatus;
    role: UserRole;
    createdAt: string;
    deviceId: string;
}
export interface Transaction {
    txId: string;
    groupId: string;
    memberId: string;
    type: TransactionType;
    amountPaise: AmountPaise;
    mode: PaymentMode;
    recordedBy: string;
    deviceId: string;
    clientTimestamp: number;
    receivedAt?: number;
    reversesId?: string;
    reason?: string;
    loanId?: string;
}
export interface Receipt {
    receiptId: string;
    groupId: string;
    txId: string;
    memberId: string;
    maskedId: string;
    amountPaise: AmountPaise;
    date: string;
    mode: PaymentMode;
    status: 'APPROVED';
    receiptNo: string;
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
    dueDate: string;
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
    startDate: string;
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
//# sourceMappingURL=types.d.ts.map