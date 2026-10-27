/**
 * Sanchay Emulator Database Seeding Script
 * Seeds realistic fake data:
 *   - 1 Group ("Pragati Mahila Bachat Gat", code: PRAG24)
 *   - 1 Fast lookup groupCodeIndex record
 *   - 1 Admin User (Sunita Sharma)
 *   - 6 Active Members
 *   - 1 Pending Member (Usha Rani, awaiting admin approval)
 *   - 3 Months of sequential contributions & batch receipts
 *   - 1 Active Loan with amortized schedule and 1 repayment
 *   - 1 Pending Loan Request
 *   - 1 Duplicate Conflict Entry
 *   - Announcements & Member Notifications
 *
 * Enforces Rule 1: Integer paise only.
 * Enforces Rule 4 & 5: Fictitious data only, no raw 12-digit Aadhaar stored or logged.
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
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8085';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

if (getApps().length === 0) {
  initializeApp({ projectId: 'demo-sanchay' });
}

const db = getFirestore();
const auth = getAuth();

const GROUP_ID = 'group-pragati-001';
const GROUP_CODE = 'PRAG24';
const ADMIN_MEMBER_ID = 'admin-sunita-001';
const ADMIN_UID = 'auth-admin-sunita';

const fakeHmac = (input: string) =>
  crypto.createHmac('sha256', 'seed-secret').update(input).digest('hex');

async function seed() {
  console.log('--- Commencing Sanchay Database Seed ---');
  console.log(`Connecting to Firestore at ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`Connecting to Auth at ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);

  // 0. Top-Level groupCodeIndex for fast resolution during registration
  await db.collection('groupCodeIndex').doc(GROUP_CODE).set({
    groupId: GROUP_ID,
    groupCode: GROUP_CODE,
    name: 'Pragati Mahila Bachat Gat',
    createdAt: new Date().toISOString()
  });
  console.log(`✓ groupCodeIndex/${GROUP_CODE} -> ${GROUP_ID} seeded.`);

  const groupRef = db.collection('groups').doc(GROUP_ID);

  // Base Group Document
  await groupRef.set({
    groupId: GROUP_ID,
    name: 'Pragati Mahila Bachat Gat',
    groupCode: GROUP_CODE,
    adminIds: [ADMIN_MEMBER_ID, 'admin-9876543210'],
    createdAt: new Date().toISOString()
  }, { merge: true });

  // 1. Group Settings (written to both config/settings and settings/global)
  const settings: GroupSettings & { rateBpsPerMonth: number } = {
    monthlyContributionPaise: 50000, // ₹500
    interestRatePercent: 12, // 12% annual
    rateBpsPerMonth: 100, // 100 bps / month
    interestMethod: 'reducing',
    maxLoanMultiple: 3,
    maxInstallments: 12,
    dueDayOfMonth: 5
  };

  await groupRef.collection('settings').doc('global').set(settings);
  await groupRef.collection('config').doc('settings').set(settings);
  console.log('✓ Group settings seeded in config/settings and settings/global.');

  // 2. Admin Users (+919800000001 and +919876543210)
  const adminUsers = [
    {
      uid: ADMIN_UID,
      phone: '+919800000001',
      name: 'Sunita Sharma (Admin)',
      memberId: ADMIN_MEMBER_ID,
      dob: '1982-04-12',
      address: 'House 12, Main Gram Panchayat, Pune Dist',
      last4: '1111',
    },
    {
      uid: 'auth-admin-9876543210',
      phone: '+919876543210',
      name: 'SHG Admin Leader',
      memberId: 'admin-9876543210',
      dob: '1985-01-01',
      address: 'Pragati Community Center, Ward 2',
      last4: '0001',
    },
  ];

  for (const adm of adminUsers) {
    let admUid = adm.uid;
    try {
      const existing = await auth.getUserByPhoneNumber(adm.phone);
      admUid = existing.uid;
    } catch {
      try {
        const created = await auth.createUser({
          uid: adm.uid,
          phoneNumber: adm.phone,
          displayName: adm.name,
        });
        admUid = created.uid;
      } catch (err: any) {
        console.warn('Could not create admin user:', err?.message);
      }
    }

    await auth.setCustomUserClaims(admUid, {
      groupId: GROUP_ID,
      role: 'admin',
      roles: ['admin', 'member'],
      memberId: adm.memberId,
      status: 'active',
    });

    await groupRef.collection('members').doc(adm.memberId).set({
      memberId: adm.memberId,
      groupId: GROUP_ID,
      authUid: admUid,
      name: adm.name,
      phone: adm.phone,
      dob: adm.dob,
      address: adm.address,
      aadhaarHash: fakeHmac(`99990000${adm.last4}`),
      aadhaarLast4: adm.last4,
      status: 'active',
      role: 'admin',
      joinedAt: '2026-06-01T00:00:00.000Z',
      createdAt: '2026-06-01T00:00:00.000Z',
      deviceId: 'dev-admin-tab1',
    }, { merge: true });

    // Populate aadhaarIndex
    await groupRef.collection('aadhaarIndex').doc(fakeHmac(`99990000${adm.last4}`)).set({
      memberId: adm.memberId,
      createdAt: Date.now()
    });

    // Audit log
    await groupRef.collection('auditLog').doc(`audit-init-${adm.memberId}`).set({
      actor: 'system-bootstrap',
      action: 'BOOTSTRAP_ADMIN',
      targetId: adm.memberId,
      time: Date.now()
    });

    console.log(`✓ Admin user seeded (${adm.phone}, ${adm.name}).`);
  }

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
    let authUid = `auth-${m.id}`;
    try {
      const existing = await auth.getUserByPhoneNumber(m.phone);
      authUid = existing.uid;
    } catch {
      try {
        const created = await auth.createUser({
          uid: authUid,
          phoneNumber: m.phone,
          displayName: m.name
        });
        authUid = created.uid;
      } catch (err: any) {
        console.warn(`Could not create member user ${m.phone}:`, err?.message);
      }
    }

    await auth.setCustomUserClaims(authUid, {
      groupId: GROUP_ID,
      role: 'member',
      roles: ['member'],
      memberId: m.id,
      status: 'active'
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
      joinedAt: '2026-07-01T00:00:00.000Z',
      createdAt: '2026-07-01T00:00:00.000Z',
      deviceId: 'dev-agent-01'
    }, { merge: true });

    // Populate aadhaarIndex
    await groupRef.collection('aadhaarIndex').doc(fakeHmac(`fake-aadhaar-${m.id}`)).set({
      memberId: m.id,
      createdAt: Date.now()
    });

    // Audit log
    await groupRef.collection('auditLog').doc(`audit-init-${m.id}`).set({
      actor: 'system-bootstrap',
      action: 'BOOTSTRAP_MEMBER',
      targetId: m.id,
      time: Date.now()
    });
  }
  console.log('✓ 6 Active group members seeded (+919800000011 to +919800000016).');

  // 4. One Pending Member (No custom claims yet, awaiting approval)
  const pendingMember = {
    id: 'mem-usha-007',
    name: 'Usha Rani',
    phone: '+919800000017',
    last4: '9901'
  };
  let pendingAuthUid = `auth-${pendingMember.id}`;
  try {
    const existing = await auth.getUserByPhoneNumber(pendingMember.phone);
    pendingAuthUid = existing.uid;
  } catch {
    try {
      const created = await auth.createUser({
        uid: pendingAuthUid,
        phoneNumber: pendingMember.phone,
        displayName: pendingMember.name
      });
      pendingAuthUid = created.uid;
    } catch {}
  }

  await groupRef.collection('members').doc(pendingMember.id).set({
    memberId: pendingMember.id,
    groupId: GROUP_ID,
    authUid: pendingAuthUid,
    name: pendingMember.name,
    phone: pendingMember.phone,
    dob: '1992-11-15',
    address: 'Ward 4, Village Pragati',
    aadhaarHash: fakeHmac(`fake-aadhaar-${pendingMember.id}`),
    aadhaarLast4: pendingMember.last4,
    status: 'pending',
    role: 'member',
    joinedAt: '2026-10-20T00:00:00.000Z',
    createdAt: '2026-10-20T00:00:00.000Z',
    deviceId: 'dev-mobile-client'
  }, { merge: true });

  await groupRef.collection('aadhaarIndex').doc(fakeHmac(`fake-aadhaar-${pendingMember.id}`)).set({
    memberId: pendingMember.id,
    createdAt: Date.now()
  });

  await groupRef.collection('auditLog').doc(`audit-init-${pendingMember.id}`).set({
    actor: 'system-bootstrap',
    action: 'BOOTSTRAP_PENDING_MEMBER',
    targetId: pendingMember.id,
    time: Date.now()
  });

  console.log('✓ 1 Pending group member seeded (+919800000017, Usha Rani).');

  // 5. Three Months of Contributions (Aug, Sep, Oct 2026)
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

  // 6. One Active Loan (Member Meena Kumari)
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

  const totalPayablePaise = schedule.reduce((sum, inst) => sum + inst.amountPaise, 0);

  const loanRef = groupRef.collection('loans').doc(loanId);
  await loanRef.set({
    loanId,
    groupId: GROUP_ID,
    memberId: activeLoanMemberId,
    principal: loanPrincipalPaise,
    rate: settings.interestRatePercent,
    rateBps: 100, // 100 bps / month
    method: settings.interestMethod,
    installments: loanInstallments,
    totalPayablePaise,
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

  // 7. One Pending Loan Request (Member Shanti Devi)
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

  // 8. One Conflict (Possible Duplicate Contribution)
  const conflictId = 'conflict-dup-001';
  const dupTx2 = 'tx-dup-pooja-dev2';

  await groupRef.collection('transactions').doc(dupTx2).set({
    txId: dupTx2,
    groupId: GROUP_ID,
    memberId: 'mem-pooja-006',
    type: 'contribution',
    amountPaise: 50000,
    mode: 'cash',
    recordedBy: ADMIN_MEMBER_ID,
    deviceId: 'dev-field-agent-02',
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

  // 9. Announcements
  await groupRef.collection('announcements').doc('ann-001').set({
    id: 'ann-001',
    groupId: GROUP_ID,
    title: 'Monthly SHG Meeting',
    body: 'Our next monthly meeting is scheduled for 5th November at 10:00 AM at the Panchayat Hall. All members please attend on time.',
    createdBy: ADMIN_MEMBER_ID,
    createdAt: Date.now() - 86400000 * 2
  });

  await groupRef.collection('announcements').doc('ann-002').set({
    id: 'ann-002',
    groupId: GROUP_ID,
    title: 'Emergency Loan Window Open',
    body: 'Members in need of agricultural assistance may submit loan requests via the app prior to Friday.',
    createdBy: ADMIN_MEMBER_ID,
    createdAt: Date.now() - 86400000
  });
  console.log('✓ Group announcements seeded.');

  // 10. Member Notifications
  await groupRef.collection('notifications').doc('notif-meena-001').set({
    id: 'notif-meena-001',
    groupId: GROUP_ID,
    memberId: activeLoanMemberId,
    title: 'Loan Disbursed - ₹3,000',
    body: 'Your loan of ₹3,000 has been approved and disbursed. First installment is due on 5th October.',
    read: false,
    type: 'loan_status',
    createdAt: Date.now() - 86400000 * 15
  });

  await groupRef.collection('notifications').doc('notif-kavita-001').set({
    id: 'notif-kavita-001',
    groupId: GROUP_ID,
    memberId: 'mem-kavita-001',
    title: 'Contribution Recorded',
    body: 'Your October monthly contribution of ₹500 has been verified and added to your passbook.',
    read: true,
    type: 'receipt',
    createdAt: Date.now() - 86400000 * 5
  });
  console.log('✓ Member notifications seeded.');

  console.log('--- Sanchay Database Seed Completed Successfully ---');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
