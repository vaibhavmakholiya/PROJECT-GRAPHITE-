/**
 * Sanchay Emulator Database Seeding Script
 * Seeds realistic fake data:
 *   - 1 Group ("Pragati Mahila Bachat Gat")
 *   - 1 Admin
 *   - 6 Active Members
 *   - 3 Months of sequential contributions & batch receipts
 *   - 1 Active Loan with amortized schedule and 1 repayment
 *   - 1 Pending Loan Request
 *   - 1 Duplicate Conflict Entry
 * Enforces Rule 1: Integer paise only.
 * Enforces Rule 5: Fictitious data only, no real Aadhaar numbers.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as crypto from 'crypto';
import {
  generateSchedule,
  formatReceiptNo,
  maskAadhaar,
  GroupSettings
} from '@sanchay/core';

// Configure emulator connection defaults
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8088';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

if (getApps().length === 0) {
  initializeApp({ projectId: 'demo-sanchay' });
}

const db = getFirestore();
const auth = getAuth();

const GROUP_ID = 'group-pragati-001';
const GROUP_CODE = 'PRAG';
const ADMIN_MEMBER_ID = 'admin-sunita-001';
const ADMIN_UID = 'auth-admin-sunita';

const fakeHmac = (input: string) =>
  crypto.createHmac('sha256', 'seed-secret').update(input).digest('hex');

async function seed() {
  console.log('--- Commencing Sanchay Database Seed ---');
  console.log(`Connecting to Firestore at ${process.env.FIRESTORE_EMULATOR_HOST}`);

  const groupRef = db.collection('groups').doc(GROUP_ID);

  // 1. Group Settings
  const settings: GroupSettings = {
    monthlyContributionPaise: 50000, // ₹500
    interestRatePercent: 12, // 12% annual
    interestMethod: 'reducing',
    maxLoanMultiple: 3,
    maxInstallments: 12,
    dueDayOfMonth: 5
  };

  await groupRef.collection('settings').doc('global').set(settings);
  console.log('✓ Group settings seeded.');

  // 2. Admin User
  try {
    await auth.createUser({
      uid: ADMIN_UID,
      phoneNumber: '+919800000001',
      displayName: 'Sunita Sharma (Admin)'
    });
  } catch {
    // User might already exist in emulator
  }

  await auth.setCustomUserClaims(ADMIN_UID, {
    groupId: GROUP_ID,
    role: 'admin',
    memberId: ADMIN_MEMBER_ID
  });

  await groupRef.collection('members').doc(ADMIN_MEMBER_ID).set({
    memberId: ADMIN_MEMBER_ID,
    groupId: GROUP_ID,
    authUid: ADMIN_UID,
    name: 'Sunita Sharma',
    phone: '+919800000001',
    dob: '1982-04-12',
    address: 'House 12, Main Gram Panchayat, Pune Dist',
    aadhaarHash: fakeHmac('999900001111'),
    aadhaarLast4: '1111',
    status: 'active',
    role: 'admin',
    createdAt: '2026-06-01T00:00:00.000Z',
    deviceId: 'dev-admin-tab1'
  });
  console.log('✓ Admin user seeded.');

  // 3. Six Active Members
  const memberConfigs = [
    { id: 'mem-kavita-001', name: 'Kavita Devi', phone: '+919800000011', last4: '2341' },
    { id: 'mem-anita-002', name: 'Anita Bai', phone: '+919800000012', last4: '5672' },
    { id: 'mem-rekha-003', name: 'Rekha Gupta', phone: '+919800000013', last4: '8903' },
    { id: 'mem-meena-004', name: 'Meena Kumari', phone: '+919800000014', last4: '1234' }, // Gets active loan
    { id: 'mem-shanti-005', name: 'Shanti Devi', phone: '+919800000015', last4: '4565' }, // Gets pending request
    { id: 'mem-pooja-006', name: 'Pooja Verma', phone: '+919800000016', last4: '7896' }  // Involved in duplicate conflict
  ];

  for (const m of memberConfigs) {
    const authUid = `auth-${m.id}`;
    try {
      await auth.createUser({
        uid: authUid,
        phoneNumber: m.phone,
        displayName: m.name
      });
    } catch {
      // Ignored if already exists
    }

    await auth.setCustomUserClaims(authUid, {
      groupId: GROUP_ID,
      role: 'member',
      memberId: m.id
    });

    await groupRef.collection('members').doc(m.id).set({
      memberId: m.id,
      groupId: GROUP_ID,
      authUid,
      name: m.name,
      phone: m.phone,
      dob: '1988-08-20',
      address: 'Ward 3, Village Pragati',
      aadhaarHash: fakeHmac(`fake-aadhaar-${m.id}`),
      aadhaarLast4: m.last4,
      status: 'active',
      role: 'member',
      createdAt: '2026-07-01T00:00:00.000Z',
      deviceId: 'dev-agent-01'
    });
  }
  console.log('✓ 6 Active group members seeded.');

  // 4. Three Months of Contributions (Aug, Sep, Oct 2026)
  const months = [
    { yyyymm: '202608', dateStr: '2026-08-05', timestamp: new Date('2026-08-05T10:00:00Z').getTime() },
    { yyyymm: '202609', dateStr: '2026-09-05', timestamp: new Date('2026-09-05T10:00:00Z').getTime() },
    { yyyymm: '202610', dateStr: '2026-10-05', timestamp: new Date('2026-10-05T10:00:00Z').getTime() }
  ];

  let receiptCounter = 1;

  for (const month of months) {
    const batch = db.batch();
    for (const m of memberConfigs) {
      const txId = `tx-contrib-${m.id}-${month.yyyymm}`;
      const rcptId = `rcpt-contrib-${m.id}-${month.yyyymm}`;

      const receiptNo = formatReceiptNo(GROUP_CODE, month.dateStr, 'DEV1', receiptCounter++);

      // Transaction
      batch.set(groupRef.collection('transactions').doc(txId), {
        txId,
        groupId: GROUP_ID,
        memberId: m.id,
        type: 'contribution',
        amountPaise: settings.monthlyContributionPaise,
        mode: 'cash',
        recordedBy: ADMIN_MEMBER_ID,
        deviceId: 'dev-agent-01',
        clientTimestamp: month.timestamp,
        receivedAt: month.timestamp
      });

      // Batch Receipt
      batch.set(groupRef.collection('receipts').doc(rcptId), {
        receiptId: rcptId,
        groupId: GROUP_ID,
        txId,
        memberId: m.id,
        maskedId: maskAadhaar(m.last4),
        amountPaise: settings.monthlyContributionPaise,
        date: month.dateStr,
        mode: 'cash',
        status: 'APPROVED',
        receiptNo
      });
    }
    await batch.commit();
  }
  console.log('✓ 3 Months of contributions & atomic receipts seeded (18 transactions).');

  // 5. One Active Loan (Member Meena Kumari)
  const activeLoanMemberId = 'mem-meena-004';
  const loanId = 'loan-meena-001';
  const loanPrincipalPaise = 300000; // ₹3,000
  const loanInstallments = 6;
  const loanStartDate = '2026-09-05';

  const schedule = generateSchedule(
    loanPrincipalPaise,
    settings.interestRatePercent,
    settings.interestMethod,
    loanInstallments,
    loanStartDate
  );

  const loanRef = groupRef.collection('loans').doc(loanId);
  await loanRef.set({
    loanId,
    groupId: GROUP_ID,
    memberId: activeLoanMemberId,
    principal: loanPrincipalPaise,
    rate: settings.interestRatePercent,
    method: settings.interestMethod,
    installments: loanInstallments,
    startDate: loanStartDate,
    status: 'active'
  });

  const scheduleBatch = db.batch();
  for (const inst of schedule) {
    scheduleBatch.set(loanRef.collection('schedule').doc(String(inst.installmentNumber)), inst);
  }

  // Disbursement Transaction & Receipt
  const disbTxId = `tx-disb-${loanId}`;
  const disbRcptId = `rcpt-disb-${loanId}`;
  scheduleBatch.set(groupRef.collection('transactions').doc(disbTxId), {
    txId: disbTxId,
    groupId: GROUP_ID,
    memberId: activeLoanMemberId,
    type: 'loan_disbursement',
    amountPaise: loanPrincipalPaise,
    mode: 'bank',
    recordedBy: ADMIN_MEMBER_ID,
    deviceId: 'dev-agent-01',
    clientTimestamp: new Date('2026-09-05T12:00:00Z').getTime(),
    receivedAt: new Date('2026-09-05T12:00:00Z').getTime(),
    loanId
  });

  scheduleBatch.set(groupRef.collection('receipts').doc(disbRcptId), {
    receiptId: disbRcptId,
    groupId: GROUP_ID,
    txId: disbTxId,
    memberId: activeLoanMemberId,
    maskedId: maskAadhaar('1234'),
    amountPaise: loanPrincipalPaise,
    date: loanStartDate,
    mode: 'bank',
    status: 'APPROVED',
    receiptNo: formatReceiptNo(GROUP_CODE, loanStartDate, 'DEV1', receiptCounter++)
  });

  // Repayment 1 (October)
  const firstInst = schedule[0];
  const repTxId = `tx-rep-${loanId}-01`;
  const repRcptId = `rcpt-rep-${loanId}-01`;
  scheduleBatch.set(groupRef.collection('transactions').doc(repTxId), {
    txId: repTxId,
    groupId: GROUP_ID,
    memberId: activeLoanMemberId,
    type: 'loan_repayment',
    amountPaise: firstInst.amountPaise,
    mode: 'cash',
    recordedBy: ADMIN_MEMBER_ID,
    deviceId: 'dev-agent-01',
    clientTimestamp: new Date('2026-10-05T14:00:00Z').getTime(),
    receivedAt: new Date('2026-10-05T14:00:00Z').getTime(),
    loanId
  });

  scheduleBatch.set(groupRef.collection('receipts').doc(repRcptId), {
    receiptId: repRcptId,
    groupId: GROUP_ID,
    txId: repTxId,
    memberId: activeLoanMemberId,
    maskedId: maskAadhaar('1234'),
    amountPaise: firstInst.amountPaise,
    date: '2026-10-05',
    mode: 'cash',
    status: 'APPROVED',
    receiptNo: formatReceiptNo(GROUP_CODE, '2026-10-05', 'DEV1', receiptCounter++)
  });

  await scheduleBatch.commit();
  console.log('✓ Active loan with 6 installments & 1 repayment seeded.');

  // 6. One Pending Loan Request (Member Shanti Devi)
  const pendingReqId = 'req-shanti-001';
  await groupRef.collection('loanRequests').doc(pendingReqId).set({
    id: pendingReqId,
    groupId: GROUP_ID,
    memberId: 'mem-shanti-005',
    amountPaise: 100000, // ₹1,000
    installments: 6,
    createdAt: Date.now(),
    status: 'pending',
    eligibilitySnapshot: {
      eligible: true,
      reasons: [],
      computedBalancePaise: 150000, // 3 contributions = ₹1,500
      maxAllowedPaise: 450000 // 3x = ₹4,500
    }
  });
  console.log('✓ Pending loan request seeded.');

  // 7. One Conflict (Possible Duplicate Contribution)
  const conflictId = 'conflict-dup-001';
  const dupTx1 = 'tx-dup-pooja-dev1';
  const dupTx2 = 'tx-dup-pooja-dev2';

  // Create duplicate tx from dev2
  await groupRef.collection('transactions').doc(dupTx2).set({
    txId: dupTx2,
    groupId: GROUP_ID,
    memberId: 'mem-pooja-006',
    type: 'contribution',
    amountPaise: 50000,
    mode: 'cash',
    recordedBy: ADMIN_MEMBER_ID,
    deviceId: 'dev-field-agent-02', // Different device
    clientTimestamp: new Date('2026-10-05T10:02:00Z').getTime(),
    receivedAt: Date.now()
  });

  await groupRef.collection('conflicts').doc(conflictId).set({
    id: conflictId,
    groupId: GROUP_ID,
    type: 'possible_duplicate',
    refIds: [`tx-contrib-mem-pooja-006-202610`, dupTx2],
    detectedAt: Date.now(),
    status: 'open'
  });
  console.log('✓ Conflict record seeded (possible duplicate contribution across devices).');

  console.log('--- Sanchay Database Seed Completed Successfully ---');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
