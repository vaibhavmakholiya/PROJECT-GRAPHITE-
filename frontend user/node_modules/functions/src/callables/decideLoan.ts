import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config.js';
import { safeLogger } from '../logger.js';
import {
  generateSchedule,
  maskAadhaar,
  formatReceiptNo,
  GroupSettings
} from '@sanchay/core';

interface DecideLoanData {
  groupId: string;
  requestId: string;
  approve: boolean;
  reason?: string;
}

export const decideLoan = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { groupId, requestId, approve, reason } = request.data as DecideLoanData;
  if (!groupId || !requestId || typeof approve !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }

  const token = request.auth.token;
  if (token.groupId !== groupId || token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only group admins can decide loans.');
  }

  const groupRef = db.collection('groups').doc(groupId);
  const loanReqRef = groupRef.collection('loanRequests').doc(requestId);
  const reqSnap = await loanReqRef.get();

  if (!reqSnap.exists) {
    throw new HttpsError('not-found', 'Loan request not found.');
  }

  const loanReq = reqSnap.data()!;
  if (loanReq.status !== 'pending') {
    throw new HttpsError('failed-precondition', `Loan request is already ${loanReq.status}.`);
  }

  const memberId = loanReq.memberId;
  const memberSnap = await groupRef.collection('members').doc(memberId).get();
  if (!memberSnap.exists) {
    throw new HttpsError('not-found', 'Member associated with request does not exist.');
  }
  const memberData = memberSnap.data()!;

  if (!approve) {
    // Rejection path
    await loanReqRef.update({
      status: 'rejected',
      rejectionReason: reason || 'Loan request rejected by administrator.'
    });

    const notifRef = groupRef.collection('notifications').doc();
    await notifRef.set({
      id: notifRef.id,
      memberId,
      title: 'Loan Request Update',
      body: `Your loan request of ${loanReq.amountPaise / 100} INR was declined: ${reason || 'Administrative decision.'}`,
      read: false,
      createdAt: Date.now(),
      refId: requestId
    });

    safeLogger.info('Loan request rejected', { groupId, requestId, memberId });
    return { success: true, status: 'rejected' };
  }

  // Approval path: atomic creation of loan, schedule, disbursement transaction, and receipt
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

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const schedule = generateSchedule(
    loanReq.amountPaise,
    settings.interestRatePercent,
    settings.interestMethod,
    loanReq.installments,
    today
  );

  const loanRef = groupRef.collection('loans').doc();
  const loanId = loanRef.id;

  const txRef = groupRef.collection('transactions').doc();
  const txId = txRef.id;

  const receiptRef = groupRef.collection('receipts').doc();
  const receiptId = receiptRef.id;

  const notifRef = groupRef.collection('notifications').doc();
  const notifId = notifRef.id;

  const receiptNo = formatReceiptNo(
    groupId,
    today,
    'SRV1',
    Math.floor(Math.random() * 9000) + 1000
  );

  const adminMemberId = (token.memberId as string) || 'admin';

  // Atomic batch/transaction execution
  const batch = db.batch();

  // 1. Update loan request
  batch.update(loanReqRef, {
    status: 'approved',
    loanId,
    approvedAt: Date.now()
  });

  // 2. Create Loan document
  batch.set(loanRef, {
    loanId,
    groupId,
    memberId,
    principal: loanReq.amountPaise,
    rate: settings.interestRatePercent,
    method: settings.interestMethod,
    installments: loanReq.installments,
    startDate: todayStr,
    status: 'active'
  });

  // 3. Create schedule subcollection entries
  for (const inst of schedule) {
    const instRef = loanRef.collection('schedule').doc(String(inst.installmentNumber));
    batch.set(instRef, inst);
  }

  // 4. Create disbursement transaction
  batch.set(txRef, {
    txId,
    groupId,
    memberId,
    type: 'loan_disbursement',
    amountPaise: loanReq.amountPaise,
    mode: 'bank',
    recordedBy: adminMemberId,
    deviceId: 'server',
    clientTimestamp: Date.now(),
    receivedAt: Date.now(),
    loanId
  });

  // 5. Create receipt
  batch.set(receiptRef, {
    receiptId,
    groupId,
    txId,
    memberId,
    maskedId: maskAadhaar(memberData.aadhaarLast4 || '0000'),
    amountPaise: loanReq.amountPaise,
    date: todayStr,
    mode: 'bank',
    status: 'APPROVED',
    receiptNo
  });

  // 6. Create member notification
  batch.set(notifRef, {
    id: notifId,
    memberId,
    title: 'Loan Disbursed',
    body: `Your loan of ${loanReq.amountPaise / 100} INR has been approved and disbursed.`,
    read: false,
    createdAt: Date.now(),
    refId: loanId
  });

  await batch.commit();

  safeLogger.info('Loan approved, scheduled, and disbursed atomically', {
    groupId,
    requestId,
    loanId,
    txId,
    receiptId
  });

  return {
    success: true,
    status: 'approved',
    loanId,
    txId,
    receiptId
  };
});
