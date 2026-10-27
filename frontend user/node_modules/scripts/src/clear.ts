/**
 * Sanchay Database & Auth Purge Script
 * Removes all fake/seeded dummy members, transactions, receipts, loans,
 * conflicts, and Auth users from the database.
 *
 * Leaves only the empty group container and group settings ready for REAL users.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { GroupSettings } from '@sanchay/core';

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8085';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

if (getApps().length === 0) {
  initializeApp({ projectId: 'demo-sanchay' });
}

const db = getFirestore();
const auth = getAuth();

const GROUP_ID = 'group-pragati-001';
const GROUP_CODE = 'PRAG24';

async function clearAllFakeData() {
  console.log('--- Purging All Fake Data & Auth Users ---');
  console.log(`Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`Auth Emulator: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);

  // 1. Delete all fake users in Firebase Auth
  try {
    const listResult = await auth.listUsers(1000);
    const uids = listResult.users.map((u) => u.uid);
    if (uids.length > 0) {
      await auth.deleteUsers(uids);
      console.log(`✓ Deleted ${uids.length} fake users from Firebase Auth.`);
    } else {
      console.log('✓ Firebase Auth is already clean (0 users).');
    }
  } catch (err: any) {
    console.warn('Notice: Could not list/delete Auth users:', err?.message || err);
  }

  // 2. Delete all collections in the group
  const groupRef = db.collection('groups').doc(GROUP_ID);
  const subcollections = [
    'members',
    'transactions',
    'receipts',
    'loans',
    'loanRequests',
    'conflicts',
    'announcements',
    'notifications',
  ];

  for (const collName of subcollections) {
    const snap = await groupRef.collection(collName).get();
    if (!snap.empty) {
      const batch = db.batch();
      for (const d of snap.docs) {
        batch.delete(d.ref);
      }
      await batch.commit();
      console.log(`✓ Cleared ${snap.size} fake records from groups/${GROUP_ID}/${collName}`);
    } else {
      console.log(`✓ groups/${GROUP_ID}/${collName} is already empty.`);
    }
  }

  // 3. Reset Group Code Index & Base Settings for Real Users
  await db.collection('groupCodeIndex').doc(GROUP_CODE).set({
    groupId: GROUP_ID,
    groupCode: GROUP_CODE,
    name: 'Pragati Mahila Bachat Gat',
    createdAt: new Date().toISOString(),
  });

  await groupRef.set(
    {
      groupId: GROUP_ID,
      name: 'Pragati Mahila Bachat Gat',
      groupCode: GROUP_CODE,
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );

  const defaultSettings: GroupSettings = {
    monthlyContributionPaise: 50000, // ₹500
    interestRatePercent: 12, // 12% annual reducing
    interestMethod: 'reducing',
    maxLoanMultiple: 3,
    maxInstallments: 12,
    dueDayOfMonth: 5,
  };

  await groupRef.collection('settings').doc('global').set(defaultSettings);

  console.log('✓ Initialized clean group container (PRAG24) with zero members and zero transactions.');
  console.log('--- Sanchay Database is now 100% clean and ready for real users! ---');
}

clearAllFakeData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Purge error:', err);
    process.exit(1);
  });
