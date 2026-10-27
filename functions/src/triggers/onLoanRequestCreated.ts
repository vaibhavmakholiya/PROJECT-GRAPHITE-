import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { db } from '../config.js';
import { safeLogger } from '../logger.js';
import {
  isEligibleForLoan,
  maxLoanAmount,
  computeMemberBalance,
  GroupSettings,
  Member,
  Transaction,
  Loan,
  LoanRequest
} from '@sanchay/core';

export const onLoanRequestCreated = onDocumentCreated(
  'groups/{groupId}/loanRequests/{requestId}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const req = snap.data() as LoanRequest;
    const { groupId, requestId } = event.params;

    safeLogger.info('Evaluating eligibility for new loan request', { groupId, requestId });

    const groupRef = db.collection('groups').doc(groupId);

    // 1. Fetch group settings
    const settingsSnap = await groupRef.collection('settings').doc('global').get();
    const settings: GroupSettings = settingsSnap.exists
      ? (settingsSnap.data() as GroupSettings)
      : {
          monthlyContributionPaise: 50000,
          interestRatePercent: 12,
          interestMethod: 'reducing',
          maxLoanMultiple: 3,
          maxInstallments: 12,
          dueDayOfMonth: 5
        };

    // 2. Fetch member data
    const memberSnap = await groupRef.collection('members').doc(req.memberId).get();
    if (!memberSnap.exists) {
      safeLogger.warn('Member for loan request does not exist', { groupId, memberId: req.memberId });
      return;
    }
    const member = memberSnap.data() as Member;

    // 3. Fetch transactions & loans for member
    const txSnap = await groupRef.collection('transactions').where('memberId', '==', req.memberId).get();
    const transactions = txSnap.docs.map((d) => d.data() as Transaction);

    const loansSnap = await groupRef.collection('loans').where('memberId', '==', req.memberId).get();
    const loans = loansSnap.docs.map((d) => d.data() as Loan);

    // 4. Evaluate eligibility rules
    const eligibility = isEligibleForLoan(member, transactions, loans, settings, new Date());
    const balance = computeMemberBalance(member.memberId, transactions);
    const maxAllowed = maxLoanAmount(balance, settings);

    if (req.amountPaise > maxAllowed) {
      eligibility.eligible = false;
      eligibility.reasons.push(
        `Requested loan (${req.amountPaise / 100} INR) exceeds max borrowing limit (${maxAllowed / 100} INR based on ${settings.maxLoanMultiple}x savings).`
      );
    }

    if (req.installments > settings.maxInstallments) {
      eligibility.eligible = false;
      eligibility.reasons.push(
        `Requested installments (${req.installments}) exceeds max allowed tenure (${settings.maxInstallments} months).`
      );
    }

    if (!eligibility.eligible) {
      // Auto-reject
      safeLogger.info('Auto-rejecting ineligible loan request', {
        groupId,
        requestId,
        reasonsCount: eligibility.reasons.length
      });

      await snap.ref.update({
        status: 'auto_rejected',
        rejectionReason: eligibility.reasons.join(' | '),
        eligibilitySnapshot: {
          eligible: false,
          reasons: eligibility.reasons,
          computedBalancePaise: balance.netSavingsPaise,
          maxAllowedPaise: maxAllowed
        }
      });

      // Notify member
      const notifRef = groupRef.collection('notifications').doc();
      await notifRef.set({
        id: notifRef.id,
        memberId: req.memberId,
        title: 'Loan Request Not Eligible',
        body: eligibility.reasons.join(' | '),
        read: false,
        createdAt: Date.now(),
        refId: requestId
      });
    } else {
      // Eligible: retain pending status, save snapshot for admin review
      safeLogger.info('Loan request eligible; pending admin review', { groupId, requestId });

      await snap.ref.update({
        eligibilitySnapshot: {
          eligible: true,
          reasons: [],
          computedBalancePaise: balance.netSavingsPaise,
          maxAllowedPaise: maxAllowed
        }
      });
    }
  }
);
