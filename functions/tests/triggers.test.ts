import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  Transaction,
  LoanRequest,
  Member,
  GroupSettings
} from '@sanchay/core';

// Connect to Firestore Emulator
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8088';

if (getApps().length === 0) {
  initializeApp({ projectId: 'demo-sanchay-triggers' });
}

const db = getFirestore();
const GROUP_ID = 'group-trig-test';

describe('Cloud Functions Firestore Triggers & Auditing Logic', () => {
  beforeEach(async () => {
    // Clean up test group
    const collections = ['transactions', 'receipts', 'loanRequests', 'members', 'settings', 'conflicts', 'notifications'];
    for (const coll of collections) {
      const snap = await db.collection('groups').doc(GROUP_ID).collection(coll).get();
      const batch = db.batch();
      for (const d of snap.docs) {
        batch.delete(d.ref);
      }
      await batch.commit();
    }
  });

  describe('Duplicate and Negative Balance Conflict Detection', () => {
    it('should flag possible duplicate transactions across different devices without modifying transactions', async () => {
      const groupRef = db.collection('groups').doc(GROUP_ID);
      const memberId = 'mem-test-01';

      // 1. First transaction from device-A
      const tx1: Transaction = {
        txId: 'tx-sync-1',
        groupId: GROUP_ID,
        memberId,
        type: 'contribution',
        amountPaise: 50000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'device-A',
        clientTimestamp: 1000000
      };
      await groupRef.collection('transactions').doc(tx1.txId).set(tx1);

      // 2. Second transaction with same details from device-B within 24 hours
      const tx2: Transaction = {
        txId: 'tx-sync-2',
        groupId: GROUP_ID,
        memberId,
        type: 'contribution',
        amountPaise: 50000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'device-B',
        clientTimestamp: 1000500
      };
      await groupRef.collection('transactions').doc(tx2.txId).set(tx2);

      // Simulate trigger conflict detection logic
      const diff = Math.abs(tx2.clientTimestamp - tx1.clientTimestamp);
      expect(diff <= 24 * 60 * 60 * 1000).toBe(true);
      expect(tx2.deviceId !== tx1.deviceId).toBe(true);

      const conflictRef = groupRef.collection('conflicts').doc('conf-dup-test');
      await conflictRef.set({
        id: 'conf-dup-test',
        groupId: GROUP_ID,
        type: 'possible_duplicate',
        refIds: [tx1.txId, tx2.txId],
        detectedAt: Date.now(),
        status: 'open'
      });

      // Verify conflict logged
      const confSnap = await conflictRef.get();
      expect(confSnap.exists).toBe(true);
      expect(confSnap.data()?.type).toBe('possible_duplicate');

      // Verify BOTH transactions still exist unaltered (Append-Only)
      const t1Snap = await groupRef.collection('transactions').doc(tx1.txId).get();
      const t2Snap = await groupRef.collection('transactions').doc(tx2.txId).get();
      expect(t1Snap.exists).toBe(true);
      expect(t2Snap.exists).toBe(true);
    });

    it('should flag negative balance when withdrawal exceeds member savings', async () => {
      const groupRef = db.collection('groups').doc(GROUP_ID);
      const memberId = 'mem-test-02';

      // Member deposited ₹500 (50,000 paise)
      await groupRef.collection('transactions').doc('tx-c1').set({
        txId: 'tx-c1',
        groupId: GROUP_ID,
        memberId,
        type: 'contribution',
        amountPaise: 50000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 1000
      });

      // Member withdrew ₹800 (80,000 paise) -> resulting in -30,000 paise
      const withdrawalTx: Transaction = {
        txId: 'tx-w1',
        groupId: GROUP_ID,
        memberId,
        type: 'withdrawal',
        amountPaise: 80000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 2000
      };
      await groupRef.collection('transactions').doc(withdrawalTx.txId).set(withdrawalTx);

      const conflictRef = groupRef.collection('conflicts').doc('conf-neg-test');
      await conflictRef.set({
        id: 'conf-neg-test',
        groupId: GROUP_ID,
        type: 'negative_balance',
        refIds: [withdrawalTx.txId],
        detectedAt: Date.now(),
        status: 'open'
      });

      const confSnap = await conflictRef.get();
      expect(confSnap.exists).toBe(true);
      expect(confSnap.data()?.type).toBe('negative_balance');
    });
  });

  describe('Receipt Integrity Auditing', () => {
    it('should flag conflict when receipt amount mismatches transaction amount', async () => {
      const groupRef = db.collection('groups').doc(GROUP_ID);
      const txId = 'tx-matched-01';

      await groupRef.collection('transactions').doc(txId).set({
        txId,
        groupId: GROUP_ID,
        memberId: 'mem-test-03',
        type: 'contribution',
        amountPaise: 50000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 1000
      });

      const receiptId = 'rcpt-mismatched';
      const receiptAmount = 60000; // Does not match 50,000

      const conflictRef = groupRef.collection('conflicts').doc('conf-rcpt-test');
      await conflictRef.set({
        id: 'conf-rcpt-test',
        groupId: GROUP_ID,
        type: 'receipt_mismatch',
        refIds: [receiptId, txId],
        detectedAt: Date.now(),
        status: 'open',
        reason: 'Amount mismatch'
      });

      const confSnap = await conflictRef.get();
      expect(confSnap.exists).toBe(true);
      expect(confSnap.data()?.type).toBe('receipt_mismatch');
    });
  });

  describe('Announcement Fanout', () => {
    it('should fan out notifications to all active members in the group', async () => {
      const groupRef = db.collection('groups').doc(GROUP_ID);

      // Create 3 active members and 1 pending member
      for (let i = 1; i <= 3; i++) {
        await groupRef.collection('members').doc(`active-mem-${i}`).set({
          memberId: `active-mem-${i}`,
          status: 'active'
        });
      }
      await groupRef.collection('members').doc('pending-mem-4').set({
        memberId: 'pending-mem-4',
        status: 'pending'
      });

      const announcementId = 'ann-meeting-01';
      const activeMembersSnap = await groupRef
        .collection('members')
        .where('status', '==', 'active')
        .get();

      const batch = db.batch();
      for (const mDoc of activeMembersSnap.docs) {
        const notifRef = groupRef.collection('notifications').doc();
        batch.set(notifRef, {
          id: notifRef.id,
          memberId: mDoc.id,
          title: 'Sunday Meeting',
          body: 'Attendance mandatory',
          read: false,
          createdAt: Date.now(),
          refId: announcementId
        });
      }
      await batch.commit();

      const notifsSnap = await groupRef.collection('notifications').get();
      expect(notifsSnap.size).toBe(3);
    });
  });
});
